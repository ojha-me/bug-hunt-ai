from django.db import models
from django.conf import settings
import uuid
from django.contrib.postgres.fields import ArrayField
from ai_core.models import Conversation, ConversationTypeChoices


class SDCourse(models.Model):
    """
    A course in the system design curriculum (e.g. "Fundamentals", "Data & Storage").
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField()
    order = models.PositiveIntegerField(default=0, help_text="Sequence in the overall curriculum")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'name']

    def __str__(self):
        return self.name


class SDLesson(models.Model):
    """
    A single lesson within a system design course.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(SDCourse, related_name='lessons', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    description = models.TextField(help_text="What this lesson covers")
    order = models.PositiveIntegerField(help_text="Sequence within the course")
    learning_objectives = ArrayField(
        models.CharField(max_length=255),
        default=list,
        help_text="List of concepts the learner should master in this lesson"
    )
    estimated_duration = models.DurationField(help_text="Expected time to complete", null=True, blank=True)
    reference_diagram = models.JSONField(
        blank=True, null=True,
        help_text="Optional {nodes, edges} reference architecture to load into the whiteboard"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['course', 'order']
        unique_together = ['course', 'order']

    def __str__(self):
        return f"{self.course.name} - {self.name}"


class SDProgressStatus(models.TextChoices):
    NOT_STARTED = 'not_started', 'Not Started'
    LEARNING = 'learning', 'Learning'
    COMPLETED = 'completed', 'Completed'


class UserSDCourse(models.Model):
    """
    A user's journey through a system design course.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sd_courses')
    course = models.ForeignKey(SDCourse, on_delete=models.CASCADE, related_name='user_courses')
    conversation = models.OneToOneField(
        Conversation,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="Optional course-level conversation"
    )
    current_lesson = models.ForeignKey(
        SDLesson,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        help_text="The lesson the user is currently working on"
    )
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ['user', 'course']
        ordering = ['course__order']

    def __str__(self):
        return f"{self.user.email} - {self.course.name}"

    @property
    def progress_percentage(self):
        total = self.course.lessons.filter(is_active=True).count()
        if total == 0:
            return 0
        completed = self.progress.filter(status=SDProgressStatus.COMPLETED).count()
        return (completed / total) * 100

    @property
    def is_completed(self):
        return self.progress_percentage == 100


class SDLessonProgress(models.Model):
    """
    Tracks a user's progress through an individual lesson.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_course = models.ForeignKey(
        UserSDCourse,
        related_name='progress',
        on_delete=models.CASCADE
    )
    lesson = models.ForeignKey(SDLesson, on_delete=models.CASCADE)
    conversation = models.OneToOneField(
        Conversation,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="Conversation for this lesson"
    )
    ai_confidence = models.FloatField(default=0.0, help_text="AI confidence the user has mastered this lesson (0-1)")
    covered_points = ArrayField(models.CharField(max_length=255), default=list)
    remaining_points = ArrayField(models.CharField(max_length=255), default=list)
    status = models.CharField(
        max_length=20,
        choices=SDProgressStatus.choices,
        default=SDProgressStatus.NOT_STARTED
    )
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ['user_course', 'lesson']
        ordering = ['lesson__order']

    def __str__(self):
        return f"{self.user_course.user.email} - {self.lesson.name} ({self.get_status_display()})"

    @property
    def is_ready_to_move_on(self):
        return len(self.remaining_points) == 0 and self.ai_confidence >= 0.8

    @property
    def progress_percentage(self):
        total = len(self.covered_points) + len(self.remaining_points)
        if total == 0:
            return 0
        return (len(self.covered_points) / total) * 100


class SDCaseStudy(models.Model):
    """
    A curated real-world system design problem with a canonical reference
    architecture diagram (e.g. "Design Twitter", "Design URL Shortener").
    """
    class Difficulty(models.TextChoices):
        EASY = "easy", "Easy"
        MEDIUM = "medium", "Medium"
        HARD = "hard", "Hard"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=220, unique=True)
    difficulty = models.CharField(max_length=10, choices=Difficulty.choices, default=Difficulty.MEDIUM)
    topics = ArrayField(models.CharField(max_length=60), default=list, blank=True)
    overview = models.TextField(help_text="Markdown description of the problem")
    functional_requirements = models.JSONField(default=list, help_text="List of functional requirements")
    non_functional_requirements = models.JSONField(default=list, help_text="List of NFRs")
    capacity = models.JSONField(default=dict, blank=True, help_text="Key-value estimates, e.g. {\"DAU\": \"100M\", ...}")
    key_components = models.JSONField(default=list, help_text="List of {name, responsibility}")
    tradeoffs = models.JSONField(default=list, help_text="List of key design tradeoffs")
    reference_diagram = models.JSONField(
        blank=True, null=True,
        help_text="Canonical {nodes, edges} architecture in React Flow format"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["difficulty", "title"]

    def __str__(self):
        return self.title


class SDPracticeStatus(models.TextChoices):
    IN_PROGRESS = 'in_progress', 'In Progress'
    COMPLETED = 'completed', 'Completed'


class SDPracticeSession(models.Model):
    """
    A guided 5-phase system design practice drill. Tracks the user's position
    in the thinking protocol (Clarify -> Estimate -> Components -> HLD -> Deep
    Dives), which phases are complete, and the weak areas diagnosed along the way.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sd_practice_sessions')
    case_study = models.ForeignKey(
        SDCaseStudy,
        on_delete=models.CASCADE,
        related_name='practice_sessions',
        help_text="The design prompt being practiced against",
    )
    conversation = models.OneToOneField(
        Conversation,
        on_delete=models.CASCADE,
        related_name='sd_practice_session',
        help_text="The chat room for this practice run",
    )
    current_phase = models.PositiveSmallIntegerField(default=1, help_text="Active phase 1..5 of the thinking protocol")
    phase_states = models.JSONField(default=dict, blank=True, help_text="Per-phase state: {phase: {completed, score, notes}}")
    weak_areas = models.JSONField(default=list, blank=True, help_text="Diagnosed weak areas from the drill")
    status = models.CharField(
        max_length=20,
        choices=SDPracticeStatus.choices,
        default=SDPracticeStatus.IN_PROGRESS,
    )
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-started_at"]

    def __str__(self):
        return f"{self.user.email} - {self.case_study.title} (phase {self.current_phase})"

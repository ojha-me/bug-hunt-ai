from django.db import models
from django.conf import settings
import uuid
from users.models import CustomUser
from django.contrib.postgres.fields import ArrayField


class DifficultyLevelChoices(models.TextChoices):
    BEGINNER = 'beginner', 'Beginner'
    INTERMEDIATE = 'intermediate', 'Intermediate'
    ADVANCED = 'advanced', 'Advanced'


class LearningTopic(models.Model):
    """
    Represents a main learning topic (e.g. "Python OOP")
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, help_text="e.g., 'JavaScript Fundamentals'")
    description = models.TextField(help_text="Detailed description of what this topic covers")
    difficulty_level = models.CharField(
        max_length=20,
        choices=DifficultyLevelChoices.choices,
        default=DifficultyLevelChoices.BEGINNER
    )
    estimated_duration = models.DurationField(help_text="Expected completion time")
    prerequisites = models.ManyToManyField(
        'self',
        blank=True,
        symmetrical=False,
        help_text="Topics that should be completed before this one"
    )
    is_active = models.BooleanField(default=True, help_text="Whether this topic is available for learning")
    created_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="created_learning_topics", help_text="User who created this topic")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['difficulty_level', 'name']

    def __str__(self):
        return f"{self.name} ({self.get_difficulty_level_display()}) - Created by {self.created_by.email}"


class LearningSubtopic(models.Model):
    """
    Represents a subtopic within a learning topic
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    topic = models.ForeignKey(LearningTopic, related_name='subtopics', on_delete=models.CASCADE)
    name = models.CharField(max_length=255, help_text="e.g., 'Variables and Data Types'")
    description = models.TextField(help_text="What this subtopic covers")
    order = models.PositiveIntegerField(help_text="Sequence in the learning path")
    learning_objectives = models.JSONField(
        default=list,
        help_text="List of learning goals for this subtopic"
    )
    estimated_duration = models.DurationField(help_text="Expected time to complete this subtopic")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['topic', 'order']
        unique_together = ['topic', 'order']

    def __str__(self):
        return f"{self.topic.name} - {self.name}"


class UserLearningPath(models.Model):
    """
    Represents a user's journey through a specific learning topic
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    topic = models.ForeignKey(LearningTopic, on_delete=models.CASCADE)
    conversation = models.OneToOneField(
        'ai_core.Conversation',
        on_delete=models.CASCADE,
        help_text="The conversation associated with this learning path"
    )
    current_subtopic = models.ForeignKey(
        LearningSubtopic,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        help_text="The subtopic the user is currently working on"
    )
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ['user', 'topic']
        ordering = ['-started_at']

    def __str__(self):
        return f"{self.user.email} - {self.topic.name}"

    @property
    def progress_percentage(self):
        """Calculate the percentage of subtopics completed"""
        total_subtopics = self.topic.subtopics.filter(is_active=True).count()
        if total_subtopics == 0:
            return 0
        completed_subtopics = self.progress.filter(status='completed').count()
        return (completed_subtopics / total_subtopics) * 100

    @property
    def is_completed(self):
        """Check if all subtopics are completed"""
        return self.progress_percentage == 100


class SubtopicProgressChoices(models.TextChoices):
    NOT_STARTED = 'not_started', 'Not Started'
    LEARNING = 'learning', 'Learning'
    COMPLETED = 'completed', 'Completed'
    SKIPPED = 'skipped', 'Skipped'


class SubtopicProgress(models.Model):
    """
    Tracks a user's progress through individual subtopics
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_path = models.ForeignKey(
        UserLearningPath,
        related_name='progress',
        on_delete=models.CASCADE
    )
    subtopic = models.ForeignKey(LearningSubtopic, on_delete=models.CASCADE)
    conversation = models.OneToOneField(
        'ai_core.Conversation',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="The conversation associated with this subtopic"
    )
    # track how well the user is doing in particular subtopic, this will primarily be used
    # to track if the user is ready to move on to the next subtopic.
    ai_confidence = models.FloatField(
        default=0.0,
        help_text="AI's confidence that the user has mastered the subtopic (0-1)"
    )
    covered_points = ArrayField(
        models.CharField(max_length=255),
        default=list,
        help_text="List of concepts already covered in this subtopic"
    )
    remaining_points = ArrayField(
        models.CharField(max_length=255),
        default=list,
        help_text="List of concepts not yet covered"
    )
    # I might track a list of feedbacks if i feel like it in the future. Trying to keep thisngs
    # simple right now
    status = models.CharField(
        max_length=20,
        choices=SubtopicProgressChoices.choices,
        default=SubtopicProgressChoices.NOT_STARTED
    )
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    challenges_completed = models.PositiveIntegerField(default=0)
    challenges_attempted = models.PositiveIntegerField(default=0)
    notes = models.TextField(blank=True, help_text="User or AI notes about this subtopic")

    class Meta:
        unique_together = ['user_path', 'subtopic']
        ordering = ['subtopic__order']

    def __str__(self):
        return f"{self.user_path.user.email} - {self.subtopic.name} ({self.get_status_display()})"

    @property
    def is_ready_to_move_on(self):
        """Check if the user is ready to move on to the next subtopic"""
        if len(self.remaining_points) == 0 and self.ai_confidence >= 0.8:
            return True
        return False
    
    @property
    def subtopic_complete(self):
        """Check if the subtopic is complete based on progress metrics"""
        return self.is_ready_to_move_on
    
    @property
    def progress_percentage(self):
        """Calculate progress percentage based on covered vs total learning objectives"""
        total_points = len(self.covered_points) + len(self.remaining_points)
        if total_points == 0:
            return 0
        return (len(self.covered_points) / total_points) * 100

    @property
    def challenge_success_rate(self):
        """Calculate the success rate for challenges"""
        if self.challenges_attempted == 0:
            return 0
        return (self.challenges_completed / self.challenges_attempted) * 100

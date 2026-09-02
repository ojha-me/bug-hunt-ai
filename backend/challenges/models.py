from django.db import models
from django.conf import settings
from django.contrib.postgres.fields import ArrayField
import uuid


class CodingProblem(models.Model):
    """
    A curated coding challenge. Solutions are judged via stdin/stdout test
    cases (matching the execution sandbox).
    """

    class Difficulty(models.TextChoices):
        EASY = "easy", "Easy"
        MEDIUM = "medium", "Medium"
        HARD = "hard", "Hard"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=220)
    slug = models.SlugField(max_length=220, unique=True)
    difficulty = models.CharField(
        max_length=10, choices=Difficulty.choices, default=Difficulty.EASY
    )
    topics = ArrayField(models.CharField(max_length=60), default=list, blank=True)
    description = models.TextField(help_text="Markdown problem statement")
    examples = models.JSONField(
        default=list, blank=True,
        help_text="List of {input, output, explanation}"
    )
    constraints = models.JSONField(default=list, blank=True, help_text="List of constraint strings")
    starter_code = models.TextField(blank=True, help_text="Python scaffold for the user")
    test_cases = models.JSONField(
        default=list, blank=True,
        help_text="List of {name, stdin, expected_output}"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["difficulty", "title"]

    def __str__(self):
        return f"[{self.get_difficulty_display()}] {self.title}"

    @property
    def attempt_stats(self):
        attempts = self.attempts.count()
        accepted = self.attempts.filter(verdict="passed").values_list("user_id", flat=True).distinct().count()
        return {
            "attempts": attempts,
            "solved_by_users": accepted,
        }


class ProblemAttempt(models.Model):
    """
    A user's submission for a coding problem. Records the judge verdict.
    """
    class Verdict(models.TextChoices):
        PASSED = "passed", "Passed"
        FAILED = "failed", "Failed"
        ERROR = "error", "Error"
        TIMEOUT = "timeout", "Timeout"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="problem_attempts")
    problem = models.ForeignKey(CodingProblem, on_delete=models.CASCADE, related_name="attempts")
    code = models.TextField()
    language = models.CharField(max_length=50, default="python")
    verdict = models.CharField(max_length=20, choices=Verdict.choices)
    passed_count = models.IntegerField(default=0)
    total_count = models.IntegerField(default=0)
    execution_time_ms = models.IntegerField(null=True, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-submitted_at"]
        indexes = [
            models.Index(fields=["user", "problem"]),
            models.Index(fields=["problem", "verdict"]),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.problem.slug} - {self.verdict}"


class ProblemTutorSession(models.Model):
    """
    Persistent tutor chat for a coding problem. Keeps the last N turns so the
    user can discuss the problem or ask for hints without losing context.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="problem_tutor_sessions")
    problem = models.ForeignKey(CodingProblem, on_delete=models.CASCADE, related_name="tutor_sessions")
    history = models.JSONField(default=list, help_text="List of {role, content} turns")
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'problem']

    def __str__(self):
        return f"{self.user.email} - {self.problem.slug}"
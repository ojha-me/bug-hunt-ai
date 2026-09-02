from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from typing import Optional, Tuple


class RevisionItem(models.Model):
    """
    A spaced-repetition review item, auto-created from concepts the user
    hasn't mastered yet (e.g. a coding problem they failed).
    Scheduling follows a lightweight SM-2 variant.
    """
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="revision_items")
    problem = models.ForeignKey(
        "challenges.CodingProblem",
        on_delete=models.CASCADE,
        related_name="revision_items",
        null=True,
        blank=True,
        help_text="The coding problem this item reviews (if problem-based)",
    )
    title = models.CharField(max_length=255, help_text="Short label shown in the review queue")
    difficulty = models.CharField(max_length=10, default="easy")
    topics = models.JSONField(default=list, blank=True)

    repetitions = models.IntegerField(default=0)
    ease = models.FloatField(default=2.5)
    interval_days = models.IntegerField(default=1)
    due_at = models.DateTimeField(default=timezone.now)
    last_reviewed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["due_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "problem"],
                condition=models.Q(problem__isnull=False),
                name="unique_revision_problem_per_user",
            )
        ]

    def __str__(self):
        return f"{self.user.email} - {self.title} (due {self.due_at.isoformat()})"

    @property
    def is_due(self) -> bool:
        return self.due_at <= timezone.now()

    def schedule(self, quality: int) -> None:
        """
        quality: 0 again/lapse, 1-2 hard, 3 good, 4-5 easy.
        Standard-ish SM-2 with capped intervals.
        """
        if quality < 3:
            self.repetitions = 0
            self.interval_days = 1
        else:
            if self.repetitions == 0:
                self.interval_days = 1
            elif self.repetitions == 1:
                self.interval_days = 3
            else:
                multiplier = 3 if quality >= 4 else 2
                self.interval_days = min(self.interval_days * multiplier, 180)
            self.repetitions += 1

        self.ease = max(1.3, self.ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))
        self.last_reviewed_at = timezone.now()
        self.due_at = timezone.now() + timedelta(days=self.interval_days)
        self.save(update_fields=[
            "repetitions", "ease", "interval_days", "due_at", "last_reviewed_at",
        ])
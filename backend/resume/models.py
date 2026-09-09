import uuid
from django.db import models
from django.conf import settings


class Resume(models.Model):
    """A stored resume, kept as LaTeX source. A user can have several versions."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="resumes")
    name = models.CharField(max_length=120, default="My Resume")
    content = models.TextField(blank=True, default="", help_text="LaTeX source")
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_primary", "-updated_at"]

    def __str__(self):
        return f"{self.user.email} - {self.name}"


class ResumeReview(models.Model):
    """
    One analysis of a resume against a specific job description: an ATS-style
    match score plus targeted, JD-aware feedback. Optionally carries a tailored
    set of swap-in pieces (summary / skills / rewritten bullets).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="resume_reviews")
    resume = models.ForeignKey(Resume, on_delete=models.SET_NULL, null=True, blank=True, related_name="reviews")
    role_title = models.CharField(max_length=200, blank=True, default="")
    job_description = models.TextField()
    # {match_score, summary, matched_keywords[], missing_keywords[], strengths[], gaps[],
    #  bullet_rewrites[{before, after}], tailoring_tips[]}
    feedback = models.JSONField(default=dict)
    # {summary, skills, bullets[{context, text}]} — produced on demand
    tailored = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.email} - review {self.role_title or self.created_at:%Y-%m-%d}"

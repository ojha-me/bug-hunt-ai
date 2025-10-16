from django.db import models
from django.contrib.auth.models import PermissionsMixin,AbstractBaseUser
from uuid import uuid4
from users.managers import CustomUserManager


class SkillLevelChoices(models.TextChoices):
    BEGINNER = 'beginner', 'Beginner'
    INTERMEDIATE = 'intermediate', 'Intermediate'
    ADVANCED = 'advanced', 'Advanced'


class AuthProviderChoices(models.TextChoices):
    EMAIL = 'email', 'Email'
    GOOGLE = 'google', 'Google'


class CustomUser(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(auto_now_add=True)
    
    skill_level = models.CharField(
        max_length=20, choices=SkillLevelChoices.choices, default=SkillLevelChoices.BEGINNER
    )
    
    # OAuth fields
    auth_provider = models.CharField(
        max_length=20, choices=AuthProviderChoices.choices, default=AuthProviderChoices.EMAIL
    )
    google_id = models.CharField(max_length=255, null=True, blank=True, unique=True)
    profile_picture = models.URLField(max_length=500, null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    objects = CustomUserManager()

    def __str__(self):
        return self.email


class RefreshToken(models.Model):
    jti = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="refresh_tokens")
    revoked = models.BooleanField(default=False)
    expires_at = models.DateTimeField()

    def __str__(self):
        return f"{self.user.email} - {self.jti}"


class UserActivitySession(models.Model):
    """
    Tracks user activity sessions for time-spent analytics
    """
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="activity_sessions")
    started_at = models.DateTimeField(auto_now_add=True)
    last_activity_at = models.DateTimeField(auto_now=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.PositiveIntegerField(default=0, help_text="Total active time in seconds")

    class Meta:
        ordering = ['-started_at']
        indexes = [
            models.Index(fields=['user', '-started_at']),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.started_at}"
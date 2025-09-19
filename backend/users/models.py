from django.db import models
from django.contrib.auth.models import PermissionsMixin,AbstractBaseUser
from uuid import uuid4
from users.managers import CustomUserManager


class SkillLevelChoices(models.TextChoices):
    BEGINNER = 'beginner', 'Beginner'
    INTERMEDIATE = 'intermediate', 'Intermediate'
    ADVANCED = 'advanced', 'Advanced'

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
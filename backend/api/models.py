from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid
class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    SKILL_LEVELS = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ]
    skill_level = models.CharField(
        max_length=20, choices=SKILL_LEVELS, default='beginner'
    )
    
    # Override related_name to avoid clashes
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='custom_user_set',  # <--- change this
        blank=True,
        help_text='The groups this user belongs to.',
        verbose_name='groups',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='custom_user_permissions_set',  # <--- change this
        blank=True,
        help_text='Specific permissions for this user.',
        verbose_name='user permissions',
    )
    last_active = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.username


class Session(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sessions")
    session_name = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Session {self.id} - {self.user.username}"


class CodeSnippet(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    LANGUAGE_CHOICES = [
        ('python', 'Python'),
        ('javascript', 'JavaScript'),
        ('typescript', 'TypeScript')
    ]
    language = models.CharField(max_length=20, choices=LANGUAGE_CHOICES)
    code_text = models.TextField()
    created_by_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    is_challenge = models.BooleanField(default=False)
    bug_description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.language} snippet {self.id}"


class Message(models.Model):
    SENDER_CHOICES = [
        ('user', 'User'),
        ('ai', 'AI'),
    ]
    MESSAGE_TYPE_CHOICES = [
        ('text', 'Text'),
        ('code_snippet', 'Code Snippet'),
        ('hint', 'Hint'),
        ('challenge', 'Challenge'),
    ]

    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='messages')
    sender = models.CharField(max_length=10, choices=SENDER_CHOICES)
    message_text = models.TextField(blank=True, null=True)
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPE_CHOICES, default='text')
    attached_code = models.ForeignKey(CodeSnippet, on_delete=models.SET_NULL, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message {self.id} - {self.sender}"

class Challenge(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]
    code_snippet = models.ForeignKey(CodeSnippet, on_delete=models.CASCADE)
    difficulty_level = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Challenge {self.id} - {self.difficulty_level}"

class Submission(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    STATUS_CHOICES = [
        ('correct', 'Correct'),
        ('incorrect', 'Incorrect'),
        ('partially_correct', 'Partially Correct'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE)
    submitted_code = models.ForeignKey(CodeSnippet, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    feedback = models.TextField(blank=True, null=True)
    attempted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Submission {self.id} - {self.user.username} - {self.challenge.difficulty_level}"


class Hint(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE, related_name='hints')
    hint_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Hint {self.id} - {self.challenge.difficulty_level}"


class UserProgress(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE)
    attempts = models.IntegerField(default=0)
    success = models.BooleanField(default=False)
    time_taken = models.FloatField(null=True, blank=True)  # in seconds

    class Meta:
        unique_together = ('user', 'challenge')
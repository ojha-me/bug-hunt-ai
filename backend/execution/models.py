from django.db import models
from django.conf import settings
import uuid


class CodeExecutionLog(models.Model):
    """
    Tracks all code executions for analytics
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='code_executions')
    conversation = models.ForeignKey('ai_core.Conversation', on_delete=models.CASCADE, null=True, blank=True)
    language = models.CharField(max_length=50)
    code_length = models.PositiveIntegerField(help_text="Number of characters in the code")
    execution_time_ms = models.PositiveIntegerField(help_text="Execution time in milliseconds", null=True, blank=True)
    success = models.BooleanField(help_text="Whether the execution was successful")
    error_type = models.CharField(max_length=100, blank=True, null=True)
    executed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-executed_at']
        indexes = [
            models.Index(fields=['user', '-executed_at']),
            models.Index(fields=['user', 'success']),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.language} - {'Success' if self.success else 'Failed'}"

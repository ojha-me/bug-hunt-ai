from django.db import models
from django.conf import settings
import uuid

class Conversation(models.Model):
    """
    Represents a single chat session between a user and the AI.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_active_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Conversation {self.id} - {self.user.email}"



class MessageSenderChoices(models.TextChoices):
    USER = 'user'
    AI = 'ai'

class MessageTypeChoices(models.TextChoices):
    HINT = 'hint'
    CHALLENGE = 'challenge'
    FEEDBACK = 'feedback'
    CONVERSATION = 'conversation'

class Message(models.Model):
    """
    Represents a single message in a conversation.
    Could be a user message or AI response.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, related_name="messages", on_delete=models.CASCADE)
    sender = models.CharField(choices=MessageSenderChoices.choices)
    content = models.TextField()
    code_snippet = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    message_type = models.CharField(choices=MessageTypeChoices.choices, max_length=50, blank=True, null=True)

    def __str__(self):
        return f"{self.sender} - {self.created_at} - {self.message_type}"

# I might bring the summary type feature in future
# so just keeping it here to remind me in future what i was thinking 
#
# class SummaryTypeChoices(models.TextChoices):
#     GENERAL = 'general', 'General'
#     CODE = 'code', 'Code'
#     ERROR = 'error', 'Error'
#     DEBUG = 'debug', 'Debug'
#     FEEDBACK = 'feedback', 'Feedback'

class Summary(models.Model):
    """
    Represents a summary of a conversation.
    Each summary is tied to a conversation. 
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, related_name="summaries", on_delete=models.CASCADE)
    content = models.TextField()
    last_updated_at = models.DateTimeField(auto_now=True)
    # upto which message was the summary for
    last_message = models.ForeignKey(
        Message,
        related_name="summaries_until",
        null=True,
        blank=True,
        on_delete=models.SET_NULL
    )

    def __str__(self):
        return f"Summary for Conversation {self.conversation.id}"
    
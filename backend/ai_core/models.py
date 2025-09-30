from django.db import models
from django.conf import settings
import uuid

class ConversationTypeChoices(models.TextChoices):
    GENERAL = 'general', 'General Chat'
    LEARNING_PATH = 'learning_path', 'Structured Learning Path'

class Conversation(models.Model):
    """
    Represents a single chat session between a user and the AI.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=255, blank=True)
    conversation_type = models.CharField(
        max_length=20,
        choices=ConversationTypeChoices.choices,
        default=ConversationTypeChoices.GENERAL,
        help_text="Type of conversation - general chat or structured learning"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    last_active_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Conversation {self.id} - {self.user.email}"



class MessageSenderChoices(models.TextChoices):
    USER = 'user'
    AI = 'ai'

class MessageLanguageChoices(models.TextChoices):
    PYTHON = 'python'
    JAVASCRIPT = 'javascript'
    TYPESCRIPT = 'typescript'


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
    language = models.CharField(choices=MessageLanguageChoices.choices, blank=True, null=True)
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
    


class ConversationModeChoices(models.TextChoices):
    IDLE = 'idle', 'Idle - Normal conversation'
    CHALLENGE_ACTIVE = 'challenge_active', 'Challenge Active - Waiting for code submission'
    HINT_ACTIVE = 'hint_active', 'Hint Active - Providing hints'
    FEEDBACK_ACTIVE = 'feedback_active', 'Feedback Active - Providing feedback'
    CONVERSATION = 'conversation', 'General Conversation'

class ConversationState(models.Model):
    """
    Tracks the current state and mode of a conversation.
    Each conversation has exactly one state.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.OneToOneField(
        Conversation,
        related_name="state",
        on_delete=models.CASCADE,
        unique=True
    )
    mode = models.CharField(
        max_length=20,
        choices=ConversationModeChoices.choices,
        default=ConversationModeChoices.IDLE
    )
    last_message_type = models.CharField(
        max_length=20,
        choices=MessageTypeChoices.choices,
        null=True,
        blank=True,
        help_text="Type of the last AI message"
    )
    attempt_count = models.PositiveIntegerField(
        default=0,
        help_text="Number of attempts made for the current challenge"
    )
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"State for Conversation {self.conversation.id}"


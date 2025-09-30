import logging
from ai_core.models import Conversation, Message, Summary
from channels.db import database_sync_to_async

logger = logging.getLogger('ai_core.utils.context_helpers')

@database_sync_to_async
def generate_context(conversation: Conversation):
    """
    Generate additional context for AI for the conversation.
    """
    messages = Message.objects.filter(conversation=conversation).order_by('-created_at')[:6]
    summary = Summary.objects.filter(conversation=conversation).order_by('-last_updated_at').first()

    context_from_messages = ""
    context_from_summary = ""

    # reversed so they are oldest to newest in context
    for message in reversed(messages):
        context_from_messages += f"{message.sender}: {message.content}\n"

    # add summary content if available
    if summary:
        context_from_summary = f"Summary (up to message {summary.last_message.content}):\n{summary.content}\n"

    # Combine summary and recent messages
    full_context = f"{context_from_summary}\nRecent Messages:\n{context_from_messages}"

    return full_context

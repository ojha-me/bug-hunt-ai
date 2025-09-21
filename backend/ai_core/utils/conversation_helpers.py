# utils/conversation_helpers.py

from channels.db import database_sync_to_async
from ai_core.models import Conversation, Message, MessageSenderChoices, MessageTypeChoices
from .ai_helpers import AIService


class ConversationService:
    """
    Service to handle conversation and message operations.
    """

    @staticmethod
    @database_sync_to_async
    def get_conversation(conversation_id):
        return Conversation.objects.filter(id=conversation_id).first()

    @staticmethod
    @database_sync_to_async
    def create_conversation(user, title):
        return Conversation.objects.create(user=user, title=title)

    @staticmethod
    @database_sync_to_async
    def save_message(conversation, sender, content, message_type=None):
        return Message.objects.create(
            conversation=conversation,
            sender=sender,
            content=content,
            message_type=message_type or MessageTypeChoices.CONVERSATION
        )

    @staticmethod
    async def get_or_create_conversation(user, initial_message):
        """Create a new conversation with an AI-generated title."""
        ai_service = AIService()
        generated_title = await ai_service.generate_title(initial_message)
        return await ConversationService.create_conversation(user, generated_title)

    @staticmethod
    @database_sync_to_async
    def _update_title_in_db(conversation, title):
        """Synchronous helper to update title in DB"""
        conversation.title = title
        conversation.save(update_fields=['title'])

    @staticmethod
    async def generate_and_update_title(conversation, initial_message: str):
        """
        Generate a title using AI and update the conversation.
        """
        ai_service = AIService()
        generated_title = await ai_service.generate_title(initial_message)
        await ConversationService._update_title_in_db(conversation, generated_title)
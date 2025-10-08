import json
import logging
from channels.db import database_sync_to_async
from ai_core.models import Conversation, Message, MessageSenderChoices, MessageTypeChoices, Summary
from .ai_helpers_general import AIService

logger = logging.getLogger('ai_core.utils.conversation_helpers')


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
    def save_ai_message(conversation, content):
        message_type = ''
        code_snippet = ''
        language = ''
        try:
            parsed_content = json.loads(content)  # Parse the JSON string
            message_type = parsed_content.get("type", "")
            content_text = parsed_content.get("content", "")
            code_snippet = parsed_content.get("code", "")
            language = parsed_content.get("language", "")
        except json.JSONDecodeError:
            content_text = content

        return Message.objects.create(
            conversation=conversation,
            sender=MessageSenderChoices.AI,
            content=content_text,
            code_snippet=code_snippet,
            language=language,
            message_type=message_type or MessageTypeChoices.CONVERSATION
        )

    @staticmethod
    @database_sync_to_async
    def save_user_message(conversation, content, code_snippet=None, language=None ):
        return Message.objects.create(
            conversation=conversation,
            sender=MessageSenderChoices.USER,
            content=content,
            code_snippet=code_snippet,
            language=language,
            message_type=MessageTypeChoices.CONVERSATION
        )

    @staticmethod
    @database_sync_to_async
    def save_message(conversation, content, sender, message_type, code_snippet=None, language=None):
        """
        Generic method to save messages from either AI or user
        """
        return Message.objects.create(
            conversation=conversation,
            sender=sender,
            content=content,
            code_snippet=code_snippet,
            language=language,
            message_type=message_type
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
        logger.info(f"Generating and updating title for conversation: {conversation.id}")
        ai_service = AIService()
        generated_title = await ai_service.generate_title(initial_message)
        await ConversationService._update_title_in_db(conversation, generated_title)
        logger.debug(f"Updated title to: {generated_title}")
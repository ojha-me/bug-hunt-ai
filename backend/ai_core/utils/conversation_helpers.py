
from channels.db import database_sync_to_async
from ai_core.models import Conversation, Message, MessageSenderChoices, MessageTypeChoices
from .ai_helpers import AIService

class ConversationService:
    """
    This class is used to interact with the conversation service.
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
            message_type=message_type
        )

    
    @staticmethod
    async def get_or_create_conversation(user, initial_message):
        """Get conversation by ID or create new with AI-generated title."""
        ai_service = AIService()
        title = await ai_service.generate_title(initial_message)
        return await ConversationService.create_conversation(user, title)

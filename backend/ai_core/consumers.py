import json
import uuid
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import MessageSenderChoices, MessageTypeChoices
from .utils.ai_helpers import AIService
from .utils.auth_helpers import authenticate_user
from .utils.conversation_helpers import ConversationService
from channels.db import database_sync_to_async
import logging

logger = logging.getLogger('ai_core.consumers')



class AIChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        logger.info("WebSocket connection attempt------------")
        self.conversation_id = uuid.UUID(self.scope['url_route']['kwargs']['conversation_id'])
        try:
            self.user = await authenticate_user(self.scope)
        except ValueError:
            await self.close(code=4001)
            return
        
        self.room_group_name = f"conversation_{self.conversation_id}"
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        self.ai_service = AIService()
        self.conversation_service = ConversationService()

        self.conversation = await self.conversation_service.get_conversation(self.conversation_id)
        
        await self.accept()


    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_content = data.get("message")

        if not message_content:
            return

        # Save user message
        user_message = await self.conversation_service.save_user_message(
            self.conversation,
            message_content
        )

        needs_title = False
        user_messages_count = await database_sync_to_async(
                lambda: self.conversation.messages.filter(sender=MessageSenderChoices.USER).count()
            )()
        if user_messages_count == 1:
            needs_title = True
        
        if needs_title:
            await self.conversation_service.generate_and_update_title(
                self.conversation,
                message_content
            )

        await self.broadcast_message(user_message)

        # Generate AI response
        ai_text = await self.ai_service.generate_response(message_content)

        # Save AI message
        ai_message = await self.conversation_service.save_ai_message(
            self.conversation,
            ai_text
        )

        await self.broadcast_message(ai_message)


    async def broadcast_message(self, message):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat.message",
                "message": {
                    "id": str(message.id),
                    "sender": message.sender,
                    "content": message.content,
                    "message_type": message.message_type,
                    "code_snippet": message.code_snippet,
                    "timestamp": message.created_at.isoformat()
                }
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event["message"]))

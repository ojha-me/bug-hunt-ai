import json
import uuid
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import MessageSenderChoices, MessageTypeChoices
from .utils.ai_helpers import AIService
from .utils.auth_helpers import authenticate_user
from .utils.conversation_helpers import ConversationService


class AIChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.conversation_id = uuid.UUID(self.scope['url_route']['kwargs']['conversation_id'])
        self.conversation = None
        
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

        # If conversation doesn't exist, create it
        if not self.conversation:
            self.conversation = await self.conversation_service.get_or_create_conversation(
                self.user, message_content
            )

        # Save user message
        user_message = await self.conversation_service.save_message(
            self.conversation,
            MessageSenderChoices.USER,
            message_content
        )

        await self.broadcast_message(user_message)

        # Generate AI response
        ai_text = await self.ai_service.generate_response(message_content)

        # Save AI message
        ai_message = await self.conversation_service.save_message(
            self.conversation,
            MessageSenderChoices.AI,
            ai_text,
            MessageTypeChoices.CONVERSATION
        )

        await self.broadcast_message(ai_message)


    async def broadcast_message(self, message):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                # this chat.message will be received by the chat_message method
                "type": "chat.message",
                "message": {
                    "id": str(message.id),
                    "sender": message.sender,
                    "content": message.content,
                    "timestamp": message.created_at.isoformat()
                }
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event["message"]))

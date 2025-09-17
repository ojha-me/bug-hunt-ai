import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Conversation, Message, MessageSenderChoices, MessageTypeChoices
from asgiref.sync import sync_to_async
from django.conf import settings
from google import genai

GEMINI_API_KEY = settings.GEMINI_API_KEY
client = genai.Client(api_key=GEMINI_API_KEY)
chat = client.chats.create(model="gemini-2.5-flash")

class AIChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):


        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.room_group_name = f"conversation_{self.conversation_id}"

        # Join the group for this conversation
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave the group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_content = data.get("message")

        user_message = await self.save_message(sender=MessageSenderChoices.USER, content=message_content)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "sender": user_message.sender,
                "content": user_message.content,
                "message_type": user_message.message_type,
                "created_at": user_message.created_at.isoformat(),
            }
        )

        ai_response_content = await self.generate_ai_response(message_content)

        ai_message = await self.save_message(sender=MessageSenderChoices.AI,
                                             content=ai_response_content,
                                             message_type=MessageTypeChoices.FEEDBACK)

        # Broadcast AI response to the group if multiple tabs are open
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "sender": ai_message.sender,
                "content": ai_message.content,
                "message_type": ai_message.message_type,
                "created_at": ai_message.created_at.isoformat(),
            }
        )

    # Handler for messages sent to the group
    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def save_message(self, sender, content, message_type=None):
        conversation = Conversation.objects.get(id=self.conversation_id)
        return Message.objects.create(
            conversation=conversation,
            sender=sender,
            content=content,
            message_type=message_type
        )

    async def generate_ai_response(self, user_message):
        """
        call gemini api to generate response
        """
        async def call_genai():
            response = await sync_to_async(client.generate_text)(
                model="text-bison-001",  # choose your model
                prompt=user_message,
                temperature=0.7,
                max_output_tokens=500
            )
            return response.text
        ai_text = await call_genai()
        return ai_text

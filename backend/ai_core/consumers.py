import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.conf import settings
from google import genai
from google.genai import types
from .models import Conversation, Message, MessageSenderChoices, MessageTypeChoices
import uuid
from urllib.parse import parse_qs
from users.utils.auth import decode_jwt
from users.models import CustomUser

GEMINI_API_KEY = settings.GEMINI_API_KEY
client = genai.Client(api_key=GEMINI_API_KEY)


class AIChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.conversation_id = uuid.UUID(self.scope['url_route']['kwargs']['conversation_id'])
        print("yeta pugyo ki??")
        # Get token from query string
        query_string = self.scope['query_string'].decode()  
        query_params = parse_qs(query_string)
        self.token = query_params.get("token", [None])[0] 

        self.conversation: Conversation | None = None
        if not self.token:
            await self.close(code=4001)  
            return
        
        try:
            decoded_token = decode_jwt(self.token)
            user_id = decoded_token.get("user_id")
            if not user_id:
                await self.close(code=4401)
                return
            self.user = await database_sync_to_async(CustomUser.objects.get)(id=user_id)
            print(type(self.user),"type herdai xu")
        except Exception:  # Token invalid or user not found
            await self.close(code=4401)
            return
        
        self.room_group_name = f"conversation_{self.conversation_id}"
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        self.chat = client.chats.create(model="gemini-2.5-flash")
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

        # If conversation doesn't exist, generate title and create it
        if not self.conversation:
            title = await self.generate_conversation_title(message_content)
            self.conversation = await self.create_conversation(title)

        # Save user message
        user_message = await self.save_message(
            conversation=self.conversation,
            sender=MessageSenderChoices.USER,
            message_content=message_content
        )

       
        await self.broadcast_message(user_message)

        # Generate AI response
        ai_text = await self.generate_ai_response(message_content)


        # Save AI message
        ai_message = await self.save_message(
            conversation=self.conversation,
            sender=MessageSenderChoices.AI,
            message_content=ai_text,
            message_type=MessageTypeChoices.CONVERSATION
        )

        await self.broadcast_message(ai_message)

    @database_sync_to_async
    def get_conversation(self, conversation_id):
        try:
            return Conversation.objects.get(id=conversation_id)
        except Conversation.DoesNotExist:
            return None

    @database_sync_to_async
    def create_conversation(self, title):
        return Conversation.objects.create(user=self.user, title=title)

    @database_sync_to_async
    def save_message(self, conversation, sender, message_content, message_type=None):
        return Message.objects.create(
            conversation=conversation,
            sender=sender,
            content=message_content,
            message_type=message_type
        )

    async def generate_ai_response(self, user_message):
        response = self.chat.send_message(
            config=types.GenerateContentConfig(
            thinking_config=types.ThinkingConfig(thinking_budget=0) # by default all the models have thinking enabled, Disables thinking
            ),
            message=user_message
        )   
        return response.text

    async def generate_conversation_title(self, user_message):
        prompt = f"Generate a concise title for this conversation: {user_message}"
        response = self.chat.send_message(
            config=types.GenerateContentConfig(
            thinking_config=types.ThinkingConfig(thinking_budget=0) # by default all the models have thinking enabled, Disables thinking
            ),
            message=prompt + "\n\n" + user_message
        )   
        return response.text

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

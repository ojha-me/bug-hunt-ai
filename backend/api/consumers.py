"""WebSocket consumer for real-time code analysis."""
import os
from channels.db import sync_to_async
import dotenv
from google import genai
from channels.generic.websocket import AsyncWebsocketConsumer
import json

MODEL = "gemini-1.5-flash"
dotenv.load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY environment variable not set.")

client = genai.Client(api_key=api_key)


class CodeConsumer(AsyncWebsocketConsumer):
    """A WebSocket consumer that handles real-time communication for code analysis."""

    async def connect(self):
        """Called when WebSocket connection is initiated"""

        await self.accept()
        self.chat_session = await sync_to_async(client.chats.create)(model=MODEL)
        await self.send(text_data=json.dumps({
            'type': 'system_message',
            'payload': {'message': 'Connected to BugHunt AI! Ready to help.'}
        }))

    async def disconnect(self, code):
        """Called when WebSocket connection is closed"""
        await self.close()

    async def receive(self, text_data=None, bytes_data=None):
        """Called when WebSocket message is received"""
        try:
            data =  json.loads(text_data)
            message_type =  data['type']
            message = data['payload']['message']

            if message_type == 'user_chat':

                response = await sync_to_async(self.chat_session.send_message)(
                    message
                )

                if response:
                    await self.send(text_data=json.dumps({
                        'type': 'ai_chat',
                        'payload': {'message': response.text}
                    }))
        except Exception as e:
            print(f"Error parsing message: {e}")



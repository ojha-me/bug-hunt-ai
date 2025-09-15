""" WebSocket consumer for handling real-time code execution requests."""
import json
from channels.generic.websocket import AsyncWebsocketConsumer

class CodeConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        print("WebSocket Connected!")

    async def disconnect(self, close_code):
        # Called when the websocket closes
        print(f"WebSocket Disconnected: {close_code}")

    async def receive(self, text_data):
        # Called when a message is received from the websocket
        print(f"Received message: {text_data}")

        # Echo the message back to the client
        await self.send(text_data=json.dumps({
            'message': 'We got your message!'
        }))
import json
import uuid
import asyncio
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from ai_core.models import MessageSenderChoices, MessageTypeChoices
from ai_core.utils.auth_helpers import authenticate_user
from ai_core.utils.conversation_helpers import ConversationService
from ai_core.utils.system_design_ai import SystemDesignAIService
from channels.db import database_sync_to_async

logger = logging.getLogger('ai_core.consumers')

CONTEXT_LIMIT = 8


class SystemDesignConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.conversation_id = uuid.UUID(self.scope['url_route']['kwargs']['conversation_id'])
        try:
            self.user = await authenticate_user(self.scope)
        except ValueError:
            await self.close(code=4001)
            return

        self.room_group_name = f"conversation_{self.conversation_id}"
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        self.ai_service = SystemDesignAIService()
        self.conversation_service = ConversationService()
        self.conversation = await self.conversation_service.get_conversation(self.conversation_id)

        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "room_group_name"):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get("action", "message")

        if action == "submit_diagram":
            await self.handle_diagram_submission(data.get("diagram"))
            return

        message_content = data.get("message")
        if not message_content:
            return

        user_message = await self.conversation_service.save_user_message(
            self.conversation, message_content
        )
        await self.broadcast_message(user_message)
        await self.broadcast_event("typing_start")

        await asyncio.sleep(1)

        context = await self._build_context()
        ai_data = await database_sync_to_async(self.ai_service.generate_response)(
            message_content, diagram=None, context=context
        )

        ai_message = await self.conversation_service.save_ai_message(
            self.conversation, json.dumps({
                "content": ai_data.get("content"),
                "type": ai_data.get("type"),
                "diagram": ai_data.get("diagram"),
            })
        )
        if ai_data.get("diagram"):
            ai_message.diagram = ai_data.get("diagram")
            await database_sync_to_async(ai_message.save)(update_fields=["diagram"])

        await self.broadcast_event("done")
        await self.broadcast_message(ai_message)

    async def handle_diagram_submission(self, diagram):
        if not diagram:
            return

        user_message = await self.conversation_service.save_user_message(
            self.conversation, "Here's my architecture diagram - please review it.",
            diagram=diagram,
        )
        await self.broadcast_message(user_message)
        await self.broadcast_event("typing_start")

        await asyncio.sleep(1)

        context = await self._build_context()
        ai_data = await database_sync_to_async(self.ai_service.generate_response)(
            "Review my diagram.", diagram=diagram, context=context
        )

        ai_message = await self.conversation_service.save_ai_message(
            self.conversation, json.dumps({
                "content": ai_data.get("content"),
                "type": ai_data.get("type"),
                "diagram": ai_data.get("diagram"),
            })
        )

        await self.broadcast_event("done")
        await self.broadcast_message(ai_message)

    async def _build_context(self) -> str:
        messages = await database_sync_to_async(
            lambda: list(self.conversation.messages.order_by('-created_at')[:CONTEXT_LIMIT])
        )()
        lines = []
        for msg in reversed(messages):
            lines.append(f"{msg.sender}: {msg.content[:500]}")
        return "\n".join(lines)

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
                    "language": message.language,
                    "diagram": message.diagram,
                    "timestamp": message.created_at.isoformat()
                }
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event["message"]))

    async def broadcast_event(self, event_type: str, content: str = ""):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat.event",
                "event": {"type": event_type, "content": content},
            },
        )

    async def chat_event(self, event):
        await self.send(text_data=json.dumps(event["event"]))
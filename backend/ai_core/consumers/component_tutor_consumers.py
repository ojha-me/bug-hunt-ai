import json
import uuid
import logging
from channels.db import database_sync_to_async
from ai_core.utils.auth_helpers import authenticate_user
from ai_core.utils.conversation_helpers import ConversationService
from ai_core.utils.component_tutor_ai import ComponentTutorService
from .system_design_consumers import SystemDesignConsumer

logger = logging.getLogger('ai_core.consumers')


class ComponentTutorConsumer(SystemDesignConsumer):
    """
    A focused, per-component teaching session. Reuses SystemDesignConsumer's
    message save/broadcast plumbing but swaps in the ComponentTutorService and
    generates a fresh AI opening the first time the room is opened.
    """

    async def connect(self):
        self.conversation_id = uuid.UUID(self.scope['url_route']['kwargs']['conversation_id'])
        try:
            self.user = await authenticate_user(self.scope)
        except ValueError:
            await self.close(code=4001)
            return

        self.room_group_name = f"conversation_{self.conversation_id}"
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        self.conversation_service = ConversationService()
        self.conversation = await self.conversation_service.get_conversation(self.conversation_id)

        kind = await self._get_component_kind()
        self.ai_service = ComponentTutorService(kind)

        await self.accept()

        if not await self._has_messages():
            await self._send_opening()

    @database_sync_to_async
    def _get_component_kind(self):
        from system_design.models import ComponentTutorSession
        session = ComponentTutorSession.objects.filter(conversation_id=self.conversation_id).first()
        return session.component_kind if session else "service"

    @database_sync_to_async
    def _has_messages(self):
        return self.conversation.messages.exists()

    async def _send_opening(self):
        await self.broadcast_event("typing_start")
        opening = await database_sync_to_async(self.ai_service.generate_opening)()
        ai_message = await self.conversation_service.save_ai_message(
            self.conversation, json.dumps({"content": opening, "type": "explanation"})
        )
        await self.broadcast_event("done")
        await self.broadcast_message(ai_message)

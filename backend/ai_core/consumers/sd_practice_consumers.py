import json
import uuid
import asyncio
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from ai_core.models import MessageSenderChoices, MessageTypeChoices
from ai_core.utils.auth_helpers import authenticate_user
from ai_core.utils.conversation_helpers import ConversationService
from system_design.models import SDPracticeSession, SDPracticeStatus
from system_design.services.sd_practice_service import SDPracticeService

logger = logging.getLogger('system_design.practice')

CONTEXT_LIMIT = 10


class SDPracticeConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.conversation_id = uuid.UUID(self.scope['url_route']['kwargs']['conversation_id'])
        try:
            self.user = await authenticate_user(self.scope)
        except ValueError:
            await self.close(code=4001)
            return

        try:
            get_session = lambda: SDPracticeSession.objects.select_related('case_study', 'conversation').get(
                conversation_id=self.conversation_id, user=self.user
            )
            self.session = await database_sync_to_async(get_session)()
        except SDPracticeSession.DoesNotExist:
            await self.close(code=4004)
            return

        self.case_study = await database_sync_to_async(lambda: self.session.case_study)()
        self.conversation = await database_sync_to_async(lambda: self.session.conversation)()

        self.room_group_name = f"conversation_{self.conversation.id}"
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        self.ai_service = SDPracticeService()
        self.conversation_service = ConversationService()

        await self.accept()

        message_count = await database_sync_to_async(lambda: self.conversation.messages.count())()
        if message_count == 0:
            greeting = await database_sync_to_async(self.ai_service.generate_greeting)(self.case_study)
            greeting_msg = await self.conversation_service.save_message(
                conversation=self.conversation,
                sender=MessageSenderChoices.AI,
                content=greeting.get('greeting_message', "Welcome to your practice drill!"),
                message_type=MessageTypeChoices.CONVERSATION,
            )
            await self.broadcast_message(greeting_msg)

        await self.broadcast_event("phase_state", json.dumps({
            "current_phase": self.session.current_phase,
            "phase_states": self.session.phase_states,
            "status": self.session.status,
        }))

    async def disconnect(self, close_code):
        if hasattr(self, "room_group_name"):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get("action", "message")

        if action == "submit_diagram":
            if self.session.current_phase < 4:
                await self.broadcast_event("system_note", "Draw your architecture in Phase 4 (High-Level Design).")
                return
            await self.handle_diagram(data.get("diagram"))
            return

        message_content = data.get("message")
        if not message_content:
            return
        await self.handle_message(message_content)

    async def handle_message(self, message_content: str):
        if self.session.status == SDPracticeStatus.COMPLETED:
            user_message = await self.conversation_service.save_user_message(self.conversation, message_content)
            await self.broadcast_message(user_message)
            ai_message = await self.conversation_service.save_ai_message(
                self.conversation,
                "Great work — you already completed this drill. Review the transcript above or start a new one.",
            )
            await self.broadcast_message(ai_message)
            return

        user_message = await self.conversation_service.save_user_message(self.conversation, message_content)
        await self.broadcast_message(user_message)
        await self.broadcast_event("typing_start")
        await asyncio.sleep(1)

        context = await self._build_context()
        ai_data = await database_sync_to_async(self.ai_service.generate_response)(
            case_study=self.case_study,
            session=self.session,
            message_content=message_content,
            diagram=None,
            context=context,
        )

        ai_message = await self.conversation_service.save_ai_message(
            self.conversation,
            json.dumps({
                "content": ai_data.get("content"),
                "type": "feedback",
                "phase_complete": ai_data.get("complete", False),
                "phase_summary": ai_data.get("phase_summary", ""),
            }),
        )
        await self.broadcast_event("done")
        await self.broadcast_message(ai_message)

        await self._apply_phase_result(ai_data)

    async def handle_diagram(self, diagram):
        if not diagram:
            return

        user_message = await self.conversation_service.save_user_message(
            self.conversation,
            "Here's my Phase 4 high-level design diagram.",
            diagram=diagram,
        )
        await self.broadcast_message(user_message)
        await self.broadcast_event("typing_start")
        await asyncio.sleep(1)

        context = await self._build_context()
        ai_data = await database_sync_to_async(self.ai_service.generate_response)(
            case_study=self.case_study,
            session=self.session,
            message_content="Review my high-level design diagram.",
            diagram=diagram,
            context=context,
        )

        ai_message = await self.conversation_service.save_ai_message(
            self.conversation,
            json.dumps({
                "content": ai_data.get("content"),
                "type": "feedback",
                "phase_complete": ai_data.get("complete", False),
                "phase_summary": ai_data.get("phase_summary", ""),
            }),
            diagram=diagram,
        )
        await self.broadcast_event("done")
        await self.broadcast_message(ai_message)

        await self._apply_phase_result(ai_data)

    async def _apply_phase_result(self, ai_data: dict):
        session = await database_sync_to_async(
            lambda: SDPracticeSession.objects.get(pk=self.session.pk)
        )()
        progressed = await database_sync_to_async(self.ai_service.record_phase_result)(
            session,
            complete=bool(ai_data.get("complete")),
            score=1.0 if ai_data.get("complete") else 0.0,
            notes=ai_data.get("notes", ""),
        )
        self.session = await database_sync_to_async(lambda: SDPracticeSession.objects.get(pk=session.pk))()

        if progressed and self.session.status == SDPracticeStatus.COMPLETED:
            completion = await database_sync_to_async(self.ai_service.generate_completion)(
                self.case_study, self.session.weak_areas
            )
            completion_msg = await self.conversation_service.save_ai_message(
                self.conversation,
                completion.get("message", "You completed a full design drill!"),
            )
            await self.broadcast_message(completion_msg)
            await self.broadcast_event("session_completed", json.dumps({
                "weak_areas": self.session.weak_areas,
                "phase_states": self.session.phase_states,
            }))
        elif progressed:
            transition = await database_sync_to_async(self.ai_service.generate_phase_transition)(session.current_phase - 1)
            transition_msg = await self.conversation_service.save_ai_message(
                self.conversation,
                transition.get("message", "Phase complete — moving on."),
            )
            await self.broadcast_message(transition_msg)

        await self.broadcast_event("phase_state", json.dumps({
            "current_phase": self.session.current_phase,
            "phase_states": self.session.phase_states,
            "status": self.session.status,
        }))

    async def _build_context(self) -> str:
        messages = await database_sync_to_async(
            lambda: list(self.conversation.messages.order_by('-created_at')[:CONTEXT_LIMIT])
        )()
        lines = []
        for msg in reversed(messages):
            try:
                parsed = json.loads(msg.content)
                content = parsed.get("content", msg.content) if isinstance(parsed, dict) else msg.content
            except (json.JSONDecodeError, TypeError):
                content = msg.content
            lines.append(f"{msg.sender}: {content[:400]}")
        return "\n".join(lines)

    async def broadcast_message(self, msg):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat.message",
                "message": {
                    "id": str(msg.id),
                    "sender": msg.sender,
                    "content": msg.content,
                    "message_type": msg.message_type,
                    "code_snippet": msg.code_snippet,
                    "language": msg.language,
                    "diagram": msg.diagram,
                    "timestamp": msg.created_at.isoformat(),
                },
            },
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
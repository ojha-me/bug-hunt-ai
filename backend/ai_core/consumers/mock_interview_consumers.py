import json
import uuid
import asyncio
import logging
from channels.db import database_sync_to_async
from django.utils import timezone

from ai_core.utils.auth_helpers import authenticate_user
from ai_core.utils.conversation_helpers import ConversationService
from .system_design_consumers import SystemDesignConsumer

logger = logging.getLogger('ai_core.consumers')


class MockInterviewConsumer(SystemDesignConsumer):
    """
    A live coding-interview session on a single problem. Reuses SystemDesignConsumer's
    save/broadcast plumbing, but swaps in the MockInterviewService interviewer and adds
    an `end_interview` action that judges the final code and scores the transcript.
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

        self.session = await self._get_session()
        if self.session is None:
            await self.close(code=4004)
            return

        from challenges.services.mock_interview_ai import MockInterviewService
        self.ai_service = MockInterviewService(self.session.problem)

        await self.accept()

        if not await self._has_messages():
            await self._send_opening()

    @database_sync_to_async
    def _get_session(self):
        from challenges.models import MockInterviewSession
        return (
            MockInterviewSession.objects
            .select_related("problem")
            .filter(conversation_id=self.conversation_id, user=self.user)
            .first()
        )

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

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get("action", "message")

        if action == "end_interview":
            await self.handle_end_interview(data.get("code", ""))
            return

        if action == "delete_message":
            await self.handle_delete(data.get("message_id"), bool(data.get("cascade", False)))
            return

        message_content = data.get("message")
        if not message_content:
            return

        user_message = await self.conversation_service.save_user_message(self.conversation, message_content)
        await self.broadcast_message(user_message)
        await self.broadcast_event("typing_start")
        await asyncio.sleep(0.5)

        context = await self._build_context()
        ai_data = await database_sync_to_async(self.ai_service.generate_response)(
            message_content, context=context
        )
        ai_message = await self.conversation_service.save_ai_message(
            self.conversation, json.dumps({"content": ai_data.get("content"), "type": "explanation"})
        )
        await self.broadcast_event("done")
        await self.broadcast_message(ai_message)

    async def handle_end_interview(self, code):
        # Already scored? Just re-send the stored result (idempotent for reconnects).
        if self.session.evaluation is not None:
            await self.broadcast_result(self.session.evaluation)
            return

        await self.broadcast_event("grading_start")

        passed, total = await self._judge(code)
        transcript = await self._full_transcript()
        elapsed = await self._elapsed_minutes()

        evaluation = await database_sync_to_async(self.ai_service.evaluate)(
            transcript, code, passed, total, elapsed
        )
        await self._save_result(code, evaluation)
        await self.broadcast_event("done")
        await self.broadcast_result(evaluation)

    @database_sync_to_async
    def _judge(self, code):
        from challenges.api import _judge_problem
        problem = self.session.problem
        if not code.strip() or not problem.test_cases:
            return 0, len(problem.test_cases or [])
        try:
            _results, summary = _judge_problem(problem, code, timeout=5)
            return summary.get("passed", 0), summary.get("total", 0)
        except Exception:
            return 0, len(problem.test_cases or [])

    @database_sync_to_async
    def _full_transcript(self):
        lines = []
        for msg in self.conversation.messages.order_by("created_at"):
            role = "Interviewer" if msg.sender == "ai" else "Candidate"
            lines.append(f"{role}: {msg.content}")
        return "\n".join(lines)

    @database_sync_to_async
    def _elapsed_minutes(self):
        delta = timezone.now() - self.session.started_at
        return max(1, int(delta.total_seconds() // 60))

    @database_sync_to_async
    def _save_result(self, code, evaluation):
        self.session.final_code = code or ""
        self.session.evaluation = evaluation
        self.session.ended_at = timezone.now()
        self.session.save(update_fields=["final_code", "evaluation", "ended_at"])

    async def broadcast_result(self, evaluation):
        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "interview.result", "evaluation": evaluation},
        )

    async def interview_result(self, event):
        await self.send(text_data=json.dumps({"type": "interview_result", "evaluation": event["evaluation"]}))

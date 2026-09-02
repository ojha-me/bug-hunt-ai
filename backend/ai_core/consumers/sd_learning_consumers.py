import json
import uuid
import asyncio
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from ai_core.models import MessageSenderChoices, MessageTypeChoices, Conversation, ConversationTypeChoices
from ai_core.utils.auth_helpers import authenticate_user
from ai_core.utils.conversation_helpers import ConversationService
from system_design.models import SDLesson, UserSDCourse, SDLessonProgress, SDProgressStatus
from system_design.services.sd_tutor_service import SDTutorService

logger = logging.getLogger('system_design.consumers')


class SDSLessonChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.course_id = uuid.UUID(self.scope['url_route']['kwargs']['course_id'])
        self.lesson_id = uuid.UUID(self.scope['url_route']['kwargs']['lesson_id'])

        try:
            self.user = await authenticate_user(self.scope)
        except ValueError:
            await self.close(code=4001)
            return

        def get_or_create_progress():
            path = UserSDCourse.objects.get(
                user=self.user,
                course_id=self.course_id,
                is_active=True,
            )
            lesson = SDLesson.objects.get(pk=self.lesson_id, is_active=True)
            progress, created = SDLessonProgress.objects.prefetch_related('conversation').get_or_create(
                user_course=path,
                lesson=lesson,
                defaults={
                    'status': SDProgressStatus.LEARNING,
                    'started_at': timezone.now(),
                    'remaining_points': lesson.learning_objectives,
                    'covered_points': [],
                },
            )
            if not progress.conversation:
                conversation = Conversation.objects.create(
                    user=self.user,
                    title=f"System Design - {lesson.course.name}: {lesson.name}",
                    conversation_type=ConversationTypeChoices.SYSTEM_DESIGN_LEARNING,
                )
                progress.conversation = conversation
                progress.save()
            return path, progress, progress.conversation, lesson

        self.path, self.progress, self.conversation, self.lesson = await database_sync_to_async(get_or_create_progress)()

        self.room_group_name = f"conversation_{self.conversation.id}"
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        self.ai_service = SDTutorService()
        self.conversation_service = ConversationService()

        await self.accept()

        message_count = await database_sync_to_async(lambda: self.conversation.messages.count())()
        if message_count == 0:
            course_name = await database_sync_to_async(lambda: self.lesson.course.name)()
            greeting = await database_sync_to_async(self.ai_service.generate_greeting)(
                course_name=course_name,
                lesson_name=self.lesson.name,
                lesson_description=self.lesson.description,
                learning_objectives=self.lesson.learning_objectives,
            )
            greeting_content = greeting.get('greeting_message', f"Welcome to {self.lesson.name}! Let's get started.")
            greeting_msg = await self.conversation_service.save_message(
                conversation=self.conversation,
                sender=MessageSenderChoices.AI,
                content=greeting_content,
                message_type=MessageTypeChoices.CONVERSATION,
            )
            await self.broadcast_message(greeting_msg)

    async def disconnect(self, close_code):
        if hasattr(self, "room_group_name"):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get("action", "message")

        if action == "submit_diagram":
            await self.handle_diagram(data.get("diagram"))
            return
        if action == "next_lesson":
            await self.handle_next_lesson()
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
            lesson=self.lesson,
            user_course=self.path,
            message_content=message_content,
            diagram=None,
            context=context,
        )

        ai_message = await self.conversation_service.save_ai_message(
            self.conversation,
            json.dumps({
                "content": ai_data.get("content"),
                "type": ai_data.get("type", "explanation"),
                "diagram": ai_data.get("diagram"),
                "next_action": ai_data.get("next_action"),
            }),
            diagram=ai_data.get("diagram"),
        )
        await self.broadcast_event("done")
        await self.broadcast_message(ai_message)

        is_ready = await database_sync_to_async(self.ai_service.update_progress)(
            self.progress, ai_data.get("progress_update")
        )
        await self._broadcast_progress(is_ready)

    async def handle_diagram(self, diagram):
        if not diagram:
            return
        user_message = await self.conversation_service.save_user_message(
            self.conversation,
            "Here's my architecture diagram - please review it for this lesson.",
            diagram=diagram,
        )
        await self.broadcast_message(user_message)
        await self.broadcast_event("typing_start")
        await asyncio.sleep(1)

        context = await self._build_context()
        ai_data = await database_sync_to_async(self.ai_service.generate_response)(
            lesson=self.lesson,
            user_course=self.path,
            message_content="Review my drawn architecture diagram.",
            diagram=diagram,
            context=context,
        )

        ai_message = await self.conversation_service.save_ai_message(
            self.conversation,
            json.dumps({
                "content": ai_data.get("content"),
                "type": ai_data.get("type", "feedback"),
                "diagram": None,
            }),
            diagram=None,
        )
        await self.broadcast_event("done")
        await self.broadcast_message(ai_message)

        is_ready = await database_sync_to_async(self.ai_service.update_progress)(
            self.progress, ai_data.get("progress_update")
        )
        await self._broadcast_progress(is_ready)

    async def handle_next_lesson(self):
        result = await database_sync_to_async(self.ai_service.complete_and_advance)(
            self.path, self.lesson
        )

        if not result:
            return

        if result.get('moved'):
            next_lesson = result['next_lesson']
            new_greeting = await database_sync_to_async(self.ai_service.generate_greeting)(
                course_name=await database_sync_to_async(lambda: next_lesson.course.name)(),
                lesson_name=next_lesson.name,
                lesson_description=next_lesson.description,
                learning_objectives=next_lesson.learning_objectives,
            )
            transition_msg = await self.conversation_service.save_message(
                conversation=self.conversation,
                sender=MessageSenderChoices.AI,
                content=f"🎉 Nice work completing '{result['completed_lesson']}'! Let's move to the next lesson.",
                message_type=MessageTypeChoices.CONVERSATION,
            )
            await self.broadcast_message(transition_msg)

            greeting_msg = await self.conversation_service.save_message(
                conversation=self.conversation,
                sender=MessageSenderChoices.AI,
                content=new_greeting.get('greeting_message', f"Welcome to {next_lesson.name}!"),
                message_type=MessageTypeChoices.CONVERSATION,
            )
            await self.broadcast_message(greeting_msg)

            await self.broadcast_event("lesson_changed", json.dumps({
                "new_lesson": next_lesson.name,
                "new_lesson_id": str(next_lesson.id),
                "reference_diagram": next_lesson.reference_diagram,
                "completed_lesson": result['completed_lesson'],
            }))
        elif result.get('course_completed'):
            completion_msg = await self.conversation_service.save_message(
                conversation=self.conversation,
                sender=MessageSenderChoices.AI,
                content=f"🎓 Amazing work! You've completed the entire {self.lesson.course.name} course!",
                message_type=MessageTypeChoices.CONVERSATION,
            )
            await self.broadcast_message(completion_msg)
            await self.broadcast_event("course_completed", "Congratulations!")

    async def _build_context(self) -> str:
        messages = await database_sync_to_async(
            lambda: list(self.conversation.messages.order_by('-created_at')[:8])
        )()
        lines = []
        for msg in reversed(messages):
            lines.append(f"{msg.sender}: {msg.content[:400]}")
        return "\n".join(lines)

    async def _broadcast_progress(self, is_ready: bool):
        progress_data = {
            "ai_confidence": self.progress.ai_confidence,
            "covered_points": self.progress.covered_points,
            "remaining_points": self.progress.remaining_points,
            "progress_percentage": await database_sync_to_async(lambda: self.progress.progress_percentage)(),
            "is_ready_to_move_on": is_ready,
        }
        await self.broadcast_event("progress_update", json.dumps(progress_data))
        if is_ready:
            await self.broadcast_event("ready_for_next_lesson", "You're ready for the next lesson!")

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
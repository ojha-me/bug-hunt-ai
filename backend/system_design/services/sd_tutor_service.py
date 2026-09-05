import json
import logging
from django.utils import timezone
from ai_core.utils.groq_llm import GroqChat
from system_design.models import SDLessonProgress, SDProgressStatus, UserSDCourse, SDLesson
from system_design.utils.sd_prompts import SD_TUTOR_SYSTEM_PROMPT, SD_GREETING_PROMPT

logger = logging.getLogger('system_design.services')

AI_MODEL = "qwen/qwen3.8-27b"


class SDTutorService:
    def __init__(self):
        self.chat = GroqChat(model=AI_MODEL)

    def generate_greeting(self, course_name: str, lesson_name: str, lesson_description: str, learning_objectives) -> dict:
        prompt = SD_GREETING_PROMPT.format(
            course_name=course_name,
            lesson_name=lesson_name,
            lesson_description=lesson_description or "",
            learning_objectives=json.dumps(learning_objectives or []),
        )
        response = self.chat.send_message(message=prompt)
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        try:
            parsed = json.loads(text)
            if isinstance(parsed, dict) and parsed.get("greeting_message"):
                return parsed
        except json.JSONDecodeError:
            pass
        return {
            "greeting_message": f"Welcome to {lesson_name}! Let's get started."
        }

    def generate_response(self, lesson: SDLesson, user_course: UserSDCourse, message_content: str, diagram=None, context: str = "") -> dict:
        # progress context
        progress = SDLessonProgress.objects.filter(
            user_course=user_course, lesson=lesson
        ).first()

        objectives = lesson.learning_objectives or []
        if progress:
            progress_context = f"""
LESSON PROGRESS TRACKING:
- Learning Objectives: {objectives}
- Covered Points: {progress.covered_points}
- Remaining Points: {progress.remaining_points}
- AI Confidence: {progress.ai_confidence:.2f} (0.0-1.0)
- Status: {progress.status}
- Ready to move on when remaining is empty and confidence >= 0.8.
"""
        else:
            progress_context = f"""
LESSON PROGRESS TRACKING:
- Learning Objectives: {objectives}
- Covered Points: []
- Remaining Points: {objectives}
- AI Confidence: 0.00
- Status: not_started
- This is a new lesson. Initialize remaining_points with all objectives.
"""

        diagram_block = ""
        if diagram:
            diagram_block = (
                "\n\nThe learner drew this architecture on their whiteboard. TEACH through a review: "
                "name each component, its role, what's missing or could improve, and trade-offs. Be specific and constructive.\n"
                f"DIAGRAM NODES:\n{json.dumps(diagram.get('nodes', []))}\n"
                f"DIAGRAM EDGES:\n{json.dumps(diagram.get('edges', []))}\n"
            )

        prompt = f"""
{SD_TUTOR_SYSTEM_PROMPT}

You are teaching: {lesson.course.name} - {lesson.name}
Lesson description: {lesson.description}

{progress_context}

REFERENCE DIAGRAM (available on the learner's whiteboard):
{json.dumps(lesson.reference_diagram or {})}

RECENT CONVERSATION:
{context or "(new session)"}

{diagram_block}

STUDENT'S MESSAGE: {message_content}

Always include a "progress_update" object in your JSON response.
"""

        response = self.chat.send_message(message=prompt)
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

        try:
            parsed = json.loads(text)
        except json.JSONDecodeError:
            return {
                "content": text,
                "type": "explanation",
                "diagram": None,
                "progress_update": None,
            }

        return {
            "content": parsed.get("content", text),
            "type": parsed.get("type", "explanation"),
            "diagram": parsed.get("diagram"),
            "progress_update": parsed.get("progress_update"),
        }

    def update_progress(self, progress: SDLessonProgress, progress_update: dict | None):
        if not progress_update:
            return progress.is_ready_to_move_on

        if "covered_points" in progress_update:
            progress.covered_points = progress_update["covered_points"]
        if "remaining_points" in progress_update:
            progress.remaining_points = progress_update["remaining_points"]
        if "ai_confidence" in progress_update:
            conf = float(progress_update["ai_confidence"])
            progress.ai_confidence = max(0.0, min(1.0, conf))
        if progress.status == SDProgressStatus.NOT_STARTED:
            progress.status = SDProgressStatus.LEARNING
            if not progress.started_at:
                progress.started_at = timezone.now()
        progress.save()
        return progress.is_ready_to_move_on

    def complete_and_advance(self, user_course: UserSDCourse, current_lesson: SDLesson) -> dict:
        progress = SDLessonProgress.objects.filter(
            user_course=user_course, lesson=current_lesson
        ).first()
        if progress and progress.status != SDProgressStatus.COMPLETED:
            progress.status = SDProgressStatus.COMPLETED
            progress.completed_at = timezone.now()
            progress.ai_confidence = max(progress.ai_confidence, 0.8)
            progress.remaining_points = []
            progress.save()

        next_lesson = SDLesson.objects.filter(
            course=user_course.course,
            order__gt=current_lesson.order,
            is_active=True,
        ).order_by("order").first()

        if next_lesson:
            user_course.current_lesson = next_lesson
            user_course.save()
            SDLessonProgress.objects.get_or_create(
                user_course=user_course,
                lesson=next_lesson,
                defaults={
                    "status": SDProgressStatus.LEARNING,
                    "started_at": timezone.now(),
                    "remaining_points": next_lesson.learning_objectives,
                    "covered_points": [],
                },
            )
            return {"moved": True, "next_lesson": next_lesson, "completed_lesson": current_lesson.name}

        user_course.completed_at = timezone.now()
        user_course.is_active = False
        user_course.save()
        return {"moved": False, "course_completed": True, "completed_lesson": current_lesson.name}

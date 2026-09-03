import json
from uuid import UUID
from typing import List, Optional, Dict
from django.http import HttpRequest
from django.shortcuts import get_object_or_404
from ninja import Router
from users.utils.ninja import get, post
from ai_core.models import Conversation, ConversationTypeChoices
from system_design.models import (
    SDCourse, SDLesson, SDCaseStudy, UserSDCourse, SDLessonProgress, SDProgressStatus,
    SDPracticeSession, ComponentTutorSession, ComponentProgress, COMPONENT_KINDS,
)
from system_design.api_types import (
    SDCourseResponse,
    SDCourseDetailResponse,
    UserSDCourseResponse,
    SDCaseStudySummary,
    SDCaseStudyDetail,
    CreateSDPracticeSchema,
    SDPracticeSessionResponse,
    ComponentTutorCreate,
    ComponentTutorResponse,
    MarkComponentSchema,
    ComponentProgressResponse,
)
from django.utils import timezone

router = Router(tags=["system-design"])


def _sdcourse_response(course: SDCourse) -> SDCourseResponse:
    return SDCourseResponse(
        id=course.id,
        name=course.name,
        description=course.description,
        order=course.order,
        is_active=course.is_active,
        lessons_count=course.lessons.filter(is_active=True).count(),
    )


def _sdlesson_response(lesson: SDLesson):
    from system_design.api_types import SDLessonResponse
    return SDLessonResponse(
        id=lesson.id,
        name=lesson.name,
        description=lesson.description,
        order=lesson.order,
        learning_objectives=lesson.learning_objectives,
        reference_diagram=lesson.reference_diagram,
    )


def _user_sd_course_response(path: UserSDCourse) -> UserSDCourseResponse:
    from system_design.api_types import SDLessonProgressResponse

    progress = []
    for p in path.progress.all():
        progress.append(SDLessonProgressResponse(
            id=p.id,
            lesson=_sdlesson_response(p.lesson),
            conversation_id=p.conversation_id,
            status=p.status,
            ai_confidence=p.ai_confidence,
            covered_points=p.covered_points,
            remaining_points=p.remaining_points,
            started_at=p.started_at,
            completed_at=p.completed_at,
        ))

    current_lesson = _sdlesson_response(path.current_lesson) if path.current_lesson else None

    return UserSDCourseResponse(
        id=path.id,
        course=_sdcourse_response(path.course),
        conversation_id=path.conversation_id,
        current_lesson=current_lesson,
        progress_percentage=path.progress_percentage,
        is_completed=path.is_completed,
        started_at=path.started_at,
        completed_at=path.completed_at,
        is_active=path.is_active,
        progress=progress,
    )


@get(router, "/courses", response={200: List[SDCourseResponse], 401: Dict[str, str]})
def get_available_courses(request: HttpRequest):
    courses = SDCourse.objects.filter(is_active=True)
    return [_sdcourse_response(c) for c in courses]


@get(router, "/courses/{course_id}", response={200: SDCourseDetailResponse, 401: Dict[str, str], 404: Dict[str, str]})
def get_course_detail(request: HttpRequest, course_id: UUID):
    course = get_object_or_404(SDCourse, id=course_id, is_active=True)
    lessons = course.lessons.filter(is_active=True).order_by("order")
    return SDCourseDetailResponse(
        id=course.id,
        name=course.name,
        description=course.description,
        order=course.order,
        is_active=course.is_active,
        lessons=[_sdlesson_response(l) for l in lessons],
    )


@get(router, "/user-courses", response={200: List[UserSDCourseResponse], 401: Dict[str, str]})
def get_user_courses(request: HttpRequest):
    paths = UserSDCourse.objects.filter(user=request.user, is_active=True).prefetch_related("progress")
    return [_user_sd_course_response(p) for p in paths]


@post(router, "/enroll", response={200: UserSDCourseResponse, 401: Dict[str, str], 404: Dict[str, str]})
def enroll_in_course(request: HttpRequest, course_id: UUID):
    course = get_object_or_404(SDCourse, id=course_id, is_active=True)

    existing = UserSDCourse.objects.filter(user=request.user, course=course).first()
    if existing:
        return _user_sd_course_response(existing)

    first_lesson = course.lessons.filter(is_active=True).order_by("order").first()
    path = UserSDCourse.objects.create(
        user=request.user,
        course=course,
        conversation=Conversation.objects.create(
            user=request.user,
            title=f"System Design: {course.name}",
            conversation_type=ConversationTypeChoices.SYSTEM_DESIGN_LEARNING,
        ),
        current_lesson=first_lesson,
    )
    if first_lesson:
        SDLessonProgress.objects.create(
            user_course=path,
            lesson=first_lesson,
            status=SDProgressStatus.LEARNING,
            started_at=timezone.now(),
            remaining_points=first_lesson.learning_objectives,
            covered_points=[],
        )

    return _user_sd_course_response(path)


@get(router, "/user-courses/{course_id}/lessons/{lesson_id}/messages", response={200: List[Dict], 401: Dict[str, str], 404: Dict[str, str]})
def get_lesson_messages(request: HttpRequest, course_id: UUID, lesson_id: UUID):
    path = get_object_or_404(UserSDCourse, user=request.user, course_id=course_id, is_active=True)
    progress = SDLessonProgress.objects.filter(user_course=path, lesson_id=lesson_id).first()
    if not progress or not progress.conversation:
        return []

    messages = progress.conversation.messages.all().order_by("created_at")
    result = []
    for message in messages:
        content = message.content
        message_type = None
        next_action = None
        diagram = message.diagram
        try:
            parsed = json.loads(content)
            if isinstance(parsed, dict):
                content = parsed.get("content", content)
                message_type = parsed.get("type")
                next_action = parsed.get("next_action")
        except (json.JSONDecodeError, TypeError):
            pass

        result.append({
            "id": str(message.id),
            "sender": message.sender,
            "content": content,
            "timestamp": message.created_at.isoformat(),
            "code_snippet": message.code_snippet,
            "language": message.language,
            "type": message_type,
            "next_action": next_action,
            "diagram": diagram,
        })
    return result


# ---------------- Case Studies ----------------


def _case_study_summary(case: SDCaseStudy):
    return SDCaseStudySummary(
        id=case.id,
        title=case.title,
        slug=case.slug,
        difficulty=case.difficulty,
        topics=case.topics,
        overview=case.overview,
    )


@get(router, "/case-studies", response={200: List[SDCaseStudySummary], 401: Dict[str, str]})
def get_case_studies(request: HttpRequest):
    cases = SDCaseStudy.objects.filter(is_active=True)
    return [_case_study_summary(c) for c in cases]


@get(router, "/case-studies/{case_id}",
     response={200: SDCaseStudyDetail, 401: Dict[str, str], 404: Dict[str, str]})
def get_case_study(request: HttpRequest, case_id: UUID):
    case = get_object_or_404(SDCaseStudy, id=case_id, is_active=True)
    return SDCaseStudyDetail(
        id=case.id,
        title=case.title,
        slug=case.slug,
        difficulty=case.difficulty,
        topics=case.topics,
        overview=case.overview,
        functional_requirements=case.functional_requirements,
        non_functional_requirements=case.non_functional_requirements,
        capacity=case.capacity,
        key_components=case.key_components,
        tradeoffs=case.tradeoffs,
        reference_diagram=case.reference_diagram,
    )


# ---------------- Guided Practice (5-phase thinking system) ----------------

def _case_study_detail(case: SDCaseStudy) -> SDCaseStudyDetail:
    return SDCaseStudyDetail(
        id=case.id,
        title=case.title,
        slug=case.slug,
        difficulty=case.difficulty,
        topics=case.topics,
        overview=case.overview,
        functional_requirements=case.functional_requirements,
        non_functional_requirements=case.non_functional_requirements,
        capacity=case.capacity,
        key_components=case.key_components,
        tradeoffs=case.tradeoffs,
        reference_diagram=case.reference_diagram,
    )


def _practice_response(session: SDPracticeSession) -> SDPracticeSessionResponse:
    return SDPracticeSessionResponse(
        id=session.id,
        case_study=_case_study_detail(session.case_study),
        conversation_id=session.conversation_id,
        current_phase=session.current_phase,
        phase_states=session.phase_states,
        weak_areas=session.weak_areas,
        status=session.status,
        started_at=session.started_at,
        completed_at=session.completed_at,
    )


@get(router, "/practice-sessions", response={200: List[SDPracticeSessionResponse], 401: Dict[str, str]})
def get_practice_sessions(request: HttpRequest):
    sessions = SDPracticeSession.objects.filter(user=request.user).select_related("case_study", "conversation")
    return [_practice_response(s) for s in sessions]


@post(router, "/practice-sessions", response={200: SDPracticeSessionResponse, 401: Dict[str, str], 404: Dict[str, str]})
def create_practice_session(request: HttpRequest, params: CreateSDPracticeSchema):
    case = get_object_or_404(SDCaseStudy, id=params.case_study_id, is_active=True)
    existing = SDPracticeSession.objects.filter(
        user=request.user, case_study=case, status="in_progress"
    ).first()
    if existing:
        return _practice_response(existing)

    conversation = Conversation.objects.create(
        user=request.user,
        title=f"Practice: {case.title}",
        conversation_type=ConversationTypeChoices.SYSTEM_DESIGN_PRACTICE,
    )
    session = SDPracticeSession.objects.create(
        user=request.user,
        case_study=case,
        conversation=conversation,
    )
    return _practice_response(session)


# ---------------- Component tutor + progress ----------------

@post(router, "/component-tutor", response={200: ComponentTutorResponse, 400: Dict[str, str], 401: Dict[str, str]})
def create_component_tutor(request: HttpRequest, params: ComponentTutorCreate):
    if params.kind not in COMPONENT_KINDS:
        return 400, {"detail": f"Unknown component: {params.kind}"}

    conversation = Conversation.objects.create(
        user=request.user,
        title=f"Tutor: {params.kind.replace('_', ' ').title()}",
        conversation_type=ConversationTypeChoices.COMPONENT_TUTOR,
    )
    ComponentTutorSession.objects.create(
        user=request.user,
        conversation=conversation,
        component_kind=params.kind,
    )
    return ComponentTutorResponse(conversation_id=conversation.id)


@get(router, "/component-progress", response={200: List[ComponentProgressResponse], 401: Dict[str, str]})
def get_component_progress(request: HttpRequest):
    rows = ComponentProgress.objects.filter(user=request.user)
    return [ComponentProgressResponse(component_kind=r.component_kind, completed_at=r.completed_at) for r in rows]


@post(router, "/component-progress", response={200: ComponentProgressResponse, 400: Dict[str, str], 401: Dict[str, str]})
def mark_component_progress(request: HttpRequest, params: MarkComponentSchema):
    if params.kind not in COMPONENT_KINDS:
        return 400, {"detail": f"Unknown component: {params.kind}"}
    row, _ = ComponentProgress.objects.get_or_create(user=request.user, component_kind=params.kind)
    return ComponentProgressResponse(component_kind=row.component_kind, completed_at=row.completed_at)

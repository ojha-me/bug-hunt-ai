from ninja import Schema
from typing import List, Optional
from datetime import datetime, timedelta
from uuid import UUID


class SDCourseResponse(Schema):
    id: UUID
    name: str
    description: str
    order: int
    is_active: bool
    lessons_count: Optional[int] = 0


class SDLessonResponse(Schema):
    id: UUID
    name: str
    description: str
    order: int
    learning_objectives: List[str] = []
    reference_diagram: Optional[dict] = None


class SDCourseDetailResponse(Schema):
    id: UUID
    name: str
    description: str
    order: int
    is_active: bool
    lessons: List[SDLessonResponse] = []


class SDLessonProgressResponse(Schema):
    id: UUID
    lesson: SDLessonResponse
    conversation_id: Optional[UUID] = None
    status: str
    ai_confidence: float = 0.0
    covered_points: List[str] = []
    remaining_points: List[str] = []
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class UserSDCourseResponse(Schema):
    id: UUID
    course: SDCourseResponse
    conversation_id: Optional[UUID] = None
    current_lesson: Optional[SDLessonResponse] = None
    progress_percentage: float = 0.0
    is_completed: bool = False
    started_at: datetime
    completed_at: Optional[datetime] = None
    is_active: bool = True
    progress: List[SDLessonProgressResponse] = []


class SDCaseStudySummary(Schema):
    id: UUID
    title: str
    slug: str
    difficulty: str
    topics: List[str] = []
    overview: str = ""


class SDCaseStudyDetail(SDCaseStudySummary):
    functional_requirements: List[str] = []
    non_functional_requirements: List[str] = []
    capacity: dict = {}
    key_components: List[dict] = []
    tradeoffs: List[str] = []
    reference_diagram: Optional[dict] = None


class CreateSDPracticeSchema(Schema):
    case_study_id: UUID


class SDPracticeSessionResponse(Schema):
    id: UUID
    case_study: SDCaseStudyDetail
    conversation_id: UUID
    current_phase: int = 1
    phase_states: dict = {}
    weak_areas: List[str] = []
    status: str = "in_progress"
    started_at: datetime
    completed_at: Optional[datetime] = None


class ComponentTutorCreate(Schema):
    kind: str


class ComponentTutorResponse(Schema):
    conversation_id: UUID


class MarkComponentSchema(Schema):
    kind: str


class ComponentProgressResponse(Schema):
    component_kind: str
    completed_at: datetime

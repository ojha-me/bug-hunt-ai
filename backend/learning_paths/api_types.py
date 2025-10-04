from ninja import Schema
from typing import List, Optional
from datetime import datetime, timedelta
from uuid import UUID


class LearningObjectiveSchema(Schema):
    objective: str


class LearningTopicResponse(Schema):
    id: UUID
    name: str
    description: str
    difficulty_level: str
    estimated_duration: timedelta
    is_active: bool
    created_at: datetime
    subtopics_count: Optional[int]
    prerequisites: List['LearningTopicResponse'] = []

class LearningTopicDetailResponse(Schema):
    id: UUID
    name: str
    description: str
    difficulty_level: str
    estimated_duration: timedelta
    is_active: bool
    created_at: datetime
    subtopics: List['LearningSubtopicResponse'] = []

class LearningSubtopicResponse(Schema):
    id: UUID
    name: str
    description: str
    order: int
    learning_objectives: List[str]
    estimated_duration: timedelta
    is_active: bool


class SubtopicProgressResponse(Schema):
    id: UUID
    subtopic: LearningSubtopicResponse
    status: str
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    challenges_completed: int
    challenges_attempted: int
    challenge_success_rate: float
    notes: str


class UserLearningPathResponse(Schema):
    id: UUID
    topic: LearningTopicResponse
    conversation_id: UUID
    current_subtopic: Optional[LearningSubtopicResponse]
    progress_percentage: float
    is_completed: bool
    started_at: datetime
    completed_at: Optional[datetime]
    is_active: bool
    progress: List[SubtopicProgressResponse]


class CreateLearningPathRequest(Schema):
    topic_id: UUID


class GenerateTopicPathRequest(Schema):
    topic_name: str
    user_level: str  # beginner, intermediate, advanced
    specific_goals: Optional[List[str]] = []


class UpdateProgressRequest(Schema):
    subtopic_id: UUID
    status: str
    notes: Optional[str] = ""


class StartSubtopicRequest(Schema):
    subtopic_id: UUID


class CompleteSubtopicRequest(Schema):
    subtopic_id: UUID
    challenges_completed: Optional[int] = 0
    challenges_attempted: Optional[int] = 0
    notes: Optional[str] = ""


# Update the forward reference
LearningTopicResponse.model_rebuild()

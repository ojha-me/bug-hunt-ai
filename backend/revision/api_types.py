from ninja import Schema
from typing import List, Optional
from datetime import datetime
from uuid import UUID


class RevisionItemOut(Schema):
    id: int
    problem_id: Optional[UUID] = None
    title: str
    difficulty: str
    topics: List[str]
    repetitions: int
    ease: float
    interval_days: int
    due_at: datetime
    last_reviewed_at: Optional[datetime] = None


class ReviewIn(Schema):
    quality: int  # 0..5


class ReviewOut(Schema):
    id: int
    interval_days: int
    ease: float
    repetitions: int
    due_at: datetime
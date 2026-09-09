from ninja import Schema
from typing import List, Optional
from uuid import UUID
from datetime import datetime


class ResumeOut(Schema):
    id: UUID
    name: str
    content: str
    is_primary: bool
    updated_at: datetime


class ResumeSummary(Schema):
    id: UUID
    name: str
    is_primary: bool
    updated_at: datetime


class CreateResumeSchema(Schema):
    name: str = "My Resume"
    content: str = ""
    is_primary: bool = False


class UpdateResumeSchema(Schema):
    name: Optional[str] = None
    content: Optional[str] = None
    is_primary: Optional[bool] = None


class ReviewIn(Schema):
    job_description: str
    resume_id: Optional[UUID] = None
    resume_content: Optional[str] = None  # used when no resume_id is given
    role_title: Optional[str] = None


class BulletRewrite(Schema):
    before: str = ""
    after: str = ""


class ReviewFeedback(Schema):
    match_score: int = 0
    summary: str = ""
    matched_keywords: List[str] = []
    missing_keywords: List[str] = []
    strengths: List[str] = []
    gaps: List[str] = []
    bullet_rewrites: List[BulletRewrite] = []
    tailoring_tips: List[str] = []


class TailoredBullet(Schema):
    context: str = ""
    text: str = ""


class TailoredPieces(Schema):
    summary: str = ""
    skills: str = ""
    bullets: List[TailoredBullet] = []


class ReviewOut(Schema):
    id: UUID
    role_title: str
    job_description: str
    resume_id: Optional[UUID] = None
    feedback: ReviewFeedback
    tailored: Optional[TailoredPieces] = None
    created_at: datetime


class ReviewSummary(Schema):
    id: UUID
    role_title: str
    match_score: int
    created_at: datetime

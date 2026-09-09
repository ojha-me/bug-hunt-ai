from ninja import Schema
from typing import List, Optional
from uuid import UUID


class CodingProblemSummary(Schema):
    id: UUID
    title: str
    slug: str
    difficulty: str
    topics: List[str]
    stats: Optional[dict] = None


class CodingProblemDetail(CodingProblemSummary):
    description: str
    examples: List[dict]
    constraints: List[str]
    starter_code: str
    test_cases: List[dict]


class CreateMockInterviewSchema(Schema):
    problem_id: Optional[UUID] = None
    difficulty: Optional[str] = None  # "easy" | "medium" | "hard" — used when problem_id is absent
    list_slug: Optional[str] = None
    duration_minutes: int = 35


class MockInterviewResponse(Schema):
    id: UUID
    conversation_id: UUID
    problem: CodingProblemDetail
    duration_minutes: int
    evaluation: Optional[dict] = None
    final_code: str = ""


class SubmitParams(Schema):
    code: str
    language: str = "python"


class ProblemAttemptOut(Schema):
    id: UUID
    verdict: str
    passed_count: int
    total_count: int
    execution_time_ms: Optional[int] = None
    submitted_at: str
    code: str = ""


class MyProgressOut(Schema):
    problem_id: UUID
    title: str
    difficulty: str
    topics: List[str]
    solved: bool
    attempts: int
    best_passed: int = 0
    best_total: int = 0


class SolutionOut(Schema):
    code: str = ""
    explanation: str = ""
    complexity: str = ""
    available: bool = False


class ProblemListOut(Schema):
    slug: str
    name: str
    description: str = ""
    problem_slugs: List[str] = []
    count: int = 0


class TutorChatIn(Schema):
    message: str = ""
    code: str = ""


class TutorHistoryOut(Schema):
    history: List[dict] = []


class TutorChatOut(TutorHistoryOut):
    reply: str
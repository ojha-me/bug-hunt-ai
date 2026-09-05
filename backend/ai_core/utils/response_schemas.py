from typing import Optional, List, Literal
from pydantic import BaseModel, Field

# Shared progress schema used by all tutors
class ProgressUpdate(BaseModel):
    covered_points: List[str] = Field(default_factory=list)
    remaining_points: List[str] = Field(default_factory=list)
    ai_confidence: float = Field(ge=0.0, le=1.0, default=0.0)
    notes: str = ""

class DiagramNode(BaseModel):
    id: str
    kind: Optional[str] = "service"
    position: Optional[dict] = None
    data: Optional[dict] = None

class DiagramEdge(BaseModel):
    id: str
    source: str
    target: str
    label: Optional[str] = None

class Diagram(BaseModel):
    nodes: List[DiagramNode]
    edges: List[DiagramEdge]

class TutorResponse(BaseModel):
    type: Literal["explanation", "question", "challenge", "feedback", "encouragement", "assessment", "conversation", "hint"] = "explanation"
    content: str
    code: Optional[str] = None
    language: Optional[str] = None
    next_action: Optional[str] = None
    diagram: Optional[Diagram] = None
    progress_update: Optional[ProgressUpdate] = None

class PracticeResponse(BaseModel):
    content: str
    complete: bool = False
    phase_summary: Optional[str] = None
    notes: Optional[str] = None

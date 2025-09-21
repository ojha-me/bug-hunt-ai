from ninja import Schema
from datetime import datetime
from uuid import UUID
from typing import Optional, List

class CreateConversationSchema(Schema):
    id: UUID
    title: str


class MessageResponse(Schema):
    id: UUID
    sender: str
    content: str
    code_snippet: Optional[str]
    timestamp: datetime

class ConversationResponse(Schema):
    id: UUID
    title: str
    created_at: datetime
    last_active_at: datetime
    messages: Optional[List[MessageResponse]]

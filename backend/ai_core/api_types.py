from ninja import Schema
from datetime import datetime
from uuid import UUID

class CreateConversationSchema(Schema):
    id: UUID
    title: str


class ConversationResponse(Schema):
    id: UUID
    title: str
    created_at: datetime
    last_active_at: datetime

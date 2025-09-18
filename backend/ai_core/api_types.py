from ninja import Schema
from datetime import datetime

class CreateConversationSchema(Schema):
    title: str


class ConversationResponse(Schema):
    id: int
    title: str
    created_at: datetime
        
from ninja import Router
from ai_core.models import Conversation
from ai_core.api_types import ConversationResponse, CreateConversationSchema
from django.http import HttpRequest, HttpResponse

from users.utils.ninja import post, get
from typing import Dict


router = Router(tags=["conversation"])


@get(router, "/", response={200: list[ConversationResponse], 401: Dict[str, str]})
def list_conversations(request: HttpRequest):
    conversations = Conversation.objects.filter(user=request.user)
    print("Conversations", conversations)
    response = [
        ConversationResponse(
            id=conversation.id,
            title=conversation.title,
            created_at=conversation.created_at,
            last_active_at=conversation.last_active_at
        )
        for conversation in conversations
    ]
    return response



@get(router, "/{conversation_id}/", response={200: ConversationResponse, 401: Dict[str, str]})
def get_conversation(request: HttpRequest, conversation_id: int):
    conversation = Conversation.objects.get(id=conversation_id)
    
    response = ConversationResponse(
        id=conversation.id,
        title=conversation.title,
        created_at=conversation.created_at,
        last_active_at=conversation.last_active_at
    )
    return response


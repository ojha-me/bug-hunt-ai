from ninja import Router
from ai_core.models import Conversation
from ai_core.api_types import ConversationResponse, CreateConversationSchema
from django.http import HttpRequest, HttpResponse

from users.utils.ninja import post


router = Router(tags=["conversation"])


@post(router, "/", response=ConversationResponse)
def create_conversation(request: HttpRequest, params: CreateConversationSchema):
    conversation = Conversation.objects.create(user=request.user, title=params.title)
    return conversation


# @router.get("/", response=list[ConversationResponse])
# def list_conversations(request: HttpRequest):
#     conversations = Conversation.objects.filter(user=request.user)
#     response = [
#         ConversationResponse(
#             id=conversation.id,
#             title=conversation.title,
#             created_at=conversation.created_at,
#             last_active_at=conversation.last_active_at
#         )
#         for conversation in conversations
#     ]
#     return response



# @router.get("/{conversation_id}/", response=ConversationResponse)
# def get_conversation(request: HttpRequest, conversation_id: int):
#     conversation = Conversation.objects.get(id=conversation_id)
    
#     response = ConversationResponse(
#         id=conversation.id,
#         title=conversation.title,
#         created_at=conversation.created_at,
#         last_active_at=conversation.last_active_at
#     )
#     return response


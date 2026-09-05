from uuid import UUID, uuid4
from ninja import Router
from ai_core.models import Conversation
from ai_core.api_types import ConversationResponse, MessageResponse, CreateConversationSchema, UpdateConversationTitleSchema
from django.http import HttpRequest
from django.shortcuts import get_object_or_404
from users.utils.ninja import post, get, put, delete
from typing import Dict
import logging

logger = logging.getLogger('ai_core.conversation')

router = Router(tags=["conversation"])


@get(router, "/get-conversations", response={200: list[ConversationResponse], 401: Dict[str, str]})
def get_conversations(request: HttpRequest):
    conversations = Conversation.objects.filter(user=request.user).prefetch_related("messages").order_by("-last_active_at")
    response = [
        ConversationResponse(
            id=conversation.id,
            title=conversation.title,
            created_at=conversation.created_at,
            last_active_at=conversation.last_active_at,
            conversation_type=conversation.conversation_type,
            messages=[
                MessageResponse(
                    id=message.id,
                    sender=message.sender,
                    content=message.content,
                    code_snippet=message.code_snippet,
                    timestamp=message.created_at,
                    language=message.language if message.language else None,
                    diagram=message.diagram
                )
                for message in conversation.messages.all()
            ] or []
        )
        for conversation in conversations
    ]
    return response



@get(router, "/{conversation_id}/", response={200: ConversationResponse, 401: Dict[str, str], 404: Dict[str, str]})
def get_conversation(request: HttpRequest, conversation_id: UUID):
    conversation = get_object_or_404(Conversation, id=conversation_id, user=request.user)
    if conversation is None:
        conversation = Conversation.objects.create(user=request.user, title="New Conversation")
        
    response = ConversationResponse(
        id=conversation.id,
        title=conversation.title,
        created_at=conversation.created_at,
        last_active_at=conversation.last_active_at,
        conversation_type=conversation.conversation_type,
        messages=[
            MessageResponse(
                id=message.id,
                sender=message.sender,
                content=message.content,
                code_snippet=message.code_snippet,
                timestamp=message.created_at,
                language=message.language if message.language else None,
                diagram=message.diagram
            )
            for message in conversation.messages.all()
        ]
    )
    return response


@post(router, "create-conversation", response={200: ConversationResponse, 401: Dict[str, str]})
def create_conversation(request: HttpRequest, params: CreateConversationSchema = None):
    from ai_core.models import ConversationTypeChoices
    conversation_type = getattr(params, 'conversation_type', None) or ConversationTypeChoices.GENERAL
    conversation_id = getattr(params, 'id', None) or uuid4()
    title = getattr(params, 'title', None) or "New Conversation"
    conversation = Conversation.objects.create(
        user=request.user,
        id=conversation_id,
        title=title,
        conversation_type=conversation_type,
    )
    response = ConversationResponse(
        id=conversation.id,
        title=conversation.title,
        created_at=conversation.created_at,
        last_active_at=conversation.last_active_at,
        conversation_type=conversation.conversation_type,
        messages=[]
    )
    return response


@put(router, "/{conversation_id}/update-title", response={200: ConversationResponse, 401: Dict[str, str], 404: Dict[str, str]})
def update_conversation_title(request: HttpRequest, params: UpdateConversationTitleSchema):
    conversation = get_object_or_404(Conversation, id=params.conversation_id, user=request.user)
    conversation.title = params.title
    conversation.save()
    response = ConversationResponse(
        id=conversation.id,
        title=conversation.title,
        created_at=conversation.created_at,
        last_active_at=conversation.last_active_at,
        conversation_type=conversation.conversation_type,
        messages=[
            MessageResponse(
                id=message.id,
                sender=message.sender,
                content=message.content,
                code_snippet=message.code_snippet,
                timestamp=message.created_at,
                language=message.language if message.language else None,
                diagram=message.diagram
            )
            for message in conversation.messages.all()
        ]
    )
    return response


@delete(router, "/{conversation_id}/", response={204: None, 401: Dict[str, str], 404: Dict[str, str]})
def delete_conversation(request: HttpRequest, conversation_id: UUID):
    conversation = get_object_or_404(Conversation, id=conversation_id, user=request.user)
    conversation.delete()
    return 204, None

from uuid import UUID
from ninja import Router
from django.http import HttpRequest
from django.shortcuts import get_object_or_404
from django.utils import timezone
from users.utils.ninja import post, get, put, delete
from users.utils.ninja import post
from learning_paths.services.learning_path_service import LearningPathSaver
from learning_paths.services.learning_path_ai_services import LearningPathAI
from typing import Dict, List, Optional
from django.db import transaction
import logging
import asyncio

from .models import (
    LearningTopic, 
    UserLearningPath, 
    SubtopicProgress,
    SubtopicProgressChoices
)
from .api_types import (
    LearningTopicResponse,
    LearningSubtopicResponse,
    UserLearningPathResponse,
    LearningTopicDetailResponse,
    SubtopicProgressResponse,
    CreateLearningPathRequest,
    UpdateProgressRequest,
)
from ai_core.models import Conversation, ConversationTypeChoices

logger = logging.getLogger('learning_paths.api')

router = Router(tags=["learning_paths"])



@post(router, "/generate-learning-path", response={200: LearningTopicResponse})
def generate_learning_path(request, query: str):
    learning_path_ai = LearningPathAI()

    ai_output = asyncio.run(learning_path_ai.generate_learning_path(query))

    with transaction.atomic():
        topic = LearningPathSaver.save_learning_path(ai_output, request.user)
    response = LearningTopicResponse(
        id=topic.id,
        name=topic.name,
        description=topic.description,
        difficulty_level=topic.difficulty_level,
        estimated_duration=topic.estimated_duration,
        is_active=topic.is_active,
        created_at=topic.created_at,
        subtopics_count=topic.subtopics.filter(is_active=True).count(),
        prerequisites=[
                LearningTopicResponse(
                    id=prereq.id,
                    name=prereq.name,
                    description=prereq.description,
                    difficulty_level=prereq.difficulty_level,
                    estimated_duration=prereq.estimated_duration,
                    is_active=prereq.is_active,
                    created_at=prereq.created_at,
                    subtopics_count=prereq.subtopics.filter(is_active=True).count(),
                    prerequisites=[]
                ) for prereq in topic.prerequisites.all()
            ]
    )
    return response

@get(router, "/topics", response={200: List[LearningTopicResponse], 401: Dict[str, str]})
def get_available_topics(request: HttpRequest):
    """Get all available learning topics"""
    topics = LearningTopic.objects.filter(is_active=True).prefetch_related('prerequisites')
    
    response = []
    for topic in topics:
        response.append(LearningTopicResponse(
            id=topic.id,
            name=topic.name,
            description=topic.description,
            difficulty_level=topic.difficulty_level,
            estimated_duration=topic.estimated_duration,
            is_active=topic.is_active,
            created_at=topic.created_at,
            subtopics_count=topic.subtopics.filter(is_active=True).count(),
            prerequisites=[
                LearningTopicResponse(
                    id=prereq.id,
                    name=prereq.name,
                    description=prereq.description,
                    difficulty_level=prereq.difficulty_level,
                    estimated_duration=prereq.estimated_duration,
                    is_active=prereq.is_active,
                    created_at=prereq.created_at,
                    subtopics_count=prereq.subtopics.filter(is_active=True).count(),
                    prerequisites=[]
                ) for prereq in topic.prerequisites.all()
            ]
        ))
    
    return response

@get(router, "/topics/{topic_id}", response={200: LearningTopicDetailResponse, 401: Dict[str, str], 404: Dict[str, str]})
def get_topic_details(request: HttpRequest, topic_id: UUID):
    """Get the topic details"""
    topic = get_object_or_404(LearningTopic, id=topic_id, is_active=True)
    subtopics = topic.subtopics.filter(is_active=True).order_by('order')
    
    response = LearningTopicDetailResponse(
        id=topic.id,
        name=topic.name,
        description=topic.description,
        difficulty_level=topic.difficulty_level,
        estimated_duration=topic.estimated_duration,
        is_active=topic.is_active,
        created_at=topic.created_at,
        subtopics=[
            LearningSubtopicResponse(
                id=subtopic.id,
                name=subtopic.name,
                description=subtopic.description,
                order=subtopic.order,
                learning_objectives=subtopic.learning_objectives,
                estimated_duration=subtopic.estimated_duration,
                is_active=subtopic.is_active
            ) for subtopic in subtopics
        ]
    )
    
    return response


@get(router, "/user-learning-paths", response={200: List[UserLearningPathResponse], 401: Dict[str, str]})
def get_user_learning_paths(request: HttpRequest, topic_id: Optional[UUID] = None):
    """Get all learning paths for the current user"""
    filters = {'user': request.user, 'is_active': True}

    if topic_id:
        topic = get_object_or_404(LearningTopic, id=topic_id, is_active=True)
        filters['topic'] = topic

    paths = (
        UserLearningPath.objects
        .filter(**filters)
        .select_related('topic', 'current_subtopic', 'conversation')
        .prefetch_related('progress__subtopic', 'topic__subtopics')
        .order_by('-started_at')
    )

    response = []
    for path in paths:
        # Build progress data
        progress_data = []
        for progress in path.progress.all():
            progress_data.append(SubtopicProgressResponse(
                id=progress.id,
                subtopic=LearningSubtopicResponse(
                    id=progress.subtopic.id,
                    name=progress.subtopic.name,
                    description=progress.subtopic.description,
                    order=progress.subtopic.order,
                    learning_objectives=progress.subtopic.learning_objectives,
                    estimated_duration=progress.subtopic.estimated_duration,
                    is_active=progress.subtopic.is_active
                ),
                status=progress.status,
                started_at=progress.started_at,
                completed_at=progress.completed_at,
                challenges_completed=progress.challenges_completed,
                challenges_attempted=progress.challenges_attempted,
                challenge_success_rate=progress.challenge_success_rate,
                notes=progress.notes
            ))
        
        response.append(UserLearningPathResponse(
            id=path.id,
            topic=LearningTopicResponse(
                id=path.topic.id,
                name=path.topic.name,
                description=path.topic.description,
                difficulty_level=path.topic.difficulty_level,
                estimated_duration=path.topic.estimated_duration,
                is_active=path.topic.is_active,
                created_at=path.topic.created_at,
                subtopics_count=path.topic.subtopics.filter(is_active=True).count(),
                prerequisites=[]
            ),
            conversation_id=path.conversation.id,
            current_subtopic=LearningSubtopicResponse(
                id=path.current_subtopic.id,
                name=path.current_subtopic.name,
                description=path.current_subtopic.description,
                order=path.current_subtopic.order,
                learning_objectives=path.current_subtopic.learning_objectives,
                estimated_duration=path.current_subtopic.estimated_duration,
                is_active=path.current_subtopic.is_active
            ) if path.current_subtopic else None,
            progress_percentage=path.progress_percentage,
            is_completed=path.is_completed,
            started_at=path.started_at,
            completed_at=path.completed_at,
            is_active=path.is_active,
            progress=progress_data
        ))
    
    return response


# @post(router, "/create", response={200: UserLearningPathResponse, 401: Dict[str, str], 404: Dict[str, str]})
# def create_learning_path(request: HttpRequest, data: CreateLearningPathRequest):
#     """Create a new learning path for a user"""
#     topic = get_object_or_404(LearningTopic, id=data.topic_id, is_active=True)
    
#     # Check if user already has an active path for this topic
#     existing_path = UserLearningPath.objects.filter(
#         user=request.user,
#         topic=topic,
#         is_active=True
#     ).first()
    
#     if existing_path:
#         return 400, {"error": "User already has an active learning path for this topic"}
    
#     # Create conversation for this learning path
#     conversation = Conversation.objects.create(
#         user=request.user,
#         title=f"Learning: {topic.name}",
#         conversation_type=ConversationTypeChoices.LEARNING_PATH
#     )
    
#     # Get first subtopic
#     first_subtopic = topic.subtopics.filter(is_active=True).order_by('order').first()
    
#     # Create learning path
#     learning_path = UserLearningPath.objects.create(
#         user=request.user,
#         topic=topic,
#         conversation=conversation,
#         current_subtopic=first_subtopic
#     )
    
#     # Create progress entries for all subtopics
#     subtopics = topic.subtopics.filter(is_active=True).order_by('order')
#     for subtopic in subtopics:
#         SubtopicProgress.objects.create(
#             user_path=learning_path,
#             subtopic=subtopic,
#             status=SubtopicProgressChoices.NOT_STARTED
#         )
    
#     # Start the first subtopic if it exists
#     if first_subtopic:
#         first_progress = SubtopicProgress.objects.get(
#             user_path=learning_path,
#             subtopic=first_subtopic
#         )
#         first_progress.status = SubtopicProgressChoices.LEARNING
#         first_progress.started_at = timezone.now()
#         first_progress.save()
    
#     # Return the created learning path
#     return get_learning_path_response(learning_path)


@post(router, "/enroll", response={200: None, 401: Dict[str, str], 404: Dict[str, str]})
def enroll_in_learning_path(request: HttpRequest, topic_id: UUID):
    """Enroll in a learning path"""
    topic = get_object_or_404(
        LearningTopic,
        id=topic_id,
        is_active=True
    )
    if UserLearningPath.objects.filter(user=request.user, topic=topic, is_active=True).exists():
        return 400, {"error": "Already enrolled"}
    UserLearningPath.objects.create(
        user=request.user,
        topic=topic,
        conversation=Conversation.objects.create(
            user=request.user,
            title=f"Learning: {topic.name}",
            conversation_type=ConversationTypeChoices.LEARNING_PATH
        ),
        current_subtopic=topic.subtopics.filter(is_active=True).order_by('order').first()
    )
    return 200, None


@get(router, "/{topic_id}/messages", response={200: List[Dict], 401: Dict[str, str], 404: Dict[str, str]})
def get_learning_path_messages(request: HttpRequest, topic_id: UUID):
    """Get all messages for a learning path conversation"""
    import json as json_module
    
    # Get the user's learning path for this topic
    learning_path = get_object_or_404(
        UserLearningPath,
        topic_id=topic_id,
        user=request.user,
        is_active=True
    )
    
    # Get all messages from the associated conversation
    messages = learning_path.conversation.messages.all().order_by('created_at')
    
    # Format messages for response
    message_list = []
    for message in messages:
        content = message.content
        message_type = None
        next_action = None
        
        # Try to parse content as JSON (for AI messages with metadata)
        try:
            parsed_content = json_module.loads(content)
            if isinstance(parsed_content, dict):
                # Extract structured data from JSON
                content = parsed_content.get('content', content)
                message_type = parsed_content.get('type')
                next_action = parsed_content.get('next_action')
        except (json_module.JSONDecodeError, TypeError):
            # If not JSON, use content as-is
            pass
        
        message_data = {
            'id': str(message.id),
            'sender': message.sender,
            'content': content,
            'timestamp': message.created_at.isoformat(),
            'code_snippet': message.code_snippet,
            'language': message.language,
            'type': message_type,
            'next_action': next_action,
        }
        message_list.append(message_data)
    
    return message_list

@put(router, "/{path_id}/progress", response={200: UserLearningPathResponse, 401: Dict[str, str], 404: Dict[str, str]})
def update_progress(request: HttpRequest, path_id: UUID, data: UpdateProgressRequest):
    """Update progress for a specific subtopic"""
    path = get_object_or_404(
        UserLearningPath,
        id=path_id,
        user=request.user,
        is_active=True
    )
    
    progress = get_object_or_404(
        SubtopicProgress,
        user_path=path,
        subtopic_id=data.subtopic_id
    )
    
    # Update progress
    old_status = progress.status
    progress.status = data.status
    progress.notes = data.notes or progress.notes
    
    # Handle status transitions
    if old_status == SubtopicProgressChoices.NOT_STARTED and data.status == SubtopicProgressChoices.LEARNING:
        progress.started_at = timezone.now()
    elif data.status == SubtopicProgressChoices.COMPLETED and old_status != SubtopicProgressChoices.COMPLETED:
        progress.completed_at = timezone.now()
        # Move to next subtopic
        next_subtopic = path.topic.subtopics.filter(
            is_active=True,
            order__gt=progress.subtopic.order
        ).order_by('order').first()
        
        if next_subtopic:
            path.current_subtopic = next_subtopic
            path.save()
            # Start next subtopic
            next_progress, created = SubtopicProgress.objects.get_or_create(
                user_path=path,
                subtopic=next_subtopic,
                defaults={'status': SubtopicProgressChoices.LEARNING, 'started_at': timezone.now()}
            )
            if not created and next_progress.status == SubtopicProgressChoices.NOT_STARTED:
                next_progress.status = SubtopicProgressChoices.LEARNING
                next_progress.started_at = timezone.now()
                next_progress.save()
        else:
            # All subtopics completed
            path.completed_at = timezone.now()
            path.save()
    
    progress.save()
    
    return get_learning_path_response(path)


def get_learning_path_response(path: UserLearningPath) -> UserLearningPathResponse:
    """Helper function to build learning path response"""
    progress_data = []
    for progress in path.progress.all():
        progress_data.append(SubtopicProgressResponse(
            id=progress.id,
            subtopic=LearningSubtopicResponse(
                id=progress.subtopic.id,
                name=progress.subtopic.name,
                description=progress.subtopic.description,
                order=progress.subtopic.order,
                learning_objectives=progress.subtopic.learning_objectives,
                estimated_duration=progress.subtopic.estimated_duration,
                is_active=progress.subtopic.is_active
            ),
            status=progress.status,
            started_at=progress.started_at,
            completed_at=progress.completed_at,
            challenges_completed=progress.challenges_completed,
            challenges_attempted=progress.challenges_attempted,
            challenge_success_rate=progress.challenge_success_rate,
            notes=progress.notes
        ))
    
    return UserLearningPathResponse(
        id=path.id,
        topic=LearningTopicResponse(
            id=path.topic.id,
            name=path.topic.name,
            description=path.topic.description,
            difficulty_level=path.topic.difficulty_level,
            estimated_duration=path.topic.estimated_duration,
            is_active=path.topic.is_active,
            created_at=path.topic.created_at,
            subtopics_count=path.topic.subtopics.filter(is_active=True).count(),
            prerequisites=[]
        ),
        conversation_id=path.conversation.id,
        current_subtopic=LearningSubtopicResponse(
            id=path.current_subtopic.id,
            name=path.current_subtopic.name,
            description=path.current_subtopic.description,
            order=path.current_subtopic.order,
            learning_objectives=path.current_subtopic.learning_objectives,
            estimated_duration=path.current_subtopic.estimated_duration,
            is_active=path.current_subtopic.is_active
        ) if path.current_subtopic else None,
        progress_percentage=path.progress_percentage,
        is_completed=path.is_completed,
        started_at=path.started_at,
        completed_at=path.completed_at,
        is_active=path.is_active,
        progress=progress_data
    )

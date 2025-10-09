import json
import uuid
from channels.generic.websocket import AsyncWebsocketConsumer
from ai_core.models import MessageSenderChoices, MessageTypeChoices
from ai_core.utils.auth_helpers import authenticate_user
from ai_core.utils.conversation_helpers import ConversationService
from channels.db import database_sync_to_async
import logging
import asyncio
from learning_paths.models import UserLearningPath, SubtopicProgress, SubtopicProgressChoices
from learning_paths.services.learning_path_ai_services import LearningPathTutorAI
from django.utils import timezone
logger = logging.getLogger('ai_core.consumers')


class LearningAIPathChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.learning_topic_id = uuid.UUID(self.scope['url_route']['kwargs']['learning_topic_id'])
        user_learning_path = await database_sync_to_async(
            lambda: UserLearningPath.objects.get(topic=self.learning_topic_id)
        )()
        self.user_learning_path = user_learning_path

        conversation = await database_sync_to_async(lambda: user_learning_path.conversation)()
        
        self.conversation = conversation
        
        try:
            self.user = await authenticate_user(self.scope)
        except ValueError:
            await self.close(code=4001)
            return
        
        self.room_group_name = f"conversation_{self.conversation.id}"
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        self.ai_service = LearningPathTutorAI(self.user_learning_path)
        self.conversation_service = ConversationService()

        await self.accept()

        # check the message count if 0 send a greeting message.
        message_count = await database_sync_to_async(lambda: conversation.messages.count())()
        if message_count == 0:
            topic_name = await database_sync_to_async(lambda: self.user_learning_path.topic.name)()
            subtopic_name = await database_sync_to_async(lambda: self.user_learning_path.current_subtopic.name)()
            
            # Get learning objectives to initialize remaining_points
            learning_objectives = await database_sync_to_async(
                lambda: self.user_learning_path.current_subtopic.learning_objectives
            )()
            
            greeting_data = await self.ai_service.generate_greeting_message(topic_name=topic_name, subtopic_name=subtopic_name)
            greeting_content = greeting_data.get('greeting_message', 'Welcome to your learning journey!')
            
            # Save the greeting message to the database
            greeting_message = await self.conversation_service.save_message(
                conversation=self.conversation,
                sender=MessageSenderChoices.AI,
                content=greeting_content,
                message_type=MessageTypeChoices.CONVERSATION
            )

            # Initialize SubtopicProgress with learning objectives as remaining_points
            await database_sync_to_async(
            lambda: SubtopicProgress.objects.create(
                user_path=self.user_learning_path,
                subtopic=self.user_learning_path.current_subtopic,
                status=SubtopicProgressChoices.LEARNING,
                started_at=timezone.now(),
                remaining_points=learning_objectives,
                covered_points=[]
            )
            )()
            
            # Broadcast the greeting message
            await self.broadcast_message(greeting_message)



    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        """Handle incoming messages from the user"""
        data = json.loads(text_data)
        action = data.get("action", "message")
        
        # Handle different actions
        if action == "next_subtopic":
            await self.handle_next_subtopic()
            return
        
        message_content = data.get("message")
        code_snippet = data.get("code_snippet")
        language = data.get("language")

        if not message_content and not code_snippet:
            return

        # Save user message
        user_message = await self.conversation_service.save_message(
            conversation=self.conversation,
            sender=MessageSenderChoices.USER,
            content=message_content or "",
            code_snippet=code_snippet,
            language=language,
            message_type=MessageTypeChoices.CONVERSATION
        )
        await self.broadcast_message(user_message)
        
        # Tell the frontend the AI is typing
        await self.broadcast_event("typing_start")

        # Short natural delay to simulate human-like pause
        await asyncio.sleep(1)

        # Generate AI response using learning path tutor
        ai_response_data = await self.ai_service.generate_response(
            message_content=message_content or "",
            code_snippet=code_snippet,
            conversation=self.conversation
        )
        
        # Parse AI response - it should be a JSON string with content, code_snippet, language, type
        try:
            if isinstance(ai_response_data, str):
                # Try to parse as JSON
                response_json = json.loads(ai_response_data)
            else:
                response_json = ai_response_data
                
            ai_content = response_json.get('content', ai_response_data if isinstance(ai_response_data, str) else '')
            ai_code_snippet = response_json.get('code_snippet')
            ai_language = response_json.get('language', 'python')
            ai_message_type = response_json.get('type', 'conversation')
            subtopic_complete = response_json.get('subtopic_complete', False)
        except (json.JSONDecodeError, AttributeError):
            # Fallback: treat as plain text
            ai_content = ai_response_data if isinstance(ai_response_data, str) else str(ai_response_data)
            ai_code_snippet = None
            ai_language = None
            ai_message_type = 'conversation'
            subtopic_complete = False

        # Save AI message
        ai_message = await self.conversation_service.save_message(
            conversation=self.conversation,
            sender=MessageSenderChoices.AI,
            content=ai_content,
            code_snippet=ai_code_snippet,
            language=ai_language,
            message_type=ai_message_type
        )

        # Generate summary of the learning session
        await self.ai_service.generate_summary(self.conversation)

        # Tell the frontend the AI is done typing
        await self.broadcast_event("done")

        # Get current progress data to send to frontend
        current_subtopic = await database_sync_to_async(lambda: self.user_learning_path.current_subtopic)()
        if current_subtopic:
            subtopic_progress = await database_sync_to_async(
                lambda: SubtopicProgress.objects.filter(
                    user_path=self.user_learning_path,
                    subtopic=current_subtopic
                ).first()
            )()
            
            if subtopic_progress:
                progress_data = {
                    'covered_points': subtopic_progress.covered_points,
                    'remaining_points': subtopic_progress.remaining_points,
                    'ai_confidence': subtopic_progress.ai_confidence,
                    'progress_percentage': await database_sync_to_async(lambda: subtopic_progress.progress_percentage)(),
                    'challenges_completed': subtopic_progress.challenges_completed,
                    'challenges_attempted': subtopic_progress.challenges_attempted,
                    'is_ready_to_move_on': await database_sync_to_async(lambda: subtopic_progress.is_ready_to_move_on)()
                }
                await self.broadcast_event("progress_update", json.dumps(progress_data))
        
        # Broadcast AI message
        await self.broadcast_message(ai_message)
        
        # Check if AI detected subtopic completion
        if subtopic_complete:
            await self.broadcast_event("subtopic_complete", "The AI has detected you've mastered this subtopic!")

    async def handle_next_subtopic(self):
        """Handle moving to the next subtopic"""
        result = await self.ai_service.move_to_next_subtopic()
        
        if result:
            if result.get('moved'):
                # Successfully moved to next subtopic
                transition_message = f"🎉 Congratulations! You've completed '{result['completed_subtopic']}'!\n\n" \
                                   f"Let's move on to: {result['new_subtopic']}\n" \
                                   f"{result['new_subtopic_description']}"
                
                # Generate greeting for new subtopic
                greeting_data = await self.ai_service.generate_greeting_message(
                    topic_name=await database_sync_to_async(lambda: self.user_learning_path.topic.name)(),
                    subtopic_name=result['new_subtopic']
                )
                greeting_content = greeting_data.get('greeting_message', 'Let\'s begin this new subtopic!')
                
                # Save and broadcast transition message
                transition_msg = await self.conversation_service.save_message(
                    conversation=self.conversation,
                    sender=MessageSenderChoices.AI,
                    content=transition_message,
                    message_type=MessageTypeChoices.CONVERSATION
                )
                await self.broadcast_message(transition_msg)
                
                # Save and broadcast greeting
                greeting_msg = await self.conversation_service.save_message(
                    conversation=self.conversation,
                    sender=MessageSenderChoices.AI,
                    content=greeting_content,
                    message_type=MessageTypeChoices.CONVERSATION
                )
                await self.broadcast_message(greeting_msg)
                
                # Notify frontend of subtopic change
                await self.broadcast_event("subtopic_changed", json.dumps({
                    'new_subtopic': result['new_subtopic'],
                    'completed_subtopic': result['completed_subtopic']
                }))
                
            elif result.get('learning_path_completed'):
                # Learning path completed!
                completion_message = f"🎓 Amazing work! You've completed the entire learning path!\n\n" \
                                   f"You've mastered all subtopics in this topic. " \
                                   f"You can now explore more advanced topics or review what you've learned."
                
                completion_msg = await self.conversation_service.save_message(
                    conversation=self.conversation,
                    sender=MessageSenderChoices.AI,
                    content=completion_message,
                    message_type=MessageTypeChoices.CONVERSATION
                )
                await self.broadcast_message(completion_msg)
                
                await self.broadcast_event("learning_path_completed", "Congratulations!")

    async def broadcast_message(self, message):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat.message", 
                "message": {
                    "type": message.message_type,
                    "payload": {
                        "id": str(message.id),
                        "sender": message.sender,
                        "content": message.content,
                        "code_snippet": message.code_snippet,
                        "language": message.language,
                        "timestamp": message.created_at.isoformat()
                    }
                }
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event["message"]))

    async def broadcast_event(self, event_type: str, content: str = ""):
        """Broadcast events like typing indicators"""
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat.event",
                "event": {
                    "type": event_type,
                    "content": content,
                },
            },
        )

    async def chat_event(self, event):
        """Handle chat events like typing indicators"""
        await self.send(text_data=json.dumps(event["event"]))
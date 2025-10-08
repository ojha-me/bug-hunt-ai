import json
import uuid
from channels.generic.websocket import AsyncWebsocketConsumer
from ai_core.models import MessageSenderChoices, MessageTypeChoices
from ai_core.utils.auth_helpers import authenticate_user
from ai_core.utils.conversation_helpers import ConversationService
from channels.db import database_sync_to_async
import logging
import asyncio
from learning_paths.models import UserLearningPath, SubtopicProgress
from learning_paths.services.learning_path_ai_services import LearningPathTutorAI
from asgiref.sync import sync_to_async, async_to_sync
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
            greeting_data = await self.ai_service.generate_greeting_message(topic_name=topic_name, subtopic_name=subtopic_name)
            greeting_content = greeting_data.get('greeting_message', 'Welcome to your learning journey!')
            
            # Save the greeting message to the database
            greeting_message = await self.conversation_service.save_message(
                conversation=self.conversation,
                sender=MessageSenderChoices.AI,
                content=greeting_content,
                message_type=MessageTypeChoices.CONVERSATION
            )
            
            # Broadcast the greeting message
            await self.broadcast_message(greeting_message)



    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    

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
from django.urls import re_path
from .consumers.consumers import AIChatConsumer
from .consumers.learning_path_consumers import LearningAIPathChatConsumer

websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<conversation_id>[\w-]+)/?$', AIChatConsumer.as_asgi()),
    re_path(r'ws/learning-path/(?P<learning_topic_id>[\w-]+)/subtopic/(?P<subtopic_id>[\w-]+)/?$', LearningAIPathChatConsumer.as_asgi()),
]
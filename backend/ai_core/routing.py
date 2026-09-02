from django.urls import re_path
from .consumers.consumers import AIChatConsumer
from .consumers.learning_path_consumers import LearningAIPathChatConsumer
from .consumers.system_design_consumers import SystemDesignConsumer
from .consumers.sd_learning_consumers import SDSLessonChatConsumer

websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<conversation_id>[\w-]+)/?$', AIChatConsumer.as_asgi()),
    re_path(r'ws/learning-path/(?P<learning_topic_id>[\w-]+)/subtopic/(?P<subtopic_id>[\w-]+)/?$', LearningAIPathChatConsumer.as_asgi()),
    re_path(r'ws/system-design/(?P<conversation_id>[\w-]+)/?$', SystemDesignConsumer.as_asgi()),
    re_path(r'ws/system-design/learn/(?P<course_id>[\w-]+)/lesson/(?P<lesson_id>[\w-]+)/?$', SDSLessonChatConsumer.as_asgi()),
]
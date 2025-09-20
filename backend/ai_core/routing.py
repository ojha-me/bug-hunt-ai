from django.urls import re_path
from .consumers import AIChatConsumer

websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<conversation_id>[\w-]+)/$', AIChatConsumer.as_asgi()),
]
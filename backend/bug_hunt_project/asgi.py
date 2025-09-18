import os
from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter 
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bug_hunt_project.settings')

# initializes django and loads settings
django_asgi_app = get_asgi_application()

# import ai_core routing after loading settings
import ai_core.routing

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack( 
        URLRouter(
            ai_core.routing.websocket_urlpatterns
        )
    ),
})

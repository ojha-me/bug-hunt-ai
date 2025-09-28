from django.contrib import admin
from django.urls import path
from users.api import router as users_router
from ai_core.conversation import router as conversation_router
from execution.api import router as execution_router
from ninja import NinjaAPI

api = NinjaAPI()

api.add_router("users/", users_router)
api.add_router("conversation/", conversation_router)
api.add_router("execution/", execution_router)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api.urls)
]

from django.contrib import admin
from django.urls import path
from users.api import router as users_router
from ninja import NinjaAPI

api = NinjaAPI()
api.add_router("users/", users_router)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api.urls)
]

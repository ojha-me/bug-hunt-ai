from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ['email', 'first_name', 'last_name', 'is_staff', 'is_active', 'date_joined', 'skill_level']
    
    fieldsets = UserAdmin.fieldsets + (
        (None, {'fields': ('skill_level',)}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        (None, {'fields': ('skill_level',)}),
    )

    ordering = ('email',)

admin.site.register(CustomUser, CustomUserAdmin)

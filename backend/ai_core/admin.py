from django.contrib import admin
from .models import Conversation, Message


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'title', 'created_at', 'last_active_at')
    list_filter = ('created_at', 'last_active_at', 'user')
    search_fields = ('title', 'user__email')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'last_active_at')
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'conversation', 'sender', 'message_type', 'created_at')
    list_filter = ('sender', 'message_type', 'created_at', 'conversation__user')
    search_fields = ('content', 'conversation__title', 'conversation__user__email')
    ordering = ('-created_at',)
    readonly_fields = ('created_at',)
    list_select_related = ('conversation', 'conversation__user')
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('conversation', 'conversation__user')

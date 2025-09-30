from django.contrib import admin
from .models import LearningTopic, LearningSubtopic, UserLearningPath, SubtopicProgress


class LearningSubtopicInline(admin.TabularInline):
    model = LearningSubtopic
    extra = 0
    fields = ('name', 'order', 'estimated_duration', 'is_active')
    ordering = ('order',)


@admin.register(LearningTopic)
class LearningTopicAdmin(admin.ModelAdmin):
    list_display = ('name', 'difficulty_level', 'estimated_duration', 'is_active', 'created_at')
    list_filter = ('difficulty_level', 'is_active', 'created_at')
    search_fields = ('name', 'description')
    inlines = [LearningSubtopicInline]
    filter_horizontal = ('prerequisites',)


@admin.register(LearningSubtopic)
class LearningSubtopicAdmin(admin.ModelAdmin):
    list_display = ('name', 'topic', 'order', 'estimated_duration', 'is_active')
    list_filter = ('topic', 'is_active')
    search_fields = ('name', 'description', 'topic__name')
    ordering = ('topic', 'order')


class SubtopicProgressInline(admin.TabularInline):
    model = SubtopicProgress
    extra = 0
    fields = ('subtopic', 'status', 'challenges_completed', 'challenges_attempted')
    readonly_fields = ('subtopic',)


@admin.register(UserLearningPath)
class UserLearningPathAdmin(admin.ModelAdmin):
    list_display = ('user', 'topic', 'current_subtopic', 'progress_percentage', 'is_active', 'started_at')
    list_filter = ('topic', 'is_active', 'started_at')
    search_fields = ('user__email', 'topic__name')
    inlines = [SubtopicProgressInline]
    readonly_fields = ('progress_percentage', 'is_completed')


@admin.register(SubtopicProgress)
class SubtopicProgressAdmin(admin.ModelAdmin):
    list_display = ('user_path', 'subtopic', 'status', 'challenges_completed', 'challenges_attempted', 'challenge_success_rate')
    list_filter = ('status', 'subtopic__topic')
    search_fields = ('user_path__user__email', 'subtopic__name')
    readonly_fields = ('challenge_success_rate',)

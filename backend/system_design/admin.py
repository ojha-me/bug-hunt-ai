from django.contrib import admin
from system_design.models import SDCourse, SDLesson, UserSDCourse, SDLessonProgress, SDCaseStudy


@admin.register(SDCourse)
class SDCourseAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'order', 'is_active')
    list_filter = ('is_active',)
    ordering = ('order',)


@admin.register(SDLesson)
class SDLessonAdmin(admin.ModelAdmin):
    list_display = ('id', 'course', 'name', 'order', 'is_active')
    list_filter = ('course', 'is_active')
    ordering = ('course', 'order')


@admin.register(UserSDCourse)
class UserSDCourseAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'course', 'current_lesson', 'progress_percentage', 'is_completed', 'is_active')
    list_filter = ('is_active',)
    list_select_related = ('user', 'course', 'current_lesson')


@admin.register(SDLessonProgress)
class SDLessonProgressAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_course', 'lesson', 'status', 'ai_confidence', 'progress_percentage')
    list_filter = ('status',)
    list_select_related = ('user_course', 'lesson')


@admin.register(SDCaseStudy)
class SDCaseStudyAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'difficulty', 'is_active')
    list_filter = ('difficulty', 'is_active')
    search_fields = ('title', 'slug', 'topics')
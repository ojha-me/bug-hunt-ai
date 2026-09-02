from django.contrib import admin
from challenges.models import CodingProblem, ProblemAttempt


class CodingProblemAdmin(admin.ModelAdmin):
    list_display = ("title", "slug", "difficulty", "is_active")
    list_filter = ("difficulty", "is_active")
    search_fields = ("title", "slug", "topics")
    readonly_fields = ("created_at",)


class ProblemAttemptAdmin(admin.ModelAdmin):
    list_display = ("user", "problem", "verdict", "passed_count", "total_count", "submitted_at")
    list_filter = ("verdict",)
    search_fields = ("user__email", "problem__title")


admin.site.register(CodingProblem, CodingProblemAdmin)
admin.site.register(ProblemAttempt, ProblemAttemptAdmin)
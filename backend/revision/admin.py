from django.contrib import admin
from revision.models import RevisionItem


@admin.register(RevisionItem)
class RevisionItemAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'difficulty', 'repetitions', 'interval_days', 'due_at')
    list_filter = ('difficulty',)
    search_fields = ('user__email', 'title')
    list_select_related = ('user', 'problem')
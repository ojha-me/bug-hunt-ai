from django.contrib import admin

# Register your models here.

from .models import User, Challenge, CodeSnippet, Session, Hint, Message, Submission, UserProgress
admin.site.register(User)
admin.site.register(Challenge)
admin.site.register(CodeSnippet)
admin.site.register(Session)
admin.site.register(Hint)
admin.site.register(Message)
admin.site.register(Submission)
admin.site.register(UserProgress)


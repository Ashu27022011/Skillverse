from django.contrib import admin
from .models import Profile, Skill


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    search_fields = ('name',)


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'avatar_url', 'created_at')
    search_fields = ('user__username', 'user__email', 'bio')
    filter_horizontal = ('skills',)

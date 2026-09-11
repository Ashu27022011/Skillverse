from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import models


User = get_user_model()


class Skill(models.Model):
    name = models.CharField(max_length=80, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    avatar_url = models.URLField(blank=True)
    bio = models.TextField(max_length=500, blank=True)
    skills = models.ManyToManyField(Skill, blank=True, related_name='profiles')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_seen = models.DateTimeField(null=True, blank=True)
    experience = models.PositiveIntegerField(default=0)
    starter_messages_enabled = models.BooleanField(default=False)

    def __str__(self):
        return f'{self.user.username} profile'


class EmailVerification(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='email_verification')
    code = models.CharField(max_length=4)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'Email verification for {self.user.username}'


class Conversation(models.Model):
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='conversations')
    contact_username = models.CharField(max_length=150, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    meet_created_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-updated_at']


class SkillExchange(models.Model):
    conversation = models.OneToOneField(Conversation, on_delete=models.CASCADE, related_name='skill_exchange')
    first_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='skill_exchanges_started')
    second_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='skill_exchanges_received')
    first_learned = models.CharField(max_length=80, blank=True)
    first_taught = models.CharField(max_length=80, blank=True)
    second_learned = models.CharField(max_length=80, blank=True)
    second_taught = models.CharField(max_length=80, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    body = models.TextField(blank=True)
    attachment = models.FileField(upload_to='chat_attachments/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'Message from {self.sender.username}'

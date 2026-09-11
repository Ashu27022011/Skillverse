from django.contrib.auth import get_user_model
from django.conf import settings
from urllib.parse import quote
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Message, Profile, Skill

User = get_user_model()


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['id', 'name']


class RegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField(max_length=150, trim_whitespace=False)
    password = serializers.CharField(write_only=True)
    skills = serializers.ListField(child=serializers.CharField(max_length=80), write_only=True, required=False)
    bio = serializers.CharField(max_length=500, required=False, allow_blank=True)
    avatar = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'skills', 'bio', 'avatar']

    def validate_email(self, value):
        value = value.lower().strip()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('A user with that email already exists.')
        return value

    def validate_username(self, value):
        if not value.strip():
            raise serializers.ValidationError('Username is required.')
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('A user with that username already exists.')
        return value

    def create(self, validated_data):
        skills_data = validated_data.pop('skills', [])
        bio = validated_data.pop('bio', '')
        avatar = validated_data.pop('avatar', None)
        password = validated_data.pop('password')

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=password,
        )

        profile = Profile.objects.create(user=user, bio=bio, avatar=avatar)

        for skill_name in skills_data:
            skill_name = skill_name.strip()
            if not skill_name:
                continue
            skill, _ = Skill.objects.get_or_create(name=skill_name)
            profile.skills.add(skill)

        return user


class UserProfileSerializer(serializers.ModelSerializer):
    bio = serializers.CharField(source='profile.bio', read_only=True)
    last_seen = serializers.DateTimeField(source='profile.last_seen', read_only=True)
    experience = serializers.IntegerField(source='profile.experience', read_only=True)
    skills = SkillSerializer(source='profile.skills', many=True, read_only=True)
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'bio', 'skills', 'avatar', 'last_seen', 'experience']

    def get_avatar(self, obj):
        profile = obj.profile
        if profile.avatar:
            request = self.context.get('request')
            avatar_url = request.build_absolute_uri(profile.avatar.url) if request else profile.avatar.url
            return f'{avatar_url}?v={profile.updated_at.timestamp():.0f}'
        if profile.avatar_url:
            return profile.avatar_url
        fallback_names = [f'{obj.username}.PNG', f'{obj.username}.png']
        fallback = next((settings.MEDIA_ROOT / 'avatars' / name for name in fallback_names if (settings.MEDIA_ROOT / 'avatars' / name).exists()), None)
        if fallback:
            request = self.context.get('request')
            avatar_url = f'{settings.MEDIA_URL}avatars/{quote(fallback.name)}'
            return f'{request.build_absolute_uri(avatar_url) if request else avatar_url}?v={int(fallback.stat().st_mtime)}'
        return None


class ProfileUpdateSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150, required=False)
    email = serializers.EmailField(required=False)
    bio = serializers.CharField(max_length=500, required=False, allow_blank=True)
    skills = serializers.ListField(child=serializers.CharField(max_length=80), required=False)
    avatar = serializers.ImageField(required=False, allow_null=True)

    def validate_username(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Username is required.')
        if User.objects.filter(username=value).exclude(pk=self.context['request'].user.pk).exists():
            raise serializers.ValidationError('That username is already in use.')
        return value

    def validate_email(self, value):
        value = value.lower().strip()
        if User.objects.filter(email__iexact=value).exclude(pk=self.context['request'].user.pk).exists():
            raise serializers.ValidationError('That email is already in use.')
        return value

    def update(self, instance, validated_data):
        user = instance
        profile = user.profile
        for field in ('username', 'email'):
            if field in validated_data:
                setattr(user, field, validated_data[field])
        user_fields = [field for field in ('username', 'email') if field in validated_data]
        if user_fields:
            user.save(update_fields=user_fields)
        for field in ('bio', 'avatar'):
            if field in validated_data:
                setattr(profile, field, validated_data[field])
        profile.save()
        if 'skills' in validated_data:
            profile.skills.clear()
            for name in validated_data['skills']:
                name = name.strip()
                if name:
                    skill, _ = Skill.objects.get_or_create(name=name)
                    profile.skills.add(skill)
        return user


class MessageSerializer(serializers.ModelSerializer):
    sender = serializers.CharField(source='sender.username', read_only=True)
    attachment_url = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'sender', 'body', 'attachment', 'attachment_url', 'created_at', 'read_at']
        read_only_fields = ['id', 'sender', 'attachment_url', 'created_at', 'read_at']

    def get_attachment_url(self, obj):
        if not obj.attachment:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(obj.attachment.url) if request else obj.attachment.url


class InboxSerializer(serializers.Serializer):
    username = serializers.CharField()
    name = serializers.CharField()
    bio = serializers.CharField()
    skills = serializers.ListField(child=serializers.CharField())
    avatar = serializers.CharField(allow_null=True)
    last_message = serializers.CharField(allow_blank=True)
    last_message_at = serializers.DateTimeField(allow_null=True)
    unread_count = serializers.IntegerField()


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    email = serializers.EmailField(write_only=True)

    def validate(self, attrs):
        email = attrs.pop('email').strip().lower()
        attrs['username'] = attrs.get('username', '').strip()
        data = super().validate(attrs)
        if self.user.email.strip().lower() != email:
            raise serializers.ValidationError({'email': 'The email does not match this username.'})
        return data

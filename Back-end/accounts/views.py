from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Count, F, Max, Q
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from uuid import uuid4
from datetime import timedelta
import os

from .models import Conversation, EmailVerification, Message, Profile, Skill, SkillExchange
from .serializers import EmailTokenObtainPairSerializer, MessageSerializer, ProfileUpdateSerializer, RegisterSerializer, UserProfileSerializer
from Ssh_backend.email_service import Email_verifiation

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                'tokens': {'refresh': str(refresh), 'access': str(refresh.access_token)},
                'profile': UserProfileSerializer(user, context={'request': request}).data,
            },
            status=status.HTTP_201_CREATED,
        )


class UsernameAvailabilityView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        username = request.query_params.get('username', '').strip()
        if not username:
            return Response({'available': False, 'detail': 'Username is required.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'available': not User.objects.filter(username=username).exists()})


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        request.user.profile.last_seen = timezone.now()
        request.user.profile.save(update_fields=['last_seen'])
        serializer = UserProfileSerializer(request.user, context={'request': request})
        return Response(serializer.data)

    def patch(self, request):
        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserProfileSerializer(user, context={'request': request}).data)


class ProfileSearchView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        term = request.query_params.get('q', '').strip()
        users = User.objects.exclude(pk=request.user.pk).select_related('profile').prefetch_related('profile__skills')
        if term:
            users = users.filter(Q(username__icontains=term) | Q(profile__bio__icontains=term) | Q(profile__skills__name__icontains=term)).distinct()
        request.user.profile.last_seen = timezone.now()
        request.user.profile.save(update_fields=['last_seen'])
        return Response(UserProfileSerializer(users, many=True, context={'request': request}).data)


class InboxView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        conversations = request.user.conversations.prefetch_related('participants__profile', 'messages').order_by('-updated_at')
        items = []
        for conversation in conversations:
            contact = conversation.participants.exclude(pk=request.user.pk).select_related('profile').first()
            if not contact:
                continue
            last_message = conversation.messages.order_by('-created_at').first()
            items.append({
                'username': contact.username,
                'name': contact.username,
                'bio': contact.profile.bio,
                'skills': list(contact.profile.skills.values_list('name', flat=True)),
                'avatar': UserProfileSerializer(contact, context={'request': request}).data['avatar'],
                'last_message': last_message.body if last_message else '',
                'last_message_at': last_message.created_at if last_message else None,
                'unread_count': conversation.messages.filter(~Q(sender=request.user), read_at__isnull=True).count(),
            })
        return Response(items)


class QuizXPView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            correct_answers = int(request.data.get('correct_answers', 0))
        except (TypeError, ValueError):
            return Response({'detail': 'Correct answer count must be a number.'}, status=status.HTTP_400_BAD_REQUEST)
        if not 0 <= correct_answers <= 10:
            return Response({'detail': 'Correct answer count must be between 0 and 10.'}, status=status.HTTP_400_BAD_REQUEST)
        points_awarded = correct_answers * 5
        profile = request.user.profile
        profile.experience = F('experience') + points_awarded
        profile.save(update_fields=['experience'])
        profile.refresh_from_db(fields=['experience'])
        return Response({'correct_answers': correct_answers, 'points_awarded': points_awarded, 'experience': profile.experience})


class LoginView(generics.GenericAPIView):
    serializer_class = EmailTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.user
        return Response({'tokens': serializer.validated_data, 'profile': UserProfileSerializer(user, context={'request': request}).data}, status=status.HTTP_200_OK)


def issue_verification(user):
    code = Email_verifiation(user.email, user.username)
    EmailVerification.objects.update_or_create(
        user=user,
        defaults={'code': code},
    )


class VerificationView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        identifier = request.data.get('identifier', '').strip()
        code = request.data.get('code', '').strip()
        user = User.objects.filter(username=identifier).first() or User.objects.filter(email__iexact=identifier).first()
        verification = EmailVerification.objects.filter(user=user).first() if user else None
        if not verification or verification.code != code:
            return Response({'detail': 'That verification code is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)
        refresh = RefreshToken.for_user(user)
        verification.delete()
        return Response({
            'tokens': {'refresh': str(refresh), 'access': str(refresh.access_token)},
            'profile': UserProfileSerializer(user, context={'request': request}).data,
        })


class ResendVerificationView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        identifier = request.data.get('identifier', '').strip()
        user = User.objects.filter(username=identifier).first() or User.objects.filter(email__iexact=identifier).first()
        if not user:
            return Response({'detail': 'Account not found.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            issue_verification(user)
        except RuntimeError as error:
            return Response({'detail': str(error)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return Response({'detail': 'A new verification code was sent.'})


class ConversationMessagesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    starter_messages = (
        'Hi! I am glad we connected on Skillverse.',
        'Feel free to ask me about the skills I have listed on my profile.',
        'What would you like to learn or share today?',
    )

    def _ensure_starter_messages(self, conversation, request, recipient):
        if conversation.messages.exists() or (recipient and not recipient.profile.starter_messages_enabled):
            return
        sender = recipient or request.user
        Message.objects.bulk_create([
            Message(conversation=conversation, sender=sender, body=body)
            for body in self.starter_messages
        ])

    def _conversation(self, request, username):
        recipient = User.objects.filter(username=username).first()
        if recipient:
            conversation = Conversation.objects.filter(participants=request.user).filter(participants=recipient).first()
            if conversation:
                self._ensure_starter_messages(conversation, request, recipient)
                return conversation
        else:
            conversation = Conversation.objects.filter(participants=request.user, contact_username=username).first()
            if conversation:
                self._ensure_starter_messages(conversation, request, recipient)
                return conversation
        conversation = Conversation.objects.create()
        conversation.contact_username = username
        conversation.save(update_fields=['contact_username'])
        conversation.participants.add(request.user)
        if recipient:
            conversation.participants.add(recipient)
        self._ensure_starter_messages(conversation, request, recipient)
        return conversation

    def get(self, request, username):
        conversation = self._conversation(request, username)
        recipient = User.objects.filter(username=username).exclude(pk=request.user.pk).first()
        self._ensure_starter_messages(conversation, request, recipient)
        conversation.messages.exclude(sender=request.user).filter(read_at__isnull=True).update(read_at=timezone.now())
        request.user.profile.last_seen = timezone.now()
        request.user.profile.save(update_fields=['last_seen'])
        serializer = MessageSerializer(conversation.messages.select_related('sender').order_by('created_at', 'id'), many=True, context={'request': request})
        return Response({'conversation_id': conversation.id, 'messages': serializer.data})

    def post(self, request, username):
        conversation = self._conversation(request, username)
        serializer = MessageSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        message = serializer.save(conversation=conversation, sender=request.user)
        recipient = User.objects.filter(username=username).exclude(pk=request.user.pk).first()
        reply = None
        if recipient:
            skills = list(recipient.profile.skills.values_list('name', flat=True)[:2])
            skill_text = ', '.join(skills) if skills else 'the skills on my profile'
            reply = Message.objects.create(
                conversation=conversation,
                sender=recipient,
                body=f'Thanks for your message. I would be happy to talk about {skill_text}. What would you like to explore?',
            )
        conversation.save(update_fields=['updated_at'])
        response_messages = [MessageSerializer(message, context={'request': request}).data]
        if reply:
            response_messages.append(MessageSerializer(reply, context={'request': request}).data)
        return Response({'messages': response_messages}, status=status.HTTP_201_CREATED)


def normalize_skill(value):
    return ' '.join(value.lower().strip().split())


class SkillExchangeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def _conversation(self, request, username):
        recipient = User.objects.filter(username=username).first()
        if not recipient or recipient == request.user:
            return None, None
        conversation = Conversation.objects.filter(participants=request.user).filter(participants=recipient).first()
        return conversation, recipient

    def get(self, request, username):
        conversation, recipient = self._conversation(request, username)
        if not conversation:
            return Response({'eligible': False, 'detail': 'Conversation not found.'}, status=status.HTTP_404_NOT_FOUND)
        eligible = conversation.messages.filter(sender=request.user).exists() and conversation.messages.filter(sender=recipient).exists()
        exchange, _ = SkillExchange.objects.get_or_create(conversation=conversation, defaults={'first_user': request.user, 'second_user': recipient})
        submitted = exchange.first_learned if exchange.first_user_id == request.user.id else exchange.second_learned
        return Response({'eligible': eligible, 'submitted': bool(submitted), 'completed': bool(exchange.completed_at)})

    def post(self, request, username):
        conversation, recipient = self._conversation(request, username)
        if not conversation:
            return Response({'detail': 'Conversation not found.'}, status=status.HTTP_404_NOT_FOUND)
        has_user_message = conversation.messages.filter(sender=request.user).exists()
        has_recipient_message = conversation.messages.filter(sender=recipient).exists()
        if not (has_user_message and has_recipient_message):
            return Response({'detail': 'Skillizing unlocks after both users send at least one message.'}, status=status.HTTP_403_FORBIDDEN)
        learned = normalize_skill(request.data.get('learned_skill', ''))
        taught = normalize_skill(request.data.get('taught_skill', ''))
        if not learned or not taught:
            return Response({'detail': 'Add at least one learned skill and one taught skill.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(learned) > 80 or len(taught) > 80:
            return Response({'detail': 'Skills must be 80 characters or fewer.'}, status=status.HTTP_400_BAD_REQUEST)
        with transaction.atomic():
            exchange, _ = SkillExchange.objects.select_for_update().get_or_create(conversation=conversation, defaults={'first_user': request.user, 'second_user': recipient})
            if exchange.first_user_id == request.user.id:
                exchange.first_learned, exchange.first_taught = learned, taught
                other_learned, other_taught = exchange.second_learned, exchange.second_taught
            else:
                exchange.second_learned, exchange.second_taught = learned, taught
                other_learned, other_taught = exchange.first_learned, exchange.first_taught
            awarded = False
            if other_learned and other_taught and learned == other_taught and taught == other_learned and not exchange.completed_at:
                exchange.completed_at = timezone.now()
                Profile.objects.filter(user__in=[request.user, recipient]).update(experience=F('experience') + 100)
                for user, skill_name in ((request.user, learned), (recipient, other_learned)):
                    skill, _ = Skill.objects.get_or_create(name=skill_name)
                    user.profile.skills.add(skill)
                awarded = True
            exchange.save()
            request.user.profile.refresh_from_db(fields=['experience'])
        return Response({'matched': awarded, 'completed': bool(exchange.completed_at), 'experience_awarded': 100 if awarded else 0, 'experience': request.user.profile.experience})


class GoogleMeetView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, username):
        recipient = User.objects.filter(username=username).first()
        if not recipient or not request.user.email or not recipient.email:
            return Response({'detail': 'A valid Gmail address is required for both users.'}, status=status.HTTP_400_BAD_REQUEST)
        conversation = Conversation.objects.filter(participants=request.user).filter(participants=recipient).first()
        if not conversation:
            return Response({'detail': 'Conversation not found.'}, status=status.HTTP_404_NOT_FOUND)

        credentials_file = os.getenv('GOOGLE_OAUTH_CREDENTIALS', str(settings.BASE_DIR / 'credentials.json'))
        token_file = os.getenv('GOOGLE_TOKEN_FILE', str(settings.BASE_DIR / 'token.json'))
        calendar_id = os.getenv('GOOGLE_CALENDAR_ID', 'primary')
        if not os.path.exists(credentials_file):
            return Response({'detail': f'Google Meet is not configured. Place credentials.json in {settings.BASE_DIR} or set GOOGLE_OAUTH_CREDENTIALS.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        try:
            from google.auth.transport.requests import Request
            from google.oauth2.credentials import Credentials
            from google_auth_oauthlib.flow import InstalledAppFlow
            from googleapiclient.discovery import build
            scopes = ['https://www.googleapis.com/auth/calendar.events']
            credentials = Credentials.from_authorized_user_file(token_file, scopes) if os.path.exists(token_file) else None
            if not credentials or not credentials.valid:
                if credentials and credentials.expired and credentials.refresh_token:
                    credentials.refresh(Request())
                else:
                    flow = InstalledAppFlow.from_client_secrets_file(credentials_file, scopes)
                    credentials = flow.run_local_server(port=0)
                with open(token_file, 'w', encoding='utf-8') as token:
                    token.write(credentials.to_json())
            start = timezone.now() + timedelta(minutes=5)
            event = build('calendar', 'v3', credentials=credentials, cache_discovery=False).events().insert(
                calendarId=calendar_id,
                conferenceDataVersion=1,
                sendUpdates='all',
                body={
                    'summary': f'Skillverse chat with {recipient.username}',
                    'description': 'Google Meet created from Skillverse chat.',
                    'start': {'dateTime': start.isoformat(), 'timeZone': settings.TIME_ZONE},
                    'end': {'dateTime': (start + timedelta(hours=1)).isoformat(), 'timeZone': settings.TIME_ZONE},
                    'attendees': [{'email': request.user.email}, {'email': recipient.email}],
                    'conferenceData': {
                        'createRequest': {
                            'requestId': uuid4().hex,
                            'conferenceSolutionKey': {'type': 'hangoutsMeet'},
                        },
                    },
                },
            ).execute()
            entry_points = event.get('conferenceData', {}).get('entryPoints', [])
            meet_link = next((entry['uri'] for entry in entry_points if entry.get('entryPointType') == 'video'), None)
            if not meet_link:
                raise RuntimeError('Google did not return a Meet video link.')
            conversation.meet_created_at = timezone.now()
            conversation.save(update_fields=['meet_created_at'])
            return Response({'url': meet_link, 'title': event.get('summary', 'Google Meet')})
        except ImportError:
            return Response({'detail': 'Google Calendar packages are missing on the backend. Install the packages listed in requirements.txt.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as error:
            return Response({'detail': f'Google Meet could not be created: {error}'}, status=status.HTTP_502_BAD_GATEWAY)

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import ConversationMessagesView, GoogleMeetView, InboxView, LoginView, MeView, ProfileSearchView, QuizXPView, RegisterView, SkillExchangeView, UsernameAvailabilityView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('username-availability/', UsernameAvailabilityView.as_view(), name='username_availability'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', MeView.as_view(), name='me'),
    path('profiles/', ProfileSearchView.as_view(), name='profiles'),
    path('inbox/', InboxView.as_view(), name='inbox'),
    path('quiz/xp/', QuizXPView.as_view(), name='quiz_xp'),
    path('conversations/<str:username>/messages/', ConversationMessagesView.as_view(), name='conversation_messages'),
    path('conversations/<str:username>/meet/', GoogleMeetView.as_view(), name='google_meet'),
    path('conversations/<str:username>/skillizing/', SkillExchangeView.as_view(), name='skillizing'),
]

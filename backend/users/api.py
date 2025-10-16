from ninja import Router
from ninja.responses import Response
from users.utils.auth import create_jwt, decode_jwt
from users.api_types import (
    CreateUserSchema,
    CreateUserResponse,
    UserResponseAttributes,
    LoginParams,
    LogoutParams,
    TokenResponse,
    UserProfileResponse,
    UserStatsResponse,
    GoogleAuthParams,
)
from django.contrib.auth import authenticate
from uuid import uuid4
from datetime import timedelta, datetime
from django.utils import timezone
from users.models import CustomUser, RefreshToken, UserActivitySession
from django.db import IntegrityError
from django.db.models import Count, Q, Sum, Avg
from typing import Dict
from users.utils.ninja import public_post
from ninja.security import HttpBearer
import jwt
from google.oauth2 import id_token
from google.auth.transport import requests
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

router = Router()


class AuthBearer(HttpBearer):
    def authenticate(self, request, token):
        try:
            payload = decode_jwt(token)
            if payload.get("type") != "access":
                return None
            user_id = payload.get("user_id")
            user = CustomUser.objects.filter(id=user_id).first()
            return user
        except jwt.PyJWTError:
            return None


auth = AuthBearer()


@public_post(router, "/login", response={200: TokenResponse, 401: Dict[str, str]})
def login(request, params: LoginParams):
    user = authenticate(request, username=params.email, password=params.password)
    if not user:
        return 401, {"error": "Invalid credentials"}

    access_token = create_jwt(user.id, "access")
    jti = uuid4()
    refresh_token = create_jwt(user.id, "refresh", str(jti))

    RefreshToken.objects.create(
        jti=str(jti),
        user=user,
        expires_at=timezone.now() + timedelta(days=30),
        revoked=False,
    )

    response_data = TokenResponse(access_token=access_token)
    response = Response(response_data.dict(), status=200)
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="strict",
        max_age=30 * 24 * 60 * 60,
    )
    return response


@public_post(router, "/refresh", response={200: TokenResponse, 401: Dict[str, str]})
def refresh_token(request):
    try:
        old_refresh_token = request.COOKIES.get("refresh_token")
        if not old_refresh_token:
            return 401, {"error": "Missing refresh token"}

        payload = decode_jwt(old_refresh_token)
        if payload.get("type") != "refresh":
            return 401, {"error": "Invalid token type"}

        user_id = payload.get("user_id")
        jti = payload.get("jti")

        token_obj = RefreshToken.objects.filter(jti=jti, revoked=False).first()
        if not token_obj or token_obj.expires_at < timezone.now():
            return 401, {"error": "Invalid or expired token"}

        # Revoke the old token
        token_obj.revoked = True
        token_obj.save()

        # Create new refresh token
        new_jti = uuid4()
        new_refresh_token = create_jwt(user_id, "refresh", str(new_jti))
        RefreshToken.objects.create(
            jti=str(new_jti),
            user_id=user_id,
            expires_at=timezone.now() + timedelta(days=30),
            revoked=False,
        )

        # Create new access token
        access_token = create_jwt(user_id, "access")

        response_data = TokenResponse(access_token=access_token)
        response = Response(response_data.dict(), status=200)
        response.set_cookie(
            key="refresh_token",
            value=new_refresh_token,
            httponly=True,
            samesite="strict",
            max_age=30 * 24 * 60 * 60,
        )
        return response

    except jwt.PyJWTError:
        return 401, {"error": "Invalid token"}


@public_post(router, "/logout", response={200: None})
def logout(request, params: LogoutParams):
    try:
        payload = decode_jwt(params.refresh_token)
        jti = payload.get("jti")
        token_obj = RefreshToken.objects.filter(jti=jti, revoked=False).first()
        if token_obj:
            token_obj.revoked = True
            token_obj.save()
        response = Response(None, status=200)
        response.delete_cookie("refresh_token")
        return response
    except jwt.PyJWTError:
        return 200, None 


@public_post(router, "/create-user", response={200: CreateUserResponse, 400: Dict[str, str]})
def create_user(request, params: CreateUserSchema):
    try:
        user = CustomUser.objects.create_user(
            email=params.email,
            first_name=params.first_name,
            last_name=params.last_name,
            password=params.password,
            skill_level=params.skill_level,
        )
        return 200, CreateUserResponse(
            id=str(user.id),
            attributes=UserResponseAttributes(
                email=user.email,
                first_name=user.first_name,
                last_name=user.last_name,
                skill_level=user.skill_level,
                date_joined=user.date_joined.isoformat(),
                is_active=user.is_active,
                is_staff=user.is_staff,
            ),
        )
    except IntegrityError:
        return 400, {"error": "User with this email already exists"}


@public_post(router, "/google-auth", response={200: TokenResponse, 400: Dict[str, str], 401: Dict[str, str]})
def google_auth(request, params: GoogleAuthParams):
    """
    Authenticate user with Google OAuth
    """
    try:
        # Verify the Google ID token
        google_client_id = settings.GOOGLE_OAUTH_CLIENT_ID
        if not google_client_id:
            logger.error("GOOGLE_OAUTH_CLIENT_ID not configured")
            return 400, {"error": "Google OAuth not configured"}
        
        idinfo = id_token.verify_oauth2_token(
            params.credential, 
            requests.Request(), 
            google_client_id
        )
        
        # Extract user information from the token
        google_id = idinfo['sub']
        email = idinfo.get('email')
        first_name = idinfo.get('given_name', '')
        last_name = idinfo.get('family_name', '')
        profile_picture = idinfo.get('picture', '')
        
        if not email:
            return 400, {"error": "Email not provided by Google"}
        
        # Check if user exists with this Google ID
        user = CustomUser.objects.filter(google_id=google_id).first()
        
        if user:
            # User exists, log them in
            pass
        else:
            # Check if user exists with this email
            user = CustomUser.objects.filter(email=email).first()
            
            if user:
                # Link Google account to existing user
                user.google_id = google_id
                user.auth_provider = 'google'
                if not user.profile_picture:
                    user.profile_picture = profile_picture
                user.save()
            else:
                # Create new user
                user = CustomUser.objects.create(
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                    google_id=google_id,
                    auth_provider='google',
                    profile_picture=profile_picture,
                    is_active=True,
                )
                # Set unusable password for OAuth users
                user.set_unusable_password()
                user.save()
        
        # Generate JWT tokens
        access_token = create_jwt(user.id, "access")
        jti = uuid4()
        refresh_token = create_jwt(user.id, "refresh", str(jti))
        
        RefreshToken.objects.create(
            jti=str(jti),
            user=user,
            expires_at=timezone.now() + timedelta(days=30),
            revoked=False,
        )
        
        response_data = TokenResponse(access_token=access_token)
        response = Response(response_data.dict(), status=200)
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            samesite="strict",
            max_age=30 * 24 * 60 * 60,
        )
        return response
        
    except ValueError as e:
        # Invalid token
        logger.error(f"Google OAuth error: {str(e)}")
        return 401, {"error": "Invalid Google token"}
    except Exception as e:
        logger.error(f"Unexpected error in Google OAuth: {str(e)}")
        return 400, {"error": "Authentication failed"}


@router.get("/profile", response=UserProfileResponse, auth=auth)
def get_user_profile(request):
    """
    Get current user's profile with comprehensive statistics
    """
    user = request.auth
    
    # Import models here to avoid circular imports
    from ai_core.models import Conversation, Message
    from learning_paths.models import UserLearningPath, SubtopicProgress
    from execution.models import CodeExecutionLog
    
    # Calculate statistics
    total_conversations = Conversation.objects.filter(user=user).count()
    
    # Message stats
    message_stats = Message.objects.filter(conversation__user=user).aggregate(
        total=Count('id'),
        sent=Count('id', filter=Q(sender='user')),
        received=Count('id', filter=Q(sender='ai'))
    )
    
    # Learning path stats
    learning_paths = UserLearningPath.objects.filter(user=user)
    learning_paths_enrolled = learning_paths.count()
    learning_paths_completed = learning_paths.filter(completed_at__isnull=False).count()
    
    # Challenge stats across all learning paths
    challenge_stats = SubtopicProgress.objects.filter(
        user_path__user=user
    ).aggregate(
        completed=Sum('challenges_completed'),
        attempted=Sum('challenges_attempted')
    )
    
    # Code execution stats
    execution_stats = CodeExecutionLog.objects.filter(user=user).aggregate(
        total=Count('id'),
        successful=Count('id', filter=Q(success=True))
    )
    
    # Activity time stats
    activity_stats = UserActivitySession.objects.filter(user=user).aggregate(
        total_time=Sum('duration_seconds'),
        avg_session=Avg('duration_seconds'),
        session_count=Count('id')
    )
    
    # Calculate current streak (consecutive days with activity)
    current_streak = 0
    if activity_stats['session_count'] and activity_stats['session_count'] > 0:
        # Get recent sessions ordered by date
        recent_sessions = UserActivitySession.objects.filter(
            user=user
        ).order_by('-started_at').values_list('started_at', flat=True)[:30]
        
        if recent_sessions:
            current_date = timezone.now().date()
            streak_date = current_date
            
            for session_time in recent_sessions:
                session_date = session_time.date()
                if session_date == streak_date:
                    continue
                elif session_date == streak_date - timedelta(days=1):
                    current_streak += 1
                    streak_date = session_date
                else:
                    break
            
            # Check if there's activity today
            if recent_sessions[0].date() == current_date:
                current_streak += 1
    
    stats = UserStatsResponse(
        total_conversations=total_conversations,
        total_messages=message_stats['total'] or 0,
        learning_paths_enrolled=learning_paths_enrolled,
        learning_paths_completed=learning_paths_completed,
        code_executions=execution_stats['total'] or 0,
        successful_executions=execution_stats['successful'] or 0,
        total_time_spent_seconds=activity_stats['total_time'] or 0,
        average_session_duration_seconds=int(activity_stats['avg_session'] or 0),
        messages_sent=message_stats['sent'] or 0,
        messages_received=message_stats['received'] or 0,
        challenges_completed=challenge_stats['completed'] or 0,
        challenges_attempted=challenge_stats['attempted'] or 0,
        current_streak_days=current_streak
    )
    
    return UserProfileResponse(
        id=str(user.id),
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        skill_level=user.skill_level,
        date_joined=user.date_joined.isoformat(),
        stats=stats
    )


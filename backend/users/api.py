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
)
from django.contrib.auth import authenticate
from uuid import uuid4
from datetime import timedelta
from django.utils import timezone
from users.models import CustomUser, RefreshToken
from django.db import IntegrityError
from typing import Dict
from users.utils.ninja import public_post
import jwt

router = Router()


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


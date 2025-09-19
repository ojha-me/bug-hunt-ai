from ninja import Router, Schema
from users.utils.auth import create_jwt, decode_jwt
import jwt
from users.api_types import CreateUserSchema, CreateUserResponse, UserResponseAttributes
from django.contrib.auth import authenticate
from uuid import uuid4
from datetime import timedelta
from django.utils import timezone
from users.models import CustomUser, RefreshToken
from django.db import IntegrityError
from typing import Dict
from users.utils.ninja import public_post

router = Router()

class TokenPair(Schema):
    access_token: str
    refresh_token: str

class LoginParams(Schema):
    email: str
    password: str

class RefreshTokenParams(Schema):
    refresh_token: str

class LogoutParams(Schema):
    refresh_token: str


@public_post(router, "/login", response={200: TokenPair, 401: Dict[str, str]})
def login(request, params: LoginParams):
    user = authenticate(request, username=params.email, password=params.password)
    if not user:
        return 401, {"error": "Invalid credentials"}
    
    access_token = create_jwt(user.id, "access")
    jti = uuid4()
    refresh_token = create_jwt(user.id, "refresh", str(jti))

    RefreshToken.objects.create(
        jti=decode_jwt(refresh_token).get("jti"),
        user=user,
        expires_at=timezone.now() + timedelta(days=30)
    )
    return 200, TokenPair(access_token=access_token, refresh_token=refresh_token)



@public_post(router, "/refresh", response={200: TokenPair, 401: Dict[str, str]})
def refresh_token(request, params: RefreshTokenParams):
    try:
        payload = decode_jwt(params.refresh_token)
        if payload.get("type") != "refresh":
            return 401, {"error": "Invalid token type"}
        user_id = payload.get("user_id")

        jti = payload.get("jti")
        refresh_token = RefreshToken.objects.filter(jti=jti).first()
        if not refresh_token:
            return 401, {"error": "Invalid token"}
        # revoke the older token
        refresh_token.revoked = True
        refresh_token.save()

        new_jti = uuid4()
        refresh_token = create_jwt(user_id, "refresh", str(new_jti))
        RefreshToken.objects.create(
            jti=new_jti,
            user_id=user_id,
            expires_at=timezone.now() + timedelta(days=30)
        )

        access_token = create_jwt(user_id, "access")
        
        return 200, TokenPair(access_token=access_token, refresh_token=refresh_token)
    except jwt.PyJWTError:
        return 401, {"error": "Invalid token"}
    

@public_post(router, "/logout", response={200: None})
def logout(request, params: LogoutParams):
    payload = decode_jwt(params.refresh_token)
    jti = payload.get("jti")
    token_obj = RefreshToken.objects.filter(jti=jti, revoked=False).first()
    if token_obj:
        token_obj.revoked = True
        token_obj.save()
    return 200, None


@public_post(router, "/create-user", response={200: CreateUserResponse, 400: Dict[str, str]})
def create_user(request, params: CreateUserSchema):
    try:
        user = CustomUser.objects.create_user(
            email=params.email,
            first_name=params.first_name,
            last_name=params.last_name,
            password=params.password,  
            skill_level=params.skill_level
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
                is_staff=user.is_staff
            )
        )
    except IntegrityError:
        return 400, {"error": "User with this email already exists"}
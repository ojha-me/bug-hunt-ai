from ninja import Router, Schema
from users.utils.auth import create_jwt, decode_jwt
import jwt
from users.api_types import CreateUserSchema, CreateUserResponse, UserResponseAttributes
from django.contrib.auth import authenticate
from django.http import JsonResponse
from uuid import uuid4
from datetime import timedelta
from django.utils import timezone
from users.models import CustomUser, RefreshToken
from django.db import IntegrityError
from typing import Dict, Any


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


@router.post("/login", response=TokenPair)
def login(request, params: LoginParams):
    user = authenticate(request, username=params.email, password=params.password)
    if not user:
        return JsonResponse({"error": "Invalid credentials"}, status=401)
    
    access_token = create_jwt(user.id, "access")
    jti = uuid4()
    refresh_token = create_jwt(user.id, "refresh", str(jti))

    RefreshToken.objects.create(
        jti=decode_jwt(refresh_token).get("jti"),
        user=user,
        expires_at=timezone.now() + timedelta(days=30)
    )
    return TokenPair(access_token=access_token, refresh_token=refresh_token)



@router.post("/refresh", response=TokenPair)
def refresh_token(request, params: RefreshTokenParams):
    try:
        payload = decode_jwt(params.refresh_token)
        if payload.get("type") != "refresh":
            return {"error": "Invalid token type"}, 401
        user_id = payload.get("user_id")

        jti = payload.get("jti")
        refresh_token = RefreshToken.objects.filter(jti=jti).first()
        if not refresh_token:
            return {"error": "Invalid token"}, 401
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
        
        return TokenPair(access_token=access_token, refresh_token=refresh_token)
    except jwt.PyJWTError:
        return {"error": "Invalid token"}, 401
    

@router.post("/logout", response=None)
def logout(request, params: LogoutParams):
    payload = decode_jwt(params.refresh_token)
    jti = payload.get("jti")
    token_obj = RefreshToken.objects.filter(jti=jti, revoked=False).first()
    if token_obj:
        token_obj.revoked = True
        token_obj.save()
    return None


@router.post("/create-user", response={200: CreateUserResponse, 400: Dict[str, str]})
def create_user(request, params: CreateUserSchema):
    try:
        user = CustomUser.objects.create_user(
            email=params.email,
            first_name=params.first_name,
            last_name=params.last_name,
            password=params.password,  
            skill_level=params.skill_level
        )
        return CreateUserResponse(
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
        return JsonResponse({"error": "User with this email already exists"}, status=400)
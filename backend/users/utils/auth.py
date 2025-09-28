from django.shortcuts import get_object_or_404
import jwt
from uuid import UUID, uuid4
from django.utils import timezone
from datetime import timedelta
from django.conf import settings
from typing import Literal
from django.http import HttpRequest
from users.models import CustomUser
from ninja.security import HttpBearer
from typing import Optional

JWT_ALGORITHM = "HS256"
JWT_ACCESS_LIFETIME = timedelta(minutes=100)
JWT_REFRESH_LIFETIME = timedelta(days=7)
JWT_ROTATE_REFRESH_TOKENS = True



def create_jwt(user_id: UUID, type: Literal["access", "refresh"], jti: str = None,) -> str:
    now = timezone.now()
    if type == "access":
        token_expire_delta = JWT_ACCESS_LIFETIME
    elif type == "refresh":
        token_expire_delta = JWT_REFRESH_LIFETIME
    
    payload = {
        "user_id": str(user_id),
        "type": type,
        "iat": int(now.timestamp()),
        "exp": int((now + token_expire_delta).timestamp()),
        "jti": jti or str(uuid4()),
    }
    token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return token


def decode_jwt(token: str) -> dict:
    return jwt.decode(
        token,
        settings.JWT_SECRET_KEY,
        algorithms=[JWT_ALGORITHM],
        leeway=0,
        options={"require_exp": True},
    )


class JWTAuth(HttpBearer):
    def authenticate(self, request: HttpRequest, token: str) -> Optional[CustomUser]:
        try:
            payload = decode_jwt(token)
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None

        if payload.get('type') != 'access':
            return None
        
        user_id = payload.get("user_id")
        if not user_id:
            return None
        
        try:
            user = CustomUser.objects.get(id=user_id)
            request.user = user
            return user
        except CustomUser.DoesNotExist:
            return None

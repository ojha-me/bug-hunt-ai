from django.shortcuts import get_object_or_404
from httpx import stream
import jwt
from uuid import UUID, uuid4
from datetime import datetime, timezone, timedelta
from django.conf import settings
from typing import Literal
from django.http import HttpRequest
from users.models import CustomUser
from typing import Optional

JWT_ALGORITHM = "HS256"
JWT_ACCESS_LIFETIME = timedelta(minutes=10)
JWT_REFRESH_LIFETIME = timedelta(days=7)
JWT_ROTATE_REFRESH_TOKENS = True



def create_jwt(user_id: UUID, type: Literal["access", "refresh"], jti: str = None,) -> str:
    now = datetime.now(tz=timezone.utc)
    
    if type == "access":
        token_expire_delta = JWT_ACCESS_LIFETIME
    elif type == "refresh":
        token_expire_delta = JWT_REFRESH_LIFETIME
    
    payload = {
        "user_id": user_id,
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


class JWTAuth:
    def authenticate(self, request: HttpRequest, token: str) -> Optional[CustomUser]:
        try:
            payload = decode_jwt(token)
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None

        if payload['type'] != 'access':
            return None
        
        user_id =  payload["user_id"]
        if not user_id:
            return None
        
        user =  get_object_or_404(CustomUser, id=user_id)
        request.user = user
        
        return user
    
            

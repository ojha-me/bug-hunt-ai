from users.models import CustomUser
from typing import Optional
from users.utils.auth import decode_jwt
from channels.db import database_sync_to_async
from urllib.parse import parse_qs

async def authenticate_user(scope) -> Optional[CustomUser]:
    """
    Decode token from WebSocket scope and return the user.
    """
    query_string = scope['query_string'].decode()
    token = parse_qs(query_string).get("token", [None])[0]
    if not token:
        raise ValueError("No token provided")

    decoded_token = decode_jwt(token)
    user_id = decoded_token.get("user_id")
    if not user_id:
        raise ValueError("Invalid token")

    user = await database_sync_to_async(CustomUser.objects.get)(id=user_id)
    return user



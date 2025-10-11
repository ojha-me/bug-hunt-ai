from ninja import Schema
from users.models import SkillLevelChoices

class CreateUserSchema(Schema):
    email: str
    first_name: str
    last_name: str
    password: str
    skill_level: SkillLevelChoices


class UserResponseAttributes(Schema):
    email: str
    first_name: str
    last_name: str
    skill_level: SkillLevelChoices
    date_joined: str
    is_active: bool
    is_staff: bool

class CreateUserResponse(Schema):
    id: str
    attributes: UserResponseAttributes


class TokenResponse(Schema):
    access_token: str

class LoginParams(Schema):
    email: str
    password: str

class LogoutParams(Schema):
    refresh_token: str


class UserStatsResponse(Schema):
    total_conversations: int
    total_messages: int
    learning_paths_enrolled: int
    learning_paths_completed: int
    code_executions: int
    successful_executions: int
    total_time_spent_seconds: int
    average_session_duration_seconds: int
    messages_sent: int
    messages_received: int
    challenges_completed: int
    challenges_attempted: int
    current_streak_days: int


class UserProfileResponse(Schema):
    id: str
    email: str
    first_name: str
    last_name: str
    skill_level: str
    date_joined: str
    stats: UserStatsResponse

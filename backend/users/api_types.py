from ninja import Schema
from users.models import SkillLevelChoices

class CreateUserSchema(Schema):
    email: str
    first_name: str
    last_name: str
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



    


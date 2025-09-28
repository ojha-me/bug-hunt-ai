from ninja import Schema
from typing import Optional


class RunParams(Schema):
    code: str
    language: str

class RunResponse(Schema):
    output: str
    error: Optional[str] = None

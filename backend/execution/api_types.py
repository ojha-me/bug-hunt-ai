from ninja import Schema
from typing import List, Optional
from uuid import UUID


class TestCaseIn(Schema):
    name: Optional[str] = None
    stdin: str = ""
    expected_output: str = ""


class RunParams(Schema):
    code: str
    language: str
    test_cases: Optional[List[TestCaseIn]] = None
    conversation_id: Optional[UUID] = None


class TestCaseResult(Schema):
    name: str
    stdin: str
    expected_output: str
    actual_output: str
    verdict: str
    execution_time_ms: Optional[int] = None
    error: Optional[str] = None


class RunResponse(Schema):
    output: str
    error: Optional[str] = None
    success: bool = True
    execution_time_ms: Optional[int] = None
    test_results: Optional[List[TestCaseResult]] = None
    summary: Optional[dict] = None
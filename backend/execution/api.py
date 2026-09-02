from ninja import Router
from users.utils.ninja import post
from django.http import HttpRequest
from execution.models import CodeExecutionLog
from execution.services.python_executor import run_python, judge_python
from .api_types import (
    RunParams,
    RunResponse,
    TestCaseIn,
    TestCaseResult,
)

router = Router(tags=["execution"])

MAX_TEST_CASES = 8

def _test_cases_dicts(cases: list[TestCaseIn]) -> list[dict]:
    return [{"name": c.name, "stdin": c.stdin, "expected_output": c.expected_output} for c in cases]


def _log_execution(request: HttpRequest, params: RunParams, success: bool,
                   execution_time_ms: int | None, error_type: str | None = None):
    try:
        CodeExecutionLog.objects.create(
            user=request.user,
            conversation_id=params.conversation_id,
            language=params.language,
            code_length=len(params.code),
            execution_time_ms=execution_time_ms,
            success=success,
            error_type=error_type,
        )
    except Exception:  # never let logging break an execution response
        pass


@post(router, "run", response={200: RunResponse})
def run(request: HttpRequest, params: RunParams):
    if params.language != "python":
        _log_execution(request, params, False, None, "unsupported_language")
        return RunResponse(
            output="",
            error="Only Python is supported in this demo.",
            success=False,
        )

    # ---- Test-case mode (judge) ----
    if params.test_cases:
        cases = params.test_cases[:MAX_TEST_CASES]
        results, summary = judge_python(params.code, _test_cases_dicts(cases), timeout=4)

        test_results = [
            TestCaseResult(**r) for r in results
        ]
        success = bool(summary["all_passed"])

        _log_execution(request, params, success, None,
                       None if success else "failed_tests")

        return RunResponse(
            output=f"{summary['passed']}/{summary['total']} test cases passed",
            error=None,
            success=success,
            test_results=test_results,
            summary=summary,
        )

    # ---- Plain run mode ----
    result = run_python(params.code, timeout=5)

    success = result.get("status") == 0
    error_type = "timeout" if result.get("timeout") else (None if success else "runtime_error")

    _log_execution(request, params, success, result.get("execution_time_ms"), error_type)

    return RunResponse(
        output=result.get("output", ""),
        error=result.get("error"),
        success=success,
        execution_time_ms=result.get("execution_time_ms"),
    )
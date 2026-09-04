from uuid import UUID
from typing import List, Dict
from django.http import HttpRequest
from django.shortcuts import get_object_or_404
from ninja import Router
from users.utils.ninja import get, post
from execution.services.python_executor import judge_python, judge_function
from execution.api_types import RunResponse, TestCaseResult
from challenges.models import CodingProblem, ProblemAttempt, ProblemTutorSession, ProblemList


def _judge_problem(problem: CodingProblem, code: str, timeout: int = 5):
    """Dispatch to the right judge based on the problem's mode."""
    if problem.judge_mode == CodingProblem.JudgeMode.FUNCTION:
        return judge_function(
            code, problem.test_cases,
            entry_point=problem.entry_point,
            param_types=problem.param_types or [],
            return_type=problem.return_type or "json",
            compare_mode=problem.compare_mode or "exact",
            timeout=timeout,
        )
    return judge_python(code, problem.test_cases, timeout=timeout)
from challenges.api_types import (
    CodingProblemSummary,
    CodingProblemDetail,
    SubmitParams,
    ProblemAttemptOut,
    MyProgressOut,
    ProblemListOut,
    SolutionOut,
    TutorChatIn,
    TutorChatOut,
    TutorHistoryOut,
)
from challenges.services.tutor import send_tutor_message
from collections import defaultdict

router = Router(tags=["challenges"])


def _problem_summary(problem: CodingProblem) -> CodingProblemSummary:
    return CodingProblemSummary(
        id=problem.id,
        title=problem.title,
        slug=problem.slug,
        difficulty=problem.difficulty,
        topics=problem.topics,
        stats=problem.attempt_stats,
    )


@get(router, "/problems", response={200: List[CodingProblemSummary], 401: Dict[str, str]})
def list_problems(request: HttpRequest):
    problems = CodingProblem.objects.filter(is_active=True)
    return [_problem_summary(p) for p in problems]


@get(router, "/problems/{problem_id}/solution", response={200: SolutionOut, 401: Dict[str, str], 404: Dict[str, str]})
def get_problem_solution(request: HttpRequest, problem_id: UUID):
    """The editorial solution — fetched only when the user explicitly reveals it."""
    problem = get_object_or_404(CodingProblem, id=problem_id, is_active=True)
    return SolutionOut(
        code=problem.solution_code,
        explanation=problem.solution_explanation,
        complexity=problem.solution_complexity,
        available=bool(problem.solution_code),
    )


@get(router, "/lists", response={200: List[ProblemListOut], 401: Dict[str, str]})
def list_problem_lists(request: HttpRequest):
    return [
        ProblemListOut(
            slug=pl.slug, name=pl.name, description=pl.description,
            problem_slugs=pl.problem_slugs, count=len(pl.problem_slugs),
        )
        for pl in ProblemList.objects.filter(is_active=True)
    ]


@get(router, "/my-progress", response={200: List[MyProgressOut], 401: Dict[str, str]})
def my_progress(request: HttpRequest):
    """
    Per-problem progress for the dashboard: solved flag, attempt count, best result.
    """
    problems = list(CodingProblem.objects.filter(is_active=True))
    attempts = ProblemAttempt.objects.filter(user=request.user).only(
        "problem_id", "verdict", "passed_count", "total_count"
    )
    by_problem: Dict[UUID, List[ProblemAttempt]] = defaultdict(list)
    for attempt in attempts:
        by_problem[attempt.problem_id].append(attempt)

    result = []
    for problem in problems:
        user_attempts = by_problem.get(problem.id, [])
        best = max(user_attempts, key=lambda a: (a.verdict == "passed", a.passed_count), default=None)
        result.append(MyProgressOut(
            problem_id=problem.id,
            title=problem.title,
            difficulty=problem.difficulty,
            topics=problem.topics,
            solved=any(a.verdict == "passed" for a in user_attempts),
            attempts=len(user_attempts),
            best_passed=best.passed_count if best else 0,
            best_total=best.total_count if best else 0,
        ))
    return result


@get(router, "/problems/{problem_id}", response={200: CodingProblemDetail, 401: Dict[str, str], 404: Dict[str, str]})
def get_problem(request: HttpRequest, problem_id: UUID):
    problem = get_object_or_404(CodingProblem, id=problem_id, is_active=True)
    return CodingProblemDetail(
        id=problem.id,
        title=problem.title,
        slug=problem.slug,
        difficulty=problem.difficulty,
        topics=problem.topics,
        description=problem.description,
        examples=problem.examples,
        constraints=problem.constraints,
        starter_code=problem.starter_code,
        test_cases=[],  # judging is server-side; never ship expected answers to the client
        stats=problem.attempt_stats,
    )


@post(router, "/problems/{problem_id}/submit", response={200: RunResponse, 401: Dict[str, str], 404: Dict[str, str]})
def submit_problem(request: HttpRequest, problem_id: UUID, params: SubmitParams):
    """
    Judge the user's code against the problem's stored test cases and record
    a ProblemAttempt with the verdict.
    """
    problem = get_object_or_404(CodingProblem, id=problem_id, is_active=True)

    if not problem.test_cases:
        return RunResponse(output="", error="This problem has no test cases.", success=False)

    if params.language != "python":
        return RunResponse(output="", error="Only Python is supported in this demo.", success=False)

    results, summary = _judge_problem(problem, params.code, timeout=5)

    if summary["all_passed"]:
        verdict = "passed"
    elif any(r["verdict"] == "timeout" for r in results):
        verdict = "timeout"
    elif any(r["verdict"] == "error" for r in results):
        verdict = "error"
    else:
        verdict = "failed"

    times = [r.get("execution_time_ms") for r in results if r.get("execution_time_ms")]

    try:
        ProblemAttempt.objects.create(
            user=request.user,
            problem=problem,
            code=params.code,
            language=params.language,
            verdict=verdict,
            passed_count=summary["passed"],
            total_count=summary["total"],
            execution_time_ms=max(times) if times else None,
        )
    except Exception:
        pass  # never let recording break the response

    if verdict != "passed":
        try:
            from revision.api import upsert_for_problem
            upsert_for_problem(
                request.user, problem,
                title=problem.title,
                difficulty=problem.difficulty,
                topics=problem.topics,
            )
        except Exception:
            pass  # revision queue is best-effort

    test_results = [TestCaseResult(**r) for r in results]
    return RunResponse(
        output=f"{summary['passed']}/{summary['total']} test cases passed",
        error=None,
        success=summary["all_passed"],
        test_results=test_results,
        summary=summary,
    )


@post(router, "/problems/{problem_id}/run", response={200: RunResponse, 401: Dict[str, str], 404: Dict[str, str]})
def run_problem(request: HttpRequest, problem_id: UUID, params: SubmitParams):
    """
    Judge the user's code against the problem's stored test cases WITHOUT
    recording an attempt (the "Run tests" button). Judging happens server-side
    using the problem's stored config, so answers are never sent to the client.
    """
    problem = get_object_or_404(CodingProblem, id=problem_id, is_active=True)
    if not problem.test_cases:
        return RunResponse(output="", error="This problem has no test cases.", success=False)
    if params.language != "python":
        return RunResponse(output="", error="Only Python is supported in this demo.", success=False)

    results, summary = _judge_problem(problem, params.code, timeout=5)
    return RunResponse(
        output=f"{summary['passed']}/{summary['total']} test cases passed",
        error=None,
        success=summary["all_passed"],
        test_results=[TestCaseResult(**r) for r in results],
        summary=summary,
    )


@get(router, "/problems/{problem_id}/attempts",
     response={200: List[ProblemAttemptOut], 401: Dict[str, str], 404: Dict[str, str]})
def list_attempts(request: HttpRequest, problem_id: UUID):
    problem = get_object_or_404(CodingProblem, id=problem_id, is_active=True)
    attempts = ProblemAttempt.objects.filter(user=request.user, problem=problem)[:10]
    return [
        ProblemAttemptOut(
            id=a.id,
            verdict=a.verdict,
            passed_count=a.passed_count,
            total_count=a.total_count,
            execution_time_ms=a.execution_time_ms,
            submitted_at=a.submitted_at.isoformat(),
            code=a.code,
        )
        for a in attempts
    ]


@get(router, "/problems/{problem_id}/chat",
     response={200: TutorHistoryOut, 401: Dict[str, str], 404: Dict[str, str]})
def get_tutor_history(request: HttpRequest, problem_id: UUID):
    problem = get_object_or_404(CodingProblem, id=problem_id, is_active=True)
    session, _ = ProblemTutorSession.objects.get_or_create(user=request.user, problem=problem)
    return TutorHistoryOut(history=session.history or [])


@post(router, "/problems/{problem_id}/chat",
      response={200: TutorChatOut, 401: Dict[str, str], 404: Dict[str, str]})
def tutor_chat(request: HttpRequest, problem_id: UUID, params: TutorChatIn):
    problem = get_object_or_404(CodingProblem, id=problem_id, is_active=True)
    session, _ = ProblemTutorSession.objects.get_or_create(user=request.user, problem=problem)
    reply = send_tutor_message(problem, session, params.message, params.code)
    return TutorChatOut(reply=reply, history=session.history or [])
from typing import List, Dict
from django.http import HttpRequest
from django.shortcuts import get_object_or_404
from django.utils import timezone
from ninja import Router
from users.utils.ninja import get, post
from revision.models import RevisionItem
from revision.api_types import RevisionItemOut, ReviewIn, ReviewOut

router = Router(tags=["revision"])


def _out(item: RevisionItem) -> RevisionItemOut:
    return RevisionItemOut(
        id=item.id,
        problem_id=item.problem_id,
        title=item.title,
        difficulty=item.difficulty,
        topics=item.topics,
        repetitions=item.repetitions,
        ease=item.ease,
        interval_days=item.interval_days,
        due_at=item.due_at,
        last_reviewed_at=item.last_reviewed_at,
    )


@get(router, "/due", response={200: List[RevisionItemOut], 401: Dict[str, str]})
def due_items(request: HttpRequest):
    """Items that are due for review, oldest first."""
    items = RevisionItem.objects.filter(user=request.user, due_at__lte=timezone.now())[:20]
    return [_out(i) for i in items]


@get(router, "/items", response={200: List[RevisionItemOut], 401: Dict[str, str]})
def all_items(request: HttpRequest):
    items = RevisionItem.objects.filter(user=request.user)[:100]
    return [_out(i) for i in items]


@post(router, "/items/{item_id}/review", response={200: ReviewOut, 401: Dict[str, str], 404: Dict[str, str]})
def review_item(request: HttpRequest, item_id: int, params: ReviewIn):
    item = get_object_or_404(RevisionItem, id=item_id, user=request.user)
    item.schedule(max(0, min(5, params.quality)))
    return ReviewOut(
        id=item.id,
        interval_days=item.interval_days,
        ease=item.ease,
        repetitions=item.repetitions,
        due_at=item.due_at,
    )


def upsert_for_problem(user, problem, title: str, difficulty: str, topics: list) -> RevisionItem:
    """
    Auto-create (or keep) a revision item for a problem the user hasn't passed.
    Called from the challenge submit flow.
    """
    item, created = RevisionItem.objects.get_or_create(
        user=user,
        problem=problem,
        defaults={
            "title": title,
            "difficulty": difficulty,
            "topics": topics,
            "due_at": timezone.now(),
        },
    )
    return item
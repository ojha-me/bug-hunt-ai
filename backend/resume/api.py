from typing import List, Dict
from uuid import UUID
from django.http import HttpRequest
from django.shortcuts import get_object_or_404
from ninja import Router
from users.utils.ninja import get, post

from resume.models import Resume, ResumeReview
from resume.services.resume_ai import ResumeAIService
from resume.api_types import (
    ResumeOut, ResumeSummary, CreateResumeSchema, UpdateResumeSchema,
    ReviewIn, ReviewOut, ReviewSummary,
)

router = Router(tags=["resume"])


def _resume_out(r: Resume) -> ResumeOut:
    return ResumeOut(id=r.id, name=r.name, content=r.content, is_primary=r.is_primary, updated_at=r.updated_at)


def _review_out(rv: ResumeReview) -> ReviewOut:
    return ReviewOut(
        id=rv.id, role_title=rv.role_title, job_description=rv.job_description,
        resume_id=rv.resume_id, feedback=rv.feedback or {}, tailored=rv.tailored,
        created_at=rv.created_at,
    )


# ---------------- resumes ----------------

@get(router, "/resumes", response={200: List[ResumeSummary], 401: Dict[str, str]})
def list_resumes(request: HttpRequest):
    qs = Resume.objects.filter(user=request.user)
    return [ResumeSummary(id=r.id, name=r.name, is_primary=r.is_primary, updated_at=r.updated_at) for r in qs]


@get(router, "/resumes/{resume_id}", response={200: ResumeOut, 401: Dict[str, str], 404: Dict[str, str]})
def get_resume(request: HttpRequest, resume_id: UUID):
    return _resume_out(get_object_or_404(Resume, id=resume_id, user=request.user))


@post(router, "/resumes", response={200: ResumeOut, 401: Dict[str, str]})
def create_resume(request: HttpRequest, params: CreateResumeSchema):
    if params.is_primary:
        Resume.objects.filter(user=request.user, is_primary=True).update(is_primary=False)
    r = Resume.objects.create(
        user=request.user, name=params.name or "My Resume",
        content=params.content or "", is_primary=params.is_primary,
    )
    return _resume_out(r)


@post(router, "/resumes/{resume_id}/update", response={200: ResumeOut, 401: Dict[str, str], 404: Dict[str, str]})
def update_resume(request: HttpRequest, resume_id: UUID, params: UpdateResumeSchema):
    r = get_object_or_404(Resume, id=resume_id, user=request.user)
    if params.is_primary:
        Resume.objects.filter(user=request.user, is_primary=True).exclude(id=r.id).update(is_primary=False)
    fields = []
    for f in ("name", "content", "is_primary"):
        val = getattr(params, f)
        if val is not None:
            setattr(r, f, val)
            fields.append(f)
    if fields:
        r.save(update_fields=fields + ["updated_at"])
    return _resume_out(r)


@post(router, "/resumes/{resume_id}/delete", response={200: Dict[str, str], 401: Dict[str, str], 404: Dict[str, str]})
def delete_resume(request: HttpRequest, resume_id: UUID):
    r = get_object_or_404(Resume, id=resume_id, user=request.user)
    r.delete()
    return {"detail": "deleted"}


# ---------------- reviews ----------------

def _resolve_resume_text(request, params: ReviewIn):
    resume = None
    if params.resume_id:
        resume = get_object_or_404(Resume, id=params.resume_id, user=request.user)
        return resume, resume.content
    return None, (params.resume_content or "")


@post(router, "/review", response={200: ReviewOut, 400: Dict[str, str], 401: Dict[str, str], 404: Dict[str, str]})
def review_resume(request: HttpRequest, params: ReviewIn):
    if not params.job_description or not params.job_description.strip():
        return 400, {"detail": "A job description is required."}
    resume, resume_text = _resolve_resume_text(request, params)
    if not resume_text.strip():
        return 400, {"detail": "Add your resume content first."}

    feedback = ResumeAIService().review(resume_text, params.job_description)
    rv = ResumeReview.objects.create(
        user=request.user, resume=resume, role_title=(params.role_title or "")[:200],
        job_description=params.job_description, feedback=feedback,
    )
    return _review_out(rv)


@post(router, "/reviews/{review_id}/tailor", response={200: ReviewOut, 400: Dict[str, str], 401: Dict[str, str], 404: Dict[str, str]})
def tailor_review(request: HttpRequest, review_id: UUID):
    rv = get_object_or_404(ResumeReview, id=review_id, user=request.user)
    resume_text = rv.resume.content if rv.resume else ""
    if not resume_text.strip():
        return 400, {"detail": "The resume for this review is no longer available."}
    rv.tailored = ResumeAIService().tailor(resume_text, rv.job_description)
    rv.save(update_fields=["tailored"])
    return _review_out(rv)


@get(router, "/reviews", response={200: List[ReviewSummary], 401: Dict[str, str]})
def list_reviews(request: HttpRequest):
    qs = ResumeReview.objects.filter(user=request.user)[:40]
    return [
        ReviewSummary(
            id=rv.id, role_title=rv.role_title or "Untitled role",
            match_score=(rv.feedback or {}).get("match_score", 0), created_at=rv.created_at,
        )
        for rv in qs
    ]


@get(router, "/reviews/{review_id}", response={200: ReviewOut, 401: Dict[str, str], 404: Dict[str, str]})
def get_review(request: HttpRequest, review_id: UUID):
    return _review_out(get_object_or_404(ResumeReview, id=review_id, user=request.user))

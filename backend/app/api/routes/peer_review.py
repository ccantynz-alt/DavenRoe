"""Peer Review API — authorize external accountants for manual checks and sign-offs."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.auth.dependencies import get_current_user
from app.models.user import User
from app.peer_review.engine import (
    PeerReviewEngine, ReviewerRole, AccessScope,
)

router = APIRouter(prefix="/peer-review", tags=["Peer Review"])
engine = PeerReviewEngine()


class InviteRequest(BaseModel):
    entity_id: str
    entity_name: str
    invitee_email: str = Field(..., description="Email of the external accountant")
    invitee_name: str
    role: str = Field("external_accountant", description="external_accountant, external_auditor, tax_agent, partner, peer_reviewer")
    scope: str = Field("review_approve", description="read_only, review_approve, full_review")
    permissions: list[str] = Field(default_factory=list)
    expires_in_days: int = Field(30, ge=1, le=365)
    message: str = ""


class ReviewRequest(BaseModel):
    entity_id: str
    entity_name: str
    review_type: str = Field(..., description="month_end, tax_return, bas_review, annual_audit, ad_hoc")
    description: str
    items: list[dict] = Field(default_factory=list, description="Items to review")
    assigned_reviewers: list[str] = Field(..., description="List of reviewer user IDs")
    due_date: str | None = None


class SignOffRequest(BaseModel):
    decision: str = Field(..., description="approved, rejected, or changes_requested")
    notes: str = ""


class NoteRequest(BaseModel):
    content: str
    item_ref: str | None = None


# ── Invitations ────────────────────────────────────────────────

@router.post("/invites")
async def create_invite(req: InviteRequest, user: User = Depends(get_current_user)):
    """Invite an external accountant to review work."""
    user_id = str(user.id) if hasattr(user, "id") else "system"
    user_name = getattr(user, "full_name", getattr(user, "email", "Unknown"))

    try:
        role = ReviewerRole(req.role)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid role: {req.role}")
    try:
        scope = AccessScope(req.scope)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid scope: {req.scope}")

    invite = engine.create_invite(
        inviter_id=user_id,
        inviter_name=user_name,
        entity_id=req.entity_id,
        entity_name=req.entity_name,
        invitee_email=req.invitee_email,
        invitee_name=req.invitee_name,
        role=role,
        scope=scope,
        permissions=req.permissions,
        expires_in_days=req.expires_in_days,
        message=req.message,
    )
    return invite


@router.get("/invites")
async def list_invites(
    entity_id: str | None = None,
    user: User = Depends(get_current_user),
):
    """List all invitations."""
    user_id = str(user.id) if hasattr(user, "id") else "system"
    return {"invites": engine.list_invites(entity_id=entity_id, inviter_id=user_id)}


@router.post("/invites/{invite_id}/accept")
async def accept_invite(invite_id: str, user: User = Depends(get_current_user)):
    """Accept an invitation (called by the invited accountant)."""
    user_id = str(user.id) if hasattr(user, "id") else "system"
    try:
        return engine.accept_invite(invite_id, user_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/invites/{invite_id}/revoke")
async def revoke_invite(invite_id: str, user: User = Depends(get_current_user)):
    """Revoke an invitation."""
    try:
        return engine.revoke_invite(invite_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/invites/{invite_id}/permissions")
async def get_invite_permissions(invite_id: str, user: User = Depends(get_current_user)):
    """Get effective permissions for an accepted invite."""
    perms = engine.get_reviewer_permissions(invite_id)
    return {"invite_id": invite_id, "permissions": perms}


# ── Reviews ────────────────────────────────────────────────────

@router.post("/reviews")
async def create_review(req: ReviewRequest, user: User = Depends(get_current_user)):
    """Create a review request for external accountants."""
    user_id = str(user.id) if hasattr(user, "id") else "system"
    review = engine.create_review(
        entity_id=req.entity_id,
        entity_name=req.entity_name,
        review_type=req.review_type,
        description=req.description,
        created_by=user_id,
        items=req.items,
        assigned_reviewers=req.assigned_reviewers,
        due_date=req.due_date,
    )
    return review


@router.get("/reviews")
async def list_reviews(
    entity_id: str | None = None,
    status: str | None = None,
    user: User = Depends(get_current_user),
):
    """List reviews, optionally filtered by entity or status."""
    return {"reviews": engine.list_reviews(entity_id=entity_id, status=status)}


@router.get("/reviews/{review_id}")
async def get_review(review_id: str, user: User = Depends(get_current_user)):
    """Get a single review with notes and sign-offs."""
    review = engine.get_review(review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    return review


@router.post("/reviews/{review_id}/sign-off")
async def submit_sign_off(
    review_id: str,
    req: SignOffRequest,
    user: User = Depends(get_current_user),
):
    """Submit a sign-off decision (approve, reject, or request changes)."""
    user_id = str(user.id) if hasattr(user, "id") else "system"
    user_name = getattr(user, "full_name", getattr(user, "email", "Unknown"))
    try:
        return engine.submit_sign_off(review_id, user_id, user_name, req.decision, req.notes)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/reviews/{review_id}/notes")
async def add_note(
    review_id: str,
    req: NoteRequest,
    user: User = Depends(get_current_user),
):
    """Add a note or comment to a review."""
    user_id = str(user.id) if hasattr(user, "id") else "system"
    user_name = getattr(user, "full_name", getattr(user, "email", "Unknown"))
    try:
        return engine.add_review_note(review_id, user_id, user_name, req.content, req.item_ref)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

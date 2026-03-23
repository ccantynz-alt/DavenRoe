"""Audit Trail API routes."""

from fastapi import APIRouter, Depends
from app.auditlog.helpers import get_trail
from app.auth.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/audit", tags=["Audit Trail"])
trail = get_trail()


@router.post("/log")
async def log_event(data: dict, user: User = Depends(get_current_user)):
    entry = trail.log(
        user_id=data.get("user_id", ""),
        user_name=data.get("user_name", ""),
        action=data.get("action", "view"),
        resource_type=data.get("resource_type", ""),
        resource_id=data.get("resource_id", ""),
        entity_id=data.get("entity_id", ""),
        description=data.get("description", ""),
        before_state=data.get("before_state"),
        after_state=data.get("after_state"),
    )
    return entry.to_dict()


@router.get("/query")
async def query_trail(
    user_id: str | None = None, entity_id: str | None = None,
    resource_type: str | None = None, action: str | None = None,
    limit: int = 100, user: User = Depends(get_current_user),
):
    entries = trail.query(user_id=user_id, entity_id=entity_id, resource_type=resource_type, action=action, limit=limit)
    return {"entries": [e.to_dict() for e in entries], "total": len(entries)}


@router.get("/verify")
async def verify_integrity(user: User = Depends(get_current_user)):
    return trail.verify_integrity()


@router.get("/history/{resource_type}/{resource_id}")
async def resource_history(resource_type: str, resource_id: str, user: User = Depends(get_current_user)):
    return {"history": trail.get_history(resource_type, resource_id)}

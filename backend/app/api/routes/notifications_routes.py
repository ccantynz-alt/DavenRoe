"""Notification API routes."""

from fastapi import APIRouter, Depends
from app.notifications.engine import NotificationEngine
from app.auth.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/notifications", tags=["Notifications"])
engine = NotificationEngine()


@router.post("/")
async def create_notification(data: dict, user: User = Depends(get_current_user)):
    notif = engine.create(**data)
    return notif.to_dict()


@router.get("/user/{user_id}")
async def get_user_notifications(user_id: str, unread_only: bool = False, user: User = Depends(get_current_user)):
    notifs = engine.get_for_user(user_id, unread_only)
    return {"notifications": [n.to_dict() for n in notifs], "count": len(notifs)}


@router.post("/{notification_id}/read")
async def mark_read(notification_id: str, user: User = Depends(get_current_user)):
    engine.mark_read(notification_id)
    return {"status": "read"}


@router.post("/generate/deadlines")
async def generate_deadline_alerts(data: dict, user: User = Depends(get_current_user)):
    alerts = engine.generate_deadline_alerts(
        data.get("deadlines", []),
        data.get("user_id", ""),
    )
    return {"alerts_generated": len(alerts), "alerts": [a.to_dict() for a in alerts]}


@router.get("/summary/{user_id}")
async def notification_summary(user_id: str, user: User = Depends(get_current_user)):
    return engine.summary(user_id)

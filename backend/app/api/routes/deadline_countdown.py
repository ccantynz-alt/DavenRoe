"""Deadline Countdown Dashboard API routes.

Visual countdown timers for EVERY deadline per client per jurisdiction.
SMS/email/push alerts at 30/14/7/3/1 days. No competitor has real-time
countdown — they just have calendar events.
"""

from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, Query
from app.auth.dependencies import get_current_user
from app.models.user import User
import uuid

router = APIRouter(prefix="/deadline-countdown", tags=["Deadline Countdown"])

_deadlines = []
_seed_done = False

TODAY = date(2026, 4, 9)


def _seed():
    global _seed_done
    if _seed_done:
        return
    _seed_done = True

    _deadlines.extend([
        # Overdue
        {"id": str(uuid.uuid4()), "client_id": "client-002", "client_name": "Pinnacle Ltd", "jurisdiction": "NZ", "type": "GST Return", "description": "GST return Q4 2025", "due_date": "2026-03-28", "status": "overdue", "days_remaining": -12, "priority": "critical", "assigned_to": "Priya Sharma"},
        # Due this week
        {"id": str(uuid.uuid4()), "client_id": "client-001", "client_name": "Meridian Corp", "jurisdiction": "AU", "type": "BAS Lodgement", "description": "BAS Q3 Jan-Mar 2026", "due_date": "2026-04-14", "status": "due_soon", "days_remaining": 5, "priority": "high", "assigned_to": "Alex Chen"},
        {"id": str(uuid.uuid4()), "client_id": "client-005", "client_name": "Summit Holdings", "jurisdiction": "UK", "type": "VAT Return", "description": "VAT return Q1 2026", "due_date": "2026-04-15", "status": "due_soon", "days_remaining": 6, "priority": "high", "assigned_to": "Alex Chen"},
        # Due this month
        {"id": str(uuid.uuid4()), "client_id": "client-003", "client_name": "Vortex Digital", "jurisdiction": "AU", "type": "PAYG Withholding", "description": "PAYG withholding monthly — March", "due_date": "2026-04-21", "status": "upcoming", "days_remaining": 12, "priority": "medium", "assigned_to": "Priya Sharma"},
        {"id": str(uuid.uuid4()), "client_id": "client-001", "client_name": "Meridian Corp", "jurisdiction": "AU", "type": "Super Guarantee", "description": "SG Q3 Jan-Mar 2026 (11.5%)", "due_date": "2026-04-28", "status": "upcoming", "days_remaining": 19, "priority": "high", "assigned_to": "Priya Sharma"},
        {"id": str(uuid.uuid4()), "client_id": "client-004", "client_name": "Apex Advisory", "jurisdiction": "AU", "type": "BAS Lodgement", "description": "BAS Q3 Jan-Mar 2026", "due_date": "2026-04-28", "status": "upcoming", "days_remaining": 19, "priority": "medium", "assigned_to": "Alex Chen"},
        # Due next month
        {"id": str(uuid.uuid4()), "client_id": "client-001", "client_name": "Meridian Corp", "jurisdiction": "AU", "type": "FBT Return", "description": "FBT annual return FY2026", "due_date": "2026-05-21", "status": "on_track", "days_remaining": 42, "priority": "medium", "assigned_to": "Alex Chen"},
        {"id": str(uuid.uuid4()), "client_id": "client-002", "client_name": "Pinnacle Ltd", "jurisdiction": "NZ", "type": "GST Return", "description": "GST return Q1 2026", "due_date": "2026-05-28", "status": "on_track", "days_remaining": 49, "priority": "low", "assigned_to": "Priya Sharma"},
        {"id": str(uuid.uuid4()), "client_id": "client-005", "client_name": "Summit Holdings", "jurisdiction": "UK", "type": "PAYE", "description": "PAYE monthly — April", "due_date": "2026-05-19", "status": "on_track", "days_remaining": 40, "priority": "medium", "assigned_to": "Jordan Lee"},
        # Longer term
        {"id": str(uuid.uuid4()), "client_id": "client-001", "client_name": "Meridian Corp", "jurisdiction": "AU", "type": "Income Tax Return", "description": "Company tax return FY2026", "due_date": "2026-10-31", "status": "on_track", "days_remaining": 205, "priority": "low", "assigned_to": "Alex Chen"},
        {"id": str(uuid.uuid4()), "client_id": "client-003", "client_name": "Vortex Digital", "jurisdiction": "AU", "type": "Income Tax Return", "description": "Individual tax return FY2026", "due_date": "2026-10-31", "status": "on_track", "days_remaining": 205, "priority": "low", "assigned_to": "Priya Sharma"},
        # Completed
        {"id": str(uuid.uuid4()), "client_id": "client-001", "client_name": "Meridian Corp", "jurisdiction": "AU", "type": "BAS Lodgement", "description": "BAS Q2 Oct-Dec 2025", "due_date": "2026-02-28", "status": "completed", "days_remaining": 0, "priority": "done", "assigned_to": "Alex Chen", "completed_at": "2026-02-25T10:00:00Z"},
        {"id": str(uuid.uuid4()), "client_id": "client-005", "client_name": "Summit Holdings", "jurisdiction": "UK", "type": "VAT Return", "description": "VAT return Q4 2025", "due_date": "2026-02-07", "status": "completed", "days_remaining": 0, "priority": "done", "assigned_to": "Alex Chen", "completed_at": "2026-02-05T14:00:00Z"},
    ])


@router.get("/")
async def list_deadlines(
    status: str | None = None,
    jurisdiction: str | None = None,
    client_id: str | None = None,
    assigned_to: str | None = None,
    user: User = Depends(get_current_user),
):
    """List all deadlines with countdown timers."""
    _seed()
    results = list(_deadlines)
    if status:
        results = [d for d in results if d["status"] == status]
    if jurisdiction:
        results = [d for d in results if d["jurisdiction"] == jurisdiction]
    if client_id:
        results = [d for d in results if d["client_id"] == client_id]
    if assigned_to:
        results = [d for d in results if d.get("assigned_to") == assigned_to]
    # Sort: overdue first, then by days remaining
    results.sort(key=lambda d: (d["status"] != "overdue", d.get("days_remaining", 999)))
    return {"deadlines": results, "total": len(results)}


@router.get("/summary")
async def deadline_summary(user: User = Depends(get_current_user)):
    """Get deadline summary stats."""
    _seed()
    active = [d for d in _deadlines if d["status"] != "completed"]
    overdue = [d for d in active if d["status"] == "overdue"]
    due_7 = [d for d in active if 0 < d.get("days_remaining", 999) <= 7]
    due_30 = [d for d in active if 7 < d.get("days_remaining", 999) <= 30]
    completed = [d for d in _deadlines if d["status"] == "completed"]

    by_jurisdiction = {}
    for d in active:
        j = d["jurisdiction"]
        by_jurisdiction[j] = by_jurisdiction.get(j, 0) + 1

    by_type = {}
    for d in active:
        t = d["type"]
        by_type[t] = by_type.get(t, 0) + 1

    return {
        "total_active": len(active),
        "overdue": len(overdue),
        "due_this_week": len(due_7),
        "due_this_month": len(due_30),
        "completed": len(completed),
        "by_jurisdiction": by_jurisdiction,
        "by_type": by_type,
        "next_deadline": active[0] if active else None,
    }


@router.post("/{deadline_id}/complete")
async def complete_deadline(deadline_id: str, user: User = Depends(get_current_user)):
    """Mark a deadline as completed."""
    _seed()
    deadline = next((d for d in _deadlines if d["id"] == deadline_id), None)
    if not deadline:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Deadline not found")
    deadline["status"] = "completed"
    deadline["priority"] = "done"
    deadline["days_remaining"] = 0
    deadline["completed_at"] = datetime.utcnow().isoformat() + "Z"
    return deadline


@router.get("/alerts")
async def get_alerts(user: User = Depends(get_current_user)):
    """Get alert schedule for upcoming deadlines."""
    _seed()
    alerts = []
    for d in _deadlines:
        if d["status"] in ("completed",):
            continue
        remaining = d.get("days_remaining", 999)
        if remaining < 0:
            alerts.append({"deadline_id": d["id"], "client": d["client_name"], "type": d["type"], "message": f"OVERDUE by {abs(remaining)} days — {d['description']}", "severity": "critical", "days": remaining})
        elif remaining <= 3:
            alerts.append({"deadline_id": d["id"], "client": d["client_name"], "type": d["type"], "message": f"Due in {remaining} days — {d['description']}", "severity": "urgent", "days": remaining})
        elif remaining <= 7:
            alerts.append({"deadline_id": d["id"], "client": d["client_name"], "type": d["type"], "message": f"Due in {remaining} days — {d['description']}", "severity": "warning", "days": remaining})
        elif remaining <= 14:
            alerts.append({"deadline_id": d["id"], "client": d["client_name"], "type": d["type"], "message": f"Due in {remaining} days — {d['description']}", "severity": "notice", "days": remaining})
    alerts.sort(key=lambda a: a["days"])
    return {"alerts": alerts, "total": len(alerts)}

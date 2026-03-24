"""Time Tracker API — simple start/stop timers with invoicing integration."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.auth.dependencies import get_current_user
from app.models.user import User
from app.time_tracker.engine import TimeTrackerEngine

router = APIRouter(prefix="/time-tracker", tags=["Time Tracker"])
engine = TimeTrackerEngine()


class StartTimerRequest(BaseModel):
    client_name: str = ""
    project_name: str = ""
    description: str = ""
    hourly_rate: float = 0
    billable: bool = True


class ManualEntryRequest(BaseModel):
    date: str
    hours: float = 0
    minutes: float = 0
    client_name: str = ""
    project_name: str = ""
    description: str = ""
    hourly_rate: float = 0
    billable: bool = True


class UpdateEntryRequest(BaseModel):
    client_name: str | None = None
    project_name: str | None = None
    description: str | None = None
    hourly_rate: float | None = None
    billable: bool | None = None


class InvoiceEntriesRequest(BaseModel):
    entry_ids: list[str]
    invoice_id: str


@router.post("/start")
async def start_timer(req: StartTimerRequest, user: User = Depends(get_current_user)):
    """Start a timer. Automatically stops any existing running timer."""
    user_id = str(user.id) if hasattr(user, "id") else "system"
    return engine.start_timer(
        user_id=user_id,
        client_name=req.client_name,
        project_name=req.project_name,
        description=req.description,
        hourly_rate=req.hourly_rate,
        billable=req.billable,
    )


@router.post("/stop")
async def stop_timer(user: User = Depends(get_current_user)):
    """Stop the currently running timer."""
    user_id = str(user.id) if hasattr(user, "id") else "system"
    entry = engine.stop_timer(user_id)
    if not entry:
        raise HTTPException(status_code=404, detail="No running timer")
    return entry


@router.get("/active")
async def get_active_timer(user: User = Depends(get_current_user)):
    """Get the currently running timer with live duration."""
    user_id = str(user.id) if hasattr(user, "id") else "system"
    entry = engine.get_active_timer(user_id)
    return {"active": entry}


@router.post("/manual")
async def add_manual_entry(req: ManualEntryRequest, user: User = Depends(get_current_user)):
    """Add a manual time entry for time already worked."""
    user_id = str(user.id) if hasattr(user, "id") else "system"
    return engine.add_manual_entry(
        user_id=user_id,
        date=req.date,
        hours=req.hours,
        minutes=req.minutes,
        client_name=req.client_name,
        project_name=req.project_name,
        description=req.description,
        hourly_rate=req.hourly_rate,
        billable=req.billable,
    )


@router.get("/entries")
async def list_entries(
    client_name: str | None = None,
    project_name: str | None = None,
    billable_only: bool = False,
    user: User = Depends(get_current_user),
):
    """List time entries with optional filters."""
    user_id = str(user.id) if hasattr(user, "id") else "system"
    entries = engine.list_entries(user_id, client_name, project_name, billable_only)
    return {"entries": entries, "total": len(entries)}


@router.put("/entries/{entry_id}")
async def update_entry(entry_id: str, req: UpdateEntryRequest, user: User = Depends(get_current_user)):
    """Update a time entry."""
    updates = {k: v for k, v in req.model_dump().items() if v is not None}
    try:
        return engine.update_entry(entry_id, updates)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/entries/{entry_id}")
async def delete_entry(entry_id: str, user: User = Depends(get_current_user)):
    """Delete a time entry."""
    if not engine.delete_entry(entry_id):
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"deleted": True}


@router.get("/summary")
async def get_summary(user: User = Depends(get_current_user)):
    """Get a summary of tracked time — total hours, billable amount, by client."""
    user_id = str(user.id) if hasattr(user, "id") else "system"
    return engine.get_summary(user_id)


@router.post("/invoice")
async def mark_invoiced(req: InvoiceEntriesRequest, user: User = Depends(get_current_user)):
    """Mark time entries as invoiced (linked to an invoice)."""
    count = engine.mark_invoiced(req.entry_ids, req.invoice_id)
    return {"invoiced_count": count, "invoice_id": req.invoice_id}

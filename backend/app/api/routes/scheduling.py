"""Scheduling & Calendar API routes."""

from fastapi import APIRouter, HTTPException
from app.scheduling.calendar import AppointmentScheduler

router = APIRouter(prefix="/scheduling", tags=["Scheduling"])
scheduler = AppointmentScheduler()


@router.post("/appointments")
async def create_appointment(data: dict):
    appt = scheduler.create(**data)
    return appt.to_dict()


@router.get("/appointments/{appt_id}")
async def get_appointment(appt_id: str):
    appt = scheduler.get(appt_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appt.to_dict()


@router.put("/appointments/{appt_id}")
async def update_appointment(appt_id: str, data: dict):
    appt = scheduler.update(appt_id, **data)
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appt.to_dict()


@router.post("/appointments/{appt_id}/cancel")
async def cancel_appointment(appt_id: str, data: dict = None):
    data = data or {}
    if not scheduler.cancel(appt_id, data.get("reason", "")):
        raise HTTPException(status_code=404, detail="Appointment not found")
    return {"status": "cancelled"}


@router.post("/appointments/{appt_id}/complete")
async def complete_appointment(appt_id: str, data: dict = None):
    data = data or {}
    if not scheduler.complete(appt_id, data.get("action_items")):
        raise HTTPException(status_code=404, detail="Appointment not found")
    return {"status": "completed"}


@router.get("/appointments/{appt_id}/ics")
async def get_calendar_invite(appt_id: str):
    ics = scheduler.get_calendar_invite(appt_id)
    if not ics:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return {"ics": ics, "content_type": "text/calendar"}


# Querying
@router.get("/user/{user_id}")
async def user_appointments(user_id: str, from_date: str | None = None, to_date: str | None = None):
    appts = scheduler.list_for_user(user_id, from_date, to_date)
    return {"appointments": [a.to_dict() for a in appts]}


@router.get("/user/{user_id}/upcoming")
async def upcoming_appointments(user_id: str, days: int = 7):
    appts = scheduler.upcoming(user_id, days)
    return {"appointments": [a.to_dict() for a in appts], "days": days}


@router.get("/entity/{entity_id}")
async def entity_appointments(entity_id: str):
    appts = scheduler.list_for_entity(entity_id)
    return {"appointments": [a.to_dict() for a in appts]}


# Availability
@router.post("/availability/{user_id}")
async def set_availability(user_id: str, data: dict):
    return scheduler.set_availability(user_id, data)


@router.get("/availability/{user_id}/{on_date}")
async def check_availability(user_id: str, on_date: str):
    return scheduler.get_availability(user_id, on_date)


# Summary
@router.get("/summary")
async def scheduling_summary(user_id: str | None = None):
    return scheduler.summary(user_id)

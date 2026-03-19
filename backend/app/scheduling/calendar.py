"""Appointment Scheduling & Calendar System.

Accountants need to book meetings with:
- Clients (tax planning, year-end review, advisory)
- Tax authorities (audit appointments, objection hearings)
- Team members (review meetings, training)

Features:
- Appointment booking with calendar invitations (ICS format)
- Availability management (working hours, blocked times)
- Recurring appointments (monthly BAS review, quarterly strategy)
- Video call integration links (Zoom, Teams, Google Meet)
- Timezone-aware scheduling (critical for global firms)
- Automated reminders
"""

from dataclasses import dataclass, field
from datetime import date, datetime, timedelta, time
from enum import Enum
import uuid


class AppointmentType(str, Enum):
    CLIENT_MEETING = "client_meeting"
    TAX_REVIEW = "tax_review"
    YEAR_END_REVIEW = "year_end_review"
    BAS_REVIEW = "bas_review"
    ADVISORY = "advisory"
    TAX_AUTHORITY = "tax_authority"     # Meeting with ATO/IRS
    INTERNAL = "internal"
    ONBOARDING = "onboarding"
    AUDIT_PLANNING = "audit_planning"
    PHONE_CALL = "phone_call"


class AppointmentStatus(str, Enum):
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    NO_SHOW = "no_show"
    RESCHEDULED = "rescheduled"


class RecurrencePattern(str, Enum):
    NONE = "none"
    WEEKLY = "weekly"
    FORTNIGHTLY = "fortnightly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ANNUALLY = "annually"


@dataclass
class Appointment:
    """A scheduled appointment."""
    id: str = ""
    title: str = ""
    description: str = ""
    appointment_type: AppointmentType = AppointmentType.CLIENT_MEETING
    status: AppointmentStatus = AppointmentStatus.SCHEDULED

    # When
    start_time: str = ""       # ISO 8601 datetime
    end_time: str = ""
    timezone: str = "Australia/Sydney"
    duration_minutes: int = 60

    # Who
    organizer_id: str = ""
    organizer_name: str = ""
    attendee_ids: list[str] = field(default_factory=list)
    attendee_names: list[str] = field(default_factory=list)
    attendee_emails: list[str] = field(default_factory=list)

    # What
    entity_id: str = ""        # Which client this is about
    entity_name: str = ""

    # Where
    location: str = ""
    video_link: str = ""       # Zoom/Teams/Meet URL
    video_provider: str = ""   # zoom, teams, google_meet

    # Recurrence
    recurrence: RecurrencePattern = RecurrencePattern.NONE
    recurrence_end: str = ""

    # Reminders
    reminder_minutes: list[int] = field(default_factory=lambda: [1440, 60])  # 24hr and 1hr

    # Notes
    notes: str = ""
    agenda: list[str] = field(default_factory=list)
    action_items: list[str] = field(default_factory=list)

    created_at: str = ""

    def __post_init__(self):
        if not self.id:
            self.id = str(uuid.uuid4())[:8]
        if not self.created_at:
            self.created_at = datetime.utcnow().isoformat()
        if self.start_time and not self.end_time:
            try:
                start = datetime.fromisoformat(self.start_time)
                self.end_time = (start + timedelta(minutes=self.duration_minutes)).isoformat()
            except ValueError:
                pass

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "type": self.appointment_type.value if isinstance(self.appointment_type, AppointmentType) else self.appointment_type,
            "status": self.status.value if isinstance(self.status, AppointmentStatus) else self.status,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "timezone": self.timezone,
            "duration_minutes": self.duration_minutes,
            "organizer_name": self.organizer_name,
            "attendee_names": self.attendee_names,
            "entity_id": self.entity_id,
            "entity_name": self.entity_name,
            "location": self.location,
            "video_link": self.video_link,
            "video_provider": self.video_provider,
            "recurrence": self.recurrence.value if isinstance(self.recurrence, RecurrencePattern) else self.recurrence,
            "notes": self.notes,
            "agenda": self.agenda,
            "action_items": self.action_items,
            "created_at": self.created_at,
        }


@dataclass
class CalendarInvite:
    """ICS calendar invitation format."""

    @staticmethod
    def generate_ics(appointment: Appointment) -> str:
        """Generate an ICS (iCalendar) file for the appointment.

        This is the standard format that Outlook, Google Calendar,
        Apple Calendar, and every other calendar app understands.
        """
        uid = f"{appointment.id}@astra.accounting"
        now = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")

        # Format datetimes for ICS
        start = appointment.start_time.replace("-", "").replace(":", "").replace(".", "")[:15] + "Z" if appointment.start_time else now
        end = appointment.end_time.replace("-", "").replace(":", "").replace(".", "")[:15] + "Z" if appointment.end_time else now

        attendees = ""
        for email in appointment.attendee_emails:
            attendees += f"ATTENDEE;RSVP=TRUE:mailto:{email}\n"

        description = appointment.description or ""
        if appointment.video_link:
            description += f"\\n\\nJoin video call: {appointment.video_link}"
        if appointment.agenda:
            description += "\\n\\nAgenda:\\n" + "\\n".join(f"- {item}" for item in appointment.agenda)

        ics = f"""BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Astra Accounting//Calendar//EN
METHOD:REQUEST
BEGIN:VEVENT
UID:{uid}
DTSTAMP:{now}
DTSTART:{start}
DTEND:{end}
SUMMARY:{appointment.title}
DESCRIPTION:{description}
LOCATION:{appointment.location or appointment.video_link or ''}
ORGANIZER;CN={appointment.organizer_name}:mailto:noreply@astra.accounting
{attendees}STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:-PT60M
ACTION:DISPLAY
DESCRIPTION:Reminder: {appointment.title}
END:VALARM
BEGIN:VALARM
TRIGGER:-PT1440M
ACTION:DISPLAY
DESCRIPTION:Tomorrow: {appointment.title}
END:VALARM
END:VEVENT
END:VCALENDAR"""
        return ics


class AppointmentScheduler:
    """Manages appointments and calendar scheduling."""

    def __init__(self):
        self._appointments: dict[str, Appointment] = {}
        self._availability: dict[str, dict] = {}  # user_id → availability config

    # ── Appointments ─────────────────────────────────────────

    def create(self, **kwargs) -> Appointment:
        if "appointment_type" in kwargs and isinstance(kwargs["appointment_type"], str):
            kwargs["appointment_type"] = AppointmentType(kwargs["appointment_type"])
        if "recurrence" in kwargs and isinstance(kwargs["recurrence"], str):
            kwargs["recurrence"] = RecurrencePattern(kwargs["recurrence"])

        appt = Appointment(**kwargs)
        self._appointments[appt.id] = appt
        return appt

    def get(self, appt_id: str) -> Appointment | None:
        return self._appointments.get(appt_id)

    def update(self, appt_id: str, **kwargs) -> Appointment | None:
        appt = self._appointments.get(appt_id)
        if not appt:
            return None
        for key, value in kwargs.items():
            if hasattr(appt, key):
                setattr(appt, key, value)
        return appt

    def cancel(self, appt_id: str, reason: str = "") -> bool:
        appt = self._appointments.get(appt_id)
        if appt:
            appt.status = AppointmentStatus.CANCELLED
            if reason:
                appt.notes += f"\nCancelled: {reason}"
            return True
        return False

    def complete(self, appt_id: str, action_items: list[str] | None = None) -> bool:
        appt = self._appointments.get(appt_id)
        if appt:
            appt.status = AppointmentStatus.COMPLETED
            if action_items:
                appt.action_items = action_items
            return True
        return False

    def get_calendar_invite(self, appt_id: str) -> str | None:
        appt = self._appointments.get(appt_id)
        if not appt:
            return None
        return CalendarInvite.generate_ics(appt)

    # ── Querying ─────────────────────────────────────────────

    def list_for_user(
        self, user_id: str, from_date: str | None = None,
        to_date: str | None = None, status: str | None = None,
    ) -> list[Appointment]:
        results = [a for a in self._appointments.values()
                   if user_id in a.attendee_ids or a.organizer_id == user_id]
        if from_date:
            results = [a for a in results if a.start_time >= from_date]
        if to_date:
            results = [a for a in results if a.start_time <= to_date]
        if status:
            results = [a for a in results if (a.status.value if isinstance(a.status, AppointmentStatus) else a.status) == status]
        return sorted(results, key=lambda a: a.start_time)

    def list_for_entity(self, entity_id: str) -> list[Appointment]:
        return sorted(
            [a for a in self._appointments.values() if a.entity_id == entity_id],
            key=lambda a: a.start_time,
        )

    def upcoming(self, user_id: str, days: int = 7) -> list[Appointment]:
        now = datetime.utcnow().isoformat()
        cutoff = (datetime.utcnow() + timedelta(days=days)).isoformat()
        return [a for a in self.list_for_user(user_id)
                if now <= a.start_time <= cutoff
                and a.status in (AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED)]

    # ── Availability ─────────────────────────────────────────

    def set_availability(self, user_id: str, working_hours: dict) -> dict:
        """Set a user's working hours.

        Args:
            working_hours: {
                "monday": {"start": "09:00", "end": "17:00"},
                "tuesday": {"start": "09:00", "end": "17:00"},
                ...
                "blocked_dates": ["2024-12-25", "2024-12-26"],
            }
        """
        self._availability[user_id] = working_hours
        return {"status": "set", "user_id": user_id, "working_hours": working_hours}

    def get_availability(self, user_id: str, on_date: str) -> dict:
        """Check a user's availability on a specific date."""
        config = self._availability.get(user_id, {})
        blocked = config.get("blocked_dates", [])

        if on_date in blocked:
            return {"available": False, "reason": "blocked_date", "date": on_date}

        try:
            d = date.fromisoformat(on_date)
        except ValueError:
            return {"available": False, "reason": "invalid_date"}

        day_name = d.strftime("%A").lower()
        day_hours = config.get(day_name)

        if not day_hours:
            return {"available": False, "reason": "not_a_working_day", "day": day_name}

        # Check existing appointments
        existing = [a for a in self._appointments.values()
                    if (a.organizer_id == user_id or user_id in a.attendee_ids)
                    and a.start_time.startswith(on_date)
                    and a.status in (AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED)]

        booked_slots = [{"start": a.start_time, "end": a.end_time, "title": a.title} for a in existing]

        return {
            "available": True,
            "date": on_date,
            "day": day_name,
            "working_hours": day_hours,
            "booked_slots": booked_slots,
            "appointments_count": len(booked_slots),
        }

    # ── Summary ──────────────────────────────────────────────

    def summary(self, user_id: str | None = None) -> dict:
        appts = list(self._appointments.values())
        if user_id:
            appts = [a for a in appts if user_id in a.attendee_ids or a.organizer_id == user_id]

        by_type = {}
        by_status = {}
        for a in appts:
            at = a.appointment_type.value if isinstance(a.appointment_type, AppointmentType) else a.appointment_type
            by_type[at] = by_type.get(at, 0) + 1
            st = a.status.value if isinstance(a.status, AppointmentStatus) else a.status
            by_status[st] = by_status.get(st, 0) + 1

        return {
            "total_appointments": len(appts),
            "by_type": by_type,
            "by_status": by_status,
        }

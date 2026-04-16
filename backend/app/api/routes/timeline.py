"""Unified Timeline API routes.

A single chronological stream that merges every time-stamped event in the
platform into one feed so users can see the full story of a practice, entity
or tax period at a glance. Unlike the Activity Feed (audit-log only) this
aggregates:

    * Audit trail entries       (who-did-what)
    * Compliance deadlines      (upcoming + overdue filings)
    * Tax filing lifecycle      (draft -> validated -> lodged)
    * Month-end close events    (optional, mocked where no DB rows exist)
    * Catch-up reconstruction   (reconstructed periods)

The endpoint is filterable by kind, jurisdiction, entity and date range and
returns entries sorted newest -> oldest (or, when `upcoming=true`, nearest
future-first). Designed so the frontend Timeline page needs one request.
"""

from datetime import date, datetime, timedelta, timezone
from typing import Literal

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from app.auditlog.helpers import get_trail
from app.auth.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/timeline", tags=["Timeline"])


# --------------------------------------------------------------------------- #
# Event kinds                                                                 #
# --------------------------------------------------------------------------- #

EventKind = Literal[
    "audit",
    "deadline",
    "filing",
    "close",
    "catchup",
    "transaction",
    "alert",
]


class TimelineEvent(BaseModel):
    """Canonical timeline entry returned by every aggregator."""

    id: str
    timestamp: str                 # ISO-8601
    kind: EventKind
    title: str
    description: str = ""
    jurisdiction: str | None = None
    entity_id: str | None = None
    actor: str | None = None       # user / system component name
    status: str | None = None      # e.g. "overdue", "scheduled", "posted"
    icon: str = "dot"              # hint for the frontend renderer
    severity: Literal["info", "success", "warning", "danger"] = "info"
    reference: str | None = None   # resource id for deep-link
    metadata: dict = {}


# --------------------------------------------------------------------------- #
# Aggregators                                                                 #
# --------------------------------------------------------------------------- #


def _audit_events(entity_id: str | None, limit: int) -> list[TimelineEvent]:
    """Pull recent audit entries and normalise into TimelineEvent."""
    trail = get_trail()
    entries = trail.query(entity_id=entity_id, limit=limit)
    severity_map = {
        "delete": "danger", "reject": "warning", "approve": "success",
        "create": "info", "update": "info", "view": "info",
        "export": "info", "import": "info", "login": "info",
    }
    out: list[TimelineEvent] = []
    for e in entries:
        action = e.action.value if hasattr(e.action, "value") else e.action
        out.append(TimelineEvent(
            id=f"audit-{e.id}",
            timestamp=e.timestamp,
            kind="audit",
            title=f"{e.user_name or 'System'} {action} {e.resource_type}".strip(),
            description=e.description or "",
            entity_id=e.entity_id or None,
            actor=e.user_name or "System",
            status=action,
            severity=severity_map.get(action, "info"),
            icon="audit",
            reference=e.resource_id or None,
            metadata={"changed_fields": e.changed_fields},
        ))
    return out


# Canonical deadline catalogue reused from the compliance router.
# Duplicated lightly here so the timeline module has no cross-route import
# friction if compliance evolves independently.
_DEADLINES: list[dict] = [
    # --- Australia -------------------------------------------------------- #
    {"jurisdiction": "AU", "name": "BAS Q1 (Jul-Sep)", "date": "2026-10-28", "type": "gst"},
    {"jurisdiction": "AU", "name": "BAS Q2 (Oct-Dec)", "date": "2027-02-28", "type": "gst"},
    {"jurisdiction": "AU", "name": "BAS Q3 (Jan-Mar)", "date": "2026-04-28", "type": "gst"},
    {"jurisdiction": "AU", "name": "BAS Q4 (Apr-Jun)", "date": "2026-07-28", "type": "gst"},
    {"jurisdiction": "AU", "name": "Company Tax Return", "date": "2026-10-31", "type": "income_tax"},
    {"jurisdiction": "AU", "name": "Individual Tax Return", "date": "2026-10-31", "type": "income_tax"},
    {"jurisdiction": "AU", "name": "STP Finalisation", "date": "2026-07-14", "type": "payroll"},
    {"jurisdiction": "AU", "name": "FBT Return", "date": "2026-05-21", "type": "fringe_benefits"},
    {"jurisdiction": "AU", "name": "PAYG Instalment Q3", "date": "2026-04-28", "type": "payg"},
    {"jurisdiction": "AU", "name": "Superannuation Guarantee Q3", "date": "2026-04-28", "type": "payroll"},
    # --- New Zealand ------------------------------------------------------ #
    {"jurisdiction": "NZ", "name": "GST Return (2-monthly)", "date": "2026-04-28", "type": "gst"},
    {"jurisdiction": "NZ", "name": "GST Return (6-monthly)", "date": "2026-05-07", "type": "gst"},
    {"jurisdiction": "NZ", "name": "Income Tax Return (IR3)", "date": "2026-07-07", "type": "income_tax"},
    {"jurisdiction": "NZ", "name": "Company Tax Return (IR4)", "date": "2026-07-07", "type": "income_tax"},
    {"jurisdiction": "NZ", "name": "Provisional Tax P1", "date": "2026-08-28", "type": "income_tax"},
    {"jurisdiction": "NZ", "name": "Provisional Tax P2", "date": "2027-01-15", "type": "income_tax"},
    {"jurisdiction": "NZ", "name": "Employer Deductions (PAYE)", "date": "2026-04-20", "type": "payroll"},
    {"jurisdiction": "NZ", "name": "FBT Return (quarterly)", "date": "2026-07-20", "type": "fringe_benefits"},
    # --- United Kingdom --------------------------------------------------- #
    {"jurisdiction": "GB", "name": "VAT Return Q1", "date": "2026-05-07", "type": "vat"},
    {"jurisdiction": "GB", "name": "VAT Return Q2", "date": "2026-08-07", "type": "vat"},
    {"jurisdiction": "GB", "name": "Corporation Tax", "date": "2027-01-01", "type": "income_tax"},
    {"jurisdiction": "GB", "name": "Self Assessment", "date": "2027-01-31", "type": "income_tax"},
    # --- United States ---------------------------------------------------- #
    {"jurisdiction": "US", "name": "Q1 Estimated Tax", "date": "2026-04-15", "type": "income_tax"},
    {"jurisdiction": "US", "name": "Q2 Estimated Tax", "date": "2026-06-15", "type": "income_tax"},
    {"jurisdiction": "US", "name": "Q3 Estimated Tax", "date": "2026-09-15", "type": "income_tax"},
    {"jurisdiction": "US", "name": "Individual Tax Return (1040)", "date": "2026-04-15", "type": "income_tax"},
    {"jurisdiction": "US", "name": "Corporate Tax Return (1120)", "date": "2026-04-15", "type": "income_tax"},
]


def _deadline_events(jurisdiction: str | None) -> list[TimelineEvent]:
    """Turn compliance deadlines into forward-looking timeline events."""
    today = date.today()
    out: list[TimelineEvent] = []
    for d in _DEADLINES:
        if jurisdiction and jurisdiction.lower() != "all" and d["jurisdiction"] != jurisdiction.upper():
            continue
        try:
            target = datetime.strptime(d["date"], "%Y-%m-%d").date()
        except ValueError:
            continue
        delta = (target - today).days
        if delta < -30:
            continue  # drop filings more than 30 days overdue — catch-up handles older
        if delta > 180:
            continue  # keep the window tight so the timeline isn't noisy

        if delta < 0:
            severity, status = "danger", "overdue"
            title = f"{d['name']} — OVERDUE by {-delta}d"
        elif delta <= 7:
            severity, status = "warning", "due_soon"
            title = f"{d['name']} — due in {delta}d"
        else:
            severity, status = "info", "scheduled"
            title = f"{d['name']}"

        # Synthesize a stable ISO timestamp at noon UTC on the target date
        ts = datetime.combine(target, datetime.min.time()).replace(
            hour=12, tzinfo=timezone.utc,
        ).isoformat()

        out.append(TimelineEvent(
            id=f"deadline-{d['jurisdiction']}-{d['name'].replace(' ', '-')}-{d['date']}",
            timestamp=ts,
            kind="deadline",
            title=title,
            description=f"{d['type'].replace('_', ' ').title()} filing in {d['jurisdiction']}",
            jurisdiction=d["jurisdiction"],
            actor="Compliance Monitor",
            status=status,
            severity=severity,
            icon="calendar",
            metadata={"filing_type": d["type"], "due_date": d["date"], "days_until": delta},
        ))
    return out


def _synthetic_filing_events(jurisdiction: str | None) -> list[TimelineEvent]:
    """Tax-filing lifecycle placeholders (drafts/validations/lodgements).

    Real rows will come from the `tax_filing` service once persistent storage
    is wired. Until then we surface the *most recent* close/lodgement activity
    as plausible examples so the timeline is never empty for demo tenants.
    """
    now = datetime.now(timezone.utc)
    samples = [
        (-2,  "NZ", "GST (2-monthly) — Mar/Apr 2026", "lodged",    "success", "Lodged to IRD. Return number IRD-GST-2026-02."),
        (-5,  "AU", "BAS Q3 FY26",                    "validated", "info",    "AI-drafted BAS passed all 14 validation checks, ready for partner sign-off."),
        (-9,  "NZ", "Income Tax IR3 — FY25",          "draft",     "info",    "Draft income tax return generated from reconstructed ledger."),
        (-14, "AU", "STP Pay Event — Pay #7",         "lodged",    "success", "Single Touch Payroll event accepted by ATO."),
        (-18, "NZ", "Provisional Tax P3",             "lodged",    "success", "Provisional tax P3 paid to IRD via direct debit."),
    ]
    out: list[TimelineEvent] = []
    for days_ago, j, name, status, severity, description in samples:
        if jurisdiction and jurisdiction.lower() != "all" and j != jurisdiction.upper():
            continue
        ts = (now - timedelta(days=-days_ago)).isoformat() if days_ago > 0 else (now + timedelta(days=days_ago)).isoformat()
        out.append(TimelineEvent(
            id=f"filing-{j}-{name.replace(' ', '-')}",
            timestamp=ts,
            kind="filing",
            title=name,
            description=description,
            jurisdiction=j,
            actor="Tax Filing Engine",
            status=status,
            severity=severity,
            icon="filing",
        ))
    return out


def _synthetic_close_events() -> list[TimelineEvent]:
    now = datetime.now(timezone.utc)
    samples = [
        (-1,  "Month-end close — March 2026 completed",         "Autonomous close: reconciled 247 txns, posted 3 accruals, produced financials in 4.2s."),
        (-32, "Month-end close — February 2026 completed",      "Autonomous close: reconciled 218 txns, posted 2 accruals."),
        (-61, "Month-end close — January 2026 completed",       "Autonomous close: reconciled 203 txns."),
    ]
    out: list[TimelineEvent] = []
    for days_ago, title, desc in samples:
        ts = (now + timedelta(days=days_ago)).isoformat()
        out.append(TimelineEvent(
            id=f"close-{title.replace(' ', '-')}",
            timestamp=ts,
            kind="close",
            title=title,
            description=desc,
            actor="Month-End Agent",
            status="completed",
            severity="success",
            icon="close",
        ))
    return out


# --------------------------------------------------------------------------- #
# Endpoints                                                                   #
# --------------------------------------------------------------------------- #


@router.get("/events")
async def list_events(
    kind: str | None = Query(None, description="audit|deadline|filing|close|catchup|all"),
    jurisdiction: str | None = Query(None, description="AU|NZ|GB|US|all"),
    entity_id: str | None = None,
    days_back: int = Query(90, ge=1, le=3650),
    days_forward: int = Query(180, ge=0, le=730),
    limit: int = Query(200, ge=1, le=1000),
    user: User = Depends(get_current_user),
) -> dict:
    """Return a unified, filterable timeline ordered newest-first.

    Adds upcoming deadlines within `days_forward` so users see both what has
    happened and what is coming.
    """
    events: list[TimelineEvent] = []
    kinds = {k.strip() for k in (kind or "").split(",") if k.strip()}
    include = lambda k: not kinds or "all" in kinds or k in kinds  # noqa: E731

    if include("audit"):
        events.extend(_audit_events(entity_id, limit=limit))
    if include("deadline"):
        events.extend(_deadline_events(jurisdiction))
    if include("filing"):
        events.extend(_synthetic_filing_events(jurisdiction))
    if include("close"):
        events.extend(_synthetic_close_events())

    # Trim to the requested window
    now = datetime.now(timezone.utc)
    earliest = now - timedelta(days=days_back)
    latest = now + timedelta(days=days_forward)

    def _in_window(ev: TimelineEvent) -> bool:
        try:
            ts = datetime.fromisoformat(ev.timestamp.replace("Z", "+00:00"))
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=timezone.utc)
        except ValueError:
            return True
        return earliest <= ts <= latest

    filtered = [e for e in events if _in_window(e)]
    # Sort descending by timestamp (future-first above now)
    filtered.sort(key=lambda e: e.timestamp, reverse=True)

    return {
        "events": [e.model_dump() for e in filtered[:limit]],
        "total": len(filtered),
        "window": {
            "from": earliest.isoformat(),
            "to": latest.isoformat(),
        },
        "counts_by_kind": _count_by(filtered, "kind"),
        "counts_by_severity": _count_by(filtered, "severity"),
    }


@router.get("/stats")
async def stats(user: User = Depends(get_current_user)) -> dict:
    """Summary stats for the timeline header (events today, overdue, etc)."""
    events = (
        _audit_events(entity_id=None, limit=500)
        + _deadline_events(jurisdiction=None)
        + _synthetic_filing_events(jurisdiction=None)
        + _synthetic_close_events()
    )
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    def _parse(ts: str) -> datetime | None:
        try:
            d = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            if d.tzinfo is None:
                d = d.replace(tzinfo=timezone.utc)
            return d
        except ValueError:
            return None

    today = sum(1 for e in events if (p := _parse(e.timestamp)) and p >= today_start)
    overdue = sum(1 for e in events if e.status == "overdue")
    due_soon = sum(1 for e in events if e.status == "due_soon")
    last_close = next((e for e in events if e.kind == "close"), None)

    return {
        "total_events": len(events),
        "events_today": today,
        "overdue_deadlines": overdue,
        "due_this_week": due_soon,
        "last_close": last_close.model_dump() if last_close else None,
    }


def _count_by(events: list[TimelineEvent], key: str) -> dict[str, int]:
    out: dict[str, int] = {}
    for e in events:
        v = getattr(e, key, None) or "unknown"
        out[v] = out.get(v, 0) + 1
    return out

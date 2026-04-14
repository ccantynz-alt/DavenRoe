"""Compliance Calendar API routes.

Exposes tax and regulatory deadlines across AU, NZ, UK, and US jurisdictions.
Returns 40+ canonical filing deadlines so the Compliance Calendar UI can
render a unified multi-jurisdiction view without hardcoding data client-side.
"""

from datetime import date, datetime

from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/compliance", tags=["Compliance Calendar"])


# --------------------------------------------------------------------------- #
# Canonical deadline catalogue                                                #
# --------------------------------------------------------------------------- #

_DEADLINES: list[dict] = [
    # --- Australia -------------------------------------------------------- #
    {"jurisdiction": "AU", "name": "BAS Q1 (Jul-Sep)", "date": "2026-10-28", "type": "gst", "recurrence": "quarterly"},
    {"jurisdiction": "AU", "name": "BAS Q2 (Oct-Dec)", "date": "2027-02-28", "type": "gst", "recurrence": "quarterly"},
    {"jurisdiction": "AU", "name": "BAS Q3 (Jan-Mar)", "date": "2026-04-28", "type": "gst", "recurrence": "quarterly"},
    {"jurisdiction": "AU", "name": "BAS Q4 (Apr-Jun)", "date": "2026-07-28", "type": "gst", "recurrence": "quarterly"},
    {"jurisdiction": "AU", "name": "Company Tax Return", "date": "2026-10-31", "type": "income_tax", "recurrence": "annual"},
    {"jurisdiction": "AU", "name": "Individual Tax Return", "date": "2026-10-31", "type": "income_tax", "recurrence": "annual"},
    {"jurisdiction": "AU", "name": "STP Finalisation", "date": "2026-07-14", "type": "payroll", "recurrence": "annual"},
    {"jurisdiction": "AU", "name": "FBT Return", "date": "2026-05-21", "type": "fringe_benefits", "recurrence": "annual"},
    {"jurisdiction": "AU", "name": "PAYG Instalment Q3", "date": "2026-04-28", "type": "payg", "recurrence": "quarterly"},
    {"jurisdiction": "AU", "name": "Superannuation Guarantee Q3", "date": "2026-04-28", "type": "payroll", "recurrence": "quarterly"},
    {"jurisdiction": "AU", "name": "Payroll Tax (monthly)", "date": "2026-05-07", "type": "payroll", "recurrence": "monthly"},

    # --- United States ---------------------------------------------------- #
    {"jurisdiction": "US", "name": "Q1 Estimated Tax", "date": "2026-04-15", "type": "income_tax", "recurrence": "quarterly"},
    {"jurisdiction": "US", "name": "Q2 Estimated Tax", "date": "2026-06-15", "type": "income_tax", "recurrence": "quarterly"},
    {"jurisdiction": "US", "name": "Q3 Estimated Tax", "date": "2026-09-15", "type": "income_tax", "recurrence": "quarterly"},
    {"jurisdiction": "US", "name": "Q4 Estimated Tax", "date": "2027-01-15", "type": "income_tax", "recurrence": "quarterly"},
    {"jurisdiction": "US", "name": "Individual Tax Return (1040)", "date": "2026-04-15", "type": "income_tax", "recurrence": "annual"},
    {"jurisdiction": "US", "name": "Corporate Tax Return (1120)", "date": "2026-04-15", "type": "income_tax", "recurrence": "annual"},
    {"jurisdiction": "US", "name": "S-Corp Tax Return (1120-S)", "date": "2026-03-15", "type": "income_tax", "recurrence": "annual"},
    {"jurisdiction": "US", "name": "Partnership Return (1065)", "date": "2026-03-15", "type": "income_tax", "recurrence": "annual"},
    {"jurisdiction": "US", "name": "W-2 / 1099 Filing", "date": "2026-01-31", "type": "payroll", "recurrence": "annual"},
    {"jurisdiction": "US", "name": "Quarterly Payroll (941)", "date": "2026-04-30", "type": "payroll", "recurrence": "quarterly"},
    {"jurisdiction": "US", "name": "FUTA Annual (940)", "date": "2026-01-31", "type": "payroll", "recurrence": "annual"},
    {"jurisdiction": "US", "name": "Sales Tax (varies by state)", "date": "2026-04-20", "type": "sales_tax", "recurrence": "monthly"},

    # --- New Zealand ------------------------------------------------------ #
    {"jurisdiction": "NZ", "name": "GST Return (2-monthly)", "date": "2026-04-28", "type": "gst", "recurrence": "bimonthly"},
    {"jurisdiction": "NZ", "name": "GST Return (6-monthly)", "date": "2026-05-07", "type": "gst", "recurrence": "biannual"},
    {"jurisdiction": "NZ", "name": "Income Tax Return (IR3)", "date": "2026-07-07", "type": "income_tax", "recurrence": "annual"},
    {"jurisdiction": "NZ", "name": "Company Tax Return (IR4)", "date": "2026-07-07", "type": "income_tax", "recurrence": "annual"},
    {"jurisdiction": "NZ", "name": "Provisional Tax P1", "date": "2026-08-28", "type": "income_tax", "recurrence": "tri-annual"},
    {"jurisdiction": "NZ", "name": "Provisional Tax P2", "date": "2027-01-15", "type": "income_tax", "recurrence": "tri-annual"},
    {"jurisdiction": "NZ", "name": "Employer Deductions (PAYE)", "date": "2026-04-20", "type": "payroll", "recurrence": "monthly"},
    {"jurisdiction": "NZ", "name": "FBT Return (quarterly)", "date": "2026-07-20", "type": "fringe_benefits", "recurrence": "quarterly"},

    # --- United Kingdom --------------------------------------------------- #
    {"jurisdiction": "GB", "name": "VAT Return Q1", "date": "2026-05-07", "type": "vat", "recurrence": "quarterly"},
    {"jurisdiction": "GB", "name": "VAT Return Q2", "date": "2026-08-07", "type": "vat", "recurrence": "quarterly"},
    {"jurisdiction": "GB", "name": "VAT Return Q3", "date": "2026-11-07", "type": "vat", "recurrence": "quarterly"},
    {"jurisdiction": "GB", "name": "Corporation Tax", "date": "2027-01-01", "type": "income_tax", "recurrence": "annual"},
    {"jurisdiction": "GB", "name": "Self Assessment", "date": "2027-01-31", "type": "income_tax", "recurrence": "annual"},
    {"jurisdiction": "GB", "name": "PAYE RTI Submission", "date": "2026-04-19", "type": "payroll", "recurrence": "monthly"},
    {"jurisdiction": "GB", "name": "Making Tax Digital (MTD)", "date": "2026-05-07", "type": "vat", "recurrence": "quarterly"},
    {"jurisdiction": "GB", "name": "P11D (Benefits in Kind)", "date": "2026-07-06", "type": "fringe_benefits", "recurrence": "annual"},
    {"jurisdiction": "GB", "name": "P60 End-of-Year", "date": "2026-05-31", "type": "payroll", "recurrence": "annual"},
]


def _days_between(target: str, today: date) -> int:
    """Return signed days between today and target (negative = overdue)."""
    try:
        target_date = datetime.strptime(target, "%Y-%m-%d").date()
    except ValueError:
        return 0
    return (target_date - today).days


# --------------------------------------------------------------------------- #
# Endpoints                                                                   #
# --------------------------------------------------------------------------- #

@router.get("/deadlines")
async def list_deadlines(
    jurisdiction: str | None = None,
    deadline_type: str | None = None,
    user: User = Depends(get_current_user),
):
    """Return the full list of statutory deadlines with optional filters."""
    today = date.today()
    items = list(_DEADLINES)

    if jurisdiction and jurisdiction.lower() != "all":
        items = [d for d in items if d["jurisdiction"] == jurisdiction.upper()]
    if deadline_type and deadline_type.lower() != "all":
        items = [d for d in items if d["type"] == deadline_type]

    enriched = []
    for d in items:
        days = _days_between(d["date"], today)
        enriched.append({
            **d,
            "days_until": days,
            "is_overdue": days < 0,
        })

    enriched.sort(key=lambda d: d["date"])

    jurisdictions = sorted({d["jurisdiction"] for d in _DEADLINES})
    types = sorted({d["type"] for d in _DEADLINES})

    return {
        "items": enriched,
        "total": len(enriched),
        "jurisdictions": jurisdictions,
        "types": types,
    }


@router.get("/summary")
async def compliance_summary(user: User = Depends(get_current_user)):
    """High-level counts of overdue + upcoming deadlines per jurisdiction."""
    today = date.today()
    by_jurisdiction: dict[str, dict] = {}
    overdue_count = 0
    upcoming_count = 0

    for d in _DEADLINES:
        days = _days_between(d["date"], today)
        bucket = by_jurisdiction.setdefault(
            d["jurisdiction"],
            {"jurisdiction": d["jurisdiction"], "upcoming": 0, "overdue": 0, "next": None},
        )
        if days < 0:
            bucket["overdue"] += 1
            overdue_count += 1
        else:
            bucket["upcoming"] += 1
            upcoming_count += 1
            if bucket["next"] is None or d["date"] < bucket["next"]["date"]:
                bucket["next"] = {"name": d["name"], "date": d["date"], "days_until": days}

    return {
        "total_deadlines": len(_DEADLINES),
        "overdue": overdue_count,
        "upcoming": upcoming_count,
        "by_jurisdiction": list(by_jurisdiction.values()),
    }

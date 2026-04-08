"""WIP (Work in Progress) Tracker API routes.

Real-time WIP by staff, by client, by engagement. Billable utilisation %.
WIP aging report. Auto-generate invoices from WIP. Practice management
tools like Karbon ($59/mo) and Ignition have this — accounting platforms don't.
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from app.auth.dependencies import get_current_user
from app.models.user import User
import uuid

router = APIRouter(prefix="/wip", tags=["WIP Tracker"])

_wip_entries = []
_seed_done = False


def _seed():
    global _seed_done
    if _seed_done:
        return
    _seed_done = True

    _wip_entries.extend([
        # Alex Chen — Senior Accountant
        {"id": str(uuid.uuid4()), "staff_id": "staff-001", "staff_name": "Alex Chen", "client_id": "client-001", "client_name": "Meridian Corp", "engagement": "Monthly Bookkeeping", "description": "Bank reconciliation — March", "hours": 2.5, "rate": 180.00, "date": "2026-03-28", "status": "unbilled", "billable": True},
        {"id": str(uuid.uuid4()), "staff_id": "staff-001", "staff_name": "Alex Chen", "client_id": "client-001", "client_name": "Meridian Corp", "engagement": "Monthly Bookkeeping", "description": "Review AI-categorised transactions", "hours": 1.0, "rate": 180.00, "date": "2026-03-28", "status": "unbilled", "billable": True},
        {"id": str(uuid.uuid4()), "staff_id": "staff-001", "staff_name": "Alex Chen", "client_id": "client-002", "client_name": "Pinnacle Ltd", "engagement": "FY25 Annual Accounts", "description": "Year-end adjustments and accruals", "hours": 4.0, "rate": 180.00, "date": "2026-03-27", "status": "unbilled", "billable": True},
        {"id": str(uuid.uuid4()), "staff_id": "staff-001", "staff_name": "Alex Chen", "client_id": "client-002", "client_name": "Pinnacle Ltd", "engagement": "FY25 Annual Accounts", "description": "Draft financial statements", "hours": 6.0, "rate": 180.00, "date": "2026-03-26", "status": "unbilled", "billable": True},
        {"id": str(uuid.uuid4()), "staff_id": "staff-001", "staff_name": "Alex Chen", "client_id": "client-004", "client_name": "Apex Advisory", "engagement": "Tax Advisory", "description": "FBT review and compliance check", "hours": 3.0, "rate": 220.00, "date": "2026-03-25", "status": "unbilled", "billable": True},
        {"id": str(uuid.uuid4()), "staff_id": "staff-001", "staff_name": "Alex Chen", "client_id": None, "client_name": "Internal", "engagement": "Practice Admin", "description": "Team meeting — weekly standup", "hours": 1.0, "rate": 0, "date": "2026-03-25", "status": "non_billable", "billable": False},

        # Priya Sharma — Bookkeeper
        {"id": str(uuid.uuid4()), "staff_id": "staff-002", "staff_name": "Priya Sharma", "client_id": "client-001", "client_name": "Meridian Corp", "engagement": "Monthly Bookkeeping", "description": "Payroll processing — March", "hours": 2.0, "rate": 120.00, "date": "2026-03-28", "status": "unbilled", "billable": True},
        {"id": str(uuid.uuid4()), "staff_id": "staff-002", "staff_name": "Priya Sharma", "client_id": "client-003", "client_name": "Vortex Digital", "engagement": "Monthly Bookkeeping", "description": "GST registration preparation", "hours": 3.0, "rate": 120.00, "date": "2026-03-27", "status": "unbilled", "billable": True},
        {"id": str(uuid.uuid4()), "staff_id": "staff-002", "staff_name": "Priya Sharma", "client_id": "client-003", "client_name": "Vortex Digital", "engagement": "Monthly Bookkeeping", "description": "Invoice data entry and reconciliation", "hours": 4.0, "rate": 120.00, "date": "2026-03-26", "status": "unbilled", "billable": True},
        {"id": str(uuid.uuid4()), "staff_id": "staff-002", "staff_name": "Priya Sharma", "client_id": "client-005", "client_name": "Summit Holdings", "engagement": "Quarterly BAS", "description": "BAS preparation Q3", "hours": 5.0, "rate": 120.00, "date": "2026-03-24", "status": "unbilled", "billable": True},
        {"id": str(uuid.uuid4()), "staff_id": "staff-002", "staff_name": "Priya Sharma", "client_id": None, "client_name": "Internal", "engagement": "Training", "description": "AlecRae platform training", "hours": 2.0, "rate": 0, "date": "2026-03-24", "status": "non_billable", "billable": False},

        # Jordan Lee — Junior
        {"id": str(uuid.uuid4()), "staff_id": "staff-003", "staff_name": "Jordan Lee", "client_id": "client-001", "client_name": "Meridian Corp", "engagement": "Monthly Bookkeeping", "description": "Receipt scanning and matching", "hours": 3.0, "rate": 90.00, "date": "2026-03-28", "status": "unbilled", "billable": True},
        {"id": str(uuid.uuid4()), "staff_id": "staff-003", "staff_name": "Jordan Lee", "client_id": "client-004", "client_name": "Apex Advisory", "engagement": "Monthly Bookkeeping", "description": "Supplier invoice processing", "hours": 4.0, "rate": 90.00, "date": "2026-03-27", "status": "unbilled", "billable": True},
        {"id": str(uuid.uuid4()), "staff_id": "staff-003", "staff_name": "Jordan Lee", "client_id": "client-005", "client_name": "Summit Holdings", "engagement": "Monthly Bookkeeping", "description": "Bank feed categorisation review", "hours": 2.5, "rate": 90.00, "date": "2026-03-26", "status": "unbilled", "billable": True},

        # Previously billed entries
        {"id": str(uuid.uuid4()), "staff_id": "staff-001", "staff_name": "Alex Chen", "client_id": "client-001", "client_name": "Meridian Corp", "engagement": "Monthly Bookkeeping", "description": "February month-end close", "hours": 5.0, "rate": 180.00, "date": "2026-02-28", "status": "billed", "billable": True, "invoice_id": "INV-1201"},
        {"id": str(uuid.uuid4()), "staff_id": "staff-002", "staff_name": "Priya Sharma", "client_id": "client-001", "client_name": "Meridian Corp", "engagement": "Monthly Bookkeeping", "description": "February payroll + reconciliation", "hours": 4.0, "rate": 120.00, "date": "2026-02-28", "status": "billed", "billable": True, "invoice_id": "INV-1201"},
    ])


# ── Endpoints ───────────────────────────────────────────────────────────

@router.get("/")
async def list_wip(
    staff_id: str | None = None,
    client_id: str | None = None,
    status: str | None = Query(default=None, description="unbilled, billed, non_billable, written_off"),
    user: User = Depends(get_current_user),
):
    """List WIP entries with optional filters."""
    _seed()
    results = list(_wip_entries)
    if staff_id:
        results = [e for e in results if e["staff_id"] == staff_id]
    if client_id:
        results = [e for e in results if e["client_id"] == client_id]
    if status:
        results = [e for e in results if e["status"] == status]
    results.sort(key=lambda e: e["date"], reverse=True)
    return {"entries": results, "total": len(results)}


@router.get("/summary")
async def wip_summary(user: User = Depends(get_current_user)):
    """Get WIP summary across the practice."""
    _seed()
    unbilled = [e for e in _wip_entries if e["status"] == "unbilled"]
    billed = [e for e in _wip_entries if e["status"] == "billed"]
    billable = [e for e in _wip_entries if e["billable"]]
    non_billable = [e for e in _wip_entries if not e["billable"]]

    total_unbilled_hours = sum(e["hours"] for e in unbilled)
    total_unbilled_value = sum(e["hours"] * e["rate"] for e in unbilled)
    total_billed_value = sum(e["hours"] * e["rate"] for e in billed)
    total_hours = sum(e["hours"] for e in _wip_entries)
    billable_hours = sum(e["hours"] for e in billable)
    utilisation = round(billable_hours / total_hours * 100, 1) if total_hours > 0 else 0

    return {
        "total_unbilled_hours": round(total_unbilled_hours, 1),
        "total_unbilled_value": round(total_unbilled_value, 2),
        "total_billed_value": round(total_billed_value, 2),
        "total_hours": round(total_hours, 1),
        "billable_hours": round(billable_hours, 1),
        "non_billable_hours": round(sum(e["hours"] for e in non_billable), 1),
        "utilisation_pct": utilisation,
        "unbilled_entries": len(unbilled),
        "billed_entries": len(billed),
    }


@router.get("/by-staff")
async def wip_by_staff(user: User = Depends(get_current_user)):
    """WIP breakdown by staff member."""
    _seed()
    staff = {}
    for e in _wip_entries:
        sid = e["staff_id"]
        if sid not in staff:
            staff[sid] = {"staff_id": sid, "staff_name": e["staff_name"], "total_hours": 0, "billable_hours": 0, "unbilled_value": 0, "billed_value": 0, "clients": set()}
        staff[sid]["total_hours"] += e["hours"]
        if e["billable"]:
            staff[sid]["billable_hours"] += e["hours"]
        if e["status"] == "unbilled":
            staff[sid]["unbilled_value"] += e["hours"] * e["rate"]
        elif e["status"] == "billed":
            staff[sid]["billed_value"] += e["hours"] * e["rate"]
        if e["client_id"]:
            staff[sid]["clients"].add(e["client_name"])

    result = []
    for s in staff.values():
        s["utilisation_pct"] = round(s["billable_hours"] / s["total_hours"] * 100, 1) if s["total_hours"] > 0 else 0
        s["clients"] = sorted(s["clients"])
        s["client_count"] = len(s["clients"])
        s["total_hours"] = round(s["total_hours"], 1)
        s["billable_hours"] = round(s["billable_hours"], 1)
        s["unbilled_value"] = round(s["unbilled_value"], 2)
        s["billed_value"] = round(s["billed_value"], 2)
        result.append(s)
    result.sort(key=lambda s: s["unbilled_value"], reverse=True)
    return {"staff": result}


@router.get("/by-client")
async def wip_by_client(user: User = Depends(get_current_user)):
    """WIP breakdown by client."""
    _seed()
    clients = {}
    for e in _wip_entries:
        cid = e["client_id"] or "internal"
        if cid not in clients:
            clients[cid] = {"client_id": cid, "client_name": e["client_name"], "total_hours": 0, "unbilled_hours": 0, "unbilled_value": 0, "engagements": set(), "staff": set()}
        clients[cid]["total_hours"] += e["hours"]
        if e["status"] == "unbilled":
            clients[cid]["unbilled_hours"] += e["hours"]
            clients[cid]["unbilled_value"] += e["hours"] * e["rate"]
        clients[cid]["engagements"].add(e["engagement"])
        clients[cid]["staff"].add(e["staff_name"])

    result = []
    for c in clients.values():
        c["engagements"] = sorted(c["engagements"])
        c["staff"] = sorted(c["staff"])
        c["total_hours"] = round(c["total_hours"], 1)
        c["unbilled_hours"] = round(c["unbilled_hours"], 1)
        c["unbilled_value"] = round(c["unbilled_value"], 2)
        result.append(c)
    result.sort(key=lambda c: c["unbilled_value"], reverse=True)
    return {"clients": result}


@router.get("/aging")
async def wip_aging(user: User = Depends(get_current_user)):
    """WIP aging report — unbilled WIP by age bucket."""
    _seed()
    from datetime import date

    today = date(2026, 4, 8)
    buckets = {"0-7 days": 0, "8-14 days": 0, "15-30 days": 0, "31-60 days": 0, "60+ days": 0}
    bucket_hours = {"0-7 days": 0, "8-14 days": 0, "15-30 days": 0, "31-60 days": 0, "60+ days": 0}

    unbilled = [e for e in _wip_entries if e["status"] == "unbilled"]
    for e in unbilled:
        entry_date = date.fromisoformat(e["date"])
        age = (today - entry_date).days
        value = e["hours"] * e["rate"]
        if age <= 7:
            buckets["0-7 days"] += value
            bucket_hours["0-7 days"] += e["hours"]
        elif age <= 14:
            buckets["8-14 days"] += value
            bucket_hours["8-14 days"] += e["hours"]
        elif age <= 30:
            buckets["15-30 days"] += value
            bucket_hours["15-30 days"] += e["hours"]
        elif age <= 60:
            buckets["31-60 days"] += value
            bucket_hours["31-60 days"] += e["hours"]
        else:
            buckets["60+ days"] += value
            bucket_hours["60+ days"] += e["hours"]

    return {
        "aging": [
            {"bucket": k, "value": round(v, 2), "hours": round(bucket_hours[k], 1)}
            for k, v in buckets.items()
        ],
        "total_unbilled": round(sum(buckets.values()), 2),
    }


@router.post("/")
async def create_wip_entry(data: dict, user: User = Depends(get_current_user)):
    """Create a new WIP entry."""
    _seed()
    entry = {
        "id": str(uuid.uuid4()),
        "staff_id": data.get("staff_id", "staff-001"),
        "staff_name": data.get("staff_name", "Current User"),
        "client_id": data.get("client_id"),
        "client_name": data.get("client_name", ""),
        "engagement": data.get("engagement", "General"),
        "description": data.get("description", ""),
        "hours": data.get("hours", 0),
        "rate": data.get("rate", 0),
        "date": data.get("date", datetime.utcnow().strftime("%Y-%m-%d")),
        "status": "unbilled" if data.get("billable", True) else "non_billable",
        "billable": data.get("billable", True),
    }
    _wip_entries.insert(0, entry)
    return entry


@router.post("/{entry_id}/write-off")
async def write_off_wip(entry_id: str, user: User = Depends(get_current_user)):
    """Write off a WIP entry (mark as non-recoverable)."""
    _seed()
    entry = next((e for e in _wip_entries if e["id"] == entry_id), None)
    if not entry:
        raise HTTPException(status_code=404, detail="WIP entry not found")
    entry["status"] = "written_off"
    return {"id": entry_id, "status": "written_off"}


@router.delete("/{entry_id}")
async def delete_wip(entry_id: str, user: User = Depends(get_current_user)):
    """Delete a WIP entry."""
    _seed()
    global _wip_entries
    entry = next((e for e in _wip_entries if e["id"] == entry_id), None)
    if not entry:
        raise HTTPException(status_code=404, detail="WIP entry not found")
    _wip_entries = [e for e in _wip_entries if e["id"] != entry_id]
    return {"status": "deleted", "id": entry_id}

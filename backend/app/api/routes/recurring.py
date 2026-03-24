"""Recurring Transactions API routes."""

from fastapi import APIRouter, Depends, HTTPException
from app.auth.dependencies import get_current_user
from app.models.user import User
from datetime import datetime
import uuid

router = APIRouter(prefix="/recurring", tags=["Recurring Transactions"])

# In-memory store (replace with DB later)
_recurring = []
_seed_done = False


def _seed():
    global _seed_done
    if _seed_done:
        return
    _seed_done = True
    demos = [
        {
            "name": "Office Rent — 120 Collins St",
            "type": "bill",
            "frequency": "monthly",
            "amount": 4500.00,
            "tax_amount": 450.00,
            "total": 4950.00,
            "currency": "AUD",
            "account_code": "400",
            "supplier_name": "Collins Property Group",
            "client_name": None,
            "next_date": "2026-04-01",
            "last_generated": "2026-03-01",
            "status": "active",
            "start_date": "2024-01-01",
            "end_date": None,
            "occurrences_remaining": None,
            "description": "Monthly office lease — Level 8, Suite 4",
        },
        {
            "name": "Xero Subscription",
            "type": "bill",
            "frequency": "monthly",
            "amount": 79.00,
            "tax_amount": 7.90,
            "total": 86.90,
            "currency": "AUD",
            "account_code": "461",
            "supplier_name": "Xero Ltd",
            "client_name": None,
            "next_date": "2026-04-15",
            "last_generated": "2026-03-15",
            "status": "active",
            "start_date": "2025-06-15",
            "end_date": None,
            "occurrences_remaining": None,
            "description": "Cloud accounting software — Premium plan",
        },
        {
            "name": "Business Insurance Premium",
            "type": "bill",
            "frequency": "quarterly",
            "amount": 1800.00,
            "tax_amount": 180.00,
            "total": 1980.00,
            "currency": "AUD",
            "account_code": "470",
            "supplier_name": "QBE Insurance",
            "client_name": None,
            "next_date": "2026-04-01",
            "last_generated": "2026-01-01",
            "status": "active",
            "start_date": "2024-07-01",
            "end_date": "2027-07-01",
            "occurrences_remaining": 5,
            "description": "Combined business & professional indemnity insurance",
        },
        {
            "name": "Equipment Loan Repayment",
            "type": "bill",
            "frequency": "monthly",
            "amount": 1250.00,
            "tax_amount": 0,
            "total": 1250.00,
            "currency": "AUD",
            "account_code": "820",
            "supplier_name": "NAB Business Lending",
            "client_name": None,
            "next_date": "2026-04-20",
            "last_generated": "2026-03-20",
            "status": "active",
            "start_date": "2025-01-20",
            "end_date": "2028-01-20",
            "occurrences_remaining": 22,
            "description": "36-month equipment finance — Ref EF-442891",
        },
        {
            "name": "Office Cleaning Service",
            "type": "bill",
            "frequency": "fortnightly",
            "amount": 320.00,
            "tax_amount": 32.00,
            "total": 352.00,
            "currency": "AUD",
            "account_code": "453",
            "supplier_name": "SparkleClean Commercial",
            "client_name": None,
            "next_date": "2026-04-07",
            "last_generated": "2026-03-24",
            "status": "active",
            "start_date": "2025-03-01",
            "end_date": None,
            "occurrences_remaining": None,
            "description": "Fortnightly office cleaning — after-hours service",
        },
        {
            "name": "Internet & NBN",
            "type": "bill",
            "frequency": "monthly",
            "amount": 129.00,
            "tax_amount": 12.90,
            "total": 141.90,
            "currency": "AUD",
            "account_code": "462",
            "supplier_name": "Telstra Business",
            "client_name": None,
            "next_date": "2026-04-05",
            "last_generated": "2026-03-05",
            "status": "active",
            "start_date": "2024-06-05",
            "end_date": None,
            "occurrences_remaining": None,
            "description": "NBN Enterprise 100/40 — static IP included",
        },
        {
            "name": "Mobile Phone Plan",
            "type": "bill",
            "frequency": "monthly",
            "amount": 65.00,
            "tax_amount": 6.50,
            "total": 71.50,
            "currency": "AUD",
            "account_code": "462",
            "supplier_name": "Optus Business",
            "client_name": None,
            "next_date": "2026-04-12",
            "last_generated": "2026-03-12",
            "status": "paused",
            "start_date": "2025-01-12",
            "end_date": None,
            "occurrences_remaining": None,
            "description": "Business mobile — paused during staff transition",
        },
        {
            "name": "Retainer Invoice — Acme Corp",
            "type": "invoice",
            "frequency": "monthly",
            "amount": 5000.00,
            "tax_amount": 500.00,
            "total": 5500.00,
            "currency": "AUD",
            "account_code": "200",
            "supplier_name": None,
            "client_name": "Acme Corporation",
            "next_date": "2026-04-01",
            "last_generated": "2026-03-01",
            "status": "active",
            "start_date": "2025-07-01",
            "end_date": "2026-06-30",
            "occurrences_remaining": 3,
            "description": "Monthly advisory retainer — 12-month agreement",
        },
    ]
    for d in demos:
        _recurring.append({
            "id": str(uuid.uuid4()),
            "created_at": datetime.utcnow().isoformat(),
            **d,
        })


@router.get("/")
async def list_recurring(status: str | None = None, type: str | None = None, user: User = Depends(get_current_user)):
    """List all recurring transactions with optional filters."""
    _seed()
    results = _recurring
    if status:
        results = [r for r in results if r["status"] == status]
    if type:
        results = [r for r in results if r["type"] == type]
    return {"recurring": results, "total": len(results)}


@router.get("/summary")
async def recurring_summary(user: User = Depends(get_current_user)):
    """Summary of recurring transactions."""
    _seed()
    active = [r for r in _recurring if r["status"] == "active"]
    monthly_value = 0.0
    for r in active:
        if r["frequency"] == "weekly":
            monthly_value += r["total"] * 4.33
        elif r["frequency"] == "fortnightly":
            monthly_value += r["total"] * 2.17
        elif r["frequency"] == "monthly":
            monthly_value += r["total"]
        elif r["frequency"] == "quarterly":
            monthly_value += r["total"] / 3
        elif r["frequency"] == "annually":
            monthly_value += r["total"] / 12
    next_due = min((r["next_date"] for r in active), default=None)
    return {
        "total_recurring": len(_recurring),
        "active": len(active),
        "paused": len([r for r in _recurring if r["status"] == "paused"]),
        "monthly_value": round(monthly_value, 2),
        "next_due": next_due,
    }


@router.post("/")
async def create_recurring(data: dict, user: User = Depends(get_current_user)):
    """Create a new recurring transaction."""
    _seed()
    item = {
        "id": str(uuid.uuid4()),
        "created_at": datetime.utcnow().isoformat(),
        "status": "active",
        "last_generated": None,
        "occurrences_remaining": None,
        **data,
    }
    _recurring.append(item)
    return item


@router.put("/{recurring_id}")
async def update_recurring(recurring_id: str, data: dict, user: User = Depends(get_current_user)):
    """Update an existing recurring transaction."""
    _seed()
    for i, r in enumerate(_recurring):
        if r["id"] == recurring_id:
            _recurring[i] = {**r, **data}
            return _recurring[i]
    raise HTTPException(status_code=404, detail="Recurring transaction not found")


@router.post("/{recurring_id}/pause")
async def pause_recurring(recurring_id: str, user: User = Depends(get_current_user)):
    """Pause a recurring transaction."""
    _seed()
    for i, r in enumerate(_recurring):
        if r["id"] == recurring_id:
            if r["status"] != "active":
                raise HTTPException(status_code=400, detail="Only active items can be paused")
            _recurring[i]["status"] = "paused"
            return _recurring[i]
    raise HTTPException(status_code=404, detail="Recurring transaction not found")


@router.post("/{recurring_id}/resume")
async def resume_recurring(recurring_id: str, user: User = Depends(get_current_user)):
    """Resume a paused recurring transaction."""
    _seed()
    for i, r in enumerate(_recurring):
        if r["id"] == recurring_id:
            if r["status"] != "paused":
                raise HTTPException(status_code=400, detail="Only paused items can be resumed")
            _recurring[i]["status"] = "active"
            return _recurring[i]
    raise HTTPException(status_code=404, detail="Recurring transaction not found")


@router.delete("/{recurring_id}")
async def delete_recurring(recurring_id: str, user: User = Depends(get_current_user)):
    """Delete a recurring transaction."""
    _seed()
    for i, r in enumerate(_recurring):
        if r["id"] == recurring_id:
            _recurring.pop(i)
            return {"deleted": True}
    raise HTTPException(status_code=404, detail="Recurring transaction not found")

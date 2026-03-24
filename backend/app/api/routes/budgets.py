"""Budget Management API routes.

Full CRUD for budgets with line-item variance tracking.
In-memory store seeded with demo data for development.
"""

import uuid
from datetime import datetime, date
from copy import deepcopy

from fastapi import APIRouter, Depends, HTTPException
from app.auth.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/budgets", tags=["Budgets"])

# ---------------------------------------------------------------------------
# In-memory store
# ---------------------------------------------------------------------------
_budgets: dict[str, dict] = {}
_seeded = False


def _seed():
    """Populate demo budgets with realistic accounting figures."""
    global _seeded
    if _seeded:
        return
    _seeded = True

    now = datetime.utcnow().isoformat()

    # --- Budget 1: FY2026 Operating Budget (monthly, Apr 2025 – Mar 2026) ---
    fy_lines = [
        {
            "account_code": "4000",
            "account_name": "Sales Revenue",
            "category": "revenue",
            "budgeted": 600000.00,
            "actual": 574200.00,
            "variance": -25800.00,
            "variance_pct": -4.3,
            "months": [
                {"month": "2025-04", "budgeted": 50000, "actual": 47800},
                {"month": "2025-05", "budgeted": 50000, "actual": 48500},
                {"month": "2025-06", "budgeted": 50000, "actual": 52100},
                {"month": "2025-07", "budgeted": 50000, "actual": 46300},
                {"month": "2025-08", "budgeted": 50000, "actual": 49900},
                {"month": "2025-09", "budgeted": 50000, "actual": 51200},
                {"month": "2025-10", "budgeted": 50000, "actual": 48700},
                {"month": "2025-11", "budgeted": 50000, "actual": 47400},
                {"month": "2025-12", "budgeted": 50000, "actual": 53800},
                {"month": "2026-01", "budgeted": 50000, "actual": 46200},
                {"month": "2026-02", "budgeted": 50000, "actual": 44300},
                {"month": "2026-03", "budgeted": 50000, "actual": 38000},
            ],
        },
        {
            "account_code": "4100",
            "account_name": "Consulting Revenue",
            "category": "revenue",
            "budgeted": 180000.00,
            "actual": 196400.00,
            "variance": 16400.00,
            "variance_pct": 9.1,
            "months": [
                {"month": "2025-04", "budgeted": 15000, "actual": 16200},
                {"month": "2025-05", "budgeted": 15000, "actual": 15800},
                {"month": "2025-06", "budgeted": 15000, "actual": 17400},
                {"month": "2025-07", "budgeted": 15000, "actual": 14900},
                {"month": "2025-08", "budgeted": 15000, "actual": 16100},
                {"month": "2025-09", "budgeted": 15000, "actual": 17800},
                {"month": "2025-10", "budgeted": 15000, "actual": 16500},
                {"month": "2025-11", "budgeted": 15000, "actual": 15200},
                {"month": "2025-12", "budgeted": 15000, "actual": 18600},
                {"month": "2026-01", "budgeted": 15000, "actual": 16400},
                {"month": "2026-02", "budgeted": 15000, "actual": 15700},
                {"month": "2026-03", "budgeted": 15000, "actual": 15800},
            ],
        },
        {
            "account_code": "5000",
            "account_name": "Salaries & Wages",
            "category": "expense",
            "budgeted": 360000.00,
            "actual": 372600.00,
            "variance": 12600.00,
            "variance_pct": 3.5,
            "months": [
                {"month": "2025-04", "budgeted": 30000, "actual": 30000},
                {"month": "2025-05", "budgeted": 30000, "actual": 30000},
                {"month": "2025-06", "budgeted": 30000, "actual": 30800},
                {"month": "2025-07", "budgeted": 30000, "actual": 30000},
                {"month": "2025-08", "budgeted": 30000, "actual": 30000},
                {"month": "2025-09", "budgeted": 30000, "actual": 32400},
                {"month": "2025-10", "budgeted": 30000, "actual": 30000},
                {"month": "2025-11", "budgeted": 30000, "actual": 30000},
                {"month": "2025-12", "budgeted": 30000, "actual": 34200},
                {"month": "2026-01", "budgeted": 30000, "actual": 31800},
                {"month": "2026-02", "budgeted": 30000, "actual": 31400},
                {"month": "2026-03", "budgeted": 30000, "actual": 32000},
            ],
        },
        {
            "account_code": "5100",
            "account_name": "Rent & Occupancy",
            "category": "expense",
            "budgeted": 72000.00,
            "actual": 72000.00,
            "variance": 0.00,
            "variance_pct": 0.0,
            "months": [
                {"month": m, "budgeted": 6000, "actual": 6000}
                for m in [
                    "2025-04", "2025-05", "2025-06", "2025-07",
                    "2025-08", "2025-09", "2025-10", "2025-11",
                    "2025-12", "2026-01", "2026-02", "2026-03",
                ]
            ],
        },
        {
            "account_code": "5200",
            "account_name": "Software & Subscriptions",
            "category": "expense",
            "budgeted": 36000.00,
            "actual": 41800.00,
            "variance": 5800.00,
            "variance_pct": 16.1,
            "months": [
                {"month": "2025-04", "budgeted": 3000, "actual": 3200},
                {"month": "2025-05", "budgeted": 3000, "actual": 3100},
                {"month": "2025-06", "budgeted": 3000, "actual": 3400},
                {"month": "2025-07", "budgeted": 3000, "actual": 3300},
                {"month": "2025-08", "budgeted": 3000, "actual": 3500},
                {"month": "2025-09", "budgeted": 3000, "actual": 3600},
                {"month": "2025-10", "budgeted": 3000, "actual": 3700},
                {"month": "2025-11", "budgeted": 3000, "actual": 3800},
                {"month": "2025-12", "budgeted": 3000, "actual": 3900},
                {"month": "2026-01", "budgeted": 3000, "actual": 3400},
                {"month": "2026-02", "budgeted": 3000, "actual": 3500},
                {"month": "2026-03", "budgeted": 3000, "actual": 3400},
            ],
        },
        {
            "account_code": "5300",
            "account_name": "Travel & Entertainment",
            "category": "expense",
            "budgeted": 24000.00,
            "actual": 18200.00,
            "variance": -5800.00,
            "variance_pct": -24.2,
            "months": [
                {"month": "2025-04", "budgeted": 2000, "actual": 1400},
                {"month": "2025-05", "budgeted": 2000, "actual": 1200},
                {"month": "2025-06", "budgeted": 2000, "actual": 1800},
                {"month": "2025-07", "budgeted": 2000, "actual": 1600},
                {"month": "2025-08", "budgeted": 2000, "actual": 1500},
                {"month": "2025-09", "budgeted": 2000, "actual": 1700},
                {"month": "2025-10", "budgeted": 2000, "actual": 1400},
                {"month": "2025-11", "budgeted": 2000, "actual": 1300},
                {"month": "2025-12", "budgeted": 2000, "actual": 1800},
                {"month": "2026-01", "budgeted": 2000, "actual": 1200},
                {"month": "2026-02", "budgeted": 2000, "actual": 1500},
                {"month": "2026-03", "budgeted": 2000, "actual": 1800},
            ],
        },
        {
            "account_code": "5400",
            "account_name": "Professional Services",
            "category": "expense",
            "budgeted": 48000.00,
            "actual": 52400.00,
            "variance": 4400.00,
            "variance_pct": 9.2,
            "months": [
                {"month": "2025-04", "budgeted": 4000, "actual": 4200},
                {"month": "2025-05", "budgeted": 4000, "actual": 3800},
                {"month": "2025-06", "budgeted": 4000, "actual": 4600},
                {"month": "2025-07", "budgeted": 4000, "actual": 4100},
                {"month": "2025-08", "budgeted": 4000, "actual": 4300},
                {"month": "2025-09", "budgeted": 4000, "actual": 4800},
                {"month": "2025-10", "budgeted": 4000, "actual": 4500},
                {"month": "2025-11", "budgeted": 4000, "actual": 4200},
                {"month": "2025-12", "budgeted": 4000, "actual": 5200},
                {"month": "2026-01", "budgeted": 4000, "actual": 4400},
                {"month": "2026-02", "budgeted": 4000, "actual": 4100},
                {"month": "2026-03", "budgeted": 4000, "actual": 4200},
            ],
        },
    ]

    fy_total_budget = sum(l["budgeted"] for l in fy_lines if l["category"] == "expense")
    fy_total_actual = sum(l["actual"] for l in fy_lines if l["category"] == "expense")
    fy_total_variance = fy_total_actual - fy_total_budget

    fy_id = str(uuid.uuid4())
    _budgets[fy_id] = {
        "id": fy_id,
        "name": "FY2026 Operating Budget",
        "period_type": "monthly",
        "start_date": "2025-04-01",
        "end_date": "2026-03-31",
        "status": "active",
        "currency": "AUD",
        "total_budget": fy_total_budget,
        "total_actual": fy_total_actual,
        "total_variance": fy_total_variance,
        "variance_pct": round(fy_total_variance / fy_total_budget * 100, 1) if fy_total_budget else 0,
        "lines": fy_lines,
        "created_at": now,
        "updated_at": now,
    }

    # --- Budget 2: Q1 2026 Marketing (quarterly) ---
    mkt_lines = [
        {
            "account_code": "6000",
            "account_name": "Digital Advertising",
            "category": "expense",
            "budgeted": 45000.00,
            "actual": 52300.00,
            "variance": 7300.00,
            "variance_pct": 16.2,
            "months": [
                {"month": "2026-01", "budgeted": 15000, "actual": 17800},
                {"month": "2026-02", "budgeted": 15000, "actual": 16200},
                {"month": "2026-03", "budgeted": 15000, "actual": 18300},
            ],
        },
        {
            "account_code": "6100",
            "account_name": "Content & SEO",
            "category": "expense",
            "budgeted": 18000.00,
            "actual": 15600.00,
            "variance": -2400.00,
            "variance_pct": -13.3,
            "months": [
                {"month": "2026-01", "budgeted": 6000, "actual": 5200},
                {"month": "2026-02", "budgeted": 6000, "actual": 4800},
                {"month": "2026-03", "budgeted": 6000, "actual": 5600},
            ],
        },
        {
            "account_code": "6200",
            "account_name": "Events & Sponsorships",
            "category": "expense",
            "budgeted": 12000.00,
            "actual": 14500.00,
            "variance": 2500.00,
            "variance_pct": 20.8,
            "months": [
                {"month": "2026-01", "budgeted": 4000, "actual": 4200},
                {"month": "2026-02", "budgeted": 4000, "actual": 3800},
                {"month": "2026-03", "budgeted": 4000, "actual": 6500},
            ],
        },
        {
            "account_code": "6300",
            "account_name": "Brand & Creative",
            "category": "expense",
            "budgeted": 9000.00,
            "actual": 7800.00,
            "variance": -1200.00,
            "variance_pct": -13.3,
            "months": [
                {"month": "2026-01", "budgeted": 3000, "actual": 2800},
                {"month": "2026-02", "budgeted": 3000, "actual": 2400},
                {"month": "2026-03", "budgeted": 3000, "actual": 2600},
            ],
        },
        {
            "account_code": "6400",
            "account_name": "Marketing Tools & Analytics",
            "category": "expense",
            "budgeted": 6000.00,
            "actual": 6200.00,
            "variance": 200.00,
            "variance_pct": 3.3,
            "months": [
                {"month": "2026-01", "budgeted": 2000, "actual": 2100},
                {"month": "2026-02", "budgeted": 2000, "actual": 2000},
                {"month": "2026-03", "budgeted": 2000, "actual": 2100},
            ],
        },
    ]

    mkt_total_budget = sum(l["budgeted"] for l in mkt_lines)
    mkt_total_actual = sum(l["actual"] for l in mkt_lines)
    mkt_total_variance = mkt_total_actual - mkt_total_budget

    mkt_id = str(uuid.uuid4())
    _budgets[mkt_id] = {
        "id": mkt_id,
        "name": "Q1 2026 Marketing",
        "period_type": "quarterly",
        "start_date": "2026-01-01",
        "end_date": "2026-03-31",
        "status": "active",
        "currency": "AUD",
        "total_budget": mkt_total_budget,
        "total_actual": mkt_total_actual,
        "total_variance": mkt_total_variance,
        "variance_pct": round(mkt_total_variance / mkt_total_budget * 100, 1) if mkt_total_budget else 0,
        "lines": mkt_lines,
        "created_at": now,
        "updated_at": now,
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/")
async def list_budgets(
    status: str | None = None,
    period_type: str | None = None,
    user: User = Depends(get_current_user),
):
    """List all budgets with optional filters."""
    _seed()
    budgets = list(_budgets.values())
    if status:
        budgets = [b for b in budgets if b["status"] == status]
    if period_type:
        budgets = [b for b in budgets if b["period_type"] == period_type]
    # Return lightweight list (without full line detail)
    summary_fields = [
        "id", "name", "period_type", "start_date", "end_date",
        "status", "currency", "total_budget", "total_actual",
        "total_variance", "variance_pct", "created_at", "updated_at",
    ]
    items = [{k: b[k] for k in summary_fields} for b in budgets]
    return {"budgets": items, "total": len(items)}


@router.get("/summary")
async def budget_summary(user: User = Depends(get_current_user)):
    """High-level overview across all active budgets."""
    _seed()
    active = [b for b in _budgets.values() if b["status"] == "active"]
    total_budgeted = sum(b["total_budget"] for b in active)
    total_actual = sum(b["total_actual"] for b in active)
    total_variance = total_actual - total_budgeted
    return {
        "active_budgets": len(active),
        "total_budgets": len(_budgets),
        "total_budgeted": round(total_budgeted, 2),
        "total_actual": round(total_actual, 2),
        "total_variance": round(total_variance, 2),
        "variance_pct": round(total_variance / total_budgeted * 100, 1) if total_budgeted else 0,
        "currency": "AUD",
        "over_budget_lines": sum(
            1 for b in active for l in b["lines"]
            if l["category"] == "expense" and l["actual"] > l["budgeted"]
        ),
        "under_budget_lines": sum(
            1 for b in active for l in b["lines"]
            if l["category"] == "expense" and l["actual"] <= l["budgeted"]
        ),
    }


@router.post("/")
async def create_budget(data: dict, user: User = Depends(get_current_user)):
    """Create a new budget."""
    _seed()
    now = datetime.utcnow().isoformat()
    budget_id = str(uuid.uuid4())
    lines = data.get("lines", [])
    total_budget = sum(l.get("budgeted", 0) for l in lines)
    total_actual = sum(l.get("actual", 0) for l in lines)
    total_variance = total_actual - total_budget

    budget = {
        "id": budget_id,
        "name": data.get("name", "Untitled Budget"),
        "period_type": data.get("period_type", "monthly"),
        "start_date": data.get("start_date"),
        "end_date": data.get("end_date"),
        "status": data.get("status", "draft"),
        "currency": data.get("currency", "AUD"),
        "total_budget": round(total_budget, 2),
        "total_actual": round(total_actual, 2),
        "total_variance": round(total_variance, 2),
        "variance_pct": round(total_variance / total_budget * 100, 1) if total_budget else 0,
        "lines": lines,
        "created_at": now,
        "updated_at": now,
    }
    _budgets[budget_id] = budget
    return budget


@router.get("/{budget_id}")
async def get_budget(budget_id: str, user: User = Depends(get_current_user)):
    """Get a single budget with full line-item detail and actuals."""
    _seed()
    budget = _budgets.get(budget_id)
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    return deepcopy(budget)


@router.put("/{budget_id}")
async def update_budget(budget_id: str, data: dict, user: User = Depends(get_current_user)):
    """Update an existing budget."""
    _seed()
    budget = _budgets.get(budget_id)
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    updatable = [
        "name", "period_type", "start_date", "end_date",
        "status", "currency", "lines",
    ]
    for key in updatable:
        if key in data:
            budget[key] = data[key]

    # Recalculate totals if lines were updated
    if "lines" in data:
        lines = budget["lines"]
        budget["total_budget"] = round(sum(l.get("budgeted", 0) for l in lines), 2)
        budget["total_actual"] = round(sum(l.get("actual", 0) for l in lines), 2)
        budget["total_variance"] = round(budget["total_actual"] - budget["total_budget"], 2)
        budget["variance_pct"] = (
            round(budget["total_variance"] / budget["total_budget"] * 100, 1)
            if budget["total_budget"] else 0
        )

    budget["updated_at"] = datetime.utcnow().isoformat()
    return deepcopy(budget)


@router.get("/{budget_id}/variance")
async def budget_variance(budget_id: str, user: User = Depends(get_current_user)):
    """Variance report — budget vs actual per line item."""
    _seed()
    budget = _budgets.get(budget_id)
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    variance_lines = []
    for line in budget["lines"]:
        status = "on_track"
        if line["category"] == "expense":
            if line["variance_pct"] > 10:
                status = "over_budget"
            elif line["variance_pct"] > 0:
                status = "caution"
            elif line["variance_pct"] < -10:
                status = "under_budget"
        elif line["category"] == "revenue":
            if line["variance_pct"] < -10:
                status = "below_target"
            elif line["variance_pct"] > 10:
                status = "above_target"

        variance_lines.append({
            "account_code": line["account_code"],
            "account_name": line["account_name"],
            "category": line["category"],
            "budgeted": line["budgeted"],
            "actual": line["actual"],
            "variance": line["variance"],
            "variance_pct": line["variance_pct"],
            "status": status,
            "months": line.get("months", []),
        })

    return {
        "budget_id": budget["id"],
        "budget_name": budget["name"],
        "period_type": budget["period_type"],
        "start_date": budget["start_date"],
        "end_date": budget["end_date"],
        "total_budget": budget["total_budget"],
        "total_actual": budget["total_actual"],
        "total_variance": budget["total_variance"],
        "variance_pct": budget["variance_pct"],
        "lines": variance_lines,
    }


@router.delete("/{budget_id}")
async def delete_budget(budget_id: str, user: User = Depends(get_current_user)):
    """Delete a budget."""
    _seed()
    if budget_id not in _budgets:
        raise HTTPException(status_code=404, detail="Budget not found")
    del _budgets[budget_id]
    return {"status": "deleted", "id": budget_id}

"""Scenario Planning API — what-if financial modelling, Monte Carlo simulation, and projection."""

import math
import random
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.auth.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/scenarios", tags=["Scenario Planning"])

# In-memory store (replaced by DB in production)
_scenarios_store: dict[str, dict] = {}


class Baseline(BaseModel):
    monthly_revenue: float = Field(..., ge=0)
    monthly_expenses: float = Field(..., ge=0)
    cash_on_hand: float = Field(0)


class ScenarioItem(BaseModel):
    type: str = Field(..., min_length=1)
    params: dict = Field(default_factory=dict)


class ScenarioCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    baseline: Baseline
    scenarios: list[ScenarioItem] = Field(default_factory=list)


class SimulationRequest(BaseModel):
    baseline: Baseline
    scenarios: list[ScenarioItem] = Field(default_factory=list)
    monte_carlo_runs: int = Field(default=500, ge=10, le=5000)


def _apply_scenarios(baseline: Baseline, scenarios: list[ScenarioItem], noise: float = 0.0) -> list[dict]:
    """Run a 12-month cash flow simulation with the given scenarios applied.

    If noise > 0, applies random variation for Monte Carlo simulation.
    """
    import calendar

    months = []
    for i in range(12):
        month_num = i + 1
        month_name = calendar.month_abbr[month_num]
        rev = baseline.monthly_revenue
        exp = baseline.monthly_expenses
        if noise > 0:
            rev *= (1 + random.gauss(0, noise))
            exp *= (1 + random.gauss(0, noise * 0.5))
        months.append({
            "month": month_num,
            "label": month_name,
            "revenue": rev,
            "expenses": exp,
            "cash_adjustment": 0,
        })

    for sc in scenarios:
        p = sc.params
        if sc.type == "hire":
            start = max(0, int(p.get("start_month", 1)) - 1)
            cost = (int(p.get("num_hires", 1)) * float(p.get("avg_salary", 60000))) / 12
            for i in range(start, 12):
                months[i]["expenses"] += cost

        elif sc.type == "revenue_drop":
            dur = int(p.get("duration_months", 6))
            drop = float(p.get("drop_pct", 10)) / 100
            for i in range(min(dur, 12)):
                months[i]["revenue"] *= (1 - drop)

        elif sc.type == "revenue_grow":
            dur = int(p.get("duration_months", 12))
            grow = float(p.get("growth_pct", 10)) / 100
            for i in range(min(dur, 12)):
                months[i]["revenue"] *= (1 + grow * (i + 1) / dur)

        elif sc.type == "new_location":
            start = max(0, int(p.get("start_month", 3)) - 1)
            if start < 12:
                months[start]["expenses"] += float(p.get("setup_cost", 0))
            for i in range(start, 12):
                months[i]["expenses"] += float(p.get("monthly_rent", 0))
                months[i]["revenue"] += float(p.get("monthly_revenue", 0))

        elif sc.type == "price_increase":
            inc = float(p.get("increase_pct", 5)) / 100
            for m in months:
                m["revenue"] *= (1 + inc)

        elif sc.type == "lose_client":
            mo = max(0, int(p.get("month", 1)) - 1)
            loss = float(p.get("client_revenue", 0)) / 12
            for i in range(mo, 12):
                months[i]["revenue"] -= loss

        elif sc.type == "loan":
            amt = float(p.get("loan_amount", 0))
            rate = float(p.get("interest_rate", 5)) / 100 / 12
            term = int(p.get("term_months", 36))
            if rate > 0 and term > 0:
                payment = amt * (rate * (1 + rate) ** term) / ((1 + rate) ** term - 1)
            else:
                payment = amt / max(term, 1)
            months[0]["cash_adjustment"] += amt
            for m in months:
                m["expenses"] += payment

        elif sc.type == "equipment":
            cost = float(p.get("purchase_cost", 0))
            month_idx = max(0, int(p.get("purchase_month", 1)) - 1)
            monthly_savings = float(p.get("monthly_savings", 0))
            if month_idx < 12:
                months[month_idx]["expenses"] += cost
            for i in range(month_idx, 12):
                months[i]["expenses"] -= monthly_savings

        elif sc.type == "custom":
            impact = float(p.get("monthly_impact", 0))
            for m in months:
                if impact >= 0:
                    m["revenue"] += impact
                else:
                    m["expenses"] += abs(impact)

    # Calculate running cash balance
    running_cash = baseline.cash_on_hand
    for m in months:
        net = m["revenue"] - m["expenses"] + m["cash_adjustment"]
        running_cash += net
        m["net"] = round(net, 2)
        m["cash_balance"] = round(running_cash, 2)
        m["revenue"] = round(m["revenue"], 2)
        m["expenses"] = round(m["expenses"], 2)

    return months


@router.post("/scenarios")
async def create_scenario(req: ScenarioCreate, user: User = Depends(get_current_user)):
    """Save a scenario for later comparison."""
    scenario_id = str(uuid.uuid4())
    _scenarios_store[scenario_id] = {
        "id": scenario_id,
        "name": req.name,
        "baseline": req.baseline.model_dump(),
        "scenarios": [s.model_dump() for s in req.scenarios],
        "created_at": datetime.utcnow().isoformat(),
        "user_id": str(user.id) if hasattr(user, "id") else "demo",
    }
    return _scenarios_store[scenario_id]


@router.get("/scenarios")
async def list_scenarios(user: User = Depends(get_current_user)):
    """List all saved scenarios."""
    user_id = str(user.id) if hasattr(user, "id") else "demo"
    return [s for s in _scenarios_store.values() if s.get("user_id") == user_id]


@router.get("/scenarios/{scenario_id}")
async def get_scenario(scenario_id: str, user: User = Depends(get_current_user)):
    """Get a specific saved scenario."""
    if scenario_id not in _scenarios_store:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return _scenarios_store[scenario_id]


@router.delete("/scenarios/{scenario_id}")
async def delete_scenario(scenario_id: str, user: User = Depends(get_current_user)):
    """Delete a saved scenario."""
    if scenario_id not in _scenarios_store:
        raise HTTPException(status_code=404, detail="Scenario not found")
    del _scenarios_store[scenario_id]
    return {"status": "deleted"}


@router.post("/simulate")
async def simulate(req: SimulationRequest, user: User = Depends(get_current_user)):
    """Run a what-if simulation with Monte Carlo analysis and return projections."""
    baseline_months = _apply_scenarios(req.baseline, [])
    scenario_months = _apply_scenarios(req.baseline, req.scenarios) if req.scenarios else None

    # Monte Carlo simulation
    monte_carlo = None
    if req.scenarios:
        runs = req.monte_carlo_runs
        all_end_cash = []
        all_month_cash = [[] for _ in range(12)]

        for _ in range(runs):
            run_months = _apply_scenarios(req.baseline, req.scenarios, noise=0.05)
            all_end_cash.append(run_months[11]["cash_balance"])
            for i in range(12):
                all_month_cash[i].append(run_months[i]["cash_balance"])

        all_end_cash.sort()
        p10 = all_end_cash[int(runs * 0.10)]
        p50 = all_end_cash[int(runs * 0.50)]
        p90 = all_end_cash[int(runs * 0.90)]

        percentiles_by_month = []
        for i in range(12):
            vals = sorted(all_month_cash[i])
            percentiles_by_month.append({
                "month": i + 1,
                "p10": round(vals[int(runs * 0.10)], 2),
                "p25": round(vals[int(runs * 0.25)], 2),
                "p50": round(vals[int(runs * 0.50)], 2),
                "p75": round(vals[int(runs * 0.75)], 2),
                "p90": round(vals[int(runs * 0.90)], 2),
            })

        prob_negative = round(sum(1 for c in all_end_cash if c < 0) / runs * 100, 1)

        monte_carlo = {
            "runs": runs,
            "end_cash_p10": round(p10, 2),
            "end_cash_p50": round(p50, 2),
            "end_cash_p90": round(p90, 2),
            "probability_negative": prob_negative,
            "percentiles_by_month": percentiles_by_month,
        }

    result = {
        "baseline": baseline_months,
        "scenario": scenario_months,
        "monte_carlo": monte_carlo,
    }

    if scenario_months:
        end_diff = scenario_months[11]["cash_balance"] - baseline_months[11]["cash_balance"]
        negative_month = next((m for m in scenario_months if m["cash_balance"] < 0), None)
        total_rev = sum(m["revenue"] for m in scenario_months)
        total_exp = sum(m["expenses"] for m in scenario_months)

        result["insights"] = {
            "year_end_impact": round(end_diff, 2),
            "months_until_negative": negative_month["month"] if negative_month else None,
            "projected_margin": round((total_rev - total_exp) / total_rev * 100, 1) if total_rev > 0 else 0,
            "total_revenue": round(total_rev, 2),
            "total_expenses": round(total_exp, 2),
        }

    return result

"""Scenario Planning API — what-if financial modelling and projection."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.auth.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/scenarios", tags=["Scenario Planning"])


class Baseline(BaseModel):
    monthly_revenue: float = Field(..., ge=0)
    monthly_expenses: float = Field(..., ge=0)
    cash_on_hand: float = Field(0)


class Scenario(BaseModel):
    type: str = Field(..., min_length=1)
    params: dict = Field(default_factory=dict)


class SimulationRequest(BaseModel):
    baseline: Baseline
    scenarios: list[Scenario] = Field(default_factory=list)


def _run_simulation(baseline: Baseline, scenarios: list[Scenario]) -> list[dict]:
    """Run a 12-month cash flow simulation with the given scenarios applied."""
    import calendar
    from datetime import date

    months = []
    for i in range(12):
        month_num = i + 1
        month_name = calendar.month_abbr[month_num]
        months.append({
            "month": month_num,
            "label": month_name,
            "revenue": baseline.monthly_revenue,
            "expenses": baseline.monthly_expenses,
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


@router.post("/simulate")
async def simulate(req: SimulationRequest, user: User = Depends(get_current_user)):
    """Run a what-if simulation and return 12-month projection."""
    baseline_months = _run_simulation(req.baseline, [])
    scenario_months = _run_simulation(req.baseline, req.scenarios) if req.scenarios else None

    result = {
        "baseline": baseline_months,
        "scenario": scenario_months,
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

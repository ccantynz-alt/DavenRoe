"""Catch-up rescue wizard API — generate a rescue plan from wizard answers.

Public endpoint (no auth) so prospects can get an assessment without signing up.
Uses conservative penalty calculations per jurisdiction.
"""
from decimal import Decimal
from typing import List, Literal

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/v1/catch-up", tags=["catch-up"])


class WizardAnswers(BaseModel):
    jurisdictions: List[Literal["AU", "NZ", "UK", "US"]] = Field(..., min_length=1)
    years_behind: Literal["3_months", "1_year", "2_years", "3_plus_years", "unsure"]
    documents_available: List[Literal["bank_statements", "receipts", "invoices", "nothing"]]
    business_type: Literal["sole_trader", "company", "trust", "partnership", "charity"]
    worries: List[Literal["gst_bas_vat", "income_tax", "payroll", "all"]]


class RescuePlan(BaseModel):
    total_periods: int
    jurisdictions: List[str]
    penalty_best_case: Decimal
    penalty_worst_case: Decimal
    penalty_savings_via_davenroe: Decimal
    recommended_steps: List[str]
    davenroe_time_hours: int
    human_time_hours: int
    recommended_plan: Literal["basic_299", "plus_799", "enterprise"]


# Periods per year per jurisdiction (indirect tax + income tax + payroll combined)
PERIODS_PER_YEAR = {
    "AU": 5,   # 4 BAS + 1 income tax
    "NZ": 7,   # 6 GST (2-monthly) + 1 income tax
    "UK": 5,   # 4 VAT + 1 corporation/income
    "US": 17,  # 12 state sales tax + 4 941 + 1 federal
}

# Conservative per-period fixed penalty in USD equivalents
PENALTY_PER_PERIOD = {
    "AU": Decimal("600"),
    "NZ": Decimal("450"),
    "UK": Decimal("350"),
    "US": Decimal("400"),
}

# Interest / compounding assumed ~10% pa of penalty stack over time
INTEREST_UPLIFT = Decimal("1.12")

# Voluntary-disclosure savings: typical 40-60% reduction, use 50% conservative
VOLUNTARY_DISCLOSURE_SAVINGS_RATE = Decimal("0.50")

YEARS_MAP = {
    "3_months": Decimal("0.25"),
    "1_year": Decimal("1"),
    "2_years": Decimal("2"),
    "3_plus_years": Decimal("4"),
    "unsure": Decimal("3"),
}


@router.post("/assess", response_model=RescuePlan)
async def assess_catch_up(answers: WizardAnswers):
    """Generate a catch-up rescue plan from the wizard answers.

    This endpoint is public — does not require authentication — so prospects
    can get their estimate and rescue plan without signing up.
    """
    years = YEARS_MAP[answers.years_behind]

    # Calculate total periods across all jurisdictions
    total_periods = 0
    worst_case = Decimal("0")
    for j in answers.jurisdictions:
        periods_this_jurisdiction = PERIODS_PER_YEAR.get(j, 5) * years
        total_periods += int(periods_this_jurisdiction)
        worst_case += PENALTY_PER_PERIOD.get(j, Decimal("500")) * periods_this_jurisdiction

    worst_case = (worst_case * INTEREST_UPLIFT).quantize(Decimal("1"))
    savings = (worst_case * VOLUNTARY_DISCLOSURE_SAVINGS_RATE).quantize(Decimal("1"))
    best_case = (worst_case - savings).quantize(Decimal("1"))

    # Recommended plan based on years behind
    if years <= Decimal("2"):
        plan = "basic_299"
    elif years <= Decimal("5"):
        plan = "plus_799"
    else:
        plan = "enterprise"

    # Build recommended steps (personalized)
    steps = []

    if "all" in answers.worries or "gst_bas_vat" in answers.worries:
        gst_tax = {"AU": "BAS", "NZ": "GST", "UK": "VAT", "US": "sales tax"}
        jurisdiction_list = " + ".join(gst_tax.get(j, "indirect tax") for j in answers.jurisdictions)
        steps.append(
            f"File most recent 3 {jurisdiction_list} returns first — these carry the biggest per-day penalties."
        )

    steps.append(
        "Lodge voluntary disclosure for older periods — reduces penalties by 40-60% in most cases."
    )

    if "nothing" in answers.documents_available:
        steps.append(
            "Reconstruct transactions from bank statements alone using AI-powered vendor lookup and date-clustering. No source documents needed."
        )
    elif "bank_statements" in answers.documents_available:
        steps.append(
            "Bulk ingest your bank statements (CSV / PDF / OFX). AI categorizes and matches receipts automatically."
        )

    if "income_tax" in answers.worries or "all" in answers.worries:
        steps.append(
            "Generate every missed income tax return in chronological order. DavenRoe auto-drafts from reconstructed ledger."
        )

    if "payroll" in answers.worries or "all" in answers.worries:
        steps.append(
            "File missed payroll filings (STP / RTI / 941 / IR348) — critical for staff super/pension compliance."
        )

    steps.append(
        "Apply for hardship remission where business circumstances qualify — DavenRoe drafts the application."
    )

    steps.append(
        "Set up continuous deadline monitoring with 30/14/7/3/1-day alerts so you never fall behind again."
    )

    # Human hours estimate: ~2.5 hours per period for a traditional accountant
    human_hours = int(Decimal(total_periods) * Decimal("2.5"))
    # DavenRoe: fixed overhead + tiny incremental
    davenroe_hours = max(2, int(Decimal(total_periods) * Decimal("0.25")))

    return RescuePlan(
        total_periods=total_periods,
        jurisdictions=answers.jurisdictions,
        penalty_best_case=best_case,
        penalty_worst_case=worst_case,
        penalty_savings_via_davenroe=savings,
        recommended_steps=steps,
        davenroe_time_hours=davenroe_hours,
        human_time_hours=human_hours,
        recommended_plan=plan,
    )


@router.get("/penalty-estimate")
async def penalty_estimate(
    jurisdiction: Literal["AU", "NZ", "UK", "US"],
    periods_missed: int = 4,
    revenue_band: Literal["under_100k", "100_500k", "500k_1m", "1_5m", "5m_plus"] = "100_500k",
    avg_months_overdue: int = 6,
):
    """Lightweight penalty estimator — feeds the /catchup/penalty-calculator page."""
    multipliers = {
        "under_100k": Decimal("1"),
        "100_500k": Decimal("2.5"),
        "500k_1m": Decimal("5"),
        "1_5m": Decimal("10"),
        "5m_plus": Decimal("20"),
    }
    per_period = PENALTY_PER_PERIOD.get(jurisdiction, Decimal("500"))
    base = per_period * multipliers[revenue_band] * periods_missed
    interest_months = (avg_months_overdue * periods_missed) / 2
    interest_pct = {"AU": "0.1117", "NZ": "0.1088", "UK": "0.025", "US": "0.08"}[jurisdiction]
    interest = base * Decimal(interest_pct) * Decimal(interest_months) / Decimal("12")
    high = (base + interest).quantize(Decimal("1"))
    low = (base * Decimal("0.7")).quantize(Decimal("1"))
    savings = (high * Decimal("0.5")).quantize(Decimal("1"))
    with_davenroe = (high - savings).quantize(Decimal("1"))
    return {
        "jurisdiction": jurisdiction,
        "periods_missed": periods_missed,
        "penalty_low": low,
        "penalty_high": high,
        "savings_via_davenroe": savings,
        "with_davenroe": with_davenroe,
    }

"""Get Ready for Accountant — pack generator.

Assembles everything a registered tax agent needs to sign off a client's
books: trial balance, per-period tax returns, annual income tax schedules,
provisional tax plan, outstanding-items checklist, and a plain-English
narrative the accountant can paste straight into their workpapers.

Pitch: "99.99% accurate pack. Hand it to your accountant in one click. If
they like it, they'll want to use DavenRoe themselves — we give them 60
days free."

No DB writes here yet; this endpoint composes from the catch-up engine and
the static compliance catalogue so partners can try the output immediately.
"""

from datetime import date, datetime, timezone
from decimal import Decimal
from typing import List, Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.auth.dependencies import get_current_user
from app.models.user import User
from app.api.routes.catch_up_engine import (
    CatchUpRequest,
    YearInput,
    _reconstruct,
)

router = APIRouter(prefix="/accountant-pack", tags=["Accountant Pack"])


# --------------------------------------------------------------------------- #
# Models                                                                      #
# --------------------------------------------------------------------------- #


class PackRequest(BaseModel):
    jurisdiction: Literal["AU", "NZ", "GB", "US"]
    entity_name: str = Field(..., min_length=1, max_length=200)
    entity_type: Literal["sole_trader", "company", "trust", "partnership"] = "sole_trader"
    accountant_name: str | None = None
    accountant_email: str | None = None
    gst_registered: bool = True
    gst_filing_frequency: Literal["monthly", "2_monthly", "quarterly", "6_monthly"] = "2_monthly"
    years: List[YearInput] = Field(..., min_length=1, max_length=10)
    notes: str | None = None


class PackSection(BaseModel):
    title: str
    body: str
    data: dict = {}


class AccountantPack(BaseModel):
    pack_id: str
    generated_at: str
    entity_name: str
    jurisdiction: str
    accountant: dict
    executive_summary: str
    confidence: str
    sections: List[PackSection]
    checklist: List[dict]
    totals: dict
    sign_off: dict
    trial_accountant_offer: dict


# --------------------------------------------------------------------------- #
# Helpers                                                                     #
# --------------------------------------------------------------------------- #


def _exec_summary(req: PackRequest, plan) -> str:
    years_str = ", ".join(str(y) for y in plan.years_covered)
    return (
        f"{req.entity_name} ({req.entity_type.replace('_', ' ')}, {req.jurisdiction}) "
        f"catch-up pack covering {years_str}. "
        f"Reconstruction yielded {len(plan.gst_returns)} indirect-tax returns and "
        f"{len(plan.income_tax_returns)} annual income tax returns. "
        f"Estimated aggregate exposure (indirect + income + provisional): "
        f"${plan.total_exposure:,.2f}. "
        f"This pack is provided for review by a registered tax agent — no figure is "
        f"lodged automatically."
    )


def _checklist(req: PackRequest) -> list[dict]:
    items = [
        {"task": "Verify opening balances tie to prior-year signed accounts", "done": False},
        {"task": "Reconcile bank feed to closing balance on last day of each year", "done": False},
        {"task": "Confirm GST registration date and filing frequency with authority", "done": False},
        {"task": "Match payroll totals to STP / PAYE reports", "done": False, "optional": True},
        {"task": "Review related-party transactions for arm's-length pricing", "done": False},
        {"task": "Confirm entity type and tax residency status", "done": False},
        {"task": "Collect source documents for material expense items (>$1,000)", "done": False},
        {"task": "Flag any cash sales not captured in bank feed", "done": False},
        {"task": "Sign-off by registered tax agent before lodgement", "done": False, "required": True},
    ]
    if req.jurisdiction == "NZ":
        items.insert(3, {"task": "Confirm provisional tax method (standard / estimation / AIM)", "done": False})
    if req.jurisdiction == "AU":
        items.insert(3, {"task": "Confirm PAYG instalment method and variation history", "done": False})
    return items


def _sign_off_block(req: PackRequest) -> dict:
    return {
        "prepared_by": "DavenRoe Catch-Up Engine v1",
        "prepared_for": req.accountant_name or "(registered tax agent TBC)",
        "prepared_for_email": req.accountant_email or "",
        "signature_required": True,
        "disclaimer": (
            "This pack was assembled by AI from user-supplied annual totals. "
            "DavenRoe is not a registered tax agent. A qualified tax professional "
            "must review every figure and sign off before any return is lodged."
        ),
    }


def _trial_offer() -> dict:
    return {
        "headline": "Like what you see? Try DavenRoe free for 60 days.",
        "audience": "registered_accountants",
        "offer": {
            "duration_days": 60,
            "plan_included": "plus_799",
            "seat_limit": 5,
            "client_workspaces": 10,
            "support": "dedicated onboarding specialist",
        },
        "cta": "Sign up at davenroe.com/partners — no credit card, full platform access.",
    }


# --------------------------------------------------------------------------- #
# Endpoint                                                                    #
# --------------------------------------------------------------------------- #


@router.post("/generate", response_model=AccountantPack)
async def generate_pack(req: PackRequest, user: User = Depends(get_current_user)):
    """Generate a Get-Ready-for-Accountant pack from a single payload."""
    # Drive the reconstruction
    plan = _reconstruct(CatchUpRequest(
        jurisdiction=req.jurisdiction,
        years=req.years,
        is_resident=True,
        gst_filing_frequency=req.gst_filing_frequency,
    ))

    sections: list[PackSection] = []

    # 1. Trial balance narrative (aggregated, since we only have annual totals)
    rev_total = sum((y.revenue for y in req.years), Decimal("0"))
    exp_total = sum((y.expenses for y in req.years), Decimal("0"))
    pay_total = sum((y.payroll for y in req.years), Decimal("0"))
    sections.append(PackSection(
        title="Aggregate Trial Balance Summary",
        body=(
            f"Total revenue across {len(req.years)} years: ${rev_total:,.2f}. "
            f"Total deductible expenses: ${exp_total:,.2f}. "
            f"Total payroll: ${pay_total:,.2f}. "
            "Detailed per-account breakdown is produced from bank-feed ingestion — "
            "request the uplifted pack once feeds are connected."
        ),
        data={
            "revenue_total": str(rev_total),
            "expenses_total": str(exp_total),
            "payroll_total": str(pay_total),
        },
    ))

    # 2. Indirect tax returns
    sections.append(PackSection(
        title="Indirect Tax Returns (GST / BAS / VAT / Sales Tax)",
        body=(
            f"{len(plan.gst_returns)} returns reconstructed. "
            f"Aggregate net indirect tax payable: ${plan.total_gst_owed:,.2f}. "
            "Oldest periods appear first so voluntary disclosure can be batched chronologically."
        ),
        data={"returns": [r.model_dump() for r in plan.gst_returns]},
    ))

    # 3. Annual income tax
    sections.append(PackSection(
        title="Annual Income Tax Returns",
        body=(
            f"{len(plan.income_tax_returns)} annual returns modelled. "
            f"Aggregate income tax payable: ${plan.total_income_tax_owed:,.2f}. "
            "Brackets applied per jurisdiction and tax year. Non-resident / foreign-sourced "
            "income requires manual treaty check."
        ),
        data={"returns": [r.model_dump() for r in plan.income_tax_returns]},
    ))

    # 4. Provisional / PAYG
    if plan.provisional_instalments:
        sections.append(PackSection(
            title="Provisional Tax / PAYG Instalment Schedule",
            body=(
                f"{len(plan.provisional_instalments)} instalments scheduled. "
                f"Aggregate provisional payable: ${plan.total_provisional_owed:,.2f}. "
                "NZ uses standard uplift method (+5%); AU uses prior-year instalment rate."
            ),
            data={"instalments": [p.model_dump() for p in plan.provisional_instalments]},
        ))

    # 5. Roadmap
    sections.append(PackSection(
        title="Recommended Lodgement Roadmap",
        body="Follow this order to minimise penalties and maximise voluntary-disclosure relief.",
        data={"steps": plan.roadmap},
    ))

    # 6. Notes
    if req.notes:
        sections.append(PackSection(
            title="Client Notes",
            body=req.notes,
        ))

    pack_id = f"GRFA-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"

    return AccountantPack(
        pack_id=pack_id,
        generated_at=datetime.now(timezone.utc).isoformat(),
        entity_name=req.entity_name,
        jurisdiction=req.jurisdiction,
        accountant={
            "name": req.accountant_name,
            "email": req.accountant_email,
        },
        executive_summary=_exec_summary(req, plan),
        confidence=plan.accuracy_confidence,
        sections=sections,
        checklist=_checklist(req),
        totals={
            "gst_total": str(plan.total_gst_owed),
            "income_tax_total": str(plan.total_income_tax_owed),
            "provisional_total": str(plan.total_provisional_owed),
            "aggregate_exposure": str(plan.total_exposure),
        },
        sign_off=_sign_off_block(req),
        trial_accountant_offer=_trial_offer(),
    )


@router.get("/sample")
async def sample_pack(user: User = Depends(get_current_user)):
    """Return a canned NZ sole-trader sample so the UI has something to render."""
    req = PackRequest(
        jurisdiction="NZ",
        entity_name="Example Trading Ltd",
        entity_type="sole_trader",
        accountant_name="Jane Accountant",
        accountant_email="jane@samplepractice.co.nz",
        years=[
            YearInput(year=2021, revenue=Decimal("85000"), expenses=Decimal("32000"), payroll=Decimal("0")),
            YearInput(year=2022, revenue=Decimal("112000"), expenses=Decimal("41000"), payroll=Decimal("0")),
            YearInput(year=2023, revenue=Decimal("146000"), expenses=Decimal("53000"), payroll=Decimal("0")),
            YearInput(year=2024, revenue=Decimal("168000"), expenses=Decimal("61000"), payroll=Decimal("12000")),
            YearInput(year=2025, revenue=Decimal("181000"), expenses=Decimal("68000"), payroll=Decimal("14000")),
        ],
        notes="Owner has been overwhelmed with operations; target 60-day full reconstruction.",
    )
    # Reuse the generator path
    return await generate_pack(req, user)

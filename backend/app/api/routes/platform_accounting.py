"""Platform Self-Accounting — DavenRoe as its own accountant.

Tracks subscription revenue, calculates GST/income tax on DavenRoe's
own earnings, produces its own tax returns. The platform eats its own
dog food.

Revenue sources:
  * NZ subscriptions (NZD) → 15% GST to IRD
  * AU subscriptions (AUD) → 10% GST to ATO
  * Global subscriptions (USD/GBP) → export, zero-rated for GST

This module maintains a running ledger of platform revenue and produces
GST/income tax calculations the owner can use for their own filings.
"""

from datetime import date, datetime, timezone
from decimal import Decimal, ROUND_HALF_UP

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.auth.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/platform-accounting", tags=["Platform Accounting"])


# --------------------------------------------------------------------------- #
# In-memory platform ledger (wires to DB in production)                       #
# --------------------------------------------------------------------------- #

_revenue_entries: list[dict] = []

# Seed with realistic subscription data
_SEED = [
    {"date": "2026-02-15", "customer": "Harbour Coffee Roasters", "plan": "Practice", "amount": 149, "currency": "NZD", "jurisdiction": "NZ"},
    {"date": "2026-02-18", "customer": "Wright Advisory Group", "plan": "Firm", "amount": 499, "currency": "AUD", "jurisdiction": "AU"},
    {"date": "2026-03-01", "customer": "Kiwi Design Studio", "plan": "Solo", "amount": 49, "currency": "NZD", "jurisdiction": "NZ"},
    {"date": "2026-03-01", "customer": "Harbour Coffee Roasters", "plan": "Practice", "amount": 149, "currency": "NZD", "jurisdiction": "NZ"},
    {"date": "2026-03-01", "customer": "Pacific Ledger Partners", "plan": "Practice", "amount": 149, "currency": "AUD", "jurisdiction": "AU"},
    {"date": "2026-03-01", "customer": "Wright Advisory Group", "plan": "Firm", "amount": 499, "currency": "AUD", "jurisdiction": "AU"},
    {"date": "2026-03-10", "customer": "Queenstown Ventures", "plan": "Solo", "amount": 49, "currency": "NZD", "jurisdiction": "NZ"},
    {"date": "2026-03-15", "customer": "Melbourne Tax Solutions", "plan": "Firm", "amount": 499, "currency": "AUD", "jurisdiction": "AU"},
    {"date": "2026-03-22", "customer": "Nelson Builders Ltd", "plan": "Practice", "amount": 149, "currency": "NZD", "jurisdiction": "NZ"},
    {"date": "2026-04-01", "customer": "Harbour Coffee Roasters", "plan": "Practice", "amount": 149, "currency": "NZD", "jurisdiction": "NZ"},
    {"date": "2026-04-01", "customer": "Wright Advisory Group", "plan": "Firm", "amount": 499, "currency": "AUD", "jurisdiction": "AU"},
    {"date": "2026-04-01", "customer": "Pacific Ledger Partners", "plan": "Practice", "amount": 149, "currency": "AUD", "jurisdiction": "AU"},
    {"date": "2026-04-01", "customer": "Melbourne Tax Solutions", "plan": "Firm", "amount": 499, "currency": "AUD", "jurisdiction": "AU"},
    {"date": "2026-04-01", "customer": "Kiwi Design Studio", "plan": "Solo", "amount": 49, "currency": "NZD", "jurisdiction": "NZ"},
    {"date": "2026-04-01", "customer": "Nelson Builders Ltd", "plan": "Practice", "amount": 149, "currency": "NZD", "jurisdiction": "NZ"},
    {"date": "2026-04-10", "customer": "Queenstown Ventures", "plan": "Solo", "amount": 49, "currency": "NZD", "jurisdiction": "NZ"},
]


def _q(v: Decimal) -> Decimal:
    return v.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _seed():
    if not _revenue_entries:
        _revenue_entries.extend(_SEED)


GST_RATES = {"NZ": Decimal("0.15"), "AU": Decimal("0.10")}


# --------------------------------------------------------------------------- #
# Endpoints                                                                   #
# --------------------------------------------------------------------------- #


class RecordRevenueRequest(BaseModel):
    customer: str
    plan: str
    amount: float
    currency: str = "NZD"
    jurisdiction: str = "NZ"
    date: str | None = None


@router.post("/revenue")
async def record_revenue(req: RecordRevenueRequest, user: User = Depends(get_current_user)):
    """Record a subscription payment as platform revenue."""
    _seed()
    entry = {
        "date": req.date or date.today().isoformat(),
        "customer": req.customer,
        "plan": req.plan,
        "amount": req.amount,
        "currency": req.currency,
        "jurisdiction": req.jurisdiction,
    }
    _revenue_entries.append(entry)
    return entry


@router.get("/revenue")
async def list_revenue(
    jurisdiction: str | None = None,
    period: str | None = None,
    user: User = Depends(get_current_user),
):
    """List all platform revenue entries with optional filters."""
    _seed()
    entries = list(_revenue_entries)
    if jurisdiction:
        entries = [e for e in entries if e["jurisdiction"] == jurisdiction.upper()]
    if period:
        entries = [e for e in entries if e["date"].startswith(period)]
    entries.sort(key=lambda e: e["date"], reverse=True)
    return {"entries": entries, "total": len(entries)}


@router.get("/gst-position")
async def gst_position(user: User = Depends(get_current_user)):
    """Calculate DavenRoe's own GST position by jurisdiction.

    All subscription prices are GST-inclusive, so:
        GST component = gross × rate / (1 + rate)
    """
    _seed()
    by_jurisdiction: dict[str, dict] = {}

    for entry in _revenue_entries:
        j = entry["jurisdiction"]
        rate = GST_RATES.get(j, Decimal("0"))
        gross = Decimal(str(entry["amount"]))
        if rate > 0:
            gst_component = _q(gross * rate / (Decimal("1") + rate))
            net = _q(gross - gst_component)
        else:
            gst_component = Decimal("0")
            net = gross

        if j not in by_jurisdiction:
            by_jurisdiction[j] = {
                "jurisdiction": j,
                "currency": entry["currency"],
                "total_gross": Decimal("0"),
                "total_net": Decimal("0"),
                "total_gst_collected": Decimal("0"),
                "gst_rate": str(rate),
                "transaction_count": 0,
            }
        pos = by_jurisdiction[j]
        pos["total_gross"] += gross
        pos["total_net"] += net
        pos["total_gst_collected"] += gst_component
        pos["transaction_count"] += 1

    result = []
    for pos in by_jurisdiction.values():
        result.append({
            **pos,
            "total_gross": str(_q(pos["total_gross"])),
            "total_net": str(_q(pos["total_net"])),
            "total_gst_collected": str(_q(pos["total_gst_collected"])),
        })

    total_gst = sum(Decimal(p["total_gst_collected"]) for p in result)
    return {
        "positions": result,
        "total_gst_payable": str(_q(total_gst)),
        "filing_note": (
            "NZ GST returns due 28th of the month following the 2-monthly period. "
            "AU BAS due 28th of the month following the quarter end."
        ),
    }


@router.get("/income-tax-estimate")
async def income_tax_estimate(user: User = Depends(get_current_user)):
    """Estimate DavenRoe's own income tax liability (NZ company rate 28%)."""
    _seed()
    total_revenue = sum(Decimal(str(e["amount"])) for e in _revenue_entries)
    # Back out GST to get net revenue
    total_net = Decimal("0")
    for e in _revenue_entries:
        rate = GST_RATES.get(e["jurisdiction"], Decimal("0"))
        gross = Decimal(str(e["amount"]))
        net = _q(gross / (Decimal("1") + rate)) if rate > 0 else gross
        total_net += net

    # Estimated expenses (rough — owner will refine)
    estimated_expenses = _q(total_net * Decimal("0.35"))
    taxable = _q(total_net - estimated_expenses)
    # NZ company rate 28%
    tax = _q(taxable * Decimal("0.28"))

    return {
        "period": "FY2026 (to date)",
        "total_gross_revenue": str(_q(total_revenue)),
        "total_net_revenue": str(_q(total_net)),
        "estimated_expenses": str(estimated_expenses),
        "estimated_taxable_income": str(taxable),
        "estimated_income_tax": str(tax),
        "effective_rate": f"{(tax / taxable * 100):.1f}%" if taxable > 0 else "0%",
        "tax_rate_applied": "28% (NZ company rate)",
        "note": "Expenses estimated at 35% of net revenue. Update with actual expenses for accuracy.",
    }


@router.get("/summary")
async def platform_accounting_summary(user: User = Depends(get_current_user)):
    """One-page summary: revenue, GST, income tax, customer count."""
    _seed()

    total_customers = len(set(e["customer"] for e in _revenue_entries))
    total_entries = len(_revenue_entries)
    mrr_nz = sum(e["amount"] for e in _revenue_entries if e["jurisdiction"] == "NZ" and e["date"].startswith("2026-04"))
    mrr_au = sum(e["amount"] for e in _revenue_entries if e["jurisdiction"] == "AU" and e["date"].startswith("2026-04"))

    return {
        "total_customers": total_customers,
        "total_transactions": total_entries,
        "current_mrr_nzd": mrr_nz,
        "current_mrr_aud": mrr_au,
        "combined_mrr_nzd_equivalent": mrr_nz + int(mrr_au * 0.92),
        "next_gst_filing": {
            "NZ": "2026-04-28 (GST 2-monthly Mar/Apr period)",
            "AU": "2026-07-28 (BAS Q4 Apr-Jun quarter)",
        },
    }

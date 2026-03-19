"""Universal Toolkit API routes.

Everyday tools for every accountant and bookkeeper.
Calculators, validators, reference data, reconciliation.
"""

from datetime import date
from decimal import Decimal

from fastapi import APIRouter, HTTPException

from app.toolkit.calculators import FinancialCalculator, InvoiceCalculator, DepreciationQuickCalc, RatioCalculator
from app.toolkit.utilities import TaxIdValidator, GSTCalculator, CurrencyConverter, BusinessDateCalculator
from app.toolkit.reference import FiscalYearReference, LodgmentDueDates, ChartOfAccountsTemplates
from app.toolkit.reconciliation import ReconciliationMatcher

router = APIRouter(prefix="/toolkit", tags=["Universal Toolkit"])


# ── Financial Calculators ────────────────────────────────────

@router.post("/calc/compound-interest")
async def compound_interest(data: dict):
    """Compound interest calculator with schedule."""
    calc = FinancialCalculator()
    return calc.compound_interest(
        principal=Decimal(str(data.get("principal", 0))),
        annual_rate=Decimal(str(data.get("annual_rate", 0))),
        years=int(data.get("years", 1)),
        compounds_per_year=int(data.get("compounds_per_year", 12)),
    )


@router.post("/calc/loan")
async def loan_amortization(data: dict):
    """Loan amortization schedule."""
    calc = FinancialCalculator()
    return calc.loan_amortization(
        principal=Decimal(str(data.get("principal", 0))),
        annual_rate=Decimal(str(data.get("annual_rate", 0))),
        years=int(data.get("years", 1)),
        payments_per_year=int(data.get("payments_per_year", 12)),
    )


@router.post("/calc/present-value")
async def present_value(data: dict):
    """Present value calculation."""
    calc = FinancialCalculator()
    return calc.present_value(
        future_value=Decimal(str(data.get("future_value", 0))),
        annual_rate=Decimal(str(data.get("annual_rate", 0))),
        years=int(data.get("years", 1)),
    )


@router.post("/calc/future-value")
async def future_value(data: dict):
    """Future value calculation."""
    calc = FinancialCalculator()
    return calc.future_value(
        present_value=Decimal(str(data.get("present_value", 0))),
        annual_rate=Decimal(str(data.get("annual_rate", 0))),
        years=int(data.get("years", 1)),
    )


@router.post("/calc/irr")
async def irr(data: dict):
    """Internal rate of return."""
    calc = FinancialCalculator()
    cash_flows = [Decimal(str(cf)) for cf in data.get("cash_flows", [])]
    return calc.irr(cash_flows)


@router.post("/calc/depreciation")
async def depreciation(data: dict):
    """Quick depreciation calculation."""
    calc = DepreciationQuickCalc()
    return calc.calculate(
        cost=Decimal(str(data.get("cost", 0))),
        salvage=Decimal(str(data.get("salvage", 0))),
        life_years=int(data.get("life_years", 5)),
        method=data.get("method", "straight_line"),
        year=data.get("year"),
    )


@router.post("/calc/ratios")
async def financial_ratios(data: dict):
    """Calculate financial ratios from quick inputs."""
    calc = RatioCalculator()
    return calc.calculate_all(**{k: Decimal(str(v)) if isinstance(v, (int, float, str)) else v for k, v in data.items()})


# ── Invoice & Payment ────────────────────────────────────────

@router.post("/invoice/gst")
async def invoice_gst(data: dict):
    """GST/VAT inclusive ↔ exclusive calculator."""
    calc = InvoiceCalculator()
    return calc.gst_calculation(
        amount=Decimal(str(data.get("amount", 0))),
        rate=Decimal(str(data.get("rate", 10))),
        is_inclusive=data.get("is_inclusive", False),
    )


@router.post("/invoice/early-payment")
async def early_payment(data: dict):
    """Early payment discount calculator (e.g., 2/10 net 30)."""
    calc = InvoiceCalculator()
    return calc.early_payment_discount(
        invoice_amount=Decimal(str(data.get("amount", 0))),
        discount_pct=Decimal(str(data.get("discount_pct", 2))),
        discount_days=int(data.get("discount_days", 10)),
        net_days=int(data.get("net_days", 30)),
    )


@router.post("/invoice/late-interest")
async def late_interest(data: dict):
    """Late payment interest calculator."""
    calc = InvoiceCalculator()
    return calc.late_payment_interest(
        invoice_amount=Decimal(str(data.get("amount", 0))),
        annual_rate=Decimal(str(data.get("annual_rate", 10))),
        days_overdue=int(data.get("days_overdue", 0)),
    )


# ── Tax ID Validator ─────────────────────────────────────────

@router.post("/validate/tax-id")
async def validate_tax_id(data: dict):
    """Validate a tax identification number (ABN, EIN, IRD, etc.)."""
    validator = TaxIdValidator()
    return validator.validate(
        tax_id=data.get("tax_id", ""),
        jurisdiction=data.get("jurisdiction", "AU"),
        id_type=data.get("type", "auto"),
    )


# ── GST/VAT Multi-Jurisdiction ──────────────────────────────

@router.post("/gst/calculate")
async def gst_calculate(data: dict):
    """Multi-jurisdiction GST/VAT calculator."""
    calc = GSTCalculator()
    return calc.calculate(
        amount=Decimal(str(data.get("amount", 0))),
        jurisdiction=data.get("jurisdiction", "AU"),
        is_inclusive=data.get("is_inclusive", False),
        us_state=data.get("us_state"),
    )


@router.post("/gst/compare")
async def gst_compare(data: dict):
    """Compare GST/VAT across all jurisdictions."""
    calc = GSTCalculator()
    return calc.compare_jurisdictions(Decimal(str(data.get("amount", 0))))


# ── Currency ─────────────────────────────────────────────────

@router.post("/currency/convert")
async def currency_convert(data: dict):
    """Convert between currencies."""
    converter = CurrencyConverter()
    return converter.convert(
        amount=Decimal(str(data.get("amount", 0))),
        from_currency=data.get("from", "USD"),
        to_currency=data.get("to", "AUD"),
    )


@router.get("/currency/rates")
async def currency_rates():
    """List all available exchange rates."""
    return CurrencyConverter().list_rates()


# ── Dates ────────────────────────────────────────────────────

@router.post("/dates/business-days")
async def business_days(data: dict):
    """Add business days to a date."""
    calc = BusinessDateCalculator()
    return calc.add_business_days(
        start=date.fromisoformat(data.get("start_date", str(date.today()))),
        days=int(data.get("days", 30)),
        jurisdiction=data.get("jurisdiction", "AU"),
    )


@router.post("/dates/payment-due")
async def payment_due(data: dict):
    """Calculate payment due date from invoice terms."""
    calc = BusinessDateCalculator()
    return calc.payment_due_date(
        invoice_date=date.fromisoformat(data.get("invoice_date", str(date.today()))),
        terms_days=int(data.get("terms_days", 30)),
        jurisdiction=data.get("jurisdiction", "AU"),
    )


# ── Reference ────────────────────────────────────────────────

@router.get("/reference/fy/{jurisdiction}")
async def fiscal_year(jurisdiction: str):
    """Get current financial year info for a jurisdiction."""
    return FiscalYearReference().current_fy(jurisdiction)


@router.get("/reference/fy")
async def fiscal_year_all():
    """Financial year info for all jurisdictions."""
    return FiscalYearReference().all_jurisdictions()


@router.get("/reference/deadlines/{jurisdiction}")
async def lodgment_deadlines(jurisdiction: str):
    """Get upcoming lodgment/filing deadlines."""
    return LodgmentDueDates().upcoming(jurisdiction)


@router.get("/reference/coa")
async def list_coa_templates():
    """List available chart of accounts templates."""
    return ChartOfAccountsTemplates().list_templates()


@router.get("/reference/coa/{template_id}")
async def get_coa_template(template_id: str):
    """Get a chart of accounts template by industry."""
    template = ChartOfAccountsTemplates().get_template(template_id)
    if not template:
        raise HTTPException(status_code=404, detail=f"Template '{template_id}' not found")
    return template


# ── Reconciliation ───────────────────────────────────────────

@router.post("/reconciliation/match")
async def reconciliation_match(data: dict):
    """Auto-match bank transactions to ledger entries."""
    matcher = ReconciliationMatcher()
    return matcher.reconcile(
        data.get("bank_transactions", []),
        data.get("ledger_entries", []),
        date_tolerance_days=int(data.get("date_tolerance_days", 3)),
    )


@router.post("/reconciliation/duplicates")
async def find_duplicates(data: dict):
    """Find potential duplicate transactions."""
    return ReconciliationMatcher().find_duplicates(data.get("transactions", []))


@router.post("/reconciliation/bank-rec")
async def bank_rec_summary(data: dict):
    """Generate bank reconciliation summary statement."""
    return ReconciliationMatcher().bank_rec_summary(
        bank_balance=Decimal(str(data.get("bank_balance", 0))),
        ledger_balance=Decimal(str(data.get("ledger_balance", 0))),
        outstanding_deposits=data.get("outstanding_deposits", []),
        outstanding_payments=data.get("outstanding_payments", []),
    )

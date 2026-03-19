"""Specialist Toolkit API routes.

Provides tools for every type of chartered accountant.
"""

from decimal import Decimal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.specialists.registry import SpecialistRegistry
from app.specialists.engines.audit import AuditSamplingEngine, JournalEntryTestingEngine, DepreciationEngine
from app.specialists.engines.management import VarianceAnalysisEngine, CostAllocationEngine, BreakEvenEngine, WorkingCapitalEngine
from app.specialists.engines.insolvency import SolvencyTestEngine, CreditorWaterfallEngine, VoidableTransactionScanner
from app.specialists.engines.trust_estate import TrustDistributionEngine, EstateCGTEngine
from app.specialists.engines.payroll import TerminationPayEngine, LeaveAccrualEngine
from app.specialists.engines.esg import CarbonCalculatorEngine, ESGMetricsEngine

router = APIRouter(prefix="/specialists", tags=["Specialist Toolkits"])
registry = SpecialistRegistry()


# ── Registry ─────────────────────────────────────────────────

@router.get("/")
async def list_specializations():
    """List all accounting specializations and their Astra toolkits."""
    specs = registry.list_all()
    return {
        "specializations": [
            {
                "id": s.id,
                "title": s.title,
                "description": s.description,
                "certifications": s.certifications,
                "pain_points": s.pain_points,
                "heavy_lifting_count": len(s.heavy_lifting),
                "heavy_lifting": s.heavy_lifting,
            }
            for s in specs
        ],
        "total_specializations": len(specs),
        "total_automations": registry.get_total_automations(),
    }


@router.get("/{spec_id}")
async def get_specialization(spec_id: str):
    """Get details for a specific specialization."""
    spec = registry.get(spec_id)
    if not spec:
        raise HTTPException(status_code=404, detail=f"Specialization '{spec_id}' not found")
    return {
        "id": spec.id,
        "title": spec.title,
        "description": spec.description,
        "certifications": spec.certifications,
        "pain_points": spec.pain_points,
        "heavy_lifting": spec.heavy_lifting,
        "tools": spec.astra_tools,
        "jurisdictions": spec.jurisdictions,
    }


@router.get("/search/{query}")
async def search_specializations(query: str):
    """Search specializations by keyword."""
    results = registry.search(query)
    return {
        "query": query,
        "results": [{"id": s.id, "title": s.title, "description": s.description} for s in results],
    }


# ── Audit Tools ──────────────────────────────────────────────

@router.post("/audit/sampling")
async def audit_sampling(data: dict):
    """Statistical audit sampling (MUS or stratified)."""
    engine = AuditSamplingEngine()
    method = data.get("method", "mus")
    transactions = data.get("transactions", [])
    if method == "mus":
        return engine.monetary_unit_sampling(
            transactions,
            materiality=Decimal(str(data.get("materiality", 50000))),
            confidence=data.get("confidence", 0.95),
        )
    return engine.stratified_sampling(transactions)


@router.post("/audit/journal-testing")
async def journal_entry_testing(data: dict):
    """Test journal entries for fraud indicators."""
    engine = JournalEntryTestingEngine()
    return engine.test_journal_entries(
        data.get("entries", []),
        approval_threshold=Decimal(str(data.get("approval_threshold", 10000))),
    )


@router.post("/audit/depreciation")
async def verify_depreciation(data: dict):
    """Recalculate and verify asset depreciation."""
    engine = DepreciationEngine()
    if "assets" in data:
        return engine.verify_asset_register(data["assets"])
    return engine.calculate_depreciation(
        cost=Decimal(str(data.get("cost", 0))),
        salvage_value=Decimal(str(data.get("salvage_value", 0))),
        useful_life_years=int(data.get("useful_life_years", 5)),
        method=data.get("method", "straight_line"),
        periods_elapsed=data.get("periods_elapsed"),
    )


# ── Management Accounting Tools ──────────────────────────────

@router.post("/management/variance")
async def budget_variance(data: dict):
    """Budget vs actual with variance analysis."""
    engine = VarianceAnalysisEngine()
    return engine.budget_vs_actual(data.get("budget", []), data.get("actuals", []))


@router.post("/management/cost-allocation")
async def cost_allocation(data: dict):
    """Allocate overhead costs across cost centers."""
    engine = CostAllocationEngine()
    return engine.allocate_costs(
        Decimal(str(data.get("total_overhead", 0))),
        data.get("cost_centers", []),
        data.get("allocation_basis", "revenue"),
    )


@router.post("/management/break-even")
async def break_even(data: dict):
    """Break-even analysis with sensitivity."""
    engine = BreakEvenEngine()
    return engine.calculate_break_even(
        Decimal(str(data.get("fixed_costs", 0))),
        Decimal(str(data.get("price_per_unit", 0))),
        Decimal(str(data.get("variable_cost_per_unit", 0))),
    )


@router.post("/management/working-capital")
async def working_capital(data: dict):
    """Working capital cycle analysis (DSO, DPO, DIO)."""
    engine = WorkingCapitalEngine()
    return engine.calculate_cycle(
        revenue=Decimal(str(data.get("revenue", 0))),
        cogs=Decimal(str(data.get("cogs", 0))),
        avg_receivables=Decimal(str(data.get("avg_receivables", 0))),
        avg_payables=Decimal(str(data.get("avg_payables", 0))),
        avg_inventory=Decimal(str(data.get("avg_inventory", 0))),
    )


# ── Insolvency Tools ────────────────────────────────────────

@router.post("/insolvency/solvency-test")
async def solvency_test(data: dict):
    """Run comprehensive solvency tests."""
    engine = SolvencyTestEngine()
    return engine.comprehensive_test(
        assets=Decimal(str(data.get("assets", 0))),
        liabilities=Decimal(str(data.get("liabilities", 0))),
        cash=Decimal(str(data.get("cash", 0))),
        debts_due=data.get("debts_due", []),
    )


@router.post("/insolvency/creditor-waterfall")
async def creditor_waterfall(data: dict):
    """Calculate creditor priority waterfall distribution."""
    engine = CreditorWaterfallEngine()
    return engine.calculate_waterfall(
        Decimal(str(data.get("available_funds", 0))),
        data.get("creditors", []),
    )


@router.post("/insolvency/voidable-transactions")
async def voidable_transactions(data: dict):
    """Scan for voidable transactions in relation-back period."""
    engine = VoidableTransactionScanner()
    from datetime import date
    return engine.scan(
        data.get("transactions", []),
        insolvency_date=date.fromisoformat(data.get("insolvency_date", "2024-01-01")),
        jurisdiction=data.get("jurisdiction", "AU"),
    )


# ── Trust & Estate Tools ────────────────────────────────────

@router.post("/trust/distribution")
async def trust_distribution(data: dict):
    """Calculate trust distributions to beneficiaries."""
    engine = TrustDistributionEngine()
    return engine.calculate_distribution(
        data.get("trust_income", {}),
        data.get("beneficiaries", []),
    )


@router.post("/estate/cgt")
async def estate_cgt(data: dict):
    """Calculate estate CGT on death."""
    engine = EstateCGTEngine()
    return engine.calculate_estate_cgt(
        data.get("assets", []),
        data.get("date_of_death", "2024-01-01"),
        data.get("jurisdiction", "AU"),
    )


# ── Payroll Tools ────────────────────────────────────────────

@router.post("/payroll/termination")
async def termination_pay(data: dict):
    """Calculate termination/redundancy payout."""
    engine = TerminationPayEngine()
    return engine.calculate_termination(
        annual_salary=Decimal(str(data.get("annual_salary", 0))),
        years_of_service=Decimal(str(data.get("years_of_service", 0))),
        unused_annual_leave_hours=Decimal(str(data.get("unused_annual_leave_hours", 0))),
        unused_long_service_leave_hours=Decimal(str(data.get("unused_long_service_leave_hours", 0))),
        is_redundancy=data.get("is_redundancy", False),
        jurisdiction=data.get("jurisdiction", "AU"),
    )


@router.post("/payroll/leave-accrual")
async def leave_accrual(data: dict):
    """Calculate leave accrual balance and liability."""
    engine = LeaveAccrualEngine()
    return engine.calculate_accrual(
        annual_salary=Decimal(str(data.get("annual_salary", 0))),
        years_of_service=Decimal(str(data.get("years_of_service", 0))),
        leave_type=data.get("leave_type", "annual"),
        jurisdiction=data.get("jurisdiction", "AU"),
    )


# ── ESG Tools ────────────────────────────────────────────────

@router.post("/esg/carbon")
async def carbon_calculation(data: dict):
    """Calculate carbon emissions from activity data."""
    engine = CarbonCalculatorEngine()
    return engine.calculate_emissions(data.get("activities", []))


@router.post("/esg/carbon-from-spend")
async def carbon_from_spend(data: dict):
    """Estimate Scope 3 emissions from financial spend."""
    engine = CarbonCalculatorEngine()
    return engine.estimate_from_spend(data.get("expenses", []))

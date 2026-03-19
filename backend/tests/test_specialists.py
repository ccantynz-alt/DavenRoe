"""Tests for specialist toolkit engines.

Every financial calculation must be deterministic and correct.
"""

from datetime import date
from decimal import Decimal

from app.specialists.registry import SpecialistRegistry
from app.specialists.engines.audit import AuditSamplingEngine, JournalEntryTestingEngine, DepreciationEngine
from app.specialists.engines.management import VarianceAnalysisEngine, CostAllocationEngine, BreakEvenEngine, WorkingCapitalEngine
from app.specialists.engines.insolvency import SolvencyTestEngine, CreditorWaterfallEngine, VoidableTransactionScanner
from app.specialists.engines.trust_estate import TrustDistributionEngine, EstateCGTEngine
from app.specialists.engines.payroll import TerminationPayEngine, LeaveAccrualEngine
from app.specialists.engines.esg import CarbonCalculatorEngine, ESGMetricsEngine


# ── Registry ─────────────────────────────────────────────────

class TestRegistry:
    def test_all_specs_loaded(self):
        reg = SpecialistRegistry()
        assert len(reg.list_all()) == 12

    def test_total_automations(self):
        reg = SpecialistRegistry()
        total = reg.get_total_automations()
        assert total >= 90  # at least 90 automations

    def test_search(self):
        reg = SpecialistRegistry()
        results = reg.search("insolvency")
        assert len(results) >= 1
        assert results[0].id == "insolvency"

    def test_search_by_pain_point(self):
        reg = SpecialistRegistry()
        results = reg.search("Benford")
        assert any(r.id == "forensic" for r in results)

    def test_get_by_certification(self):
        reg = SpecialistRegistry()
        cpa_specs = reg.get_by_certification("CPA")
        assert len(cpa_specs) >= 8  # most specializations require CPA


# ── Audit ────────────────────────────────────────────────────

class TestAuditEngine:
    def test_mus_sampling(self):
        txns = [{"amount": 1000 + i * 100} for i in range(100)]
        engine = AuditSamplingEngine()
        result = engine.monetary_unit_sampling(txns, Decimal("50000"))
        assert result["status"] == "complete"
        assert result["sample_size"] > 0
        assert result["sample_size"] <= 100

    def test_journal_entry_testing(self):
        entries = [
            {"amount": 10000, "description": "Adjustment", "date": "2024-01-28"},
            {"amount": 500, "description": "Office supplies purchase", "date": "2024-01-15"},
            {"amount": 9800, "description": "Misc correction", "date": "2024-01-13"},  # Saturday
        ]
        engine = JournalEntryTestingEngine()
        result = engine.test_journal_entries(entries)
        assert result["flagged_entries"] >= 2  # adjustment + weekend/misc

    def test_depreciation_straight_line(self):
        engine = DepreciationEngine()
        result = engine.calculate_depreciation(
            cost=Decimal("100000"), salvage_value=Decimal("10000"),
            useful_life_years=5, method="straight_line",
        )
        assert result["annual_depreciation"] == "18000.00"
        assert len(result["schedule"]) == 5

    def test_depreciation_verify_register(self):
        engine = DepreciationEngine()
        assets = [
            {"name": "Truck", "cost": 50000, "salvage_value": 5000, "useful_life_years": 5,
             "method": "straight_line", "periods_elapsed": 3, "client_accumulated_depreciation": 27000},
        ]
        result = engine.verify_asset_register(assets)
        assert result["assets_tested"] == 1


# ── Management ───────────────────────────────────────────────

class TestManagementEngine:
    def test_budget_vs_actual(self):
        budget = [{"category": "Revenue", "amount": 100000}, {"category": "Expense - Rent", "amount": 10000}]
        actuals = [{"category": "Revenue", "amount": 95000}, {"category": "Expense - Rent", "amount": 10500}]
        engine = VarianceAnalysisEngine()
        result = engine.budget_vs_actual(budget, actuals)
        assert len(result["lines"]) == 2
        assert result["totals"]["variance"] is not None

    def test_cost_allocation(self):
        engine = CostAllocationEngine()
        result = engine.allocate_costs(
            Decimal("100000"),
            [{"name": "Dept A", "revenue": 300000}, {"name": "Dept B", "revenue": 700000}],
            "revenue",
        )
        assert result["status"] == "complete"
        assert len(result["allocations"]) == 2
        # Should sum to total
        total_allocated = sum(Decimal(a["allocated_amount"]) for a in result["allocations"])
        assert total_allocated == Decimal("100000")

    def test_break_even(self):
        engine = BreakEvenEngine()
        result = engine.calculate_break_even(
            fixed_costs=Decimal("50000"),
            price_per_unit=Decimal("100"),
            variable_cost_per_unit=Decimal("60"),
        )
        assert result["status"] == "complete"
        assert result["break_even_units"] == "1250"
        assert result["contribution_margin"] == "40"

    def test_working_capital(self):
        engine = WorkingCapitalEngine()
        result = engine.calculate_cycle(
            revenue=Decimal("1000000"), cogs=Decimal("600000"),
            avg_receivables=Decimal("100000"), avg_payables=Decimal("50000"),
            avg_inventory=Decimal("80000"),
        )
        assert result["status"] == "complete"
        assert result["dso_days"] > 0
        assert result["cash_conversion_cycle"] > 0


# ── Insolvency ───────────────────────────────────────────────

class TestInsolvencyEngine:
    def test_solvency_solvent(self):
        engine = SolvencyTestEngine()
        result = engine.comprehensive_test(
            assets=Decimal("500000"), liabilities=Decimal("300000"),
            cash=Decimal("100000"), debts_due=[{"amount": 50000, "due_date": "2024-03-01"}],
        )
        assert result["overall_solvent"] is True
        assert result["director_warning"] is None

    def test_solvency_insolvent(self):
        engine = SolvencyTestEngine()
        result = engine.comprehensive_test(
            assets=Decimal("200000"), liabilities=Decimal("500000"),
            cash=Decimal("10000"), debts_due=[{"amount": 50000, "due_date": "2024-03-01"}],
        )
        assert result["overall_solvent"] is False
        assert result["director_warning"] is not None

    def test_creditor_waterfall(self):
        engine = CreditorWaterfallEngine()
        result = engine.calculate_waterfall(
            Decimal("100000"),
            [
                {"name": "Bank", "amount": 50000, "priority_class": "secured"},
                {"name": "Employee A", "amount": 10000, "priority_class": "employee_wages"},
                {"name": "ATO", "amount": 30000, "priority_class": "tax_authority"},
                {"name": "Supplier X", "amount": 80000, "priority_class": "unsecured"},
            ],
        )
        assert result["status"] == "complete"
        # Secured gets paid first in full
        secured = next(w for w in result["waterfall"] if w["priority"] == "secured")
        assert secured["cents_in_dollar"] == "1.00"

    def test_voidable_scanner(self):
        engine = VoidableTransactionScanner()
        result = engine.scan(
            [
                {"date": "2023-10-15", "amount": -50000, "counterparty": "Director Smith",
                 "description": "director loan repayment", "is_related_party": True},
                {"date": "2023-12-01", "amount": -5000, "counterparty": "Supplier A",
                 "description": "Payment for services"},
            ],
            insolvency_date=date(2024, 1, 1),
            jurisdiction="AU",
        )
        assert result["voidable_found"] >= 1  # director payment should be flagged


# ── Trust & Estate ───────────────────────────────────────────

class TestTrustEstateEngine:
    def test_trust_distribution(self):
        engine = TrustDistributionEngine()
        result = engine.calculate_distribution(
            {"net_income": 100000, "franked_dividends": 30000, "capital_gains": 20000,
             "interest": 10000, "rental": 30000, "unfranked_dividends": 0, "other": 10000},
            [{"name": "Beneficiary A", "share_pct": 60}, {"name": "Beneficiary B", "share_pct": 40}],
        )
        assert result["status"] == "complete"
        assert len(result["distributions"]) == 2
        total_dist = sum(Decimal(d["total_distribution"]) for d in result["distributions"])
        assert total_dist == Decimal("100000.00")

    def test_estate_cgt_main_residence(self):
        engine = EstateCGTEngine()
        result = engine.calculate_estate_cgt(
            [{"name": "Family Home", "type": "main_residence", "cost_base": 200000, "market_value_at_death": 800000}],
            "2024-06-15",
        )
        assert result["results"][0]["cgt_event"] == "exempt"
        assert result["total_taxable_gain"] == "0"


# ── Payroll ──────────────────────────────────────────────────

class TestPayrollEngine:
    def test_termination_au(self):
        engine = TerminationPayEngine()
        result = engine.calculate_termination(
            annual_salary=Decimal("80000"),
            years_of_service=Decimal("5"),
            unused_annual_leave_hours=Decimal("76"),
            is_redundancy=True,
            jurisdiction="AU",
        )
        assert result["status"] == "complete"
        assert len(result["components"]) >= 3  # notice + redundancy + leave
        assert Decimal(result["total_payout"]) > 0

    def test_leave_accrual_au(self):
        engine = LeaveAccrualEngine()
        result = engine.calculate_accrual(
            annual_salary=Decimal("80000"),
            years_of_service=Decimal("3"),
            leave_type="annual",
            jurisdiction="AU",
        )
        assert result["entitlement_hours_per_year"] == "152"
        assert Decimal(result["liability"]) > 0


# ── ESG ──────────────────────────────────────────────────────

class TestESGEngine:
    def test_carbon_calculation(self):
        engine = CarbonCalculatorEngine()
        result = engine.calculate_emissions([
            {"category": "electricity_au", "quantity": 50000, "unit": "kWh"},
            {"category": "car_petrol", "quantity": 20000, "unit": "km"},
        ])
        assert result["status"] == "complete"
        assert Decimal(result["total_tonnes_co2e"]) > 0
        assert Decimal(result["scope_2_tonnes"]) > 0  # electricity

    def test_spend_based_estimation(self):
        engine = CarbonCalculatorEngine()
        result = engine.estimate_from_spend([
            {"description": "AWS Cloud hosting", "amount": 5000},
            {"description": "Office supplies from Staples", "amount": 2000},
        ])
        assert result["status"] == "complete"
        assert result["expenses_analyzed"] == 2
        assert Decimal(result["total_estimated_kg_co2e"]) > 0

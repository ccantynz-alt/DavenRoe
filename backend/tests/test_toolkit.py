"""Tests for the Universal Toolkit.

Every calculator, validator, and utility must give correct answers.
"""

from datetime import date
from decimal import Decimal

from app.toolkit.calculators import FinancialCalculator, InvoiceCalculator, DepreciationQuickCalc, RatioCalculator
from app.toolkit.utilities import TaxIdValidator, GSTCalculator, CurrencyConverter, BusinessDateCalculator
from app.toolkit.reference import FiscalYearReference, LodgmentDueDates, ChartOfAccountsTemplates
from app.toolkit.reconciliation import ReconciliationMatcher


# ── Financial Calculators ────────────────────────────────────

class TestFinancialCalculator:
    def test_compound_interest(self):
        calc = FinancialCalculator()
        result = calc.compound_interest(Decimal("10000"), Decimal("5"), 10)
        final = Decimal(result["final_balance"])
        # $10,000 at 5% for 10 years monthly compounding ≈ $16,470
        assert Decimal("16400") < final < Decimal("16550")
        assert len(result["schedule"]) == 10

    def test_loan_amortization(self):
        calc = FinancialCalculator()
        result = calc.loan_amortization(Decimal("100000"), Decimal("6"), 30)
        payment = Decimal(result["periodic_payment"])
        # ~$599.55/month
        assert Decimal("598") < payment < Decimal("601")
        assert len(result["schedule"]) == 360

    def test_present_value(self):
        calc = FinancialCalculator()
        result = calc.present_value(Decimal("10000"), Decimal("5"), 10)
        pv = Decimal(result["present_value"])
        # PV of $10,000 in 10 years at 5% ≈ $6,139
        assert Decimal("6100") < pv < Decimal("6200")

    def test_future_value(self):
        calc = FinancialCalculator()
        result = calc.future_value(Decimal("10000"), Decimal("5"), 10)
        fv = Decimal(result["future_value"])
        # FV of $10,000 at 5% for 10 years ≈ $16,289
        assert Decimal("16200") < fv < Decimal("16400")

    def test_irr(self):
        calc = FinancialCalculator()
        result = calc.irr([Decimal("-100000"), Decimal("30000"), Decimal("40000"), Decimal("50000"), Decimal("20000")])
        irr_pct = float(result["irr_pct"])
        assert 10 < irr_pct < 20  # should be around 14-15%


class TestInvoiceCalculator:
    def test_gst_exclusive(self):
        calc = InvoiceCalculator()
        result = calc.gst_calculation(Decimal("1000"), Decimal("10"), is_inclusive=False)
        assert result["gst_amount"] == "100.00"
        assert result["inclusive"] == "1100.00"

    def test_gst_inclusive(self):
        calc = InvoiceCalculator()
        result = calc.gst_calculation(Decimal("1100"), Decimal("10"), is_inclusive=True)
        assert result["exclusive"] == "1000.00"
        assert result["gst_amount"] == "100.00"

    def test_early_payment_discount(self):
        calc = InvoiceCalculator()
        result = calc.early_payment_discount(Decimal("10000"))
        assert result["discount_amount"] == "200.00"
        assert result["pay_if_early"] == "9800.00"
        # Annualized cost of NOT taking 2/10 net 30 ≈ 36.7%
        assert result["annualized_cost_of_not_taking_pct"] > 30
        assert result["recommendation"] == "Take the discount"

    def test_late_interest(self):
        calc = InvoiceCalculator()
        result = calc.late_payment_interest(Decimal("10000"), Decimal("10"), 30)
        interest = Decimal(result["interest_charged"])
        # 10% annual on $10k for 30 days ≈ $82.19
        assert Decimal("80") < interest < Decimal("85")


class TestDepreciation:
    def test_straight_line(self):
        calc = DepreciationQuickCalc()
        result = calc.calculate(Decimal("50000"), Decimal("5000"), 5)
        assert result["annual_depreciation"] == "9000.00"
        assert result["monthly_depreciation"] == "750.00"


class TestRatios:
    def test_basic_ratios(self):
        calc = RatioCalculator()
        result = calc.calculate_all(
            current_assets=Decimal("500000"),
            current_liabilities=Decimal("250000"),
            cash=Decimal("100000"),
            inventory=Decimal("150000"),
            total_assets=Decimal("1000000"),
            total_liabilities=Decimal("400000"),
            equity=Decimal("600000"),
            revenue=Decimal("1200000"),
            net_income=Decimal("120000"),
        )
        assert "current_ratio" in result["ratios"]
        assert result["ratios"]["current_ratio"]["value"] == "2.00"
        assert "net_profit_margin" in result["ratios"]
        assert result["count"] >= 5


# ── Utilities ────────────────────────────────────────────────

class TestTaxIdValidator:
    def test_valid_abn(self):
        v = TaxIdValidator()
        # Woolworths ABN
        result = v.validate("88 000 014 675", "AU")
        assert result["valid"] is True
        assert result["type"] == "abn"

    def test_invalid_abn(self):
        v = TaxIdValidator()
        result = v.validate("12 345 678 901", "AU")
        assert result["valid"] is False

    def test_valid_ein(self):
        v = TaxIdValidator()
        result = v.validate("123456789", "US", "ein")
        assert result["valid"] is True

    def test_invalid_ein_prefix(self):
        v = TaxIdValidator()
        result = v.validate("070000000", "US", "ein")
        assert result["valid"] is False

    def test_valid_ird(self):
        v = TaxIdValidator()
        # Format check
        result = v.validate("123456789", "NZ", "ird")
        assert result["type"] == "ird"


class TestGSTCalculator:
    def test_au_gst(self):
        calc = GSTCalculator()
        result = calc.calculate(Decimal("1000"), "AU")
        assert result["tax_amount"] == "100.00"
        assert result["tax_name"] == "GST"

    def test_nz_gst(self):
        calc = GSTCalculator()
        result = calc.calculate(Decimal("1000"), "NZ")
        assert result["tax_amount"] == "150.00"

    def test_gb_vat(self):
        calc = GSTCalculator()
        result = calc.calculate(Decimal("1000"), "GB")
        assert result["tax_amount"] == "200.00"
        assert result["tax_name"] == "VAT"

    def test_us_state_tax(self):
        calc = GSTCalculator()
        result = calc.calculate(Decimal("1000"), "US", us_state="CA")
        assert Decimal(result["tax_amount"]) > 0

    def test_compare(self):
        calc = GSTCalculator()
        result = calc.compare_jurisdictions(Decimal("1000"))
        assert "AU" in result["by_jurisdiction"]
        assert "NZ" in result["by_jurisdiction"]

    def test_us_no_state(self):
        calc = GSTCalculator()
        result = calc.calculate(Decimal("1000"), "US")
        assert result["note"] == "Zero-rated or no tax applies"


class TestCurrencyConverter:
    def test_usd_to_aud(self):
        conv = CurrencyConverter()
        result = conv.convert(Decimal("1000"), "USD", "AUD")
        assert Decimal(result["to_amount"]) > Decimal("1000")

    def test_aud_to_gbp(self):
        conv = CurrencyConverter()
        result = conv.convert(Decimal("1000"), "AUD", "GBP")
        assert Decimal(result["to_amount"]) < Decimal("1000")

    def test_list_rates(self):
        conv = CurrencyConverter()
        result = conv.list_rates()
        assert "AUD" in result["rates"]
        assert len(result["rates"]) >= 10


class TestBusinessDateCalculator:
    def test_add_business_days(self):
        calc = BusinessDateCalculator()
        # Monday + 5 business days = next Monday
        result = calc.add_business_days(date(2024, 1, 8), 5, "AU")
        assert result["result_date"] == "2024-01-15"

    def test_payment_due(self):
        calc = BusinessDateCalculator()
        result = calc.payment_due_date(date(2024, 1, 1), 30, "AU")
        assert result["raw_due_date"] == "2024-01-31"

    def test_days_between(self):
        calc = BusinessDateCalculator()
        result = calc.days_between(date(2024, 1, 1), date(2024, 1, 31), "AU")
        assert result["calendar_days"] == 30
        assert result["business_days"] < 30


# ── Reference ────────────────────────────────────────────────

class TestFiscalYear:
    def test_au_fy(self):
        ref = FiscalYearReference()
        result = ref.current_fy("AU", date(2024, 10, 1))
        assert result["financial_year"] == "FY2025"
        assert result["start_date"] == "2024-07-01"

    def test_us_fy(self):
        ref = FiscalYearReference()
        result = ref.current_fy("US", date(2024, 6, 15))
        assert result["financial_year"] == "FY2024"

    def test_all_jurisdictions(self):
        ref = FiscalYearReference()
        result = ref.all_jurisdictions(date(2024, 6, 15))
        assert len(result) == 4


class TestLodgmentDueDates:
    def test_au_deadlines(self):
        ref = LodgmentDueDates()
        result = ref.upcoming("AU", date(2024, 1, 1))
        assert len(result["upcoming"]) > 0
        assert result["next_deadline"] is not None

    def test_us_deadlines(self):
        ref = LodgmentDueDates()
        result = ref.upcoming("US", date(2024, 1, 1))
        assert any("1040" in d["name"] for d in result["upcoming"])


class TestChartOfAccounts:
    def test_list_templates(self):
        coa = ChartOfAccountsTemplates()
        result = coa.list_templates()
        assert len(result["templates"]) >= 5

    def test_get_template(self):
        coa = ChartOfAccountsTemplates()
        result = coa.get_template("professional_services")
        assert result is not None
        assert result["total_accounts"] > 30

    def test_retail_template(self):
        coa = ChartOfAccountsTemplates()
        result = coa.get_template("retail")
        assert "4000-4999 Revenue" in result["sections"]

    def test_missing_template(self):
        coa = ChartOfAccountsTemplates()
        assert coa.get_template("nonexistent") is None


# ── Reconciliation ───────────────────────────────────────────

class TestReconciliation:
    def test_exact_match(self):
        matcher = ReconciliationMatcher()
        result = matcher.reconcile(
            [{"date": "2024-01-15", "amount": 500, "description": "Office rent"}],
            [{"date": "2024-01-15", "amount": 500, "description": "Office rent payment"}],
        )
        assert result["summary"]["matched"] == 1
        assert result["summary"]["unmatched_bank"] == 0

    def test_no_match(self):
        matcher = ReconciliationMatcher()
        result = matcher.reconcile(
            [{"date": "2024-01-15", "amount": 500, "description": "Rent"}],
            [{"date": "2024-01-15", "amount": 999, "description": "Rent"}],
        )
        assert result["summary"]["matched"] == 0
        assert result["summary"]["unmatched_bank"] == 1

    def test_duplicate_detection(self):
        matcher = ReconciliationMatcher()
        result = matcher.find_duplicates([
            {"date": "2024-01-15", "amount": 500, "description": "Office rent"},
            {"date": "2024-01-16", "amount": 600, "description": "Supplies"},
            {"date": "2024-01-15", "amount": 500, "description": "Office rent"},
        ])
        assert result["duplicates_found"] == 1

    def test_bank_rec_summary_reconciled(self):
        matcher = ReconciliationMatcher()
        result = matcher.bank_rec_summary(
            bank_balance=Decimal("50000"),
            ledger_balance=Decimal("52000"),
            outstanding_deposits=[{"amount": 5000}],
            outstanding_payments=[{"amount": 3000}],
        )
        assert result["reconciled"] is True
        assert result["adjusted_bank_balance"] == "52000"

    def test_bank_rec_summary_unreconciled(self):
        matcher = ReconciliationMatcher()
        result = matcher.bank_rec_summary(
            bank_balance=Decimal("50000"),
            ledger_balance=Decimal("55000"),
        )
        assert result["reconciled"] is False
        assert "UNRECONCILED" in result["status"]

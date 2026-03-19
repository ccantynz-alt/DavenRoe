"""Tests for forensic accounting engines.

These test that the forensic analysis produces correct,
reproducible results — critical for legal defensibility.
"""

import math
from decimal import Decimal

from app.forensic.engines.anomaly import AnomalyDetector
from app.forensic.engines.benfords import BenfordsAnalyzer
from app.forensic.engines.money_trail import MoneyTrailAnalyzer
from app.forensic.engines.payroll_crossref import PayrollCrossReferencer
from app.forensic.engines.vendor_verify import VendorVerifier


# ── Benford's Law ──────────────────────────────────────────────

class TestBenfords:
    def setup_method(self):
        self.analyzer = BenfordsAnalyzer()

    def test_insufficient_data(self):
        result = self.analyzer.analyze_first_digit([100, 200, 300])
        assert result["status"] == "insufficient_data"

    def test_first_digit_extraction(self):
        assert self.analyzer._first_digit("1247.50") == 1
        assert self.analyzer._first_digit("$3,892.10") == 3
        assert self.analyzer._first_digit("-500") == 5
        assert self.analyzer._first_digit("0.045") == 4

    def test_second_digit_extraction(self):
        assert self.analyzer._second_digit("1247.50") == 2
        assert self.analyzer._second_digit("3892.10") == 8
        assert self.analyzer._second_digit("0.045") == 5

    def test_benford_conforming_data(self):
        """Generate data that follows Benford's Law and verify it passes."""
        import random
        random.seed(42)
        # Log-uniform distribution naturally follows Benford's
        amounts = [10 ** (random.uniform(1, 5)) for _ in range(500)]
        result = self.analyzer.analyze_first_digit(amounts)
        assert result["status"] == "complete"
        assert result["conformity_level"] in ("close", "acceptable")
        assert result["risk_level"] == "low"

    def test_fabricated_data_detection(self):
        """Data with uniform first digits should fail Benford's."""
        # Every amount starts with 5 — clearly fabricated
        amounts = [5000 + i * 10 for i in range(200)]
        result = self.analyzer.analyze_first_digit(amounts)
        assert result["status"] == "complete"
        assert result["conformity_level"] in ("marginal", "nonconforming")

    def test_duplicate_detection(self):
        """Repeated amounts should be flagged."""
        amounts = ["1000"] * 50 + ["2000"] * 30 + [str(i * 100 + 50) for i in range(20)]
        result = self.analyzer.analyze_duplicate_amounts(amounts)
        assert result["status"] == "complete"
        assert len(result["suspicious_duplicates"]) > 0
        assert result["risk_level"] in ("medium", "high")

    def test_full_analysis_returns_all_tests(self):
        amounts = [str(1000 + i * 7.3) for i in range(200)]
        result = self.analyzer.full_analysis(amounts)
        assert "first_digit" in result
        assert "second_digit" in result
        assert "duplicates" in result


# ── Anomaly Detection ──────────────────────────────────────────

class TestAnomalyDetector:
    def setup_method(self):
        self.detector = AnomalyDetector()

    def test_amount_outlier_detection(self):
        txns = [{"amount": 100} for _ in range(50)]
        txns.append({"amount": 100000})  # massive outlier
        result = self.detector.detect_amount_outliers(txns)
        assert result["outlier_count"] >= 1
        assert any(o["amount"] == 100000 for o in result["outliers"])

    def test_round_number_bias(self):
        # All round numbers — suspicious
        amounts = [1000, 2000, 3000, 5000, 10000] * 10
        result = self.detector.detect_round_number_bias(amounts)
        assert result["status"] == "complete"
        assert result["suspicious"] is True

    def test_weekend_transactions_flagged(self):
        txns = [
            {"date": "2024-01-13", "amount": 100},  # Saturday
            {"date": "2024-01-14", "amount": 200},  # Sunday
            {"date": "2024-01-15", "amount": 300},  # Monday
        ] * 5
        result = self.detector.detect_timing_anomalies(txns)
        assert result["status"] == "complete"
        has_weekend = any(f["pattern"] == "weekend_transactions" for f in result["flags"])
        assert has_weekend

    def test_insufficient_data(self):
        result = self.detector.detect_amount_outliers([{"amount": 100}])
        assert result["status"] == "insufficient_data"


# ── Vendor Verification ────────────────────────────────────────

class TestVendorVerifier:
    def setup_method(self):
        self.verifier = VendorVerifier()

    def test_ghost_vendor_missing_tax_id(self):
        vendors = [{"name": "Ghost Corp", "tax_id": "", "address": "PO Box 123", "phone": "", "email": ""}]
        result = self.verifier.detect_ghost_vendors(vendors)
        assert result["flagged_vendors"] == 1
        checks = [f["check"] for flag in result["flags"] for f in flag["flags"]]
        assert "missing_tax_id" in checks
        assert "po_box_only" in checks
        assert "no_contact" in checks

    def test_employee_vendor_overlap(self):
        vendors = [{"name": "J. Smith", "address": "42 Elm Street"}]
        employees = [{"name": "J. Smith", "address": "42 Elm Street"}]
        result = self.verifier.detect_ghost_vendors(vendors, employees)
        assert result["risk_level"] == "critical"
        checks = [f["check"] for flag in result["flags"] for f in flag["flags"]]
        assert "employee_name_match" in checks
        assert "employee_address_match" in checks

    def test_clean_vendor_not_flagged(self):
        vendors = [{"name": "Acme", "tax_id": "ABN123", "address": "100 Main Street", "phone": "555-1234", "email": "a@b.com"}]
        result = self.verifier.detect_ghost_vendors(vendors)
        assert result["flagged_vendors"] == 0
        assert result["risk_level"] == "low"

    def test_vendor_concentration(self):
        txns = [{"vendor": "BigVendor", "amount": 50000}] + [{"vendor": f"Small{i}", "amount": 100} for i in range(10)]
        result = self.verifier.analyze_vendor_concentration(txns)
        assert result["status"] == "complete"
        assert result["top_vendors"][0]["vendor"] == "BigVendor"
        assert len(result["concentration_flags"]) > 0

    def test_payment_splitting_detection(self):
        txns = [
            {"vendor": "SplitCo", "date": "2024-01-15", "amount": 9500},
            {"vendor": "SplitCo", "date": "2024-01-15", "amount": 9800},
        ]
        result = self.verifier.detect_payment_splitting(txns)
        assert len(result["split_flags"]) > 0
        assert result["risk_level"] == "high"


# ── Payroll Cross-Reference ────────────────────────────────────

class TestPayrollCrossRef:
    def setup_method(self):
        self.xref = PayrollCrossReferencer()

    def test_payroll_tax_mismatch(self):
        payroll = [{"employee_id": "E1", "gross_pay": 10000, "tax_withheld": 3000, "period": "2024-01"}]
        filings = [{"period": "2024-01", "total_gross": 8000, "total_tax_withheld": 2000}]
        result = self.xref.cross_reference_payroll_vs_tax(payroll, filings)
        assert result["discrepancy_count"] > 0
        assert any(d["type"] == "gross_pay_mismatch" for d in result["discrepancies"])

    def test_missing_filing(self):
        payroll = [{"employee_id": "E1", "gross_pay": 10000, "tax_withheld": 3000, "period": "2024-03"}]
        filings = []
        result = self.xref.cross_reference_payroll_vs_tax(payroll, filings)
        assert any(d["type"] == "missing_filing" for d in result["discrepancies"])

    def test_ghost_employee_shared_bank(self):
        payroll = [
            {"employee_id": "E1", "name": "Alice", "gross_pay": 5000, "bank_account": "ACC-123", "period": "2024-01"},
            {"employee_id": "E2", "name": "Ghost", "gross_pay": 5000, "bank_account": "ACC-123", "period": "2024-01"},
        ]
        result = self.xref.detect_ghost_employees(payroll)
        assert result["flagged_employees"] >= 1
        assert result["risk_level"] == "critical"

    def test_clean_payroll(self):
        payroll = [
            {"employee_id": "E1", "name": "Alice", "gross_pay": 5000, "tax_withheld": 1500, "tax_id": "TFN123", "period": "2024-01"},
            {"employee_id": "E1", "name": "Alice", "gross_pay": 5200, "tax_withheld": 1560, "tax_id": "TFN123", "period": "2024-02"},
        ]
        filings = [
            {"period": "2024-01", "total_gross": 5000, "total_tax_withheld": 1500},
            {"period": "2024-02", "total_gross": 5200, "total_tax_withheld": 1560},
        ]
        result = self.xref.cross_reference_payroll_vs_tax(payroll, filings)
        assert result["risk_level"] == "low"


# ── Money Trail ────────────────────────────────────────────────

class TestMoneyTrail:
    def setup_method(self):
        self.trail = MoneyTrailAnalyzer()

    def test_revenue_concentration(self):
        txns = [{"amount": 50000, "counterparty": "BigClient", "date": "2024-01-15"}]
        txns += [{"amount": 100, "counterparty": f"Small{i}", "date": "2024-01-20"} for i in range(5)]
        result = self.trail.analyze_cash_flow_pattern(txns)
        has_concentration = any(f["pattern"] == "revenue_concentration" for f in result["flags"])
        assert has_concentration

    def test_circular_transaction_detection(self):
        txns = [
            {"amount": 10000, "counterparty": "ShellCo", "date": "2024-01-15"},
            {"amount": -9800, "counterparty": "ShellCo", "date": "2024-01-20"},
        ]
        result = self.trail.analyze_cash_flow_pattern(txns)
        has_circular = any(f["pattern"] == "circular_transactions" for f in result["flags"])
        assert has_circular

    def test_funds_flow_map(self):
        txns = [
            {"amount": 5000, "counterparty": "Client A"},
            {"amount": -2000, "counterparty": "Vendor B"},
        ]
        result = self.trail.generate_funds_flow_map(txns)
        assert result["total_nodes"] == 3  # Target + Client A + Vendor B
        assert result["total_edges"] == 2

"""Tests for the deterministic tax engine.

Tax math must be 100% correct — no tolerance for errors.
"""

from decimal import Decimal

from app.tax_engine.calculator import TaxCalculator
from app.tax_engine.registry import TaxJurisdictionRegistry
from app.tax_engine.treaty_engine import TreatyEngine


def test_au_gst():
    calc = TaxCalculator()
    result = calc.calculate_gst("AU", Decimal("1000"))
    assert result["tax_rate"] == "0.10"
    assert result["tax_amount"] == "100.00"
    assert result["gross_amount"] == "1100.00"
    assert result["applicable"] is True


def test_nz_gst():
    calc = TaxCalculator()
    result = calc.calculate_gst("NZ", Decimal("1000"))
    assert result["tax_rate"] == "0.15"
    assert result["tax_amount"] == "150.00"
    assert result["gross_amount"] == "1150.00"


def test_gb_vat():
    calc = TaxCalculator()
    result = calc.calculate_gst("GB", Decimal("1000"))
    assert result["tax_type"] == "vat"
    assert result["tax_rate"] == "0.20"
    assert result["tax_amount"] == "200.00"


def test_us_no_gst():
    calc = TaxCalculator()
    result = calc.calculate_gst("US", Decimal("1000"))
    assert result["applicable"] is False


def test_us_corporate_tax():
    calc = TaxCalculator()
    result = calc.calculate_corporate_tax("US", Decimal("100000"))
    assert result["tax_rate"] == "0.21"
    assert result["tax_amount"] == "21000.00"


def test_au_corporate_tax():
    calc = TaxCalculator()
    result = calc.calculate_corporate_tax("AU", Decimal("100000"), entity_type="company")
    assert result["tax_rate"] == "0.30"
    assert result["tax_amount"] == "30000.00"


def test_nz_corporate_tax():
    calc = TaxCalculator()
    result = calc.calculate_corporate_tax("NZ", Decimal("100000"))
    assert result["tax_rate"] == "0.28"
    assert result["tax_amount"] == "28000.00"


def test_treaty_us_nz_royalties():
    """US company pays NZ contractor royalties — treaty WHT should apply."""
    calc = TaxCalculator()
    result = calc.calculate_cross_border_wht(
        gross_amount=Decimal("10000"),
        payer_country="US",
        payee_country="NZ",
        income_type="royalties",
    )
    assert result["treaty_applied"] is True
    assert result["wht_rate"] == "0.10"
    assert result["wht_amount"] == "1000.00"
    assert result["net_amount"] == "9000.00"


def test_treaty_us_au_services():
    """US company pays AU contractor for services — treaty rate is 0%."""
    calc = TaxCalculator()
    result = calc.calculate_cross_border_wht(
        gross_amount=Decimal("50000"),
        payer_country="US",
        payee_country="AU",
        income_type="services",
    )
    assert result["treaty_applied"] is True
    assert result["wht_rate"] == "0"
    assert result["wht_amount"] == "0.00"
    assert result["net_amount"] == "50000.00"


def test_treaty_au_nz_dividends():
    """AU company pays NZ shareholder dividends."""
    calc = TaxCalculator()
    result = calc.calculate_cross_border_wht(
        gross_amount=Decimal("20000"),
        payer_country="AU",
        payee_country="NZ",
        income_type="dividends",
    )
    assert result["wht_rate"] == "0.15"
    assert result["wht_amount"] == "3000.00"


def test_treaty_us_gb_interest():
    """US pays GB interest — treaty rate is 0%."""
    calc = TaxCalculator()
    result = calc.calculate_cross_border_wht(
        gross_amount=Decimal("5000"),
        payer_country="US",
        payee_country="GB",
        income_type="interest",
    )
    assert result["wht_rate"] == "0"
    assert result["wht_amount"] == "0.00"


def test_all_treaties_loaded():
    engine = TreatyEngine()
    treaties = engine.list_treaties()
    assert len(treaties) == 6  # US-AU, US-NZ, US-GB, AU-NZ, AU-GB, NZ-GB


def test_bidirectional_treaty_lookup():
    engine = TreatyEngine()
    # Should work both ways
    assert engine.get_treaty("US", "NZ") is not None
    assert engine.get_treaty("NZ", "US") is not None


def test_full_transaction_analysis_cross_border():
    calc = TaxCalculator()
    result = calc.analyze_transaction_tax(
        amount=Decimal("10000"),
        source_jurisdiction="AU",
        target_jurisdiction="NZ",
        income_type="services",
    )
    assert result["is_cross_border"] is True
    assert len(result["taxes"]) >= 1  # At least GST + WHT


def test_registry_all_jurisdictions():
    registry = TaxJurisdictionRegistry()
    for code in ["AU", "NZ", "US", "GB"]:
        rates = registry.get_all_rates(code)
        assert len(rates) > 0, f"No rates loaded for {code}"

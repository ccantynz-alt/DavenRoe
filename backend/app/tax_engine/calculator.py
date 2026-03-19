"""Unified Tax Calculator.

Combines the jurisdiction registry and treaty engine to compute
tax on any transaction — domestic or cross-border.
"""

from datetime import date
from decimal import Decimal

from app.tax_engine.registry import TaxJurisdictionRegistry
from app.tax_engine.treaty_engine import TreatyEngine


class TaxCalculator:
    """High-level tax calculation interface.

    Usage:
        calc = TaxCalculator()

        # Domestic GST
        result = calc.calculate_gst("AU", Decimal("1000"))

        # Cross-border WHT
        result = calc.calculate_cross_border_wht(
            gross_amount=Decimal("10000"),
            payer_country="US",
            payee_country="NZ",
            income_type="royalties",
        )

        # Income tax
        result = calc.calculate_income_tax("AU", Decimal("120000"))
    """

    def __init__(self):
        self.registry = TaxJurisdictionRegistry()
        self.treaties = TreatyEngine()

    def calculate_gst(
        self, jurisdiction: str, net_amount: Decimal,
        as_of: date | None = None,
    ) -> dict:
        """Calculate GST/VAT on a domestic transaction."""
        # Map jurisdiction to the correct tax type
        gst_type = "vat" if jurisdiction == "GB" else "gst"
        entry = self.registry.get_rate(jurisdiction, gst_type, as_of)

        if not entry or entry.rate is None:
            return {
                "jurisdiction": jurisdiction,
                "tax_type": gst_type,
                "net_amount": str(net_amount),
                "tax_rate": "0",
                "tax_amount": "0",
                "gross_amount": str(net_amount),
                "applicable": False,
                "note": f"No {gst_type.upper()} applicable in {jurisdiction}",
            }

        tax_amount = (net_amount * entry.rate).quantize(Decimal("0.01"))
        return {
            "jurisdiction": jurisdiction,
            "tax_type": gst_type,
            "net_amount": str(net_amount),
            "tax_rate": str(entry.rate),
            "tax_amount": str(tax_amount),
            "gross_amount": str(net_amount + tax_amount),
            "applicable": True,
            "legislation": entry.legislation,
        }

    def calculate_income_tax(
        self, jurisdiction: str, taxable_income: Decimal,
        applies_to: str = "resident", as_of: date | None = None,
    ) -> dict:
        """Calculate progressive income tax."""
        tax = self.registry.calculate_bracketed_tax(
            jurisdiction, taxable_income, applies_to, as_of,
        )
        entry = self.registry.get_rate(jurisdiction, "income_tax", as_of, applies_to)

        return {
            "jurisdiction": jurisdiction,
            "taxable_income": str(taxable_income),
            "tax_amount": str(tax),
            "effective_rate": str((tax / taxable_income).quantize(Decimal("0.0001"))) if taxable_income else "0",
            "applies_to": applies_to,
            "legislation": entry.legislation if entry else None,
        }

    def calculate_corporate_tax(
        self, jurisdiction: str, taxable_income: Decimal,
        entity_type: str = "company", as_of: date | None = None,
    ) -> dict:
        """Calculate flat corporate tax."""
        entry = self.registry.get_rate(jurisdiction, "corporate_tax", as_of, entity_type)
        if not entry or entry.rate is None:
            return {"jurisdiction": jurisdiction, "tax_amount": "0", "applicable": False}

        tax = (taxable_income * entry.rate).quantize(Decimal("0.01"))
        return {
            "jurisdiction": jurisdiction,
            "taxable_income": str(taxable_income),
            "tax_rate": str(entry.rate),
            "tax_amount": str(tax),
            "entity_type": entity_type,
            "legislation": entry.legislation,
        }

    def calculate_cross_border_wht(
        self, gross_amount: Decimal,
        payer_country: str, payee_country: str,
        income_type: str = "services", as_of: date | None = None,
    ) -> dict:
        """Calculate WHT on a cross-border payment, applying treaty if available.

        This is the key differentiator — automatic treaty application.
        """
        # Get domestic WHT rate
        domestic_entry = self.registry.get_rate(
            payer_country, "withholding_tax", as_of, "non_resident",
        )
        domestic_rate = domestic_entry.rate if domestic_entry else None

        # Calculate with treaty engine
        result = self.treaties.calculate_withholding(
            gross_amount, payer_country, payee_country,
            income_type, domestic_rate,
        )

        result["as_of"] = str(as_of or date.today())
        return result

    def analyze_transaction_tax(
        self, amount: Decimal,
        source_jurisdiction: str,
        target_jurisdiction: str | None = None,
        transaction_type: str = "expense",
        income_type: str = "services",
        as_of: date | None = None,
    ) -> dict:
        """Full tax analysis for a transaction.

        For domestic: calculates GST/VAT.
        For cross-border: calculates WHT with treaty, plus GST if applicable.
        """
        is_cross_border = target_jurisdiction and target_jurisdiction != source_jurisdiction

        result = {
            "amount": str(amount),
            "source_jurisdiction": source_jurisdiction,
            "target_jurisdiction": target_jurisdiction,
            "is_cross_border": is_cross_border,
            "taxes": [],
        }

        # GST/VAT on the source side
        gst = self.calculate_gst(source_jurisdiction, amount, as_of)
        if gst["applicable"]:
            result["taxes"].append(gst)

        # Cross-border WHT
        if is_cross_border:
            wht = self.calculate_cross_border_wht(
                amount, source_jurisdiction, target_jurisdiction,
                income_type, as_of,
            )
            result["taxes"].append({
                "tax_type": "withholding_tax",
                **wht,
            })

        # Compute totals
        total_tax = sum(Decimal(t.get("tax_amount", "0")) for t in result["taxes"])
        result["total_tax"] = str(total_tax)
        result["net_after_tax"] = str(amount - total_tax)

        return result

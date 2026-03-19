"""Tax Engine API routes.

Exposes the deterministic tax engine via REST endpoints.
"""

from fastapi import APIRouter

from app.schemas.tax import (
    CrossBorderWHTRequest,
    GSTCalculationRequest,
    IncomeTaxRequest,
    TransactionTaxAnalysisRequest,
)
from app.tax_engine import TaxCalculator, TreatyEngine

router = APIRouter(prefix="/tax", tags=["Tax Engine"])

calculator = TaxCalculator()
treaties = TreatyEngine()


@router.post("/gst")
async def calculate_gst(req: GSTCalculationRequest):
    """Calculate GST/VAT for a domestic transaction."""
    return calculator.calculate_gst(req.jurisdiction, req.net_amount)


@router.post("/income-tax")
async def calculate_income_tax(req: IncomeTaxRequest):
    """Calculate progressive income tax for a jurisdiction."""
    return calculator.calculate_income_tax(
        req.jurisdiction, req.taxable_income, req.applies_to,
    )


@router.post("/corporate-tax")
async def calculate_corporate_tax(req: IncomeTaxRequest):
    """Calculate corporate tax for a jurisdiction."""
    return calculator.calculate_corporate_tax(
        req.jurisdiction, req.taxable_income,
    )


@router.post("/withholding")
async def calculate_withholding(req: CrossBorderWHTRequest):
    """Calculate cross-border withholding tax with treaty application."""
    return calculator.calculate_cross_border_wht(
        req.gross_amount, req.payer_country, req.payee_country, req.income_type,
    )


@router.post("/analyze")
async def analyze_transaction_tax(req: TransactionTaxAnalysisRequest):
    """Full tax analysis for a transaction (domestic or cross-border)."""
    return calculator.analyze_transaction_tax(
        req.amount, req.source_jurisdiction, req.target_jurisdiction,
        req.transaction_type, req.income_type,
    )


@router.get("/treaties")
async def list_treaties():
    """List all loaded double tax agreements."""
    return {"treaties": treaties.list_treaties()}


@router.get("/treaties/{country_a}/{country_b}")
async def get_treaty(country_a: str, country_b: str):
    """Get treaty details between two countries."""
    treaty = treaties.get_treaty(country_a.upper(), country_b.upper())
    if not treaty:
        return {"error": f"No treaty found between {country_a} and {country_b}"}
    return {
        "countries": f"{treaty.country_a}-{treaty.country_b}",
        "wht_dividends": str(treaty.wht_dividends),
        "wht_interest": str(treaty.wht_interest),
        "wht_royalties": str(treaty.wht_royalties),
        "wht_services": str(treaty.wht_services),
        "pe_threshold_days": treaty.pe_threshold_days,
        "source": treaty.source,
    }


@router.get("/rates/{jurisdiction}")
async def get_jurisdiction_rates(jurisdiction: str):
    """Get all tax rates for a jurisdiction."""
    rates = calculator.registry.get_all_rates(jurisdiction.upper())
    return {
        "jurisdiction": jurisdiction.upper(),
        "rates": [
            {
                "tax_type": r.tax_type,
                "rate": str(r.rate) if r.rate else "bracketed",
                "applies_to": r.applies_to,
                "effective_from": str(r.effective_from),
                "legislation": r.legislation,
            }
            for r in rates
        ],
    }

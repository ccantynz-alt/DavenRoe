"""Forensic Accounting API routes.

Exposes all forensic engines individually AND as a combined
"90-minute Financial Health Audit" endpoint.
"""

from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user
from app.forensic.engines.anomaly import AnomalyDetector
from app.forensic.engines.benfords import BenfordsAnalyzer
from app.forensic.engines.money_trail import MoneyTrailAnalyzer
from app.forensic.engines.payroll_crossref import PayrollCrossReferencer
from app.forensic.engines.vendor_verify import VendorVerifier
from app.forensic.agents.due_diligence import DueDiligenceAgent
from app.models.user import User
from app.schemas.forensic import (
    AnomalyScanRequest,
    BenfordsRequest,
    FullDueDiligenceRequest,
    PayrollCrossRefRequest,
    VendorVerificationRequest,
)

router = APIRouter(prefix="/forensic", tags=["Forensic Accounting"])

benfords = BenfordsAnalyzer()
anomaly = AnomalyDetector()
vendor_verifier = VendorVerifier()
payroll_xref = PayrollCrossReferencer()
money_trail = MoneyTrailAnalyzer()


# ── Individual Engines ───────────────────────────────────────

@router.post("/benfords")
async def run_benfords_analysis(req: BenfordsRequest, user: User = Depends(get_current_user)):
    """Run Benford's Law analysis on a set of financial amounts.

    Returns first-digit, second-digit, and duplicate analysis
    with chi-squared test and MAD conformity scoring.
    """
    return benfords.full_analysis(req.amounts)


@router.post("/anomalies")
async def run_anomaly_scan(req: AnomalyScanRequest, user: User = Depends(get_current_user)):
    """Run full anomaly detection: outliers, timing patterns, round numbers."""
    return anomaly.full_anomaly_scan(req.transactions)


@router.post("/vendors/verify")
async def verify_vendors(req: VendorVerificationRequest, user: User = Depends(get_current_user)):
    """Cross-reference vendors for ghost vendors, concentration, and splitting."""
    results = {}

    if req.vendors:
        results["ghost_vendors"] = vendor_verifier.detect_ghost_vendors(
            req.vendors, req.employees,
        )

    if req.transactions:
        results["concentration"] = vendor_verifier.analyze_vendor_concentration(
            req.transactions,
        )
        results["payment_splitting"] = vendor_verifier.detect_payment_splitting(
            req.transactions,
        )

    return results


@router.post("/payroll/cross-reference")
async def cross_reference_payroll(req: PayrollCrossRefRequest, user: User = Depends(get_current_user)):
    """Cross-reference payroll records against tax filings."""
    results = {}

    if req.payroll_records and req.tax_filings:
        results["payroll_vs_tax"] = payroll_xref.cross_reference_payroll_vs_tax(
            req.payroll_records, req.tax_filings,
        )

    if req.payroll_records:
        results["ghost_employees"] = payroll_xref.detect_ghost_employees(
            req.payroll_records,
        )

    return results


@router.post("/money-trail")
async def analyze_money_trail(req: AnomalyScanRequest, user: User = Depends(get_current_user)):
    """Analyze cash flow patterns and generate funds flow map."""
    return {
        "cash_flow": money_trail.analyze_cash_flow_pattern(req.transactions),
        "funds_flow_map": money_trail.generate_funds_flow_map(req.transactions),
    }


# ── Full Due Diligence Audit ────────────────────────────────

@router.post("/audit")
async def run_full_due_diligence(req: FullDueDiligenceRequest, user: User = Depends(get_current_user)):
    """Run the complete 90-minute Financial Health Audit.

    Ingests all available data, runs every forensic engine, aggregates
    findings, calculates risk scores, and generates an AI-written report.

    This is the $2,000 product that replaces $50,000 of manual work.
    """
    agent = DueDiligenceAgent()
    return await agent.run_full_audit(req.model_dump())

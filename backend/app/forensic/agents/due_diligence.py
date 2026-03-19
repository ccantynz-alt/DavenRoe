"""M&A Due Diligence AI Agent.

Orchestrates all forensic engines into a single "90-minute Financial Health Audit."
Ingests raw financial data, runs every analysis, and produces a complete report.
"""

import json
from datetime import datetime

import anthropic

from app.core.config import get_settings
from app.forensic.engines.anomaly import AnomalyDetector
from app.forensic.engines.benfords import BenfordsAnalyzer
from app.forensic.engines.money_trail import MoneyTrailAnalyzer
from app.forensic.engines.payroll_crossref import PayrollCrossReferencer
from app.forensic.engines.vendor_verify import VendorVerifier


REPORT_SYSTEM_PROMPT = """You are a senior forensic accountant AI generating an M&A due diligence report.

You are writing for a potential acquirer's board of directors. The report must be:
1. Professional and precise — this is a legal document
2. Evidence-based — every claim links to a specific finding
3. Actionable — clear recommendations for each risk
4. Balanced — note both red flags AND clean areas

Structure your report as:
1. Executive Summary (2-3 paragraphs)
2. Overall Risk Rating (Low/Medium/High/Critical with justification)
3. Key Findings (numbered, severity-tagged)
4. Financial Health Indicators
5. Recommendations (Go/No-Go/Conditional with specific conditions)

Use markdown formatting. Be specific with dollar amounts and percentages."""


class DueDiligenceAgent:
    """Orchestrates a complete M&A due diligence analysis.

    Input: Raw financial data (bank statements, payroll, tax filings, vendor list)
    Output: Complete forensic analysis + AI-generated report

    What takes a human team weeks, this does in minutes.
    """

    def __init__(self):
        self.benfords = BenfordsAnalyzer()
        self.anomaly = AnomalyDetector()
        self.vendor = VendorVerifier()
        self.payroll = PayrollCrossReferencer()
        self.money_trail = MoneyTrailAnalyzer()

        settings = get_settings()
        self.client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        self.model = settings.anthropic_model

    async def run_full_audit(self, data: dict) -> dict:
        """Run the complete 90-minute Financial Health Audit.

        Args:
            data: {
                "target_name": "Acme Corp",
                "transactions": [{date, amount, description, vendor, ...}],
                "payroll_records": [{employee_id, name, gross_pay, tax_withheld, period}],
                "tax_filings": [{period, total_gross, total_tax_withheld}],
                "vendors": [{name, tax_id, address, phone, email}],
                "employees": [{name, address, employee_id}],
            }
        """
        target_name = data.get("target_name", "Target Company")
        transactions = data.get("transactions", [])
        payroll = data.get("payroll_records", [])
        tax_filings = data.get("tax_filings", [])
        vendors = data.get("vendors", [])
        employees = data.get("employees", [])

        # ── Run all engines ──────────────────────────────────

        results = {"target": target_name, "timestamp": datetime.utcnow().isoformat(), "engines": {}}

        # 1. Benford's Law Analysis
        amounts = [t.get("amount") for t in transactions if t.get("amount")]
        if amounts:
            results["engines"]["benfords"] = self.benfords.full_analysis(amounts)

        # 2. Anomaly Detection
        if transactions:
            results["engines"]["anomalies"] = self.anomaly.full_anomaly_scan(transactions)

        # 3. Vendor Verification
        if transactions:
            results["engines"]["vendor_concentration"] = self.vendor.analyze_vendor_concentration(transactions)
        if vendors:
            results["engines"]["ghost_vendors"] = self.vendor.detect_ghost_vendors(vendors, employees)
        if transactions:
            results["engines"]["payment_splitting"] = self.vendor.detect_payment_splitting(transactions)

        # 4. Payroll Cross-Reference
        if payroll and tax_filings:
            results["engines"]["payroll_vs_tax"] = self.payroll.cross_reference_payroll_vs_tax(payroll, tax_filings)
        if payroll:
            results["engines"]["ghost_employees"] = self.payroll.detect_ghost_employees(payroll)

        # 5. Money Trail
        if transactions:
            results["engines"]["cash_flow"] = self.money_trail.analyze_cash_flow_pattern(transactions)
            results["engines"]["funds_flow_map"] = self.money_trail.generate_funds_flow_map(transactions)

        # ── Aggregate findings ───────────────────────────────

        findings = self._extract_findings(results["engines"])
        results["findings_summary"] = {
            "total": len(findings),
            "critical": sum(1 for f in findings if f["severity"] == "critical"),
            "high": sum(1 for f in findings if f["severity"] == "high"),
            "medium": sum(1 for f in findings if f["severity"] == "medium"),
            "low": sum(1 for f in findings if f["severity"] == "low"),
            "findings": findings,
        }

        # Overall risk score (0-100)
        results["overall_risk_score"] = self._calculate_overall_risk(findings)

        # ── Generate AI Report ───────────────────────────────

        results["report"] = await self._generate_report(results)

        return results

    def _extract_findings(self, engines: dict) -> list[dict]:
        """Extract all flagged findings from engine results into a flat list."""
        findings = []
        finding_num = 1

        # Benford's findings
        benfords = engines.get("benfords", {})
        first_digit = benfords.get("first_digit", {})
        if first_digit.get("conformity_level") in ("marginal", "nonconforming"):
            findings.append({
                "number": finding_num,
                "category": "benfords_violation",
                "engine": "benfords",
                "severity": "high" if first_digit.get("conformity_level") == "nonconforming" else "medium",
                "title": "Benford's Law Violation — First Digit Distribution",
                "detail": first_digit.get("summary", ""),
            })
            finding_num += 1

        # Anomaly findings
        anomalies = engines.get("anomalies", {})
        outliers = anomalies.get("amount_outliers", {})
        if outliers.get("outlier_count", 0) > 0:
            findings.append({
                "number": finding_num,
                "category": "amount_outlier",
                "engine": "anomaly_detector",
                "severity": "high" if outliers["outlier_count"] > 5 else "medium",
                "title": f"{outliers['outlier_count']} Statistical Outlier Transactions Detected",
                "detail": f"{outliers['outlier_pct']}% of transactions are statistical outliers",
            })
            finding_num += 1

        timing = anomalies.get("timing_anomalies", {})
        for flag in timing.get("flags", []):
            findings.append({
                "number": finding_num,
                "category": "timing_anomaly",
                "engine": "anomaly_detector",
                "severity": flag.get("severity", "medium"),
                "title": f"Timing Anomaly: {flag['pattern'].replace('_', ' ').title()}",
                "detail": flag.get("detail", ""),
            })
            finding_num += 1

        # Vendor findings
        for key in ("ghost_vendors", "vendor_concentration", "payment_splitting"):
            engine_data = engines.get(key, {})
            if engine_data.get("risk_level") in ("high", "critical"):
                flags = engine_data.get("flags", engine_data.get("concentration_flags", engine_data.get("split_flags", [])))
                for flag in (flags[:5] if isinstance(flags, list) else []):
                    findings.append({
                        "number": finding_num,
                        "category": key,
                        "engine": "vendor_verifier",
                        "severity": flag.get("severity", flag.get("overall_risk", "medium")),
                        "title": f"Vendor Alert: {flag.get('vendor', flag.get('reason', key))}",
                        "detail": flag.get("reason", flag.get("detail", str(flag.get("flags", "")))),
                    })
                    finding_num += 1

        # Payroll findings
        payroll = engines.get("payroll_vs_tax", {})
        for disc in payroll.get("discrepancies", []):
            findings.append({
                "number": finding_num,
                "category": "payroll_mismatch",
                "engine": "payroll_crossref",
                "severity": disc.get("severity", "high"),
                "title": f"Payroll Discrepancy: {disc['type'].replace('_', ' ').title()}",
                "detail": disc.get("detail", ""),
            })
            finding_num += 1

        ghost_emp = engines.get("ghost_employees", {})
        for flag in ghost_emp.get("flags", []):
            findings.append({
                "number": finding_num,
                "category": "ghost_employee",
                "engine": "payroll_crossref",
                "severity": flag.get("overall_risk", "high"),
                "title": f"Potential Ghost Employee: {flag.get('name', 'Unknown')}",
                "detail": "; ".join(f.get("detail", "") for f in flag.get("flags", [])),
            })
            finding_num += 1

        # Cash flow findings
        cash_flow = engines.get("cash_flow", {})
        for flag in cash_flow.get("flags", []):
            findings.append({
                "number": finding_num,
                "category": flag.get("pattern", "cash_flow_anomaly"),
                "engine": "money_trail",
                "severity": flag.get("severity", "medium"),
                "title": f"Cash Flow Alert: {flag['pattern'].replace('_', ' ').title()}",
                "detail": flag.get("detail", ""),
            })
            finding_num += 1

        return findings

    def _calculate_overall_risk(self, findings: list[dict]) -> int:
        """Calculate 0-100 risk score from findings."""
        if not findings:
            return 5  # minimal risk, not zero (we can't prove perfection)

        severity_weights = {"critical": 25, "high": 15, "medium": 8, "low": 3}
        raw_score = sum(severity_weights.get(f["severity"], 5) for f in findings)

        # Cap at 100
        return min(100, raw_score)

    async def _generate_report(self, results: dict) -> dict:
        """Use Claude to generate a professional due diligence report."""
        try:
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=4000,
                system=REPORT_SYSTEM_PROMPT,
                messages=[{
                    "role": "user",
                    "content": f"""Generate a forensic due diligence report for the acquisition of {results['target']}.

Analysis results:
{json.dumps(results.get('findings_summary', {}), indent=2, default=str)}

Overall risk score: {results.get('overall_risk_score', 'N/A')}/100

Engine details:
{json.dumps({k: v.get('risk_level', v.get('status', 'N/A')) if isinstance(v, dict) else 'N/A' for k, v in results.get('engines', {}).items()}, indent=2)}
""",
                }],
            )
            return {
                "content": response.content[0].text,
                "ai_generated": True,
            }
        except Exception as e:
            return {
                "content": f"Report generation failed: {str(e)}. Raw findings are available in the engine results.",
                "ai_generated": False,
            }

"""Continuous Compliance Monitor Agent.

Shifts from "file and hope" to real-time regulatory monitoring.
Watches for deadlines, regulatory changes, and compliance gaps
across all jurisdictions an entity operates in.

This agent never sleeps — it's always watching.
"""

import json
from datetime import date, timedelta
from decimal import Decimal
from enum import Enum

import anthropic

from app.core.config import get_settings


class ComplianceStatus(str, Enum):
    COMPLIANT = "compliant"
    AT_RISK = "at_risk"
    OVERDUE = "overdue"
    ACTION_REQUIRED = "action_required"
    NOT_APPLICABLE = "not_applicable"


class ObligationFrequency(str, Enum):
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ANNUALLY = "annually"
    AD_HOC = "ad_hoc"


COMPLIANCE_PROMPT = """You are the Compliance Monitor AI for Astra, an autonomous accounting platform.

You monitor regulatory compliance across multiple jurisdictions (US, AU, NZ, GB).
Analyze the entity's compliance status and generate actionable alerts.

Guidelines:
1. Flag any overdue or at-risk obligations immediately
2. Provide specific filing deadlines with buffer time recommendations
3. Cross-reference between jurisdictions for entities with multi-country obligations
4. Consider treaty implications for cross-border entities
5. Recommend preparation timelines (e.g., "start preparing BAS 2 weeks before due date")

Respond in JSON format:
{
  "overall_status": "compliant/at_risk/overdue",
  "compliance_score": 95,
  "critical_alerts": [{"obligation": "...", "jurisdiction": "...", "due_date": "...", "days_remaining": 0, "action": "..."}],
  "upcoming_deadlines": [{"obligation": "...", "jurisdiction": "...", "due_date": "...", "preparation_start": "...", "status": "on_track/needs_attention/overdue"}],
  "jurisdiction_status": {"US": "compliant", "AU": "at_risk"},
  "recommendations": ["..."],
  "narrative": "Plain-English compliance summary"
}"""


# Comprehensive obligation registry by jurisdiction
OBLIGATION_REGISTRY = {
    "US": [
        {
            "name": "Federal Income Tax Return (Form 1040/1120)",
            "frequency": ObligationFrequency.ANNUALLY,
            "due_month": 4, "due_day": 15,
            "description": "Annual federal tax return filing",
            "preparation_days": 60,
            "penalty_description": "5% of unpaid tax per month, max 25%",
        },
        {
            "name": "Quarterly Estimated Tax (Form 1040-ES)",
            "frequency": ObligationFrequency.QUARTERLY,
            "due_dates": [(4, 15), (6, 15), (9, 15), (1, 15)],
            "description": "Quarterly estimated tax payments",
            "preparation_days": 14,
            "penalty_description": "Underpayment penalty on shortfall",
        },
        {
            "name": "Payroll Tax (Form 941)",
            "frequency": ObligationFrequency.QUARTERLY,
            "due_dates": [(4, 30), (7, 31), (10, 31), (1, 31)],
            "description": "Quarterly employer payroll tax return",
            "preparation_days": 14,
            "penalty_description": "Failure-to-file and failure-to-pay penalties",
        },
        {
            "name": "W-2/1099 Reporting",
            "frequency": ObligationFrequency.ANNUALLY,
            "due_month": 1, "due_day": 31,
            "description": "Annual information returns for employees and contractors",
            "preparation_days": 30,
            "penalty_description": "$60-$310 per form depending on lateness",
        },
        {
            "name": "Sales Tax Return",
            "frequency": ObligationFrequency.MONTHLY,
            "due_day": 20,
            "description": "State sales tax filing (varies by state)",
            "preparation_days": 7,
            "penalty_description": "Varies by state — typically 5-25% penalty",
        },
    ],
    "AU": [
        {
            "name": "Business Activity Statement (BAS)",
            "frequency": ObligationFrequency.QUARTERLY,
            "due_dates": [(2, 28), (4, 28), (7, 28), (10, 28)],
            "description": "GST, PAYG withholding, PAYG instalments",
            "preparation_days": 21,
            "penalty_description": "ATO failure-to-lodge penalty: 1 penalty unit per 28-day period",
        },
        {
            "name": "Company Tax Return",
            "frequency": ObligationFrequency.ANNUALLY,
            "due_month": 2, "due_day": 28,
            "description": "Annual company income tax return (via tax agent: May 15)",
            "preparation_days": 60,
            "penalty_description": "ATO administrative penalty + GIC on unpaid tax",
        },
        {
            "name": "PAYG Withholding Annual Report",
            "frequency": ObligationFrequency.ANNUALLY,
            "due_month": 8, "due_day": 14,
            "description": "Annual PAYG withholding summary",
            "preparation_days": 30,
            "penalty_description": "Administrative penalty for non-lodgement",
        },
        {
            "name": "Superannuation Guarantee",
            "frequency": ObligationFrequency.QUARTERLY,
            "due_dates": [(1, 28), (4, 28), (7, 28), (10, 28)],
            "description": "Employer superannuation contributions (11.5% from July 2024)",
            "preparation_days": 14,
            "penalty_description": "Super guarantee charge (SGC) = shortfall + interest + admin fee",
        },
        {
            "name": "Taxable Payments Annual Report (TPAR)",
            "frequency": ObligationFrequency.ANNUALLY,
            "due_month": 8, "due_day": 28,
            "description": "Annual report of payments to contractors",
            "preparation_days": 30,
            "penalty_description": "Administrative penalty",
        },
    ],
    "NZ": [
        {
            "name": "GST Return",
            "frequency": ObligationFrequency.QUARTERLY,
            "due_dates": [(1, 28), (5, 28), (8, 28), (11, 28)],
            "description": "GST return filing (can be monthly, 2-monthly, or 6-monthly)",
            "preparation_days": 14,
            "penalty_description": "Late filing penalty + use-of-money interest",
        },
        {
            "name": "Income Tax Return (IR3/IR4)",
            "frequency": ObligationFrequency.ANNUALLY,
            "due_month": 3, "due_day": 31,
            "description": "Annual income tax return (extended to March 31 via tax agent)",
            "preparation_days": 60,
            "penalty_description": "Late filing penalty: $50 initial + $250 per month",
        },
        {
            "name": "PAYE Filing",
            "frequency": ObligationFrequency.MONTHLY,
            "due_day": 20,
            "description": "Monthly PAYE, ESCT, and student loan deductions",
            "preparation_days": 7,
            "penalty_description": "Late payment penalty: 1% + 4% after 7 days",
        },
        {
            "name": "FBT Return",
            "frequency": ObligationFrequency.QUARTERLY,
            "due_dates": [(7, 31), (10, 31), (1, 31), (5, 31)],
            "description": "Fringe benefit tax quarterly return",
            "preparation_days": 14,
            "penalty_description": "Late filing and payment penalties",
        },
    ],
    "GB": [
        {
            "name": "VAT Return",
            "frequency": ObligationFrequency.QUARTERLY,
            "due_dates": [(4, 7), (7, 7), (10, 7), (1, 7)],
            "description": "Quarterly VAT return via Making Tax Digital",
            "preparation_days": 21,
            "penalty_description": "Points-based late submission penalty + interest on late payment",
        },
        {
            "name": "Corporation Tax Return (CT600)",
            "frequency": ObligationFrequency.ANNUALLY,
            "due_month": 12, "due_day": 31,
            "description": "Annual corporation tax return (12 months after accounting period end)",
            "preparation_days": 60,
            "penalty_description": "£100 immediate + escalating penalties",
        },
        {
            "name": "Corporation Tax Payment",
            "frequency": ObligationFrequency.ANNUALLY,
            "due_month": 10, "due_day": 1,
            "description": "Corporation tax payment (9 months + 1 day after accounting period end)",
            "preparation_days": 30,
            "penalty_description": "Interest on late payment",
        },
        {
            "name": "PAYE RTI Submissions",
            "frequency": ObligationFrequency.MONTHLY,
            "due_day": 19,
            "description": "Real Time Information PAYE submissions",
            "preparation_days": 7,
            "penalty_description": "£100-£400 per month depending on employee count",
        },
        {
            "name": "Self Assessment Tax Return",
            "frequency": ObligationFrequency.ANNUALLY,
            "due_month": 1, "due_day": 31,
            "description": "Annual self-assessment tax return (online deadline)",
            "preparation_days": 60,
            "penalty_description": "£100 immediate + daily penalties after 3 months",
        },
    ],
}


class ComplianceMonitor:
    """Continuously monitors regulatory compliance across jurisdictions.

    Features:
    - Real-time deadline tracking with preparation alerts
    - Multi-jurisdiction obligation registry
    - Compliance scoring per entity
    - AI-generated compliance narratives
    - Proactive action recommendations
    - Filing status tracking
    """

    def __init__(self):
        settings = get_settings()
        self.client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        self.model = settings.anthropic_model

    async def check_compliance(
        self,
        entity_id: str,
        jurisdictions: list[str],
        filed_obligations: list[dict] | None = None,
        entity_type: str = "company",
        financial_year_end: date | None = None,
    ) -> dict:
        """Run a full compliance check for an entity.

        Args:
            entity_id: Entity to check
            jurisdictions: List of jurisdiction codes (US, AU, NZ, GB)
            filed_obligations: List of already-filed obligations with dates
            entity_type: Type of entity (company, sole_trader, partnership, trust)
            financial_year_end: Entity's financial year end date
        """
        today = date.today()
        filed = {f.get("name"): f for f in (filed_obligations or [])}

        all_obligations = []
        jurisdiction_status = {}

        for jurisdiction in jurisdictions:
            obligations = self._get_obligations(
                jurisdiction, today, filed, financial_year_end
            )
            all_obligations.extend(obligations)

            # Determine jurisdiction status
            statuses = [o["status"] for o in obligations]
            if any(s == ComplianceStatus.OVERDUE for s in statuses):
                jurisdiction_status[jurisdiction] = ComplianceStatus.OVERDUE
            elif any(s == ComplianceStatus.AT_RISK for s in statuses):
                jurisdiction_status[jurisdiction] = ComplianceStatus.AT_RISK
            elif any(s == ComplianceStatus.ACTION_REQUIRED for s in statuses):
                jurisdiction_status[jurisdiction] = ComplianceStatus.ACTION_REQUIRED
            else:
                jurisdiction_status[jurisdiction] = ComplianceStatus.COMPLIANT

        # Calculate compliance score
        compliance_score = self._calculate_compliance_score(all_obligations)

        # Overall status
        if any(v == ComplianceStatus.OVERDUE for v in jurisdiction_status.values()):
            overall_status = ComplianceStatus.OVERDUE
        elif any(v == ComplianceStatus.AT_RISK for v in jurisdiction_status.values()):
            overall_status = ComplianceStatus.AT_RISK
        else:
            overall_status = ComplianceStatus.COMPLIANT

        # Critical alerts (overdue + due within 7 days)
        critical = [
            o for o in all_obligations
            if o["status"] in (ComplianceStatus.OVERDUE, ComplianceStatus.AT_RISK)
            or (o.get("days_remaining", 999) <= 7 and o["status"] != ComplianceStatus.COMPLIANT)
        ]

        # AI analysis
        ai_analysis = await self._generate_ai_analysis({
            "entity_id": entity_id,
            "entity_type": entity_type,
            "jurisdictions": jurisdictions,
            "overall_status": overall_status,
            "compliance_score": compliance_score,
            "obligations": all_obligations,
            "critical_alerts": critical,
        })

        return {
            "entity_id": entity_id,
            "check_date": today.isoformat(),
            "overall_status": overall_status,
            "compliance_score": compliance_score,
            "jurisdiction_status": {k: v for k, v in jurisdiction_status.items()},
            "critical_alerts": critical,
            "all_obligations": all_obligations,
            "ai_analysis": ai_analysis,
        }

    def _get_obligations(
        self,
        jurisdiction: str,
        today: date,
        filed: dict,
        fy_end: date | None,
    ) -> list[dict]:
        """Get all obligations with their current status for a jurisdiction."""
        registry = OBLIGATION_REGISTRY.get(jurisdiction, [])
        obligations = []

        for obl_template in registry:
            due_dates = self._get_next_due_dates(obl_template, today, fy_end)

            for due_date in due_dates:
                days_remaining = (due_date - today).days
                prep_start = due_date - timedelta(days=obl_template.get("preparation_days", 14))
                days_until_prep = (prep_start - today).days

                # Check if already filed
                filing_key = f"{obl_template['name']}_{due_date.isoformat()}"
                is_filed = filing_key in filed or obl_template["name"] in filed

                if is_filed:
                    status = ComplianceStatus.COMPLIANT
                elif days_remaining < 0:
                    status = ComplianceStatus.OVERDUE
                elif days_remaining <= 7:
                    status = ComplianceStatus.AT_RISK
                elif days_until_prep <= 0:
                    status = ComplianceStatus.ACTION_REQUIRED
                else:
                    status = ComplianceStatus.COMPLIANT

                obligations.append({
                    "name": obl_template["name"],
                    "jurisdiction": jurisdiction,
                    "description": obl_template["description"],
                    "frequency": obl_template["frequency"],
                    "due_date": due_date.isoformat(),
                    "days_remaining": days_remaining,
                    "preparation_start": prep_start.isoformat(),
                    "days_until_preparation": days_until_prep,
                    "status": status,
                    "is_filed": is_filed,
                    "penalty_description": obl_template.get("penalty_description", ""),
                })

        return obligations

    def _get_next_due_dates(
        self, template: dict, today: date, fy_end: date | None
    ) -> list[date]:
        """Calculate the next due date(s) for an obligation within 90 days."""
        dates = []
        horizon = today + timedelta(days=90)

        freq = template.get("frequency")

        if "due_dates" in template:
            # Multiple fixed dates per year
            for month, day in template["due_dates"]:
                for year in (today.year, today.year + 1):
                    try:
                        d = date(year, month, min(day, 28))
                        if today - timedelta(days=30) <= d <= horizon:
                            dates.append(d)
                    except ValueError:
                        pass

        elif freq == ObligationFrequency.MONTHLY:
            due_day = template.get("due_day", 20)
            for offset in range(4):
                month = today.month + offset
                year = today.year + (month - 1) // 12
                month = ((month - 1) % 12) + 1
                try:
                    d = date(year, month, min(due_day, 28))
                    if today - timedelta(days=30) <= d <= horizon:
                        dates.append(d)
                except ValueError:
                    pass

        elif freq == ObligationFrequency.ANNUALLY:
            due_month = template.get("due_month", 4)
            due_day = template.get("due_day", 15)
            for year in (today.year, today.year + 1):
                try:
                    d = date(year, due_month, min(due_day, 28))
                    if today - timedelta(days=30) <= d <= horizon:
                        dates.append(d)
                except ValueError:
                    pass

        return dates

    def _calculate_compliance_score(self, obligations: list[dict]) -> int:
        """Calculate compliance score (0-100)."""
        if not obligations:
            return 100

        score = 100.0
        for obl in obligations:
            status = obl["status"]
            if status == ComplianceStatus.OVERDUE:
                score -= 25
            elif status == ComplianceStatus.AT_RISK:
                score -= 10
            elif status == ComplianceStatus.ACTION_REQUIRED:
                score -= 3

        return max(0, min(100, int(score)))

    async def _generate_ai_analysis(self, compliance_data: dict) -> dict:
        """Generate AI-powered compliance narrative."""
        response = await self.client.messages.create(
            model=self.model,
            max_tokens=1000,
            system=COMPLIANCE_PROMPT,
            messages=[{
                "role": "user",
                "content": f"Analyze compliance status:\n\n{json.dumps(compliance_data, indent=2, default=str)}",
            }],
        )

        try:
            return json.loads(response.content[0].text)
        except (json.JSONDecodeError, IndexError):
            return {
                "narrative": response.content[0].text if response.content else "Compliance analysis unavailable.",
                "recommendations": [],
            }

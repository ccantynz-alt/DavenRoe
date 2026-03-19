"""Predictive Cash Flow Forecasting Agent.

Goes beyond historical reporting — predicts future cash positions,
identifies collection risks, and recommends actions before problems hit.

This is the shift from "what happened" to "what will happen."
"""

import json
from datetime import date, timedelta
from decimal import Decimal
from uuid import uuid4

import anthropic

from app.core.config import get_settings


FORECAST_PROMPT = """You are the Cash Flow Forecasting AI for Astra, an autonomous accounting platform.

Analyze the provided financial data and generate a forward-looking cash flow forecast.

Your analysis should:
1. Identify recurring revenue and expense patterns
2. Flag seasonal variations
3. Predict upcoming cash crunches or surpluses
4. Identify at-risk receivables (overdue, slow payers)
5. Recommend specific actions to optimize cash position
6. Provide week-by-week projections for the next 13 weeks (rolling quarter)

Respond in JSON format:
{
  "current_cash_position": "0.00",
  "projected_cash_30_days": "0.00",
  "projected_cash_60_days": "0.00",
  "projected_cash_90_days": "0.00",
  "runway_days": 180,
  "burn_rate_monthly": "0.00",
  "cash_crunch_risk": "none/low/medium/high/critical",
  "weekly_projections": [
    {"week": 1, "inflows": "0.00", "outflows": "0.00", "closing_balance": "0.00"}
  ],
  "at_risk_receivables": [
    {"customer": "...", "amount": "0.00", "days_overdue": 0, "risk_level": "high/medium/low", "recommended_action": "..."}
  ],
  "upcoming_obligations": [
    {"description": "...", "amount": "0.00", "due_date": "...", "category": "tax/payroll/vendor/loan"}
  ],
  "recommendations": [
    {"action": "...", "impact": "...", "urgency": "immediate/this_week/this_month"}
  ],
  "narrative": "2-3 paragraph plain-English summary of cash position and outlook"
}"""


class CashFlowForecaster:
    """Predicts future cash positions and recommends proactive actions.

    Features:
    - Rolling 13-week cash forecast
    - Receivables risk scoring
    - Burn rate & runway calculation
    - Seasonal pattern detection
    - Obligation calendar
    - Action recommendations with urgency levels
    """

    def __init__(self):
        settings = get_settings()
        self.client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        self.model = settings.anthropic_model

    async def generate_forecast(
        self,
        entity_id: str,
        current_cash: Decimal,
        transactions: list[dict],
        receivables: list[dict] | None = None,
        payables: list[dict] | None = None,
        recurring_obligations: list[dict] | None = None,
        jurisdiction: str = "US",
    ) -> dict:
        """Generate a complete cash flow forecast.

        Args:
            entity_id: The entity to forecast for
            current_cash: Current cash balance
            transactions: Historical transactions (ideally 6+ months)
            receivables: Outstanding invoices owed to entity
            payables: Outstanding bills owed by entity
            recurring_obligations: Known future obligations (rent, payroll, etc.)
            jurisdiction: Primary jurisdiction for tax obligation awareness
        """
        forecast_id = str(uuid4())

        # Step 1: Analyze historical patterns
        patterns = self._analyze_patterns(transactions)

        # Step 2: Score receivables risk
        scored_receivables = self._score_receivables(receivables or [])

        # Step 3: Build obligation calendar
        obligations = self._build_obligation_calendar(
            payables or [], recurring_obligations or [], jurisdiction
        )

        # Step 4: Calculate burn rate & runway
        burn_rate = self._calculate_burn_rate(transactions)
        runway = self._calculate_runway(current_cash, burn_rate)

        # Step 5: Generate week-by-week projections
        weekly_projections = self._project_weekly(
            current_cash=current_cash,
            avg_weekly_inflow=patterns["avg_weekly_inflow"],
            avg_weekly_outflow=patterns["avg_weekly_outflow"],
            expected_receivables=scored_receivables,
            obligations=obligations,
        )

        # Step 6: AI-powered narrative and recommendations
        forecast_data = {
            "entity_id": entity_id,
            "current_cash": str(current_cash),
            "burn_rate_monthly": str(burn_rate),
            "runway_days": runway,
            "patterns": {
                "avg_monthly_revenue": str(patterns["avg_monthly_revenue"]),
                "avg_monthly_expenses": str(patterns["avg_monthly_expenses"]),
                "revenue_trend": patterns["revenue_trend"],
                "expense_trend": patterns["expense_trend"],
            },
            "at_risk_receivables": scored_receivables[:10],
            "upcoming_obligations": obligations[:10],
            "weekly_projections": weekly_projections,
            "jurisdiction": jurisdiction,
        }

        ai_analysis = await self._generate_ai_analysis(forecast_data)

        # Determine risk level
        cash_crunch_risk = self._assess_cash_risk(
            current_cash, burn_rate, runway, weekly_projections
        )

        return {
            "forecast_id": forecast_id,
            "entity_id": entity_id,
            "generated_at": date.today().isoformat(),
            "forecast_horizon": "13_weeks",
            "current_cash_position": str(current_cash),
            "burn_rate_monthly": str(burn_rate),
            "runway_days": runway,
            "cash_crunch_risk": cash_crunch_risk,
            "weekly_projections": weekly_projections,
            "at_risk_receivables": scored_receivables,
            "upcoming_obligations": obligations,
            "patterns": patterns,
            "ai_analysis": ai_analysis,
        }

    def _analyze_patterns(self, transactions: list[dict]) -> dict:
        """Analyze historical transaction patterns."""
        if not transactions:
            return {
                "avg_weekly_inflow": Decimal("0"),
                "avg_weekly_outflow": Decimal("0"),
                "avg_monthly_revenue": Decimal("0"),
                "avg_monthly_expenses": Decimal("0"),
                "revenue_trend": "insufficient_data",
                "expense_trend": "insufficient_data",
            }

        inflows = []
        outflows = []
        monthly_revenue: dict[str, Decimal] = {}
        monthly_expenses: dict[str, Decimal] = {}

        for txn in transactions:
            amount = Decimal(str(txn.get("amount", 0)))
            txn_date = txn.get("date", "")
            month_key = str(txn_date)[:7] if txn_date else "unknown"

            if amount > 0:
                inflows.append(amount)
                monthly_revenue[month_key] = monthly_revenue.get(month_key, Decimal("0")) + amount
            else:
                outflows.append(abs(amount))
                monthly_expenses[month_key] = monthly_expenses.get(month_key, Decimal("0")) + abs(amount)

        total_inflow = sum(inflows) if inflows else Decimal("0")
        total_outflow = sum(outflows) if outflows else Decimal("0")

        # Estimate weeks of data
        weeks = max(1, len(transactions) // 20)  # rough estimate

        avg_weekly_inflow = total_inflow / weeks
        avg_weekly_outflow = total_outflow / weeks

        # Monthly averages
        months = max(1, len(set(monthly_revenue.keys()) | set(monthly_expenses.keys())))
        avg_monthly_revenue = total_inflow / months
        avg_monthly_expenses = total_outflow / months

        # Trend detection
        revenue_values = list(monthly_revenue.values())
        expense_values = list(monthly_expenses.values())

        revenue_trend = self._detect_trend(revenue_values)
        expense_trend = self._detect_trend(expense_values)

        return {
            "avg_weekly_inflow": avg_weekly_inflow,
            "avg_weekly_outflow": avg_weekly_outflow,
            "avg_monthly_revenue": avg_monthly_revenue,
            "avg_monthly_expenses": avg_monthly_expenses,
            "revenue_trend": revenue_trend,
            "expense_trend": expense_trend,
        }

    def _detect_trend(self, values: list[Decimal]) -> str:
        """Simple trend detection from a series of values."""
        if len(values) < 2:
            return "insufficient_data"

        first_half = sum(values[: len(values) // 2]) / max(1, len(values) // 2)
        second_half = sum(values[len(values) // 2 :]) / max(1, len(values) - len(values) // 2)

        if second_half > first_half * Decimal("1.1"):
            return "increasing"
        elif second_half < first_half * Decimal("0.9"):
            return "decreasing"
        return "stable"

    def _score_receivables(self, receivables: list[dict]) -> list[dict]:
        """Score receivables by collection risk."""
        scored = []
        today = date.today()

        for rec in receivables:
            amount = Decimal(str(rec.get("amount", 0)))
            due_date_str = rec.get("due_date")
            customer = rec.get("customer", "Unknown")

            days_overdue = 0
            if due_date_str:
                try:
                    due_date = date.fromisoformat(str(due_date_str))
                    days_overdue = max(0, (today - due_date).days)
                except (ValueError, TypeError):
                    pass

            # Risk scoring
            if days_overdue > 90:
                risk_level = "critical"
                collection_probability = Decimal("0.3")
                action = "Escalate to collections or write off"
            elif days_overdue > 60:
                risk_level = "high"
                collection_probability = Decimal("0.5")
                action = "Final demand letter — escalate if no response in 7 days"
            elif days_overdue > 30:
                risk_level = "medium"
                collection_probability = Decimal("0.7")
                action = "Send payment reminder and follow up by phone"
            elif days_overdue > 0:
                risk_level = "low"
                collection_probability = Decimal("0.9")
                action = "Send gentle payment reminder"
            else:
                risk_level = "none"
                collection_probability = Decimal("0.95")
                action = "No action needed — not yet due"

            scored.append({
                "customer": customer,
                "amount": str(amount),
                "due_date": due_date_str,
                "days_overdue": days_overdue,
                "risk_level": risk_level,
                "collection_probability": str(collection_probability),
                "expected_collection": str(amount * collection_probability),
                "recommended_action": action,
            })

        # Sort by risk (highest first)
        risk_order = {"critical": 0, "high": 1, "medium": 2, "low": 3, "none": 4}
        scored.sort(key=lambda x: (risk_order.get(x["risk_level"], 5), -Decimal(x["amount"])))

        return scored

    def _build_obligation_calendar(
        self,
        payables: list[dict],
        recurring: list[dict],
        jurisdiction: str,
    ) -> list[dict]:
        """Build a calendar of upcoming financial obligations."""
        obligations = []
        today = date.today()

        # Add payables
        for payable in payables:
            obligations.append({
                "description": payable.get("description", "Vendor payment"),
                "amount": str(payable.get("amount", 0)),
                "due_date": payable.get("due_date", ""),
                "category": "vendor",
                "vendor": payable.get("vendor", "Unknown"),
            })

        # Add recurring obligations
        for rec in recurring:
            obligations.append({
                "description": rec.get("description", "Recurring obligation"),
                "amount": str(rec.get("amount", 0)),
                "due_date": rec.get("next_due_date", ""),
                "category": rec.get("category", "recurring"),
                "frequency": rec.get("frequency", "monthly"),
            })

        # Add jurisdiction-specific tax obligations
        tax_obligations = self._get_tax_calendar(jurisdiction, today)
        obligations.extend(tax_obligations)

        # Sort by due date
        obligations.sort(key=lambda x: x.get("due_date", "9999-12-31"))

        return obligations

    def _get_tax_calendar(self, jurisdiction: str, from_date: date) -> list[dict]:
        """Get upcoming tax obligations by jurisdiction."""
        obligations = []

        if jurisdiction == "AU":
            # BAS quarterly deadlines
            quarters = {
                1: ("Q2 BAS Due", date(from_date.year, 2, 28)),
                4: ("Q3 BAS Due", date(from_date.year, 5, 28)),
                7: ("Q4 BAS Due", date(from_date.year, 8, 28)),
                10: ("Q1 BAS Due", date(from_date.year, 11, 28)),
            }
            for month, (desc, due) in quarters.items():
                if due >= from_date and due <= from_date + timedelta(days=90):
                    obligations.append({
                        "description": desc,
                        "amount": "varies",
                        "due_date": due.isoformat(),
                        "category": "tax",
                    })

        elif jurisdiction == "NZ":
            # GST return deadlines (2-monthly)
            for m in range(from_date.month, from_date.month + 4):
                month = ((m - 1) % 12) + 1
                if month % 2 == 0:
                    due = date(from_date.year if month >= from_date.month else from_date.year + 1, month, 28)
                    if due >= from_date and due <= from_date + timedelta(days=90):
                        obligations.append({
                            "description": f"GST Return Due (Period ending {month}/{due.year})",
                            "amount": "varies",
                            "due_date": due.isoformat(),
                            "category": "tax",
                        })

        elif jurisdiction == "US":
            # Quarterly estimated tax payments
            quarterly_dates = [
                (date(from_date.year, 4, 15), "Q1 Estimated Tax"),
                (date(from_date.year, 6, 15), "Q2 Estimated Tax"),
                (date(from_date.year, 9, 15), "Q3 Estimated Tax"),
                (date(from_date.year + 1, 1, 15), "Q4 Estimated Tax"),
            ]
            for due, desc in quarterly_dates:
                if due >= from_date and due <= from_date + timedelta(days=90):
                    obligations.append({
                        "description": desc,
                        "amount": "varies",
                        "due_date": due.isoformat(),
                        "category": "tax",
                    })

        elif jurisdiction == "GB":
            # VAT quarterly deadlines
            for q in range(4):
                month = ((from_date.month + q * 3 - 1) % 12) + 1
                year = from_date.year + ((from_date.month + q * 3 - 1) // 12)
                due = date(year, month, 7)
                if due >= from_date and due <= from_date + timedelta(days=90):
                    obligations.append({
                        "description": f"VAT Return Due",
                        "amount": "varies",
                        "due_date": due.isoformat(),
                        "category": "tax",
                    })

        return obligations

    def _calculate_burn_rate(self, transactions: list[dict]) -> Decimal:
        """Calculate monthly burn rate from historical data."""
        if not transactions:
            return Decimal("0")

        total_outflows = sum(
            abs(Decimal(str(t.get("amount", 0))))
            for t in transactions
            if Decimal(str(t.get("amount", 0))) < 0
        )

        # Estimate months of data
        dates = []
        for t in transactions:
            try:
                dates.append(date.fromisoformat(str(t.get("date", ""))))
            except (ValueError, TypeError):
                pass

        if len(dates) >= 2:
            span_days = max(1, (max(dates) - min(dates)).days)
            months = max(1, span_days / 30)
        else:
            months = 1

        return total_outflows / Decimal(str(months))

    def _calculate_runway(self, current_cash: Decimal, monthly_burn: Decimal) -> int:
        """Calculate runway in days."""
        if monthly_burn <= 0:
            return 999  # infinite runway
        daily_burn = monthly_burn / 30
        return int(current_cash / daily_burn)

    def _project_weekly(
        self,
        current_cash: Decimal,
        avg_weekly_inflow: Decimal,
        avg_weekly_outflow: Decimal,
        expected_receivables: list[dict],
        obligations: list[dict],
    ) -> list[dict]:
        """Generate 13-week rolling cash forecast."""
        projections = []
        balance = current_cash
        today = date.today()

        # Build receivable inflows by week
        receivable_by_week: dict[int, Decimal] = {}
        for rec in expected_receivables:
            if rec["risk_level"] != "critical":
                expected = Decimal(rec.get("expected_collection", "0"))
                days_overdue = rec.get("days_overdue", 0)
                # Estimate collection week
                if days_overdue > 30:
                    week = 2
                elif days_overdue > 0:
                    week = 1
                else:
                    # Calculate weeks until due
                    try:
                        due = date.fromisoformat(str(rec.get("due_date", "")))
                        week = max(1, min(13, (due - today).days // 7 + 1))
                    except (ValueError, TypeError):
                        week = 4
                receivable_by_week[week] = receivable_by_week.get(week, Decimal("0")) + expected

        # Build obligation outflows by week
        obligation_by_week: dict[int, Decimal] = {}
        for obl in obligations:
            try:
                due = date.fromisoformat(str(obl.get("due_date", "")))
                week = max(1, min(13, (due - today).days // 7 + 1))
                amount = Decimal(str(obl.get("amount", "0"))) if obl.get("amount") != "varies" else Decimal("0")
                obligation_by_week[week] = obligation_by_week.get(week, Decimal("0")) + amount
            except (ValueError, TypeError, ArithmeticError):
                pass

        for week_num in range(1, 14):
            week_start = today + timedelta(weeks=week_num - 1)
            week_end = week_start + timedelta(days=6)

            # Base inflows/outflows from historical patterns
            inflows = avg_weekly_inflow + receivable_by_week.get(week_num, Decimal("0"))
            outflows = avg_weekly_outflow + obligation_by_week.get(week_num, Decimal("0"))

            balance = balance + inflows - outflows

            projections.append({
                "week": week_num,
                "week_starting": week_start.isoformat(),
                "week_ending": week_end.isoformat(),
                "projected_inflows": str(round(inflows, 2)),
                "projected_outflows": str(round(outflows, 2)),
                "net_cash_flow": str(round(inflows - outflows, 2)),
                "closing_balance": str(round(balance, 2)),
                "below_zero": balance < 0,
            })

        return projections

    def _assess_cash_risk(
        self,
        current_cash: Decimal,
        burn_rate: Decimal,
        runway: int,
        projections: list[dict],
    ) -> str:
        """Assess overall cash crunch risk."""
        # Check if any week goes below zero
        weeks_below_zero = sum(1 for p in projections if p.get("below_zero"))

        if weeks_below_zero > 0 and projections[0].get("below_zero"):
            return "critical"
        elif weeks_below_zero > 2:
            return "high"
        elif runway < 30:
            return "high"
        elif runway < 60:
            return "medium"
        elif runway < 90:
            return "low"
        return "none"

    async def _generate_ai_analysis(self, forecast_data: dict) -> dict:
        """Generate AI-powered narrative and recommendations."""
        response = await self.client.messages.create(
            model=self.model,
            max_tokens=1500,
            system=FORECAST_PROMPT,
            messages=[{
                "role": "user",
                "content": f"Generate cash flow forecast analysis:\n\n{json.dumps(forecast_data, indent=2, default=str)}",
            }],
        )

        try:
            return json.loads(response.content[0].text)
        except (json.JSONDecodeError, IndexError):
            return {
                "narrative": response.content[0].text if response.content else "Forecast analysis unavailable.",
                "recommendations": [],
            }

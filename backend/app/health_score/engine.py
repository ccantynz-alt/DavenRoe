"""Financial Health Score Engine.

Calculates a composite 0-100 score based on five pillars:
  1. Liquidity (current ratio, quick ratio, working capital)
  2. Profitability (net margin, gross margin, ROA)
  3. Efficiency (AR days, AP days, asset turnover)
  4. Growth (revenue growth, profit growth, client growth)
  5. Risk (anomaly rate, overdue %, concentration risk)

Each pillar scores 0-100, then weighted-average into composite.
"""

import uuid
from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy import func, select, and_, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.transaction import Transaction, TransactionLine
from app.models.account import Account
from app.models.invoice import Invoice
from app.models.entity import Entity

# Pillar weights (must sum to 1.0)
WEIGHTS = {
    "liquidity": 0.25,
    "profitability": 0.25,
    "efficiency": 0.20,
    "growth": 0.15,
    "risk": 0.15,
}

# Industry benchmarks (default: professional services)
BENCHMARKS = {
    "current_ratio": 1.5,
    "quick_ratio": 1.2,
    "net_margin": 0.15,
    "gross_margin": 0.55,
    "ar_days": 35,
    "ap_days": 30,
    "revenue_growth": 0.10,
    "overdue_rate": 0.08,
}


class FinancialHealthEngine:
    """Calculate financial health scores from real accounting data."""

    async def calculate_score(self, entity_id: uuid.UUID, db: AsyncSession) -> dict:
        """Calculate the full health score for an entity."""
        today = date.today()
        period_end = today
        period_start = today.replace(day=1) - timedelta(days=1)
        period_start = period_start.replace(day=1)  # First of prior month
        current_month_start = today.replace(day=1)

        # Gather all raw financial data
        data = await self._gather_data(entity_id, db, period_start, period_end)

        # Calculate each pillar
        liquidity = self._score_liquidity(data)
        profitability = self._score_profitability(data)
        efficiency = self._score_efficiency(data)
        growth = self._score_growth(data)
        risk = self._score_risk(data)

        # Composite weighted score
        composite = round(
            liquidity["score"] * WEIGHTS["liquidity"]
            + profitability["score"] * WEIGHTS["profitability"]
            + efficiency["score"] * WEIGHTS["efficiency"]
            + growth["score"] * WEIGHTS["growth"]
            + risk["score"] * WEIGHTS["risk"]
        )

        # Generate AI recommendations
        recommendations = self._generate_recommendations(
            liquidity, profitability, efficiency, growth, risk, data
        )

        # Determine grade
        grade = self._score_to_grade(composite)

        return {
            "entity_id": str(entity_id),
            "composite_score": composite,
            "grade": grade,
            "pillars": {
                "liquidity": liquidity,
                "profitability": profitability,
                "efficiency": efficiency,
                "growth": growth,
                "risk": risk,
            },
            "recommendations": recommendations,
            "benchmarks": BENCHMARKS,
            "weights": WEIGHTS,
            "data_summary": {
                "total_assets": data["total_assets"],
                "total_liabilities": data["total_liabilities"],
                "total_revenue": data["total_revenue"],
                "total_expenses": data["total_expenses"],
                "net_income": data["total_revenue"] - data["total_expenses"],
                "outstanding_ar": data["outstanding_ar"],
                "outstanding_ap": data["outstanding_ap"],
                "overdue_ar": data["overdue_ar"],
                "total_invoices": data["total_invoices"],
                "overdue_invoices": data["overdue_invoices"],
                "transaction_count": data["transaction_count"],
                "high_risk_transactions": data["high_risk_count"],
            },
            "period": {
                "start": str(period_start),
                "end": str(period_end),
            },
        }

    async def get_trend(self, entity_id: uuid.UUID, months: int, db: AsyncSession) -> dict:
        """Calculate monthly health scores for trend analysis."""
        today = date.today()
        trends = []

        for i in range(months):
            month_end = (today.replace(day=1) - timedelta(days=i * 28)).replace(day=1)
            if i > 0:
                month_end = month_end - timedelta(days=1)
            else:
                month_end = today

            month_start = month_end.replace(day=1)

            data = await self._gather_data(entity_id, db, month_start, month_end)
            liquidity = self._score_liquidity(data)
            profitability = self._score_profitability(data)
            efficiency = self._score_efficiency(data)
            growth = self._score_growth(data)
            risk = self._score_risk(data)

            composite = round(
                liquidity["score"] * WEIGHTS["liquidity"]
                + profitability["score"] * WEIGHTS["profitability"]
                + efficiency["score"] * WEIGHTS["efficiency"]
                + growth["score"] * WEIGHTS["growth"]
                + risk["score"] * WEIGHTS["risk"]
            )

            trends.append({
                "month": month_start.strftime("%Y-%m"),
                "composite_score": composite,
                "liquidity": liquidity["score"],
                "profitability": profitability["score"],
                "efficiency": efficiency["score"],
                "growth": growth["score"],
                "risk": risk["score"],
            })

        trends.reverse()
        return {"entity_id": str(entity_id), "months": months, "trend": trends}

    # ── Data Gathering ──────────────────────────────────────────────

    async def _gather_data(
        self, entity_id: uuid.UUID, db: AsyncSession,
        period_start: date, period_end: date,
    ) -> dict:
        """Fetch all financial data needed for scoring."""

        # Account balances by type
        acct_result = await db.execute(
            select(
                Account.account_type,
                func.coalesce(func.sum(Account.balance), 0),
            )
            .where(Account.entity_id == entity_id, Account.is_active == True)  # noqa: E712
            .group_by(Account.account_type)
        )
        balances = {row[0]: float(row[1]) for row in acct_result.all()}

        total_assets = balances.get("asset", 0) - balances.get("contra_asset", 0)
        total_liabilities = abs(balances.get("liability", 0))
        total_equity = abs(balances.get("equity", 0))

        # Revenue & expenses for the period (from posted/approved transactions)
        revenue_result = await db.execute(
            select(func.coalesce(func.sum(TransactionLine.credit - TransactionLine.debit), 0))
            .select_from(TransactionLine)
            .join(TransactionLine.account)
            .join(TransactionLine.transaction)
            .where(
                Account.account_type == "revenue",
                Transaction.entity_id == entity_id,
                Transaction.status.in_(["approved", "posted"]),
                Transaction.transaction_date >= period_start,
                Transaction.transaction_date <= period_end,
            )
        )
        total_revenue = max(float(revenue_result.scalar() or 0), 0)

        expense_result = await db.execute(
            select(func.coalesce(func.sum(TransactionLine.debit - TransactionLine.credit), 0))
            .select_from(TransactionLine)
            .join(TransactionLine.account)
            .join(TransactionLine.transaction)
            .where(
                Account.account_type == "expense",
                Transaction.entity_id == entity_id,
                Transaction.status.in_(["approved", "posted"]),
                Transaction.transaction_date >= period_start,
                Transaction.transaction_date <= period_end,
            )
        )
        total_expenses = max(float(expense_result.scalar() or 0), 0)

        # Prior period revenue (for growth calculation)
        prior_start = period_start - timedelta(days=30)
        prior_end = period_start - timedelta(days=1)
        prior_revenue_result = await db.execute(
            select(func.coalesce(func.sum(TransactionLine.credit - TransactionLine.debit), 0))
            .select_from(TransactionLine)
            .join(TransactionLine.account)
            .join(TransactionLine.transaction)
            .where(
                Account.account_type == "revenue",
                Transaction.entity_id == entity_id,
                Transaction.status.in_(["approved", "posted"]),
                Transaction.transaction_date >= prior_start,
                Transaction.transaction_date <= prior_end,
            )
        )
        prior_revenue = max(float(prior_revenue_result.scalar() or 0), 0)

        # AR & AP from invoices
        ar_result = await db.execute(
            select(func.coalesce(func.sum(Invoice.total - Invoice.amount_paid), 0))
            .where(
                Invoice.entity_id == entity_id,
                Invoice.direction == "receivable",
                Invoice.status.in_(["sent", "partially_paid", "overdue"]),
            )
        )
        outstanding_ar = float(ar_result.scalar() or 0)

        ap_result = await db.execute(
            select(func.coalesce(func.sum(Invoice.total - Invoice.amount_paid), 0))
            .where(
                Invoice.entity_id == entity_id,
                Invoice.direction == "payable",
                Invoice.status.in_(["sent", "partially_paid", "overdue"]),
            )
        )
        outstanding_ap = float(ap_result.scalar() or 0)

        # Overdue AR
        overdue_ar_result = await db.execute(
            select(func.coalesce(func.sum(Invoice.total - Invoice.amount_paid), 0))
            .where(
                Invoice.entity_id == entity_id,
                Invoice.direction == "receivable",
                Invoice.status == "overdue",
            )
        )
        overdue_ar = float(overdue_ar_result.scalar() or 0)

        # Invoice counts
        total_inv_result = await db.execute(
            select(func.count(Invoice.id)).where(
                Invoice.entity_id == entity_id,
                Invoice.direction == "receivable",
                Invoice.status != "void",
            )
        )
        total_invoices = total_inv_result.scalar() or 0

        overdue_inv_result = await db.execute(
            select(func.count(Invoice.id)).where(
                Invoice.entity_id == entity_id,
                Invoice.direction == "receivable",
                Invoice.status == "overdue",
            )
        )
        overdue_invoices = overdue_inv_result.scalar() or 0

        # Transaction count & risk
        txn_count_result = await db.execute(
            select(func.count(Transaction.id)).where(
                Transaction.entity_id == entity_id,
                Transaction.transaction_date >= period_start,
                Transaction.transaction_date <= period_end,
            )
        )
        transaction_count = txn_count_result.scalar() or 0

        high_risk_result = await db.execute(
            select(func.count(Transaction.id)).where(
                Transaction.entity_id == entity_id,
                Transaction.risk_score >= 60,
                Transaction.transaction_date >= period_start,
                Transaction.transaction_date <= period_end,
            )
        )
        high_risk_count = high_risk_result.scalar() or 0

        # Bank/cash balance (accounts with subtype 'bank')
        bank_result = await db.execute(
            select(func.coalesce(func.sum(Account.balance), 0))
            .where(
                Account.entity_id == entity_id,
                Account.account_subtype == "bank",
                Account.is_active == True,  # noqa: E712
            )
        )
        cash_balance = float(bank_result.scalar() or 0)

        # AR subtype balance
        ar_acct_result = await db.execute(
            select(func.coalesce(func.sum(Account.balance), 0))
            .where(
                Account.entity_id == entity_id,
                Account.account_subtype == "accounts_receivable",
                Account.is_active == True,  # noqa: E712
            )
        )
        ar_balance = float(ar_acct_result.scalar() or 0)

        return {
            "total_assets": total_assets,
            "total_liabilities": total_liabilities,
            "total_equity": total_equity,
            "total_revenue": total_revenue,
            "total_expenses": total_expenses,
            "prior_revenue": prior_revenue,
            "outstanding_ar": outstanding_ar,
            "outstanding_ap": outstanding_ap,
            "overdue_ar": overdue_ar,
            "total_invoices": total_invoices,
            "overdue_invoices": overdue_invoices,
            "transaction_count": transaction_count,
            "high_risk_count": high_risk_count,
            "cash_balance": cash_balance,
            "ar_balance": ar_balance,
        }

    # ── Pillar Scoring Functions ────────────────────────────────────

    def _score_liquidity(self, data: dict) -> dict:
        """Score liquidity: current ratio, quick ratio, working capital."""
        assets = data["total_assets"]
        liabilities = data["total_liabilities"]
        cash = data["cash_balance"]
        ar = data["ar_balance"]

        current_ratio = assets / liabilities if liabilities > 0 else 3.0
        quick_ratio = (cash + ar) / liabilities if liabilities > 0 else 3.0
        working_capital = assets - liabilities

        # Score: ratio-based. 2.0+ = 100, 1.5 = 80, 1.0 = 50, <0.5 = 10
        cr_score = self._ratio_score(current_ratio, ideal=2.0, poor=0.5)
        qr_score = self._ratio_score(quick_ratio, ideal=1.5, poor=0.3)
        wc_score = 80 if working_capital > 0 else max(10, 50 + int(working_capital / 1000))

        score = round(cr_score * 0.4 + qr_score * 0.35 + wc_score * 0.25)

        return {
            "score": min(100, max(0, score)),
            "metrics": {
                "current_ratio": round(current_ratio, 2),
                "quick_ratio": round(quick_ratio, 2),
                "working_capital": round(working_capital, 2),
            },
            "label": self._pillar_label(score),
        }

    def _score_profitability(self, data: dict) -> dict:
        """Score profitability: net margin, operating efficiency."""
        revenue = data["total_revenue"]
        expenses = data["total_expenses"]
        net_income = revenue - expenses
        assets = data["total_assets"]

        net_margin = net_income / revenue if revenue > 0 else 0
        roa = net_income / assets if assets > 0 else 0

        # Score margins
        margin_score = self._ratio_score(net_margin, ideal=0.20, poor=-0.10)
        roa_score = self._ratio_score(roa, ideal=0.10, poor=-0.05)

        score = round(margin_score * 0.6 + roa_score * 0.4)

        return {
            "score": min(100, max(0, score)),
            "metrics": {
                "net_margin": round(net_margin * 100, 1),
                "net_income": round(net_income, 2),
                "return_on_assets": round(roa * 100, 1),
                "revenue": round(revenue, 2),
                "expenses": round(expenses, 2),
            },
            "label": self._pillar_label(score),
        }

    def _score_efficiency(self, data: dict) -> dict:
        """Score efficiency: AR days, AP days, collection rate."""
        revenue = data["total_revenue"]
        ar = data["outstanding_ar"]
        ap = data["outstanding_ap"]
        overdue_ar = data["overdue_ar"]

        # AR days (lower = better)
        daily_revenue = revenue / 30 if revenue > 0 else 1
        ar_days = ar / daily_revenue if daily_revenue > 0 else 0

        # AP days
        expenses = data["total_expenses"]
        daily_expenses = expenses / 30 if expenses > 0 else 1
        ap_days = ap / daily_expenses if daily_expenses > 0 else 0

        # Collection rate
        collection_rate = 1 - (overdue_ar / ar) if ar > 0 else 1.0

        # Scores (lower AR days = better)
        ar_score = max(0, min(100, 100 - int(ar_days * 1.5)))
        ap_score = max(0, min(100, 100 - int(abs(ap_days - 30) * 2)))  # 30 days is ideal
        collection_score = int(collection_rate * 100)

        score = round(ar_score * 0.4 + collection_score * 0.35 + ap_score * 0.25)

        return {
            "score": min(100, max(0, score)),
            "metrics": {
                "ar_days": round(ar_days, 1),
                "ap_days": round(ap_days, 1),
                "collection_rate": round(collection_rate * 100, 1),
                "outstanding_ar": round(ar, 2),
                "outstanding_ap": round(ap, 2),
            },
            "label": self._pillar_label(score),
        }

    def _score_growth(self, data: dict) -> dict:
        """Score growth: revenue growth month-over-month."""
        current_revenue = data["total_revenue"]
        prior_revenue = data["prior_revenue"]

        if prior_revenue > 0:
            growth_rate = (current_revenue - prior_revenue) / prior_revenue
        elif current_revenue > 0:
            growth_rate = 1.0  # New revenue from zero = 100% growth
        else:
            growth_rate = 0

        # Score: 20%+ growth = 100, 10% = 80, 0% = 50, -10% = 30, -20%+ = 10
        if growth_rate >= 0.20:
            score = 100
        elif growth_rate >= 0:
            score = 50 + int(growth_rate * 250)
        else:
            score = max(0, 50 + int(growth_rate * 250))

        return {
            "score": min(100, max(0, score)),
            "metrics": {
                "revenue_growth": round(growth_rate * 100, 1),
                "current_revenue": round(current_revenue, 2),
                "prior_revenue": round(prior_revenue, 2),
            },
            "label": self._pillar_label(score),
        }

    def _score_risk(self, data: dict) -> dict:
        """Score risk: anomaly rate, overdue rate, high-risk transactions."""
        total_txns = data["transaction_count"]
        high_risk = data["high_risk_count"]
        total_invoices = data["total_invoices"]
        overdue_invoices = data["overdue_invoices"]

        anomaly_rate = high_risk / total_txns if total_txns > 0 else 0
        overdue_rate = overdue_invoices / total_invoices if total_invoices > 0 else 0

        # Lower risk = higher score (inverted)
        anomaly_score = max(0, 100 - int(anomaly_rate * 500))
        overdue_score = max(0, 100 - int(overdue_rate * 300))

        score = round(anomaly_score * 0.5 + overdue_score * 0.5)

        return {
            "score": min(100, max(0, score)),
            "metrics": {
                "anomaly_rate": round(anomaly_rate * 100, 1),
                "overdue_rate": round(overdue_rate * 100, 1),
                "high_risk_transactions": high_risk,
                "total_transactions": total_txns,
                "overdue_invoices": overdue_invoices,
            },
            "label": self._pillar_label(score),
        }

    # ── Helpers ─────────────────────────────────────────────────────

    def _ratio_score(self, value: float, ideal: float, poor: float) -> int:
        """Convert a financial ratio to a 0-100 score."""
        if value >= ideal:
            return 100
        if value <= poor:
            return 10
        # Linear interpolation
        pct = (value - poor) / (ideal - poor)
        return int(10 + pct * 90)

    def _pillar_label(self, score: int) -> str:
        if score >= 80:
            return "Strong"
        if score >= 60:
            return "Good"
        if score >= 40:
            return "Fair"
        if score >= 20:
            return "Weak"
        return "Critical"

    def _score_to_grade(self, score: int) -> str:
        if score >= 90:
            return "A+"
        if score >= 80:
            return "A"
        if score >= 70:
            return "B+"
        if score >= 60:
            return "B"
        if score >= 50:
            return "C+"
        if score >= 40:
            return "C"
        if score >= 30:
            return "D"
        return "F"

    def _generate_recommendations(
        self, liquidity, profitability, efficiency, growth, risk, data
    ) -> list:
        """Generate prioritized AI recommendations based on scores."""
        recs = []

        # Liquidity recommendations
        if liquidity["score"] < 60:
            cr = liquidity["metrics"]["current_ratio"]
            recs.append({
                "priority": "high",
                "pillar": "liquidity",
                "title": "Improve Cash Position",
                "description": f"Current ratio is {cr}x (industry benchmark: {BENCHMARKS['current_ratio']}x). "
                    "Consider accelerating receivables collection, negotiating longer payment terms with suppliers, "
                    "or securing a line of credit to improve short-term liquidity.",
                "impact": "Could improve health score by 8-15 points",
            })
        elif liquidity["score"] < 80:
            recs.append({
                "priority": "medium",
                "pillar": "liquidity",
                "title": "Optimize Working Capital",
                "description": "Liquidity is adequate but could be stronger. Review payment terms and "
                    "consider offering early payment discounts to accelerate cash inflows.",
                "impact": "Could improve health score by 3-8 points",
            })

        # Profitability recommendations
        if profitability["score"] < 50:
            margin = profitability["metrics"]["net_margin"]
            recs.append({
                "priority": "high",
                "pillar": "profitability",
                "title": "Address Profitability Gap",
                "description": f"Net margin is {margin}% (benchmark: {BENCHMARKS['net_margin']*100}%). "
                    "Review pricing strategy, identify high-cost expense categories, "
                    "and evaluate service line profitability to improve margins.",
                "impact": "Could improve health score by 10-20 points",
            })
        elif profitability["score"] < 75:
            recs.append({
                "priority": "medium",
                "pillar": "profitability",
                "title": "Strengthen Margins",
                "description": "Margins are acceptable but below top-quartile. Look for operational efficiencies "
                    "and consider value-based pricing for high-demand services.",
                "impact": "Could improve health score by 5-10 points",
            })

        # Efficiency recommendations
        if efficiency["score"] < 60:
            ar_days = efficiency["metrics"]["ar_days"]
            recs.append({
                "priority": "high",
                "pillar": "efficiency",
                "title": "Reduce Collection Cycle",
                "description": f"AR days outstanding is {ar_days} days (benchmark: {BENCHMARKS['ar_days']} days). "
                    "Implement automated payment reminders, offer online payment options, "
                    "and review credit terms for slow-paying clients.",
                "impact": "Could improve health score by 5-12 points",
            })

        # Growth recommendations
        if growth["score"] < 50:
            rate = growth["metrics"]["revenue_growth"]
            recs.append({
                "priority": "medium",
                "pillar": "growth",
                "title": "Accelerate Revenue Growth",
                "description": f"Revenue growth is {rate}% month-over-month (benchmark: {BENCHMARKS['revenue_growth']*100}%). "
                    "Focus on client acquisition, upselling existing accounts, "
                    "and expanding service offerings.",
                "impact": "Could improve health score by 3-8 points",
            })

        # Risk recommendations
        if risk["score"] < 70:
            anomaly = risk["metrics"]["anomaly_rate"]
            overdue = risk["metrics"]["overdue_rate"]
            recs.append({
                "priority": "high" if risk["score"] < 50 else "medium",
                "pillar": "risk",
                "title": "Reduce Financial Risk Exposure",
                "description": f"Anomaly rate: {anomaly}%, Overdue rate: {overdue}%. "
                    "Review flagged transactions in the AI Review Queue, follow up on overdue invoices, "
                    "and use forensic tools to investigate anomalies.",
                "impact": "Could improve health score by 5-10 points",
            })

        # Positive reinforcement
        strong_pillars = []
        if liquidity["score"] >= 80:
            strong_pillars.append("liquidity")
        if profitability["score"] >= 80:
            strong_pillars.append("profitability")
        if efficiency["score"] >= 80:
            strong_pillars.append("efficiency")
        if growth["score"] >= 80:
            strong_pillars.append("growth")
        if risk["score"] >= 80:
            strong_pillars.append("risk management")

        if strong_pillars:
            recs.append({
                "priority": "positive",
                "pillar": "overall",
                "title": "Strong Performance Areas",
                "description": f"Excellent scores in {', '.join(strong_pillars)}. "
                    "Continue current practices and consider leveraging these strengths "
                    "for business expansion or better financing terms.",
                "impact": "Maintain current trajectory",
            })

        # Sort by priority
        priority_order = {"high": 0, "medium": 1, "positive": 2}
        recs.sort(key=lambda r: priority_order.get(r["priority"], 3))

        return recs

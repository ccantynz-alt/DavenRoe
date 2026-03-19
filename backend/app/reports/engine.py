"""Reporting Engine — the core output of accounting.

Every transaction, every journal entry, every adjustment
ultimately exists to produce these reports. This is why
accounting exists.

Supports:
- Profit & Loss (Income Statement)
- Balance Sheet (Statement of Financial Position)
- Trial Balance
- Cash Flow Statement (indirect method)
- General Ledger
- Aged Receivables & Payables
- Comparative periods (current vs prior)
- Multi-entity consolidation
"""

from datetime import date
from decimal import Decimal

from app.reports.statements import (
    ProfitAndLoss,
    BalanceSheet,
    TrialBalance,
    CashFlowStatement,
    GeneralLedger,
    AgedReceivables,
    AgedPayables,
)


class ReportingEngine:
    """Central reporting engine that generates all financial statements.

    Takes a list of transactions/journal entries and produces
    any standard financial report.
    """

    def __init__(self):
        self.pnl = ProfitAndLoss()
        self.balance_sheet = BalanceSheet()
        self.trial_balance = TrialBalance()
        self.cash_flow = CashFlowStatement()
        self.general_ledger = GeneralLedger()
        self.aged_receivables = AgedReceivables()
        self.aged_payables = AgedPayables()

    def generate(
        self,
        report_type: str,
        transactions: list[dict],
        start_date: date | None = None,
        end_date: date | None = None,
        comparative: bool = False,
        entity_id: str | None = None,
    ) -> dict:
        """Generate any report by type."""
        generators = {
            "profit_and_loss": self.pnl.generate,
            "pnl": self.pnl.generate,
            "income_statement": self.pnl.generate,
            "balance_sheet": self.balance_sheet.generate,
            "trial_balance": self.trial_balance.generate,
            "cash_flow": self.cash_flow.generate,
            "general_ledger": self.general_ledger.generate,
            "aged_receivables": self.aged_receivables.generate,
            "aged_payables": self.aged_payables.generate,
        }

        generator = generators.get(report_type.lower())
        if not generator:
            return {
                "error": f"Unknown report type: {report_type}",
                "available": list(generators.keys()),
            }

        # Filter by date range
        filtered = self._filter_transactions(transactions, start_date, end_date, entity_id)

        result = generator(filtered, start_date, end_date)

        # Add comparative period if requested
        if comparative and start_date and end_date:
            period_days = (end_date - start_date).days
            prior_end = start_date
            prior_start = date.fromordinal(prior_end.toordinal() - period_days)
            prior_filtered = self._filter_transactions(transactions, prior_start, prior_end, entity_id)
            result["comparative"] = generator(prior_filtered, prior_start, prior_end)
            result["comparative"]["period"] = f"{prior_start} to {prior_end}"

        result["metadata"] = {
            "report_type": report_type,
            "period_start": str(start_date) if start_date else None,
            "period_end": str(end_date) if end_date else None,
            "entity_id": entity_id,
            "transactions_included": len(filtered),
            "generated_at": str(date.today()),
        }

        return result

    def _filter_transactions(
        self, transactions: list[dict], start_date: date | None,
        end_date: date | None, entity_id: str | None,
    ) -> list[dict]:
        """Filter transactions by date range and entity."""
        filtered = transactions

        if entity_id:
            filtered = [t for t in filtered if t.get("entity_id") == entity_id]

        if start_date:
            filtered = [t for t in filtered if self._parse_date(t) >= start_date]

        if end_date:
            filtered = [t for t in filtered if self._parse_date(t) <= end_date]

        return filtered

    @staticmethod
    def _parse_date(txn: dict) -> date:
        d = txn.get("date", "1900-01-01")
        if isinstance(d, date):
            return d
        return date.fromisoformat(str(d)[:10])

    def available_reports(self) -> list[dict]:
        """List all available report types."""
        return [
            {"id": "profit_and_loss", "name": "Profit & Loss", "aliases": ["pnl", "income_statement"], "description": "Revenue minus expenses for a period"},
            {"id": "balance_sheet", "name": "Balance Sheet", "aliases": ["statement_of_financial_position"], "description": "Assets, liabilities, and equity at a point in time"},
            {"id": "trial_balance", "name": "Trial Balance", "description": "All account balances — debits must equal credits"},
            {"id": "cash_flow", "name": "Cash Flow Statement", "description": "Operating, investing, and financing cash flows (indirect method)"},
            {"id": "general_ledger", "name": "General Ledger", "description": "Every transaction by account with running balances"},
            {"id": "aged_receivables", "name": "Aged Receivables", "description": "Who owes you money and how overdue it is"},
            {"id": "aged_payables", "name": "Aged Payables", "description": "Who you owe money to and how overdue it is"},
        ]

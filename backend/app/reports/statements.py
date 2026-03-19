"""Financial Statement Generators.

Each class takes filtered transactions and produces a standard
financial statement. All amounts use Decimal for precision.

Account code conventions (matching our COA templates):
- 1xxx: Assets
- 2xxx: Liabilities
- 3xxx: Equity
- 4xxx: Revenue
- 5xxx: Cost of Goods Sold / Direct Costs
- 6xxx: Operating Expenses
- 7xxx: Other Income/Expenses
- 8xxx: Tax
"""

from collections import defaultdict
from datetime import date, timedelta
from decimal import Decimal

TWO_DP = Decimal("0.01")


def _account_type(code: str) -> str:
    """Determine account type from account code."""
    if not code:
        return "unknown"
    first = code[0] if code[0].isdigit() else "0"
    return {
        "1": "asset",
        "2": "liability",
        "3": "equity",
        "4": "revenue",
        "5": "cogs",
        "6": "expense",
        "7": "other",
        "8": "tax",
    }.get(first, "unknown")


def _sum_by_account(transactions: list[dict], account_types: set[str]) -> dict[str, Decimal]:
    """Sum transaction amounts grouped by account, filtered by type."""
    totals = defaultdict(lambda: Decimal("0"))
    for txn in transactions:
        code = str(txn.get("account_code", txn.get("account", "")))
        if _account_type(code) in account_types:
            name = txn.get("account_name", code)
            key = f"{code} — {name}" if name != code else code
            totals[key] += Decimal(str(txn.get("amount", 0)))
    return dict(sorted(totals.items()))


class ProfitAndLoss:
    """Profit & Loss / Income Statement.

    Revenue - COGS = Gross Profit
    Gross Profit - Operating Expenses = Operating Profit (EBIT)
    EBIT - Interest - Tax = Net Profit
    """

    def generate(self, transactions: list[dict], start_date: date | None = None, end_date: date | None = None) -> dict:
        revenue_accounts = _sum_by_account(transactions, {"revenue"})
        cogs_accounts = _sum_by_account(transactions, {"cogs"})
        expense_accounts = _sum_by_account(transactions, {"expense"})
        other_accounts = _sum_by_account(transactions, {"other"})
        tax_accounts = _sum_by_account(transactions, {"tax"})

        # Revenue is typically credited (negative in our debit-positive convention)
        # so we negate for presentation
        total_revenue = abs(sum(revenue_accounts.values(), Decimal("0")))
        total_cogs = abs(sum(cogs_accounts.values(), Decimal("0")))
        gross_profit = total_revenue - total_cogs
        total_expenses = abs(sum(expense_accounts.values(), Decimal("0")))
        total_other = sum(other_accounts.values(), Decimal("0"))
        total_tax = abs(sum(tax_accounts.values(), Decimal("0")))

        operating_profit = gross_profit - total_expenses
        net_profit = operating_profit + total_other - total_tax

        gross_margin = (gross_profit / total_revenue * 100).quantize(TWO_DP) if total_revenue else Decimal("0")
        net_margin = (net_profit / total_revenue * 100).quantize(TWO_DP) if total_revenue else Decimal("0")

        return {
            "report": "Profit & Loss",
            "period": f"{start_date} to {end_date}" if start_date and end_date else "All periods",
            "sections": {
                "revenue": {
                    "accounts": {k: str(abs(v).quantize(TWO_DP)) for k, v in revenue_accounts.items()},
                    "total": str(total_revenue.quantize(TWO_DP)),
                },
                "cost_of_goods_sold": {
                    "accounts": {k: str(abs(v).quantize(TWO_DP)) for k, v in cogs_accounts.items()},
                    "total": str(total_cogs.quantize(TWO_DP)),
                },
                "gross_profit": str(gross_profit.quantize(TWO_DP)),
                "gross_margin_pct": str(gross_margin),
                "operating_expenses": {
                    "accounts": {k: str(abs(v).quantize(TWO_DP)) for k, v in expense_accounts.items()},
                    "total": str(total_expenses.quantize(TWO_DP)),
                },
                "operating_profit": str(operating_profit.quantize(TWO_DP)),
                "other_income_expenses": {
                    "accounts": {k: str(v.quantize(TWO_DP)) for k, v in other_accounts.items()},
                    "total": str(total_other.quantize(TWO_DP)),
                },
                "tax": {
                    "accounts": {k: str(abs(v).quantize(TWO_DP)) for k, v in tax_accounts.items()},
                    "total": str(total_tax.quantize(TWO_DP)),
                },
            },
            "net_profit": str(net_profit.quantize(TWO_DP)),
            "net_margin_pct": str(net_margin),
        }


class BalanceSheet:
    """Balance Sheet / Statement of Financial Position.

    Assets = Liabilities + Equity

    Must balance. If it doesn't, something is wrong.
    """

    def generate(self, transactions: list[dict], start_date: date | None = None, end_date: date | None = None) -> dict:
        asset_accounts = _sum_by_account(transactions, {"asset"})
        liability_accounts = _sum_by_account(transactions, {"liability"})
        equity_accounts = _sum_by_account(transactions, {"equity"})

        total_assets = sum(asset_accounts.values(), Decimal("0"))
        total_liabilities = abs(sum(liability_accounts.values(), Decimal("0")))
        total_equity = abs(sum(equity_accounts.values(), Decimal("0")))

        # Calculate retained earnings (revenue - expenses not yet in equity)
        revenue = abs(sum(v for k, v in _sum_by_account(transactions, {"revenue"}).items()))
        expenses = abs(sum(v for k, v in _sum_by_account(transactions, {"expense", "cogs"}).items()))
        retained_current = revenue - expenses

        total_equity_with_retained = total_equity + retained_current
        total_liabilities_equity = total_liabilities + total_equity_with_retained

        balanced = abs(total_assets - total_liabilities_equity) < Decimal("0.02")

        return {
            "report": "Balance Sheet",
            "as_at": str(end_date) if end_date else str(date.today()),
            "sections": {
                "assets": {
                    "accounts": {k: str(v.quantize(TWO_DP)) for k, v in asset_accounts.items()},
                    "total": str(total_assets.quantize(TWO_DP)),
                },
                "liabilities": {
                    "accounts": {k: str(abs(v).quantize(TWO_DP)) for k, v in liability_accounts.items()},
                    "total": str(total_liabilities.quantize(TWO_DP)),
                },
                "equity": {
                    "accounts": {k: str(abs(v).quantize(TWO_DP)) for k, v in equity_accounts.items()},
                    "retained_earnings_current_period": str(retained_current.quantize(TWO_DP)),
                    "total": str(total_equity_with_retained.quantize(TWO_DP)),
                },
            },
            "total_assets": str(total_assets.quantize(TWO_DP)),
            "total_liabilities_and_equity": str(total_liabilities_equity.quantize(TWO_DP)),
            "balanced": balanced,
            "difference": str((total_assets - total_liabilities_equity).quantize(TWO_DP)),
        }


class TrialBalance:
    """Trial Balance — all accounts with debit and credit columns.

    Total debits must equal total credits. If they don't, there's
    a data entry error somewhere.
    """

    def generate(self, transactions: list[dict], start_date: date | None = None, end_date: date | None = None) -> dict:
        account_balances = defaultdict(lambda: Decimal("0"))

        for txn in transactions:
            code = str(txn.get("account_code", txn.get("account", "")))
            name = txn.get("account_name", code)
            key = f"{code} — {name}" if name != code else code
            account_balances[key] += Decimal(str(txn.get("amount", 0)))

        lines = []
        total_debit = Decimal("0")
        total_credit = Decimal("0")

        for account, balance in sorted(account_balances.items()):
            if balance >= 0:
                debit = balance
                credit = Decimal("0")
                total_debit += debit
            else:
                debit = Decimal("0")
                credit = abs(balance)
                total_credit += credit

            lines.append({
                "account": account,
                "debit": str(debit.quantize(TWO_DP)),
                "credit": str(credit.quantize(TWO_DP)),
            })

        balanced = abs(total_debit - total_credit) < Decimal("0.02")

        return {
            "report": "Trial Balance",
            "as_at": str(end_date) if end_date else str(date.today()),
            "lines": lines,
            "total_debit": str(total_debit.quantize(TWO_DP)),
            "total_credit": str(total_credit.quantize(TWO_DP)),
            "balanced": balanced,
            "difference": str((total_debit - total_credit).quantize(TWO_DP)),
            "account_count": len(lines),
        }


class CashFlowStatement:
    """Cash Flow Statement (Indirect Method).

    Starts with net profit, adjusts for non-cash items,
    then shows investing and financing activities.
    """

    # Account codes that represent non-cash adjustments
    NON_CASH_CODES = {"depreciation", "amortization", "provision", "impairment", "unrealized"}

    def generate(self, transactions: list[dict], start_date: date | None = None, end_date: date | None = None) -> dict:
        # Calculate net profit
        revenue = abs(sum(Decimal(str(t.get("amount", 0))) for t in transactions if _account_type(str(t.get("account_code", ""))) == "revenue"))
        expenses = abs(sum(Decimal(str(t.get("amount", 0))) for t in transactions if _account_type(str(t.get("account_code", ""))) in ("expense", "cogs")))
        net_profit = revenue - expenses

        # Operating adjustments
        depreciation = Decimal("0")
        working_capital_changes = defaultdict(lambda: Decimal("0"))

        for txn in transactions:
            desc = txn.get("description", "").lower()
            code = str(txn.get("account_code", ""))
            amount = Decimal(str(txn.get("amount", 0)))
            acct_type = _account_type(code)

            # Non-cash items (add back)
            if any(term in desc for term in self.NON_CASH_CODES):
                depreciation += abs(amount)
                continue

            # Working capital changes
            if acct_type == "asset" and code.startswith("1") and not code.startswith("10"):
                # Current assets (excluding cash) — increase = cash outflow
                working_capital_changes["change_in_receivables_inventory"] -= amount
            elif acct_type == "liability" and code.startswith("2"):
                # Current liabilities — increase = cash inflow
                working_capital_changes["change_in_payables_accruals"] += abs(amount)

        operating_adjustments = depreciation + sum(working_capital_changes.values())
        cash_from_operations = net_profit + operating_adjustments

        # Investing activities (asset purchases/sales — 1300+)
        investing = Decimal("0")
        investing_items = {}
        for txn in transactions:
            code = str(txn.get("account_code", ""))
            if code.startswith("13") or code.startswith("14"):
                amount = Decimal(str(txn.get("amount", 0)))
                name = txn.get("account_name", code)
                investing_items[name] = investing_items.get(name, Decimal("0")) - amount
                investing -= amount

        # Financing activities (loans, equity — 26xx, 3xxx)
        financing = Decimal("0")
        financing_items = {}
        for txn in transactions:
            code = str(txn.get("account_code", ""))
            if code.startswith("26") or code.startswith("3"):
                amount = Decimal(str(txn.get("amount", 0)))
                name = txn.get("account_name", code)
                financing_items[name] = financing_items.get(name, Decimal("0")) + amount
                financing += amount

        net_change = cash_from_operations + investing + financing

        return {
            "report": "Cash Flow Statement",
            "period": f"{start_date} to {end_date}" if start_date and end_date else "All periods",
            "sections": {
                "operating_activities": {
                    "net_profit": str(net_profit.quantize(TWO_DP)),
                    "add_back_depreciation_amortization": str(depreciation.quantize(TWO_DP)),
                    "working_capital_changes": {k: str(v.quantize(TWO_DP)) for k, v in working_capital_changes.items()},
                    "cash_from_operations": str(cash_from_operations.quantize(TWO_DP)),
                },
                "investing_activities": {
                    "items": {k: str(v.quantize(TWO_DP)) for k, v in investing_items.items()},
                    "total": str(investing.quantize(TWO_DP)),
                },
                "financing_activities": {
                    "items": {k: str(v.quantize(TWO_DP)) for k, v in financing_items.items()},
                    "total": str(financing.quantize(TWO_DP)),
                },
            },
            "net_change_in_cash": str(net_change.quantize(TWO_DP)),
        }


class GeneralLedger:
    """General Ledger — every transaction by account with running balance."""

    def generate(self, transactions: list[dict], start_date: date | None = None, end_date: date | None = None) -> dict:
        # Group by account
        by_account = defaultdict(list)
        for txn in transactions:
            code = str(txn.get("account_code", txn.get("account", "")))
            name = txn.get("account_name", code)
            key = f"{code} — {name}" if name != code else code
            by_account[key].append(txn)

        accounts = []
        for account_key in sorted(by_account.keys()):
            txns = sorted(by_account[account_key], key=lambda t: str(t.get("date", "")))
            running = Decimal("0")
            entries = []

            for txn in txns:
                amount = Decimal(str(txn.get("amount", 0)))
                running += amount
                entries.append({
                    "date": str(txn.get("date", "")),
                    "description": txn.get("description", ""),
                    "reference": txn.get("reference", ""),
                    "debit": str(amount.quantize(TWO_DP)) if amount >= 0 else "",
                    "credit": str(abs(amount).quantize(TWO_DP)) if amount < 0 else "",
                    "balance": str(running.quantize(TWO_DP)),
                })

            accounts.append({
                "account": account_key,
                "entries": entries,
                "closing_balance": str(running.quantize(TWO_DP)),
                "transaction_count": len(entries),
            })

        return {
            "report": "General Ledger",
            "period": f"{start_date} to {end_date}" if start_date and end_date else "All periods",
            "accounts": accounts,
            "total_accounts": len(accounts),
        }


class AgedReceivables:
    """Aged Receivables — who owes you and how overdue."""

    def generate(self, transactions: list[dict], start_date: date | None = None, end_date: date | None = None) -> dict:
        ref_date = end_date or date.today()
        return self._age_report(transactions, ref_date, "receivable", "1100")

    def _age_report(self, transactions: list[dict], ref_date: date, report_type: str, account_prefix: str) -> dict:
        # Filter to receivable/payable transactions with outstanding amounts
        items = [t for t in transactions if str(t.get("account_code", "")).startswith(account_prefix)]

        by_customer = defaultdict(lambda: {"current": Decimal("0"), "30": Decimal("0"), "60": Decimal("0"), "90": Decimal("0"), "over_90": Decimal("0")})

        for txn in items:
            customer = txn.get("customer", txn.get("vendor", txn.get("counterparty", "Unknown")))
            amount = abs(Decimal(str(txn.get("amount", 0))))
            txn_date = txn.get("date", "")
            if isinstance(txn_date, str) and txn_date:
                try:
                    txn_date = date.fromisoformat(txn_date[:10])
                except ValueError:
                    continue
            elif not isinstance(txn_date, date):
                continue

            days = (ref_date - txn_date).days

            if days <= 30:
                by_customer[customer]["current"] += amount
            elif days <= 60:
                by_customer[customer]["30"] += amount
            elif days <= 90:
                by_customer[customer]["60"] += amount
            elif days <= 120:
                by_customer[customer]["90"] += amount
            else:
                by_customer[customer]["over_90"] += amount

        lines = []
        totals = {"current": Decimal("0"), "30": Decimal("0"), "60": Decimal("0"), "90": Decimal("0"), "over_90": Decimal("0")}

        for customer, buckets in sorted(by_customer.items()):
            total = sum(buckets.values())
            lines.append({
                "name": customer,
                "current": str(buckets["current"].quantize(TWO_DP)),
                "1_30_days": str(buckets["30"].quantize(TWO_DP)),
                "31_60_days": str(buckets["60"].quantize(TWO_DP)),
                "61_90_days": str(buckets["90"].quantize(TWO_DP)),
                "over_90_days": str(buckets["over_90"].quantize(TWO_DP)),
                "total": str(total.quantize(TWO_DP)),
            })
            for k in totals:
                totals[k] += buckets[k]

        grand_total = sum(totals.values())

        return {
            "report": f"Aged {'Receivables' if report_type == 'receivable' else 'Payables'}",
            "as_at": str(ref_date),
            "lines": lines,
            "totals": {
                "current": str(totals["current"].quantize(TWO_DP)),
                "1_30_days": str(totals["30"].quantize(TWO_DP)),
                "31_60_days": str(totals["60"].quantize(TWO_DP)),
                "61_90_days": str(totals["90"].quantize(TWO_DP)),
                "over_90_days": str(totals["over_90"].quantize(TWO_DP)),
                "grand_total": str(grand_total.quantize(TWO_DP)),
            },
            "customer_count": len(lines),
        }


class AgedPayables:
    """Aged Payables — who you owe and how overdue."""

    def generate(self, transactions: list[dict], start_date: date | None = None, end_date: date | None = None) -> dict:
        ref_date = end_date or date.today()
        return AgedReceivables()._age_report(transactions, ref_date, "payable", "2000")

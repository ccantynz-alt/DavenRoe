"""Insolvency & Restructuring Engine.

Tools for insolvency practitioners, liquidators, and restructuring advisors.
Solvency testing, creditor waterfalls, voidable transaction scanning.
"""

from collections import defaultdict
from datetime import date, timedelta
from decimal import Decimal


class SolvencyTestEngine:
    """Balance sheet and cash flow solvency tests.

    Two key tests:
    1. Balance sheet test: assets >= liabilities
    2. Cash flow test: can pay debts as they fall due

    Getting these wrong has personal liability implications for directors.
    """

    def balance_sheet_test(self, assets: Decimal, liabilities: Decimal) -> dict:
        """Simple balance sheet solvency test."""
        surplus = assets - liabilities
        solvent = surplus >= 0

        return {
            "test": "balance_sheet",
            "total_assets": str(assets),
            "total_liabilities": str(liabilities),
            "surplus_deficit": str(surplus),
            "solvent": solvent,
            "interpretation": (
                f"{'Solvent' if solvent else 'INSOLVENT'} — "
                f"{'surplus' if solvent else 'deficit'} of ${abs(surplus):,.2f}"
            ),
        }

    def cash_flow_test(self, debts_due: list[dict], cash_available: Decimal, receivables_due: Decimal = Decimal("0")) -> dict:
        """Cash flow solvency test — can the entity pay debts as they fall due."""
        total_debts = sum(Decimal(str(d.get("amount", 0))) for d in debts_due)
        total_resources = cash_available + receivables_due
        shortfall = total_debts - total_resources

        solvent = total_resources >= total_debts

        # Timeline analysis
        debts_by_period = defaultdict(lambda: Decimal("0"))
        for d in debts_due:
            period = d.get("due_date", "unknown")
            debts_by_period[period] += Decimal(str(d.get("amount", 0)))

        return {
            "test": "cash_flow",
            "cash_available": str(cash_available),
            "receivables_due": str(receivables_due),
            "total_resources": str(total_resources),
            "total_debts_due": str(total_debts),
            "shortfall": str(shortfall) if not solvent else "0",
            "solvent": solvent,
            "debts_by_period": {k: str(v) for k, v in sorted(debts_by_period.items())},
            "interpretation": (
                f"{'Can meet obligations' if solvent else 'CANNOT meet obligations'} — "
                f"resources ${total_resources:,.2f} vs debts ${total_debts:,.2f}"
            ),
        }

    def comprehensive_test(self, assets: Decimal, liabilities: Decimal,
                            cash: Decimal, debts_due: list[dict]) -> dict:
        """Run both solvency tests and provide combined assessment."""
        bs_test = self.balance_sheet_test(assets, liabilities)
        cf_test = self.cash_flow_test(debts_due, cash)

        both_pass = bs_test["solvent"] and cf_test["solvent"]

        return {
            "balance_sheet_test": bs_test,
            "cash_flow_test": cf_test,
            "overall_solvent": both_pass,
            "risk_level": "low" if both_pass else "critical" if not bs_test["solvent"] and not cf_test["solvent"] else "high",
            "director_warning": None if both_pass else (
                "WARNING: Directors may be personally liable for insolvent trading. "
                "Seek legal advice immediately. Consider voluntary administration."
            ),
        }


class CreditorWaterfallEngine:
    """Creditor priority ranking and dividend estimation.

    In a liquidation, creditors are paid in strict priority order.
    Getting this wrong is a breach of duty.
    """

    # Priority order (Australia — similar in NZ, UK, US)
    PRIORITY_ORDER = [
        ("secured", "Secured Creditors (with valid security interest)"),
        ("employee_wages", "Employee Wages & Superannuation (capped)"),
        ("employee_leave", "Employee Leave Entitlements"),
        ("employee_redundancy", "Employee Redundancy (FEG eligible)"),
        ("tax_authority", "Tax Authority (ATO/IRS/IRD)"),
        ("unsecured", "Unsecured Creditors"),
        ("subordinated", "Subordinated Debt"),
        ("related_party", "Related Party Claims"),
        ("shareholders", "Shareholders / Equity"),
    ]

    def calculate_waterfall(
        self, available_funds: Decimal, creditors: list[dict],
    ) -> dict:
        """Calculate the creditor waterfall distribution.

        Args:
            available_funds: total funds available for distribution
            creditors: [{name, amount, priority_class, secured_value?}]
        """
        # Group by priority
        by_priority = defaultdict(list)
        for c in creditors:
            by_priority[c.get("priority_class", "unsecured")].append(c)

        remaining = available_funds
        waterfall = []
        total_claims = sum(Decimal(str(c.get("amount", 0))) for c in creditors)

        for priority_key, priority_label in self.PRIORITY_ORDER:
            class_creditors = by_priority.get(priority_key, [])
            if not class_creditors:
                continue

            class_total = sum(Decimal(str(c.get("amount", 0))) for c in class_creditors)

            if remaining >= class_total:
                # Full payment
                payout = class_total
                cents_in_dollar = Decimal("1.00")
            elif remaining > 0:
                # Partial — pro rata
                payout = remaining
                cents_in_dollar = (remaining / class_total).quantize(Decimal("0.01"))
            else:
                payout = Decimal("0")
                cents_in_dollar = Decimal("0")

            remaining -= payout

            distributions = []
            for c in class_creditors:
                claim = Decimal(str(c.get("amount", 0)))
                dist = (claim * cents_in_dollar).quantize(Decimal("0.01"))
                distributions.append({
                    "creditor": c.get("name", "Unknown"),
                    "claim": str(claim),
                    "distribution": str(dist),
                    "recovery_pct": round(float(cents_in_dollar * 100), 2),
                })

            waterfall.append({
                "priority": priority_key,
                "label": priority_label,
                "total_claims": str(class_total),
                "total_distributed": str(payout),
                "cents_in_dollar": str(cents_in_dollar),
                "creditors": distributions,
            })

        return {
            "status": "complete",
            "available_funds": str(available_funds),
            "total_claims": str(total_claims),
            "shortfall": str(max(Decimal("0"), total_claims - available_funds)),
            "overall_recovery_pct": round(float(min(available_funds, total_claims) / total_claims * 100), 2) if total_claims else 0,
            "waterfall": waterfall,
        }


class VoidableTransactionScanner:
    """Scans for voidable transactions in the relation-back period.

    In Australia: unfair preferences (6 months), uncommercial transactions
    (2 years), related party (4 years).
    """

    def scan(
        self,
        transactions: list[dict],
        insolvency_date: date,
        jurisdiction: str = "AU",
    ) -> dict:
        """Scan transactions for voidable preferences and uncommercial dealings."""
        lookback = {
            "AU": {"preference": 180, "uncommercial": 730, "related_party": 1460},
            "NZ": {"preference": 180, "uncommercial": 730, "related_party": 730},
            "GB": {"preference": 180, "uncommercial": 730, "related_party": 730},
            "US": {"preference": 90, "uncommercial": 730, "related_party": 365},
        }
        periods = lookback.get(jurisdiction, lookback["AU"])

        preference_cutoff = insolvency_date - timedelta(days=periods["preference"])
        uncommercial_cutoff = insolvency_date - timedelta(days=periods["uncommercial"])
        related_cutoff = insolvency_date - timedelta(days=periods["related_party"])

        findings = []

        for txn in transactions:
            txn_date = txn.get("date")
            if isinstance(txn_date, str):
                try:
                    txn_date = date.fromisoformat(txn_date[:10])
                except ValueError:
                    continue

            if not isinstance(txn_date, date):
                continue

            amount = abs(Decimal(str(txn.get("amount", 0))))
            counterparty = txn.get("counterparty", txn.get("vendor", "Unknown"))
            desc = txn.get("description", "").lower()
            is_related = txn.get("is_related_party", False) or any(
                term in desc for term in ["director", "shareholder", "related", "family", "spouse"]
            )

            flags = []

            # Unfair preference — payment to creditor within 6 months
            if preference_cutoff <= txn_date <= insolvency_date and amount > Decimal("0"):
                flags.append({
                    "type": "unfair_preference",
                    "lookback": f"{periods['preference']} days",
                    "detail": f"Payment of ${amount:,.2f} to {counterparty} within preference period",
                })

            # Related party — extended lookback
            if is_related and related_cutoff <= txn_date <= insolvency_date:
                flags.append({
                    "type": "related_party_preference",
                    "lookback": f"{periods['related_party']} days",
                    "detail": f"Related party payment of ${amount:,.2f} to {counterparty}",
                })

            # Uncommercial — large payments that may not have been at arm's length
            if uncommercial_cutoff <= txn_date <= insolvency_date:
                if amount > Decimal("10000") and ("gift" in desc or "donation" in desc or "bonus" in desc or "loan" in desc):
                    flags.append({
                        "type": "uncommercial_transaction",
                        "lookback": f"{periods['uncommercial']} days",
                        "detail": f"Potentially uncommercial: ${amount:,.2f} — '{desc}'",
                    })

            if flags:
                findings.append({
                    "date": str(txn_date),
                    "amount": str(amount),
                    "counterparty": counterparty,
                    "flags": flags,
                    "recoverable": str(amount),
                })

        total_recoverable = sum(Decimal(f["recoverable"]) for f in findings)

        return {
            "status": "complete",
            "jurisdiction": jurisdiction,
            "insolvency_date": str(insolvency_date),
            "lookback_periods": periods,
            "transactions_scanned": len(transactions),
            "voidable_found": len(findings),
            "total_potentially_recoverable": str(total_recoverable),
            "findings": findings,
        }

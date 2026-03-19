"""Bank Reconciliation Matcher.

The most-performed task in bookkeeping: matching bank transactions
to ledger entries. This automates the matching using amount,
date proximity, and description similarity.
"""

from datetime import date, timedelta
from decimal import Decimal
from difflib import SequenceMatcher


class ReconciliationMatcher:
    """Automatic bank-to-ledger transaction matching.

    Three matching strategies:
    1. Exact match — same amount, same date
    2. Fuzzy match — same amount, close date, similar description
    3. One-to-many — one bank txn matches multiple ledger entries

    This replaces the most tedious task in bookkeeping.
    """

    def reconcile(
        self,
        bank_transactions: list[dict],
        ledger_entries: list[dict],
        date_tolerance_days: int = 3,
        description_threshold: float = 0.5,
    ) -> dict:
        """Match bank transactions to ledger entries.

        Args:
            bank_transactions: [{date, amount, description, reference?}]
            ledger_entries: [{date, amount, description, reference?}]
            date_tolerance_days: how many days apart is still a match
            description_threshold: 0-1 similarity score for descriptions
        """
        matched = []
        unmatched_bank = []
        unmatched_ledger = list(range(len(ledger_entries)))

        for bank_idx, bank_txn in enumerate(bank_transactions):
            bank_amount = Decimal(str(bank_txn.get("amount", 0)))
            bank_date = self._parse_date(bank_txn.get("date", ""))
            bank_desc = bank_txn.get("description", "").lower()
            bank_ref = bank_txn.get("reference", "").lower()

            best_match = None
            best_score = 0.0

            for ledger_idx in unmatched_ledger:
                ledger_entry = ledger_entries[ledger_idx]
                ledger_amount = Decimal(str(ledger_entry.get("amount", 0)))
                ledger_date = self._parse_date(ledger_entry.get("date", ""))
                ledger_desc = ledger_entry.get("description", "").lower()
                ledger_ref = ledger_entry.get("reference", "").lower()

                # Amount must match exactly
                if bank_amount != ledger_amount:
                    continue

                # Date check
                if bank_date and ledger_date:
                    day_diff = abs((bank_date - ledger_date).days)
                    if day_diff > date_tolerance_days:
                        continue
                    date_score = 1.0 - (day_diff / (date_tolerance_days + 1))
                else:
                    date_score = 0.5

                # Reference match (strongest signal)
                if bank_ref and ledger_ref and bank_ref == ledger_ref:
                    ref_score = 1.0
                else:
                    ref_score = 0.0

                # Description similarity
                desc_score = SequenceMatcher(None, bank_desc, ledger_desc).ratio()

                # Combined score
                total_score = (date_score * 0.3) + (ref_score * 0.4) + (desc_score * 0.3)

                if total_score > best_score:
                    best_score = total_score
                    best_match = ledger_idx

            if best_match is not None and (best_score > 0.3 or description_threshold == 0):
                match_type = "exact" if best_score > 0.8 else "fuzzy"
                matched.append({
                    "bank_transaction": bank_txn,
                    "ledger_entry": ledger_entries[best_match],
                    "match_type": match_type,
                    "confidence": round(best_score * 100, 1),
                })
                unmatched_ledger.remove(best_match)
            else:
                unmatched_bank.append(bank_txn)

        return {
            "status": "complete",
            "summary": {
                "bank_transactions": len(bank_transactions),
                "ledger_entries": len(ledger_entries),
                "matched": len(matched),
                "unmatched_bank": len(unmatched_bank),
                "unmatched_ledger": len(unmatched_ledger),
                "match_rate_pct": round(len(matched) / len(bank_transactions) * 100, 1) if bank_transactions else 0,
            },
            "matched": matched,
            "unmatched_bank": unmatched_bank,
            "unmatched_ledger": [ledger_entries[i] for i in unmatched_ledger],
        }

    def find_duplicates(self, transactions: list[dict]) -> dict:
        """Find potential duplicate transactions.

        Duplicates are a constant problem — double-entered invoices,
        duplicate bank imports, etc.
        """
        duplicates = []
        seen = set()

        for i, txn in enumerate(transactions):
            key = (
                str(txn.get("amount", "")),
                str(txn.get("date", "")),
                txn.get("description", "").lower().strip(),
            )

            if key in seen:
                duplicates.append({
                    "transaction": txn,
                    "duplicate_index": i,
                    "match_key": f"${txn.get('amount', 0)} on {txn.get('date', '')}",
                })
            seen.add(key)

        return {
            "transactions_checked": len(transactions),
            "duplicates_found": len(duplicates),
            "duplicates": duplicates,
        }

    def bank_rec_summary(
        self,
        bank_balance: Decimal,
        ledger_balance: Decimal,
        outstanding_deposits: list[dict] | None = None,
        outstanding_payments: list[dict] | None = None,
    ) -> dict:
        """Generate a bank reconciliation summary statement.

        The standard bank rec that every bookkeeper prepares monthly.
        """
        outstanding_deposits = outstanding_deposits or []
        outstanding_payments = outstanding_payments or []

        total_deposits = sum(Decimal(str(d.get("amount", 0))) for d in outstanding_deposits)
        total_payments = sum(Decimal(str(d.get("amount", 0))) for d in outstanding_payments)

        adjusted_bank = bank_balance + total_deposits - total_payments
        difference = adjusted_bank - ledger_balance
        reconciled = abs(difference) < Decimal("0.01")

        return {
            "bank_balance": str(bank_balance),
            "add_outstanding_deposits": str(total_deposits),
            "less_outstanding_payments": str(total_payments),
            "adjusted_bank_balance": str(adjusted_bank),
            "ledger_balance": str(ledger_balance),
            "difference": str(difference),
            "reconciled": reconciled,
            "outstanding_deposits": outstanding_deposits,
            "outstanding_deposits_count": len(outstanding_deposits),
            "outstanding_payments": outstanding_payments,
            "outstanding_payments_count": len(outstanding_payments),
            "status": "Reconciled" if reconciled else f"UNRECONCILED — difference of ${abs(difference):,.2f}",
        }

    @staticmethod
    def _parse_date(d) -> date | None:
        if isinstance(d, date):
            return d
        if isinstance(d, str) and d:
            try:
                return date.fromisoformat(d[:10])
            except ValueError:
                return None
        return None

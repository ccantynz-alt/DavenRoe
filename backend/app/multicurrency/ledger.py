"""Multi-Currency Ledger.

Any business with overseas customers or suppliers needs this.
Handles:
- Recording transactions in foreign currency
- Converting to functional currency at transaction date rate
- Period-end revaluation of monetary balances
- Realized FX gains/losses on settlement
- Unrealized FX gains/losses on revaluation
"""

from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal
from typing import Optional

TWO_DP = Decimal("0.01")
SIX_DP = Decimal("0.000001")


@dataclass
class ForeignCurrencyTransaction:
    """A transaction recorded in a foreign currency."""
    id: str = ""
    date: str = ""
    description: str = ""
    foreign_currency: str = ""
    foreign_amount: Decimal = Decimal("0")
    exchange_rate: Decimal = Decimal("1")   # foreign per 1 functional
    functional_amount: Decimal = Decimal("0")
    account_code: str = ""
    entity_id: str = ""
    settled: bool = False
    settlement_rate: Decimal | None = None
    realized_gain_loss: Decimal = Decimal("0")

    def __post_init__(self):
        if self.exchange_rate and self.foreign_amount and not self.functional_amount:
            self.functional_amount = (self.foreign_amount / self.exchange_rate).quantize(TWO_DP)


class MultiCurrencyLedger:
    """Manages foreign currency accounting.

    The key concepts:
    1. Transaction date rate — used when recording the transaction
    2. Settlement rate — used when the invoice is actually paid
    3. Realized gain/loss — difference between transaction rate and settlement rate
    4. Unrealized gain/loss — difference between transaction rate and period-end rate
    """

    def __init__(self, functional_currency: str = "AUD"):
        self.functional_currency = functional_currency
        self._transactions: list[ForeignCurrencyTransaction] = []

    def record_transaction(
        self,
        foreign_currency: str,
        foreign_amount: Decimal,
        exchange_rate: Decimal,
        **kwargs,
    ) -> ForeignCurrencyTransaction:
        """Record a foreign currency transaction at the transaction date rate."""
        functional_amount = (foreign_amount / exchange_rate).quantize(TWO_DP)

        txn = ForeignCurrencyTransaction(
            foreign_currency=foreign_currency.upper(),
            foreign_amount=foreign_amount,
            exchange_rate=exchange_rate,
            functional_amount=functional_amount,
            **kwargs,
        )
        self._transactions.append(txn)

        return txn

    def settle_transaction(
        self, transaction_index: int, settlement_rate: Decimal,
    ) -> dict:
        """Settle a foreign currency transaction and calculate realized FX gain/loss.

        When an invoice is paid, the exchange rate will be different
        from when it was recorded. The difference is a realized gain or loss.
        """
        if transaction_index >= len(self._transactions):
            return {"error": "Transaction not found"}

        txn = self._transactions[transaction_index]
        if txn.settled:
            return {"error": "Transaction already settled"}

        original_functional = txn.functional_amount
        settlement_functional = (txn.foreign_amount / settlement_rate).quantize(TWO_DP)
        realized_gain_loss = settlement_functional - original_functional

        txn.settled = True
        txn.settlement_rate = settlement_rate
        txn.realized_gain_loss = realized_gain_loss

        return {
            "transaction": txn.description,
            "foreign_amount": str(txn.foreign_amount),
            "foreign_currency": txn.foreign_currency,
            "original_rate": str(txn.exchange_rate),
            "settlement_rate": str(settlement_rate),
            "original_functional": str(original_functional),
            "settlement_functional": str(settlement_functional),
            "realized_gain_loss": str(realized_gain_loss),
            "gain_or_loss": "gain" if realized_gain_loss > 0 else "loss" if realized_gain_loss < 0 else "nil",
            "journal_entry": {
                "debit": {
                    "account": "7100 — Realized FX Gain" if realized_gain_loss < 0 else txn.account_code,
                    "amount": str(abs(realized_gain_loss)),
                },
                "credit": {
                    "account": txn.account_code if realized_gain_loss < 0 else "7100 — Realized FX Gain",
                    "amount": str(abs(realized_gain_loss)),
                },
            },
        }

    def revalue_at_period_end(self, period_end_rates: dict[str, Decimal]) -> dict:
        """Revalue all unsettled foreign currency balances at period-end rates.

        This is required at each reporting date (month-end, year-end).
        Creates unrealized FX gain/loss journal entries.
        """
        adjustments = []
        total_unrealized = Decimal("0")

        # Group unsettled transactions by currency
        by_currency: dict[str, list[ForeignCurrencyTransaction]] = {}
        for txn in self._transactions:
            if not txn.settled:
                by_currency.setdefault(txn.foreign_currency, []).append(txn)

        for currency, txns in by_currency.items():
            period_rate = period_end_rates.get(currency)
            if not period_rate:
                continue

            for txn in txns:
                revalued = (txn.foreign_amount / period_rate).quantize(TWO_DP)
                unrealized = revalued - txn.functional_amount
                total_unrealized += unrealized

                if unrealized != 0:
                    adjustments.append({
                        "description": txn.description,
                        "foreign_currency": currency,
                        "foreign_amount": str(txn.foreign_amount),
                        "original_rate": str(txn.exchange_rate),
                        "period_end_rate": str(period_rate),
                        "original_functional": str(txn.functional_amount),
                        "revalued_functional": str(revalued),
                        "unrealized_gain_loss": str(unrealized),
                    })

        return {
            "functional_currency": self.functional_currency,
            "currencies_revalued": len(by_currency),
            "transactions_revalued": sum(len(txns) for txns in by_currency.values()),
            "total_unrealized_gain_loss": str(total_unrealized.quantize(TWO_DP)),
            "adjustments": adjustments,
            "journal_entry": {
                "account": "7200 — Unrealized FX Gain/Loss",
                "amount": str(total_unrealized.quantize(TWO_DP)),
            } if total_unrealized else None,
        }

    def currency_exposure(self) -> dict:
        """Show outstanding foreign currency exposure."""
        exposure: dict[str, dict] = {}

        for txn in self._transactions:
            if txn.settled:
                continue
            curr = txn.foreign_currency
            if curr not in exposure:
                exposure[curr] = {"foreign_total": Decimal("0"), "functional_total": Decimal("0"), "count": 0}
            exposure[curr]["foreign_total"] += txn.foreign_amount
            exposure[curr]["functional_total"] += txn.functional_amount
            exposure[curr]["count"] += 1

        return {
            "functional_currency": self.functional_currency,
            "exposures": {
                k: {
                    "foreign_total": str(v["foreign_total"].quantize(TWO_DP)),
                    "functional_total": str(v["functional_total"].quantize(TWO_DP)),
                    "outstanding_transactions": v["count"],
                }
                for k, v in exposure.items()
            },
        }

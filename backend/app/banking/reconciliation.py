"""Bank Reconciliation Engine.

Matches bank transactions with ledger transactions using multiple strategies:
1. Exact amount + date match
2. Amount match within date tolerance (±3 days)
3. Amount match with merchant/description fuzzy matching
4. Suggested matches for manual review
"""

import logging
from dataclasses import dataclass, field
from datetime import date, timedelta

logger = logging.getLogger(__name__)


@dataclass
class MatchResult:
    bank_txn_id: str
    ledger_txn_id: str
    confidence: float  # 0.0 to 1.0
    match_type: str  # exact, date_tolerance, fuzzy, amount_only
    bank_amount: float
    ledger_amount: float
    bank_date: str
    ledger_date: str
    bank_description: str
    ledger_description: str


@dataclass
class ReconciliationResult:
    matched: list[MatchResult] = field(default_factory=list)
    unmatched_bank: list[dict] = field(default_factory=list)
    unmatched_ledger: list[dict] = field(default_factory=list)
    match_rate: float = 0.0
    total_bank: int = 0
    total_ledger: int = 0
    total_matched: int = 0

    def to_dict(self):
        return {
            "matched": [
                {
                    "bank_txn_id": m.bank_txn_id,
                    "ledger_txn_id": m.ledger_txn_id,
                    "confidence": m.confidence,
                    "match_type": m.match_type,
                    "bank_amount": m.bank_amount,
                    "ledger_amount": m.ledger_amount,
                    "bank_date": m.bank_date,
                    "ledger_date": m.ledger_date,
                }
                for m in self.matched
            ],
            "unmatched_bank": self.unmatched_bank,
            "unmatched_ledger": self.unmatched_ledger,
            "match_rate": round(self.match_rate, 2),
            "total_bank": self.total_bank,
            "total_ledger": self.total_ledger,
            "total_matched": self.total_matched,
        }


class ReconciliationEngine:
    """Multi-strategy bank reconciliation."""

    def __init__(self, date_tolerance_days: int = 3):
        self.date_tolerance = timedelta(days=date_tolerance_days)

    def reconcile(
        self,
        bank_transactions: list[dict],
        ledger_transactions: list[dict],
    ) -> ReconciliationResult:
        """Match bank transactions against ledger transactions.

        Each transaction dict should have: id, amount, date, description
        """
        result = ReconciliationResult(
            total_bank=len(bank_transactions),
            total_ledger=len(ledger_transactions),
        )

        matched_bank_ids = set()
        matched_ledger_ids = set()

        # Pass 1: Exact match (same amount + same date)
        for btxn in bank_transactions:
            if btxn["id"] in matched_bank_ids:
                continue
            for ltxn in ledger_transactions:
                if ltxn["id"] in matched_ledger_ids:
                    continue
                if (abs(float(btxn["amount"]) - float(ltxn["amount"])) < 0.01
                        and btxn["date"] == ltxn["date"]):
                    result.matched.append(MatchResult(
                        bank_txn_id=btxn["id"],
                        ledger_txn_id=ltxn["id"],
                        confidence=1.0,
                        match_type="exact",
                        bank_amount=float(btxn["amount"]),
                        ledger_amount=float(ltxn["amount"]),
                        bank_date=str(btxn["date"]),
                        ledger_date=str(ltxn["date"]),
                        bank_description=btxn.get("description", ""),
                        ledger_description=ltxn.get("description", ""),
                    ))
                    matched_bank_ids.add(btxn["id"])
                    matched_ledger_ids.add(ltxn["id"])
                    break

        # Pass 2: Amount match within date tolerance
        for btxn in bank_transactions:
            if btxn["id"] in matched_bank_ids:
                continue
            bdate = self._parse_date(btxn["date"])
            if not bdate:
                continue
            for ltxn in ledger_transactions:
                if ltxn["id"] in matched_ledger_ids:
                    continue
                ldate = self._parse_date(ltxn["date"])
                if not ldate:
                    continue
                if (abs(float(btxn["amount"]) - float(ltxn["amount"])) < 0.01
                        and abs((bdate - ldate).days) <= self.date_tolerance.days):
                    result.matched.append(MatchResult(
                        bank_txn_id=btxn["id"],
                        ledger_txn_id=ltxn["id"],
                        confidence=0.85,
                        match_type="date_tolerance",
                        bank_amount=float(btxn["amount"]),
                        ledger_amount=float(ltxn["amount"]),
                        bank_date=str(btxn["date"]),
                        ledger_date=str(ltxn["date"]),
                        bank_description=btxn.get("description", ""),
                        ledger_description=ltxn.get("description", ""),
                    ))
                    matched_bank_ids.add(btxn["id"])
                    matched_ledger_ids.add(ltxn["id"])
                    break

        # Pass 3: Fuzzy match (similar description + close amount)
        for btxn in bank_transactions:
            if btxn["id"] in matched_bank_ids:
                continue
            for ltxn in ledger_transactions:
                if ltxn["id"] in matched_ledger_ids:
                    continue
                amount_diff = abs(float(btxn["amount"]) - float(ltxn["amount"]))
                if amount_diff < max(abs(float(btxn["amount"])) * 0.02, 1.0):
                    desc_similarity = self._description_similarity(
                        btxn.get("description", ""),
                        ltxn.get("description", ""),
                    )
                    if desc_similarity > 0.5:
                        result.matched.append(MatchResult(
                            bank_txn_id=btxn["id"],
                            ledger_txn_id=ltxn["id"],
                            confidence=round(0.5 + desc_similarity * 0.3, 2),
                            match_type="fuzzy",
                            bank_amount=float(btxn["amount"]),
                            ledger_amount=float(ltxn["amount"]),
                            bank_date=str(btxn["date"]),
                            ledger_date=str(ltxn["date"]),
                            bank_description=btxn.get("description", ""),
                            ledger_description=ltxn.get("description", ""),
                        ))
                        matched_bank_ids.add(btxn["id"])
                        matched_ledger_ids.add(ltxn["id"])
                        break

        # Collect unmatched
        result.unmatched_bank = [
            t for t in bank_transactions if t["id"] not in matched_bank_ids
        ]
        result.unmatched_ledger = [
            t for t in ledger_transactions if t["id"] not in matched_ledger_ids
        ]
        result.total_matched = len(result.matched)

        total = result.total_bank + result.total_ledger
        if total > 0:
            result.match_rate = (result.total_matched * 2 / total) * 100

        return result

    def _parse_date(self, d) -> date | None:
        if isinstance(d, date):
            return d
        try:
            return date.fromisoformat(str(d)[:10])
        except (ValueError, TypeError):
            logger.warning("Failed to parse date: %s", d)
            return None

    def _description_similarity(self, a: str, b: str) -> float:
        """Simple word-overlap similarity."""
        if not a or not b:
            return 0.0
        words_a = set(a.lower().split())
        words_b = set(b.lower().split())
        if not words_a or not words_b:
            return 0.0
        intersection = words_a & words_b
        return len(intersection) / max(len(words_a), len(words_b))

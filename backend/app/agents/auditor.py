"""Continuous Audit Agent.

Audits every transaction in real-time. Assigns risk scores and flags
potential audit triggers. This is the "Compliance & Audit Shield."
"""

from decimal import Decimal


class AuditAgent:
    """Deterministic + heuristic audit checks on transactions.

    Risk scoring is rules-based (not AI) for predictability.
    AI is only used for narrative explanations of flagged items.
    """

    # Thresholds that trigger audit flags
    LARGE_TRANSACTION_THRESHOLD = {
        "US": Decimal("10000"),   # CTR threshold
        "AU": Decimal("10000"),   # AUSTRAC threshold
        "NZ": Decimal("10000"),   # FIU threshold
        "GB": Decimal("10000"),   # HMRC threshold
    }

    ROUND_NUMBER_TOLERANCE = Decimal("0.01")

    def assess_transaction(
        self,
        amount: Decimal,
        description: str,
        jurisdiction: str,
        transaction_type: str = "expense",
        counterparty: str | None = None,
        is_cross_border: bool = False,
    ) -> dict:
        """Assess risk score for a single transaction.

        Returns a risk score (0-100) and list of flags.
        """
        risk_score = 0
        flags = []

        # 1. Large transaction check
        threshold = self.LARGE_TRANSACTION_THRESHOLD.get(jurisdiction, Decimal("10000"))
        if amount >= threshold:
            risk_score += 25
            flags.append({
                "rule": "large_transaction",
                "severity": "medium",
                "message": f"Transaction of {amount} exceeds {threshold} reporting threshold in {jurisdiction}",
            })

        # 2. Round number check (potential structuring)
        if amount > Decimal("1000") and amount % Decimal("1000") == 0:
            risk_score += 10
            flags.append({
                "rule": "round_number",
                "severity": "low",
                "message": "Round number transaction — may indicate structuring",
            })

        # 3. Just-under-threshold check (smurfing detection)
        if threshold - Decimal("500") <= amount < threshold:
            risk_score += 20
            flags.append({
                "rule": "just_under_threshold",
                "severity": "medium",
                "message": f"Amount is just under the {threshold} reporting threshold",
            })

        # 4. Cross-border without treaty documentation
        if is_cross_border:
            risk_score += 15
            flags.append({
                "rule": "cross_border",
                "severity": "low",
                "message": "Cross-border transaction — ensure treaty documentation is on file",
            })

        # 5. Vague description check
        vague_terms = {"misc", "miscellaneous", "other", "payment", "transfer", "expense"}
        desc_lower = description.lower().strip()
        if desc_lower in vague_terms or len(desc_lower) < 5:
            risk_score += 10
            flags.append({
                "rule": "vague_description",
                "severity": "low",
                "message": "Transaction description is vague — may be flagged in audit",
            })

        # 6. Related party indicator
        if counterparty and any(term in counterparty.lower() for term in ["director", "shareholder", "related", "family"]):
            risk_score += 20
            flags.append({
                "rule": "related_party",
                "severity": "medium",
                "message": "Potential related party transaction — requires arm's length documentation",
            })

        # Cap at 100
        risk_score = min(risk_score, 100)

        return {
            "risk_score": risk_score,
            "risk_level": self._risk_level(risk_score),
            "flags": flags,
            "requires_review": risk_score >= 40,
        }

    @staticmethod
    def _risk_level(score: int) -> str:
        if score < 20:
            return "low"
        elif score < 40:
            return "moderate"
        elif score < 70:
            return "high"
        return "critical"

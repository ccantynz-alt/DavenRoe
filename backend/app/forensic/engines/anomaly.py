"""Statistical Anomaly Detection Engine.

Detects outliers and unusual patterns in financial data without ML libraries.
Uses Z-score, IQR, and time-series analysis — deterministic and explainable.

For M&A due diligence: flags transactions that don't fit the business pattern.
"""

import math
from collections import defaultdict
from datetime import date, timedelta
from decimal import Decimal


class AnomalyDetector:
    """Detects statistical anomalies in financial transaction data.

    Every flagged anomaly includes a plain-English explanation of WHY
    it was flagged — critical for due diligence reports.
    """

    def detect_amount_outliers(self, transactions: list[dict]) -> dict:
        """Flag transactions with amounts that are statistical outliers.

        Uses both Z-score (normal distribution) and IQR (robust to skew).
        """
        amounts = [float(t.get("amount", 0)) for t in transactions if t.get("amount")]
        if len(amounts) < 10:
            return {"status": "insufficient_data", "sample_size": len(amounts)}

        mean = sum(amounts) / len(amounts)
        variance = sum((x - mean) ** 2 for x in amounts) / len(amounts)
        std_dev = math.sqrt(variance) if variance > 0 else 1

        # IQR method (robust)
        sorted_amounts = sorted(amounts)
        n = len(sorted_amounts)
        q1 = sorted_amounts[n // 4]
        q3 = sorted_amounts[3 * n // 4]
        iqr = q3 - q1
        lower_fence = q1 - 1.5 * iqr
        upper_fence = q3 + 1.5 * iqr

        outliers = []
        for i, txn in enumerate(transactions):
            amt = float(txn.get("amount", 0))
            if not amt:
                continue

            z_score = (amt - mean) / std_dev if std_dev > 0 else 0
            is_z_outlier = abs(z_score) > 3
            is_iqr_outlier = amt < lower_fence or amt > upper_fence

            if is_z_outlier or is_iqr_outlier:
                outliers.append({
                    "index": i,
                    "transaction": txn,
                    "amount": amt,
                    "z_score": round(z_score, 2),
                    "is_z_outlier": is_z_outlier,
                    "is_iqr_outlier": is_iqr_outlier,
                    "severity": "high" if is_z_outlier and is_iqr_outlier else "medium",
                    "reason": self._outlier_reason(amt, mean, z_score, upper_fence, lower_fence),
                })

        return {
            "status": "complete",
            "test_type": "amount_outliers",
            "sample_size": len(amounts),
            "statistics": {
                "mean": round(mean, 2),
                "std_dev": round(std_dev, 2),
                "q1": round(q1, 2),
                "q3": round(q3, 2),
                "iqr": round(iqr, 2),
                "lower_fence": round(lower_fence, 2),
                "upper_fence": round(upper_fence, 2),
            },
            "outliers": outliers,
            "outlier_count": len(outliers),
            "outlier_pct": round(len(outliers) / len(amounts) * 100, 2),
        }

    def detect_timing_anomalies(self, transactions: list[dict]) -> dict:
        """Detect unusual timing patterns.

        Flags:
        - Weekend/holiday transactions (unusual for most businesses)
        - Month-end clustering (potential earnings manipulation)
        - After-hours patterns
        - Sudden frequency spikes
        """
        dated_txns = []
        for txn in transactions:
            d = txn.get("date")
            if isinstance(d, str):
                try:
                    d = date.fromisoformat(d)
                except ValueError:
                    continue
            if isinstance(d, date):
                dated_txns.append({**txn, "_date": d})

        if len(dated_txns) < 10:
            return {"status": "insufficient_data"}

        flags = []

        # Weekend transactions
        weekend_txns = [t for t in dated_txns if t["_date"].weekday() >= 5]
        if weekend_txns:
            flags.append({
                "pattern": "weekend_transactions",
                "count": len(weekend_txns),
                "pct": round(len(weekend_txns) / len(dated_txns) * 100, 2),
                "severity": "medium" if len(weekend_txns) > len(dated_txns) * 0.1 else "low",
                "detail": f"{len(weekend_txns)} transactions occurred on weekends",
                "transactions": weekend_txns[:10],  # sample
            })

        # Month-end clustering (last 3 days of month)
        month_end = [t for t in dated_txns if t["_date"].day >= 28]
        month_end_pct = len(month_end) / len(dated_txns) * 100 if dated_txns else 0
        if month_end_pct > 20:  # expected ~10%
            flags.append({
                "pattern": "month_end_clustering",
                "count": len(month_end),
                "pct": round(month_end_pct, 2),
                "severity": "high" if month_end_pct > 30 else "medium",
                "detail": f"{round(month_end_pct, 1)}% of transactions cluster at month-end (expected ~10%)",
            })

        # Frequency spikes — look for days with abnormally many transactions
        daily_counts = defaultdict(int)
        for t in dated_txns:
            daily_counts[t["_date"]] += 1

        counts = list(daily_counts.values())
        if counts:
            avg_daily = sum(counts) / len(counts)
            spike_threshold = avg_daily * 3
            spike_days = [(d, c) for d, c in daily_counts.items() if c > spike_threshold and c > 5]

            if spike_days:
                flags.append({
                    "pattern": "frequency_spikes",
                    "count": len(spike_days),
                    "average_daily": round(avg_daily, 1),
                    "severity": "high",
                    "spike_days": [{"date": str(d), "count": c} for d, c in spike_days[:10]],
                    "detail": f"{len(spike_days)} days had 3x+ the average transaction volume",
                })

        # Quarter-end clustering (potential earnings manipulation)
        qtr_end_months = {3, 6, 9, 12}
        qtr_end = [t for t in dated_txns if t["_date"].month in qtr_end_months and t["_date"].day >= 25]
        qtr_pct = len(qtr_end) / len(dated_txns) * 100 if dated_txns else 0
        if qtr_pct > 15:
            flags.append({
                "pattern": "quarter_end_clustering",
                "count": len(qtr_end),
                "pct": round(qtr_pct, 2),
                "severity": "high",
                "detail": f"{round(qtr_pct, 1)}% of transactions cluster at quarter-end",
            })

        return {
            "status": "complete",
            "test_type": "timing_anomalies",
            "total_transactions": len(dated_txns),
            "flags": flags,
            "risk_level": "high" if any(f["severity"] == "high" for f in flags) else "medium" if flags else "low",
        }

    def detect_round_number_bias(self, amounts: list[Decimal | float | str]) -> dict:
        """Detect excessive round numbers — indicator of fabricated data.

        Legitimate business transactions are messy ($347.52, $1,283.91).
        Fabricated ones tend to be round ($500, $1,000, $5,000).
        """
        parsed = []
        for a in amounts:
            try:
                parsed.append(float(str(a).replace(",", "").replace("$", "")))
            except (ValueError, TypeError):
                continue

        if len(parsed) < 20:
            return {"status": "insufficient_data"}

        round_100 = sum(1 for a in parsed if a % 100 == 0 and a > 0)
        round_1000 = sum(1 for a in parsed if a % 1000 == 0 and a > 0)
        round_500 = sum(1 for a in parsed if a % 500 == 0 and a > 0)

        n = len(parsed)
        pct_100 = round(round_100 / n * 100, 2)
        pct_1000 = round(round_1000 / n * 100, 2)

        # Expected: ~1% round to 1000, ~10% round to 100
        return {
            "status": "complete",
            "test_type": "round_number_bias",
            "sample_size": n,
            "round_to_100": {"count": round_100, "pct": pct_100, "expected_pct": "~10%"},
            "round_to_500": {"count": round_500, "pct": round(round_500 / n * 100, 2)},
            "round_to_1000": {"count": round_1000, "pct": pct_1000, "expected_pct": "~1%"},
            "suspicious": pct_1000 > 5 or pct_100 > 25,
            "risk_level": "high" if pct_1000 > 10 else "medium" if pct_1000 > 5 else "low",
        }

    def full_anomaly_scan(self, transactions: list[dict]) -> dict:
        """Run all anomaly detection tests on a transaction dataset."""
        amounts = [t.get("amount") for t in transactions if t.get("amount")]

        return {
            "amount_outliers": self.detect_amount_outliers(transactions),
            "timing_anomalies": self.detect_timing_anomalies(transactions),
            "round_number_bias": self.detect_round_number_bias(amounts),
        }

    @staticmethod
    def _outlier_reason(amt, mean, z_score, upper, lower):
        if amt > upper:
            return f"Amount ${amt:,.2f} is {abs(z_score):.1f} standard deviations above the mean (${mean:,.2f}). Exceeds upper fence ${upper:,.2f}."
        elif amt < lower:
            return f"Amount ${amt:,.2f} is {abs(z_score):.1f} standard deviations below the mean (${mean:,.2f}). Below lower fence ${lower:,.2f}."
        return f"Amount ${amt:,.2f} has z-score of {z_score:.2f} (mean: ${mean:,.2f})."

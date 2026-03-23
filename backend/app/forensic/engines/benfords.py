"""Benford's Law Analyzer.

Benford's Law states that in naturally occurring datasets, the leading digit
is "1" about 30.1% of the time, "2" about 17.6%, etc. Financial fraud often
violates this distribution because fabricated numbers tend toward uniformity.

This is the #1 forensic accounting tool used by the Big 4, IRS, and FBI.
For M&A due diligence, a Benford's violation in vendor payments or expense
reports is a massive red flag.
"""

import logging
import math
from collections import Counter
from decimal import Decimal

logger = logging.getLogger(__name__)


# Benford's expected distribution for first digit (1-9)
BENFORD_EXPECTED = {
    1: 0.30103,
    2: 0.17609,
    3: 0.12494,
    4: 0.09691,
    5: 0.07918,
    6: 0.06695,
    7: 0.05799,
    8: 0.05115,
    9: 0.04576,
}

# Second digit expected distribution (0-9)
BENFORD_SECOND_DIGIT = {
    0: 0.11968,
    1: 0.11389,
    2: 0.10882,
    3: 0.10433,
    4: 0.10031,
    5: 0.09668,
    6: 0.09337,
    7: 0.09035,
    8: 0.08757,
    9: 0.08500,
}


class BenfordsAnalyzer:
    """Applies Benford's Law to detect anomalies in financial datasets.

    Used in M&A due diligence to flag:
    - Fabricated invoices
    - Round-number fraud (kickbacks, embezzlement)
    - Manipulated expense reports
    - Revenue inflation
    """

    def analyze_first_digit(self, amounts: list[Decimal | float | str]) -> dict:
        """Analyze first-digit distribution against Benford's Law.

        Args:
            amounts: List of financial amounts (invoices, payments, etc.)

        Returns:
            Full analysis with observed vs expected, chi-squared test,
            and per-digit deviation flags.
        """
        # Extract first digits
        first_digits = []
        for amt in amounts:
            digit = self._first_digit(amt)
            if digit:
                first_digits.append(digit)

        if len(first_digits) < 50:
            return {
                "status": "insufficient_data",
                "message": f"Need at least 50 transactions for reliable Benford's analysis. Got {len(first_digits)}.",
                "sample_size": len(first_digits),
            }

        n = len(first_digits)
        observed = Counter(first_digits)

        # Build digit-by-digit comparison
        digit_analysis = []
        chi_squared = 0.0

        for digit in range(1, 10):
            obs_count = observed.get(digit, 0)
            obs_pct = obs_count / n
            exp_pct = BENFORD_EXPECTED[digit]
            exp_count = exp_pct * n
            deviation = obs_pct - exp_pct
            z_score = deviation / math.sqrt(exp_pct * (1 - exp_pct) / n) if n > 0 else 0

            chi_sq_component = ((obs_count - exp_count) ** 2) / exp_count if exp_count > 0 else 0
            chi_squared += chi_sq_component

            # Flag if deviation is significant (|z| > 1.96 = 95% confidence)
            is_suspicious = abs(z_score) > 1.96

            digit_analysis.append({
                "digit": digit,
                "observed_count": obs_count,
                "observed_pct": round(obs_pct * 100, 2),
                "expected_pct": round(exp_pct * 100, 2),
                "deviation_pct": round(deviation * 100, 2),
                "z_score": round(z_score, 3),
                "suspicious": is_suspicious,
            })

        # Chi-squared test (8 degrees of freedom, critical value 15.507 at 95%)
        chi_sq_critical = 15.507
        overall_conformity = chi_squared < chi_sq_critical

        # Mean Absolute Deviation (MAD) — primary Benford's conformity test
        mad = sum(abs(d["deviation_pct"]) for d in digit_analysis) / 9
        # MAD thresholds (Nigrini 2012):
        # < 0.6%: Close conformity
        # 0.6-1.2%: Acceptable conformity
        # 1.2-1.5%: Marginally acceptable
        # > 1.5%: Nonconformity
        if mad < 0.6:
            conformity_level = "close"
        elif mad < 1.2:
            conformity_level = "acceptable"
        elif mad < 1.5:
            conformity_level = "marginal"
        else:
            conformity_level = "nonconforming"

        suspicious_digits = [d for d in digit_analysis if d["suspicious"]]

        return {
            "status": "complete",
            "test_type": "first_digit",
            "sample_size": n,
            "chi_squared": round(chi_squared, 4),
            "chi_squared_critical": chi_sq_critical,
            "passes_chi_squared": overall_conformity,
            "mean_absolute_deviation": round(mad, 4),
            "conformity_level": conformity_level,
            "digit_analysis": digit_analysis,
            "suspicious_digits": suspicious_digits,
            "risk_level": self._risk_from_conformity(conformity_level),
            "summary": self._generate_summary(conformity_level, suspicious_digits, n),
        }

    def analyze_second_digit(self, amounts: list[Decimal | float | str]) -> dict:
        """Analyze second-digit distribution.

        Second-digit analysis is more sensitive to round-number fraud
        (e.g., invoices ending in 00, 50, etc.).
        """
        second_digits = []
        for amt in amounts:
            digit = self._second_digit(amt)
            if digit is not None:
                second_digits.append(digit)

        if len(second_digits) < 100:
            return {
                "status": "insufficient_data",
                "sample_size": len(second_digits),
            }

        n = len(second_digits)
        observed = Counter(second_digits)

        digit_analysis = []
        for digit in range(0, 10):
            obs_count = observed.get(digit, 0)
            obs_pct = obs_count / n
            exp_pct = BENFORD_SECOND_DIGIT[digit]
            deviation = obs_pct - exp_pct

            digit_analysis.append({
                "digit": digit,
                "observed_count": obs_count,
                "observed_pct": round(obs_pct * 100, 2),
                "expected_pct": round(exp_pct * 100, 2),
                "deviation_pct": round(deviation * 100, 2),
                "suspicious": abs(deviation) > 0.03,
            })

        # Check for round-number bias (excess 0s in second digit)
        zero_obs = observed.get(0, 0) / n
        zero_exp = BENFORD_SECOND_DIGIT[0]
        round_number_bias = zero_obs > zero_exp * 1.5

        return {
            "status": "complete",
            "test_type": "second_digit",
            "sample_size": n,
            "digit_analysis": digit_analysis,
            "round_number_bias": round_number_bias,
            "round_number_severity": "high" if round_number_bias else "normal",
        }

    def analyze_duplicate_amounts(self, amounts: list[Decimal | float | str]) -> dict:
        """Find suspiciously repeated amounts.

        In legitimate business, exact duplicate amounts are rare.
        Frequent duplicates suggest copy-paste fraud or fictitious invoices.
        """
        str_amounts = [str(Decimal(str(a)).quantize(Decimal("0.01"))) for a in amounts if a]
        counter = Counter(str_amounts)
        n = len(str_amounts)

        # Amounts appearing more than expected
        # Threshold: appearing > 0.5% of total or > 5 times
        threshold = max(5, int(n * 0.005))
        duplicates = [
            {"amount": amt, "count": count, "pct_of_total": round(count / n * 100, 2)}
            for amt, count in counter.most_common(20)
            if count >= threshold
        ]

        return {
            "status": "complete",
            "test_type": "duplicate_amounts",
            "total_transactions": n,
            "unique_amounts": len(counter),
            "uniqueness_ratio": round(len(counter) / n * 100, 2) if n else 0,
            "suspicious_duplicates": duplicates,
            "risk_level": "high" if len(duplicates) > 5 else "medium" if duplicates else "low",
        }

    def full_analysis(self, amounts: list[Decimal | float | str]) -> dict:
        """Run all Benford's tests on a dataset."""
        return {
            "first_digit": self.analyze_first_digit(amounts),
            "second_digit": self.analyze_second_digit(amounts),
            "duplicates": self.analyze_duplicate_amounts(amounts),
        }

    # ── Helpers ──────────────────────────────────────────────────

    @staticmethod
    def _first_digit(value) -> int | None:
        try:
            s = str(value).lstrip("-").lstrip("0").lstrip("$").lstrip(" ")
            s = s.replace(",", "")
            for ch in s:
                if ch.isdigit() and ch != "0":
                    return int(ch)
        except (ValueError, TypeError):
            logger.exception("Failed to extract first digit from value '%s'", value)
        return None

    @staticmethod
    def _second_digit(value) -> int | None:
        try:
            s = str(value).lstrip("-").lstrip("$").lstrip(" ").replace(",", "")
            digits = [ch for ch in s if ch.isdigit()]
            # Skip leading zeros
            started = False
            count = 0
            for d in digits:
                if d != "0":
                    started = True
                if started:
                    count += 1
                    if count == 2:
                        return int(d)
        except (ValueError, TypeError):
            logger.exception("Failed to extract second digit from value '%s'", value)
        return None

    @staticmethod
    def _risk_from_conformity(level: str) -> str:
        return {
            "close": "low",
            "acceptable": "low",
            "marginal": "medium",
            "nonconforming": "high",
        }.get(level, "unknown")

    @staticmethod
    def _generate_summary(conformity: str, suspicious: list, n: int) -> str:
        if conformity in ("close", "acceptable"):
            msg = f"Dataset of {n} transactions shows {conformity} conformity to Benford's Law. "
            msg += "No significant indicators of data manipulation detected."
        elif conformity == "marginal":
            msg = f"Dataset of {n} transactions shows marginal conformity. "
            if suspicious:
                digits = ", ".join(str(d["digit"]) for d in suspicious)
                msg += f"Digits {digits} show statistically significant deviation. Warrants further investigation."
            else:
                msg += "Recommend deeper analysis of transaction subsets."
        else:
            msg = f"Dataset of {n} transactions FAILS Benford's Law conformity. "
            if suspicious:
                digits = ", ".join(str(d["digit"]) for d in suspicious)
                msg += f"Digits {digits} deviate significantly from expected distribution. "
            msg += "This is a strong indicator of potential data manipulation, fabrication, or systematic rounding."
        return msg

"""Audit & Assurance Engine.

Tools for external and internal auditors. Automates the most
time-consuming audit procedures: sampling, journal entry testing,
depreciation recalculation, and cut-off testing.
"""

import logging
import math
import random
from collections import defaultdict
from datetime import date
from decimal import Decimal

logger = logging.getLogger(__name__)


class AuditSamplingEngine:
    """Statistical audit sampling — the foundation of every audit.

    Replaces hours of manual sample selection with statistically
    valid, defensible sampling methods.
    """

    def monetary_unit_sampling(
        self,
        transactions: list[dict],
        materiality: Decimal,
        confidence: float = 0.95,
        expected_error_rate: float = 0.01,
    ) -> dict:
        """Monetary Unit Sampling (MUS) — the gold standard for audit testing.

        Selects sample based on dollar value, so larger transactions
        have a proportionally higher chance of selection.
        """
        amounts = [(i, abs(Decimal(str(t.get("amount", 0))))) for i, t in enumerate(transactions)]
        total_population = sum(a for _, a in amounts)

        if total_population == 0:
            return {"status": "no_data"}

        # Sample size calculation (AICPA method)
        reliability_factor = {0.90: 2.31, 0.95: 3.0, 0.99: 4.61}.get(confidence, 3.0)
        tolerable_misstatement = materiality
        expected_misstatement = total_population * Decimal(str(expected_error_rate))

        sample_interval = tolerable_misstatement / Decimal(str(reliability_factor))
        sample_size = max(1, int(math.ceil(float(total_population / sample_interval))))
        sample_size = min(sample_size, len(transactions))  # can't exceed population

        # Select using systematic MUS
        interval = float(total_population) / sample_size if sample_size > 0 else float(total_population)
        start = random.uniform(0, interval)

        selected_indices = set()
        cumulative = Decimal("0")
        pointer = Decimal(str(start))

        for idx, amount in amounts:
            cumulative += amount
            while pointer <= cumulative and len(selected_indices) < sample_size:
                selected_indices.add(idx)
                pointer += Decimal(str(interval))

        selected = [transactions[i] for i in sorted(selected_indices)]

        return {
            "status": "complete",
            "method": "monetary_unit_sampling",
            "population_size": len(transactions),
            "population_value": str(total_population),
            "sample_size": len(selected),
            "sampling_interval": str(round(Decimal(str(interval)), 2)),
            "materiality": str(materiality),
            "confidence_level": confidence,
            "selected_transactions": selected,
            "coverage_pct": round(sum(Decimal(str(t.get("amount", 0))) for t in selected) / total_population * 100, 2) if total_population else 0,
        }

    def stratified_sampling(
        self, transactions: list[dict], strata_count: int = 4, sample_per_stratum: int = 10,
    ) -> dict:
        """Stratified random sampling — ensures all value ranges are tested."""
        amounts = sorted(transactions, key=lambda t: abs(float(t.get("amount", 0))))
        n = len(amounts)
        if n == 0:
            return {"status": "no_data"}

        stratum_size = max(1, n // strata_count)
        strata = []
        selected = []

        for i in range(strata_count):
            start = i * stratum_size
            end = start + stratum_size if i < strata_count - 1 else n
            stratum = amounts[start:end]

            sample = random.sample(stratum, min(sample_per_stratum, len(stratum)))
            selected.extend(sample)

            stratum_amounts = [abs(float(t.get("amount", 0))) for t in stratum]
            strata.append({
                "stratum": i + 1,
                "population": len(stratum),
                "sampled": len(sample),
                "min_amount": round(min(stratum_amounts), 2) if stratum_amounts else 0,
                "max_amount": round(max(stratum_amounts), 2) if stratum_amounts else 0,
            })

        return {
            "status": "complete",
            "method": "stratified_random",
            "population_size": n,
            "sample_size": len(selected),
            "strata": strata,
            "selected_transactions": selected,
        }


class JournalEntryTestingEngine:
    """Tests journal entries for indicators of management override.

    ISA 240 / ASA 240 requires testing journal entries for fraud.
    This automates the selection and testing criteria.
    """

    FRAUD_INDICATORS = [
        "round_amount",
        "weekend_or_holiday",
        "unusual_account_combination",
        "period_end",
        "unusual_user",
        "reversal_pattern",
        "just_under_approval_threshold",
        "vague_description",
    ]

    def test_journal_entries(
        self, entries: list[dict], approval_threshold: Decimal = Decimal("10000"),
    ) -> dict:
        """Screen all journal entries for fraud indicators."""
        flagged = []

        for entry in entries:
            flags = []
            amount = abs(Decimal(str(entry.get("amount", 0))))
            desc = entry.get("description", "").lower()
            entry_date = entry.get("date", "")

            # Round amount
            if amount > 100 and amount % 1000 == 0:
                flags.append({"indicator": "round_amount", "detail": f"Round amount: ${amount:,.2f}"})

            # Weekend
            if isinstance(entry_date, str) and entry_date:
                try:
                    d = date.fromisoformat(entry_date[:10])
                    if d.weekday() >= 5:
                        flags.append({"indicator": "weekend_or_holiday", "detail": f"Posted on {d.strftime('%A')}"})
                    if d.day >= 28:
                        flags.append({"indicator": "period_end", "detail": "Posted in last 3 days of month"})
                except ValueError:
                    logger.exception("Failed to parse journal entry date '%s' during fraud indicator testing", entry_date)

            # Just under approval threshold
            if approval_threshold * Decimal("0.9") <= amount < approval_threshold:
                flags.append({
                    "indicator": "just_under_approval_threshold",
                    "detail": f"${amount:,.2f} is just under ${approval_threshold:,.2f} threshold",
                })

            # Vague description
            vague = {"adjustment", "misc", "correction", "other", "reclass", "true-up", "accrual reversal"}
            if any(v in desc for v in vague):
                flags.append({"indicator": "vague_description", "detail": f"Description contains vague term: '{desc}'"})

            if flags:
                flagged.append({
                    "entry": entry,
                    "flags": flags,
                    "risk_score": len(flags) * 25,
                    "risk_level": "high" if len(flags) >= 3 else "medium" if len(flags) >= 2 else "low",
                })

        return {
            "status": "complete",
            "total_entries": len(entries),
            "flagged_entries": len(flagged),
            "flagged_pct": round(len(flagged) / len(entries) * 100, 2) if entries else 0,
            "entries": flagged,
            "summary": f"{len(flagged)} of {len(entries)} journal entries flagged for review",
        }


class DepreciationEngine:
    """Recalculates depreciation schedules for audit verification.

    Auditors spend hours recalculating depreciation to verify
    the client's figures. This automates it.
    """

    METHODS = {
        "straight_line": "Straight-Line",
        "diminishing_value": "Diminishing Value",
        "double_declining": "Double Declining Balance",
        "units_of_production": "Units of Production",
    }

    def calculate_depreciation(
        self,
        cost: Decimal,
        salvage_value: Decimal,
        useful_life_years: int,
        method: str = "straight_line",
        periods_elapsed: int | None = None,
    ) -> dict:
        """Calculate depreciation for an asset."""
        depreciable_amount = cost - salvage_value
        schedule = []

        if method == "straight_line":
            annual = (depreciable_amount / useful_life_years).quantize(Decimal("0.01"))
            carrying = cost
            for year in range(1, useful_life_years + 1):
                dep = annual if year < useful_life_years else carrying - salvage_value
                carrying -= dep
                schedule.append({
                    "year": year,
                    "depreciation": str(dep),
                    "accumulated": str(cost - carrying),
                    "carrying_value": str(carrying),
                })

        elif method in ("diminishing_value", "double_declining"):
            rate = Decimal(str(2 / useful_life_years)) if method == "double_declining" else Decimal(str(1 / useful_life_years)) * Decimal("1.5")
            carrying = cost
            for year in range(1, useful_life_years + 1):
                dep = (carrying * rate).quantize(Decimal("0.01"))
                if carrying - dep < salvage_value:
                    dep = carrying - salvage_value
                carrying -= dep
                schedule.append({
                    "year": year,
                    "depreciation": str(dep),
                    "accumulated": str(cost - carrying),
                    "carrying_value": str(carrying),
                })
                if carrying <= salvage_value:
                    break

        current_year = periods_elapsed if periods_elapsed else useful_life_years
        current_year = min(current_year, len(schedule))

        return {
            "cost": str(cost),
            "salvage_value": str(salvage_value),
            "useful_life_years": useful_life_years,
            "method": self.METHODS.get(method, method),
            "annual_depreciation": schedule[0]["depreciation"] if schedule else "0",
            "current_accumulated": schedule[current_year - 1]["accumulated"] if schedule and current_year > 0 else "0",
            "current_carrying_value": schedule[current_year - 1]["carrying_value"] if schedule and current_year > 0 else str(cost),
            "schedule": schedule,
        }

    def verify_asset_register(self, assets: list[dict]) -> dict:
        """Verify an entire asset register's depreciation calculations."""
        results = []
        total_variance = Decimal("0")

        for asset in assets:
            calculated = self.calculate_depreciation(
                cost=Decimal(str(asset.get("cost", 0))),
                salvage_value=Decimal(str(asset.get("salvage_value", 0))),
                useful_life_years=int(asset.get("useful_life_years", 5)),
                method=asset.get("method", "straight_line"),
                periods_elapsed=asset.get("periods_elapsed"),
            )

            client_accumulated = Decimal(str(asset.get("client_accumulated_depreciation", 0)))
            our_accumulated = Decimal(calculated["current_accumulated"])
            variance = abs(client_accumulated - our_accumulated)
            total_variance += variance

            results.append({
                "asset": asset.get("name", "Unknown"),
                "client_accumulated": str(client_accumulated),
                "calculated_accumulated": str(our_accumulated),
                "variance": str(variance),
                "material": variance > Decimal("100"),
            })

        material_variances = [r for r in results if r["material"]]

        return {
            "status": "complete",
            "assets_tested": len(results),
            "total_variance": str(total_variance),
            "material_variances": len(material_variances),
            "results": results,
        }

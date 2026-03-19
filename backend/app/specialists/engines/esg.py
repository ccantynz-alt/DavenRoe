"""Environmental / ESG Accounting Engine.

Carbon emissions calculation, ESG metric tracking, and
sustainability reporting data preparation.
"""

from decimal import Decimal


# Emission factors (kg CO2e per unit) — simplified from GHG Protocol
# In production, these would be jurisdiction-specific and regularly updated
EMISSION_FACTORS = {
    # Energy (per kWh)
    "electricity_au": Decimal("0.79"),   # Australian grid average
    "electricity_nz": Decimal("0.10"),   # NZ (high renewable)
    "electricity_gb": Decimal("0.21"),   # UK grid
    "electricity_us": Decimal("0.42"),   # US grid average
    "natural_gas": Decimal("2.04"),       # per cubic meter

    # Transport (per km)
    "car_petrol": Decimal("0.21"),
    "car_diesel": Decimal("0.27"),
    "car_electric": Decimal("0.05"),
    "flight_domestic": Decimal("0.255"),
    "flight_short_haul": Decimal("0.156"),
    "flight_long_haul": Decimal("0.195"),

    # Office (per unit)
    "paper_per_ream": Decimal("5.0"),
    "water_per_kl": Decimal("0.344"),

    # Spend-based (per $1000 — Scope 3 estimate)
    "cloud_computing": Decimal("50"),
    "professional_services": Decimal("30"),
    "office_supplies": Decimal("60"),
    "food_catering": Decimal("80"),
}


class CarbonCalculatorEngine:
    """Calculates carbon emissions from financial and activity data.

    Scope 1: Direct emissions (company vehicles, gas heating)
    Scope 2: Indirect from purchased energy (electricity)
    Scope 3: All other indirect (supply chain, travel, cloud)
    """

    def calculate_emissions(self, activities: list[dict]) -> dict:
        """Calculate total emissions from a list of activities.

        Args:
            activities: [{category, quantity, unit, scope?}]
              e.g., {"category": "electricity_au", "quantity": 50000, "unit": "kWh", "scope": 2}
        """
        results = []
        scope_totals = {1: Decimal("0"), 2: Decimal("0"), 3: Decimal("0")}

        for activity in activities:
            category = activity.get("category", "")
            quantity = Decimal(str(activity.get("quantity", 0)))
            factor = EMISSION_FACTORS.get(category, Decimal("0"))
            emissions_kg = (quantity * factor).quantize(Decimal("0.01"))
            emissions_tonnes = (emissions_kg / 1000).quantize(Decimal("0.001"))

            scope = activity.get("scope", self._infer_scope(category))
            scope_totals[scope] += emissions_tonnes

            results.append({
                "category": category,
                "quantity": str(quantity),
                "unit": activity.get("unit", ""),
                "emission_factor": str(factor),
                "emissions_kg_co2e": str(emissions_kg),
                "emissions_tonnes_co2e": str(emissions_tonnes),
                "scope": scope,
            })

        total = sum(scope_totals.values())

        return {
            "status": "complete",
            "activities_counted": len(results),
            "scope_1_tonnes": str(scope_totals[1]),
            "scope_2_tonnes": str(scope_totals[2]),
            "scope_3_tonnes": str(scope_totals[3]),
            "total_tonnes_co2e": str(total),
            "breakdown": results,
            "offset_cost_estimate": str((total * Decimal("25")).quantize(Decimal("0.01"))),  # ~$25/tonne
        }

    def estimate_from_spend(self, expenses: list[dict]) -> dict:
        """Estimate Scope 3 emissions from financial spend data.

        This is the key feature — takes plain transaction data and
        estimates carbon footprint. No activity data needed.
        """
        results = []
        total = Decimal("0")

        # Category mapping (expense description → emission category)
        category_map = {
            "cloud": "cloud_computing",
            "aws": "cloud_computing",
            "azure": "cloud_computing",
            "google cloud": "cloud_computing",
            "hosting": "cloud_computing",
            "saas": "cloud_computing",
            "consulting": "professional_services",
            "legal": "professional_services",
            "accounting": "professional_services",
            "office": "office_supplies",
            "stationery": "office_supplies",
            "catering": "food_catering",
            "food": "food_catering",
            "lunch": "food_catering",
        }

        for expense in expenses:
            desc = expense.get("description", "").lower()
            amount = Decimal(str(expense.get("amount", 0)))
            amount_thousands = amount / 1000

            # Match to category
            matched_category = "professional_services"  # default
            for keyword, cat in category_map.items():
                if keyword in desc:
                    matched_category = cat
                    break

            factor = EMISSION_FACTORS.get(matched_category, Decimal("30"))
            emissions = (amount_thousands * factor).quantize(Decimal("0.01"))
            total += emissions

            results.append({
                "description": expense.get("description", ""),
                "spend": str(amount),
                "matched_category": matched_category,
                "estimated_kg_co2e": str(emissions),
            })

        return {
            "status": "complete",
            "method": "spend_based_estimation",
            "note": "Scope 3 estimates from spend data. For precise reporting, use activity-based calculation.",
            "expenses_analyzed": len(results),
            "total_estimated_kg_co2e": str(total),
            "total_estimated_tonnes_co2e": str((total / 1000).quantize(Decimal("0.001"))),
            "breakdown": results,
        }

    @staticmethod
    def _infer_scope(category: str) -> int:
        if any(term in category for term in ["car_", "natural_gas"]):
            return 1
        if "electricity" in category:
            return 2
        return 3


class ESGMetricsEngine:
    """Calculate standard ESG ratios and metrics from financial data."""

    def calculate_metrics(
        self,
        revenue: Decimal,
        total_emissions_tonnes: Decimal,
        energy_kwh: Decimal = Decimal("0"),
        water_kl: Decimal = Decimal("0"),
        waste_tonnes: Decimal = Decimal("0"),
        waste_recycled_tonnes: Decimal = Decimal("0"),
        employee_count: int = 0,
        board_female_count: int = 0,
        board_total_count: int = 0,
    ) -> dict:
        """Calculate standard ESG performance metrics."""
        metrics = {}

        # Environmental
        if revenue > 0:
            metrics["carbon_intensity"] = {
                "value": str((total_emissions_tonnes / revenue * 1000000).quantize(Decimal("0.01"))),
                "unit": "tonnes CO2e per $1M revenue",
            }
        if employee_count > 0:
            metrics["emissions_per_employee"] = {
                "value": str((total_emissions_tonnes / employee_count).quantize(Decimal("0.01"))),
                "unit": "tonnes CO2e per employee",
            }
        if energy_kwh > 0 and revenue > 0:
            metrics["energy_intensity"] = {
                "value": str((energy_kwh / revenue * 1000000).quantize(Decimal("0.01"))),
                "unit": "kWh per $1M revenue",
            }
        if waste_tonnes > 0:
            diversion = (waste_recycled_tonnes / waste_tonnes * 100).quantize(Decimal("0.1"))
            metrics["waste_diversion_rate"] = {
                "value": str(diversion),
                "unit": "%",
            }

        # Governance
        if board_total_count > 0:
            metrics["board_gender_diversity"] = {
                "value": str(round(board_female_count / board_total_count * 100, 1)),
                "unit": "% female board members",
            }

        return {
            "status": "complete",
            "metrics": metrics,
            "frameworks": ["GHG Protocol", "ISSB S1/S2", "TCFD", "GRI"],
        }

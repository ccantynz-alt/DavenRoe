"""Management / Cost Accounting Engine.

Tools for management accountants and virtual CFOs.
Budget vs actual, variance analysis, break-even, cost allocation.
"""

from collections import defaultdict
from decimal import Decimal


class VarianceAnalysisEngine:
    """Budget vs Actual with price/volume/mix variance decomposition.

    The #1 task for management accountants. Every month, every client.
    """

    def budget_vs_actual(self, budget: list[dict], actuals: list[dict]) -> dict:
        """Compare budget to actuals with variance analysis.

        Args:
            budget: [{category, amount, units?}]
            actuals: [{category, amount, units?}]
        """
        budget_map = {item["category"]: item for item in budget}
        actual_map = {item["category"]: item for item in actuals}
        all_categories = sorted(set(list(budget_map.keys()) + list(actual_map.keys())))

        lines = []
        total_budget = Decimal("0")
        total_actual = Decimal("0")

        for cat in all_categories:
            b = Decimal(str(budget_map.get(cat, {}).get("amount", 0)))
            a = Decimal(str(actual_map.get(cat, {}).get("amount", 0)))
            variance = a - b
            pct = float(variance / b * 100) if b != 0 else 0

            total_budget += b
            total_actual += a

            lines.append({
                "category": cat,
                "budget": str(b),
                "actual": str(a),
                "variance": str(variance),
                "variance_pct": round(pct, 2),
                "favorable": variance < 0 if "expense" in cat.lower() or "cost" in cat.lower() else variance > 0,
            })

        total_variance = total_actual - total_budget

        return {
            "status": "complete",
            "lines": lines,
            "totals": {
                "budget": str(total_budget),
                "actual": str(total_actual),
                "variance": str(total_variance),
                "variance_pct": round(float(total_variance / total_budget * 100), 2) if total_budget else 0,
            },
            "unfavorable_count": sum(1 for l in lines if not l["favorable"] and Decimal(l["variance"]) != 0),
            "material_variances": [l for l in lines if abs(float(l["variance_pct"])) > 10],
        }

    def price_volume_variance(
        self,
        budget_price: Decimal, budget_volume: Decimal,
        actual_price: Decimal, actual_volume: Decimal,
    ) -> dict:
        """Decompose total variance into price and volume components."""
        budget_total = budget_price * budget_volume
        actual_total = actual_price * actual_volume
        total_variance = actual_total - budget_total

        price_variance = (actual_price - budget_price) * actual_volume
        volume_variance = (actual_volume - budget_volume) * budget_price

        return {
            "budget_total": str(budget_total),
            "actual_total": str(actual_total),
            "total_variance": str(total_variance),
            "price_variance": str(price_variance),
            "volume_variance": str(volume_variance),
            "price_variance_pct": round(float(price_variance / budget_total * 100), 2) if budget_total else 0,
            "volume_variance_pct": round(float(volume_variance / budget_total * 100), 2) if budget_total else 0,
        }


class CostAllocationEngine:
    """Overhead cost allocation across departments, products, or cost centers.

    Supports multiple allocation bases: headcount, revenue, square footage, direct cost, custom.
    """

    def allocate_costs(
        self,
        total_overhead: Decimal,
        cost_centers: list[dict],
        allocation_basis: str = "revenue",
    ) -> dict:
        """Allocate overhead costs proportionally.

        Args:
            total_overhead: total amount to allocate
            cost_centers: [{name, revenue?, headcount?, sqft?, direct_cost?}]
            allocation_basis: which driver to use
        """
        # Get driver values
        drivers = []
        for cc in cost_centers:
            value = Decimal(str(cc.get(allocation_basis, 0)))
            drivers.append((cc["name"], value))

        total_driver = sum(v for _, v in drivers)
        if total_driver == 0:
            return {"status": "error", "message": f"Total {allocation_basis} is zero — cannot allocate"}

        allocations = []
        allocated_sum = Decimal("0")

        for i, (name, driver_value) in enumerate(drivers):
            proportion = driver_value / total_driver
            allocated = (total_overhead * proportion).quantize(Decimal("0.01"))

            # Last item gets the rounding remainder
            if i == len(drivers) - 1:
                allocated = total_overhead - allocated_sum

            allocated_sum += allocated

            allocations.append({
                "cost_center": name,
                "driver_value": str(driver_value),
                "proportion": round(float(proportion * 100), 2),
                "allocated_amount": str(allocated),
            })

        return {
            "status": "complete",
            "total_overhead": str(total_overhead),
            "allocation_basis": allocation_basis,
            "total_driver": str(total_driver),
            "allocations": allocations,
        }


class BreakEvenEngine:
    """Break-even and contribution margin analysis."""

    def calculate_break_even(
        self,
        fixed_costs: Decimal,
        price_per_unit: Decimal,
        variable_cost_per_unit: Decimal,
    ) -> dict:
        """Calculate break-even point in units and revenue."""
        contribution_margin = price_per_unit - variable_cost_per_unit

        if contribution_margin <= 0:
            return {
                "status": "error",
                "message": "Contribution margin is zero or negative — no break-even possible",
            }

        cm_ratio = contribution_margin / price_per_unit
        break_even_units = (fixed_costs / contribution_margin).quantize(Decimal("1"))
        break_even_revenue = (fixed_costs / cm_ratio).quantize(Decimal("0.01"))

        # Sensitivity analysis
        scenarios = []
        for change in [-20, -10, 0, 10, 20]:
            adj_price = price_per_unit * (1 + Decimal(str(change / 100)))
            adj_cm = adj_price - variable_cost_per_unit
            if adj_cm > 0:
                be_units = (fixed_costs / adj_cm).quantize(Decimal("1"))
                scenarios.append({
                    "price_change_pct": change,
                    "adjusted_price": str(adj_price),
                    "break_even_units": str(be_units),
                    "break_even_revenue": str((be_units * adj_price).quantize(Decimal("0.01"))),
                })

        return {
            "status": "complete",
            "fixed_costs": str(fixed_costs),
            "price_per_unit": str(price_per_unit),
            "variable_cost_per_unit": str(variable_cost_per_unit),
            "contribution_margin": str(contribution_margin),
            "contribution_margin_ratio": round(float(cm_ratio * 100), 2),
            "break_even_units": str(break_even_units),
            "break_even_revenue": str(break_even_revenue),
            "sensitivity": scenarios,
        }

    def target_profit_analysis(
        self,
        fixed_costs: Decimal,
        price_per_unit: Decimal,
        variable_cost_per_unit: Decimal,
        target_profit: Decimal,
    ) -> dict:
        """How many units to sell to achieve a target profit."""
        contribution_margin = price_per_unit - variable_cost_per_unit
        if contribution_margin <= 0:
            return {"status": "error", "message": "Negative contribution margin"}

        required_units = ((fixed_costs + target_profit) / contribution_margin).quantize(Decimal("1"))
        required_revenue = (required_units * price_per_unit).quantize(Decimal("0.01"))

        return {
            "target_profit": str(target_profit),
            "required_units": str(required_units),
            "required_revenue": str(required_revenue),
            "margin_of_safety_units": str(required_units - (fixed_costs / contribution_margin).quantize(Decimal("1"))),
        }


class WorkingCapitalEngine:
    """Working capital cycle analysis — DSO, DPO, DIO."""

    def calculate_cycle(
        self,
        revenue: Decimal,
        cogs: Decimal,
        avg_receivables: Decimal,
        avg_payables: Decimal,
        avg_inventory: Decimal,
        period_days: int = 365,
    ) -> dict:
        """Calculate the complete working capital (cash conversion) cycle."""
        dso = float(avg_receivables / revenue * period_days) if revenue else 0
        dpo = float(avg_payables / cogs * period_days) if cogs else 0
        dio = float(avg_inventory / cogs * period_days) if cogs else 0
        ccc = dso + dio - dpo

        return {
            "status": "complete",
            "dso_days": round(dso, 1),
            "dpo_days": round(dpo, 1),
            "dio_days": round(dio, 1),
            "cash_conversion_cycle": round(ccc, 1),
            "interpretation": (
                f"Cash is tied up for {round(ccc, 1)} days. "
                f"Collect receivables in {round(dso, 1)} days, "
                f"hold inventory {round(dio, 1)} days, "
                f"pay suppliers in {round(dpo, 1)} days."
            ),
            "recommendations": self._working_capital_recommendations(dso, dpo, dio, ccc),
        }

    @staticmethod
    def _working_capital_recommendations(dso, dpo, dio, ccc):
        recs = []
        if dso > 45:
            recs.append(f"DSO of {dso:.0f} days is high. Consider tightening credit terms or improving collections.")
        if dpo < 30:
            recs.append(f"DPO of {dpo:.0f} days is low. Negotiate longer payment terms with suppliers.")
        if dio > 60:
            recs.append(f"DIO of {dio:.0f} days suggests slow inventory turnover. Review stock levels.")
        if ccc > 90:
            recs.append(f"Cash conversion cycle of {ccc:.0f} days is long. Working capital is under pressure.")
        if not recs:
            recs.append("Working capital cycle looks healthy.")
        return recs

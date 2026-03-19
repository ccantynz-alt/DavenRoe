"""Universal Financial Calculators.

The calculators every accountant and bookkeeper reaches for daily.
Compound interest, loan amortization, PV/FV, IRR, depreciation,
financial ratios, invoice terms.

These replace the Excel templates, the Google searches, and the
mental math that eats 30 minutes a day.
"""

import math
from decimal import Decimal, ROUND_HALF_UP

TWO_DP = Decimal("0.01")


class FinancialCalculator:
    """Time-value-of-money and core financial calculations."""

    def compound_interest(
        self,
        principal: Decimal,
        annual_rate: Decimal,
        years: int,
        compounds_per_year: int = 12,
    ) -> dict:
        """Compound interest with full schedule.

        The most-Googled financial calculation in the world.
        """
        r = float(annual_rate / 100)
        n = compounds_per_year
        schedule = []
        balance = float(principal)

        for year in range(1, years + 1):
            start = balance
            balance = start * (1 + r / n) ** n
            interest = balance - start
            schedule.append({
                "year": year,
                "start_balance": str(Decimal(str(start)).quantize(TWO_DP)),
                "interest_earned": str(Decimal(str(interest)).quantize(TWO_DP)),
                "end_balance": str(Decimal(str(balance)).quantize(TWO_DP)),
            })

        total_interest = balance - float(principal)

        return {
            "principal": str(principal),
            "annual_rate_pct": str(annual_rate),
            "years": years,
            "compounds_per_year": n,
            "final_balance": str(Decimal(str(balance)).quantize(TWO_DP)),
            "total_interest": str(Decimal(str(total_interest)).quantize(TWO_DP)),
            "schedule": schedule,
        }

    def loan_amortization(
        self,
        principal: Decimal,
        annual_rate: Decimal,
        years: int,
        payments_per_year: int = 12,
    ) -> dict:
        """Loan amortization schedule — principal + interest split per payment."""
        r = float(annual_rate / 100) / payments_per_year
        n = years * payments_per_year

        if r == 0:
            payment = float(principal) / n
        else:
            payment = float(principal) * (r * (1 + r) ** n) / ((1 + r) ** n - 1)

        balance = float(principal)
        schedule = []
        total_interest = 0.0
        total_principal = 0.0

        for period in range(1, n + 1):
            interest_portion = balance * r
            principal_portion = payment - interest_portion

            # Last payment adjustment for rounding
            if period == n:
                principal_portion = balance
                payment = principal_portion + interest_portion

            balance -= principal_portion
            total_interest += interest_portion
            total_principal += principal_portion

            if balance < 0.005:
                balance = 0.0

            schedule.append({
                "period": period,
                "payment": str(Decimal(str(payment)).quantize(TWO_DP)),
                "principal": str(Decimal(str(principal_portion)).quantize(TWO_DP)),
                "interest": str(Decimal(str(interest_portion)).quantize(TWO_DP)),
                "balance": str(Decimal(str(balance)).quantize(TWO_DP)),
            })

        return {
            "loan_amount": str(principal),
            "annual_rate_pct": str(annual_rate),
            "term_years": years,
            "payment_frequency": "monthly" if payments_per_year == 12 else f"{payments_per_year}x/year",
            "periodic_payment": str(Decimal(str(schedule[0]["payment"])).quantize(TWO_DP)),
            "total_interest": str(Decimal(str(total_interest)).quantize(TWO_DP)),
            "total_paid": str(Decimal(str(total_interest + float(principal))).quantize(TWO_DP)),
            "schedule": schedule,
        }

    def present_value(
        self,
        future_value: Decimal,
        annual_rate: Decimal,
        years: int,
        compounds_per_year: int = 1,
    ) -> dict:
        """Present Value — what's a future sum worth today?"""
        r = float(annual_rate / 100) / compounds_per_year
        n = years * compounds_per_year
        pv = float(future_value) / (1 + r) ** n

        return {
            "future_value": str(future_value),
            "present_value": str(Decimal(str(pv)).quantize(TWO_DP)),
            "annual_rate_pct": str(annual_rate),
            "years": years,
            "discount": str((future_value - Decimal(str(pv))).quantize(TWO_DP)),
        }

    def future_value(
        self,
        present_value: Decimal,
        annual_rate: Decimal,
        years: int,
        compounds_per_year: int = 1,
    ) -> dict:
        """Future Value — what will today's sum be worth later?"""
        r = float(annual_rate / 100) / compounds_per_year
        n = years * compounds_per_year
        fv = float(present_value) * (1 + r) ** n

        return {
            "present_value": str(present_value),
            "future_value": str(Decimal(str(fv)).quantize(TWO_DP)),
            "annual_rate_pct": str(annual_rate),
            "years": years,
            "growth": str(Decimal(str(fv - float(present_value))).quantize(TWO_DP)),
        }

    def irr(self, cash_flows: list[Decimal], max_iterations: int = 1000) -> dict:
        """Internal Rate of Return using Newton-Raphson.

        cash_flows[0] is typically negative (initial investment).
        """
        flows = [float(cf) for cf in cash_flows]

        # Newton-Raphson
        guess = 0.1
        for _ in range(max_iterations):
            npv = sum(f / (1 + guess) ** i for i, f in enumerate(flows))
            dnpv = sum(-i * f / (1 + guess) ** (i + 1) for i, f in enumerate(flows))
            if abs(dnpv) < 1e-12:
                break
            new_guess = guess - npv / dnpv
            if abs(new_guess - guess) < 1e-10:
                guess = new_guess
                break
            guess = new_guess

        return {
            "irr_pct": str(Decimal(str(guess * 100)).quantize(TWO_DP)),
            "cash_flows": [str(cf) for cf in cash_flows],
            "periods": len(cash_flows),
        }


class InvoiceCalculator:
    """Invoice and payment term calculations.

    Every bookkeeper does this math multiple times a day:
    - GST inclusive ↔ exclusive
    - Early payment discounts (2/10 net 30)
    - Late payment interest
    """

    def gst_calculation(
        self,
        amount: Decimal,
        rate: Decimal = Decimal("10"),
        is_inclusive: bool = False,
    ) -> dict:
        """Convert between GST/VAT inclusive and exclusive amounts."""
        rate_decimal = rate / 100

        if is_inclusive:
            exclusive = (amount / (1 + rate_decimal)).quantize(TWO_DP)
            gst = (amount - exclusive).quantize(TWO_DP)
            inclusive = amount
        else:
            exclusive = amount
            gst = (amount * rate_decimal).quantize(TWO_DP)
            inclusive = (amount + gst).quantize(TWO_DP)

        return {
            "exclusive": str(exclusive),
            "gst_amount": str(gst),
            "inclusive": str(inclusive),
            "rate_pct": str(rate),
            "input_was": "inclusive" if is_inclusive else "exclusive",
        }

    def early_payment_discount(
        self,
        invoice_amount: Decimal,
        discount_pct: Decimal = Decimal("2"),
        discount_days: int = 10,
        net_days: int = 30,
    ) -> dict:
        """Calculate early payment discount (e.g., 2/10 net 30).

        Also shows the annualized cost of NOT taking the discount —
        because that's what a smart accountant checks.
        """
        discount = (invoice_amount * discount_pct / 100).quantize(TWO_DP)
        pay_early = (invoice_amount - discount).quantize(TWO_DP)

        # Annualized cost of not taking the discount
        lost_days = net_days - discount_days
        if lost_days > 0:
            annualized_rate = float(discount_pct) / float(100 - float(discount_pct)) * (365 / lost_days) * 100
        else:
            annualized_rate = 0.0

        return {
            "invoice_amount": str(invoice_amount),
            "terms": f"{discount_pct}/{discount_days} net {net_days}",
            "discount_amount": str(discount),
            "pay_if_early": str(pay_early),
            "pay_if_on_time": str(invoice_amount),
            "savings": str(discount),
            "annualized_cost_of_not_taking_pct": round(annualized_rate, 2),
            "recommendation": (
                "Take the discount" if annualized_rate > 10
                else "Consider taking the discount" if annualized_rate > 5
                else "Discount is minimal — pay on standard terms"
            ),
        }

    def late_payment_interest(
        self,
        invoice_amount: Decimal,
        annual_rate: Decimal,
        days_overdue: int,
    ) -> dict:
        """Calculate late payment interest / penalty."""
        daily_rate = annual_rate / 365
        interest = (invoice_amount * daily_rate / 100 * days_overdue).quantize(TWO_DP)
        total = (invoice_amount + interest).quantize(TWO_DP)

        return {
            "invoice_amount": str(invoice_amount),
            "annual_rate_pct": str(annual_rate),
            "days_overdue": days_overdue,
            "interest_charged": str(interest),
            "total_due": str(total),
        }


class DepreciationQuickCalc:
    """Quick depreciation calculator — one asset, instant answer.

    Different from the audit engine (which verifies entire registers).
    This is for the bookkeeper who needs a number NOW.
    """

    def calculate(
        self,
        cost: Decimal,
        salvage: Decimal,
        life_years: int,
        method: str = "straight_line",
        year: int | None = None,
    ) -> dict:
        """Quick depreciation for a single asset."""
        depreciable = cost - salvage

        if method == "straight_line":
            annual = (depreciable / life_years).quantize(TWO_DP)
            rate = Decimal(str(round(100 / life_years, 2)))
        elif method == "diminishing_value":
            rate = (Decimal("1") - (salvage / cost) ** (Decimal("1") / life_years)).quantize(Decimal("0.0001")) * 100
            if year and year >= 1:
                carrying = cost
                for _ in range(year - 1):
                    carrying -= (carrying * rate / 100).quantize(TWO_DP)
                annual = (carrying * rate / 100).quantize(TWO_DP)
            else:
                annual = (cost * rate / 100).quantize(TWO_DP)
        else:
            annual = (depreciable / life_years).quantize(TWO_DP)
            rate = Decimal(str(round(100 / life_years, 2)))

        monthly = (annual / 12).quantize(TWO_DP)
        daily = (annual / 365).quantize(Decimal("0.0001"))

        return {
            "cost": str(cost),
            "salvage_value": str(salvage),
            "useful_life": f"{life_years} years",
            "method": method.replace("_", " ").title(),
            "annual_depreciation": str(annual),
            "monthly_depreciation": str(monthly),
            "daily_depreciation": str(daily),
            "rate_pct": str(rate),
        }


class RatioCalculator:
    """Financial ratio calculator — quick inputs, instant ratios.

    Accountants calculate these constantly. Give them a fast tool
    instead of building a spreadsheet every time.
    """

    def calculate_all(
        self,
        current_assets: Decimal = Decimal("0"),
        current_liabilities: Decimal = Decimal("0"),
        cash: Decimal = Decimal("0"),
        receivables: Decimal = Decimal("0"),
        inventory: Decimal = Decimal("0"),
        total_assets: Decimal = Decimal("0"),
        total_liabilities: Decimal = Decimal("0"),
        equity: Decimal = Decimal("0"),
        revenue: Decimal = Decimal("0"),
        net_income: Decimal = Decimal("0"),
        ebit: Decimal = Decimal("0"),
        interest_expense: Decimal = Decimal("0"),
        cogs: Decimal = Decimal("0"),
    ) -> dict:
        """Calculate all applicable financial ratios from provided inputs."""
        ratios = {}

        # Liquidity
        if current_liabilities > 0:
            cr = (current_assets / current_liabilities).quantize(TWO_DP)
            ratios["current_ratio"] = {
                "value": str(cr),
                "formula": "Current Assets / Current Liabilities",
                "interpretation": "Healthy" if cr >= Decimal("1.5") else "Adequate" if cr >= Decimal("1") else "Low — may struggle to pay short-term debts",
            }

            quick_assets = current_assets - inventory
            qr = (quick_assets / current_liabilities).quantize(TWO_DP)
            ratios["quick_ratio"] = {
                "value": str(qr),
                "formula": "(Current Assets - Inventory) / Current Liabilities",
                "interpretation": "Strong" if qr >= Decimal("1") else "Weak — relies on inventory to meet obligations",
            }

            cash_ratio = (cash / current_liabilities).quantize(TWO_DP)
            ratios["cash_ratio"] = {
                "value": str(cash_ratio),
                "formula": "Cash / Current Liabilities",
                "interpretation": "Strong cash position" if cash_ratio >= Decimal("0.5") else "Low cash coverage",
            }

        # Leverage
        if equity > 0:
            de = (total_liabilities / equity).quantize(TWO_DP)
            ratios["debt_to_equity"] = {
                "value": str(de),
                "formula": "Total Liabilities / Equity",
                "interpretation": "Conservative" if de < Decimal("1") else "Moderate" if de < Decimal("2") else "Highly leveraged",
            }
        if total_assets > 0:
            da = (total_liabilities / total_assets).quantize(TWO_DP)
            ratios["debt_to_assets"] = {
                "value": str(da),
                "formula": "Total Liabilities / Total Assets",
                "interpretation": f"{int(float(da) * 100)}% of assets funded by debt",
            }

        # Profitability
        if revenue > 0:
            npm = (net_income / revenue * 100).quantize(TWO_DP)
            ratios["net_profit_margin"] = {
                "value": f"{npm}%",
                "formula": "Net Income / Revenue × 100",
                "interpretation": "Healthy margin" if npm > Decimal("10") else "Tight margin" if npm > Decimal("5") else "Very thin — watch costs closely",
            }
            gpm = ((revenue - cogs) / revenue * 100).quantize(TWO_DP) if cogs else None
            if gpm is not None:
                ratios["gross_profit_margin"] = {
                    "value": f"{gpm}%",
                    "formula": "(Revenue - COGS) / Revenue × 100",
                }

        if total_assets > 0 and net_income:
            roa = (net_income / total_assets * 100).quantize(TWO_DP)
            ratios["return_on_assets"] = {
                "value": f"{roa}%",
                "formula": "Net Income / Total Assets × 100",
            }
        if equity > 0 and net_income:
            roe = (net_income / equity * 100).quantize(TWO_DP)
            ratios["return_on_equity"] = {
                "value": f"{roe}%",
                "formula": "Net Income / Equity × 100",
            }

        # Coverage
        if interest_expense > 0 and ebit:
            icr = (ebit / interest_expense).quantize(TWO_DP)
            ratios["interest_coverage"] = {
                "value": str(icr),
                "formula": "EBIT / Interest Expense",
                "interpretation": "Comfortable" if icr > Decimal("3") else "Tight" if icr > Decimal("1.5") else "Danger — may not cover interest",
            }

        return {
            "ratios": ratios,
            "count": len(ratios),
        }

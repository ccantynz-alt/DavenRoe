"""Payroll Specialist Engine.

Multi-jurisdiction payroll calculations: PAYG (AU), PAYE (NZ/UK),
federal/state withholding (US), leave accruals, termination pay.
"""

from decimal import Decimal


class TerminationPayEngine:
    """Calculates termination/redundancy entitlements.

    Getting termination pay wrong leads to Fair Work claims (AU),
    employment tribunal cases (UK/NZ), or DOL complaints (US).
    """

    def calculate_termination(
        self,
        annual_salary: Decimal,
        years_of_service: Decimal,
        unused_annual_leave_hours: Decimal = Decimal("0"),
        unused_long_service_leave_hours: Decimal = Decimal("0"),
        hourly_rate: Decimal | None = None,
        notice_weeks: int | None = None,
        is_redundancy: bool = False,
        jurisdiction: str = "AU",
    ) -> dict:
        """Calculate full termination/redundancy payout."""
        weekly_rate = (annual_salary / 52).quantize(Decimal("0.01"))
        if not hourly_rate:
            hourly_rate = (annual_salary / 2080).quantize(Decimal("0.01"))  # 40hrs * 52 weeks

        components = []

        # Notice period
        if notice_weeks is None:
            notice_weeks = self._minimum_notice(years_of_service, jurisdiction)
        notice_pay = (weekly_rate * notice_weeks).quantize(Decimal("0.01"))
        components.append({
            "component": "Notice Period",
            "weeks": notice_weeks,
            "amount": str(notice_pay),
        })

        # Redundancy pay (if applicable)
        redundancy_pay = Decimal("0")
        if is_redundancy:
            redundancy_weeks = self._redundancy_weeks(years_of_service, jurisdiction)
            redundancy_pay = (weekly_rate * redundancy_weeks).quantize(Decimal("0.01"))
            components.append({
                "component": "Redundancy Pay",
                "weeks": redundancy_weeks,
                "amount": str(redundancy_pay),
            })

        # Unused annual leave
        annual_leave_pay = (unused_annual_leave_hours * hourly_rate).quantize(Decimal("0.01"))
        if annual_leave_pay > 0:
            components.append({
                "component": "Unused Annual Leave",
                "hours": str(unused_annual_leave_hours),
                "amount": str(annual_leave_pay),
            })

        # Long service leave (AU/NZ)
        lsl_pay = Decimal("0")
        if unused_long_service_leave_hours > 0 and jurisdiction in ("AU", "NZ"):
            lsl_pay = (unused_long_service_leave_hours * hourly_rate).quantize(Decimal("0.01"))
            components.append({
                "component": "Long Service Leave",
                "hours": str(unused_long_service_leave_hours),
                "amount": str(lsl_pay),
            })

        total = notice_pay + redundancy_pay + annual_leave_pay + lsl_pay

        return {
            "status": "complete",
            "jurisdiction": jurisdiction,
            "annual_salary": str(annual_salary),
            "years_of_service": str(years_of_service),
            "is_redundancy": is_redundancy,
            "components": components,
            "total_payout": str(total),
            "tax_treatment": self._tax_treatment(jurisdiction, is_redundancy),
        }

    @staticmethod
    def _minimum_notice(years: Decimal, jurisdiction: str) -> int:
        """Minimum notice period by jurisdiction."""
        y = float(years)
        if jurisdiction == "AU":
            # Fair Work Act 2009 s117
            if y < 1: return 1
            if y < 3: return 2
            if y < 5: return 3
            return 4
        elif jurisdiction == "NZ":
            return max(1, min(4, int(y)))
        elif jurisdiction == "GB":
            if y < 2: return 1
            return min(12, int(y))
        else:  # US — at-will, no statutory minimum
            return 0

    @staticmethod
    def _redundancy_weeks(years: Decimal, jurisdiction: str) -> int:
        """Redundancy pay weeks by jurisdiction (AU NES)."""
        y = float(years)
        if jurisdiction == "AU":
            # National Employment Standards
            if y < 1: return 0
            if y < 2: return 4
            if y < 3: return 6
            if y < 4: return 7
            if y < 5: return 8
            if y < 6: return 10
            if y < 7: return 11
            if y < 8: return 13
            if y < 9: return 14
            if y < 10: return 16
            return 12  # 10+ years
        elif jurisdiction == "GB":
            # Statutory redundancy (UK) — simplified
            return min(30, int(y * 1.5))
        return 0

    @staticmethod
    def _tax_treatment(jurisdiction: str, is_redundancy: bool) -> str:
        if jurisdiction == "AU":
            if is_redundancy:
                return "Genuine redundancy payments up to the tax-free limit are exempt. Excess taxed as ETP (Employment Termination Payment)."
            return "Employment Termination Payment (ETP) — concessional tax rates may apply depending on components."
        elif jurisdiction == "NZ":
            return "Redundancy payments are taxable as employment income."
        elif jurisdiction == "GB":
            return "First GBP 30,000 of statutory redundancy is tax-free. Excess taxed as employment income."
        return "Consult local tax laws for termination payment treatment."


class LeaveAccrualEngine:
    """Leave accrual calculations across jurisdictions."""

    def calculate_accrual(
        self,
        annual_salary: Decimal,
        years_of_service: Decimal,
        leave_type: str = "annual",
        hours_per_week: Decimal = Decimal("38"),
        jurisdiction: str = "AU",
    ) -> dict:
        """Calculate leave accrual balance and liability."""
        hourly_rate = (annual_salary / (hours_per_week * 52)).quantize(Decimal("0.01"))

        entitlements = self._entitlement(leave_type, jurisdiction, years_of_service)
        accrued_hours = (entitlements["hours_per_year"] * years_of_service).quantize(Decimal("0.01"))
        liability = (accrued_hours * hourly_rate).quantize(Decimal("0.01"))

        return {
            "leave_type": leave_type,
            "jurisdiction": jurisdiction,
            "entitlement_hours_per_year": str(entitlements["hours_per_year"]),
            "entitlement_description": entitlements["description"],
            "years_of_service": str(years_of_service),
            "accrued_hours": str(accrued_hours),
            "accrued_days": str((accrued_hours / (hours_per_week / 5)).quantize(Decimal("0.1"))),
            "hourly_rate": str(hourly_rate),
            "liability": str(liability),
            "legislation": entitlements["legislation"],
        }

    @staticmethod
    def _entitlement(leave_type: str, jurisdiction: str, years: Decimal) -> dict:
        """Get leave entitlement by type and jurisdiction."""
        if leave_type == "annual":
            if jurisdiction == "AU":
                return {"hours_per_year": Decimal("152"), "description": "4 weeks (20 days)", "legislation": "Fair Work Act 2009 s87"}
            elif jurisdiction == "NZ":
                return {"hours_per_year": Decimal("160"), "description": "4 weeks (20 days) after 12 months", "legislation": "Holidays Act 2003 s16"}
            elif jurisdiction == "GB":
                return {"hours_per_year": Decimal("224"), "description": "5.6 weeks (28 days including bank holidays)", "legislation": "Working Time Regulations 1998"}
            else:
                return {"hours_per_year": Decimal("0"), "description": "No federal mandate (US)", "legislation": "N/A — employer policy"}
        elif leave_type == "long_service":
            if jurisdiction == "AU":
                if years >= 7:
                    return {"hours_per_year": Decimal("65.7"), "description": "8.67 weeks after 10 years (pro-rata from 7)", "legislation": "Varies by state — e.g., Long Service Leave Act 2018 (VIC)"}
                return {"hours_per_year": Decimal("0"), "description": "Not yet eligible (requires 7+ years)", "legislation": "Varies by state"}
        elif leave_type == "personal":
            if jurisdiction == "AU":
                return {"hours_per_year": Decimal("76"), "description": "10 days per year", "legislation": "Fair Work Act 2009 s96"}
            elif jurisdiction == "NZ":
                return {"hours_per_year": Decimal("40"), "description": "5 days after 6 months", "legislation": "Holidays Act 2003 s65"}

        return {"hours_per_year": Decimal("0"), "description": "Not applicable", "legislation": "N/A"}

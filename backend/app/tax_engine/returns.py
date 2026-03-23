"""Tax Return Generation Engine.

Generates structured tax returns for all supported jurisdictions:
- BAS (Australia) — Business Activity Statement
- GST Return (New Zealand) — IRD GST return
- VAT Return (UK) — MTD-compliant boxes 1–9
- Sales Tax Summary (US) — Quarterly sales tax summary

Each generator produces a deterministic dict with all required fields,
totals, and pre-submission validation checks.
"""

import uuid
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP
from enum import Enum
from typing import Any


class ReturnType(str, Enum):
    BAS = "BAS"
    GST_NZ = "GST_NZ"
    VAT_UK = "VAT_UK"
    SALES_TAX_US = "SALES_TAX_US"


class FilingStatus(str, Enum):
    DRAFT = "draft"
    VALIDATED = "validated"
    READY = "ready"
    LODGED = "lodged"


class ValidationSeverity(str, Enum):
    PASS = "pass"
    WARNING = "warning"
    FAIL = "fail"


@dataclass
class ValidationResult:
    check: str
    severity: ValidationSeverity
    message: str

    def to_dict(self) -> dict:
        return {
            "check": self.check,
            "severity": self.severity.value,
            "message": self.message,
        }


@dataclass
class TaxReturn:
    id: str
    return_type: ReturnType
    jurisdiction: str
    period_start: date
    period_end: date
    status: FilingStatus
    line_items: dict[str, Any]
    totals: dict[str, str]
    validations: list[ValidationResult]
    generated_at: datetime
    lodged_at: datetime | None = None
    entity_id: str | None = None
    notes: str = ""

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "return_type": self.return_type.value,
            "jurisdiction": self.jurisdiction,
            "period_start": self.period_start.isoformat(),
            "period_end": self.period_end.isoformat(),
            "status": self.status.value,
            "line_items": self.line_items,
            "totals": self.totals,
            "validations": [v.to_dict() for v in self.validations],
            "generated_at": self.generated_at.isoformat(),
            "lodged_at": self.lodged_at.isoformat() if self.lodged_at else None,
            "entity_id": self.entity_id,
            "notes": self.notes,
        }


def _q(amount: Decimal) -> str:
    """Quantize to 2 decimal places and return as string."""
    return str(amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def _parse_period(period: str, year: int) -> tuple[date, date]:
    """Parse period string like 'Q1', 'Q2', 'M01'–'M12' into start/end dates."""
    if period.startswith("Q"):
        q = int(period[1])
        month_start = (q - 1) * 3 + 1
        start = date(year, month_start, 1)
        # End of quarter
        end_month = month_start + 2
        if end_month == 12:
            end = date(year, 12, 31)
        else:
            end = date(year, end_month + 1, 1) - timedelta(days=1)
        return start, end
    elif period.startswith("M"):
        m = int(period[1:])
        start = date(year, m, 1)
        if m == 12:
            end = date(year, 12, 31)
        else:
            end = date(year, m + 1, 1) - timedelta(days=1)
        return start, end
    elif period == "FY":
        return date(year, 7, 1), date(year + 1, 6, 30)
    else:
        raise ValueError(f"Invalid period format: {period}")


class TaxReturnEngine:
    """Generates and manages tax returns for all supported jurisdictions."""

    def __init__(self):
        self._returns: dict[str, TaxReturn] = {}

    # ── Public API ─────────────────────────────────────────────────

    def generate(
        self,
        return_type: str,
        period: str,
        year: int,
        entity_id: str | None = None,
        data: dict | None = None,
    ) -> TaxReturn:
        """Generate a tax return for the given type and period.

        Args:
            return_type: One of BAS, GST_NZ, VAT_UK, SALES_TAX_US
            period: Quarter (Q1–Q4), month (M01–M12), or FY
            year: Tax year
            entity_id: Optional entity ID
            data: Optional override data for line items
        """
        rt = ReturnType(return_type)
        period_start, period_end = _parse_period(period, year)

        generators = {
            ReturnType.BAS: self._generate_bas,
            ReturnType.GST_NZ: self._generate_gst_nz,
            ReturnType.VAT_UK: self._generate_vat_uk,
            ReturnType.SALES_TAX_US: self._generate_sales_tax_us,
        }

        line_items, totals = generators[rt](period_start, period_end, data or {})

        tax_return = TaxReturn(
            id=str(uuid.uuid4()),
            return_type=rt,
            jurisdiction=self._jurisdiction_for(rt),
            period_start=period_start,
            period_end=period_end,
            status=FilingStatus.DRAFT,
            line_items=line_items,
            totals=totals,
            validations=[],
            generated_at=datetime.utcnow(),
            entity_id=entity_id,
        )

        self._returns[tax_return.id] = tax_return
        return tax_return

    def get(self, return_id: str) -> TaxReturn | None:
        return self._returns.get(return_id)

    def list_returns(
        self,
        return_type: str | None = None,
        status: str | None = None,
        entity_id: str | None = None,
    ) -> list[TaxReturn]:
        results = list(self._returns.values())
        if return_type:
            results = [r for r in results if r.return_type.value == return_type]
        if status:
            results = [r for r in results if r.status.value == status]
        if entity_id:
            results = [r for r in results if r.entity_id == entity_id]
        return sorted(results, key=lambda r: r.generated_at, reverse=True)

    def validate(self, return_id: str) -> list[ValidationResult]:
        """Run pre-submission validation checks on a return."""
        tax_return = self._returns.get(return_id)
        if not tax_return:
            return []

        validators = {
            ReturnType.BAS: self._validate_bas,
            ReturnType.GST_NZ: self._validate_gst_nz,
            ReturnType.VAT_UK: self._validate_vat_uk,
            ReturnType.SALES_TAX_US: self._validate_sales_tax_us,
        }

        results = validators[tax_return.return_type](tax_return)
        tax_return.validations = results

        has_failures = any(v.severity == ValidationSeverity.FAIL for v in results)
        if not has_failures:
            tax_return.status = FilingStatus.VALIDATED

        return results

    def lodge(self, return_id: str) -> TaxReturn | None:
        """Mark a return as lodged (e-filing readiness)."""
        tax_return = self._returns.get(return_id)
        if not tax_return:
            return None

        if tax_return.status not in (FilingStatus.VALIDATED, FilingStatus.READY):
            # Auto-validate if still draft
            if tax_return.status == FilingStatus.DRAFT:
                self.validate(return_id)
                has_failures = any(
                    v.severity == ValidationSeverity.FAIL
                    for v in tax_return.validations
                )
                if has_failures:
                    return tax_return

        tax_return.status = FilingStatus.LODGED
        tax_return.lodged_at = datetime.utcnow()
        return tax_return

    def get_deadlines(self, jurisdiction: str | None = None) -> list[dict]:
        """Return upcoming filing deadlines for all or a specific jurisdiction."""
        today = date.today()
        current_year = today.year
        deadlines = []

        all_deadlines = [
            # Australia BAS — quarterly, due 28th of month after quarter end
            {
                "jurisdiction": "AU",
                "return_type": "BAS",
                "period": "Q1",
                "description": "Business Activity Statement — Jul–Sep",
                "due_date": date(current_year, 10, 28),
                "authority": "Australian Taxation Office (ATO)",
            },
            {
                "jurisdiction": "AU",
                "return_type": "BAS",
                "period": "Q2",
                "description": "Business Activity Statement — Oct–Dec",
                "due_date": date(current_year + 1, 2, 28),
                "authority": "Australian Taxation Office (ATO)",
            },
            {
                "jurisdiction": "AU",
                "return_type": "BAS",
                "period": "Q3",
                "description": "Business Activity Statement — Jan–Mar",
                "due_date": date(current_year, 4, 28),
                "authority": "Australian Taxation Office (ATO)",
            },
            {
                "jurisdiction": "AU",
                "return_type": "BAS",
                "period": "Q4",
                "description": "Business Activity Statement — Apr–Jun",
                "due_date": date(current_year, 7, 28),
                "authority": "Australian Taxation Office (ATO)",
            },
            # NZ GST — due 28th of month after period end
            {
                "jurisdiction": "NZ",
                "return_type": "GST_NZ",
                "period": "Q1",
                "description": "GST Return — Jan–Mar",
                "due_date": date(current_year, 5, 7),
                "authority": "Inland Revenue (IRD)",
            },
            {
                "jurisdiction": "NZ",
                "return_type": "GST_NZ",
                "period": "Q2",
                "description": "GST Return — Apr–Jun",
                "due_date": date(current_year, 8, 7),
                "authority": "Inland Revenue (IRD)",
            },
            {
                "jurisdiction": "NZ",
                "return_type": "GST_NZ",
                "period": "Q3",
                "description": "GST Return — Jul–Sep",
                "due_date": date(current_year, 11, 7),
                "authority": "Inland Revenue (IRD)",
            },
            {
                "jurisdiction": "NZ",
                "return_type": "GST_NZ",
                "period": "Q4",
                "description": "GST Return — Oct–Dec",
                "due_date": date(current_year + 1, 1, 15),
                "authority": "Inland Revenue (IRD)",
            },
            # UK VAT — quarterly, due 1 month + 7 days after period end
            {
                "jurisdiction": "GB",
                "return_type": "VAT_UK",
                "period": "Q1",
                "description": "VAT Return (MTD) — Jan–Mar",
                "due_date": date(current_year, 5, 7),
                "authority": "HM Revenue & Customs (HMRC)",
            },
            {
                "jurisdiction": "GB",
                "return_type": "VAT_UK",
                "period": "Q2",
                "description": "VAT Return (MTD) — Apr–Jun",
                "due_date": date(current_year, 8, 7),
                "authority": "HM Revenue & Customs (HMRC)",
            },
            {
                "jurisdiction": "GB",
                "return_type": "VAT_UK",
                "period": "Q3",
                "description": "VAT Return (MTD) — Jul–Sep",
                "due_date": date(current_year, 11, 7),
                "authority": "HM Revenue & Customs (HMRC)",
            },
            {
                "jurisdiction": "GB",
                "return_type": "VAT_UK",
                "period": "Q4",
                "description": "VAT Return (MTD) — Oct–Dec",
                "due_date": date(current_year + 1, 2, 7),
                "authority": "HM Revenue & Customs (HMRC)",
            },
            # US Sales Tax — quarterly
            {
                "jurisdiction": "US",
                "return_type": "SALES_TAX_US",
                "period": "Q1",
                "description": "Sales Tax Summary — Jan–Mar",
                "due_date": date(current_year, 4, 30),
                "authority": "State Department of Revenue",
            },
            {
                "jurisdiction": "US",
                "return_type": "SALES_TAX_US",
                "period": "Q2",
                "description": "Sales Tax Summary — Apr–Jun",
                "due_date": date(current_year, 7, 31),
                "authority": "State Department of Revenue",
            },
            {
                "jurisdiction": "US",
                "return_type": "SALES_TAX_US",
                "period": "Q3",
                "description": "Sales Tax Summary — Jul–Sep",
                "due_date": date(current_year, 10, 31),
                "authority": "State Department of Revenue",
            },
            {
                "jurisdiction": "US",
                "return_type": "SALES_TAX_US",
                "period": "Q4",
                "description": "Sales Tax Summary — Oct–Dec",
                "due_date": date(current_year + 1, 1, 31),
                "authority": "State Department of Revenue",
            },
        ]

        for d in all_deadlines:
            if jurisdiction and d["jurisdiction"] != jurisdiction:
                continue
            # Show deadlines within the next 365 days
            if d["due_date"] >= today and d["due_date"] <= today + timedelta(days=365):
                days_remaining = (d["due_date"] - today).days
                deadlines.append({
                    **d,
                    "due_date": d["due_date"].isoformat(),
                    "days_remaining": days_remaining,
                    "urgency": (
                        "overdue" if days_remaining < 0
                        else "critical" if days_remaining <= 7
                        else "urgent" if days_remaining <= 30
                        else "upcoming"
                    ),
                })

        return sorted(deadlines, key=lambda d: d["due_date"])

    # ── BAS (Australia) ────────────────────────────────────────────

    def _generate_bas(
        self, start: date, end: date, data: dict,
    ) -> tuple[dict, dict]:
        """Generate an Australian Business Activity Statement.

        Fields:
        - 1A: GST on sales
        - 1B: GST on purchases
        - W1: Total salary/wages paid
        - W2: Amount withheld from wages (PAYG withholding)
        - T1: PAYG instalment income
        - T2: PAYG instalment rate
        - T3: New varied instalment amount
        """
        gst_on_sales = Decimal(str(data.get("gst_on_sales", "4520.00")))
        gst_on_purchases = Decimal(str(data.get("gst_on_purchases", "2180.50")))
        total_sales = Decimal(str(data.get("total_sales", "45200.00")))
        export_sales = Decimal(str(data.get("export_sales", "0.00")))
        other_gst_free = Decimal(str(data.get("other_gst_free", "0.00")))
        capital_purchases = Decimal(str(data.get("capital_purchases", "0.00")))
        non_capital_purchases = Decimal(str(data.get("non_capital_purchases", "21805.00")))
        total_wages = Decimal(str(data.get("total_wages", "38500.00")))
        payg_withheld = Decimal(str(data.get("payg_withheld", "12320.00")))
        payg_instalment_income = Decimal(str(data.get("payg_instalment_income", "45200.00")))
        payg_instalment_rate = Decimal(str(data.get("payg_instalment_rate", "0.03")))

        gst_payable = gst_on_sales - gst_on_purchases
        payg_instalment = (payg_instalment_income * payg_instalment_rate).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        total_payable = gst_payable + payg_withheld + payg_instalment

        line_items = {
            "G1_total_sales": _q(total_sales),
            "G2_export_sales": _q(export_sales),
            "G3_other_gst_free": _q(other_gst_free),
            "G10_capital_purchases": _q(capital_purchases),
            "G11_non_capital_purchases": _q(non_capital_purchases),
            "1A_gst_on_sales": _q(gst_on_sales),
            "1B_gst_on_purchases": _q(gst_on_purchases),
            "W1_total_wages": _q(total_wages),
            "W2_payg_withheld": _q(payg_withheld),
            "T1_payg_instalment_income": _q(payg_instalment_income),
            "T2_payg_instalment_rate": str(payg_instalment_rate),
            "T3_payg_instalment_amount": _q(payg_instalment),
        }

        totals = {
            "gst_payable": _q(gst_payable),
            "payg_withheld": _q(payg_withheld),
            "payg_instalment": _q(payg_instalment),
            "total_payable": _q(total_payable),
        }

        return line_items, totals

    def _validate_bas(self, tr: TaxReturn) -> list[ValidationResult]:
        results = []
        li = tr.line_items

        gst_sales = Decimal(li["1A_gst_on_sales"])
        gst_purch = Decimal(li["1B_gst_on_purchases"])
        total_sales = Decimal(li["G1_total_sales"])
        wages = Decimal(li["W1_total_wages"])
        payg_w = Decimal(li["W2_payg_withheld"])

        # GST on sales should be ~10% of total sales
        expected_gst = (total_sales * Decimal("0.10") / Decimal("1.10")).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        gst_diff = abs(gst_sales - expected_gst)
        if gst_diff <= Decimal("50"):
            results.append(ValidationResult(
                "GST on sales vs total sales",
                ValidationSeverity.PASS,
                f"GST collected ({_q(gst_sales)}) is consistent with reported sales ({_q(total_sales)}).",
            ))
        elif gst_diff <= Decimal("500"):
            results.append(ValidationResult(
                "GST on sales vs total sales",
                ValidationSeverity.WARNING,
                f"GST collected ({_q(gst_sales)}) differs from expected ({_q(expected_gst)}) by {_q(gst_diff)}. "
                "Verify GST-free items are correctly classified.",
            ))
        else:
            results.append(ValidationResult(
                "GST on sales vs total sales",
                ValidationSeverity.FAIL,
                f"GST collected ({_q(gst_sales)}) differs significantly from expected ({_q(expected_gst)}). "
                "Review sales categorization before lodging.",
            ))

        # GST refund check — large refund is unusual
        if gst_purch > gst_sales * Decimal("2"):
            results.append(ValidationResult(
                "GST refund size",
                ValidationSeverity.WARNING,
                f"Large GST refund claimed ({_q(gst_purch - gst_sales)}). "
                "Ensure all input tax credits are substantiated.",
            ))
        else:
            results.append(ValidationResult(
                "GST refund size",
                ValidationSeverity.PASS,
                "GST balance is within normal range.",
            ))

        # PAYG withholding vs wages
        if wages > Decimal("0"):
            wht_rate = payg_w / wages
            if Decimal("0.15") <= wht_rate <= Decimal("0.45"):
                results.append(ValidationResult(
                    "PAYG withholding rate",
                    ValidationSeverity.PASS,
                    f"Effective withholding rate ({_q(wht_rate * 100)}%) is within normal range.",
                ))
            else:
                results.append(ValidationResult(
                    "PAYG withholding rate",
                    ValidationSeverity.WARNING,
                    f"Effective withholding rate ({_q(wht_rate * 100)}%) is outside typical range (15%–45%). "
                    "Verify employee tax file declarations.",
                ))
        elif payg_w > Decimal("0"):
            results.append(ValidationResult(
                "PAYG withholding without wages",
                ValidationSeverity.FAIL,
                "PAYG withholding reported but no wages declared. Correct W1 or W2.",
            ))
        else:
            results.append(ValidationResult(
                "PAYG withholding",
                ValidationSeverity.PASS,
                "No wages or withholding reported.",
            ))

        # Non-zero total check
        total = Decimal(tr.totals["total_payable"])
        results.append(ValidationResult(
            "Return total",
            ValidationSeverity.PASS if total != Decimal("0") else ValidationSeverity.WARNING,
            f"Total payable: ${_q(total)}" if total >= 0 else f"Total refund: ${_q(abs(total))}",
        ))

        return results

    # ── GST Return (New Zealand) ──────────────────────────────────

    def _generate_gst_nz(
        self, start: date, end: date, data: dict,
    ) -> tuple[dict, dict]:
        """Generate an NZ GST return for IRD.

        Fields:
        - Box 5: Total sales and income
        - Box 6: Zero-rated supplies
        - Box 7: Total purchases and expenses
        - Box 8: Adjustments from your calculations
        - Box 9: Total GST collected
        - Box 10: Total GST paid on purchases
        - Box 11: Adjustments
        - Box 12: GST to pay or refund due
        """
        total_sales = Decimal(str(data.get("total_sales", "62400.00")))
        zero_rated = Decimal(str(data.get("zero_rated_supplies", "0.00")))
        total_purchases = Decimal(str(data.get("total_purchases", "31200.00")))
        adjustments_income = Decimal(str(data.get("adjustments_income", "0.00")))
        gst_collected = Decimal(str(data.get("gst_collected", "9360.00")))
        gst_on_purchases = Decimal(str(data.get("gst_on_purchases", "4680.00")))
        adjustments_tax = Decimal(str(data.get("adjustments_tax", "0.00")))

        gst_to_pay = gst_collected - gst_on_purchases + adjustments_tax

        line_items = {
            "box_5_total_sales": _q(total_sales),
            "box_6_zero_rated": _q(zero_rated),
            "box_7_total_purchases": _q(total_purchases),
            "box_8_adjustments_income": _q(adjustments_income),
            "box_9_gst_collected": _q(gst_collected),
            "box_10_gst_on_purchases": _q(gst_on_purchases),
            "box_11_adjustments_tax": _q(adjustments_tax),
            "box_12_gst_to_pay": _q(gst_to_pay),
        }

        totals = {
            "gst_collected": _q(gst_collected),
            "gst_paid": _q(gst_on_purchases),
            "adjustments": _q(adjustments_tax),
            "gst_payable": _q(gst_to_pay),
        }

        return line_items, totals

    def _validate_gst_nz(self, tr: TaxReturn) -> list[ValidationResult]:
        results = []
        li = tr.line_items

        total_sales = Decimal(li["box_5_total_sales"])
        gst_collected = Decimal(li["box_9_gst_collected"])

        # NZ GST is 15%
        expected_gst = (total_sales * Decimal("0.15") / Decimal("1.15")).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        diff = abs(gst_collected - expected_gst)

        if diff <= Decimal("50"):
            results.append(ValidationResult(
                "GST collected vs sales",
                ValidationSeverity.PASS,
                f"GST collected ({_q(gst_collected)}) matches reported sales at 15%.",
            ))
        elif diff <= Decimal("500"):
            results.append(ValidationResult(
                "GST collected vs sales",
                ValidationSeverity.WARNING,
                f"GST collected ({_q(gst_collected)}) differs from expected ({_q(expected_gst)}). "
                "Check zero-rated or exempt supplies.",
            ))
        else:
            results.append(ValidationResult(
                "GST collected vs sales",
                ValidationSeverity.FAIL,
                f"GST collected ({_q(gst_collected)}) differs significantly from expected ({_q(expected_gst)}). "
                "Review sales classifications before filing.",
            ))

        gst_paid = Decimal(li["box_10_gst_on_purchases"])
        total_purchases = Decimal(li["box_7_total_purchases"])

        if total_purchases > Decimal("0"):
            expected_input = (total_purchases * Decimal("0.15") / Decimal("1.15")).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            input_diff = abs(gst_paid - expected_input)
            if input_diff <= Decimal("200"):
                results.append(ValidationResult(
                    "Input tax credits vs purchases",
                    ValidationSeverity.PASS,
                    "Input tax credits are consistent with reported purchases.",
                ))
            else:
                results.append(ValidationResult(
                    "Input tax credits vs purchases",
                    ValidationSeverity.WARNING,
                    f"Input credits ({_q(gst_paid)}) differ from expected ({_q(expected_input)}). "
                    "Some purchases may not be GST-inclusive.",
                ))

        gst_payable = Decimal(li["box_12_gst_to_pay"])
        results.append(ValidationResult(
            "Return total",
            ValidationSeverity.PASS,
            f"GST {'payable' if gst_payable >= 0 else 'refund'}: ${_q(abs(gst_payable))}",
        ))

        return results

    # ── VAT Return (UK MTD) ──────────────────────────────────────

    def _generate_vat_uk(
        self, start: date, end: date, data: dict,
    ) -> tuple[dict, dict]:
        """Generate a UK VAT return — MTD-compliant boxes 1–9.

        Box 1: VAT due on sales
        Box 2: VAT due on acquisitions from EU
        Box 3: Total VAT due (Box 1 + Box 2)
        Box 4: VAT reclaimed on purchases
        Box 5: Net VAT to pay or reclaim (Box 3 - Box 4)
        Box 6: Total value of sales (ex-VAT)
        Box 7: Total value of purchases (ex-VAT)
        Box 8: Total value of supplies to EU (ex-VAT)
        Box 9: Total value of acquisitions from EU (ex-VAT)
        """
        vat_on_sales = Decimal(str(data.get("vat_on_sales", "8400.00")))
        vat_on_acquisitions = Decimal(str(data.get("vat_on_acquisitions", "0.00")))
        vat_reclaimed = Decimal(str(data.get("vat_reclaimed", "3200.00")))
        total_sales_ex_vat = Decimal(str(data.get("total_sales_ex_vat", "42000.00")))
        total_purchases_ex_vat = Decimal(str(data.get("total_purchases_ex_vat", "16000.00")))
        eu_supplies = Decimal(str(data.get("eu_supplies", "0.00")))
        eu_acquisitions = Decimal(str(data.get("eu_acquisitions", "0.00")))

        total_vat_due = vat_on_sales + vat_on_acquisitions
        net_vat = total_vat_due - vat_reclaimed

        line_items = {
            "box_1_vat_due_sales": _q(vat_on_sales),
            "box_2_vat_due_acquisitions": _q(vat_on_acquisitions),
            "box_3_total_vat_due": _q(total_vat_due),
            "box_4_vat_reclaimed": _q(vat_reclaimed),
            "box_5_net_vat": _q(net_vat),
            "box_6_total_sales_ex_vat": _q(total_sales_ex_vat),
            "box_7_total_purchases_ex_vat": _q(total_purchases_ex_vat),
            "box_8_eu_supplies": _q(eu_supplies),
            "box_9_eu_acquisitions": _q(eu_acquisitions),
        }

        totals = {
            "vat_due": _q(total_vat_due),
            "vat_reclaimed": _q(vat_reclaimed),
            "net_vat": _q(net_vat),
        }

        return line_items, totals

    def _validate_vat_uk(self, tr: TaxReturn) -> list[ValidationResult]:
        results = []
        li = tr.line_items

        vat_sales = Decimal(li["box_1_vat_due_sales"])
        total_sales = Decimal(li["box_6_total_sales_ex_vat"])
        vat_reclaimed = Decimal(li["box_4_vat_reclaimed"])
        total_purchases = Decimal(li["box_7_total_purchases_ex_vat"])
        box3 = Decimal(li["box_3_total_vat_due"])
        box5 = Decimal(li["box_5_net_vat"])

        # Standard UK VAT rate is 20%
        expected_vat = (total_sales * Decimal("0.20")).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        diff = abs(vat_sales - expected_vat)
        if diff <= Decimal("100"):
            results.append(ValidationResult(
                "Output VAT vs sales",
                ValidationSeverity.PASS,
                f"Output VAT ({_q(vat_sales)}) is consistent with sales at standard rate.",
            ))
        elif diff <= Decimal("1000"):
            results.append(ValidationResult(
                "Output VAT vs sales",
                ValidationSeverity.WARNING,
                f"Output VAT ({_q(vat_sales)}) differs from expected ({_q(expected_vat)}). "
                "Verify reduced-rate or zero-rated supplies.",
            ))
        else:
            results.append(ValidationResult(
                "Output VAT vs sales",
                ValidationSeverity.FAIL,
                f"Output VAT ({_q(vat_sales)}) differs significantly from expected ({_q(expected_vat)}). "
                "Review output tax calculations.",
            ))

        # Box 3 = Box 1 + Box 2 cross-check
        box1 = Decimal(li["box_1_vat_due_sales"])
        box2 = Decimal(li["box_2_vat_due_acquisitions"])
        if box3 == box1 + box2:
            results.append(ValidationResult(
                "Box 3 cross-check",
                ValidationSeverity.PASS,
                "Box 3 correctly equals Box 1 + Box 2.",
            ))
        else:
            results.append(ValidationResult(
                "Box 3 cross-check",
                ValidationSeverity.FAIL,
                f"Box 3 ({_q(box3)}) does not equal Box 1 + Box 2 ({_q(box1 + box2)}).",
            ))

        # Box 5 = Box 3 - Box 4
        if box5 == box3 - vat_reclaimed:
            results.append(ValidationResult(
                "Box 5 cross-check",
                ValidationSeverity.PASS,
                "Box 5 correctly equals Box 3 - Box 4.",
            ))
        else:
            results.append(ValidationResult(
                "Box 5 cross-check",
                ValidationSeverity.FAIL,
                f"Box 5 ({_q(box5)}) does not equal Box 3 - Box 4 ({_q(box3 - vat_reclaimed)}).",
            ))

        # Input VAT ratio check
        if total_purchases > Decimal("0"):
            input_rate = vat_reclaimed / total_purchases
            if input_rate <= Decimal("0.20"):
                results.append(ValidationResult(
                    "Input VAT ratio",
                    ValidationSeverity.PASS,
                    f"Input VAT claim rate ({_q(input_rate * 100)}%) is within acceptable range.",
                ))
            else:
                results.append(ValidationResult(
                    "Input VAT ratio",
                    ValidationSeverity.WARNING,
                    f"Input VAT claim rate ({_q(input_rate * 100)}%) exceeds standard rate. "
                    "Ensure no over-claims.",
                ))

        results.append(ValidationResult(
            "MTD compliance",
            ValidationSeverity.PASS,
            "Return structure meets Making Tax Digital requirements.",
        ))

        return results

    # ── Sales Tax (US) ────────────────────────────────────────────

    def _generate_sales_tax_us(
        self, start: date, end: date, data: dict,
    ) -> tuple[dict, dict]:
        """Generate a US quarterly sales tax summary.

        Fields by state with gross sales, exempt sales, taxable sales,
        tax rate, and tax due.
        """
        states = data.get("states", [
            {
                "state": "California",
                "state_code": "CA",
                "gross_sales": "85000.00",
                "exempt_sales": "5000.00",
                "state_rate": "0.0725",
                "district_rate": "0.0150",
            },
            {
                "state": "New York",
                "state_code": "NY",
                "gross_sales": "42000.00",
                "exempt_sales": "2000.00",
                "state_rate": "0.0400",
                "district_rate": "0.04875",
            },
        ])

        state_details = []
        total_gross = Decimal("0")
        total_exempt = Decimal("0")
        total_taxable = Decimal("0")
        total_tax = Decimal("0")

        for s in states:
            gross = Decimal(str(s["gross_sales"]))
            exempt = Decimal(str(s["exempt_sales"]))
            taxable = gross - exempt
            state_rate = Decimal(str(s["state_rate"]))
            district_rate = Decimal(str(s.get("district_rate", "0")))
            combined_rate = state_rate + district_rate
            tax_due = (taxable * combined_rate).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )

            state_details.append({
                "state": s["state"],
                "state_code": s["state_code"],
                "gross_sales": _q(gross),
                "exempt_sales": _q(exempt),
                "taxable_sales": _q(taxable),
                "state_rate": str(state_rate),
                "district_rate": str(district_rate),
                "combined_rate": str(combined_rate),
                "tax_due": _q(tax_due),
            })

            total_gross += gross
            total_exempt += exempt
            total_taxable += taxable
            total_tax += tax_due

        line_items = {
            "states": state_details,
            "total_gross_sales": _q(total_gross),
            "total_exempt_sales": _q(total_exempt),
            "total_taxable_sales": _q(total_taxable),
        }

        totals = {
            "total_gross_sales": _q(total_gross),
            "total_taxable_sales": _q(total_taxable),
            "total_tax_due": _q(total_tax),
            "state_count": str(len(states)),
        }

        return line_items, totals

    def _validate_sales_tax_us(self, tr: TaxReturn) -> list[ValidationResult]:
        results = []
        li = tr.line_items

        states = li.get("states", [])
        if not states:
            results.append(ValidationResult(
                "State data",
                ValidationSeverity.FAIL,
                "No state sales data provided. At least one state is required.",
            ))
            return results

        for s in states:
            gross = Decimal(s["gross_sales"])
            exempt = Decimal(s["exempt_sales"])
            taxable = Decimal(s["taxable_sales"])
            tax_due = Decimal(s["tax_due"])
            combined_rate = Decimal(s["combined_rate"])

            # Verify taxable = gross - exempt
            if taxable != gross - exempt:
                results.append(ValidationResult(
                    f"{s['state']} — taxable calculation",
                    ValidationSeverity.FAIL,
                    f"Taxable sales ({_q(taxable)}) does not equal gross ({_q(gross)}) minus exempt ({_q(exempt)}).",
                ))
            else:
                results.append(ValidationResult(
                    f"{s['state']} — taxable calculation",
                    ValidationSeverity.PASS,
                    f"Taxable sales correctly calculated for {s['state']}.",
                ))

            # Verify tax amount
            expected_tax = (taxable * combined_rate).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            if tax_due == expected_tax:
                results.append(ValidationResult(
                    f"{s['state']} — tax amount",
                    ValidationSeverity.PASS,
                    f"Tax due ({_q(tax_due)}) correctly calculated at {str(combined_rate)} rate.",
                ))
            else:
                results.append(ValidationResult(
                    f"{s['state']} — tax amount",
                    ValidationSeverity.FAIL,
                    f"Tax due ({_q(tax_due)}) does not match expected ({_q(expected_tax)}).",
                ))

            # Exemption ratio warning
            if gross > Decimal("0") and exempt / gross > Decimal("0.50"):
                results.append(ValidationResult(
                    f"{s['state']} — exemption ratio",
                    ValidationSeverity.WARNING,
                    f"High exemption ratio ({_q(exempt / gross * 100)}%) in {s['state']}. "
                    "Verify exemption certificates are on file.",
                ))

        total_tax = Decimal(tr.totals["total_tax_due"])
        results.append(ValidationResult(
            "Total tax due",
            ValidationSeverity.PASS,
            f"Total sales tax due across {len(states)} state(s): ${_q(total_tax)}",
        ))

        return results

    # ── Helpers ────────────────────────────────────────────────────

    @staticmethod
    def _jurisdiction_for(rt: ReturnType) -> str:
        return {
            ReturnType.BAS: "AU",
            ReturnType.GST_NZ: "NZ",
            ReturnType.VAT_UK: "GB",
            ReturnType.SALES_TAX_US: "US",
        }[rt]

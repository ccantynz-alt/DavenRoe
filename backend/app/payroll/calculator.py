"""Payroll tax withholding and contribution calculator.

Covers four jurisdictions:
  - AU: PAYG withholding + Superannuation Guarantee (11.5%)
  - NZ: PAYE + KiwiSaver (3-8%)
  - GB: PAYE (basic / higher / additional) + workplace pension
  - US: Federal income tax brackets (2024)

All monetary amounts are in the local currency of the jurisdiction.
Annual figures are used internally; callers provide pay-period gross and
frequency, and the calculator converts accordingly.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from decimal import Decimal, ROUND_HALF_UP
from enum import Enum
from typing import Any

TWO = Decimal("0.01")


class Jurisdiction(str, Enum):
    AU = "AU"
    NZ = "NZ"
    GB = "GB"
    US = "US"


class PayFrequency(str, Enum):
    WEEKLY = "weekly"
    FORTNIGHTLY = "fortnightly"
    MONTHLY = "monthly"


# ---------------------------------------------------------------------------
# Tax tables
# ---------------------------------------------------------------------------

# Australia PAYG 2024-25 resident rates (simplified)
AU_TAX_BRACKETS: list[tuple[Decimal, Decimal, Decimal]] = [
    # (threshold, rate, cumulative_tax_on_prior_brackets)
    (Decimal("18200"), Decimal("0"), Decimal("0")),
    (Decimal("45000"), Decimal("0.16"), Decimal("0")),
    (Decimal("135000"), Decimal("0.30"), Decimal("4288")),
    (Decimal("190000"), Decimal("0.37"), Decimal("31288")),
    (Decimal("999999999"), Decimal("0.45"), Decimal("51638")),
]

AU_SUPER_RATE = Decimal("0.115")  # 11.5% SG rate FY2024-25
AU_MEDICARE_LEVY = Decimal("0.02")

# New Zealand PAYE 2024-25
NZ_TAX_BRACKETS: list[tuple[Decimal, Decimal, Decimal]] = [
    (Decimal("15600"), Decimal("0.105"), Decimal("0")),
    (Decimal("53500"), Decimal("0.175"), Decimal("1638")),
    (Decimal("78100"), Decimal("0.30"), Decimal("8270.75")),
    (Decimal("180000"), Decimal("0.33"), Decimal("15650.75")),
    (Decimal("999999999"), Decimal("0.39"), Decimal("49277.75")),
]

NZ_KIWISAVER_RATES = [Decimal("0.03"), Decimal("0.04"), Decimal("0.06"), Decimal("0.08")]
NZ_KIWISAVER_DEFAULT = Decimal("0.03")
NZ_ACC_LEVY = Decimal("0.0153")  # earner levy

# United Kingdom PAYE 2024-25
GB_PERSONAL_ALLOWANCE = Decimal("12570")
GB_TAX_BRACKETS: list[tuple[Decimal, Decimal, Decimal]] = [
    (Decimal("12570"), Decimal("0"), Decimal("0")),
    (Decimal("50270"), Decimal("0.20"), Decimal("0")),
    (Decimal("125140"), Decimal("0.40"), Decimal("7540")),
    (Decimal("999999999"), Decimal("0.45"), Decimal("37488")),
]

GB_NI_THRESHOLD = Decimal("12570")
GB_NI_UPPER = Decimal("50270")
GB_NI_RATE_MAIN = Decimal("0.08")
GB_NI_RATE_UPPER = Decimal("0.02")

GB_PENSION_RATE = Decimal("0.05")  # minimum employee workplace pension
GB_EMPLOYER_PENSION_RATE = Decimal("0.03")

# United States Federal 2024 — Single filer (simplified)
US_STANDARD_DEDUCTION = Decimal("14600")
US_TAX_BRACKETS: list[tuple[Decimal, Decimal, Decimal]] = [
    (Decimal("11600"), Decimal("0.10"), Decimal("0")),
    (Decimal("47150"), Decimal("0.12"), Decimal("1160")),
    (Decimal("100525"), Decimal("0.22"), Decimal("5426")),
    (Decimal("191950"), Decimal("0.24"), Decimal("17168.50")),
    (Decimal("243725"), Decimal("0.32"), Decimal("39110.50")),
    (Decimal("609350"), Decimal("0.35"), Decimal("55678.50")),
    (Decimal("999999999"), Decimal("0.37"), Decimal("183647.25")),
]

US_SOCIAL_SECURITY_RATE = Decimal("0.062")
US_SOCIAL_SECURITY_CAP = Decimal("168600")
US_MEDICARE_RATE = Decimal("0.0145")
US_MEDICARE_ADDITIONAL_RATE = Decimal("0.009")
US_MEDICARE_ADDITIONAL_THRESHOLD = Decimal("200000")


# ---------------------------------------------------------------------------
# Pay frequency helpers
# ---------------------------------------------------------------------------

PERIODS_PER_YEAR = {
    PayFrequency.WEEKLY: 52,
    PayFrequency.FORTNIGHTLY: 26,
    PayFrequency.MONTHLY: 12,
}


def _annualise(period_amount: Decimal, frequency: PayFrequency) -> Decimal:
    return period_amount * PERIODS_PER_YEAR[frequency]


def _de_annualise(annual_amount: Decimal, frequency: PayFrequency) -> Decimal:
    return (annual_amount / PERIODS_PER_YEAR[frequency]).quantize(TWO, ROUND_HALF_UP)


# ---------------------------------------------------------------------------
# Progressive tax helper
# ---------------------------------------------------------------------------

def _calc_progressive_tax(
    taxable_income: Decimal,
    brackets: list[tuple[Decimal, Decimal, Decimal]],
) -> Decimal:
    """Calculate annual tax using progressive brackets.

    Each bracket is (upper_limit, marginal_rate, cumulative_tax_below).
    """
    if taxable_income <= 0:
        return Decimal("0")

    tax = Decimal("0")
    prev_limit = Decimal("0")

    for upper_limit, rate, cumulative in brackets:
        if taxable_income <= upper_limit:
            tax = cumulative + (taxable_income - prev_limit) * rate
            break
        prev_limit = upper_limit

    return tax.quantize(TWO, ROUND_HALF_UP)


# ---------------------------------------------------------------------------
# Jurisdiction calculators
# ---------------------------------------------------------------------------

@dataclass
class PayCalculation:
    """Result of a single payslip calculation."""
    gross_pay: Decimal = Decimal("0")
    tax_withheld: Decimal = Decimal("0")
    super_contribution: Decimal = Decimal("0")
    net_pay: Decimal = Decimal("0")
    deductions_total: Decimal = Decimal("0")
    allowances_total: Decimal = Decimal("0")
    breakdown: dict[str, Any] = field(default_factory=dict)


def calculate_au(
    gross_period: Decimal,
    frequency: PayFrequency,
    super_rate: Decimal | None = None,
    deductions: dict[str, Decimal] | None = None,
    allowances: dict[str, Decimal] | None = None,
) -> PayCalculation:
    """Australian PAYG + Super + Medicare levy."""
    annual_gross = _annualise(gross_period, frequency)
    annual_tax = _calc_progressive_tax(annual_gross, AU_TAX_BRACKETS)
    medicare = (annual_gross * AU_MEDICARE_LEVY).quantize(TWO, ROUND_HALF_UP)
    annual_tax_total = annual_tax + medicare

    period_tax = _de_annualise(annual_tax_total, frequency)
    sr = super_rate if super_rate is not None else AU_SUPER_RATE
    period_super = (gross_period * sr).quantize(TWO, ROUND_HALF_UP)

    ded = sum((deductions or {}).values())
    alw = sum((allowances or {}).values())
    net = gross_period + Decimal(str(alw)) - period_tax - Decimal(str(ded))

    return PayCalculation(
        gross_pay=gross_period.quantize(TWO),
        tax_withheld=period_tax,
        super_contribution=period_super,
        net_pay=net.quantize(TWO),
        deductions_total=Decimal(str(ded)).quantize(TWO),
        allowances_total=Decimal(str(alw)).quantize(TWO),
        breakdown={
            "payg": _de_annualise(annual_tax, frequency),
            "medicare_levy": _de_annualise(medicare, frequency),
            "super_rate": str(sr),
        },
    )


def calculate_nz(
    gross_period: Decimal,
    frequency: PayFrequency,
    kiwisaver_rate: Decimal | None = None,
    deductions: dict[str, Decimal] | None = None,
    allowances: dict[str, Decimal] | None = None,
) -> PayCalculation:
    """New Zealand PAYE + ACC levy + KiwiSaver."""
    annual_gross = _annualise(gross_period, frequency)
    annual_paye = _calc_progressive_tax(annual_gross, NZ_TAX_BRACKETS)
    acc = (annual_gross * NZ_ACC_LEVY).quantize(TWO, ROUND_HALF_UP)
    annual_tax_total = annual_paye + acc

    period_tax = _de_annualise(annual_tax_total, frequency)
    ksr = kiwisaver_rate if kiwisaver_rate is not None else NZ_KIWISAVER_DEFAULT
    period_kiwi = (gross_period * ksr).quantize(TWO, ROUND_HALF_UP)

    ded = sum((deductions or {}).values())
    alw = sum((allowances or {}).values())
    net = gross_period + Decimal(str(alw)) - period_tax - period_kiwi - Decimal(str(ded))

    return PayCalculation(
        gross_pay=gross_period.quantize(TWO),
        tax_withheld=period_tax,
        super_contribution=period_kiwi,
        net_pay=net.quantize(TWO),
        deductions_total=Decimal(str(ded)).quantize(TWO),
        allowances_total=Decimal(str(alw)).quantize(TWO),
        breakdown={
            "paye": _de_annualise(annual_paye, frequency),
            "acc_levy": _de_annualise(acc, frequency),
            "kiwisaver_rate": str(ksr),
        },
    )


def calculate_gb(
    gross_period: Decimal,
    frequency: PayFrequency,
    pension_rate: Decimal | None = None,
    deductions: dict[str, Decimal] | None = None,
    allowances: dict[str, Decimal] | None = None,
) -> PayCalculation:
    """UK PAYE + National Insurance + workplace pension."""
    annual_gross = _annualise(gross_period, frequency)
    annual_tax = _calc_progressive_tax(annual_gross, GB_TAX_BRACKETS)

    # National Insurance
    ni = Decimal("0")
    if annual_gross > GB_NI_THRESHOLD:
        main_band = min(annual_gross, GB_NI_UPPER) - GB_NI_THRESHOLD
        ni += (main_band * GB_NI_RATE_MAIN).quantize(TWO)
    if annual_gross > GB_NI_UPPER:
        ni += ((annual_gross - GB_NI_UPPER) * GB_NI_RATE_UPPER).quantize(TWO)

    annual_tax_total = annual_tax + ni
    period_tax = _de_annualise(annual_tax_total, frequency)

    pr = pension_rate if pension_rate is not None else GB_PENSION_RATE
    period_pension = (gross_period * pr).quantize(TWO, ROUND_HALF_UP)

    ded = sum((deductions or {}).values())
    alw = sum((allowances or {}).values())
    net = gross_period + Decimal(str(alw)) - period_tax - period_pension - Decimal(str(ded))

    return PayCalculation(
        gross_pay=gross_period.quantize(TWO),
        tax_withheld=period_tax,
        super_contribution=period_pension,
        net_pay=net.quantize(TWO),
        deductions_total=Decimal(str(ded)).quantize(TWO),
        allowances_total=Decimal(str(alw)).quantize(TWO),
        breakdown={
            "paye": _de_annualise(annual_tax, frequency),
            "national_insurance": _de_annualise(ni, frequency),
            "pension_rate": str(pr),
        },
    )


def calculate_us(
    gross_period: Decimal,
    frequency: PayFrequency,
    state: str | None = None,
    retirement_rate: Decimal | None = None,
    deductions: dict[str, Decimal] | None = None,
    allowances: dict[str, Decimal] | None = None,
) -> PayCalculation:
    """US Federal income tax + State income tax + FICA + optional 401(k).

    Args:
        state: Two-letter state code (e.g., "CA", "NY", "TX"). None = federal only.
        retirement_rate: 401(k) contribution rate as decimal (e.g., 0.06 for 6%).
            Pre-tax traditional 401(k) reduces taxable income.
    """
    from app.payroll.state_taxes import calculate_state_tax

    annual_gross = _annualise(gross_period, frequency)

    # 401(k) pre-tax contribution (reduces taxable income for federal & state)
    ret_rate = retirement_rate or Decimal("0")
    annual_401k = (annual_gross * ret_rate).quantize(TWO, ROUND_HALF_UP)
    # 2024 limit: $23,500
    annual_401k = min(annual_401k, Decimal("23500"))
    period_401k = _de_annualise(annual_401k, frequency)

    taxable_gross = annual_gross - annual_401k

    # Federal income tax (on taxable income after 401k + standard deduction)
    taxable = max(taxable_gross - US_STANDARD_DEDUCTION, Decimal("0"))
    annual_fed = _calc_progressive_tax(taxable, US_TAX_BRACKETS)

    # State income tax
    annual_state = Decimal("0")
    state_code = (state or "").upper().strip()
    if state_code:
        annual_state = calculate_state_tax(state_code, taxable_gross)

    # FICA — Social Security (on gross, not reduced by 401k)
    ss_wages = min(annual_gross, US_SOCIAL_SECURITY_CAP)
    ss = (ss_wages * US_SOCIAL_SECURITY_RATE).quantize(TWO)

    # FICA — Medicare (on gross, not reduced by 401k)
    mc = (annual_gross * US_MEDICARE_RATE).quantize(TWO)
    if annual_gross > US_MEDICARE_ADDITIONAL_THRESHOLD:
        mc += ((annual_gross - US_MEDICARE_ADDITIONAL_THRESHOLD) * US_MEDICARE_ADDITIONAL_RATE).quantize(TWO)

    annual_tax_total = annual_fed + annual_state + ss + mc
    period_tax = _de_annualise(annual_tax_total, frequency)

    # 401(k) is not a tax but a deduction — track separately
    period_super = period_401k

    ded = sum((deductions or {}).values())
    alw = sum((allowances or {}).values())
    net = gross_period + Decimal(str(alw)) - period_tax - period_401k - Decimal(str(ded))

    breakdown = {
        "federal_tax": _de_annualise(annual_fed, frequency),
        "social_security": _de_annualise(ss, frequency),
        "medicare": _de_annualise(mc, frequency),
    }
    if state_code:
        breakdown["state_tax"] = _de_annualise(annual_state, frequency)
        breakdown["state"] = state_code
    if annual_401k > 0:
        breakdown["401k_contribution"] = period_401k
        breakdown["401k_rate"] = str(ret_rate)

    return PayCalculation(
        gross_pay=gross_period.quantize(TWO),
        tax_withheld=period_tax,
        super_contribution=period_super,
        net_pay=net.quantize(TWO),
        deductions_total=Decimal(str(ded)).quantize(TWO),
        allowances_total=Decimal(str(alw)).quantize(TWO),
        breakdown=breakdown,
    )


# ---------------------------------------------------------------------------
# Dispatcher
# ---------------------------------------------------------------------------

_CALCULATORS = {
    Jurisdiction.AU: calculate_au,
    Jurisdiction.NZ: calculate_nz,
    Jurisdiction.GB: calculate_gb,
    Jurisdiction.US: calculate_us,
}


def calculate_pay(
    jurisdiction: str,
    gross_period: float | Decimal,
    frequency: str,
    super_rate: float | None = None,
    state: str | None = None,
    retirement_rate: float | None = None,
    deductions: dict[str, float] | None = None,
    allowances: dict[str, float] | None = None,
) -> PayCalculation:
    """Entry point — calculate pay for any supported jurisdiction.

    Args:
        jurisdiction: AU, NZ, GB, or US
        state: US state code (e.g., "CA", "NY"). Only used for US jurisdiction.
        retirement_rate: 401(k) percentage (e.g., 6 for 6%). Only used for US.
    """
    jur = Jurisdiction(jurisdiction.upper())
    freq = PayFrequency(frequency.lower())
    gp = Decimal(str(gross_period))

    dec_ded = {k: Decimal(str(v)) for k, v in (deductions or {}).items()}
    dec_alw = {k: Decimal(str(v)) for k, v in (allowances or {}).items()}

    kwargs: dict[str, Any] = {
        "gross_period": gp,
        "frequency": freq,
        "deductions": dec_ded,
        "allowances": dec_alw,
    }
    if super_rate is not None:
        sr_key = {
            Jurisdiction.AU: "super_rate",
            Jurisdiction.NZ: "kiwisaver_rate",
            Jurisdiction.GB: "pension_rate",
        }.get(jur)
        if sr_key:
            kwargs[sr_key] = Decimal(str(super_rate)) / 100

    # US-specific: state tax and 401(k)
    if jur == Jurisdiction.US:
        if state:
            kwargs["state"] = state
        if retirement_rate is not None:
            kwargs["retirement_rate"] = Decimal(str(retirement_rate)) / 100

    return _CALCULATORS[jur](**kwargs)


# ---------------------------------------------------------------------------
# Leave accrual
# ---------------------------------------------------------------------------

# Annual leave entitlements (hours per year) by jurisdiction
ANNUAL_LEAVE_HOURS: dict[str, dict[str, float]] = {
    "AU": {"annual": 160, "personal": 80},       # 4 weeks + 10 days personal/sick
    "NZ": {"annual": 160, "sick": 40},            # 4 weeks + 5 days sick
    "GB": {"annual": 224},                        # 28 days (5.6 weeks) including bank holidays
    "US": {"annual": 80, "sick": 40},             # ~2 weeks PTO + 5 sick (no statutory minimum)
}


def accrue_leave(
    jurisdiction: str,
    frequency: str,
    current_balances: dict[str, float] | None = None,
) -> dict[str, float]:
    """Return updated leave balances after accruing one pay period.

    Accrual is proportional: annual entitlement / periods-per-year.
    """
    freq = PayFrequency(frequency.lower())
    periods = PERIODS_PER_YEAR[freq]
    entitlements = ANNUAL_LEAVE_HOURS.get(jurisdiction.upper(), ANNUAL_LEAVE_HOURS["US"])

    balances = dict(current_balances or {})
    for leave_type, annual_hours in entitlements.items():
        accrual = round(annual_hours / periods, 2)
        balances[leave_type] = round(balances.get(leave_type, 0) + accrual, 2)

    return balances

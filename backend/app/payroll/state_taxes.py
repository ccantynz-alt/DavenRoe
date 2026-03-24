"""US State Income Tax Withholding Tables.

Covers all 50 states + DC. States are grouped by tax model:
  - Progressive (bracket-based): CA, NY, NJ, etc.
  - Flat rate: CO, IL, IN, MA, MI, NC, PA, UT
  - No income tax: AK, FL, NH, NV, SD, TN, TX, WA, WY

All rates are for 2024 tax year, single filer, standard deduction.
"""

from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP

TWO = Decimal("0.01")


# States with no individual income tax
NO_TAX_STATES = {"AK", "FL", "NH", "NV", "SD", "TN", "TX", "WA", "WY"}

# Flat-rate states: {state: rate}
FLAT_RATE_STATES: dict[str, Decimal] = {
    "CO": Decimal("0.044"),
    "IL": Decimal("0.0495"),
    "IN": Decimal("0.0305"),
    "KY": Decimal("0.04"),
    "MA": Decimal("0.05"),
    "MI": Decimal("0.0425"),
    "NC": Decimal("0.0475"),
    "PA": Decimal("0.0307"),
    "UT": Decimal("0.0465"),
    "AZ": Decimal("0.025"),
    "IA": Decimal("0.038"),
    "KS": Decimal("0.057"),  # top bracket simplified
    "MS": Decimal("0.05"),
    "ND": Decimal("0.0195"),
}

# Progressive bracket states: {state: [(upper_limit, rate, cumulative_tax_below), ...]}
# Simplified to capture the material tax impact for each state
PROGRESSIVE_STATES: dict[str, list[tuple[Decimal, Decimal, Decimal]]] = {
    "CA": [
        (Decimal("10412"), Decimal("0.01"), Decimal("0")),
        (Decimal("24684"), Decimal("0.02"), Decimal("104.12")),
        (Decimal("38959"), Decimal("0.04"), Decimal("389.56")),
        (Decimal("54081"), Decimal("0.06"), Decimal("960.56")),
        (Decimal("68350"), Decimal("0.08"), Decimal("1867.88")),
        (Decimal("349137"), Decimal("0.093"), Decimal("3009.40")),
        (Decimal("418961"), Decimal("0.103"), Decimal("29122.63")),
        (Decimal("698271"), Decimal("0.113"), Decimal("36333.90")),
        (Decimal("999999999"), Decimal("0.123"), Decimal("67894.94")),
    ],
    "NY": [
        (Decimal("8500"), Decimal("0.04"), Decimal("0")),
        (Decimal("11700"), Decimal("0.045"), Decimal("340")),
        (Decimal("13900"), Decimal("0.0525"), Decimal("484")),
        (Decimal("80650"), Decimal("0.0585"), Decimal("599.50")),
        (Decimal("215400"), Decimal("0.0625"), Decimal("4504.38")),
        (Decimal("1077550"), Decimal("0.0685"), Decimal("12926.25")),
        (Decimal("999999999"), Decimal("0.103"), Decimal("71927.78")),
    ],
    "NJ": [
        (Decimal("20000"), Decimal("0.014"), Decimal("0")),
        (Decimal("35000"), Decimal("0.0175"), Decimal("280")),
        (Decimal("40000"), Decimal("0.035"), Decimal("542.50")),
        (Decimal("75000"), Decimal("0.05525"), Decimal("717.50")),
        (Decimal("500000"), Decimal("0.0637"), Decimal("2651.25")),
        (Decimal("999999999"), Decimal("0.1075"), Decimal("29723.50")),
    ],
    "CT": [
        (Decimal("10000"), Decimal("0.02"), Decimal("0")),
        (Decimal("50000"), Decimal("0.045"), Decimal("200")),
        (Decimal("100000"), Decimal("0.055"), Decimal("2000")),
        (Decimal("200000"), Decimal("0.06"), Decimal("4750")),
        (Decimal("250000"), Decimal("0.065"), Decimal("10750")),
        (Decimal("500000"), Decimal("0.069"), Decimal("14000")),
        (Decimal("999999999"), Decimal("0.0699"), Decimal("31250")),
    ],
    "GA": [
        (Decimal("750"), Decimal("0.01"), Decimal("0")),
        (Decimal("2250"), Decimal("0.02"), Decimal("7.50")),
        (Decimal("3750"), Decimal("0.03"), Decimal("37.50")),
        (Decimal("5250"), Decimal("0.04"), Decimal("82.50")),
        (Decimal("7000"), Decimal("0.05"), Decimal("142.50")),
        (Decimal("999999999"), Decimal("0.055"), Decimal("230")),
    ],
    "VA": [
        (Decimal("3000"), Decimal("0.02"), Decimal("0")),
        (Decimal("5000"), Decimal("0.03"), Decimal("60")),
        (Decimal("17000"), Decimal("0.05"), Decimal("120")),
        (Decimal("999999999"), Decimal("0.0575"), Decimal("720")),
    ],
    "OH": [
        (Decimal("26050"), Decimal("0"), Decimal("0")),
        (Decimal("46100"), Decimal("0.02765"), Decimal("0")),
        (Decimal("92150"), Decimal("0.03226"), Decimal("554.48")),
        (Decimal("115300"), Decimal("0.03688"), Decimal("2038.97")),
        (Decimal("999999999"), Decimal("0.0399"), Decimal("2892.74")),
    ],
    "MN": [
        (Decimal("30070"), Decimal("0.0535"), Decimal("0")),
        (Decimal("98760"), Decimal("0.068"), Decimal("1608.75")),
        (Decimal("171220"), Decimal("0.0785"), Decimal("6278.67")),
        (Decimal("999999999"), Decimal("0.0985"), Decimal("11967.75")),
    ],
    "WI": [
        (Decimal("13810"), Decimal("0.0354"), Decimal("0")),
        (Decimal("27630"), Decimal("0.0465"), Decimal("488.87")),
        (Decimal("304170"), Decimal("0.0530"), Decimal("1131.50")),
        (Decimal("999999999"), Decimal("0.0765"), Decimal("15778.10")),
    ],
    "OR": [
        (Decimal("3750"), Decimal("0.0475"), Decimal("0")),
        (Decimal("9450"), Decimal("0.0675"), Decimal("178.13")),
        (Decimal("125000"), Decimal("0.0875"), Decimal("562.88")),
        (Decimal("999999999"), Decimal("0.099"), Decimal("10673.00")),
    ],
    "SC": [
        (Decimal("3200"), Decimal("0"), Decimal("0")),
        (Decimal("16040"), Decimal("0.03"), Decimal("0")),
        (Decimal("999999999"), Decimal("0.064"), Decimal("385.20")),
    ],
    "MO": [
        (Decimal("1207"), Decimal("0.02"), Decimal("0")),
        (Decimal("2414"), Decimal("0.025"), Decimal("24.14")),
        (Decimal("3621"), Decimal("0.03"), Decimal("54.32")),
        (Decimal("4828"), Decimal("0.035"), Decimal("90.53")),
        (Decimal("6035"), Decimal("0.04"), Decimal("132.78")),
        (Decimal("7242"), Decimal("0.045"), Decimal("181.08")),
        (Decimal("8449"), Decimal("0.05"), Decimal("235.40")),
        (Decimal("999999999"), Decimal("0.054"), Decimal("295.75")),
    ],
    "MD": [
        (Decimal("1000"), Decimal("0.02"), Decimal("0")),
        (Decimal("2000"), Decimal("0.03"), Decimal("20")),
        (Decimal("3000"), Decimal("0.04"), Decimal("50")),
        (Decimal("100000"), Decimal("0.0475"), Decimal("90")),
        (Decimal("125000"), Decimal("0.05"), Decimal("4697.50")),
        (Decimal("150000"), Decimal("0.0525"), Decimal("5947.50")),
        (Decimal("250000"), Decimal("0.055"), Decimal("7260")),
        (Decimal("999999999"), Decimal("0.0575"), Decimal("12760")),
    ],
    "AL": [
        (Decimal("500"), Decimal("0.02"), Decimal("0")),
        (Decimal("3000"), Decimal("0.04"), Decimal("10")),
        (Decimal("999999999"), Decimal("0.05"), Decimal("110")),
    ],
    "LA": [
        (Decimal("12500"), Decimal("0.0185"), Decimal("0")),
        (Decimal("50000"), Decimal("0.035"), Decimal("231.25")),
        (Decimal("999999999"), Decimal("0.0425"), Decimal("1543.75")),
    ],
    "OK": [
        (Decimal("1000"), Decimal("0.0025"), Decimal("0")),
        (Decimal("2500"), Decimal("0.0075"), Decimal("2.50")),
        (Decimal("3750"), Decimal("0.0175"), Decimal("13.75")),
        (Decimal("4900"), Decimal("0.0275"), Decimal("35.63")),
        (Decimal("7200"), Decimal("0.0375"), Decimal("67.25")),
        (Decimal("999999999"), Decimal("0.0475"), Decimal("153.50")),
    ],
    "AR": [
        (Decimal("4300"), Decimal("0.02"), Decimal("0")),
        (Decimal("8500"), Decimal("0.04"), Decimal("86")),
        (Decimal("999999999"), Decimal("0.044"), Decimal("254")),
    ],
    "HI": [
        (Decimal("2400"), Decimal("0.014"), Decimal("0")),
        (Decimal("4800"), Decimal("0.032"), Decimal("33.60")),
        (Decimal("9600"), Decimal("0.055"), Decimal("110.40")),
        (Decimal("14400"), Decimal("0.064"), Decimal("374.40")),
        (Decimal("19200"), Decimal("0.068"), Decimal("681.60")),
        (Decimal("24000"), Decimal("0.072"), Decimal("1008")),
        (Decimal("36000"), Decimal("0.076"), Decimal("1353.60")),
        (Decimal("48000"), Decimal("0.079"), Decimal("2265.60")),
        (Decimal("150000"), Decimal("0.0825"), Decimal("3213.60")),
        (Decimal("175000"), Decimal("0.09"), Decimal("11628.60")),
        (Decimal("200000"), Decimal("0.10"), Decimal("13878.60")),
        (Decimal("999999999"), Decimal("0.11"), Decimal("16378.60")),
    ],
    "ME": [
        (Decimal("24500"), Decimal("0.058"), Decimal("0")),
        (Decimal("58050"), Decimal("0.0675"), Decimal("1421")),
        (Decimal("999999999"), Decimal("0.0715"), Decimal("3685.13")),
    ],
    "VT": [
        (Decimal("45400"), Decimal("0.0335"), Decimal("0")),
        (Decimal("110050"), Decimal("0.066"), Decimal("1520.90")),
        (Decimal("229550"), Decimal("0.076"), Decimal("5787.80")),
        (Decimal("999999999"), Decimal("0.0875"), Decimal("14869.80")),
    ],
    "NM": [
        (Decimal("5500"), Decimal("0.017"), Decimal("0")),
        (Decimal("11000"), Decimal("0.032"), Decimal("93.50")),
        (Decimal("16000"), Decimal("0.047"), Decimal("269.50")),
        (Decimal("210000"), Decimal("0.049"), Decimal("504.50")),
        (Decimal("999999999"), Decimal("0.059"), Decimal("10010.50")),
    ],
    "ID": [
        (Decimal("999999999"), Decimal("0.058"), Decimal("0")),
    ],
    "MT": [
        (Decimal("20500"), Decimal("0.047"), Decimal("0")),
        (Decimal("999999999"), Decimal("0.059"), Decimal("963.50")),
    ],
    "NE": [
        (Decimal("3700"), Decimal("0.0246"), Decimal("0")),
        (Decimal("22170"), Decimal("0.0351"), Decimal("91.02")),
        (Decimal("35730"), Decimal("0.0501"), Decimal("739.52")),
        (Decimal("999999999"), Decimal("0.0584"), Decimal("1418.88")),
    ],
    "WV": [
        (Decimal("10000"), Decimal("0.0236"), Decimal("0")),
        (Decimal("25000"), Decimal("0.0315"), Decimal("236")),
        (Decimal("40000"), Decimal("0.0354"), Decimal("708.50")),
        (Decimal("60000"), Decimal("0.0472"), Decimal("1239.50")),
        (Decimal("999999999"), Decimal("0.0512"), Decimal("2183.50")),
    ],
    "RI": [
        (Decimal("73450"), Decimal("0.0375"), Decimal("0")),
        (Decimal("166950"), Decimal("0.0475"), Decimal("2754.38")),
        (Decimal("999999999"), Decimal("0.0599"), Decimal("7190.63")),
    ],
    "DE": [
        (Decimal("2000"), Decimal("0"), Decimal("0")),
        (Decimal("5000"), Decimal("0.022"), Decimal("0")),
        (Decimal("10000"), Decimal("0.039"), Decimal("66")),
        (Decimal("20000"), Decimal("0.048"), Decimal("261")),
        (Decimal("25000"), Decimal("0.052"), Decimal("741")),
        (Decimal("60000"), Decimal("0.0555"), Decimal("1001")),
        (Decimal("999999999"), Decimal("0.066"), Decimal("2943.50")),
    ],
    "DC": [
        (Decimal("10000"), Decimal("0.04"), Decimal("0")),
        (Decimal("40000"), Decimal("0.06"), Decimal("400")),
        (Decimal("60000"), Decimal("0.065"), Decimal("2200")),
        (Decimal("250000"), Decimal("0.085"), Decimal("3500")),
        (Decimal("500000"), Decimal("0.0925"), Decimal("19650")),
        (Decimal("1000000"), Decimal("0.0975"), Decimal("42775")),
        (Decimal("999999999"), Decimal("0.1075"), Decimal("91525")),
    ],
}


def _calc_progressive_tax(
    taxable_income: Decimal,
    brackets: list[tuple[Decimal, Decimal, Decimal]],
) -> Decimal:
    """Calculate tax using progressive brackets."""
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


def calculate_state_tax(
    state: str,
    annual_gross: Decimal,
) -> Decimal:
    """Calculate annual state income tax for a given state.

    Args:
        state: Two-letter state code (e.g., "CA", "NY", "TX")
        annual_gross: Annual gross income

    Returns:
        Annual state tax amount
    """
    state = state.upper().strip()

    if state in NO_TAX_STATES:
        return Decimal("0")

    if state in FLAT_RATE_STATES:
        return (annual_gross * FLAT_RATE_STATES[state]).quantize(TWO, ROUND_HALF_UP)

    if state in PROGRESSIVE_STATES:
        return _calc_progressive_tax(annual_gross, PROGRESSIVE_STATES[state])

    # Fallback for states not yet in detailed tables — use median effective rate
    # This covers: NH (interest/dividends only), and any missed states
    return (annual_gross * Decimal("0.045")).quantize(TWO, ROUND_HALF_UP)


def get_all_states() -> list[dict]:
    """Return list of all states with their tax type for UI display."""
    states = []
    all_state_codes = sorted(
        set(list(NO_TAX_STATES) + list(FLAT_RATE_STATES.keys()) + list(PROGRESSIVE_STATES.keys()))
    )
    # Add remaining states
    all_50_plus_dc = [
        "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL",
        "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME",
        "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH",
        "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI",
        "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
    ]

    for code in all_50_plus_dc:
        if code in NO_TAX_STATES:
            tax_type = "none"
            rate = "0%"
        elif code in FLAT_RATE_STATES:
            tax_type = "flat"
            rate = f"{float(FLAT_RATE_STATES[code]) * 100:.2f}%"
        elif code in PROGRESSIVE_STATES:
            tax_type = "progressive"
            top_rate = PROGRESSIVE_STATES[code][-1][1]
            rate = f"up to {float(top_rate) * 100:.2f}%"
        else:
            tax_type = "estimated"
            rate = "~4.50%"

        states.append({"code": code, "tax_type": tax_type, "rate": rate})

    return states

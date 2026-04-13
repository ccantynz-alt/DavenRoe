"""Tax Jurisdiction Registry — the deterministic heart of DavenRoe.

This is NOT AI-driven. Tax law is hard-coded and versioned.
Every rate has an effective date range and legislation reference.
"""

from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal


@dataclass(frozen=True)
class TaxBracket:
    min_amount: Decimal
    max_amount: Decimal | None  # None = no upper limit
    rate: Decimal
    base_tax: Decimal = Decimal("0")  # cumulative tax from lower brackets


@dataclass(frozen=True)
class TaxRateEntry:
    jurisdiction: str
    tax_type: str
    rate: Decimal | None  # flat rate, or None if bracketed
    brackets: list[TaxBracket] = field(default_factory=list)
    applies_to: str = "all"
    effective_from: date = date(2024, 7, 1)
    effective_to: date | None = None
    legislation: str = ""


class TaxJurisdictionRegistry:
    """Deterministic tax rate registry for all supported jurisdictions.

    Rates are hard-coded from legislation. No AI guessing.
    """

    def __init__(self):
        self._rates: dict[str, list[TaxRateEntry]] = {}
        self._load_all_jurisdictions()

    def _load_all_jurisdictions(self):
        self._load_australia()
        self._load_new_zealand()
        self._load_united_states()
        self._load_united_kingdom()

    # ── Australia (ATO) ──────────────────────────────────────────────

    def _load_australia(self):
        # GST: flat 10%
        self._add(TaxRateEntry(
            jurisdiction="AU", tax_type="gst", rate=Decimal("0.10"),
            effective_from=date(2000, 7, 1),
            legislation="A New Tax System (Goods and Services Tax) Act 1999",
        ))

        # Corporate tax: 25% for base rate entities, 30% for others
        self._add(TaxRateEntry(
            jurisdiction="AU", tax_type="corporate_tax", rate=Decimal("0.25"),
            applies_to="base_rate_entity",
            effective_from=date(2021, 7, 1),
            legislation="Income Tax Rates Act 1986 s23(2)",
        ))
        self._add(TaxRateEntry(
            jurisdiction="AU", tax_type="corporate_tax", rate=Decimal("0.30"),
            applies_to="company",
            effective_from=date(2021, 7, 1),
            legislation="Income Tax Rates Act 1986 s23(1)",
        ))

        # Individual income tax — Stage 3 cuts (from 1 July 2024)
        stage3_brackets = [
            TaxBracket(Decimal("0"), Decimal("18200"), Decimal("0")),
            TaxBracket(Decimal("18201"), Decimal("45000"), Decimal("0.16"), Decimal("0")),
            TaxBracket(Decimal("45001"), Decimal("135000"), Decimal("0.30"), Decimal("4288")),
            TaxBracket(Decimal("135001"), Decimal("190000"), Decimal("0.37"), Decimal("31288")),
            TaxBracket(Decimal("190001"), None, Decimal("0.45"), Decimal("51638")),
        ]
        self._add(TaxRateEntry(
            jurisdiction="AU", tax_type="income_tax", rate=None,
            brackets=stage3_brackets, applies_to="resident",
            effective_from=date(2024, 7, 1),
            legislation="Treasury Laws Amendment (Cost of Living Tax Cuts) Act 2024",
        ))

        # WHT on non-residents (default, before treaty override)
        self._add(TaxRateEntry(
            jurisdiction="AU", tax_type="withholding_tax", rate=Decimal("0.30"),
            applies_to="non_resident",
            effective_from=date(2000, 7, 1),
            legislation="Income Tax Assessment Act 1936 Div 11A",
        ))

    # ── New Zealand (IRD) ────────────────────────────────────────────

    def _load_new_zealand(self):
        # GST: 15%
        self._add(TaxRateEntry(
            jurisdiction="NZ", tax_type="gst", rate=Decimal("0.15"),
            effective_from=date(2010, 10, 1),
            legislation="Goods and Services Tax Act 1985 s8",
        ))

        # Corporate tax: 28%
        self._add(TaxRateEntry(
            jurisdiction="NZ", tax_type="corporate_tax", rate=Decimal("0.28"),
            applies_to="company",
            effective_from=date(2011, 4, 1),
            legislation="Income Tax Act 2007 s BC 1",
        ))

        # Individual income tax brackets (from 1 April 2024)
        nz_brackets = [
            TaxBracket(Decimal("0"), Decimal("15600"), Decimal("0.105")),
            TaxBracket(Decimal("15601"), Decimal("53500"), Decimal("0.175"), Decimal("1638")),
            TaxBracket(Decimal("53501"), Decimal("78100"), Decimal("0.30"), Decimal("8270")),
            TaxBracket(Decimal("78101"), Decimal("180000"), Decimal("0.33"), Decimal("15650")),
            TaxBracket(Decimal("180001"), None, Decimal("0.39"), Decimal("49277")),
        ]
        self._add(TaxRateEntry(
            jurisdiction="NZ", tax_type="income_tax", rate=None,
            brackets=nz_brackets, applies_to="resident",
            effective_from=date(2024, 4, 1),
            legislation="Income Tax Act 2007 Schedule 1",
        ))

        # NRWT (Non-Resident WHT)
        self._add(TaxRateEntry(
            jurisdiction="NZ", tax_type="withholding_tax", rate=Decimal("0.15"),
            applies_to="non_resident",
            effective_from=date(2000, 4, 1),
            legislation="Income Tax Act 2007 s RF 2",
        ))

    # ── United States (IRS) ──────────────────────────────────────────

    def _load_united_states(self):
        # No federal GST/VAT
        # Corporate tax: flat 21%
        self._add(TaxRateEntry(
            jurisdiction="US", tax_type="corporate_tax", rate=Decimal("0.21"),
            applies_to="company",
            effective_from=date(2018, 1, 1),
            legislation="IRC §11, Tax Cuts and Jobs Act 2017",
        ))

        # Individual income tax brackets 2024
        us_brackets_single = [
            TaxBracket(Decimal("0"), Decimal("11600"), Decimal("0.10")),
            TaxBracket(Decimal("11601"), Decimal("47150"), Decimal("0.12"), Decimal("1160")),
            TaxBracket(Decimal("47151"), Decimal("100525"), Decimal("0.22"), Decimal("5426")),
            TaxBracket(Decimal("100526"), Decimal("191950"), Decimal("0.24"), Decimal("17168.50")),
            TaxBracket(Decimal("191951"), Decimal("243725"), Decimal("0.32"), Decimal("39110.50")),
            TaxBracket(Decimal("243726"), Decimal("609350"), Decimal("0.35"), Decimal("55678.50")),
            TaxBracket(Decimal("609351"), None, Decimal("0.37"), Decimal("183647.25")),
        ]
        self._add(TaxRateEntry(
            jurisdiction="US", tax_type="income_tax", rate=None,
            brackets=us_brackets_single, applies_to="individual_single",
            effective_from=date(2024, 1, 1),
            legislation="IRC §1(a)-(d), Rev. Proc. 2023-34",
        ))

        # Default WHT on non-residents: 30%
        self._add(TaxRateEntry(
            jurisdiction="US", tax_type="withholding_tax", rate=Decimal("0.30"),
            applies_to="non_resident",
            effective_from=date(2000, 1, 1),
            legislation="IRC §1441",
        ))

    # ── United Kingdom (HMRC) ────────────────────────────────────────

    def _load_united_kingdom(self):
        # VAT: 20%
        self._add(TaxRateEntry(
            jurisdiction="GB", tax_type="vat", rate=Decimal("0.20"),
            effective_from=date(2011, 1, 4),
            legislation="Value Added Tax Act 1994 s2",
        ))

        # Corporation tax: 25% (from April 2023)
        self._add(TaxRateEntry(
            jurisdiction="GB", tax_type="corporate_tax", rate=Decimal("0.25"),
            applies_to="company",
            effective_from=date(2023, 4, 1),
            legislation="Corporation Tax Act 2010 s3, Finance Act 2021",
        ))

        # Income tax 2024-25
        gb_brackets = [
            TaxBracket(Decimal("0"), Decimal("12570"), Decimal("0")),
            TaxBracket(Decimal("12571"), Decimal("50270"), Decimal("0.20"), Decimal("0")),
            TaxBracket(Decimal("50271"), Decimal("125140"), Decimal("0.40"), Decimal("7540")),
            TaxBracket(Decimal("125141"), None, Decimal("0.45"), Decimal("37488")),
        ]
        self._add(TaxRateEntry(
            jurisdiction="GB", tax_type="income_tax", rate=None,
            brackets=gb_brackets, applies_to="resident",
            effective_from=date(2024, 4, 6),
            legislation="Income Tax Act 2007 s6-12",
        ))

    # ── Helpers ──────────────────────────────────────────────────────

    def _add(self, entry: TaxRateEntry):
        key = f"{entry.jurisdiction}:{entry.tax_type}"
        self._rates.setdefault(key, []).append(entry)

    def get_rate(
        self, jurisdiction: str, tax_type: str,
        as_of: date | None = None, applies_to: str = "all",
    ) -> TaxRateEntry | None:
        """Get the applicable tax rate for a jurisdiction/type/date."""
        as_of = as_of or date.today()
        key = f"{jurisdiction}:{tax_type}"
        entries = self._rates.get(key, [])

        for entry in entries:
            if entry.effective_from <= as_of:
                if entry.effective_to is None or as_of <= entry.effective_to:
                    if entry.applies_to in (applies_to, "all"):
                        return entry
        return None

    def get_all_rates(self, jurisdiction: str) -> list[TaxRateEntry]:
        """Get all current rates for a jurisdiction."""
        results = []
        for key, entries in self._rates.items():
            if key.startswith(f"{jurisdiction}:"):
                for entry in entries:
                    results.append(entry)
        return results

    def calculate_bracketed_tax(self, jurisdiction: str, taxable_income: Decimal,
                                 applies_to: str = "resident",
                                 as_of: date | None = None) -> Decimal:
        """Calculate progressive/bracketed income tax."""
        entry = self.get_rate(jurisdiction, "income_tax", as_of, applies_to)
        if not entry or not entry.brackets:
            return Decimal("0")

        total_tax = Decimal("0")
        for bracket in entry.brackets:
            if taxable_income <= bracket.min_amount:
                break
            upper = min(taxable_income, bracket.max_amount) if bracket.max_amount else taxable_income
            taxable_in_bracket = upper - bracket.min_amount + (Decimal("1") if bracket.min_amount > 0 else Decimal("0"))
            if bracket.min_amount == 0:
                taxable_in_bracket = upper
            total_tax = bracket.base_tax + (taxable_in_bracket * bracket.rate)

        return total_tax.quantize(Decimal("0.01"))

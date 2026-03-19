"""Everyday Accounting Utilities.

Tax ID validators, GST/VAT calculator, currency converter,
business day calculator. The tools every bookkeeper uses daily.
"""

import re
from datetime import date, timedelta
from decimal import Decimal

TWO_DP = Decimal("0.01")


class TaxIdValidator:
    """Validate tax identification numbers by jurisdiction.

    Every bookkeeper needs to check if an ABN/ACN/EIN/IRD/UTR
    is valid before entering it. Getting it wrong means rejected
    lodgments and angry clients.
    """

    def validate(self, tax_id: str, jurisdiction: str, id_type: str = "auto") -> dict:
        """Validate a tax ID number."""
        clean = re.sub(r"[\s\-.]", "", tax_id.strip())
        jurisdiction = jurisdiction.upper()

        validators = {
            ("AU", "abn"): self._validate_abn,
            ("AU", "acn"): self._validate_acn,
            ("AU", "tfn"): self._validate_tfn,
            ("NZ", "ird"): self._validate_ird,
            ("NZ", "nzbn"): self._validate_nzbn,
            ("GB", "utr"): self._validate_utr,
            ("GB", "vat"): self._validate_gb_vat,
            ("US", "ein"): self._validate_ein,
            ("US", "ssn"): self._validate_ssn,
        }

        # Auto-detect type
        if id_type == "auto":
            id_type = self._detect_type(clean, jurisdiction)

        validator = validators.get((jurisdiction, id_type.lower()))
        if not validator:
            return {
                "valid": None,
                "tax_id": tax_id,
                "jurisdiction": jurisdiction,
                "type": id_type,
                "message": f"Validation not available for {jurisdiction} {id_type}",
            }

        is_valid, message = validator(clean)
        return {
            "valid": is_valid,
            "tax_id": tax_id,
            "formatted": self._format_id(clean, jurisdiction, id_type),
            "jurisdiction": jurisdiction,
            "type": id_type,
            "message": message,
        }

    def _detect_type(self, clean: str, jurisdiction: str) -> str:
        """Auto-detect tax ID type from format."""
        if jurisdiction == "AU":
            if len(clean) == 11:
                return "abn"
            if len(clean) == 9:
                return "acn"
            if len(clean) in (8, 9):
                return "tfn"
        elif jurisdiction == "NZ":
            if len(clean) in (8, 9):
                return "ird"
            if len(clean) == 13:
                return "nzbn"
        elif jurisdiction == "GB":
            if len(clean) == 10:
                return "utr"
            if clean.startswith("GB"):
                return "vat"
        elif jurisdiction == "US":
            if len(clean) == 9 and clean[2] != "-":
                return "ein"
        return "unknown"

    def _validate_abn(self, abn: str) -> tuple[bool, str]:
        """Australian Business Number — 11 digits with modulus 89 check."""
        if not abn.isdigit() or len(abn) != 11:
            return False, "ABN must be exactly 11 digits"

        weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19]
        digits = [int(d) for d in abn]
        digits[0] -= 1  # Subtract 1 from first digit

        total = sum(d * w for d, w in zip(digits, weights))
        if total % 89 != 0:
            return False, "ABN checksum failed — this is not a valid ABN"
        return True, "Valid ABN"

    def _validate_acn(self, acn: str) -> tuple[bool, str]:
        """Australian Company Number — 9 digits with modulus 10 check."""
        if not acn.isdigit() or len(acn) != 9:
            return False, "ACN must be exactly 9 digits"

        weights = [8, 7, 6, 5, 4, 3, 2, 1]
        digits = [int(d) for d in acn]
        total = sum(d * w for d, w in zip(digits[:8], weights))
        remainder = total % 10
        check = (10 - remainder) % 10

        if check != digits[8]:
            return False, "ACN checksum failed"
        return True, "Valid ACN"

    def _validate_tfn(self, tfn: str) -> tuple[bool, str]:
        """Australian Tax File Number — 8 or 9 digits with weighted check."""
        if not tfn.isdigit() or len(tfn) not in (8, 9):
            return False, "TFN must be 8 or 9 digits"

        weights = [1, 4, 3, 7, 5, 8, 6, 9, 10][:len(tfn)]
        digits = [int(d) for d in tfn]
        total = sum(d * w for d, w in zip(digits, weights))

        if total % 11 != 0:
            return False, "TFN checksum failed"
        return True, "Valid TFN"

    def _validate_ird(self, ird: str) -> tuple[bool, str]:
        """New Zealand IRD number — 8 or 9 digits."""
        if not ird.isdigit() or len(ird) not in (8, 9):
            return False, "IRD number must be 8 or 9 digits"

        # Pad to 9 digits
        ird = ird.zfill(9)
        weights_primary = [3, 2, 7, 6, 5, 4, 3, 2]
        digits = [int(d) for d in ird]
        total = sum(d * w for d, w in zip(digits[:8], weights_primary))
        remainder = total % 11
        check = 0 if remainder == 0 else 11 - remainder

        if check == 10:
            weights_secondary = [7, 4, 3, 2, 5, 2, 7, 6]
            total = sum(d * w for d, w in zip(digits[:8], weights_secondary))
            remainder = total % 11
            check = 0 if remainder == 0 else 11 - remainder
            if check == 10:
                return False, "IRD number checksum failed"

        if check != digits[8]:
            return False, "IRD number checksum failed"
        return True, "Valid IRD number"

    def _validate_nzbn(self, nzbn: str) -> tuple[bool, str]:
        """New Zealand Business Number — 13 digits."""
        if not nzbn.isdigit() or len(nzbn) != 13:
            return False, "NZBN must be exactly 13 digits"
        # NZBN uses GS1 check digit (same as EAN-13)
        digits = [int(d) for d in nzbn]
        total = sum(d * (1 if i % 2 == 0 else 3) for i, d in enumerate(digits[:12]))
        check = (10 - total % 10) % 10
        if check != digits[12]:
            return False, "NZBN checksum failed"
        return True, "Valid NZBN"

    def _validate_utr(self, utr: str) -> tuple[bool, str]:
        """UK Unique Taxpayer Reference — 10 digits."""
        if not utr.isdigit() or len(utr) != 10:
            return False, "UTR must be exactly 10 digits"
        # Basic format check (HMRC doesn't publish the full algorithm)
        if utr[0] == "0":
            return False, "UTR cannot start with 0"
        return True, "Valid UTR format"

    def _validate_gb_vat(self, vat: str) -> tuple[bool, str]:
        """UK VAT number — GB + 9 digits."""
        clean = vat.upper().replace("GB", "")
        if not clean.isdigit() or len(clean) != 9:
            return False, "UK VAT number must be GB + 9 digits"
        return True, "Valid UK VAT format"

    def _validate_ein(self, ein: str) -> tuple[bool, str]:
        """US Employer Identification Number — 9 digits, XX-XXXXXXX format."""
        if not ein.isdigit() or len(ein) != 9:
            return False, "EIN must be exactly 9 digits"
        prefix = int(ein[:2])
        valid_prefixes = set(range(1, 7)) | set(range(10, 17)) | {20, 26, 27, 30, 32, 33, 35, 36, 37, 38, 39,
                          41, 42, 43, 44, 45, 46, 47, 48, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59,
                          60, 61, 62, 63, 64, 65, 66, 67, 68, 71, 72, 73, 74, 75, 76, 77, 80, 81, 82,
                          83, 84, 85, 86, 87, 88, 90, 91, 92, 93, 94, 95, 98, 99}
        if prefix not in valid_prefixes:
            return False, f"EIN prefix {prefix:02d} is not a valid IRS campus code"
        return True, "Valid EIN"

    def _validate_ssn(self, ssn: str) -> tuple[bool, str]:
        """US Social Security Number — basic format check only."""
        if not ssn.isdigit() or len(ssn) != 9:
            return False, "SSN must be exactly 9 digits"
        if ssn[:3] == "000" or ssn[3:5] == "00" or ssn[5:] == "0000":
            return False, "SSN contains invalid segment"
        if ssn[:3] == "666" or ssn[:1] == "9":
            return False, "SSN contains reserved prefix"
        return True, "Valid SSN format"

    def _format_id(self, clean: str, jurisdiction: str, id_type: str) -> str:
        """Format tax ID for display."""
        if jurisdiction == "AU" and id_type == "abn":
            return f"{clean[:2]} {clean[2:5]} {clean[5:8]} {clean[8:]}"
        if jurisdiction == "AU" and id_type == "acn":
            return f"{clean[:3]} {clean[3:6]} {clean[6:]}"
        if jurisdiction == "NZ" and id_type == "ird":
            return f"{clean[:3]}-{clean[3:6]}-{clean[6:]}"
        if jurisdiction == "US" and id_type == "ein":
            return f"{clean[:2]}-{clean[2:]}"
        if jurisdiction == "US" and id_type == "ssn":
            return f"{clean[:3]}-{clean[3:5]}-{clean[5:]}"
        if jurisdiction == "GB" and id_type == "vat":
            return f"GB {clean[:3]} {clean[3:7]} {clean[7:]}"
        return clean


class GSTCalculator:
    """Multi-jurisdiction GST/VAT calculator.

    Every jurisdiction has different rules. This knows them all.
    """

    RATES = {
        "AU": {"standard": Decimal("10"), "name": "GST"},
        "NZ": {"standard": Decimal("15"), "name": "GST"},
        "GB": {"standard": Decimal("20"), "reduced": Decimal("5"), "zero": Decimal("0"), "name": "VAT"},
        "US": {"name": "Sales Tax", "note": "Varies by state — no federal GST/VAT"},
    }

    # Common US state sales tax rates
    US_STATES = {
        "CA": Decimal("7.25"), "NY": Decimal("4"), "TX": Decimal("6.25"),
        "FL": Decimal("6"), "WA": Decimal("6.5"), "IL": Decimal("6.25"),
        "PA": Decimal("6"), "OH": Decimal("5.75"), "NJ": Decimal("6.625"),
        "OR": Decimal("0"), "MT": Decimal("0"), "NH": Decimal("0"),
        "DE": Decimal("0"), "AK": Decimal("0"),
    }

    def calculate(
        self,
        amount: Decimal,
        jurisdiction: str,
        is_inclusive: bool = False,
        rate_type: str = "standard",
        us_state: str | None = None,
    ) -> dict:
        """Calculate GST/VAT for any supported jurisdiction."""
        jurisdiction = jurisdiction.upper()

        if jurisdiction == "US":
            rate = self.US_STATES.get(us_state, Decimal("0")) if us_state else Decimal("0")
            tax_name = f"Sales Tax ({us_state})" if us_state else "Sales Tax"
        else:
            rates = self.RATES.get(jurisdiction, {})
            rate = rates.get(rate_type, rates.get("standard", Decimal("0")))
            tax_name = rates.get("name", "Tax")

        if rate == 0:
            return {
                "exclusive": str(amount),
                "tax_amount": "0",
                "inclusive": str(amount),
                "rate_pct": "0",
                "tax_name": tax_name,
                "jurisdiction": jurisdiction,
                "note": "Zero-rated or no tax applies",
            }

        rate_decimal = rate / 100
        if is_inclusive:
            exclusive = (amount / (1 + rate_decimal)).quantize(TWO_DP)
            tax = (amount - exclusive).quantize(TWO_DP)
            inclusive = amount
        else:
            exclusive = amount
            tax = (amount * rate_decimal).quantize(TWO_DP)
            inclusive = (amount + tax).quantize(TWO_DP)

        return {
            "exclusive": str(exclusive),
            "tax_amount": str(tax),
            "inclusive": str(inclusive),
            "rate_pct": str(rate),
            "tax_name": tax_name,
            "jurisdiction": jurisdiction,
        }

    def compare_jurisdictions(self, amount: Decimal) -> dict:
        """Show the same amount across all jurisdictions — instant comparison."""
        results = {}
        for jur in ["AU", "NZ", "GB"]:
            results[jur] = self.calculate(amount, jur, is_inclusive=False)
        results["US_CA"] = self.calculate(amount, "US", is_inclusive=False, us_state="CA")
        results["US_OR"] = self.calculate(amount, "US", is_inclusive=False, us_state="OR")
        return {"amount": str(amount), "by_jurisdiction": results}


class CurrencyConverter:
    """Currency conversion with accounting-friendly features.

    Uses fixed reference rates (not live — live would require an API key).
    In production, this would hit an exchange rate API.
    """

    # Reference rates vs USD (indicative — for demo/offline use)
    RATES_VS_USD = {
        "USD": Decimal("1.0000"),
        "AUD": Decimal("1.5300"),
        "NZD": Decimal("1.6500"),
        "GBP": Decimal("0.7900"),
        "EUR": Decimal("0.9200"),
        "CAD": Decimal("1.3600"),
        "JPY": Decimal("149.50"),
        "SGD": Decimal("1.3400"),
        "HKD": Decimal("7.8100"),
        "CHF": Decimal("0.8800"),
        "INR": Decimal("83.10"),
        "ZAR": Decimal("18.50"),
    }

    def convert(
        self, amount: Decimal, from_currency: str, to_currency: str,
    ) -> dict:
        """Convert between currencies."""
        from_c = from_currency.upper()
        to_c = to_currency.upper()

        from_rate = self.RATES_VS_USD.get(from_c)
        to_rate = self.RATES_VS_USD.get(to_c)

        if not from_rate or not to_rate:
            supported = sorted(self.RATES_VS_USD.keys())
            return {"error": f"Unsupported currency. Supported: {', '.join(supported)}"}

        usd_amount = amount / from_rate
        converted = (usd_amount * to_rate).quantize(TWO_DP)
        rate = (to_rate / from_rate).quantize(Decimal("0.000001"))

        return {
            "from_amount": str(amount),
            "from_currency": from_c,
            "to_amount": str(converted),
            "to_currency": to_c,
            "exchange_rate": str(rate),
            "inverse_rate": str((from_rate / to_rate).quantize(Decimal("0.000001"))),
            "note": "Reference rates for estimation. Use actual bank rate for journal entries.",
        }

    def list_rates(self) -> dict:
        """List all available exchange rates."""
        return {
            "base": "USD",
            "rates": {k: str(v) for k, v in sorted(self.RATES_VS_USD.items())},
            "note": "Indicative reference rates. Not for final accounting entries.",
        }


class BusinessDateCalculator:
    """Business day and payment date calculations.

    "When is this due?" is a question asked 50 times a day
    in every accounting firm.
    """

    # Public holidays by jurisdiction (simplified — key dates)
    HOLIDAYS = {
        "AU": [
            (1, 1), (1, 26), (4, 25), (12, 25), (12, 26),
        ],
        "NZ": [
            (1, 1), (1, 2), (2, 6), (4, 25), (12, 25), (12, 26),
        ],
        "GB": [
            (1, 1), (12, 25), (12, 26),
        ],
        "US": [
            (1, 1), (7, 4), (12, 25),
        ],
    }

    def add_business_days(
        self, start: date, days: int, jurisdiction: str = "AU",
    ) -> dict:
        """Add business days to a date (skipping weekends and public holidays)."""
        holidays = {(start.year, m, d) for m, d in self.HOLIDAYS.get(jurisdiction.upper(), [])}
        holidays |= {(start.year + 1, m, d) for m, d in self.HOLIDAYS.get(jurisdiction.upper(), [])}

        current = start
        added = 0

        while added < days:
            current += timedelta(days=1)
            if current.weekday() < 5 and (current.year, current.month, current.day) not in holidays:
                added += 1

        return {
            "start_date": str(start),
            "business_days_added": days,
            "result_date": str(current),
            "result_day": current.strftime("%A"),
            "jurisdiction": jurisdiction.upper(),
            "calendar_days": (current - start).days,
        }

    def payment_due_date(
        self,
        invoice_date: date,
        terms_days: int = 30,
        jurisdiction: str = "AU",
    ) -> dict:
        """Calculate payment due date from invoice terms."""
        raw_due = invoice_date + timedelta(days=terms_days)

        # If due date falls on weekend, move to next business day
        adjusted = raw_due
        holidays = {(raw_due.year, m, d) for m, d in self.HOLIDAYS.get(jurisdiction.upper(), [])}

        while adjusted.weekday() >= 5 or (adjusted.year, adjusted.month, adjusted.day) in holidays:
            adjusted += timedelta(days=1)

        return {
            "invoice_date": str(invoice_date),
            "terms": f"Net {terms_days}",
            "raw_due_date": str(raw_due),
            "adjusted_due_date": str(adjusted),
            "adjusted_day": adjusted.strftime("%A"),
            "days_from_today": (adjusted - date.today()).days,
            "overdue": date.today() > adjusted,
        }

    def days_between(self, start: date, end: date, jurisdiction: str = "AU") -> dict:
        """Count calendar and business days between two dates."""
        calendar_days = (end - start).days
        holidays = {(y, m, d) for y in range(start.year, end.year + 1)
                     for m, d in self.HOLIDAYS.get(jurisdiction.upper(), [])}

        business_days = 0
        current = start
        while current < end:
            current += timedelta(days=1)
            if current.weekday() < 5 and (current.year, current.month, current.day) not in holidays:
                business_days += 1

        return {
            "start_date": str(start),
            "end_date": str(end),
            "calendar_days": calendar_days,
            "business_days": business_days,
            "weekends": calendar_days - business_days,
        }

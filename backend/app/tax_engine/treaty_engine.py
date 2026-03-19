"""Double Tax Agreement (DTA) / Treaty Engine.

Handles cross-border WHT calculations based on bilateral tax treaties.
References OECD Model Tax Convention and actual treaty texts.

DETERMINISTIC — no AI guessing. Treaty rates are hard-coded from
published government sources.
"""

from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True)
class TreatyRate:
    country_a: str
    country_b: str
    wht_dividends: Decimal
    wht_interest: Decimal
    wht_royalties: Decimal
    wht_services: Decimal  # technical/management fees
    pe_threshold_days: int  # permanent establishment threshold
    source: str  # URL or reference to treaty text


class TreatyEngine:
    """Looks up bilateral treaty WHT rates between two countries.

    If a US company pays a NZ contractor, this engine determines the
    correct WHT rate based on the US-NZ Double Tax Agreement.
    """

    def __init__(self):
        self._treaties: dict[str, TreatyRate] = {}
        self._load_treaties()

    def _load_treaties(self):
        """Load all bilateral treaty rates.

        These are the 6 combinations for US, AU, NZ, GB.
        Rates sourced from actual treaty texts.
        """
        treaties = [
            # US-AU: Convention signed 6 Aug 1982, Protocol 2001
            TreatyRate("US", "AU",
                       wht_dividends=Decimal("0.15"),
                       wht_interest=Decimal("0.10"),
                       wht_royalties=Decimal("0.05"),
                       wht_services=Decimal("0"),
                       pe_threshold_days=183,
                       source="US-Australia Income Tax Convention 1982, Protocol 2001"),

            # US-NZ: Convention signed 23 Jul 1982
            TreatyRate("US", "NZ",
                       wht_dividends=Decimal("0.15"),
                       wht_interest=Decimal("0.10"),
                       wht_royalties=Decimal("0.10"),
                       wht_services=Decimal("0"),
                       pe_threshold_days=183,
                       source="US-New Zealand Income Tax Convention 1982"),

            # US-GB: Convention signed 24 Jul 2001
            TreatyRate("US", "GB",
                       wht_dividends=Decimal("0.15"),
                       wht_interest=Decimal("0"),
                       wht_royalties=Decimal("0"),
                       wht_services=Decimal("0"),
                       pe_threshold_days=183,
                       source="US-UK Income Tax Convention 2001"),

            # AU-NZ: Convention signed 26 Jun 2009
            TreatyRate("AU", "NZ",
                       wht_dividends=Decimal("0.15"),
                       wht_interest=Decimal("0.10"),
                       wht_royalties=Decimal("0.05"),
                       wht_services=Decimal("0"),
                       pe_threshold_days=183,
                       source="Australia-New Zealand DTA 2009"),

            # AU-GB: Convention signed 21 Aug 2003
            TreatyRate("AU", "GB",
                       wht_dividends=Decimal("0.15"),
                       wht_interest=Decimal("0"),
                       wht_royalties=Decimal("0.05"),
                       wht_services=Decimal("0"),
                       pe_threshold_days=183,
                       source="Australia-UK DTA 2003"),

            # NZ-GB: Convention signed 4 Aug 1983, Protocol 2003
            TreatyRate("NZ", "GB",
                       wht_dividends=Decimal("0.15"),
                       wht_interest=Decimal("0.10"),
                       wht_royalties=Decimal("0.10"),
                       wht_services=Decimal("0"),
                       pe_threshold_days=183,
                       source="New Zealand-UK DTA 1983, Protocol 2003"),
        ]

        for t in treaties:
            # Store both directions for easy lookup
            self._treaties[self._key(t.country_a, t.country_b)] = t
            self._treaties[self._key(t.country_b, t.country_a)] = t

    @staticmethod
    def _key(a: str, b: str) -> str:
        return f"{a}-{b}"

    def get_treaty(self, country_source: str, country_recipient: str) -> TreatyRate | None:
        """Look up the treaty between two countries."""
        return self._treaties.get(self._key(country_source, country_recipient))

    def get_wht_rate(
        self, country_source: str, country_recipient: str,
        income_type: str = "services",
    ) -> Decimal | None:
        """Get the treaty WHT rate for a specific income type.

        Args:
            country_source: Country where income is sourced (payer)
            country_recipient: Country of the recipient (payee)
            income_type: dividends, interest, royalties, or services

        Returns:
            Treaty WHT rate as a Decimal, or None if no treaty exists.
        """
        treaty = self.get_treaty(country_source, country_recipient)
        if not treaty:
            return None

        rate_map = {
            "dividends": treaty.wht_dividends,
            "interest": treaty.wht_interest,
            "royalties": treaty.wht_royalties,
            "services": treaty.wht_services,
        }
        return rate_map.get(income_type)

    def calculate_withholding(
        self, gross_amount: Decimal,
        country_source: str, country_recipient: str,
        income_type: str = "services",
        domestic_rate: Decimal | None = None,
    ) -> dict:
        """Calculate WHT on a cross-border payment.

        Applies the LOWER of domestic rate or treaty rate (treaty benefit).

        Returns a dict with full breakdown for audit trail.
        """
        treaty = self.get_treaty(country_source, country_recipient)
        treaty_rate = self.get_wht_rate(country_source, country_recipient, income_type)

        if treaty_rate is not None and domestic_rate is not None:
            effective_rate = min(treaty_rate, domestic_rate)
            treaty_applied = treaty_rate < domestic_rate
        elif treaty_rate is not None:
            effective_rate = treaty_rate
            treaty_applied = True
        elif domestic_rate is not None:
            effective_rate = domestic_rate
            treaty_applied = False
        else:
            effective_rate = Decimal("0")
            treaty_applied = False

        wht_amount = (gross_amount * effective_rate).quantize(Decimal("0.01"))
        net_amount = gross_amount - wht_amount

        return {
            "gross_amount": str(gross_amount),
            "wht_rate": str(effective_rate),
            "wht_amount": str(wht_amount),
            "net_amount": str(net_amount),
            "treaty_applied": treaty_applied,
            "treaty_name": f"{country_source}-{country_recipient} DTA" if treaty else None,
            "treaty_source": treaty.source if treaty else None,
            "domestic_rate": str(domestic_rate) if domestic_rate else None,
            "treaty_rate": str(treaty_rate) if treaty_rate is not None else None,
            "income_type": income_type,
            "country_source": country_source,
            "country_recipient": country_recipient,
        }

    def list_treaties(self) -> list[dict]:
        """Return all loaded treaties (deduplicated)."""
        seen = set()
        results = []
        for treaty in self._treaties.values():
            key = tuple(sorted([treaty.country_a, treaty.country_b]))
            if key not in seen:
                seen.add(key)
                results.append({
                    "countries": f"{treaty.country_a}-{treaty.country_b}",
                    "wht_dividends": str(treaty.wht_dividends),
                    "wht_interest": str(treaty.wht_interest),
                    "wht_royalties": str(treaty.wht_royalties),
                    "wht_services": str(treaty.wht_services),
                    "source": treaty.source,
                })
        return results

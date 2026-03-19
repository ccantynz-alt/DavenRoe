"""Banking Provider Registry.

Maps countries to the best available bank feed provider.
When a user says "connect my bank" we automatically pick
the right provider for their region.
"""

from app.banking.provider import BankFeedProvider


class BankingProviderRegistry:
    """Routes bank connections to the correct provider by country.

    The user never needs to know about Plaid vs Basiq vs TrueLayer.
    They just click "Connect Bank" and we handle the rest.

    Priority order when multiple providers cover the same country:
    Use the most established provider with the best bank coverage.
    """

    def __init__(self):
        self._providers: dict[str, BankFeedProvider] = {}
        self._country_map: dict[str, str] = {}  # country -> provider_name

    def register(self, provider: BankFeedProvider, priority_countries: list[str] | None = None):
        """Register a banking provider."""
        self._providers[provider.provider_name] = provider

        # Map countries to this provider (priority_countries override existing mappings)
        target_countries = priority_countries or provider.supported_countries
        for country in target_countries:
            self._country_map[country] = provider.provider_name

    def get_provider_for_country(self, country_code: str) -> BankFeedProvider | None:
        """Get the best provider for a given country."""
        provider_name = self._country_map.get(country_code.upper())
        if provider_name:
            return self._providers.get(provider_name)
        return None

    def get_provider_by_name(self, name: str) -> BankFeedProvider | None:
        """Get a specific provider by name."""
        return self._providers.get(name)

    def list_supported_countries(self) -> dict[str, str]:
        """List all supported countries and their provider."""
        return dict(sorted(self._country_map.items()))

    def list_providers(self) -> list[dict]:
        """List all registered providers."""
        return [
            {
                "name": p.provider_name,
                "countries": p.supported_countries,
                "priority_countries": [
                    c for c, pn in self._country_map.items()
                    if pn == p.provider_name
                ],
            }
            for p in self._providers.values()
        ]


# ── Global singleton ──────────────────────────────────────────

_registry: BankingProviderRegistry | None = None


def get_banking_registry() -> BankingProviderRegistry:
    """Get or create the global banking provider registry."""
    global _registry
    if _registry is None:
        _registry = BankingProviderRegistry()
        _register_all_providers(_registry)
    return _registry


def _register_all_providers(registry: BankingProviderRegistry):
    """Register all available providers.

    Import is deferred so missing API keys don't crash the app.
    Providers gracefully degrade if not configured.
    """
    from app.banking.plaid_provider import PlaidProvider
    from app.banking.basiq_provider import BasiqProvider
    from app.banking.truelayer_provider import TrueLayerProvider

    # Plaid: US, Canada (primary), + UK/EU (secondary)
    registry.register(PlaidProvider(), priority_countries=["US", "CA"])

    # Basiq: Australia, New Zealand
    registry.register(BasiqProvider(), priority_countries=["AU", "NZ"])

    # TrueLayer: UK, EU (30+ countries)
    registry.register(TrueLayerProvider(), priority_countries=[
        "GB", "IE",  # UK & Ireland
        "FR", "DE", "ES", "IT", "NL", "BE", "AT", "PT",  # Major EU
        "FI", "LT", "LV", "EE", "PL", "CZ", "SK", "HU",  # Nordics & CEE
        "DK", "SE", "NO",  # Nordics
        "RO", "BG", "HR", "SI",  # SE Europe
    ])

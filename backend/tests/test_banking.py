"""Tests for the banking provider registry and abstraction layer."""

from app.banking.registry import BankingProviderRegistry
from app.banking.plaid_provider import PlaidProvider
from app.banking.basiq_provider import BasiqProvider
from app.banking.truelayer_provider import TrueLayerProvider
from app.banking.provider import BankFeedProvider


def test_registry_initialization():
    """All three providers should register successfully."""
    registry = BankingProviderRegistry()
    registry.register(PlaidProvider(), priority_countries=["US", "CA"])
    registry.register(BasiqProvider(), priority_countries=["AU", "NZ"])
    registry.register(TrueLayerProvider(), priority_countries=["GB", "IE", "DE", "FR"])

    providers = registry.list_providers()
    assert len(providers) == 3


def test_country_routing_us():
    """US should route to Plaid."""
    registry = BankingProviderRegistry()
    registry.register(PlaidProvider(), priority_countries=["US", "CA"])
    provider = registry.get_provider_for_country("US")
    assert provider is not None
    assert provider.provider_name == "plaid"


def test_country_routing_au():
    """Australia should route to Basiq."""
    registry = BankingProviderRegistry()
    registry.register(BasiqProvider(), priority_countries=["AU", "NZ"])
    provider = registry.get_provider_for_country("AU")
    assert provider is not None
    assert provider.provider_name == "basiq"


def test_country_routing_nz():
    """New Zealand should route to Basiq."""
    registry = BankingProviderRegistry()
    registry.register(BasiqProvider(), priority_countries=["AU", "NZ"])
    provider = registry.get_provider_for_country("NZ")
    assert provider is not None
    assert provider.provider_name == "basiq"


def test_country_routing_gb():
    """UK should route to TrueLayer."""
    registry = BankingProviderRegistry()
    registry.register(TrueLayerProvider(), priority_countries=["GB", "IE"])
    provider = registry.get_provider_for_country("GB")
    assert provider is not None
    assert provider.provider_name == "truelayer"


def test_unsupported_country():
    """Unsupported country should return None."""
    registry = BankingProviderRegistry()
    registry.register(PlaidProvider(), priority_countries=["US"])
    assert registry.get_provider_for_country("JP") is None


def test_supported_countries_list():
    """Should list all supported countries."""
    registry = BankingProviderRegistry()
    registry.register(PlaidProvider(), priority_countries=["US", "CA"])
    registry.register(BasiqProvider(), priority_countries=["AU", "NZ"])
    registry.register(TrueLayerProvider(), priority_countries=["GB", "IE", "DE", "FR"])

    countries = registry.list_supported_countries()
    assert "US" in countries
    assert "AU" in countries
    assert "GB" in countries
    assert "NZ" in countries
    assert len(countries) >= 6


def test_provider_implements_interface():
    """All providers should implement the BankFeedProvider interface."""
    for ProviderClass in [PlaidProvider, BasiqProvider, TrueLayerProvider]:
        provider = ProviderClass()
        assert isinstance(provider, BankFeedProvider)
        assert isinstance(provider.provider_name, str)
        assert isinstance(provider.supported_countries, list)
        assert len(provider.supported_countries) > 0


def test_plaid_supported_countries():
    provider = PlaidProvider()
    assert "US" in provider.supported_countries
    assert "CA" in provider.supported_countries


def test_basiq_supported_countries():
    provider = BasiqProvider()
    assert "AU" in provider.supported_countries
    assert "NZ" in provider.supported_countries


def test_truelayer_supported_countries():
    provider = TrueLayerProvider()
    assert "GB" in provider.supported_countries
    assert len(provider.supported_countries) >= 20  # 25 EU countries + UK

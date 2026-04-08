"""Abstract Bank Feed Provider interface.

This is the abstraction layer that makes global bank feeds "easy."
Every provider (Plaid, Basiq, TrueLayer, etc.) implements the same
interface. The rest of Marco Reid never knows which provider is being used.

One interface, every bank in the world.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import date, datetime
from decimal import Decimal


@dataclass
class BankTransaction:
    """Normalized bank transaction — same format regardless of provider."""
    provider_id: str              # unique ID from the banking provider
    account_id: str               # bank account identifier
    date: date
    amount: Decimal               # positive = credit, negative = debit
    currency: str                 # ISO 4217
    description: str              # raw bank description
    merchant_name: str | None = None
    merchant_category: str | None = None  # MCC code or category name
    pending: bool = False
    reference: str | None = None  # check number, transfer ref, etc.
    balance_after: Decimal | None = None
    raw_data: dict = field(default_factory=dict)  # full original payload for audit


@dataclass
class BankAccount:
    """Normalized bank account info."""
    provider_account_id: str
    name: str
    official_name: str | None = None
    account_type: str = "checking"  # checking, savings, credit, loan, investment
    currency: str = "USD"
    institution_name: str | None = None
    institution_id: str | None = None
    mask: str | None = None  # last 4 digits
    balance_current: Decimal | None = None
    balance_available: Decimal | None = None


@dataclass
class ConnectionResult:
    """Result of connecting a bank account."""
    success: bool
    provider: str
    access_token: str | None = None  # encrypted, never exposed to frontend
    accounts: list[BankAccount] = field(default_factory=list)
    error: str | None = None
    institution_name: str | None = None


class BankFeedProvider(ABC):
    """Abstract interface that all bank feed providers must implement.

    This is the key to making global bank access easy:
    - Plaid for US/Canada
    - Basiq for Australia/NZ
    - TrueLayer for UK/EU
    - GoCardless/Nordigen for additional EU
    - Mono for Africa
    - Belvo for LatAm

    Every provider looks the same to the rest of the system.
    """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Human-readable provider name."""
        ...

    @property
    @abstractmethod
    def supported_countries(self) -> list[str]:
        """ISO 3166-1 alpha-2 country codes this provider supports."""
        ...

    @abstractmethod
    async def create_link_token(self, user_id: str, country: str | None = None) -> dict:
        """Generate a link/connect token for the frontend widget.

        The user clicks a button, the frontend opens the provider's
        widget using this token, and the user authenticates with their bank.
        """
        ...

    @abstractmethod
    async def exchange_token(self, public_token: str) -> ConnectionResult:
        """Exchange the public token from the widget for a persistent access token."""
        ...

    @abstractmethod
    async def get_accounts(self, access_token: str) -> list[BankAccount]:
        """Get all accounts for a connected bank."""
        ...

    @abstractmethod
    async def get_transactions(
        self, access_token: str, account_id: str,
        start_date: date, end_date: date,
    ) -> list[BankTransaction]:
        """Fetch transactions for a specific account and date range."""
        ...

    @abstractmethod
    async def sync_transactions(self, access_token: str, cursor: str | None = None) -> dict:
        """Incremental sync — get only new/modified transactions since last sync.

        Returns: {transactions: [...], cursor: "next_cursor", has_more: bool}
        """
        ...

    @abstractmethod
    async def disconnect(self, access_token: str) -> bool:
        """Revoke access to a connected bank."""
        ...

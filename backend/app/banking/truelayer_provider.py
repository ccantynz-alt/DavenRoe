"""TrueLayer bank feed provider — UK and EU.

TrueLayer connects to 5,000+ banks across the UK and EU via
Open Banking (PSD2). Covers 30+ countries.
"""

from datetime import date
from decimal import Decimal

import httpx

from app.banking.provider import (
    BankAccount,
    BankFeedProvider,
    BankTransaction,
    ConnectionResult,
)
from app.core.config import get_settings


class TrueLayerProvider(BankFeedProvider):
    """TrueLayer implementation for UK/EU bank feeds."""

    AUTH_URL = "https://auth.truelayer.com"
    API_URL = "https://api.truelayer.com"

    def __init__(self):
        settings = get_settings()
        self._client_id = getattr(settings, "truelayer_client_id", "")
        self._client_secret = getattr(settings, "truelayer_client_secret", "")
        self._redirect_uri = getattr(settings, "truelayer_redirect_uri", "http://localhost:3000/callback/truelayer")

    @property
    def provider_name(self) -> str:
        return "truelayer"

    @property
    def supported_countries(self) -> list[str]:
        return [
            "GB", "IE", "FR", "DE", "ES", "IT", "NL", "BE", "AT", "PT",
            "FI", "LT", "LV", "EE", "PL", "CZ", "SK", "HU",
            "DK", "SE", "NO", "RO", "BG", "HR", "SI",
        ]

    async def create_link_token(self, user_id: str, country: str | None = None) -> dict:
        """Generate TrueLayer auth link for the frontend."""
        providers = "uk-ob-all" if country == "GB" else "ob-all"
        auth_url = (
            f"{self.AUTH_URL}/?response_type=code"
            f"&client_id={self._client_id}"
            f"&scope=info%20accounts%20transactions%20balance"
            f"&redirect_uri={self._redirect_uri}"
            f"&providers={providers}"
        )
        return {"auth_url": auth_url, "provider": "truelayer"}

    async def exchange_token(self, public_token: str) -> ConnectionResult:
        """Exchange authorization code for access token."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.AUTH_URL}/connect/token",
                    data={
                        "grant_type": "authorization_code",
                        "client_id": self._client_id,
                        "client_secret": self._client_secret,
                        "redirect_uri": self._redirect_uri,
                        "code": public_token,
                    },
                    timeout=30,
                )
                response.raise_for_status()
                data = response.json()

            access_token = data.get("access_token")
            accounts = await self.get_accounts(access_token)

            return ConnectionResult(
                success=True,
                provider="truelayer",
                access_token=access_token,
                accounts=accounts,
            )
        except Exception as e:
            return ConnectionResult(success=False, provider="truelayer", error=str(e))

    async def get_accounts(self, access_token: str) -> list[BankAccount]:
        """Get accounts via TrueLayer."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.API_URL}/data/v1/accounts",
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=30,
            )
            response.raise_for_status()
            data = response.json()

        return [
            BankAccount(
                provider_account_id=acct.get("account_id", ""),
                name=acct.get("display_name", ""),
                official_name=acct.get("description"),
                account_type=acct.get("account_type", "TRANSACTION"),
                currency=acct.get("currency", "GBP"),
                institution_name=acct.get("provider", {}).get("display_name"),
                institution_id=acct.get("provider", {}).get("provider_id"),
            )
            for acct in data.get("results", [])
        ]

    async def get_transactions(
        self, access_token: str, account_id: str,
        start_date: date, end_date: date,
    ) -> list[BankTransaction]:
        """Fetch transactions from TrueLayer."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.API_URL}/data/v1/accounts/{account_id}/transactions",
                headers={"Authorization": f"Bearer {access_token}"},
                params={"from": start_date.isoformat(), "to": end_date.isoformat()},
                timeout=30,
            )
            response.raise_for_status()
            data = response.json()

        return [self._normalize_transaction(t, account_id) for t in data.get("results", [])]

    async def sync_transactions(self, access_token: str, cursor: str | None = None) -> dict:
        """TrueLayer doesn't have cursor-based sync — fetch last 30 days."""
        from datetime import timedelta
        end = date.today()
        start = end - timedelta(days=30)

        accounts = await self.get_accounts(access_token)
        all_txns = []
        for acct in accounts:
            txns = await self.get_transactions(access_token, acct.provider_account_id, start, end)
            all_txns.extend(txns)

        return {
            "added": all_txns,
            "modified": [],
            "removed": [],
            "cursor": None,
            "has_more": False,
        }

    async def disconnect(self, access_token: str) -> bool:
        """Revoke TrueLayer access."""
        try:
            async with httpx.AsyncClient() as client:
                await client.delete(
                    f"{self.API_URL}/data/v1/tokens",
                    headers={"Authorization": f"Bearer {access_token}"},
                    timeout=30,
                )
            return True
        except Exception:
            return False

    @staticmethod
    def _normalize_transaction(tl_txn: dict, account_id: str) -> BankTransaction:
        """Convert TrueLayer transaction to our normalized format."""
        return BankTransaction(
            provider_id=tl_txn.get("transaction_id", ""),
            account_id=account_id,
            date=date.fromisoformat(tl_txn.get("timestamp", "2024-01-01")[:10]),
            amount=Decimal(str(tl_txn.get("amount", 0))),
            currency=tl_txn.get("currency", "GBP"),
            description=tl_txn.get("description", ""),
            merchant_name=tl_txn.get("merchant_name"),
            merchant_category=tl_txn.get("transaction_category"),
            pending=tl_txn.get("transaction_type") == "PENDING",
            raw_data=tl_txn,
        )

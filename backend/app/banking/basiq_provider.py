"""Basiq bank feed provider — Australia and New Zealand.

Basiq connects to 170+ financial institutions across AU and NZ
using Open Banking (CDR in Australia) and screen scraping fallback.
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


class BasiqProvider(BankFeedProvider):
    """Basiq implementation for AU/NZ bank feeds."""

    BASE_URL = "https://au-api.basiq.io"

    def __init__(self):
        settings = get_settings()
        self._api_key = getattr(settings, "basiq_api_key", "")
        self._token: str | None = None

    @property
    def provider_name(self) -> str:
        return "basiq"

    @property
    def supported_countries(self) -> list[str]:
        return ["AU", "NZ"]

    async def _get_token(self) -> str:
        """Authenticate with Basiq and get a server token."""
        if self._token:
            return self._token

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.BASE_URL}/token",
                headers={
                    "Authorization": f"Basic {self._api_key}",
                    "Content-Type": "application/x-www-form-urlencoded",
                    "basiq-version": "3.0",
                },
                data={"scope": "SERVER_ACCESS"},
                timeout=30,
            )
            response.raise_for_status()
            self._token = response.json().get("access_token")
            return self._token

    async def _request(self, method: str, endpoint: str, data: dict | None = None) -> dict:
        """Make authenticated request to Basiq API."""
        token = await self._get_token()
        async with httpx.AsyncClient() as client:
            response = await client.request(
                method,
                f"{self.BASE_URL}{endpoint}",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                    "basiq-version": "3.0",
                },
                json=data,
                timeout=30,
            )
            response.raise_for_status()
            return response.json()

    async def create_link_token(self, user_id: str, country: str | None = None) -> dict:
        """Create a Basiq consent UI link."""
        # Create user in Basiq first
        user = await self._request("POST", "/users", {"email": f"{user_id}@astra.temp"})
        basiq_user_id = user.get("id")

        # Generate consent link
        token = await self._get_token()
        return {
            "link_url": f"https://consent.basiq.io/home?token={token}&userId={basiq_user_id}",
            "basiq_user_id": basiq_user_id,
            "provider": "basiq",
        }

    async def exchange_token(self, public_token: str) -> ConnectionResult:
        """For Basiq, the 'public_token' is actually the basiq user ID after consent."""
        try:
            accounts = await self.get_accounts(public_token)
            return ConnectionResult(
                success=True,
                provider="basiq",
                access_token=public_token,  # basiq user ID acts as the access token
                accounts=accounts,
            )
        except Exception as e:
            return ConnectionResult(success=False, provider="basiq", error=str(e))

    async def get_accounts(self, access_token: str) -> list[BankAccount]:
        """Get accounts for a Basiq user."""
        result = await self._request("GET", f"/users/{access_token}/accounts")
        return [
            BankAccount(
                provider_account_id=acct.get("id", ""),
                name=acct.get("name", ""),
                official_name=acct.get("accountNo"),
                account_type=acct.get("class", {}).get("type", "transaction"),
                currency=acct.get("currency", "AUD"),
                institution_name=acct.get("institution"),
                balance_current=Decimal(str(acct.get("balance", 0))),
                balance_available=Decimal(str(acct.get("availableFunds", 0))),
            )
            for acct in result.get("data", [])
        ]

    async def get_transactions(
        self, access_token: str, account_id: str,
        start_date: date, end_date: date,
    ) -> list[BankTransaction]:
        """Fetch transactions from Basiq."""
        endpoint = (
            f"/users/{access_token}/transactions"
            f"?filter=account.id.eq('{account_id}')"
            f",transaction.postDate.bt('{start_date.isoformat()}','{end_date.isoformat()}')"
        )
        result = await self._request("GET", endpoint)
        return [self._normalize_transaction(t) for t in result.get("data", [])]

    async def sync_transactions(self, access_token: str, cursor: str | None = None) -> dict:
        """Refresh connection and get latest transactions."""
        # Trigger refresh
        await self._request("POST", f"/users/{access_token}/connections/refresh")

        # Get recent transactions
        result = await self._request("GET", f"/users/{access_token}/transactions?limit=500")
        transactions = [self._normalize_transaction(t) for t in result.get("data", [])]

        return {
            "added": transactions,
            "modified": [],
            "removed": [],
            "cursor": result.get("links", {}).get("next"),
            "has_more": bool(result.get("links", {}).get("next")),
        }

    async def disconnect(self, access_token: str) -> bool:
        """Delete Basiq user and all their data."""
        try:
            await self._request("DELETE", f"/users/{access_token}")
            return True
        except Exception:
            return False

    @staticmethod
    def _normalize_transaction(basiq_txn: dict) -> BankTransaction:
        """Convert Basiq transaction to our normalized format."""
        return BankTransaction(
            provider_id=basiq_txn.get("id", ""),
            account_id=basiq_txn.get("account", ""),
            date=date.fromisoformat(basiq_txn.get("postDate", "2024-01-01")[:10]),
            amount=Decimal(str(basiq_txn.get("amount", 0))),
            currency=basiq_txn.get("currency", "AUD"),
            description=basiq_txn.get("description", ""),
            merchant_name=basiq_txn.get("subClass", {}).get("title"),
            merchant_category=basiq_txn.get("class", {}).get("title"),
            pending=basiq_txn.get("status", "") == "pending",
            raw_data=basiq_txn,
        )

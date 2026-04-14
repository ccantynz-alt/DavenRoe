"""Plaid bank feed provider — US and Canada.

Plaid covers 12,000+ institutions in the US and Canada.
This is the go-to for North American bank connections.
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


class PlaidProvider(BankFeedProvider):
    """Plaid implementation for US/Canada bank feeds."""

    ENVIRONMENTS = {
        "sandbox": "https://sandbox.plaid.com",
        "development": "https://development.plaid.com",
        "production": "https://production.plaid.com",
    }

    def __init__(self):
        settings = get_settings()
        self._client_id = settings.plaid_client_id
        self._secret = settings.plaid_secret
        self._env = settings.plaid_env
        self._base_url = self.ENVIRONMENTS.get(self._env, self.ENVIRONMENTS["sandbox"])

    @property
    def provider_name(self) -> str:
        return "plaid"

    @property
    def supported_countries(self) -> list[str]:
        return ["US", "CA", "GB", "IE", "FR", "ES", "NL"]

    async def _request(self, endpoint: str, data: dict) -> dict:
        """Make authenticated request to Plaid API."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self._base_url}{endpoint}",
                json={
                    "client_id": self._client_id,
                    "secret": self._secret,
                    **data,
                },
                timeout=30,
            )
            response.raise_for_status()
            return response.json()

    async def create_link_token(self, user_id: str, country: str | None = None) -> dict:
        """Create a Plaid Link token for the frontend widget."""
        countries = [country] if country else ["US"]
        result = await self._request("/link/token/create", {
            "user": {"client_user_id": user_id},
            "client_name": "DavenRoe",
            "products": ["transactions"],
            "country_codes": countries,
            "language": "en",
        })
        return {"link_token": result.get("link_token"), "provider": "plaid"}

    async def exchange_token(self, public_token: str) -> ConnectionResult:
        """Exchange Plaid public token for access token."""
        try:
            result = await self._request("/item/public_token/exchange", {
                "public_token": public_token,
            })
            access_token = result.get("access_token")
            accounts = await self.get_accounts(access_token)
            return ConnectionResult(
                success=True,
                provider="plaid",
                access_token=access_token,
                accounts=accounts,
            )
        except Exception as e:
            return ConnectionResult(success=False, provider="plaid", error=str(e))

    async def get_accounts(self, access_token: str) -> list[BankAccount]:
        """Get accounts from Plaid."""
        result = await self._request("/accounts/get", {"access_token": access_token})
        return [
            BankAccount(
                provider_account_id=acct["account_id"],
                name=acct.get("name", ""),
                official_name=acct.get("official_name"),
                account_type=acct.get("type", "checking"),
                currency=acct.get("balances", {}).get("iso_currency_code", "USD"),
                institution_name=None,
                mask=acct.get("mask"),
                balance_current=Decimal(str(acct.get("balances", {}).get("current", 0))),
                balance_available=Decimal(str(acct.get("balances", {}).get("available", 0))),
            )
            for acct in result.get("accounts", [])
        ]

    async def get_transactions(
        self, access_token: str, account_id: str,
        start_date: date, end_date: date,
    ) -> list[BankTransaction]:
        """Fetch transactions from Plaid."""
        result = await self._request("/transactions/get", {
            "access_token": access_token,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "options": {"account_ids": [account_id], "count": 500},
        })
        return [self._normalize_transaction(t) for t in result.get("transactions", [])]

    async def sync_transactions(self, access_token: str, cursor: str | None = None) -> dict:
        """Incremental transaction sync via Plaid Sync."""
        data = {"access_token": access_token}
        if cursor:
            data["cursor"] = cursor

        result = await self._request("/transactions/sync", data)
        added = [self._normalize_transaction(t) for t in result.get("added", [])]
        modified = [self._normalize_transaction(t) for t in result.get("modified", [])]

        return {
            "added": added,
            "modified": modified,
            "removed": result.get("removed", []),
            "cursor": result.get("next_cursor"),
            "has_more": result.get("has_more", False),
        }

    async def disconnect(self, access_token: str) -> bool:
        """Remove a Plaid item."""
        try:
            await self._request("/item/remove", {"access_token": access_token})
            return True
        except Exception:
            return False

    @staticmethod
    def _normalize_transaction(plaid_txn: dict) -> BankTransaction:
        """Convert Plaid transaction to our normalized format."""
        return BankTransaction(
            provider_id=plaid_txn.get("transaction_id", ""),
            account_id=plaid_txn.get("account_id", ""),
            date=date.fromisoformat(plaid_txn.get("date", "2024-01-01")),
            amount=Decimal(str(-plaid_txn.get("amount", 0))),  # Plaid uses negative for credits
            currency=plaid_txn.get("iso_currency_code", "USD") or "USD",
            description=plaid_txn.get("name", ""),
            merchant_name=plaid_txn.get("merchant_name"),
            merchant_category=plaid_txn.get("personal_finance_category", {}).get("primary"),
            pending=plaid_txn.get("pending", False),
            reference=plaid_txn.get("payment_meta", {}).get("reference_number"),
            raw_data=plaid_txn,
        )

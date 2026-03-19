"""Bank Feed API routes.

Provides a unified interface for connecting to banks worldwide.
The user never needs to know which provider is being used — they
just click "Connect Bank" and we handle the rest.
"""

from datetime import date, timedelta

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.banking.registry import get_banking_registry

router = APIRouter(prefix="/banking", tags=["Bank Feeds"])


class ConnectBankRequest(BaseModel):
    user_id: str
    country: str = Field(..., examples=["US", "AU", "NZ", "GB", "DE", "FR"])


class ExchangeTokenRequest(BaseModel):
    public_token: str
    country: str


class SyncRequest(BaseModel):
    access_token: str
    country: str
    cursor: str | None = None


class TransactionFetchRequest(BaseModel):
    access_token: str
    account_id: str
    country: str
    start_date: date
    end_date: date


# ── Connection ───────────────────────────────────────────────

@router.get("/providers")
async def list_providers():
    """List all available banking providers and supported countries."""
    registry = get_banking_registry()
    return {
        "providers": registry.list_providers(),
        "supported_countries": registry.list_supported_countries(),
        "total_countries": len(registry.list_supported_countries()),
    }


@router.get("/providers/{country_code}")
async def get_provider_for_country(country_code: str):
    """Check which banking provider covers a specific country."""
    registry = get_banking_registry()
    provider = registry.get_provider_for_country(country_code.upper())
    if not provider:
        raise HTTPException(
            status_code=404,
            detail=f"No banking provider available for country: {country_code}",
        )
    return {
        "country": country_code.upper(),
        "provider": provider.provider_name,
        "supported": True,
    }


@router.post("/connect")
async def connect_bank(req: ConnectBankRequest):
    """Initiate bank connection — returns a link/auth URL for the frontend.

    The frontend opens the provider's widget/page using the returned token/URL.
    The user authenticates with their bank. No credentials touch our servers.
    """
    registry = get_banking_registry()
    provider = registry.get_provider_for_country(req.country.upper())
    if not provider:
        raise HTTPException(
            status_code=404,
            detail=f"No banking provider available for {req.country}",
        )

    result = await provider.create_link_token(req.user_id, req.country.upper())
    result["country"] = req.country.upper()
    return result


@router.post("/exchange")
async def exchange_token(req: ExchangeTokenRequest):
    """Exchange the public token from the bank widget for a persistent connection."""
    registry = get_banking_registry()
    provider = registry.get_provider_for_country(req.country.upper())
    if not provider:
        raise HTTPException(status_code=404, detail=f"No provider for {req.country}")

    result = await provider.exchange_token(req.public_token)
    if not result.success:
        raise HTTPException(status_code=400, detail=result.error or "Token exchange failed")

    return {
        "success": True,
        "provider": result.provider,
        "accounts": [
            {
                "id": a.provider_account_id,
                "name": a.name,
                "type": a.account_type,
                "currency": a.currency,
                "institution": a.institution_name,
                "balance": str(a.balance_current) if a.balance_current else None,
            }
            for a in result.accounts
        ],
        # access_token is stored server-side, never sent to frontend
    }


# ── Transactions ─────────────────────────────────────────────

@router.post("/transactions")
async def fetch_transactions(req: TransactionFetchRequest):
    """Fetch transactions for a connected bank account."""
    registry = get_banking_registry()
    provider = registry.get_provider_for_country(req.country.upper())
    if not provider:
        raise HTTPException(status_code=404, detail=f"No provider for {req.country}")

    transactions = await provider.get_transactions(
        req.access_token, req.account_id, req.start_date, req.end_date,
    )

    return {
        "provider": provider.provider_name,
        "account_id": req.account_id,
        "transaction_count": len(transactions),
        "transactions": [
            {
                "id": t.provider_id,
                "date": t.date.isoformat(),
                "amount": str(t.amount),
                "currency": t.currency,
                "description": t.description,
                "merchant": t.merchant_name,
                "category": t.merchant_category,
                "pending": t.pending,
            }
            for t in transactions
        ],
        "_legal": {
            "disclaimer": "Bank feed data is provided by third-party aggregation services. "
                          "Always reconcile against official bank statements.",
        },
    }


@router.post("/sync")
async def sync_transactions(req: SyncRequest):
    """Incremental sync — get only new/modified transactions since last sync."""
    registry = get_banking_registry()
    provider = registry.get_provider_for_country(req.country.upper())
    if not provider:
        raise HTTPException(status_code=404, detail=f"No provider for {req.country}")

    result = await provider.sync_transactions(req.access_token, req.cursor)

    return {
        "provider": provider.provider_name,
        "added_count": len(result["added"]),
        "modified_count": len(result["modified"]),
        "removed_count": len(result["removed"]),
        "cursor": result["cursor"],
        "has_more": result["has_more"],
        "added": [
            {
                "id": t.provider_id,
                "date": t.date.isoformat(),
                "amount": str(t.amount),
                "currency": t.currency,
                "description": t.description,
                "merchant": t.merchant_name,
                "pending": t.pending,
            }
            for t in result["added"]
        ],
    }

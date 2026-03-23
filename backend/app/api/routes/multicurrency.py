"""Multi-Currency API routes."""

from decimal import Decimal
from fastapi import APIRouter, Depends
from app.multicurrency.ledger import MultiCurrencyLedger
from app.auth.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/multicurrency", tags=["Multi-Currency"])
ledger = MultiCurrencyLedger()


@router.post("/transaction")
async def record_fx_transaction(data: dict, user: User = Depends(get_current_user)):
    txn = ledger.record_transaction(
        foreign_currency=data.get("currency", "USD"),
        foreign_amount=Decimal(str(data.get("amount", 0))),
        exchange_rate=Decimal(str(data.get("rate", 1))),
        description=data.get("description", ""),
        account_code=data.get("account_code", ""),
        date=data.get("date", ""),
    )
    return {
        "foreign_amount": str(txn.foreign_amount),
        "exchange_rate": str(txn.exchange_rate),
        "functional_amount": str(txn.functional_amount),
    }


@router.post("/revalue")
async def revalue(data: dict, user: User = Depends(get_current_user)):
    rates = {k: Decimal(str(v)) for k, v in data.get("rates", {}).items()}
    return ledger.revalue_at_period_end(rates)


@router.get("/exposure")
async def currency_exposure(user: User = Depends(get_current_user)):
    return ledger.currency_exposure()

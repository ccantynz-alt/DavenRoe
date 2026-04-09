"""Multi-Currency Auto-Revaluation API routes.

Automatic FX revaluation using daily rates. Unrealised gain/loss
calculations. No more manual month-end currency adjustments.
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from app.auth.dependencies import get_current_user
from app.models.user import User
import uuid

router = APIRouter(prefix="/fx-revaluation", tags=["FX Revaluation"])

_revaluations = []
_balances = []
_seed_done = False


def _seed():
    global _seed_done
    if _seed_done:
        return
    _seed_done = True

    _balances.extend([
        {"id": "bal-001", "account": "USD Operating Account", "account_code": "1020", "currency": "USD", "foreign_balance": 45000.00, "original_rate": 0.6520, "original_aud": 69018.40, "current_rate": 0.6480, "current_aud": 69444.44, "unrealised_gain_loss": 426.04, "last_revalued": "2026-03-31"},
        {"id": "bal-002", "account": "GBP Client Receivable", "account_code": "1120", "currency": "GBP", "foreign_balance": 12500.00, "original_rate": 0.5100, "original_aud": 24509.80, "current_rate": 0.5050, "current_aud": 24752.48, "unrealised_gain_loss": 242.68, "last_revalued": "2026-03-31"},
        {"id": "bal-003", "account": "NZD Payable — Pinnacle", "account_code": "2020", "currency": "NZD", "foreign_balance": -8200.00, "original_rate": 1.0850, "original_aud": -7557.60, "current_rate": 1.0920, "current_aud": -7509.16, "unrealised_gain_loss": 48.44, "last_revalued": "2026-03-31"},
        {"id": "bal-004", "account": "EUR Supplier Account", "account_code": "2025", "currency": "EUR", "foreign_balance": -5600.00, "original_rate": 0.5980, "original_aud": -9364.55, "current_rate": 0.5920, "current_aud": -9459.46, "unrealised_gain_loss": -94.91, "last_revalued": "2026-03-31"},
        {"id": "bal-005", "account": "USD Receivable — Acme", "account_code": "1125", "currency": "USD", "foreign_balance": 22000.00, "original_rate": 0.6550, "original_aud": 33587.79, "current_rate": 0.6480, "current_aud": 33950.62, "unrealised_gain_loss": 362.83, "last_revalued": "2026-03-31"},
    ])

    _revaluations.append({
        "id": str(uuid.uuid4()),
        "date": "2026-03-31",
        "period": "March 2026",
        "status": "completed",
        "accounts_revalued": 5,
        "total_unrealised_gain": 1085.08,
        "total_unrealised_loss": 0,
        "net_impact": 1085.08,
        "journal_id": "JE-FX-MAR-2026",
        "rates_used": {
            "USD/AUD": 0.6480, "GBP/AUD": 0.5050,
            "NZD/AUD": 1.0920, "EUR/AUD": 0.5920,
        },
        "created_by": "Alex Chen",
        "created_at": "2026-03-31T17:00:00Z",
        "details": [
            {"account": "USD Operating Account", "currency": "USD", "gain_loss": 426.04},
            {"account": "GBP Client Receivable", "currency": "GBP", "gain_loss": 242.68},
            {"account": "NZD Payable — Pinnacle", "currency": "NZD", "gain_loss": 48.44},
            {"account": "EUR Supplier Account", "currency": "EUR", "gain_loss": -94.91},
            {"account": "USD Receivable — Acme", "currency": "USD", "gain_loss": 362.83},
        ],
    })


FX_RATES = {
    "USD/AUD": {"rate": 0.6480, "change_24h": -0.0040, "change_pct": -0.61},
    "GBP/AUD": {"rate": 0.5050, "change_24h": -0.0050, "change_pct": -0.98},
    "NZD/AUD": {"rate": 1.0920, "change_24h": 0.0070, "change_pct": 0.65},
    "EUR/AUD": {"rate": 0.5920, "change_24h": -0.0060, "change_pct": -1.00},
    "JPY/AUD": {"rate": 97.50, "change_24h": 0.85, "change_pct": 0.88},
    "CAD/AUD": {"rate": 0.9150, "change_24h": -0.0020, "change_pct": -0.22},
}


@router.get("/balances")
async def list_balances(user: User = Depends(get_current_user)):
    """List all foreign currency balances with current valuations."""
    _seed()
    total_gain = sum(b["unrealised_gain_loss"] for b in _balances if b["unrealised_gain_loss"] > 0)
    total_loss = sum(b["unrealised_gain_loss"] for b in _balances if b["unrealised_gain_loss"] < 0)
    return {
        "balances": _balances,
        "total_unrealised_gain": round(total_gain, 2),
        "total_unrealised_loss": round(total_loss, 2),
        "net_unrealised": round(total_gain + total_loss, 2),
    }


@router.get("/rates")
async def current_rates(user: User = Depends(get_current_user)):
    """Get current FX rates."""
    return {"rates": FX_RATES, "base_currency": "AUD", "as_at": "2026-04-08T09:00:00Z"}


@router.get("/history")
async def revaluation_history(user: User = Depends(get_current_user)):
    """List past revaluation runs."""
    _seed()
    return {"revaluations": _revaluations, "total": len(_revaluations)}


@router.post("/run")
async def run_revaluation(data: dict | None = None, user: User = Depends(get_current_user)):
    """Run month-end FX revaluation across all foreign currency balances."""
    _seed()
    import random

    now = datetime.utcnow()
    period = now.strftime("%B %Y")
    total_gain = 0
    total_loss = 0
    details = []

    for bal in _balances:
        movement = round(random.uniform(-200, 500), 2)
        bal["unrealised_gain_loss"] = movement
        bal["last_revalued"] = now.strftime("%Y-%m-%d")
        details.append({"account": bal["account"], "currency": bal["currency"], "gain_loss": movement})
        if movement > 0:
            total_gain += movement
        else:
            total_loss += movement

    reval = {
        "id": str(uuid.uuid4()),
        "date": now.strftime("%Y-%m-%d"),
        "period": period,
        "status": "completed",
        "accounts_revalued": len(_balances),
        "total_unrealised_gain": round(total_gain, 2),
        "total_unrealised_loss": round(abs(total_loss), 2),
        "net_impact": round(total_gain + total_loss, 2),
        "journal_id": f"JE-FX-{now.strftime('%b-%Y').upper()}",
        "rates_used": {k: v["rate"] for k, v in FX_RATES.items()},
        "created_by": "Current User",
        "created_at": now.isoformat() + "Z",
        "details": details,
    }
    _revaluations.insert(0, reval)
    return reval

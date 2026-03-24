"""Live Receipt API — real-time transaction capture and instant assignment.

Endpoints:
  POST /webhook/{provider}  — Receive transaction webhooks from banks/processors
  GET  /pending              — Get pending receipts waiting for assignment
  POST /{id}/assign          — Assign a receipt (client, business, personal, split)
  POST /{id}/skip            — Skip for now (deal with later)
  POST /{id}/dismiss         — Dismiss (not relevant)
  GET  /recent               — Recently assigned receipts
  GET  /clients              — Recent client list for quick assignment
  GET  /notifications        — Push notification queue
  GET  /stats                — Dashboard stats
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from app.auth.dependencies import get_current_user
from app.models.user import User
from app.live_receipt.engine import LiveReceiptEngine

router = APIRouter(prefix="/live-receipt", tags=["Live Receipt"])
engine = LiveReceiptEngine()


class AssignRequest(BaseModel):
    assignment_type: str = Field(..., description="client_expense, business_expense, personal, or split")
    client_name: str | None = None
    category_code: str | None = None
    note: str = ""
    split_details: list[dict] | None = None


class ManualTransactionRequest(BaseModel):
    amount: float
    currency: str = "AUD"
    merchant_name: str
    payment_method: str = "unknown"
    card_last_four: str | None = None


# ── Webhook Receivers ──────────────────────────────────────────

@router.post("/webhook/plaid")
async def plaid_webhook(request: Request):
    """Receive transaction webhooks from Plaid (US/CA)."""
    body = await request.json()
    webhook_type = body.get("webhook_type")

    if webhook_type == "TRANSACTIONS":
        # In production: look up user from Plaid item_id, fetch new transactions
        return {"received": True, "type": webhook_type}

    return {"received": True, "type": webhook_type}


@router.post("/webhook/basiq")
async def basiq_webhook(request: Request):
    """Receive transaction webhooks from Basiq (AU/NZ)."""
    body = await request.json()
    event_type = body.get("type")

    if event_type == "transaction.created":
        data = body.get("data", {})
        # In production: look up user from connection_id
        # For now, process if user_id is provided
        user_id = data.get("user_id", "system")
        receipt = engine.receive_transaction(
            user_id=user_id,
            amount=float(data.get("amount", 0)),
            currency=data.get("currency", "AUD"),
            merchant_name=data.get("description", "Unknown"),
            payment_method=data.get("subclass", {}).get("title", "unknown"),
            transaction_id=data.get("id"),
            source="basiq",
        )
        return {"received": True, "receipt_id": receipt["id"]}

    return {"received": True, "type": event_type}


@router.post("/webhook/truelayer")
async def truelayer_webhook(request: Request):
    """Receive transaction webhooks from TrueLayer (UK/EU)."""
    body = await request.json()
    return {"received": True, "type": body.get("type")}


@router.post("/webhook/stripe-issuing")
async def stripe_issuing_webhook(request: Request):
    """Receive Stripe Issuing card transaction webhooks."""
    body = await request.json()
    event_type = body.get("type")

    if event_type == "issuing_transaction.created":
        txn = body.get("data", {}).get("object", {})
        user_id = txn.get("metadata", {}).get("user_id", "system")
        receipt = engine.receive_transaction(
            user_id=user_id,
            amount=txn.get("amount", 0) / 100,  # Stripe amounts are in cents
            currency=txn.get("currency", "usd").upper(),
            merchant_name=txn.get("merchant_data", {}).get("name", "Unknown"),
            merchant_category_code=txn.get("merchant_data", {}).get("category_code"),
            payment_method="credit",
            card_last_four=txn.get("card", {}).get("last4"),
            transaction_id=txn.get("id"),
            source="stripe_issuing",
        )
        return {"received": True, "receipt_id": receipt["id"]}

    return {"received": True, "type": event_type}


# ── Manual Transaction Entry ──────────────────────────────────

@router.post("/manual")
async def manual_transaction(
    req: ManualTransactionRequest,
    user: User = Depends(get_current_user),
):
    """Manually enter a transaction (for cash payments, etc.)."""
    user_id = str(user.id) if hasattr(user, "id") else "system"
    receipt = engine.receive_transaction(
        user_id=user_id,
        amount=req.amount,
        currency=req.currency,
        merchant_name=req.merchant_name,
        payment_method=req.payment_method,
        card_last_four=req.card_last_four,
        source="manual",
    )
    return receipt


# ── Assignment Actions ─────────────────────────────────────────

@router.get("/pending")
async def get_pending(user: User = Depends(get_current_user)):
    """Get all pending receipts waiting for assignment."""
    user_id = str(user.id) if hasattr(user, "id") else "system"
    pending = engine.get_pending(user_id)
    return {"receipts": pending, "count": len(pending)}


@router.post("/{receipt_id}/assign")
async def assign_receipt(
    receipt_id: str,
    req: AssignRequest,
    user: User = Depends(get_current_user),
):
    """Assign a receipt — the core 'tap to assign' action."""
    if req.assignment_type not in ("client_expense", "business_expense", "personal", "split"):
        raise HTTPException(status_code=400, detail="assignment_type must be: client_expense, business_expense, personal, or split")

    if req.assignment_type == "client_expense" and not req.client_name:
        raise HTTPException(status_code=400, detail="client_name required for client_expense")

    try:
        return engine.assign_receipt(
            receipt_id=receipt_id,
            assignment_type=req.assignment_type,
            client_name=req.client_name,
            category_code=req.category_code,
            note=req.note,
            split_details=req.split_details,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{receipt_id}/skip")
async def skip_receipt(receipt_id: str, user: User = Depends(get_current_user)):
    """Skip a receipt — deal with it later in the review queue."""
    try:
        return engine.skip_receipt(receipt_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{receipt_id}/dismiss")
async def dismiss_receipt(receipt_id: str, user: User = Depends(get_current_user)):
    """Dismiss a receipt as not relevant."""
    try:
        return engine.dismiss_receipt(receipt_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ── Data Endpoints ─────────────────────────────────────────────

@router.get("/recent")
async def get_recent(limit: int = 20, user: User = Depends(get_current_user)):
    """Get recently assigned receipts."""
    user_id = str(user.id) if hasattr(user, "id") else "system"
    return {"receipts": engine.get_recent_assigned(user_id, limit)}


@router.get("/clients")
async def get_recent_clients(user: User = Depends(get_current_user)):
    """Get recently used client names for quick assignment."""
    user_id = str(user.id) if hasattr(user, "id") else "system"
    return {"clients": engine.get_recent_clients(user_id)}


@router.get("/notifications")
async def get_notifications(limit: int = 10, user: User = Depends(get_current_user)):
    """Get recent push notifications."""
    user_id = str(user.id) if hasattr(user, "id") else "system"
    return {"notifications": engine.get_notifications(user_id, limit)}


@router.get("/stats")
async def get_stats(user: User = Depends(get_current_user)):
    """Get dashboard stats for the live receipt system."""
    user_id = str(user.id) if hasattr(user, "id") else "system"
    return engine.get_stats(user_id)


@router.get("/{receipt_id}")
async def get_receipt(receipt_id: str, user: User = Depends(get_current_user)):
    """Get a single receipt."""
    receipt = engine.pending_receipts.get(receipt_id) or engine.assigned_receipts.get(receipt_id)
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    return receipt

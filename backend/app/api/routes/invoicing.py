"""Invoicing API routes."""
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from app.invoicing.engine import InvoicingEngine
from app.auth.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/invoicing", tags=["Invoicing"])
engine = InvoicingEngine()


class RecordPaymentRequest(BaseModel):
    amount: float = Field(..., gt=0)
    method: str = "bank_transfer"
    reference: str = ""


@router.post("/")
async def create_invoice(data: dict, user: User = Depends(get_current_user)):
    try:
        lines = data.pop("lines", [])
        invoice = engine.create_invoice(lines, **data)
        return invoice.to_dict()
    except (TypeError, ValueError) as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/")
async def list_invoices(entity_id: str | None = None, status: str | None = None, type: str | None = None, user: User = Depends(get_current_user)):
    invoices = engine.list_invoices(entity_id=entity_id, status=status, invoice_type=type)
    return {"invoices": [i.to_dict() for i in invoices], "total": len(invoices)}


@router.get("/overdue")
async def overdue_invoices(user: User = Depends(get_current_user)):
    overdue = engine.overdue_invoices()
    return {"overdue": [i.to_dict() for i in overdue], "count": len(overdue)}


@router.get("/{invoice_id}")
async def get_invoice(invoice_id: str, user: User = Depends(get_current_user)):
    inv = engine.get(invoice_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return inv.to_dict()


@router.post("/{invoice_id}/send")
async def send_invoice(invoice_id: str, user: User = Depends(get_current_user)):
    try:
        return engine.send_invoice(invoice_id)
    except (ValueError, KeyError) as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{invoice_id}/payment")
async def record_payment(invoice_id: str, req: RecordPaymentRequest, user: User = Depends(get_current_user)):
    try:
        return engine.record_payment(invoice_id, Decimal(str(req.amount)), req.method, req.reference)
    except (ValueError, KeyError) as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{invoice_id}/credit-note")
async def create_credit_note(invoice_id: str, data: dict = None, user: User = Depends(get_current_user)):
    cn = engine.create_credit_note(invoice_id, (data or {}).get("lines"))
    if not cn:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return cn.to_dict()


@router.post("/{invoice_id}/void")
async def void_invoice(invoice_id: str, user: User = Depends(get_current_user)):
    if not engine.void_invoice(invoice_id):
        raise HTTPException(status_code=404, detail="Invoice not found")
    return {"status": "voided"}


@router.post("/convert-quote/{quote_id}")
async def convert_quote(quote_id: str, user: User = Depends(get_current_user)):
    inv = engine.convert_quote_to_invoice(quote_id)
    if not inv:
        raise HTTPException(status_code=400, detail="Not a valid quote")
    return inv.to_dict()


@router.get("/summary/all")
async def invoicing_summary(entity_id: str | None = None, user: User = Depends(get_current_user)):
    return engine.summary(entity_id)

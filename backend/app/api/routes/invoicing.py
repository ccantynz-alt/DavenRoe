"""Invoicing API routes."""
from decimal import Decimal
from fastapi import APIRouter, HTTPException
from app.invoicing.engine import InvoicingEngine

router = APIRouter(prefix="/invoicing", tags=["Invoicing"])
engine = InvoicingEngine()

@router.post("/")
async def create_invoice(data: dict):
    lines = data.pop("lines", [])
    invoice = engine.create_invoice(lines, **data)
    return invoice.to_dict()

@router.get("/")
async def list_invoices(entity_id: str | None = None, status: str | None = None, type: str | None = None):
    invoices = engine.list_invoices(entity_id=entity_id, status=status, invoice_type=type)
    return {"invoices": [i.to_dict() for i in invoices], "total": len(invoices)}

@router.get("/overdue")
async def overdue_invoices():
    overdue = engine.overdue_invoices()
    return {"overdue": [i.to_dict() for i in overdue], "count": len(overdue)}

@router.get("/{invoice_id}")
async def get_invoice(invoice_id: str):
    inv = engine.get(invoice_id)
    if not inv: raise HTTPException(404, "Invoice not found")
    return inv.to_dict()

@router.post("/{invoice_id}/send")
async def send_invoice(invoice_id: str):
    return engine.send_invoice(invoice_id)

@router.post("/{invoice_id}/payment")
async def record_payment(invoice_id: str, data: dict):
    return engine.record_payment(invoice_id, Decimal(str(data["amount"])), data.get("method", "bank_transfer"), data.get("reference", ""))

@router.post("/{invoice_id}/credit-note")
async def create_credit_note(invoice_id: str, data: dict = None):
    cn = engine.create_credit_note(invoice_id, (data or {}).get("lines"))
    if not cn: raise HTTPException(404, "Invoice not found")
    return cn.to_dict()

@router.post("/{invoice_id}/void")
async def void_invoice(invoice_id: str):
    if not engine.void_invoice(invoice_id): raise HTTPException(404, "Invoice not found")
    return {"status": "voided"}

@router.post("/convert-quote/{quote_id}")
async def convert_quote(quote_id: str):
    inv = engine.convert_quote_to_invoice(quote_id)
    if not inv: raise HTTPException(400, "Not a valid quote")
    return inv.to_dict()

@router.get("/summary/all")
async def invoicing_summary(entity_id: str | None = None):
    return engine.summary(entity_id)

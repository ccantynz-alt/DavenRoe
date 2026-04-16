"""Invoicing API routes — wired to PostgreSQL.

Uses the SQLAlchemy Invoice + InvoiceLine models for real persistence.
Falls back to the in-memory engine if the database is unavailable so
the demo mode still works.
"""
import uuid
from datetime import date, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.dependencies import get_current_user
from app.core.database import get_db
from app.models.invoice import Invoice, InvoiceLine
from app.models.user import User

# Keep in-memory engine as a fallback when DB is unavailable
from app.invoicing.engine import InvoicingEngine

router = APIRouter(prefix="/invoicing", tags=["Invoicing"])
_fallback_engine = InvoicingEngine()


class RecordPaymentRequest(BaseModel):
    amount: float = Field(..., gt=0)
    method: str = "bank_transfer"
    reference: str = ""


def _invoice_to_dict(inv: Invoice) -> dict:
    return {
        "id": str(inv.id),
        "invoice_number": inv.invoice_number,
        "direction": inv.direction,
        "counterparty_name": inv.counterparty_name,
        "entity_id": str(inv.entity_id) if inv.entity_id else None,
        "issue_date": inv.issue_date.isoformat() if inv.issue_date else None,
        "due_date": inv.due_date.isoformat() if inv.due_date else None,
        "currency": inv.currency,
        "subtotal": str(inv.subtotal),
        "tax_amount": str(inv.tax_amount),
        "total": str(inv.total),
        "amount_paid": str(inv.amount_paid),
        "status": inv.status,
        "notes": inv.notes,
        "lines": [
            {
                "id": str(line.id),
                "description": line.description,
                "quantity": str(line.quantity),
                "unit_price": str(line.unit_price),
                "amount": str(line.amount),
                "tax_rate": str(line.tax_rate) if line.tax_rate else "0",
                "tax_amount": str(line.tax_amount),
            }
            for line in (inv.lines or [])
        ],
        "created_at": inv.created_at.isoformat() if inv.created_at else None,
    }


# ─── Counter for invoice numbers ─────────────────────────────────────────────
_invoice_counter = 1001


def _next_invoice_number(prefix: str = "INV") -> str:
    global _invoice_counter
    num = f"{prefix}-{_invoice_counter:05d}"
    _invoice_counter += 1
    return num


# ─── Routes ──────────────────────────────────────────────────────────────────


@router.post("/")
async def create_invoice(data: dict, user: User = Depends(get_current_user)):
    """Create a new invoice, persisted to PostgreSQL."""
    lines_data = data.pop("lines", [])
    entity_id = data.get("entity_id")
    if not entity_id:
        raise HTTPException(status_code=400, detail="entity_id is required")

    try:
        entity_uuid = uuid.UUID(str(entity_id))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid entity_id format")

    direction = data.get("direction", "receivable")
    counterparty = data.get("counterparty_name") or data.get("client_name", "Unknown")
    currency = data.get("currency", "NZD")
    issue = data.get("issue_date")
    due = data.get("due_date")
    notes = data.get("notes", "")
    tax_rate_default = Decimal(str(data.get("tax_rate", "0.15")))

    if isinstance(issue, str):
        issue = date.fromisoformat(issue)
    if isinstance(due, str):
        due = date.fromisoformat(due)
    if not issue:
        issue = date.today()
    if not due:
        due = issue + timedelta(days=30)

    subtotal = Decimal("0")
    tax_total = Decimal("0")
    db_lines = []
    for ld in lines_data:
        qty = Decimal(str(ld.get("quantity", 1)))
        price = Decimal(str(ld.get("unit_price", 0)))
        line_tax_rate = Decimal(str(ld.get("tax_rate", tax_rate_default)))
        amount = (qty * price).quantize(Decimal("0.01"))
        tax_amt = (amount * line_tax_rate).quantize(Decimal("0.01"))
        subtotal += amount
        tax_total += tax_amt
        db_lines.append(InvoiceLine(
            description=ld.get("description", ""),
            quantity=qty,
            unit_price=price,
            amount=amount,
            tax_rate=line_tax_rate,
            tax_amount=tax_amt,
            tax_code=ld.get("tax_code"),
        ))

    total = subtotal + tax_total

    invoice = Invoice(
        entity_id=entity_uuid,
        invoice_number=_next_invoice_number(),
        direction=direction,
        counterparty_name=counterparty,
        issue_date=issue,
        due_date=due,
        currency=currency,
        subtotal=subtotal,
        tax_amount=tax_total,
        total=total,
        amount_paid=Decimal("0"),
        status="draft",
        notes=notes,
        lines=db_lines,
    )

    try:
        async for db in get_db():
            db.add(invoice)
            await db.flush()
            await db.refresh(invoice, attribute_names=["lines"])
            return _invoice_to_dict(invoice)
    except Exception:
        # Fallback to in-memory
        mem_inv = _fallback_engine.create_invoice(lines_data, **data)
        return mem_inv.to_dict()


@router.get("/")
async def list_invoices(
    entity_id: str | None = None,
    status: str | None = None,
    type: str | None = None,
    user: User = Depends(get_current_user),
):
    try:
        async for db in get_db():
            stmt = select(Invoice).options(selectinload(Invoice.lines)).order_by(Invoice.created_at.desc())
            if entity_id:
                stmt = stmt.where(Invoice.entity_id == uuid.UUID(entity_id))
            if status:
                stmt = stmt.where(Invoice.status == status)
            result = await db.execute(stmt)
            invoices = result.scalars().all()
            if invoices:
                return {"invoices": [_invoice_to_dict(i) for i in invoices], "total": len(invoices)}
    except Exception:
        pass

    # Fallback
    invoices = _fallback_engine.list_invoices(entity_id=entity_id, status=status, invoice_type=type)
    return {"invoices": [i.to_dict() for i in invoices], "total": len(invoices)}


@router.get("/overdue")
async def overdue_invoices(user: User = Depends(get_current_user)):
    try:
        async for db in get_db():
            stmt = (
                select(Invoice)
                .options(selectinload(Invoice.lines))
                .where(Invoice.due_date < date.today())
                .where(Invoice.status.in_(["sent", "partially_paid", "draft"]))
                .order_by(Invoice.due_date)
            )
            result = await db.execute(stmt)
            invoices = result.scalars().all()
            return {"overdue": [_invoice_to_dict(i) for i in invoices], "count": len(invoices)}
    except Exception:
        overdue = _fallback_engine.overdue_invoices()
        return {"overdue": [i.to_dict() for i in overdue], "count": len(overdue)}


@router.get("/summary/all")
async def invoicing_summary(entity_id: str | None = None, user: User = Depends(get_current_user)):
    try:
        async for db in get_db():
            base = select(Invoice)
            if entity_id:
                base = base.where(Invoice.entity_id == uuid.UUID(entity_id))

            result = await db.execute(base)
            invoices = result.scalars().all()

            total_outstanding = sum(
                (i.total - i.amount_paid) for i in invoices if i.status in ("sent", "partially_paid", "draft")
            )
            total_paid = sum(i.amount_paid for i in invoices)
            overdue_count = sum(1 for i in invoices if i.due_date and i.due_date < date.today() and i.status in ("sent", "partially_paid"))

            return {
                "total_invoices": len(invoices),
                "total_outstanding": str(total_outstanding),
                "total_paid": str(total_paid),
                "overdue_count": overdue_count,
                "by_status": {
                    s: sum(1 for i in invoices if i.status == s)
                    for s in set(i.status for i in invoices)
                },
            }
    except Exception:
        return _fallback_engine.summary(entity_id)


@router.get("/{invoice_id}")
async def get_invoice(invoice_id: str, user: User = Depends(get_current_user)):
    try:
        async for db in get_db():
            stmt = select(Invoice).options(selectinload(Invoice.lines)).where(Invoice.id == uuid.UUID(invoice_id))
            result = await db.execute(stmt)
            inv = result.scalar_one_or_none()
            if inv:
                return _invoice_to_dict(inv)
    except Exception:
        pass

    inv = _fallback_engine.get(invoice_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return inv.to_dict()


@router.post("/{invoice_id}/send")
async def send_invoice(invoice_id: str, user: User = Depends(get_current_user)):
    try:
        async for db in get_db():
            stmt = select(Invoice).where(Invoice.id == uuid.UUID(invoice_id))
            result = await db.execute(stmt)
            inv = result.scalar_one_or_none()
            if inv:
                inv.status = "sent"
                await db.flush()
                return {"status": "sent", "invoice_number": inv.invoice_number}
    except Exception:
        pass

    try:
        return _fallback_engine.send_invoice(invoice_id)
    except (ValueError, KeyError) as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{invoice_id}/payment")
async def record_payment(invoice_id: str, req: RecordPaymentRequest, user: User = Depends(get_current_user)):
    amount = Decimal(str(req.amount))
    try:
        async for db in get_db():
            stmt = select(Invoice).where(Invoice.id == uuid.UUID(invoice_id))
            result = await db.execute(stmt)
            inv = result.scalar_one_or_none()
            if inv:
                inv.amount_paid = (inv.amount_paid or Decimal("0")) + amount
                if inv.amount_paid >= inv.total:
                    inv.status = "paid"
                else:
                    inv.status = "partially_paid"
                await db.flush()
                return {
                    "status": inv.status,
                    "amount_paid": str(inv.amount_paid),
                    "remaining": str(inv.total - inv.amount_paid),
                }
    except Exception:
        pass

    try:
        return _fallback_engine.record_payment(invoice_id, amount, req.method, req.reference)
    except (ValueError, KeyError) as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{invoice_id}/void")
async def void_invoice(invoice_id: str, user: User = Depends(get_current_user)):
    try:
        async for db in get_db():
            stmt = select(Invoice).where(Invoice.id == uuid.UUID(invoice_id))
            result = await db.execute(stmt)
            inv = result.scalar_one_or_none()
            if inv:
                inv.status = "void"
                await db.flush()
                return {"status": "voided"}
    except Exception:
        pass

    if not _fallback_engine.void_invoice(invoice_id):
        raise HTTPException(status_code=404, detail="Invoice not found")
    return {"status": "voided"}


@router.post("/{invoice_id}/credit-note")
async def create_credit_note(invoice_id: str, data: dict = None, user: User = Depends(get_current_user)):
    cn = _fallback_engine.create_credit_note(invoice_id, (data or {}).get("lines"))
    if not cn:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return cn.to_dict()


@router.post("/convert-quote/{quote_id}")
async def convert_quote(quote_id: str, user: User = Depends(get_current_user)):
    inv = _fallback_engine.convert_quote_to_invoice(quote_id)
    if not inv:
        raise HTTPException(status_code=400, detail="Not a valid quote")
    return inv.to_dict()

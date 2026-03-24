"""Credit Notes API routes."""

from fastapi import APIRouter, Depends, HTTPException
from app.auth.dependencies import get_current_user
from app.models.user import User
from datetime import datetime
import uuid

router = APIRouter(prefix="/credit-notes", tags=["Credit Notes"])

# In-memory store (replace with DB later)
_credit_notes = []
_seed_done = False


def _seed():
    global _seed_done
    if _seed_done:
        return
    _seed_done = True
    demos = [
        {
            "credit_note_number": "CN-0001",
            "type": "receivable",
            "client_or_supplier": "Acme Corporation",
            "original_invoice": "INV-0042",
            "date": "2026-03-10",
            "status": "issued",
            "currency": "AUD",
            "lines": [
                {"description": "Overcharged consulting hours — March", "quantity": 5, "unit_price": 200.00, "tax_rate": 10.0, "amount": 1000.00},
            ],
            "subtotal": 1000.00,
            "tax_amount": 100.00,
            "total": 1100.00,
            "reason": "Client overcharged for 5 hours of consulting in March invoice",
            "applied_to": None,
            "remaining_credit": 1100.00,
        },
        {
            "credit_note_number": "CN-0002",
            "type": "payable",
            "client_or_supplier": "TechParts Ltd",
            "original_invoice": "BILL-0087",
            "date": "2026-03-05",
            "status": "applied",
            "currency": "GBP",
            "lines": [
                {"description": "Returned faulty USB-C Docking Station", "quantity": 2, "unit_price": 180.00, "tax_rate": 20.0, "amount": 360.00},
            ],
            "subtotal": 360.00,
            "tax_amount": 72.00,
            "total": 432.00,
            "reason": "Two docking stations returned — DOA units",
            "applied_to": "BILL-0092",
            "remaining_credit": 0,
        },
        {
            "credit_note_number": "CN-0003",
            "type": "receivable",
            "client_or_supplier": "Pinnacle Advisory",
            "original_invoice": "INV-0038",
            "date": "2026-02-28",
            "status": "applied",
            "currency": "AUD",
            "lines": [
                {"description": "Discount for early payment — Feb retainer", "quantity": 1, "unit_price": 500.00, "tax_rate": 10.0, "amount": 500.00},
            ],
            "subtotal": 500.00,
            "tax_amount": 50.00,
            "total": 550.00,
            "reason": "2% early payment discount applied per contract terms",
            "applied_to": "INV-0038",
            "remaining_credit": 0,
        },
        {
            "credit_note_number": "CN-0004",
            "type": "payable",
            "client_or_supplier": "Office Supplies Co",
            "original_invoice": "BILL-0079",
            "date": "2026-03-18",
            "status": "issued",
            "currency": "AUD",
            "lines": [
                {"description": "Incorrect paper grade delivered (A3 instead of A4)", "quantity": 10, "unit_price": 32.00, "tax_rate": 10.0, "amount": 320.00},
            ],
            "subtotal": 320.00,
            "tax_amount": 32.00,
            "total": 352.00,
            "reason": "Wrong product delivered — full credit for returned boxes",
            "applied_to": None,
            "remaining_credit": 352.00,
        },
        {
            "credit_note_number": "CN-0005",
            "type": "receivable",
            "client_or_supplier": "Horizon Ventures",
            "original_invoice": "INV-0051",
            "date": "2026-01-15",
            "status": "refunded",
            "currency": "USD",
            "lines": [
                {"description": "Project scope reduction — Phase 3 cancelled", "quantity": 1, "unit_price": 3500.00, "tax_rate": 0, "amount": 3500.00},
            ],
            "subtotal": 3500.00,
            "tax_amount": 0,
            "total": 3500.00,
            "reason": "Phase 3 of project cancelled by mutual agreement — full refund issued",
            "applied_to": None,
            "remaining_credit": 0,
        },
    ]
    for d in demos:
        _credit_notes.append({
            "id": str(uuid.uuid4()),
            "created_at": datetime.utcnow().isoformat(),
            **d,
        })


@router.get("/")
async def list_credit_notes(type: str | None = None, status: str | None = None, user: User = Depends(get_current_user)):
    """List all credit notes with optional filters."""
    _seed()
    results = _credit_notes
    if type:
        results = [cn for cn in results if cn["type"] == type]
    if status:
        results = [cn for cn in results if cn["status"] == status]
    return {"credit_notes": results, "total": len(results)}


@router.get("/summary")
async def credit_notes_summary(user: User = Depends(get_current_user)):
    """Credit note summary statistics."""
    _seed()
    receivable = [cn for cn in _credit_notes if cn["type"] == "receivable"]
    payable = [cn for cn in _credit_notes if cn["type"] == "payable"]
    outstanding_receivable = sum(cn["remaining_credit"] for cn in receivable)
    outstanding_payable = sum(cn["remaining_credit"] for cn in payable)
    by_status = {}
    for cn in _credit_notes:
        by_status[cn["status"]] = by_status.get(cn["status"], 0) + 1
    return {
        "total_credit_notes": len(_credit_notes),
        "receivable_count": len(receivable),
        "payable_count": len(payable),
        "outstanding_receivable": round(outstanding_receivable, 2),
        "outstanding_payable": round(outstanding_payable, 2),
        "by_status": by_status,
    }


@router.post("/")
async def create_credit_note(data: dict, user: User = Depends(get_current_user)):
    """Create a new credit note."""
    _seed()
    cn_nums = [int(cn["credit_note_number"].replace("CN-", "")) for cn in _credit_notes if cn["credit_note_number"].startswith("CN-")]
    next_num = max(cn_nums, default=0) + 1
    subtotal = sum(line.get("amount", 0) for line in data.get("lines", []))
    tax_amount = data.get("tax_amount", subtotal * 0.1)
    total = subtotal + tax_amount
    cn = {
        "id": str(uuid.uuid4()),
        "credit_note_number": f"CN-{next_num:04d}",
        "created_at": datetime.utcnow().isoformat(),
        "status": "draft",
        "applied_to": None,
        "remaining_credit": total,
        "subtotal": round(subtotal, 2),
        "tax_amount": round(tax_amount, 2),
        "total": round(total, 2),
        **data,
    }
    _credit_notes.append(cn)
    return cn


@router.get("/{cn_id}")
async def get_credit_note(cn_id: str, user: User = Depends(get_current_user)):
    """Get a single credit note."""
    _seed()
    for cn in _credit_notes:
        if cn["id"] == cn_id:
            return cn
    raise HTTPException(status_code=404, detail="Credit note not found")


@router.post("/{cn_id}/apply")
async def apply_credit_note(cn_id: str, data: dict, user: User = Depends(get_current_user)):
    """Apply a credit note to an invoice or bill."""
    _seed()
    for i, cn in enumerate(_credit_notes):
        if cn["id"] == cn_id:
            if cn["status"] in ("voided", "refunded"):
                raise HTTPException(status_code=400, detail=f"Cannot apply a {cn['status']} credit note")
            if cn["remaining_credit"] <= 0:
                raise HTTPException(status_code=400, detail="No remaining credit to apply")
            apply_amount = min(data.get("amount", cn["remaining_credit"]), cn["remaining_credit"])
            _credit_notes[i]["remaining_credit"] = round(cn["remaining_credit"] - apply_amount, 2)
            _credit_notes[i]["applied_to"] = data.get("invoice_id", cn.get("applied_to"))
            if _credit_notes[i]["remaining_credit"] <= 0:
                _credit_notes[i]["status"] = "applied"
            return {"credit_note": _credit_notes[i], "applied_amount": apply_amount}
    raise HTTPException(status_code=404, detail="Credit note not found")


@router.post("/{cn_id}/refund")
async def refund_credit_note(cn_id: str, user: User = Depends(get_current_user)):
    """Mark a credit note as refunded."""
    _seed()
    for i, cn in enumerate(_credit_notes):
        if cn["id"] == cn_id:
            if cn["status"] in ("voided", "refunded"):
                raise HTTPException(status_code=400, detail=f"Credit note is already {cn['status']}")
            _credit_notes[i]["status"] = "refunded"
            _credit_notes[i]["remaining_credit"] = 0
            return _credit_notes[i]
    raise HTTPException(status_code=404, detail="Credit note not found")


@router.delete("/{cn_id}")
async def void_credit_note(cn_id: str, user: User = Depends(get_current_user)):
    """Void a credit note."""
    _seed()
    for i, cn in enumerate(_credit_notes):
        if cn["id"] == cn_id:
            if cn["status"] == "applied":
                raise HTTPException(status_code=400, detail="Cannot void an applied credit note — reverse application first")
            _credit_notes[i]["status"] = "voided"
            _credit_notes[i]["remaining_credit"] = 0
            return {"status": "voided"}
    raise HTTPException(status_code=404, detail="Credit note not found")

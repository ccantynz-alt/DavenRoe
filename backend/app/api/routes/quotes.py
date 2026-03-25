"""Quotes / Estimates API routes."""

from fastapi import APIRouter, Depends, HTTPException
from app.auth.dependencies import get_current_user
from app.models.user import User
from datetime import datetime
import uuid

router = APIRouter(prefix="/quotes", tags=["Quotes"])

# In-memory store (replace with DB later)
_quotes = []
_quote_counter = 6
_seed_done = False


def _seed():
    global _seed_done
    if _seed_done:
        return
    _seed_done = True
    now = datetime.utcnow().isoformat()
    demos = [
        {
            "quote_number": "Q-0001",
            "client_name": "Acme Corp",
            "client_id": "client-001",
            "date": "2026-03-01",
            "expiry_date": "2026-03-31",
            "status": "accepted",
            "currency": "AUD",
            "lines": [
                {"description": "Cloud Migration — Phase 1", "quantity": 1, "unit_price": 18500.00, "tax_rate": 10, "amount": 18500.00},
                {"description": "Data migration and validation", "quantity": 40, "unit_price": 175.00, "tax_rate": 10, "amount": 7000.00},
                {"description": "Staff training (2 days on-site)", "quantity": 2, "unit_price": 2200.00, "tax_rate": 10, "amount": 4400.00},
            ],
            "subtotal": 29900.00,
            "tax_amount": 2990.00,
            "total": 32890.00,
            "notes": "Phase 1 of 3. Subsequent phases quoted separately.",
            "terms": "50% upfront, 50% on completion. Valid for 30 days.",
            "accepted_at": "2026-03-08T14:20:00Z",
        },
        {
            "quote_number": "Q-0002",
            "client_name": "Widget Co",
            "client_id": "client-002",
            "date": "2026-03-05",
            "expiry_date": "2026-04-04",
            "status": "sent",
            "currency": "AUD",
            "lines": [
                {"description": "Monthly bookkeeping — Standard package", "quantity": 12, "unit_price": 850.00, "tax_rate": 10, "amount": 10200.00},
                {"description": "BAS preparation and lodgement (quarterly)", "quantity": 4, "unit_price": 450.00, "tax_rate": 10, "amount": 1800.00},
                {"description": "Year-end financial statements", "quantity": 1, "unit_price": 3200.00, "tax_rate": 10, "amount": 3200.00},
            ],
            "subtotal": 15200.00,
            "tax_amount": 1520.00,
            "total": 16720.00,
            "notes": "Annual engagement — 12-month fixed fee.",
            "terms": "Monthly invoicing in advance. 14-day payment terms.",
            "accepted_at": None,
        },
        {
            "quote_number": "Q-0003",
            "client_name": "Smith & Associates",
            "client_id": "client-003",
            "date": "2026-03-10",
            "expiry_date": "2026-04-09",
            "status": "draft",
            "currency": "AUD",
            "lines": [
                {"description": "Forensic audit — vendor payment analysis", "quantity": 1, "unit_price": 8500.00, "tax_rate": 10, "amount": 8500.00},
                {"description": "Benford's Law analysis — 3 years of data", "quantity": 1, "unit_price": 4200.00, "tax_rate": 10, "amount": 4200.00},
            ],
            "subtotal": 12700.00,
            "tax_amount": 1270.00,
            "total": 13970.00,
            "notes": "Scope limited to accounts payable transactions FY2023-2025.",
            "terms": "Payment on completion. 30-day terms.",
            "accepted_at": None,
        },
        {
            "quote_number": "Q-0004",
            "client_name": "GreenLeaf Organics",
            "client_id": "client-004",
            "date": "2026-02-15",
            "expiry_date": "2026-03-15",
            "status": "expired",
            "currency": "NZD",
            "lines": [
                {"description": "Inventory system setup and configuration", "quantity": 1, "unit_price": 5500.00, "tax_rate": 15, "amount": 5500.00},
                {"description": "SKU data import (500+ products)", "quantity": 1, "unit_price": 1200.00, "tax_rate": 15, "amount": 1200.00},
                {"description": "Multi-location warehouse configuration", "quantity": 3, "unit_price": 800.00, "tax_rate": 15, "amount": 2400.00},
            ],
            "subtotal": 9100.00,
            "tax_amount": 1365.00,
            "total": 10465.00,
            "notes": "Quote expired — client requested revised pricing.",
            "terms": "50% upfront, 50% on go-live. Valid 30 days.",
            "accepted_at": None,
        },
        {
            "quote_number": "Q-0005",
            "client_name": "TechParts Ltd",
            "client_id": "client-005",
            "date": "2026-03-18",
            "expiry_date": "2026-04-17",
            "status": "sent",
            "currency": "GBP",
            "lines": [
                {"description": "UK VAT compliance setup", "quantity": 1, "unit_price": 3200.00, "tax_rate": 20, "amount": 3200.00},
                {"description": "Cross-border tax treaty configuration (AU-UK DTA)", "quantity": 1, "unit_price": 2800.00, "tax_rate": 20, "amount": 2800.00},
                {"description": "Quarterly VAT return preparation (4 quarters)", "quantity": 4, "unit_price": 650.00, "tax_rate": 20, "amount": 2600.00},
            ],
            "subtotal": 8600.00,
            "tax_amount": 1720.00,
            "total": 10320.00,
            "notes": "Includes AU-UK DTA withholding tax optimization.",
            "terms": "Monthly invoicing. Net 30 payment terms.",
            "accepted_at": None,
        },
        {
            "quote_number": "Q-0006",
            "client_name": "ABC Pty Ltd",
            "client_id": "client-006",
            "date": "2026-03-01",
            "expiry_date": "2026-03-31",
            "status": "declined",
            "currency": "AUD",
            "lines": [
                {"description": "Payroll setup — 25 employees", "quantity": 1, "unit_price": 4500.00, "tax_rate": 10, "amount": 4500.00},
                {"description": "Superannuation configuration", "quantity": 1, "unit_price": 800.00, "tax_rate": 10, "amount": 800.00},
            ],
            "subtotal": 5300.00,
            "tax_amount": 530.00,
            "total": 5830.00,
            "notes": "Client declined — chose to keep existing payroll provider.",
            "terms": "Payment on completion.",
            "accepted_at": None,
        },
    ]
    for d in demos:
        _quotes.append({"id": str(uuid.uuid4()), "created_at": now, **d})


@router.get("/")
async def list_quotes(status: str | None = None, client_id: str | None = None, search: str | None = None, user: User = Depends(get_current_user)):
    """List all quotes with optional filters."""
    _seed()
    results = _quotes
    if status:
        results = [q for q in results if q["status"] == status]
    if client_id:
        results = [q for q in results if q.get("client_id") == client_id]
    if search:
        s = search.lower()
        results = [q for q in results if s in q["client_name"].lower() or s in q["quote_number"].lower()]
    return {"quotes": results, "total": len(results)}


@router.get("/summary")
async def quotes_summary(user: User = Depends(get_current_user)):
    """Get quotes summary statistics."""
    _seed()
    by_status = {}
    for q in _quotes:
        st = q["status"]
        by_status.setdefault(st, {"count": 0, "total": 0})
        by_status[st]["count"] += 1
        by_status[st]["total"] = round(by_status[st]["total"] + q["total"], 2)
    total_value = round(sum(q["total"] for q in _quotes), 2)
    accepted_value = round(sum(q["total"] for q in _quotes if q["status"] == "accepted"), 2)
    conversion_rate = round((len([q for q in _quotes if q["status"] in ("accepted", "converted")]) / len(_quotes) * 100), 1) if _quotes else 0
    return {
        "total_quotes": len(_quotes),
        "total_value": total_value,
        "accepted_value": accepted_value,
        "conversion_rate": conversion_rate,
        "by_status": by_status,
    }


@router.post("/")
async def create_quote(data: dict, user: User = Depends(get_current_user)):
    """Create a new quote."""
    _seed()
    global _quote_counter
    _quote_counter += 1
    lines = data.get("lines", [])
    subtotal = round(sum(l.get("amount", l.get("quantity", 0) * l.get("unit_price", 0)) for l in lines), 2)
    tax_amount = round(sum(l.get("amount", 0) * l.get("tax_rate", 0) / 100 for l in lines), 2)
    quote = {
        "id": str(uuid.uuid4()),
        "quote_number": f"Q-{_quote_counter:04d}",
        "client_name": data.get("client_name", ""),
        "client_id": data.get("client_id", ""),
        "date": data.get("date", datetime.utcnow().strftime("%Y-%m-%d")),
        "expiry_date": data.get("expiry_date", ""),
        "status": "draft",
        "currency": data.get("currency", "AUD"),
        "lines": lines,
        "subtotal": data.get("subtotal", subtotal),
        "tax_amount": data.get("tax_amount", tax_amount),
        "total": data.get("total", round(subtotal + tax_amount, 2)),
        "notes": data.get("notes", ""),
        "terms": data.get("terms", "Valid for 30 days. Payment terms as per agreement."),
        "accepted_at": None,
        "created_at": datetime.utcnow().isoformat(),
    }
    _quotes.append(quote)
    return quote


@router.get("/{quote_id}")
async def get_quote(quote_id: str, user: User = Depends(get_current_user)):
    """Get a single quote by ID."""
    _seed()
    for q in _quotes:
        if q["id"] == quote_id:
            return q
    raise HTTPException(status_code=404, detail="Quote not found")


@router.put("/{quote_id}")
async def update_quote(quote_id: str, data: dict, user: User = Depends(get_current_user)):
    """Update an existing quote (only draft or sent quotes can be updated)."""
    _seed()
    for i, q in enumerate(_quotes):
        if q["id"] == quote_id:
            if q["status"] not in ("draft", "sent"):
                raise HTTPException(status_code=400, detail=f"Cannot update quote with status '{q['status']}'")
            _quotes[i] = {**q, **data, "updated_at": datetime.utcnow().isoformat()}
            return _quotes[i]
    raise HTTPException(status_code=404, detail="Quote not found")


@router.post("/{quote_id}/send")
async def send_quote(quote_id: str, user: User = Depends(get_current_user)):
    """Send a quote to the client."""
    _seed()
    for i, q in enumerate(_quotes):
        if q["id"] == quote_id:
            if q["status"] not in ("draft", "sent"):
                raise HTTPException(status_code=400, detail=f"Cannot send quote with status '{q['status']}'")
            _quotes[i]["status"] = "sent"
            _quotes[i]["sent_at"] = datetime.utcnow().isoformat()
            return {"status": "sent", "quote": _quotes[i]}
    raise HTTPException(status_code=404, detail="Quote not found")


@router.post("/{quote_id}/accept")
async def accept_quote(quote_id: str, user: User = Depends(get_current_user)):
    """Mark a quote as accepted by the client."""
    _seed()
    for i, q in enumerate(_quotes):
        if q["id"] == quote_id:
            if q["status"] not in ("sent", "draft"):
                raise HTTPException(status_code=400, detail=f"Cannot accept quote with status '{q['status']}'")
            _quotes[i]["status"] = "accepted"
            _quotes[i]["accepted_at"] = datetime.utcnow().isoformat()
            return _quotes[i]
    raise HTTPException(status_code=404, detail="Quote not found")


@router.post("/{quote_id}/convert")
async def convert_to_invoice(quote_id: str, user: User = Depends(get_current_user)):
    """Convert an accepted quote to an invoice."""
    _seed()
    for i, q in enumerate(_quotes):
        if q["id"] == quote_id:
            if q["status"] != "accepted":
                raise HTTPException(status_code=400, detail="Only accepted quotes can be converted to invoices")
            _quotes[i]["status"] = "converted"
            _quotes[i]["converted_at"] = datetime.utcnow().isoformat()
            # Return invoice stub (actual invoice creation handled by invoicing module)
            invoice_stub = {
                "invoice_number": q["quote_number"].replace("Q-", "INV-"),
                "client_name": q["client_name"],
                "client_id": q["client_id"],
                "lines": q["lines"],
                "subtotal": q["subtotal"],
                "tax_amount": q["tax_amount"],
                "total": q["total"],
                "currency": q["currency"],
                "source_quote": q["quote_number"],
            }
            return {"status": "converted", "quote": _quotes[i], "invoice": invoice_stub}
    raise HTTPException(status_code=404, detail="Quote not found")


@router.delete("/{quote_id}")
async def void_quote(quote_id: str, user: User = Depends(get_current_user)):
    """Void a quote."""
    _seed()
    for i, q in enumerate(_quotes):
        if q["id"] == quote_id:
            if q["status"] == "converted":
                raise HTTPException(status_code=400, detail="Cannot void a converted quote")
            _quotes[i]["status"] = "voided"
            return {"status": "voided"}
    raise HTTPException(status_code=404, detail="Quote not found")

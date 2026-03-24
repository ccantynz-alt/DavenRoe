"""Bills / Accounts Payable API routes.

Provides endpoints for managing supplier bills, approval workflows,
and payment tracking.  Uses an in-memory store with seeded demo data.
"""

import uuid
from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.auth.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/bills", tags=["Bills / Accounts Payable"])


# ---------------------------------------------------------------------------
# In-memory store
# ---------------------------------------------------------------------------

_bills: dict[str, dict] = {}


def _seed_demo_data() -> None:
    """Seed realistic demo data on first access."""
    if _bills:
        return

    now = datetime.now(timezone.utc)
    today = date.today()

    bills_data = [
        {
            "supplier_name": "AWS Australia Pty Ltd",
            "supplier_id": "SUP-001",
            "bill_number": "INV-AWS-29471",
            "reference": "PO-2026-0041",
            "date": "2026-03-01",
            "due_date": "2026-03-31",
            "status": "approved",
            "currency": "AUD",
            "payment_terms": "Net 30",
            "notes": "Monthly cloud infrastructure — March 2026",
            "lines": [
                {"description": "EC2 Reserved Instances (ap-southeast-2)", "account_code": "6110", "quantity": 1, "unit_price": 4280.00, "tax_rate": 10.0, "amount": 4280.00},
                {"description": "S3 Storage & Data Transfer", "account_code": "6110", "quantity": 1, "unit_price": 890.50, "tax_rate": 10.0, "amount": 890.50},
                {"description": "RDS PostgreSQL Multi-AZ", "account_code": "6110", "quantity": 1, "unit_price": 1245.00, "tax_rate": 10.0, "amount": 1245.00},
            ],
        },
        {
            "supplier_name": "WeWork Management LLC",
            "supplier_id": "SUP-002",
            "bill_number": "WW-2026-03-8842",
            "reference": "Lease-SYD-04",
            "date": "2026-03-01",
            "due_date": "2026-03-15",
            "status": "paid",
            "currency": "AUD",
            "payment_terms": "Net 14",
            "notes": "Office lease — Level 12, 100 Harris St, Pyrmont",
            "lines": [
                {"description": "Dedicated office — 8 desks", "account_code": "6200", "quantity": 1, "unit_price": 6800.00, "tax_rate": 10.0, "amount": 6800.00},
                {"description": "Meeting room credits (20 hrs)", "account_code": "6200", "quantity": 1, "unit_price": 450.00, "tax_rate": 10.0, "amount": 450.00},
            ],
        },
        {
            "supplier_name": "Canva Pty Ltd",
            "supplier_id": "SUP-003",
            "bill_number": "CANVA-ENT-10294",
            "reference": "",
            "date": "2026-02-28",
            "due_date": "2026-03-14",
            "status": "overdue",
            "currency": "AUD",
            "payment_terms": "Net 14",
            "notes": "Enterprise design subscription — annual billing (Q1 instalment)",
            "lines": [
                {"description": "Canva Enterprise — 15 seats", "account_code": "6150", "quantity": 15, "unit_price": 45.00, "tax_rate": 10.0, "amount": 675.00},
            ],
        },
        {
            "supplier_name": "Clayton Utz Lawyers",
            "supplier_id": "SUP-004",
            "bill_number": "CU-INV-88210",
            "reference": "Matter-2026-APA",
            "date": "2026-03-10",
            "due_date": "2026-04-09",
            "status": "pending_approval",
            "currency": "AUD",
            "payment_terms": "Net 30",
            "notes": "Legal advisory — partnership agreement review and IP assignment",
            "lines": [
                {"description": "Partner time — M. Edwards (4.5 hrs @ $850)", "account_code": "6300", "quantity": 4.5, "unit_price": 850.00, "tax_rate": 10.0, "amount": 3825.00},
                {"description": "Senior Associate — K. Patel (12 hrs @ $520)", "account_code": "6300", "quantity": 12, "unit_price": 520.00, "tax_rate": 10.0, "amount": 6240.00},
                {"description": "Disbursements (ASIC searches, filing fees)", "account_code": "6300", "quantity": 1, "unit_price": 385.00, "tax_rate": 10.0, "amount": 385.00},
            ],
        },
        {
            "supplier_name": "Telstra Corporation Ltd",
            "supplier_id": "SUP-005",
            "bill_number": "T-9920384712",
            "reference": "Account-88412",
            "date": "2026-03-05",
            "due_date": "2026-03-26",
            "status": "approved",
            "currency": "AUD",
            "payment_terms": "Net 21",
            "notes": "Business internet and mobile fleet — March",
            "lines": [
                {"description": "Business NBN 1000/50 — Pyrmont office", "account_code": "6120", "quantity": 1, "unit_price": 159.00, "tax_rate": 10.0, "amount": 159.00},
                {"description": "Mobile fleet — 8 handsets (Business Max plan)", "account_code": "6120", "quantity": 8, "unit_price": 69.00, "tax_rate": 10.0, "amount": 552.00},
                {"description": "Microsoft 365 Business Premium licences", "account_code": "6150", "quantity": 15, "unit_price": 33.00, "tax_rate": 10.0, "amount": 495.00},
            ],
        },
        {
            "supplier_name": "Stripe Payments Australia",
            "supplier_id": "SUP-006",
            "bill_number": "STRIPE-FEB-2026",
            "reference": "acct_1NxQR2abc",
            "date": "2026-03-02",
            "due_date": "2026-03-02",
            "status": "paid",
            "currency": "AUD",
            "payment_terms": "Due on receipt",
            "notes": "Payment processing fees — February 2026",
            "lines": [
                {"description": "Card processing fees (1.75% + $0.30 × 842 txns)", "account_code": "6400", "quantity": 1, "unit_price": 2947.30, "tax_rate": 10.0, "amount": 2947.30},
                {"description": "International card surcharge", "account_code": "6400", "quantity": 1, "unit_price": 312.60, "tax_rate": 10.0, "amount": 312.60},
                {"description": "Stripe Radar fraud protection", "account_code": "6400", "quantity": 1, "unit_price": 84.20, "tax_rate": 10.0, "amount": 84.20},
            ],
        },
        {
            "supplier_name": "BDO Australia",
            "supplier_id": "SUP-007",
            "bill_number": "BDO-26-03-4410",
            "reference": "Engagement-FY26",
            "date": "2026-03-18",
            "due_date": "2026-04-17",
            "status": "draft",
            "currency": "AUD",
            "payment_terms": "Net 30",
            "notes": "Annual audit engagement — FY2026 interim review",
            "lines": [
                {"description": "Interim audit fieldwork (3 days on-site)", "account_code": "6310", "quantity": 1, "unit_price": 8500.00, "tax_rate": 10.0, "amount": 8500.00},
                {"description": "Tax compliance review", "account_code": "6310", "quantity": 1, "unit_price": 3200.00, "tax_rate": 10.0, "amount": 3200.00},
            ],
        },
        {
            "supplier_name": "JB Hi-Fi Commercial",
            "supplier_id": "SUP-008",
            "bill_number": "JBHC-0029184",
            "reference": "PO-2026-0038",
            "date": "2026-02-20",
            "due_date": "2026-03-06",
            "status": "overdue",
            "currency": "AUD",
            "payment_terms": "Net 14",
            "notes": "IT equipment — new starter hardware bundle",
            "lines": [
                {"description": "MacBook Pro 16\" M4 Pro (×2)", "account_code": "1500", "quantity": 2, "unit_price": 4299.00, "tax_rate": 10.0, "amount": 8598.00},
                {"description": "Dell UltraSharp 27\" 4K monitors (×4)", "account_code": "1500", "quantity": 4, "unit_price": 749.00, "tax_rate": 10.0, "amount": 2996.00},
                {"description": "Logitech MX Master 3S + MX Keys (×2 sets)", "account_code": "6170", "quantity": 2, "unit_price": 329.00, "tax_rate": 10.0, "amount": 658.00},
            ],
        },
        {
            "supplier_name": "HubSpot Inc",
            "supplier_id": "SUP-009",
            "bill_number": "HS-INV-2026-44821",
            "reference": "Contract-ENT-2025",
            "date": "2026-03-15",
            "due_date": "2026-04-14",
            "status": "pending_approval",
            "currency": "USD",
            "payment_terms": "Net 30",
            "notes": "CRM & Marketing Hub Enterprise — quarterly licence",
            "lines": [
                {"description": "Marketing Hub Enterprise (Q2 2026)", "account_code": "6150", "quantity": 1, "unit_price": 3600.00, "tax_rate": 0.0, "amount": 3600.00},
                {"description": "Sales Hub Professional (Q2 2026)", "account_code": "6150", "quantity": 1, "unit_price": 1500.00, "tax_rate": 0.0, "amount": 1500.00},
                {"description": "Additional API calls overage — Feb", "account_code": "6150", "quantity": 1, "unit_price": 245.00, "tax_rate": 0.0, "amount": 245.00},
            ],
        },
        {
            "supplier_name": "Aon Risk Services",
            "supplier_id": "SUP-010",
            "bill_number": "AON-POL-2026-3391",
            "reference": "Policy-BIZ-2026",
            "date": "2026-01-15",
            "due_date": "2026-02-14",
            "status": "voided",
            "currency": "AUD",
            "payment_terms": "Net 30",
            "notes": "Voided — duplicate of AON-POL-2026-3390 (correct invoice already paid)",
            "lines": [
                {"description": "Professional Indemnity Insurance (annual)", "account_code": "6250", "quantity": 1, "unit_price": 4800.00, "tax_rate": 10.0, "amount": 4800.00},
                {"description": "Public Liability Insurance (annual)", "account_code": "6250", "quantity": 1, "unit_price": 1950.00, "tax_rate": 10.0, "amount": 1950.00},
            ],
        },
    ]

    for bill_data in bills_data:
        bill_id = str(uuid.uuid4())
        lines = bill_data.pop("lines")
        subtotal = round(sum(l["amount"] for l in lines), 2)
        tax_amount = round(sum(l["amount"] * l["tax_rate"] / 100.0 for l in lines), 2)
        total = round(subtotal + tax_amount, 2)

        amount_paid = total if bill_data["status"] == "paid" else 0.0
        amount_due = 0.0 if bill_data["status"] in ("paid", "voided") else total

        _bills[bill_id] = {
            "id": bill_id,
            **bill_data,
            "subtotal": subtotal,
            "tax_amount": tax_amount,
            "total": total,
            "amount_paid": amount_paid,
            "amount_due": amount_due,
            "lines": lines,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
        }


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class BillLineCreate(BaseModel):
    description: str = Field(..., min_length=1)
    account_code: str = Field(..., min_length=1)
    quantity: float = 1.0
    unit_price: float = 0.0
    tax_rate: float = 0.0
    amount: float = 0.0


class BillCreate(BaseModel):
    supplier_name: str = Field(..., min_length=1, max_length=255)
    supplier_id: str = ""
    bill_number: str = Field(..., min_length=1, max_length=100)
    reference: str = ""
    date: str = Field(..., description="YYYY-MM-DD")
    due_date: str = Field(..., description="YYYY-MM-DD")
    currency: str = "AUD"
    payment_terms: str = "Net 30"
    notes: str = ""
    lines: list[BillLineCreate] = Field(..., min_length=1)


class BillUpdate(BaseModel):
    supplier_name: str | None = None
    supplier_id: str | None = None
    bill_number: str | None = None
    reference: str | None = None
    date: str | None = None
    due_date: str | None = None
    currency: str | None = None
    payment_terms: str | None = None
    notes: str | None = None
    lines: list[BillLineCreate] | None = None


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _recalculate_totals(bill: dict) -> None:
    """Recalculate subtotal, tax, total, and amount_due from line items."""
    lines = bill.get("lines", [])
    subtotal = round(sum(l["amount"] for l in lines), 2)
    tax_amount = round(sum(l["amount"] * l["tax_rate"] / 100.0 for l in lines), 2)
    total = round(subtotal + tax_amount, 2)
    bill["subtotal"] = subtotal
    bill["tax_amount"] = tax_amount
    bill["total"] = total
    bill["amount_due"] = round(total - bill.get("amount_paid", 0.0), 2)
    bill["updated_at"] = datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/summary")
async def bills_summary(user: User = Depends(get_current_user)):
    """Aggregate AP stats for dashboard cards."""
    _seed_demo_data()

    today = date.today()
    all_bills = list(_bills.values())
    active = [b for b in all_bills if b["status"] != "voided"]

    total_outstanding = sum(b["amount_due"] for b in active if b["status"] not in ("paid", "voided"))
    total_overdue = sum(
        b["amount_due"] for b in active
        if b["status"] not in ("paid", "voided") and b["due_date"] < today.isoformat()
    )

    current_month = today.strftime("%Y-%m")
    paid_this_month = sum(
        b["total"] for b in active
        if b["status"] == "paid" and b.get("updated_at", "")[:7] == current_month
    )

    return {
        "total_bills": len(active),
        "outstanding": round(total_outstanding, 2),
        "overdue": round(total_overdue, 2),
        "overdue_count": len([
            b for b in active
            if b["status"] not in ("paid", "voided") and b["due_date"] < today.isoformat()
        ]),
        "paid_this_month": round(paid_this_month, 2),
        "draft_count": len([b for b in active if b["status"] == "draft"]),
        "pending_approval_count": len([b for b in active if b["status"] == "pending_approval"]),
        "approved_count": len([b for b in active if b["status"] == "approved"]),
    }


@router.get("/")
async def list_bills(
    status_filter: str | None = None,
    supplier: str | None = None,
    overdue: bool | None = None,
    user: User = Depends(get_current_user),
):
    """List all bills with optional filters."""
    _seed_demo_data()

    today = date.today()
    results = list(_bills.values())

    if status_filter:
        results = [b for b in results if b["status"] == status_filter]
    if supplier:
        q = supplier.lower()
        results = [b for b in results if q in b["supplier_name"].lower()]
    if overdue is True:
        results = [
            b for b in results
            if b["status"] not in ("paid", "voided") and b["due_date"] < today.isoformat()
        ]
    elif overdue is False:
        results = [
            b for b in results
            if b["status"] in ("paid", "voided") or b["due_date"] >= today.isoformat()
        ]

    results.sort(key=lambda b: b["due_date"], reverse=True)
    return {"bills": results, "total": len(results)}


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_bill(
    data: BillCreate,
    user: User = Depends(get_current_user),
):
    """Create a new bill in draft status."""
    _seed_demo_data()

    now = datetime.now(timezone.utc)
    bill_id = str(uuid.uuid4())
    lines = [l.model_dump() for l in data.lines]

    bill = {
        "id": bill_id,
        "supplier_name": data.supplier_name,
        "supplier_id": data.supplier_id,
        "bill_number": data.bill_number,
        "reference": data.reference,
        "date": data.date,
        "due_date": data.due_date,
        "status": "draft",
        "currency": data.currency,
        "subtotal": 0.0,
        "tax_amount": 0.0,
        "total": 0.0,
        "amount_paid": 0.0,
        "amount_due": 0.0,
        "lines": lines,
        "payment_terms": data.payment_terms,
        "notes": data.notes,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }
    _recalculate_totals(bill)
    _bills[bill_id] = bill
    return bill


@router.get("/{bill_id}")
async def get_bill(
    bill_id: str,
    user: User = Depends(get_current_user),
):
    """Get a single bill by ID."""
    _seed_demo_data()

    bill = _bills.get(bill_id)
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    return bill


@router.put("/{bill_id}")
async def update_bill(
    bill_id: str,
    data: BillUpdate,
    user: User = Depends(get_current_user),
):
    """Update an existing bill.  Only draft and pending_approval bills can be edited."""
    _seed_demo_data()

    bill = _bills.get(bill_id)
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    if bill["status"] not in ("draft", "pending_approval"):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot edit a bill with status '{bill['status']}'. Only draft or pending_approval bills can be modified.",
        )

    updates = data.model_dump(exclude_unset=True)
    lines_updated = False
    for key, value in updates.items():
        if key == "lines" and value is not None:
            bill["lines"] = [l.model_dump() if hasattr(l, "model_dump") else l for l in data.lines]
            lines_updated = True
        elif value is not None:
            bill[key] = value

    if lines_updated:
        _recalculate_totals(bill)
    else:
        bill["updated_at"] = datetime.now(timezone.utc).isoformat()

    return bill


@router.post("/{bill_id}/approve")
async def approve_bill(
    bill_id: str,
    user: User = Depends(get_current_user),
):
    """Approve a bill for payment.  Only draft or pending_approval bills can be approved."""
    _seed_demo_data()

    bill = _bills.get(bill_id)
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    if bill["status"] not in ("draft", "pending_approval"):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot approve a bill with status '{bill['status']}'.",
        )

    bill["status"] = "approved"
    bill["approved_by"] = str(user.id) if hasattr(user, "id") else "system"
    bill["approved_at"] = datetime.now(timezone.utc).isoformat()
    bill["updated_at"] = bill["approved_at"]
    return bill


@router.post("/{bill_id}/pay")
async def pay_bill(
    bill_id: str,
    data: dict | None = None,
    user: User = Depends(get_current_user),
):
    """Mark a bill as paid.  Optionally accepts {amount, method, reference}."""
    _seed_demo_data()

    bill = _bills.get(bill_id)
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    if bill["status"] in ("paid", "voided"):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot pay a bill with status '{bill['status']}'.",
        )

    body = data or {}
    payment_amount = body.get("amount", bill["amount_due"])
    bill["amount_paid"] = round(bill["amount_paid"] + payment_amount, 2)
    bill["amount_due"] = round(bill["total"] - bill["amount_paid"], 2)

    if bill["amount_due"] <= 0:
        bill["amount_due"] = 0.0
        bill["status"] = "paid"
    else:
        bill["status"] = "partial"

    now = datetime.now(timezone.utc).isoformat()
    bill["paid_at"] = now
    bill["payment_method"] = body.get("method", "bank_transfer")
    bill["payment_reference"] = body.get("reference", "")
    bill["updated_at"] = now

    return bill


@router.delete("/{bill_id}")
async def void_bill(
    bill_id: str,
    user: User = Depends(get_current_user),
):
    """Void / cancel a bill.  Paid bills cannot be voided."""
    _seed_demo_data()

    bill = _bills.get(bill_id)
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    if bill["status"] == "paid":
        raise HTTPException(
            status_code=400,
            detail="Cannot void a paid bill. Create a credit note instead.",
        )
    if bill["status"] == "voided":
        raise HTTPException(status_code=400, detail="Bill is already voided.")

    bill["status"] = "voided"
    bill["amount_due"] = 0.0
    bill["updated_at"] = datetime.now(timezone.utc).isoformat()
    bill["voided_by"] = str(user.id) if hasattr(user, "id") else "system"

    return {"status": "voided", "bill_id": bill_id}

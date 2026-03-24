"""Purchase Orders API routes."""

from fastapi import APIRouter, Depends, HTTPException
from app.auth.dependencies import get_current_user
from app.models.user import User
from datetime import datetime
import uuid

router = APIRouter(prefix="/purchase-orders", tags=["Purchase Orders"])

# In-memory store (replace with DB later)
_purchase_orders = []
_seed_done = False


def _seed():
    global _seed_done
    if _seed_done:
        return
    _seed_done = True
    demos = [
        {
            "po_number": "PO-0001",
            "supplier_name": "TechParts Ltd",
            "supplier_id": "sup-001",
            "date": "2026-03-10",
            "expected_delivery": "2026-04-05",
            "status": "approved",
            "currency": "GBP",
            "lines": [
                {"description": "Dell Latitude 5540 Laptop", "quantity": 5, "unit_price": 1200.00, "tax_rate": 20.0, "amount": 6000.00, "received_qty": 0},
                {"description": "27\" 4K Monitor", "quantity": 5, "unit_price": 450.00, "tax_rate": 20.0, "amount": 2250.00, "received_qty": 0},
                {"description": "USB-C Docking Station", "quantity": 5, "unit_price": 180.00, "tax_rate": 20.0, "amount": 900.00, "received_qty": 0},
            ],
            "subtotal": 9150.00,
            "tax_amount": 1830.00,
            "total": 10980.00,
            "delivery_address": "Level 8, 120 Collins St, Melbourne VIC 3000",
            "notes": "New hire equipment — Q2 onboarding batch",
        },
        {
            "po_number": "PO-0002",
            "supplier_name": "Office Supplies Co",
            "supplier_id": "sup-002",
            "date": "2026-03-15",
            "expected_delivery": "2026-03-25",
            "status": "sent",
            "currency": "AUD",
            "lines": [
                {"description": "A4 Copy Paper (box of 5 reams)", "quantity": 20, "unit_price": 32.00, "tax_rate": 10.0, "amount": 640.00, "received_qty": 0},
                {"description": "Ink Cartridge — HP 962XL Black", "quantity": 10, "unit_price": 45.00, "tax_rate": 10.0, "amount": 450.00, "received_qty": 0},
            ],
            "subtotal": 1090.00,
            "tax_amount": 109.00,
            "total": 1199.00,
            "delivery_address": "Level 8, 120 Collins St, Melbourne VIC 3000",
            "notes": "Monthly stationery restock",
        },
        {
            "po_number": "PO-0003",
            "supplier_name": "Premium Print & Design",
            "supplier_id": "sup-003",
            "date": "2026-02-20",
            "expected_delivery": "2026-03-10",
            "status": "received",
            "currency": "NZD",
            "lines": [
                {"description": "Business Cards — 500 pack", "quantity": 10, "unit_price": 85.00, "tax_rate": 15.0, "amount": 850.00, "received_qty": 10},
                {"description": "Company Brochure — A4 Tri-fold", "quantity": 1000, "unit_price": 1.20, "tax_rate": 15.0, "amount": 1200.00, "received_qty": 1000},
            ],
            "subtotal": 2050.00,
            "tax_amount": 307.50,
            "total": 2357.50,
            "delivery_address": "15 Queen St, Auckland 1010",
            "notes": "Marketing collateral for Q2 campaign",
        },
        {
            "po_number": "PO-0004",
            "supplier_name": "FastFreight Logistics",
            "supplier_id": "sup-004",
            "date": "2026-03-18",
            "expected_delivery": "2026-03-28",
            "status": "partially_received",
            "currency": "AUD",
            "lines": [
                {"description": "Standing Desk — Electric Height Adjustable", "quantity": 8, "unit_price": 650.00, "tax_rate": 10.0, "amount": 5200.00, "received_qty": 5},
                {"description": "Ergonomic Office Chair", "quantity": 8, "unit_price": 480.00, "tax_rate": 10.0, "amount": 3840.00, "received_qty": 5},
            ],
            "subtotal": 9040.00,
            "tax_amount": 904.00,
            "total": 9944.00,
            "delivery_address": "Level 8, 120 Collins St, Melbourne VIC 3000",
            "notes": "Partial delivery received 22 Mar — remaining 3 units ETA 28 Mar",
        },
        {
            "po_number": "PO-0005",
            "supplier_name": "CloudHost Pro",
            "supplier_id": "sup-005",
            "date": "2026-03-22",
            "expected_delivery": "2026-03-22",
            "status": "billed",
            "currency": "USD",
            "lines": [
                {"description": "Dedicated Server — 64GB RAM, 2TB SSD", "quantity": 1, "unit_price": 350.00, "tax_rate": 0, "amount": 350.00, "received_qty": 1},
                {"description": "SSL Certificate — Wildcard (1 year)", "quantity": 1, "unit_price": 120.00, "tax_rate": 0, "amount": 120.00, "received_qty": 1},
            ],
            "subtotal": 470.00,
            "tax_amount": 0,
            "total": 470.00,
            "delivery_address": "N/A — digital delivery",
            "notes": "Annual infrastructure renewal",
        },
        {
            "po_number": "PO-0006",
            "supplier_name": "Legal Eagles LLP",
            "supplier_id": "sup-006",
            "date": "2026-03-24",
            "expected_delivery": "2026-04-15",
            "status": "draft",
            "currency": "AUD",
            "lines": [
                {"description": "Contract Review — Partnership Agreement", "quantity": 1, "unit_price": 2500.00, "tax_rate": 10.0, "amount": 2500.00, "received_qty": 0},
                {"description": "IP Assignment Deed Preparation", "quantity": 1, "unit_price": 1800.00, "tax_rate": 10.0, "amount": 1800.00, "received_qty": 0},
            ],
            "subtotal": 4300.00,
            "tax_amount": 430.00,
            "total": 4730.00,
            "delivery_address": "200 Collins St, Melbourne VIC 3000",
            "notes": "Draft — awaiting internal sign-off",
        },
    ]
    for d in demos:
        _purchase_orders.append({
            "id": str(uuid.uuid4()),
            "created_at": datetime.utcnow().isoformat(),
            **d,
        })


@router.get("/")
async def list_purchase_orders(status: str | None = None, supplier: str | None = None, user: User = Depends(get_current_user)):
    """List all purchase orders with optional filters."""
    _seed()
    results = _purchase_orders
    if status:
        results = [po for po in results if po["status"] == status]
    if supplier:
        q = supplier.lower()
        results = [po for po in results if q in po["supplier_name"].lower()]
    return {"purchase_orders": results, "total": len(results)}


@router.get("/summary")
async def purchase_orders_summary(user: User = Depends(get_current_user)):
    """Purchase order summary statistics."""
    _seed()
    by_status = {}
    for po in _purchase_orders:
        by_status[po["status"]] = by_status.get(po["status"], 0) + 1
    open_total = sum(po["total"] for po in _purchase_orders if po["status"] in ("draft", "sent", "approved", "partially_received"))
    return {
        "total_pos": len(_purchase_orders),
        "by_status": by_status,
        "open_value": round(open_total, 2),
        "awaiting_delivery": len([po for po in _purchase_orders if po["status"] in ("approved", "sent")]),
    }


@router.post("/")
async def create_purchase_order(data: dict, user: User = Depends(get_current_user)):
    """Create a new purchase order."""
    _seed()
    po_nums = [int(po["po_number"].replace("PO-", "")) for po in _purchase_orders if po["po_number"].startswith("PO-")]
    next_num = max(po_nums, default=0) + 1
    po = {
        "id": str(uuid.uuid4()),
        "po_number": f"PO-{next_num:04d}",
        "created_at": datetime.utcnow().isoformat(),
        "status": "draft",
        **data,
    }
    _purchase_orders.append(po)
    return po


@router.get("/{po_id}")
async def get_purchase_order(po_id: str, user: User = Depends(get_current_user)):
    """Get a single purchase order."""
    _seed()
    for po in _purchase_orders:
        if po["id"] == po_id:
            return po
    raise HTTPException(status_code=404, detail="Purchase order not found")


@router.put("/{po_id}")
async def update_purchase_order(po_id: str, data: dict, user: User = Depends(get_current_user)):
    """Update a purchase order."""
    _seed()
    for i, po in enumerate(_purchase_orders):
        if po["id"] == po_id:
            if po["status"] in ("billed", "cancelled"):
                raise HTTPException(status_code=400, detail=f"Cannot edit a {po['status']} purchase order")
            _purchase_orders[i] = {**po, **data}
            return _purchase_orders[i]
    raise HTTPException(status_code=404, detail="Purchase order not found")


@router.post("/{po_id}/approve")
async def approve_purchase_order(po_id: str, user: User = Depends(get_current_user)):
    """Approve a purchase order."""
    _seed()
    for i, po in enumerate(_purchase_orders):
        if po["id"] == po_id:
            if po["status"] not in ("draft", "sent"):
                raise HTTPException(status_code=400, detail="Only draft or sent POs can be approved")
            _purchase_orders[i]["status"] = "approved"
            return _purchase_orders[i]
    raise HTTPException(status_code=404, detail="Purchase order not found")


@router.post("/{po_id}/receive")
async def receive_purchase_order(po_id: str, data: dict | None = None, user: User = Depends(get_current_user)):
    """Mark goods as received on a purchase order."""
    _seed()
    for i, po in enumerate(_purchase_orders):
        if po["id"] == po_id:
            if po["status"] not in ("approved", "sent", "partially_received"):
                raise HTTPException(status_code=400, detail="PO must be approved or sent to receive goods")
            # Update received quantities if provided
            if data and "lines" in data:
                for update_line in data["lines"]:
                    for line in po["lines"]:
                        if line["description"] == update_line.get("description"):
                            line["received_qty"] = update_line.get("received_qty", line["quantity"])
            all_received = all(line.get("received_qty", 0) >= line["quantity"] for line in po["lines"])
            _purchase_orders[i]["status"] = "received" if all_received else "partially_received"
            return _purchase_orders[i]
    raise HTTPException(status_code=404, detail="Purchase order not found")


@router.post("/{po_id}/convert")
async def convert_to_bill(po_id: str, user: User = Depends(get_current_user)):
    """Convert a received purchase order to a bill."""
    _seed()
    for i, po in enumerate(_purchase_orders):
        if po["id"] == po_id:
            if po["status"] not in ("received", "partially_received"):
                raise HTTPException(status_code=400, detail="PO must be received before converting to bill")
            _purchase_orders[i]["status"] = "billed"
            bill = {
                "bill_id": str(uuid.uuid4()),
                "source_po": po["po_number"],
                "supplier_name": po["supplier_name"],
                "total": po["total"],
                "status": "draft",
                "created_at": datetime.utcnow().isoformat(),
            }
            return {"purchase_order": _purchase_orders[i], "bill": bill}
    raise HTTPException(status_code=404, detail="Purchase order not found")


@router.delete("/{po_id}")
async def cancel_purchase_order(po_id: str, user: User = Depends(get_current_user)):
    """Cancel a purchase order."""
    _seed()
    for i, po in enumerate(_purchase_orders):
        if po["id"] == po_id:
            if po["status"] in ("billed",):
                raise HTTPException(status_code=400, detail="Cannot cancel a billed purchase order")
            _purchase_orders[i]["status"] = "cancelled"
            return {"status": "cancelled"}
    raise HTTPException(status_code=404, detail="Purchase order not found")

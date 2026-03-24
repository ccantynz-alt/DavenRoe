"""Supplier / Vendor Management API routes."""

from fastapi import APIRouter, Depends, HTTPException
from app.auth.dependencies import get_current_user
from app.models.user import User
from datetime import datetime
import uuid

router = APIRouter(prefix="/suppliers", tags=["Supplier Management"])

# In-memory store (replace with DB later)
_suppliers = []
_seed_done = False


def _seed():
    global _seed_done
    if _seed_done:
        return
    _seed_done = True
    demos = [
        {"name": "Office Supplies Co", "email": "accounts@officesupplies.co", "phone": "+61 2 9000 1111", "contact_name": "Sarah Chen", "tax_id": "51 824 753 556", "payment_terms": 30, "currency": "AUD", "category": "office_supplies", "status": "active", "address": "42 George St, Sydney NSW 2000", "notes": "Preferred supplier — 10% volume discount", "bank_bsb": "062-000", "bank_account": "1234 5678", "total_paid": 24500.00, "outstanding": 1200.00},
        {"name": "CloudHost Pro", "email": "billing@cloudhost.pro", "phone": "+1 415 555 0199", "contact_name": "Mike Johnson", "tax_id": "94-3456789", "payment_terms": 14, "currency": "USD", "category": "software", "status": "active", "address": "100 Market St, San Francisco CA 94105", "notes": "Annual hosting contract", "bank_bsb": "", "bank_account": "", "total_paid": 8400.00, "outstanding": 700.00},
        {"name": "Premium Print & Design", "email": "hello@premiumprint.co.nz", "phone": "+64 9 303 4455", "contact_name": "James Walker", "tax_id": "123-456-789", "payment_terms": 20, "currency": "NZD", "category": "marketing", "status": "active", "address": "15 Queen St, Auckland 1010", "notes": "", "bank_bsb": "", "bank_account": "", "total_paid": 5600.00, "outstanding": 0},
        {"name": "TechParts Ltd", "email": "orders@techparts.co.uk", "phone": "+44 20 7946 0958", "contact_name": "Emily Taylor", "tax_id": "GB 123 4567 89", "payment_terms": 45, "currency": "GBP", "category": "equipment", "status": "active", "address": "10 Downing Business Park, London SE1 7PB", "notes": "Net 45 — hardware components", "bank_bsb": "", "bank_account": "", "total_paid": 32000.00, "outstanding": 4500.00},
        {"name": "Legal Eagles LLP", "email": "invoices@legaleagles.com.au", "phone": "+61 3 8000 2222", "contact_name": "David Kim", "tax_id": "53 004 085 616", "payment_terms": 14, "currency": "AUD", "category": "professional_services", "status": "active", "address": "200 Collins St, Melbourne VIC 3000", "notes": "Corporate counsel — retainer agreement", "bank_bsb": "033-000", "bank_account": "8765 4321", "total_paid": 18000.00, "outstanding": 3000.00},
        {"name": "FastFreight Logistics", "email": "ap@fastfreight.com", "phone": "+61 7 3000 5555", "contact_name": "Tom Nguyen", "tax_id": "61 153 245 789", "payment_terms": 7, "currency": "AUD", "category": "shipping", "status": "active", "address": "88 Wharf Rd, Brisbane QLD 4000", "notes": "Weekly deliveries — COD preferred", "bank_bsb": "084-004", "bank_account": "5566 7788", "total_paid": 11200.00, "outstanding": 800.00},
        {"name": "Stale Vendor Inc", "email": "old@stalevendor.com", "phone": "", "contact_name": "", "tax_id": "", "payment_terms": 30, "currency": "USD", "category": "other", "status": "inactive", "address": "", "notes": "No longer used", "bank_bsb": "", "bank_account": "", "total_paid": 2000.00, "outstanding": 0},
    ]
    for d in demos:
        _suppliers.append({"id": str(uuid.uuid4()), "created_at": datetime.utcnow().isoformat(), "updated_at": datetime.utcnow().isoformat(), **d})


@router.get("/")
async def list_suppliers(status: str | None = None, category: str | None = None, search: str | None = None, user: User = Depends(get_current_user)):
    """List all suppliers with optional filters."""
    _seed()
    results = _suppliers
    if status:
        results = [s for s in results if s["status"] == status]
    if category:
        results = [s for s in results if s["category"] == category]
    if search:
        q = search.lower()
        results = [s for s in results if q in s["name"].lower() or q in (s.get("email") or "").lower() or q in (s.get("contact_name") or "").lower()]
    return {"suppliers": results, "total": len(results)}


@router.get("/summary")
async def supplier_summary(user: User = Depends(get_current_user)):
    """Get supplier summary statistics."""
    _seed()
    active = [s for s in _suppliers if s["status"] == "active"]
    total_outstanding = sum(s.get("outstanding", 0) for s in _suppliers)
    total_paid = sum(s.get("total_paid", 0) for s in _suppliers)
    categories = list(set(s["category"] for s in _suppliers))
    return {"total_suppliers": len(_suppliers), "active": len(active), "inactive": len(_suppliers) - len(active), "total_outstanding": total_outstanding, "total_paid_ytd": total_paid, "categories": categories}


@router.post("/")
async def create_supplier(data: dict, user: User = Depends(get_current_user)):
    """Create a new supplier."""
    _seed()
    supplier = {"id": str(uuid.uuid4()), "created_at": datetime.utcnow().isoformat(), "updated_at": datetime.utcnow().isoformat(), "status": "active", "total_paid": 0, "outstanding": 0, **data}
    _suppliers.append(supplier)
    return supplier


@router.get("/{supplier_id}")
async def get_supplier(supplier_id: str, user: User = Depends(get_current_user)):
    """Get a single supplier by ID."""
    _seed()
    for s in _suppliers:
        if s["id"] == supplier_id:
            return s
    raise HTTPException(status_code=404, detail="Supplier not found")


@router.put("/{supplier_id}")
async def update_supplier(supplier_id: str, data: dict, user: User = Depends(get_current_user)):
    """Update an existing supplier."""
    _seed()
    for i, s in enumerate(_suppliers):
        if s["id"] == supplier_id:
            _suppliers[i] = {**s, **data, "updated_at": datetime.utcnow().isoformat()}
            return _suppliers[i]
    raise HTTPException(status_code=404, detail="Supplier not found")


@router.delete("/{supplier_id}")
async def delete_supplier(supplier_id: str, user: User = Depends(get_current_user)):
    """Soft-delete (deactivate) a supplier."""
    _seed()
    for i, s in enumerate(_suppliers):
        if s["id"] == supplier_id:
            _suppliers[i]["status"] = "inactive"
            return {"status": "deactivated"}
    raise HTTPException(status_code=404, detail="Supplier not found")

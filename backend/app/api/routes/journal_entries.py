"""Journal Entries API routes."""

from fastapi import APIRouter, Depends, HTTPException
from app.auth.dependencies import get_current_user
from app.models.user import User
from datetime import datetime
import uuid

router = APIRouter(prefix="/journal-entries", tags=["Journal Entries"])

# In-memory store (replace with DB later)
_entries = []
_entry_counter = 6
_seed_done = False


def _seed():
    global _seed_done
    if _seed_done:
        return
    _seed_done = True
    demos = [
        {
            "entry_number": "JE-0001",
            "date": "2026-02-28",
            "description": "Month-end accrual — February utilities",
            "status": "posted",
            "lines": [
                {"account_code": "5200", "account_name": "Utilities", "debit": 1450.00, "credit": 0, "description": "Electricity and internet — Feb 2026"},
                {"account_code": "2000", "account_name": "Accounts Payable", "debit": 0, "credit": 1450.00, "description": "Accrued utilities payable"},
            ],
            "total_debit": 1450.00,
            "total_credit": 1450.00,
            "reference": "ACCRUAL-FEB-2026",
            "created_by": "AlecRae AI — Month-End Close",
            "posted_at": "2026-02-28T23:59:00Z",
        },
        {
            "entry_number": "JE-0002",
            "date": "2026-02-28",
            "description": "Depreciation — February 2026",
            "status": "posted",
            "lines": [
                {"account_code": "5500", "account_name": "Depreciation Expense", "debit": 1450.00, "credit": 0, "description": "Monthly depreciation — office equipment"},
                {"account_code": "1600", "account_name": "Accumulated Depreciation — Equipment", "debit": 0, "credit": 700.00, "description": "Equipment depreciation"},
                {"account_code": "1610", "account_name": "Accumulated Depreciation — Vehicles", "debit": 0, "credit": 750.00, "description": "Vehicle depreciation"},
            ],
            "total_debit": 1450.00,
            "total_credit": 1450.00,
            "reference": "DEP-FEB-2026",
            "created_by": "AlecRae AI — Month-End Close",
            "posted_at": "2026-02-28T23:59:00Z",
        },
        {
            "entry_number": "JE-0003",
            "date": "2026-03-15",
            "description": "Payroll — March 1-15 2026",
            "status": "posted",
            "lines": [
                {"account_code": "5000", "account_name": "Wages & Salaries", "debit": 24500.00, "credit": 0, "description": "Gross wages — fortnightly payroll"},
                {"account_code": "5950", "account_name": "Superannuation Expense", "debit": 2817.50, "credit": 0, "description": "Super guarantee 11.5%"},
                {"account_code": "2200", "account_name": "PAYG Withholding Payable", "debit": 0, "credit": 6370.00, "description": "PAYG withheld"},
                {"account_code": "2300", "account_name": "Superannuation Payable", "debit": 0, "credit": 2817.50, "description": "Super payable"},
                {"account_code": "1010", "account_name": "Business Cheque Account", "debit": 0, "credit": 18130.00, "description": "Net pay transferred"},
            ],
            "total_debit": 27317.50,
            "total_credit": 27317.50,
            "reference": "PAY-2026-06",
            "created_by": "Payroll Module",
            "posted_at": "2026-03-15T10:30:00Z",
        },
        {
            "entry_number": "JE-0004",
            "date": "2026-03-18",
            "description": "Correction — Misclassified office supplies to marketing",
            "status": "posted",
            "lines": [
                {"account_code": "5800", "account_name": "Marketing & Advertising", "debit": 0, "credit": 890.00, "description": "Reverse misclassification"},
                {"account_code": "5300", "account_name": "Office Supplies", "debit": 890.00, "credit": 0, "description": "Correct classification"},
            ],
            "total_debit": 890.00,
            "total_credit": 890.00,
            "reference": "CORRECTION-0318",
            "created_by": "admin@alecrae.com",
            "posted_at": "2026-03-18T14:22:00Z",
        },
        {
            "entry_number": "JE-0005",
            "date": "2026-03-20",
            "description": "Prepaid insurance — allocate March portion",
            "status": "posted",
            "lines": [
                {"account_code": "5400", "account_name": "Insurance", "debit": 541.67, "credit": 0, "description": "Monthly insurance allocation (6500/12)"},
                {"account_code": "1300", "account_name": "Prepaid Expenses", "debit": 0, "credit": 541.67, "description": "Reduce prepaid balance"},
            ],
            "total_debit": 541.67,
            "total_credit": 541.67,
            "reference": "PREPAID-MAR-2026",
            "created_by": "AlecRae AI — Month-End Close",
            "posted_at": "2026-03-20T09:00:00Z",
        },
        {
            "entry_number": "JE-0006",
            "date": "2026-03-24",
            "description": "Accrual — Professional services received not yet invoiced",
            "status": "draft",
            "lines": [
                {"account_code": "5600", "account_name": "Professional Fees", "debit": 3300.00, "credit": 0, "description": "Legal review — Q1 retainer"},
                {"account_code": "2000", "account_name": "Accounts Payable", "debit": 0, "credit": 3300.00, "description": "Accrued legal fees"},
            ],
            "total_debit": 3300.00,
            "total_credit": 3300.00,
            "reference": "ACCRUAL-LEGAL-Q1",
            "created_by": "admin@alecrae.com",
            "posted_at": None,
        },
    ]
    now = datetime.utcnow().isoformat()
    for d in demos:
        _entries.append({"id": str(uuid.uuid4()), "created_at": now, **d})


@router.get("/")
async def list_entries(status: str | None = None, date_from: str | None = None, date_to: str | None = None, search: str | None = None, user: User = Depends(get_current_user)):
    """List all journal entries with optional filters."""
    _seed()
    results = _entries
    if status:
        results = [e for e in results if e["status"] == status]
    if date_from:
        results = [e for e in results if e["date"] >= date_from]
    if date_to:
        results = [e for e in results if e["date"] <= date_to]
    if search:
        q = search.lower()
        results = [e for e in results if q in e["description"].lower() or q in e["entry_number"].lower() or q in (e.get("reference") or "").lower()]
    return {"entries": results, "total": len(results)}


@router.get("/summary")
async def entries_summary(user: User = Depends(get_current_user)):
    """Get journal entries summary statistics."""
    _seed()
    draft = [e for e in _entries if e["status"] == "draft"]
    posted = [e for e in _entries if e["status"] == "posted"]
    reversed_entries = [e for e in _entries if e["status"] == "reversed"]
    voided = [e for e in _entries if e["status"] == "voided"]
    total_debits = sum(e["total_debit"] for e in posted)
    return {
        "total_entries": len(_entries),
        "draft": len(draft),
        "posted": len(posted),
        "reversed": len(reversed_entries),
        "voided": len(voided),
        "total_posted_debits": round(total_debits, 2),
    }


@router.post("/")
async def create_entry(data: dict, user: User = Depends(get_current_user)):
    """Create a new journal entry. Validates that total debits equal total credits."""
    _seed()
    global _entry_counter
    lines = data.get("lines", [])
    if not lines:
        raise HTTPException(status_code=400, detail="Journal entry must have at least one line")
    total_debit = round(sum(l.get("debit", 0) for l in lines), 2)
    total_credit = round(sum(l.get("credit", 0) for l in lines), 2)
    if total_debit != total_credit:
        raise HTTPException(status_code=400, detail=f"Debits ({total_debit}) must equal credits ({total_credit})")
    _entry_counter += 1
    entry = {
        "id": str(uuid.uuid4()),
        "entry_number": f"JE-{_entry_counter:04d}",
        "date": data.get("date", datetime.utcnow().strftime("%Y-%m-%d")),
        "description": data.get("description", ""),
        "status": "draft",
        "lines": lines,
        "total_debit": total_debit,
        "total_credit": total_credit,
        "reference": data.get("reference", ""),
        "created_by": data.get("created_by", "manual"),
        "created_at": datetime.utcnow().isoformat(),
        "posted_at": None,
    }
    _entries.append(entry)
    return entry


@router.get("/{entry_id}")
async def get_entry(entry_id: str, user: User = Depends(get_current_user)):
    """Get a single journal entry by ID."""
    _seed()
    for e in _entries:
        if e["id"] == entry_id:
            return e
    raise HTTPException(status_code=404, detail="Journal entry not found")


@router.post("/{entry_id}/post")
async def post_entry(entry_id: str, user: User = Depends(get_current_user)):
    """Post a draft journal entry."""
    _seed()
    for i, e in enumerate(_entries):
        if e["id"] == entry_id:
            if e["status"] != "draft":
                raise HTTPException(status_code=400, detail=f"Cannot post entry with status '{e['status']}' — only draft entries can be posted")
            _entries[i]["status"] = "posted"
            _entries[i]["posted_at"] = datetime.utcnow().isoformat()
            return _entries[i]
    raise HTTPException(status_code=404, detail="Journal entry not found")


@router.post("/{entry_id}/reverse")
async def reverse_entry(entry_id: str, data: dict = None, user: User = Depends(get_current_user)):
    """Create a reversing entry for a posted journal entry."""
    _seed()
    global _entry_counter
    data = data or {}
    for i, e in enumerate(_entries):
        if e["id"] == entry_id:
            if e["status"] != "posted":
                raise HTTPException(status_code=400, detail="Only posted entries can be reversed")
            # Mark original as reversed
            _entries[i]["status"] = "reversed"
            # Create reversing entry (swap debits and credits)
            _entry_counter += 1
            reversed_lines = [
                {**l, "debit": l["credit"], "credit": l["debit"], "description": f"Reversal — {l.get('description', '')}"}
                for l in e["lines"]
            ]
            reversal = {
                "id": str(uuid.uuid4()),
                "entry_number": f"JE-{_entry_counter:04d}",
                "date": data.get("date", datetime.utcnow().strftime("%Y-%m-%d")),
                "description": f"Reversal of {e['entry_number']} — {e['description']}",
                "status": "posted",
                "lines": reversed_lines,
                "total_debit": e["total_credit"],
                "total_credit": e["total_debit"],
                "reference": f"REV-{e['entry_number']}",
                "created_by": "system",
                "created_at": datetime.utcnow().isoformat(),
                "posted_at": datetime.utcnow().isoformat(),
            }
            _entries.append(reversal)
            return {"original": _entries[i], "reversal": reversal}
    raise HTTPException(status_code=404, detail="Journal entry not found")


@router.delete("/{entry_id}")
async def void_entry(entry_id: str, user: User = Depends(get_current_user)):
    """Void a journal entry (only draft entries can be voided)."""
    _seed()
    for i, e in enumerate(_entries):
        if e["id"] == entry_id:
            if e["status"] != "draft":
                raise HTTPException(status_code=400, detail="Only draft entries can be voided — use reverse for posted entries")
            _entries[i]["status"] = "voided"
            return {"status": "voided"}
    raise HTTPException(status_code=404, detail="Journal entry not found")

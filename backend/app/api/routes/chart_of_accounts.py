"""Chart of Accounts API routes."""

from fastapi import APIRouter, Depends, HTTPException
from app.auth.dependencies import get_current_user
from app.models.user import User
from datetime import datetime
import uuid

router = APIRouter(prefix="/chart-of-accounts", tags=["Chart of Accounts"])

# In-memory store (replace with DB later)
_accounts = []
_seed_done = False


def _seed():
    global _seed_done
    if _seed_done:
        return
    _seed_done = True
    now = datetime.utcnow().isoformat()
    demos = [
        # Assets
        {"code": "1000", "name": "Cash on Hand", "type": "asset", "sub_type": "current_asset", "description": "Physical cash and petty cash", "balance": 2500.00, "currency": "AUD", "status": "active", "is_system": True, "tax_code": None},
        {"code": "1010", "name": "Business Cheque Account", "type": "asset", "sub_type": "current_asset", "description": "Primary operating bank account", "balance": 84350.00, "currency": "AUD", "status": "active", "is_system": True, "tax_code": None},
        {"code": "1020", "name": "Business Savings Account", "type": "asset", "sub_type": "current_asset", "description": "High-interest savings account", "balance": 120000.00, "currency": "AUD", "status": "active", "is_system": False, "tax_code": None},
        {"code": "1100", "name": "Accounts Receivable", "type": "asset", "sub_type": "current_asset", "description": "Amounts owed by customers", "balance": 45200.00, "currency": "AUD", "status": "active", "is_system": True, "tax_code": None},
        {"code": "1200", "name": "Inventory", "type": "asset", "sub_type": "current_asset", "description": "Goods held for resale", "balance": 31800.00, "currency": "AUD", "status": "active", "is_system": True, "tax_code": None},
        {"code": "1300", "name": "Prepaid Expenses", "type": "asset", "sub_type": "current_asset", "description": "Expenses paid in advance", "balance": 6400.00, "currency": "AUD", "status": "active", "is_system": False, "tax_code": None},
        {"code": "1500", "name": "Office Equipment", "type": "asset", "sub_type": "fixed_asset", "description": "Computers, furniture and office equipment", "balance": 28000.00, "currency": "AUD", "status": "active", "is_system": False, "tax_code": None},
        {"code": "1510", "name": "Motor Vehicles", "type": "asset", "sub_type": "fixed_asset", "description": "Company vehicles", "balance": 45000.00, "currency": "AUD", "status": "active", "is_system": False, "tax_code": None},
        {"code": "1600", "name": "Accumulated Depreciation — Equipment", "type": "asset", "sub_type": "fixed_asset", "description": "Accumulated depreciation on office equipment", "balance": -8400.00, "currency": "AUD", "status": "active", "is_system": True, "tax_code": None},
        {"code": "1610", "name": "Accumulated Depreciation — Vehicles", "type": "asset", "sub_type": "fixed_asset", "description": "Accumulated depreciation on motor vehicles", "balance": -9000.00, "currency": "AUD", "status": "active", "is_system": True, "tax_code": None},
        # Liabilities
        {"code": "2000", "name": "Accounts Payable", "type": "liability", "sub_type": "current_liability", "description": "Amounts owed to suppliers", "balance": 22400.00, "currency": "AUD", "status": "active", "is_system": True, "tax_code": None},
        {"code": "2100", "name": "GST Payable", "type": "liability", "sub_type": "current_liability", "description": "GST collected on sales, payable to ATO", "balance": 8750.00, "currency": "AUD", "status": "active", "is_system": True, "tax_code": "GST"},
        {"code": "2110", "name": "GST Receivable", "type": "liability", "sub_type": "current_liability", "description": "GST paid on purchases, claimable from ATO", "balance": -3200.00, "currency": "AUD", "status": "active", "is_system": True, "tax_code": "GST"},
        {"code": "2200", "name": "PAYG Withholding Payable", "type": "liability", "sub_type": "current_liability", "description": "PAYG tax withheld from employee wages", "balance": 12600.00, "currency": "AUD", "status": "active", "is_system": True, "tax_code": "PAYG"},
        {"code": "2300", "name": "Superannuation Payable", "type": "liability", "sub_type": "current_liability", "description": "Superannuation guarantee payable", "balance": 6900.00, "currency": "AUD", "status": "active", "is_system": True, "tax_code": None},
        {"code": "2500", "name": "Business Loan", "type": "liability", "sub_type": "non_current_liability", "description": "Bank loan — CBA Business Loan", "balance": 75000.00, "currency": "AUD", "status": "active", "is_system": False, "tax_code": None},
        # Equity
        {"code": "3000", "name": "Owner's Equity", "type": "equity", "sub_type": "equity", "description": "Owner capital contributions", "balance": 150000.00, "currency": "AUD", "status": "active", "is_system": True, "tax_code": None},
        {"code": "3100", "name": "Retained Earnings", "type": "equity", "sub_type": "equity", "description": "Accumulated profits from prior periods", "balance": 89200.00, "currency": "AUD", "status": "active", "is_system": True, "tax_code": None},
        {"code": "3200", "name": "Owner's Drawings", "type": "equity", "sub_type": "equity", "description": "Withdrawals by owner", "balance": -24000.00, "currency": "AUD", "status": "active", "is_system": False, "tax_code": None},
        # Revenue
        {"code": "4000", "name": "Sales Revenue", "type": "revenue", "sub_type": "operating_revenue", "description": "Income from sale of goods and services", "balance": 342500.00, "currency": "AUD", "status": "active", "is_system": True, "tax_code": "GST"},
        {"code": "4100", "name": "Service Revenue", "type": "revenue", "sub_type": "operating_revenue", "description": "Income from consulting and professional services", "balance": 128000.00, "currency": "AUD", "status": "active", "is_system": False, "tax_code": "GST"},
        {"code": "4200", "name": "Interest Income", "type": "revenue", "sub_type": "other_revenue", "description": "Interest earned on bank accounts", "balance": 1850.00, "currency": "AUD", "status": "active", "is_system": False, "tax_code": None},
        {"code": "4900", "name": "Other Income", "type": "revenue", "sub_type": "other_revenue", "description": "Miscellaneous income", "balance": 3200.00, "currency": "AUD", "status": "active", "is_system": False, "tax_code": "GST"},
        # Expenses
        {"code": "5000", "name": "Wages & Salaries", "type": "expense", "sub_type": "operating_expense", "description": "Employee wages, salaries and bonuses", "balance": 185000.00, "currency": "AUD", "status": "active", "is_system": True, "tax_code": None},
        {"code": "5100", "name": "Rent", "type": "expense", "sub_type": "operating_expense", "description": "Office and warehouse rent", "balance": 48000.00, "currency": "AUD", "status": "active", "is_system": False, "tax_code": "GST"},
        {"code": "5200", "name": "Utilities", "type": "expense", "sub_type": "operating_expense", "description": "Electricity, water, gas and internet", "balance": 7800.00, "currency": "AUD", "status": "active", "is_system": False, "tax_code": "GST"},
        {"code": "5300", "name": "Office Supplies", "type": "expense", "sub_type": "operating_expense", "description": "Stationery, printer supplies and consumables", "balance": 3200.00, "currency": "AUD", "status": "active", "is_system": False, "tax_code": "GST"},
        {"code": "5400", "name": "Insurance", "type": "expense", "sub_type": "operating_expense", "description": "Business insurance premiums", "balance": 6500.00, "currency": "AUD", "status": "active", "is_system": False, "tax_code": "GST-Free"},
        {"code": "5500", "name": "Depreciation Expense", "type": "expense", "sub_type": "operating_expense", "description": "Depreciation of fixed assets", "balance": 17400.00, "currency": "AUD", "status": "active", "is_system": True, "tax_code": None},
        {"code": "5600", "name": "Professional Fees", "type": "expense", "sub_type": "operating_expense", "description": "Accounting, legal and consulting fees", "balance": 12000.00, "currency": "AUD", "status": "active", "is_system": False, "tax_code": "GST"},
        {"code": "5700", "name": "Travel & Entertainment", "type": "expense", "sub_type": "operating_expense", "description": "Business travel, meals and entertainment", "balance": 8900.00, "currency": "AUD", "status": "active", "is_system": False, "tax_code": "GST"},
        {"code": "5800", "name": "Marketing & Advertising", "type": "expense", "sub_type": "operating_expense", "description": "Advertising, promotions and marketing costs", "balance": 15600.00, "currency": "AUD", "status": "active", "is_system": False, "tax_code": "GST"},
        {"code": "5900", "name": "Bank Fees & Charges", "type": "expense", "sub_type": "operating_expense", "description": "Bank account fees, merchant fees and charges", "balance": 2100.00, "currency": "AUD", "status": "active", "is_system": False, "tax_code": "GST-Free"},
        {"code": "5950", "name": "Superannuation Expense", "type": "expense", "sub_type": "operating_expense", "description": "Employer superannuation contributions (11.5%)", "balance": 21275.00, "currency": "AUD", "status": "active", "is_system": True, "tax_code": None},
    ]
    for d in demos:
        _accounts.append({"id": str(uuid.uuid4()), "created_at": now, **d})


@router.get("/")
async def list_accounts(type: str | None = None, status: str | None = None, search: str | None = None, user: User = Depends(get_current_user)):
    """List all chart of accounts with optional filters."""
    _seed()
    results = _accounts
    if type:
        results = [a for a in results if a["type"] == type]
    if status:
        results = [a for a in results if a["status"] == status]
    if search:
        q = search.lower()
        results = [a for a in results if q in a["name"].lower() or q in a["code"] or q in (a.get("description") or "").lower()]
    return {"accounts": results, "total": len(results)}


@router.get("/summary")
async def accounts_summary(user: User = Depends(get_current_user)):
    """Get chart of accounts summary by type."""
    _seed()
    summary = {}
    for t in ["asset", "liability", "equity", "revenue", "expense"]:
        accs = [a for a in _accounts if a["type"] == t and a["status"] == "active"]
        summary[t] = {"count": len(accs), "total_balance": round(sum(a["balance"] for a in accs), 2)}
    return {"total_accounts": len(_accounts), "active": len([a for a in _accounts if a["status"] == "active"]), "inactive": len([a for a in _accounts if a["status"] == "inactive"]), "by_type": summary}


@router.post("/")
async def create_account(data: dict, user: User = Depends(get_current_user)):
    """Create a new account in the chart of accounts."""
    _seed()
    # Check for duplicate code
    for a in _accounts:
        if a["code"] == data.get("code"):
            raise HTTPException(status_code=400, detail=f"Account code {data['code']} already exists")
    account = {
        "id": str(uuid.uuid4()),
        "created_at": datetime.utcnow().isoformat(),
        "status": "active",
        "is_system": False,
        "balance": 0,
        "currency": "AUD",
        "tax_code": None,
        **data,
    }
    _accounts.append(account)
    return account


@router.get("/{account_id}")
async def get_account(account_id: str, user: User = Depends(get_current_user)):
    """Get a single account by ID."""
    _seed()
    for a in _accounts:
        if a["id"] == account_id:
            return a
    raise HTTPException(status_code=404, detail="Account not found")


@router.put("/{account_id}")
async def update_account(account_id: str, data: dict, user: User = Depends(get_current_user)):
    """Update an existing account."""
    _seed()
    for i, a in enumerate(_accounts):
        if a["id"] == account_id:
            if a.get("is_system") and "code" in data:
                raise HTTPException(status_code=400, detail="Cannot change code of system account")
            _accounts[i] = {**a, **data, "updated_at": datetime.utcnow().isoformat()}
            return _accounts[i]
    raise HTTPException(status_code=404, detail="Account not found")


@router.delete("/{account_id}")
async def deactivate_account(account_id: str, user: User = Depends(get_current_user)):
    """Deactivate an account (system accounts cannot be deleted)."""
    _seed()
    for i, a in enumerate(_accounts):
        if a["id"] == account_id:
            if a.get("is_system"):
                raise HTTPException(status_code=400, detail="Cannot deactivate system account")
            _accounts[i]["status"] = "inactive"
            return {"status": "deactivated"}
    raise HTTPException(status_code=404, detail="Account not found")

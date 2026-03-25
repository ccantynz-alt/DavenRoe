"""Bank Reconciliation API routes."""

from fastapi import APIRouter, Depends, HTTPException
from app.auth.dependencies import get_current_user
from app.models.user import User
from datetime import datetime
import uuid

router = APIRouter(prefix="/bank-reconciliation", tags=["Bank Reconciliation"])

# In-memory store (replace with DB later)
_sessions = []
_bank_items = {}  # keyed by account_id
_ledger_items = {}  # keyed by account_id
_seed_done = False

_ACCOUNTS = {
    "acc-cheque": {"name": "Business Cheque Account", "number": "062-000 1234 5678", "statement_balance": 84350.00, "last_reconciled": "2026-02-28"},
    "acc-savings": {"name": "Business Savings Account", "number": "062-000 8765 4321", "statement_balance": 120000.00, "last_reconciled": "2026-02-28"},
}


def _seed():
    global _seed_done
    if _seed_done:
        return
    _seed_done = True
    now = datetime.utcnow().isoformat()

    # Cheque account bank transactions
    cheque_bank = [
        {"id": str(uuid.uuid4()), "date": "2026-03-03", "description": "Direct Deposit — Client ABC Pty Ltd", "amount": 8250.00, "type": "credit", "reference": "INV-1042", "matched": True, "matched_to": "led-001", "match_type": "auto"},
        {"id": str(uuid.uuid4()), "date": "2026-03-05", "description": "BPAY — AGL Energy", "amount": -485.00, "type": "debit", "reference": "BPAY-88431", "matched": True, "matched_to": "led-002", "match_type": "auto"},
        {"id": str(uuid.uuid4()), "date": "2026-03-07", "description": "Direct Deposit — Widget Co", "amount": 3300.00, "type": "credit", "reference": "PAY-7721", "matched": True, "matched_to": "led-003", "match_type": "manual"},
        {"id": str(uuid.uuid4()), "date": "2026-03-10", "description": "EFTPOS — Office Supplies Co", "amount": -234.50, "type": "debit", "reference": "EFTPOS-9982", "matched": True, "matched_to": "led-004", "match_type": "rule"},
        {"id": str(uuid.uuid4()), "date": "2026-03-12", "description": "Transfer to Savings", "amount": -5000.00, "type": "debit", "reference": "TFR-INT-001", "matched": True, "matched_to": "led-005", "match_type": "auto"},
        {"id": str(uuid.uuid4()), "date": "2026-03-14", "description": "Payroll — Net Pay Run #6", "amount": -18130.00, "type": "debit", "reference": "PAY-2026-06", "matched": True, "matched_to": "led-006", "match_type": "auto"},
        {"id": str(uuid.uuid4()), "date": "2026-03-17", "description": "Direct Deposit — Acme Corp", "amount": 12400.00, "type": "credit", "reference": "INV-1048", "matched": False, "matched_to": None, "match_type": None},
        {"id": str(uuid.uuid4()), "date": "2026-03-18", "description": "Card Purchase — Amazon Web Services", "amount": -1247.80, "type": "debit", "reference": "CARD-4455", "matched": False, "matched_to": None, "match_type": None},
        {"id": str(uuid.uuid4()), "date": "2026-03-19", "description": "Direct Deposit — Smith & Associates", "amount": 5500.00, "type": "credit", "reference": "REM-3321", "matched": False, "matched_to": None, "match_type": None},
        {"id": str(uuid.uuid4()), "date": "2026-03-20", "description": "BPAY — Telstra", "amount": -189.00, "type": "debit", "reference": "BPAY-90012", "matched": False, "matched_to": None, "match_type": None},
        {"id": str(uuid.uuid4()), "date": "2026-03-21", "description": "Bank Fee — Monthly Account", "amount": -30.00, "type": "debit", "reference": "FEE-MAR", "matched": False, "matched_to": None, "match_type": None},
        {"id": str(uuid.uuid4()), "date": "2026-03-22", "description": "Card Purchase — Uber Eats", "amount": -67.40, "type": "debit", "reference": "CARD-4456", "matched": False, "matched_to": None, "match_type": None},
    ]

    cheque_ledger = [
        {"id": "led-001", "date": "2026-03-03", "description": "Invoice #1042 — ABC Pty Ltd", "amount": 8250.00, "type": "credit", "reference": "INV-1042", "matched": True, "matched_to": cheque_bank[0]["id"]},
        {"id": "led-002", "date": "2026-03-05", "description": "Utilities — AGL Energy", "amount": -485.00, "type": "debit", "reference": "BILL-2210", "matched": True, "matched_to": cheque_bank[1]["id"]},
        {"id": "led-003", "date": "2026-03-07", "description": "Invoice #1045 — Widget Co", "amount": 3300.00, "type": "credit", "reference": "INV-1045", "matched": True, "matched_to": cheque_bank[2]["id"]},
        {"id": "led-004", "date": "2026-03-10", "description": "Office Supplies purchase", "amount": -234.50, "type": "debit", "reference": "EXP-0887", "matched": True, "matched_to": cheque_bank[3]["id"]},
        {"id": "led-005", "date": "2026-03-12", "description": "Transfer to savings account", "amount": -5000.00, "type": "debit", "reference": "TFR-INT-001", "matched": True, "matched_to": cheque_bank[4]["id"]},
        {"id": "led-006", "date": "2026-03-14", "description": "Payroll — Pay Run #6", "amount": -18130.00, "type": "debit", "reference": "PAY-2026-06", "matched": True, "matched_to": cheque_bank[5]["id"]},
        {"id": str(uuid.uuid4()), "date": "2026-03-17", "description": "Invoice #1048 — Acme Corp", "amount": 12400.00, "type": "credit", "reference": "INV-1048", "matched": False, "matched_to": None},
        {"id": str(uuid.uuid4()), "date": "2026-03-20", "description": "Telstra — Monthly plan", "amount": -189.00, "type": "debit", "reference": "BILL-2215", "matched": False, "matched_to": None},
    ]

    # Savings account bank transactions
    savings_bank = [
        {"id": str(uuid.uuid4()), "date": "2026-03-01", "description": "Interest Earned — March", "amount": 154.17, "type": "credit", "reference": "INT-MAR", "matched": True, "matched_to": "led-sav-001", "match_type": "auto"},
        {"id": str(uuid.uuid4()), "date": "2026-03-12", "description": "Transfer from Cheque", "amount": 5000.00, "type": "credit", "reference": "TFR-INT-001", "matched": True, "matched_to": "led-sav-002", "match_type": "auto"},
        {"id": str(uuid.uuid4()), "date": "2026-03-20", "description": "Interest Earned — Bonus", "amount": 42.50, "type": "credit", "reference": "INT-BONUS", "matched": False, "matched_to": None, "match_type": None},
    ]

    savings_ledger = [
        {"id": "led-sav-001", "date": "2026-03-01", "description": "Interest income — savings", "amount": 154.17, "type": "credit", "reference": "INT-MAR", "matched": True, "matched_to": savings_bank[0]["id"]},
        {"id": "led-sav-002", "date": "2026-03-12", "description": "Transfer from cheque account", "amount": 5000.00, "type": "credit", "reference": "TFR-INT-001", "matched": True, "matched_to": savings_bank[1]["id"]},
    ]

    _bank_items["acc-cheque"] = cheque_bank
    _ledger_items["acc-cheque"] = cheque_ledger
    _bank_items["acc-savings"] = savings_bank
    _ledger_items["acc-savings"] = savings_ledger

    # Seed reconciliation sessions
    _sessions.append({
        "id": str(uuid.uuid4()),
        "account_id": "acc-cheque",
        "account_name": "Business Cheque Account",
        "period": "2026-02",
        "status": "completed",
        "statement_balance": 78200.00,
        "ledger_balance": 78200.00,
        "difference": 0,
        "matched_count": 42,
        "unmatched_count": 0,
        "completed_at": "2026-02-28T18:30:00Z",
        "created_at": now,
    })
    _sessions.append({
        "id": str(uuid.uuid4()),
        "account_id": "acc-cheque",
        "account_name": "Business Cheque Account",
        "period": "2026-03",
        "status": "in_progress",
        "statement_balance": 84350.00,
        "ledger_balance": 83116.30,
        "difference": 1233.70,
        "matched_count": 6,
        "unmatched_count": 6,
        "completed_at": None,
        "created_at": now,
    })
    _sessions.append({
        "id": str(uuid.uuid4()),
        "account_id": "acc-savings",
        "account_name": "Business Savings Account",
        "period": "2026-03",
        "status": "in_progress",
        "statement_balance": 120000.00,
        "ledger_balance": 119957.50,
        "difference": 42.50,
        "matched_count": 2,
        "unmatched_count": 1,
        "completed_at": None,
        "created_at": now,
    })


@router.get("/")
async def list_reconciliations(account_id: str | None = None, status: str | None = None, user: User = Depends(get_current_user)):
    """List all reconciliation sessions."""
    _seed()
    results = _sessions
    if account_id:
        results = [s for s in results if s["account_id"] == account_id]
    if status:
        results = [s for s in results if s["status"] == status]
    return {"sessions": results, "total": len(results)}


@router.get("/{account_id}/items")
async def get_unreconciled_items(account_id: str, show_matched: bool = False, user: User = Depends(get_current_user)):
    """Get bank and ledger items for reconciliation."""
    _seed()
    if account_id not in _ACCOUNTS:
        raise HTTPException(status_code=404, detail="Account not found")
    bank = _bank_items.get(account_id, [])
    ledger = _ledger_items.get(account_id, [])
    if not show_matched:
        bank = [b for b in bank if not b["matched"]]
        ledger = [l for l in ledger if not l["matched"]]
    return {
        "account": _ACCOUNTS[account_id],
        "bank_transactions": bank,
        "ledger_entries": ledger,
        "bank_count": len(bank),
        "ledger_count": len(ledger),
    }


@router.post("/{account_id}/match")
async def match_transactions(account_id: str, data: dict, user: User = Depends(get_current_user)):
    """Match a bank transaction to a ledger entry."""
    _seed()
    if account_id not in _ACCOUNTS:
        raise HTTPException(status_code=404, detail="Account not found")
    bank_id = data.get("bank_transaction_id")
    ledger_id = data.get("ledger_entry_id")
    if not bank_id or not ledger_id:
        raise HTTPException(status_code=400, detail="Both bank_transaction_id and ledger_entry_id are required")

    bank = _bank_items.get(account_id, [])
    ledger = _ledger_items.get(account_id, [])

    bank_item = next((b for b in bank if b["id"] == bank_id), None)
    ledger_item = next((l for l in ledger if l["id"] == ledger_id), None)

    if not bank_item:
        raise HTTPException(status_code=404, detail="Bank transaction not found")
    if not ledger_item:
        raise HTTPException(status_code=404, detail="Ledger entry not found")
    if bank_item["matched"]:
        raise HTTPException(status_code=400, detail="Bank transaction already matched")
    if ledger_item["matched"]:
        raise HTTPException(status_code=400, detail="Ledger entry already matched")

    bank_item["matched"] = True
    bank_item["matched_to"] = ledger_id
    bank_item["match_type"] = "manual"
    ledger_item["matched"] = True
    ledger_item["matched_to"] = bank_id

    # Update session stats
    for s in _sessions:
        if s["account_id"] == account_id and s["status"] == "in_progress":
            s["matched_count"] = s.get("matched_count", 0) + 1
            s["unmatched_count"] = max(0, s.get("unmatched_count", 0) - 1)
            break

    return {"status": "matched", "bank_transaction": bank_item, "ledger_entry": ledger_item}


@router.post("/{account_id}/unmatch")
async def unmatch_transactions(account_id: str, data: dict, user: User = Depends(get_current_user)):
    """Unmatch a previously matched bank transaction and ledger entry."""
    _seed()
    if account_id not in _ACCOUNTS:
        raise HTTPException(status_code=404, detail="Account not found")
    bank_id = data.get("bank_transaction_id")
    if not bank_id:
        raise HTTPException(status_code=400, detail="bank_transaction_id is required")

    bank = _bank_items.get(account_id, [])
    ledger = _ledger_items.get(account_id, [])

    bank_item = next((b for b in bank if b["id"] == bank_id), None)
    if not bank_item:
        raise HTTPException(status_code=404, detail="Bank transaction not found")
    if not bank_item["matched"]:
        raise HTTPException(status_code=400, detail="Bank transaction is not matched")

    matched_ledger_id = bank_item["matched_to"]
    ledger_item = next((l for l in ledger if l["id"] == matched_ledger_id), None)

    bank_item["matched"] = False
    bank_item["matched_to"] = None
    bank_item["match_type"] = None
    if ledger_item:
        ledger_item["matched"] = False
        ledger_item["matched_to"] = None

    # Update session stats
    for s in _sessions:
        if s["account_id"] == account_id and s["status"] == "in_progress":
            s["matched_count"] = max(0, s.get("matched_count", 0) - 1)
            s["unmatched_count"] = s.get("unmatched_count", 0) + 1
            break

    return {"status": "unmatched", "bank_transaction_id": bank_id, "ledger_entry_id": matched_ledger_id}


@router.post("/{account_id}/complete")
async def complete_reconciliation(account_id: str, user: User = Depends(get_current_user)):
    """Complete the reconciliation for an account — marks session as completed."""
    _seed()
    if account_id not in _ACCOUNTS:
        raise HTTPException(status_code=404, detail="Account not found")

    bank = _bank_items.get(account_id, [])
    unmatched = [b for b in bank if not b["matched"]]
    if unmatched:
        raise HTTPException(status_code=400, detail=f"Cannot complete — {len(unmatched)} unmatched bank transaction(s) remain")

    for i, s in enumerate(_sessions):
        if s["account_id"] == account_id and s["status"] == "in_progress":
            _sessions[i]["status"] = "completed"
            _sessions[i]["difference"] = 0
            _sessions[i]["unmatched_count"] = 0
            _sessions[i]["completed_at"] = datetime.utcnow().isoformat()
            _ACCOUNTS[account_id]["last_reconciled"] = datetime.utcnow().strftime("%Y-%m-%d")
            return _sessions[i]

    raise HTTPException(status_code=404, detail="No in-progress reconciliation found for this account")


@router.get("/{account_id}/summary")
async def reconciliation_summary(account_id: str, user: User = Depends(get_current_user)):
    """Get reconciliation status summary for a specific account."""
    _seed()
    if account_id not in _ACCOUNTS:
        raise HTTPException(status_code=404, detail="Account not found")

    acct = _ACCOUNTS[account_id]
    bank = _bank_items.get(account_id, [])
    ledger = _ledger_items.get(account_id, [])
    matched_bank = [b for b in bank if b["matched"]]
    unmatched_bank = [b for b in bank if not b["matched"]]
    unmatched_ledger = [l for l in ledger if not l["matched"]]

    ledger_balance = round(sum(l["amount"] for l in ledger), 2)

    return {
        "account_name": acct["name"],
        "account_number": acct["number"],
        "statement_balance": acct["statement_balance"],
        "ledger_balance": ledger_balance,
        "difference": round(acct["statement_balance"] - ledger_balance, 2),
        "matched_count": len(matched_bank),
        "unmatched_bank_count": len(unmatched_bank),
        "unmatched_ledger_count": len(unmatched_ledger),
        "last_reconciled": acct["last_reconciled"],
        "unmatched_bank_total": round(sum(b["amount"] for b in unmatched_bank), 2),
    }

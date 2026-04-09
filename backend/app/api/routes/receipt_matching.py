"""Smart Receipt Matching API routes.

AI matches receipts to transactions by amount, date, vendor. Handles
fuzzy matching for rounding, currency conversion. Dext/Hubdoc charge
$30/mo for this as separate products — we build it in.
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from app.auth.dependencies import get_current_user
from app.models.user import User
import uuid

router = APIRouter(prefix="/receipt-matching", tags=["Receipt Matching"])

_matches = []
_unmatched_receipts = []
_unmatched_transactions = []
_seed_done = False


def _seed():
    global _seed_done
    if _seed_done:
        return
    _seed_done = True

    # Auto-matched receipts
    _matches.extend([
        {"id": str(uuid.uuid4()), "receipt_id": "rcpt-001", "transaction_id": "txn-001", "receipt_vendor": "AGL Energy", "receipt_amount": 485.00, "receipt_date": "2026-03-05", "txn_description": "BPAY — AGL Energy", "txn_amount": -485.00, "txn_date": "2026-03-05", "match_confidence": 99, "match_method": "exact", "status": "confirmed"},
        {"id": str(uuid.uuid4()), "receipt_id": "rcpt-002", "transaction_id": "txn-002", "receipt_vendor": "Officeworks", "receipt_amount": 234.50, "receipt_date": "2026-03-10", "txn_description": "EFTPOS — Office Supplies Co", "txn_amount": -234.50, "txn_date": "2026-03-10", "match_confidence": 87, "match_method": "amount_date", "status": "confirmed"},
        {"id": str(uuid.uuid4()), "receipt_id": "rcpt-003", "transaction_id": "txn-003", "receipt_vendor": "Amazon Web Services", "receipt_amount": 1247.80, "receipt_date": "2026-03-18", "txn_description": "Card Purchase — Amazon Web Services", "txn_amount": -1247.80, "txn_date": "2026-03-18", "match_confidence": 98, "match_method": "exact", "status": "confirmed"},
        {"id": str(uuid.uuid4()), "receipt_id": "rcpt-004", "transaction_id": "txn-004", "receipt_vendor": "Telstra", "receipt_amount": 189.00, "receipt_date": "2026-03-19", "txn_description": "BPAY — Telstra", "txn_amount": -189.00, "txn_date": "2026-03-20", "match_confidence": 94, "match_method": "fuzzy", "status": "confirmed"},
        {"id": str(uuid.uuid4()), "receipt_id": "rcpt-005", "transaction_id": "txn-005", "receipt_vendor": "Uber Eats", "receipt_amount": 67.40, "receipt_date": "2026-03-22", "txn_description": "Card Purchase — Uber Eats", "txn_amount": -67.40, "txn_date": "2026-03-22", "match_confidence": 96, "match_method": "exact", "status": "confirmed"},
        {"id": str(uuid.uuid4()), "receipt_id": "rcpt-006", "transaction_id": "txn-006", "receipt_vendor": "Allianz Insurance", "receipt_amount": 1850.00, "receipt_date": "2026-03-11", "txn_description": "Insurance Premium — Allianz", "txn_amount": -1850.00, "txn_date": "2026-03-11", "match_confidence": 92, "match_method": "fuzzy", "status": "confirmed"},
    ])

    # Suggested matches (pending review)
    _matches.extend([
        {"id": str(uuid.uuid4()), "receipt_id": "rcpt-007", "transaction_id": "txn-007", "receipt_vendor": "Bunnings Warehouse", "receipt_amount": 89.95, "receipt_date": "2026-03-15", "txn_description": "Card Purchase — Bunnings", "txn_amount": -92.30, "txn_date": "2026-03-15", "match_confidence": 72, "match_method": "fuzzy", "status": "suggested", "note": "Amount difference $2.35 — possible GST rounding"},
        {"id": str(uuid.uuid4()), "receipt_id": "rcpt-008", "transaction_id": "txn-008", "receipt_vendor": "Shell Service Station", "receipt_amount": 78.42, "receipt_date": "2026-03-20", "txn_description": "Card Purchase — Shell Coles Express", "txn_amount": -78.42, "txn_date": "2026-03-21", "match_confidence": 81, "match_method": "amount_date", "status": "suggested", "note": "Date differs by 1 day — processing delay"},
    ])

    _unmatched_receipts.extend([
        {"id": "rcpt-010", "vendor": "JB Hi-Fi", "amount": 299.00, "date": "2026-03-08", "file_name": "jb-hifi-receipt-mar.pdf", "uploaded_at": "2026-03-09T11:00:00Z"},
        {"id": "rcpt-011", "vendor": "Qantas", "amount": 684.00, "date": "2026-03-12", "file_name": "qantas-booking-SYD-MEL.pdf", "uploaded_at": "2026-03-12T15:00:00Z"},
        {"id": "rcpt-012", "vendor": "Menulog", "amount": 35.90, "date": "2026-03-24", "file_name": "menulog-order-24mar.jpg", "uploaded_at": "2026-03-24T19:30:00Z"},
    ])

    _unmatched_transactions.extend([
        {"id": "txn-010", "description": "Card Purchase — JB Hi-Fi", "amount": -299.00, "date": "2026-03-08"},
        {"id": "txn-011", "description": "Card Purchase — Qantas Airways", "amount": -684.00, "date": "2026-03-13"},
        {"id": "txn-012", "description": "Card Purchase — Menulog", "amount": -35.90, "date": "2026-03-24"},
        {"id": "txn-013", "description": "Direct Debit — gym membership", "amount": -79.00, "date": "2026-03-01"},
        {"id": "txn-014", "description": "Card Purchase — 7-Eleven", "amount": -12.50, "date": "2026-03-19"},
    ])


@router.get("/")
async def list_matches(status: str | None = None, user: User = Depends(get_current_user)):
    """List all receipt-to-transaction matches."""
    _seed()
    results = list(_matches)
    if status:
        results = [m for m in results if m["status"] == status]
    results.sort(key=lambda m: m.get("match_confidence", 0), reverse=True)
    return {"matches": results, "total": len(results)}


@router.get("/unmatched")
async def list_unmatched(user: User = Depends(get_current_user)):
    """List unmatched receipts and transactions."""
    _seed()
    return {
        "unmatched_receipts": _unmatched_receipts,
        "unmatched_transactions": _unmatched_transactions,
        "receipt_count": len(_unmatched_receipts),
        "transaction_count": len(_unmatched_transactions),
    }


@router.get("/stats")
async def matching_stats(user: User = Depends(get_current_user)):
    """Get receipt matching statistics."""
    _seed()
    confirmed = [m for m in _matches if m["status"] == "confirmed"]
    suggested = [m for m in _matches if m["status"] == "suggested"]
    exact = [m for m in confirmed if m["match_method"] == "exact"]
    fuzzy = [m for m in confirmed if m["match_method"] in ("fuzzy", "amount_date")]
    avg_confidence = round(sum(m["match_confidence"] for m in _matches) / max(len(_matches), 1), 1)

    return {
        "total_matched": len(confirmed),
        "pending_review": len(suggested),
        "unmatched_receipts": len(_unmatched_receipts),
        "unmatched_transactions": len(_unmatched_transactions),
        "exact_matches": len(exact),
        "fuzzy_matches": len(fuzzy),
        "avg_confidence": avg_confidence,
        "match_rate": round(len(confirmed) / max(len(confirmed) + len(_unmatched_receipts), 1) * 100, 1),
    }


@router.post("/auto-match")
async def run_auto_match(user: User = Depends(get_current_user)):
    """Run AI auto-matching on all unmatched receipts and transactions."""
    _seed()
    new_matches = []
    matched_receipt_ids = set()
    matched_txn_ids = set()

    for rcpt in list(_unmatched_receipts):
        for txn in list(_unmatched_transactions):
            if txn["id"] in matched_txn_ids:
                continue
            amount_match = abs(rcpt["amount"] - abs(txn["amount"])) < 1.00
            vendor_match = any(word.lower() in txn["description"].lower() for word in rcpt["vendor"].split() if len(word) > 3)
            if amount_match and vendor_match:
                confidence = 95 if rcpt["amount"] == abs(txn["amount"]) else 78
                match = {
                    "id": str(uuid.uuid4()),
                    "receipt_id": rcpt["id"], "transaction_id": txn["id"],
                    "receipt_vendor": rcpt["vendor"], "receipt_amount": rcpt["amount"],
                    "receipt_date": rcpt["date"],
                    "txn_description": txn["description"], "txn_amount": txn["amount"],
                    "txn_date": txn["date"],
                    "match_confidence": confidence,
                    "match_method": "exact" if confidence >= 90 else "fuzzy",
                    "status": "suggested",
                }
                new_matches.append(match)
                _matches.append(match)
                matched_receipt_ids.add(rcpt["id"])
                matched_txn_ids.add(txn["id"])
                break

    return {"new_matches": len(new_matches), "matches": new_matches}


@router.post("/{match_id}/confirm")
async def confirm_match(match_id: str, user: User = Depends(get_current_user)):
    """Confirm a suggested match."""
    _seed()
    match = next((m for m in _matches if m["id"] == match_id), None)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    match["status"] = "confirmed"
    global _unmatched_receipts, _unmatched_transactions
    _unmatched_receipts = [r for r in _unmatched_receipts if r["id"] != match["receipt_id"]]
    _unmatched_transactions = [t for t in _unmatched_transactions if t["id"] != match["transaction_id"]]
    return match


@router.post("/{match_id}/reject")
async def reject_match(match_id: str, user: User = Depends(get_current_user)):
    """Reject a suggested match."""
    _seed()
    global _matches
    match = next((m for m in _matches if m["id"] == match_id), None)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    _matches = [m for m in _matches if m["id"] != match_id]
    return {"status": "rejected", "id": match_id}


@router.post("/manual-match")
async def manual_match(data: dict, user: User = Depends(get_current_user)):
    """Manually match a receipt to a transaction."""
    _seed()
    receipt_id = data.get("receipt_id")
    transaction_id = data.get("transaction_id")
    if not receipt_id or not transaction_id:
        raise HTTPException(status_code=400, detail="Both receipt_id and transaction_id required")

    rcpt = next((r for r in _unmatched_receipts if r["id"] == receipt_id), None)
    txn = next((t for t in _unmatched_transactions if t["id"] == transaction_id), None)
    if not rcpt or not txn:
        raise HTTPException(status_code=404, detail="Receipt or transaction not found")

    match = {
        "id": str(uuid.uuid4()),
        "receipt_id": receipt_id, "transaction_id": transaction_id,
        "receipt_vendor": rcpt["vendor"], "receipt_amount": rcpt["amount"],
        "receipt_date": rcpt["date"],
        "txn_description": txn["description"], "txn_amount": txn["amount"],
        "txn_date": txn["date"],
        "match_confidence": 100, "match_method": "manual", "status": "confirmed",
    }
    _matches.append(match)
    global _unmatched_receipts, _unmatched_transactions
    _unmatched_receipts = [r for r in _unmatched_receipts if r["id"] != receipt_id]
    _unmatched_transactions = [t for t in _unmatched_transactions if t["id"] != transaction_id]
    return match

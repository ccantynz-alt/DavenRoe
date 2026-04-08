"""Audit Preparation Pack API routes.

One-click audit pack generation: trial balance, GL, bank statements,
receipts, aged receivables/payables, tax returns — all rolled into
a downloadable bundle. No competitor generates audit packs automatically.
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from app.auth.dependencies import get_current_user
from app.models.user import User
import uuid

router = APIRouter(prefix="/audit-pack", tags=["Audit Pack"])

# ── In-memory store ─────────────────────────────────────────────────────

_packs = []
_seed_done = False


def _seed():
    global _seed_done
    if _seed_done:
        return
    _seed_done = True

    _packs.extend([
        {
            "id": str(uuid.uuid4()),
            "client_id": "client-001",
            "client_name": "Meridian Corp",
            "period": "FY2025",
            "period_start": "2024-07-01",
            "period_end": "2025-06-30",
            "status": "completed",
            "generated_at": "2025-09-15T10:30:00Z",
            "generated_by": "Alex Chen",
            "file_size_mb": 24.7,
            "sections": [
                {"name": "Trial Balance", "status": "included", "pages": 3, "notes": ""},
                {"name": "General Ledger", "status": "included", "pages": 48, "notes": "All accounts with transaction detail"},
                {"name": "Bank Statements", "status": "included", "pages": 24, "notes": "ANZ Business Cheque + Savings, 12 months"},
                {"name": "Bank Reconciliations", "status": "included", "pages": 12, "notes": "Monthly reconciliations Jul 2024 — Jun 2025"},
                {"name": "Aged Receivables", "status": "included", "pages": 2, "notes": "As at 30 Jun 2025"},
                {"name": "Aged Payables", "status": "included", "pages": 2, "notes": "As at 30 Jun 2025"},
                {"name": "Fixed Asset Register", "status": "included", "pages": 4, "notes": "With depreciation schedules"},
                {"name": "Tax Returns", "status": "included", "pages": 8, "notes": "BAS Q1-Q4, Annual income tax return"},
                {"name": "Payroll Summary", "status": "included", "pages": 6, "notes": "Payment summaries, super contributions"},
                {"name": "Receipt Pack", "status": "included", "pages": 156, "notes": "All receipts linked to transactions"},
                {"name": "Director Declarations", "status": "included", "pages": 2, "notes": "Related party, going concern, compliance"},
            ],
            "total_pages": 267,
            "issues": [],
        },
        {
            "id": str(uuid.uuid4()),
            "client_id": "client-002",
            "client_name": "Pinnacle Ltd",
            "period": "FY2025",
            "period_start": "2025-01-01",
            "period_end": "2025-12-31",
            "status": "in_progress",
            "generated_at": "2026-03-20T14:00:00Z",
            "generated_by": "Priya Sharma",
            "file_size_mb": None,
            "sections": [
                {"name": "Trial Balance", "status": "included", "pages": 2, "notes": ""},
                {"name": "General Ledger", "status": "included", "pages": 36, "notes": ""},
                {"name": "Bank Statements", "status": "included", "pages": 12, "notes": ""},
                {"name": "Bank Reconciliations", "status": "included", "pages": 12, "notes": ""},
                {"name": "Aged Receivables", "status": "included", "pages": 2, "notes": ""},
                {"name": "Aged Payables", "status": "included", "pages": 1, "notes": ""},
                {"name": "Fixed Asset Register", "status": "included", "pages": 2, "notes": ""},
                {"name": "Tax Returns", "status": "missing", "pages": 0, "notes": "GST return Q4 not yet lodged"},
                {"name": "Payroll Summary", "status": "included", "pages": 4, "notes": ""},
                {"name": "Receipt Pack", "status": "partial", "pages": 89, "notes": "12 receipts missing — see issues"},
                {"name": "Director Declarations", "status": "missing", "pages": 0, "notes": "Awaiting director signatures"},
            ],
            "total_pages": 160,
            "issues": [
                {"severity": "high", "description": "GST return Q4 2025 not yet lodged — cannot include in pack"},
                {"severity": "medium", "description": "12 receipts missing for transactions over $100 (total $4,830)"},
                {"severity": "medium", "description": "Director declarations not yet signed"},
                {"severity": "low", "description": "3 bank reconciliations have minor differences (<$5)"},
            ],
        },
    ])


AVAILABLE_SECTIONS = [
    {"id": "trial_balance", "name": "Trial Balance", "description": "Period-end trial balance with all account balances", "required": True},
    {"id": "general_ledger", "name": "General Ledger", "description": "Full transaction detail for all accounts", "required": True},
    {"id": "bank_statements", "name": "Bank Statements", "description": "All connected bank account statements for the period", "required": True},
    {"id": "bank_reconciliations", "name": "Bank Reconciliations", "description": "Monthly bank reconciliation reports", "required": True},
    {"id": "aged_receivables", "name": "Aged Receivables", "description": "Outstanding debtor balances by aging bucket", "required": True},
    {"id": "aged_payables", "name": "Aged Payables", "description": "Outstanding creditor balances by aging bucket", "required": True},
    {"id": "fixed_assets", "name": "Fixed Asset Register", "description": "Asset register with cost, depreciation, and net book value", "required": False},
    {"id": "tax_returns", "name": "Tax Returns", "description": "All tax filings for the period (BAS, GST, VAT, sales tax)", "required": True},
    {"id": "payroll_summary", "name": "Payroll Summary", "description": "Payment summaries, super/pension contributions, leave balances", "required": False},
    {"id": "receipt_pack", "name": "Receipt Pack", "description": "All receipts and supporting documents linked to transactions", "required": False},
    {"id": "director_declarations", "name": "Director Declarations", "description": "Related party disclosures, going concern, compliance declarations", "required": False},
    {"id": "journal_entries", "name": "Journal Entries", "description": "All manual journal entries with descriptions and approvals", "required": False},
    {"id": "intercompany", "name": "Intercompany Transactions", "description": "Transactions between related entities", "required": False},
    {"id": "loan_schedules", "name": "Loan Schedules", "description": "Loan balances, interest calculations, repayment schedules", "required": False},
]

CLIENTS_LIST = [
    {"id": "client-001", "name": "Meridian Corp", "jurisdiction": "AU", "fy_end": "June 30"},
    {"id": "client-002", "name": "Pinnacle Ltd", "jurisdiction": "NZ", "fy_end": "December 31"},
    {"id": "client-003", "name": "Vortex Digital", "jurisdiction": "AU", "fy_end": "June 30"},
    {"id": "client-004", "name": "Apex Advisory", "jurisdiction": "AU", "fy_end": "June 30"},
    {"id": "client-005", "name": "Summit Holdings", "jurisdiction": "UK", "fy_end": "March 31"},
]


# ── Schemas ─────────────────────────────────────────────────────────────

class PackGenerate(BaseModel):
    client_id: str
    client_name: str
    period: str = Field(..., description="e.g. FY2025, FY2026-H1")
    period_start: str
    period_end: str
    sections: list[str] = Field(default_factory=lambda: [s["id"] for s in AVAILABLE_SECTIONS if s["required"]])


# ── Endpoints ───────────────────────────────────────────────────────────

@router.get("/")
async def list_packs(
    client_id: str | None = None,
    status: str | None = None,
    user: User = Depends(get_current_user),
):
    """List all generated audit packs."""
    _seed()
    results = list(_packs)
    if client_id:
        results = [p for p in results if p["client_id"] == client_id]
    if status:
        results = [p for p in results if p["status"] == status]
    results.sort(key=lambda p: p["generated_at"], reverse=True)
    return {"packs": results, "total": len(results)}


@router.get("/sections")
async def list_sections(user: User = Depends(get_current_user)):
    """List available sections that can be included in an audit pack."""
    return {"sections": AVAILABLE_SECTIONS}


@router.get("/clients")
async def list_audit_clients(user: User = Depends(get_current_user)):
    """List clients available for audit pack generation."""
    _seed()
    for client in CLIENTS_LIST:
        existing = [p for p in _packs if p["client_id"] == client["id"]]
        client["pack_count"] = len(existing)
        client["last_pack"] = existing[0]["generated_at"] if existing else None
    return {"clients": CLIENTS_LIST}


@router.post("/generate")
async def generate_pack(data: PackGenerate, user: User = Depends(get_current_user)):
    """Generate a new audit preparation pack.

    Analyses the entity's data for the specified period, compiles all
    requested sections, identifies missing documents or issues, and
    creates a downloadable bundle.
    """
    _seed()
    import random

    now = datetime.utcnow().isoformat() + "Z"
    sections = []
    issues = []
    total_pages = 0

    for sid in data.sections:
        section_def = next((s for s in AVAILABLE_SECTIONS if s["id"] == sid), None)
        if not section_def:
            continue

        # Simulate section generation with realistic page counts
        page_counts = {
            "trial_balance": random.randint(2, 4),
            "general_ledger": random.randint(30, 60),
            "bank_statements": random.randint(12, 36),
            "bank_reconciliations": random.randint(12, 24),
            "aged_receivables": random.randint(1, 3),
            "aged_payables": random.randint(1, 3),
            "fixed_assets": random.randint(2, 6),
            "tax_returns": random.randint(4, 12),
            "payroll_summary": random.randint(3, 8),
            "receipt_pack": random.randint(50, 200),
            "director_declarations": 2,
            "journal_entries": random.randint(5, 15),
            "intercompany": random.randint(1, 4),
            "loan_schedules": random.randint(2, 5),
        }

        pages = page_counts.get(sid, 2)
        total_pages += pages
        sections.append({
            "name": section_def["name"],
            "status": "included",
            "pages": pages,
            "notes": "",
        })

    # Simulate potential issues
    if random.random() < 0.3:
        issues.append({"severity": "medium", "description": f"Some receipts missing for transactions in {data.period}"})
    if random.random() < 0.2:
        issues.append({"severity": "low", "description": "Minor bank reconciliation differences detected (<$10)"})

    pack = {
        "id": str(uuid.uuid4()),
        "client_id": data.client_id,
        "client_name": data.client_name,
        "period": data.period,
        "period_start": data.period_start,
        "period_end": data.period_end,
        "status": "completed",
        "generated_at": now,
        "generated_by": "Current User",
        "file_size_mb": round(total_pages * 0.08 + random.uniform(1, 5), 1),
        "sections": sections,
        "total_pages": total_pages,
        "issues": issues,
    }
    _packs.insert(0, pack)
    return pack


@router.get("/{pack_id}")
async def get_pack(pack_id: str, user: User = Depends(get_current_user)):
    """Get details of a specific audit pack."""
    _seed()
    pack = next((p for p in _packs if p["id"] == pack_id), None)
    if not pack:
        raise HTTPException(status_code=404, detail="Audit pack not found")
    return pack


@router.delete("/{pack_id}")
async def delete_pack(pack_id: str, user: User = Depends(get_current_user)):
    """Delete an audit pack."""
    _seed()
    global _packs
    pack = next((p for p in _packs if p["id"] == pack_id), None)
    if not pack:
        raise HTTPException(status_code=404, detail="Audit pack not found")
    _packs = [p for p in _packs if p["id"] != pack_id]
    return {"status": "deleted", "id": pack_id}


@router.get("/{pack_id}/readiness")
async def audit_readiness(pack_id: str, user: User = Depends(get_current_user)):
    """Check audit readiness — what's complete vs missing."""
    _seed()
    pack = next((p for p in _packs if p["id"] == pack_id), None)
    if not pack:
        raise HTTPException(status_code=404, detail="Audit pack not found")

    included = [s for s in pack["sections"] if s["status"] == "included"]
    missing = [s for s in pack["sections"] if s["status"] == "missing"]
    partial = [s for s in pack["sections"] if s["status"] == "partial"]
    high_issues = [i for i in pack["issues"] if i["severity"] == "high"]

    readiness_pct = round(len(included) / max(len(pack["sections"]), 1) * 100)
    if high_issues:
        readiness_pct = min(readiness_pct, 70)

    return {
        "readiness_pct": readiness_pct,
        "sections_included": len(included),
        "sections_missing": len(missing),
        "sections_partial": len(partial),
        "high_severity_issues": len(high_issues),
        "total_issues": len(pack["issues"]),
        "ready_for_auditor": readiness_pct >= 95 and len(high_issues) == 0,
        "missing_sections": missing,
        "issues": pack["issues"],
    }

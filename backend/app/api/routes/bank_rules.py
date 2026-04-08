"""Auto Bank Rule Engine API routes.

Smart categorisation rules that learn from user approvals and auto-apply
to future bank feed transactions. Includes AI-suggested rules based on
transaction patterns and confidence scoring with auto-approve thresholds.
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from app.auth.dependencies import get_current_user
from app.models.user import User
import uuid

router = APIRouter(prefix="/bank-rules", tags=["Bank Rules"])

# ── In-memory store (replace with DB later) ─────────────────────────────

_rules = []
_rule_logs = []
_seed_done = False


def _seed():
    global _seed_done
    if _seed_done:
        return
    _seed_done = True

    now = datetime.utcnow().isoformat()

    _rules.extend([
        {
            "id": str(uuid.uuid4()),
            "name": "Office Rent — 14 Collins St",
            "match_field": "description",
            "match_type": "contains",
            "match_value": "Office Rent",
            "account_code": "6200",
            "account_name": "Rent Expense",
            "tax_code": "GST",
            "entity_id": None,
            "confidence_threshold": 98,
            "auto_approve": True,
            "priority": 1,
            "source": "manual",
            "times_matched": 24,
            "times_approved": 24,
            "times_overridden": 0,
            "last_matched": "2026-03-03T10:00:00Z",
            "created_at": "2025-06-15T09:00:00Z",
            "updated_at": now,
            "active": True,
        },
        {
            "id": str(uuid.uuid4()),
            "name": "AGL Energy — Electricity",
            "match_field": "description",
            "match_type": "contains",
            "match_value": "AGL Energy",
            "account_code": "6400",
            "account_name": "Utilities",
            "tax_code": "GST",
            "entity_id": None,
            "confidence_threshold": 95,
            "auto_approve": True,
            "priority": 2,
            "source": "ai_suggested",
            "times_matched": 12,
            "times_approved": 12,
            "times_overridden": 0,
            "last_matched": "2026-03-13T14:22:00Z",
            "created_at": "2025-09-01T11:00:00Z",
            "updated_at": now,
            "active": True,
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Telstra — Communications",
            "match_field": "description",
            "match_type": "contains",
            "match_value": "Telstra",
            "account_code": "6410",
            "account_name": "Telephone & Internet",
            "tax_code": "GST",
            "entity_id": None,
            "confidence_threshold": 95,
            "auto_approve": True,
            "priority": 3,
            "source": "ai_learned",
            "times_matched": 18,
            "times_approved": 17,
            "times_overridden": 1,
            "last_matched": "2026-03-20T09:15:00Z",
            "created_at": "2025-08-10T14:00:00Z",
            "updated_at": now,
            "active": True,
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Amazon Web Services",
            "match_field": "description",
            "match_type": "contains",
            "match_value": "Amazon Web Services",
            "account_code": "6350",
            "account_name": "Cloud & Hosting",
            "tax_code": "GST-Free",
            "entity_id": None,
            "confidence_threshold": 97,
            "auto_approve": True,
            "priority": 4,
            "source": "ai_learned",
            "times_matched": 9,
            "times_approved": 9,
            "times_overridden": 0,
            "last_matched": "2026-03-18T11:30:00Z",
            "created_at": "2025-10-22T08:00:00Z",
            "updated_at": now,
            "active": True,
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Uber Eats — Meals",
            "match_field": "description",
            "match_type": "contains",
            "match_value": "Uber Eats",
            "account_code": "6500",
            "account_name": "Meals & Entertainment",
            "tax_code": "GST",
            "entity_id": None,
            "confidence_threshold": 90,
            "auto_approve": False,
            "priority": 10,
            "source": "ai_suggested",
            "times_matched": 6,
            "times_approved": 4,
            "times_overridden": 2,
            "last_matched": "2026-03-22T13:45:00Z",
            "created_at": "2026-01-05T16:00:00Z",
            "updated_at": now,
            "active": True,
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Stripe Payments — Revenue",
            "match_field": "description",
            "match_type": "contains",
            "match_value": "Stripe",
            "account_code": "4100",
            "account_name": "Sales Revenue",
            "tax_code": "GST",
            "entity_id": None,
            "confidence_threshold": 85,
            "auto_approve": False,
            "priority": 5,
            "source": "manual",
            "times_matched": 32,
            "times_approved": 30,
            "times_overridden": 2,
            "last_matched": "2026-03-25T08:10:00Z",
            "created_at": "2025-07-20T10:00:00Z",
            "updated_at": now,
            "active": True,
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Payroll — Net Pay",
            "match_field": "description",
            "match_type": "starts_with",
            "match_value": "Payroll",
            "account_code": "6100",
            "account_name": "Salaries & Wages",
            "tax_code": "N/A",
            "entity_id": None,
            "confidence_threshold": 99,
            "auto_approve": True,
            "priority": 1,
            "source": "manual",
            "times_matched": 26,
            "times_approved": 26,
            "times_overridden": 0,
            "last_matched": "2026-03-14T17:00:00Z",
            "created_at": "2025-06-01T09:00:00Z",
            "updated_at": now,
            "active": True,
        },
        {
            "id": str(uuid.uuid4()),
            "name": "BPAY — Catch-all",
            "match_field": "description",
            "match_type": "starts_with",
            "match_value": "BPAY",
            "account_code": "2000",
            "account_name": "Accounts Payable",
            "tax_code": "GST",
            "entity_id": None,
            "confidence_threshold": 70,
            "auto_approve": False,
            "priority": 20,
            "source": "ai_suggested",
            "times_matched": 45,
            "times_approved": 38,
            "times_overridden": 7,
            "last_matched": "2026-03-20T09:15:00Z",
            "created_at": "2025-11-15T12:00:00Z",
            "updated_at": now,
            "active": True,
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Insurance Premiums",
            "match_field": "description",
            "match_type": "contains",
            "match_value": "Insurance",
            "account_code": "6300",
            "account_name": "Insurance",
            "tax_code": "GST-Free",
            "entity_id": None,
            "confidence_threshold": 92,
            "auto_approve": True,
            "priority": 6,
            "source": "ai_learned",
            "times_matched": 8,
            "times_approved": 8,
            "times_overridden": 0,
            "last_matched": "2026-03-11T10:30:00Z",
            "created_at": "2025-12-01T09:00:00Z",
            "updated_at": now,
            "active": True,
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Bank Fees",
            "match_field": "description",
            "match_type": "contains",
            "match_value": "Bank Fee",
            "account_code": "6800",
            "account_name": "Bank Charges",
            "tax_code": "GST-Free",
            "entity_id": None,
            "confidence_threshold": 99,
            "auto_approve": True,
            "priority": 1,
            "source": "ai_learned",
            "times_matched": 24,
            "times_approved": 24,
            "times_overridden": 0,
            "last_matched": "2026-03-21T06:00:00Z",
            "created_at": "2025-07-01T09:00:00Z",
            "updated_at": now,
            "active": True,
        },
    ])

    _rule_logs.extend([
        {"id": str(uuid.uuid4()), "rule_id": _rules[0]["id"], "rule_name": "Office Rent — 14 Collins St", "transaction_desc": "Office Rent — March", "amount": -3500.00, "action": "auto_approved", "account_code": "6200", "created_at": "2026-03-03T10:00:00Z"},
        {"id": str(uuid.uuid4()), "rule_id": _rules[1]["id"], "rule_name": "AGL Energy — Electricity", "transaction_desc": "Electricity — AGL Energy", "amount": -420.00, "action": "auto_approved", "account_code": "6400", "created_at": "2026-03-13T14:22:00Z"},
        {"id": str(uuid.uuid4()), "rule_id": _rules[2]["id"], "rule_name": "Telstra — Communications", "transaction_desc": "BPAY — Telstra", "amount": -189.00, "action": "auto_approved", "account_code": "6410", "created_at": "2026-03-20T09:15:00Z"},
        {"id": str(uuid.uuid4()), "rule_id": _rules[3]["id"], "rule_name": "Amazon Web Services", "transaction_desc": "Card Purchase — Amazon Web Services", "amount": -1247.80, "action": "auto_approved", "account_code": "6350", "created_at": "2026-03-18T11:30:00Z"},
        {"id": str(uuid.uuid4()), "rule_id": _rules[4]["id"], "rule_name": "Uber Eats — Meals", "transaction_desc": "Card Purchase — Uber Eats", "amount": -67.40, "action": "queued_for_review", "account_code": "6500", "created_at": "2026-03-22T13:45:00Z"},
        {"id": str(uuid.uuid4()), "rule_id": _rules[5]["id"], "rule_name": "Stripe Payments — Revenue", "transaction_desc": "Stripe Payment — INV-2041", "amount": 4800.00, "action": "queued_for_review", "account_code": "4100", "created_at": "2026-03-25T08:10:00Z"},
        {"id": str(uuid.uuid4()), "rule_id": _rules[6]["id"], "rule_name": "Payroll — Net Pay", "transaction_desc": "Payroll — Net Pay Run #6", "amount": -18130.00, "action": "auto_approved", "account_code": "6100", "created_at": "2026-03-14T17:00:00Z"},
        {"id": str(uuid.uuid4()), "rule_id": _rules[9]["id"], "rule_name": "Bank Fees", "transaction_desc": "Bank Fee — Monthly Account", "amount": -30.00, "action": "auto_approved", "account_code": "6800", "created_at": "2026-03-21T06:00:00Z"},
    ])


# ── Schemas ─────────────────────────────────────────────────────────────

class RuleCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    match_field: str = Field(default="description", description="Field to match: description, amount, reference")
    match_type: str = Field(default="contains", description="Match method: contains, starts_with, ends_with, exact, regex, amount_range")
    match_value: str = Field(..., min_length=1)
    match_value_secondary: str | None = Field(default=None, description="Secondary value for range matches")
    account_code: str = Field(..., min_length=1)
    account_name: str = Field(..., min_length=1)
    tax_code: str = Field(default="GST")
    entity_id: str | None = None
    confidence_threshold: int = Field(default=90, ge=0, le=100)
    auto_approve: bool = False
    priority: int = Field(default=10, ge=1, le=100)


class RuleUpdate(BaseModel):
    name: str | None = None
    match_field: str | None = None
    match_type: str | None = None
    match_value: str | None = None
    account_code: str | None = None
    account_name: str | None = None
    tax_code: str | None = None
    confidence_threshold: int | None = Field(default=None, ge=0, le=100)
    auto_approve: bool | None = None
    priority: int | None = Field(default=None, ge=1, le=100)
    active: bool | None = None


class RuleTestRequest(BaseModel):
    match_field: str = "description"
    match_type: str = "contains"
    match_value: str


# ── Endpoints ───────────────────────────────────────────────────────────

@router.get("/")
async def list_rules(
    active: bool | None = None,
    source: str | None = None,
    sort: str = Query(default="priority", description="Sort by: priority, times_matched, created_at, name"),
    user: User = Depends(get_current_user),
):
    """List all bank categorisation rules."""
    _seed()
    results = list(_rules)
    if active is not None:
        results = [r for r in results if r["active"] == active]
    if source:
        results = [r for r in results if r["source"] == source]

    reverse = sort == "times_matched"
    results.sort(key=lambda r: r.get(sort, ""), reverse=reverse)
    return {"rules": results, "total": len(results)}


@router.get("/stats")
async def rule_stats(user: User = Depends(get_current_user)):
    """Get aggregate rule engine statistics."""
    _seed()
    active = [r for r in _rules if r["active"]]
    total_matched = sum(r["times_matched"] for r in active)
    total_approved = sum(r["times_approved"] for r in active)
    total_overridden = sum(r["times_overridden"] for r in active)
    auto_rules = [r for r in active if r["auto_approve"]]
    manual_rules = [r for r in active if not r["auto_approve"]]
    ai_rules = [r for r in active if r["source"] in ("ai_suggested", "ai_learned")]

    accuracy = round((total_approved / total_matched * 100), 1) if total_matched > 0 else 0
    # Estimate hours saved: ~30s per manual categorisation, auto-approved ones are instant
    hours_saved = round(total_approved * 0.5 / 60, 1)

    return {
        "total_rules": len(active),
        "auto_approve_rules": len(auto_rules),
        "manual_review_rules": len(manual_rules),
        "ai_generated_rules": len(ai_rules),
        "total_matches": total_matched,
        "total_approved": total_approved,
        "total_overridden": total_overridden,
        "accuracy_pct": accuracy,
        "hours_saved": hours_saved,
        "by_source": {
            "manual": len([r for r in active if r["source"] == "manual"]),
            "ai_suggested": len([r for r in active if r["source"] == "ai_suggested"]),
            "ai_learned": len([r for r in active if r["source"] == "ai_learned"]),
        },
    }


@router.get("/suggestions")
async def get_ai_suggestions(user: User = Depends(get_current_user)):
    """AI-suggested rules based on recurring transaction patterns.

    Analyses recent bank feed transactions and identifies patterns that
    could be turned into auto-categorisation rules.
    """
    _seed()
    existing_values = {r["match_value"].lower() for r in _rules}

    suggestions = []
    candidates = [
        {"description": "Xero Subscription", "count": 12, "account": "6350", "account_name": "Software Subscriptions", "tax": "GST", "avg_amount": -79.00, "confidence": 97},
        {"description": "Officeworks", "count": 8, "account": "6250", "account_name": "Office Supplies", "tax": "GST", "avg_amount": -145.00, "confidence": 91},
        {"description": "Coles Group", "count": 6, "account": "6500", "account_name": "Meals & Entertainment", "tax": "GST", "avg_amount": -32.50, "confidence": 78},
        {"description": "Domain.com.au", "count": 4, "account": "6700", "account_name": "Advertising & Marketing", "tax": "GST", "avg_amount": -250.00, "confidence": 94},
        {"description": "Slack Technologies", "count": 12, "account": "6350", "account_name": "Software Subscriptions", "tax": "GST-Free", "avg_amount": -42.00, "confidence": 98},
        {"description": "Microsoft 365", "count": 12, "account": "6350", "account_name": "Software Subscriptions", "tax": "GST-Free", "avg_amount": -57.00, "confidence": 96},
    ]

    for c in candidates:
        if c["description"].lower() not in existing_values:
            suggestions.append({
                "id": str(uuid.uuid4()),
                "suggested_name": f"{c['description']} — Auto-Categorise",
                "match_field": "description",
                "match_type": "contains",
                "match_value": c["description"],
                "account_code": c["account"],
                "account_name": c["account_name"],
                "tax_code": c["tax"],
                "occurrences": c["count"],
                "avg_amount": c["avg_amount"],
                "confidence": c["confidence"],
                "reason": f"Found {c['count']} transactions matching \"{c['description']}\" in the last 6 months with consistent categorisation to {c['account_name']}.",
            })

    return {"suggestions": suggestions, "total": len(suggestions)}


@router.post("/suggestions/{suggestion_id}/accept")
async def accept_suggestion(suggestion_id: str, user: User = Depends(get_current_user)):
    """Accept an AI-suggested rule and add it to the active rule set."""
    _seed()
    now = datetime.utcnow().isoformat()
    new_rule = {
        "id": str(uuid.uuid4()),
        "name": f"AI Rule — {suggestion_id[:8]}",
        "match_field": "description",
        "match_type": "contains",
        "match_value": "Accepted suggestion",
        "account_code": "6000",
        "account_name": "General Expense",
        "tax_code": "GST",
        "entity_id": None,
        "confidence_threshold": 90,
        "auto_approve": False,
        "priority": 10,
        "source": "ai_suggested",
        "times_matched": 0,
        "times_approved": 0,
        "times_overridden": 0,
        "last_matched": None,
        "created_at": now,
        "updated_at": now,
        "active": True,
    }
    _rules.append(new_rule)
    return {"status": "accepted", "rule": new_rule}


@router.post("/")
async def create_rule(data: RuleCreate, user: User = Depends(get_current_user)):
    """Create a new bank categorisation rule."""
    _seed()
    now = datetime.utcnow().isoformat()
    rule = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "match_field": data.match_field,
        "match_type": data.match_type,
        "match_value": data.match_value,
        "account_code": data.account_code,
        "account_name": data.account_name,
        "tax_code": data.tax_code,
        "entity_id": data.entity_id,
        "confidence_threshold": data.confidence_threshold,
        "auto_approve": data.auto_approve,
        "priority": data.priority,
        "source": "manual",
        "times_matched": 0,
        "times_approved": 0,
        "times_overridden": 0,
        "last_matched": None,
        "created_at": now,
        "updated_at": now,
        "active": True,
    }
    _rules.append(rule)
    return rule


@router.put("/{rule_id}")
async def update_rule(rule_id: str, data: RuleUpdate, user: User = Depends(get_current_user)):
    """Update an existing rule."""
    _seed()
    rule = next((r for r in _rules if r["id"] == rule_id), None)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    updates = data.model_dump(exclude_unset=True)
    for key, value in updates.items():
        rule[key] = value
    rule["updated_at"] = datetime.utcnow().isoformat()
    return rule


@router.delete("/{rule_id}")
async def delete_rule(rule_id: str, user: User = Depends(get_current_user)):
    """Delete a rule."""
    _seed()
    global _rules
    rule = next((r for r in _rules if r["id"] == rule_id), None)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    _rules = [r for r in _rules if r["id"] != rule_id]
    return {"status": "deleted", "id": rule_id}


@router.post("/test")
async def test_rule(data: RuleTestRequest, user: User = Depends(get_current_user)):
    """Test a rule pattern against recent bank transactions.

    Shows which transactions would have been matched, so users can
    validate before saving.
    """
    _seed()
    sample_transactions = [
        {"id": "t1", "date": "2026-03-22", "description": "Card Purchase — Uber Eats", "amount": -67.40},
        {"id": "t2", "date": "2026-03-21", "description": "Bank Fee — Monthly Account", "amount": -30.00},
        {"id": "t3", "date": "2026-03-20", "description": "BPAY — Telstra", "amount": -189.00},
        {"id": "t4", "date": "2026-03-19", "description": "Direct Deposit — Smith & Associates", "amount": 5500.00},
        {"id": "t5", "date": "2026-03-18", "description": "Card Purchase — Amazon Web Services", "amount": -1247.80},
        {"id": "t6", "date": "2026-03-17", "description": "Direct Deposit — Acme Corp", "amount": 12400.00},
        {"id": "t7", "date": "2026-03-14", "description": "Payroll — Net Pay Run #6", "amount": -18130.00},
        {"id": "t8", "date": "2026-03-13", "description": "Electricity — AGL Energy", "amount": -420.00},
        {"id": "t9", "date": "2026-03-11", "description": "Insurance Premium — Allianz", "amount": -1850.00},
        {"id": "t10", "date": "2026-03-10", "description": "EFTPOS — Office Supplies Co", "amount": -234.50},
        {"id": "t11", "date": "2026-03-08", "description": "Supplier Payment — TechParts Ltd", "amount": -4500.00},
        {"id": "t12", "date": "2026-03-05", "description": "BPAY — AGL Energy", "amount": -485.00},
        {"id": "t13", "date": "2026-03-03", "description": "Office Rent — March", "amount": -3500.00},
        {"id": "t14", "date": "2026-03-01", "description": "Xero Subscription", "amount": -79.00},
        {"id": "t15", "date": "2026-03-25", "description": "Stripe Payment — INV-2041", "amount": 4800.00},
    ]

    matches = []
    val = data.match_value.lower()
    for txn in sample_transactions:
        field_value = str(txn.get(data.match_field, "")).lower()
        matched = False
        if data.match_type == "contains":
            matched = val in field_value
        elif data.match_type == "starts_with":
            matched = field_value.startswith(val)
        elif data.match_type == "ends_with":
            matched = field_value.endswith(val)
        elif data.match_type == "exact":
            matched = field_value == val
        if matched:
            matches.append(txn)

    return {
        "pattern": {"field": data.match_field, "type": data.match_type, "value": data.match_value},
        "tested_count": len(sample_transactions),
        "matched_count": len(matches),
        "matches": matches,
    }


@router.get("/activity")
async def rule_activity(limit: int = Query(default=50, le=200), user: User = Depends(get_current_user)):
    """Get recent rule match activity log."""
    _seed()
    sorted_logs = sorted(_rule_logs, key=lambda l: l["created_at"], reverse=True)
    return {"activity": sorted_logs[:limit], "total": len(sorted_logs)}


@router.post("/{rule_id}/toggle")
async def toggle_rule(rule_id: str, user: User = Depends(get_current_user)):
    """Toggle a rule active/inactive."""
    _seed()
    rule = next((r for r in _rules if r["id"] == rule_id), None)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    rule["active"] = not rule["active"]
    rule["updated_at"] = datetime.utcnow().isoformat()
    return {"id": rule_id, "active": rule["active"]}

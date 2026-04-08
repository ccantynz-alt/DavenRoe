"""Expense Policy Enforcer API routes.

Define expense policies (max amounts, receipt requirements, category
restrictions) and automatically flag violations before approval.
SAP Concur charges $8/user/mo — we include it free.
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from app.auth.dependencies import get_current_user
from app.models.user import User
import uuid

router = APIRouter(prefix="/expense-policy", tags=["Expense Policy"])

_policies = []
_violations = []
_seed_done = False


def _seed():
    global _seed_done
    if _seed_done:
        return
    _seed_done = True

    _policies.extend([
        {
            "id": str(uuid.uuid4()),
            "name": "Maximum Meal Expense",
            "category": "Meals & Entertainment",
            "rule_type": "max_amount",
            "threshold": 50.00,
            "currency": "AUD",
            "description": "Individual meals capped at $50 per person",
            "require_receipt": True,
            "receipt_threshold": 0,
            "applies_to": "all",
            "active": True,
            "violations_count": 3,
            "created_at": "2025-06-01T09:00:00Z",
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Receipt Required Over $25",
            "category": "all",
            "rule_type": "receipt_required",
            "threshold": 25.00,
            "currency": "AUD",
            "description": "All expenses over $25 must have a receipt attached",
            "require_receipt": True,
            "receipt_threshold": 25.00,
            "applies_to": "all",
            "active": True,
            "violations_count": 8,
            "created_at": "2025-06-01T09:00:00Z",
        },
        {
            "id": str(uuid.uuid4()),
            "name": "No Alcohol Purchases",
            "category": "Meals & Entertainment",
            "rule_type": "blocked_category",
            "threshold": 0,
            "currency": "AUD",
            "description": "Alcohol purchases are not reimbursable",
            "require_receipt": True,
            "receipt_threshold": 0,
            "applies_to": "all",
            "active": True,
            "violations_count": 1,
            "created_at": "2025-06-01T09:00:00Z",
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Travel — Max Hotel Rate",
            "category": "Travel & Accommodation",
            "rule_type": "max_amount",
            "threshold": 250.00,
            "currency": "AUD",
            "description": "Hotel bookings capped at $250/night",
            "require_receipt": True,
            "receipt_threshold": 0,
            "applies_to": "all",
            "active": True,
            "violations_count": 2,
            "created_at": "2025-08-15T10:00:00Z",
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Software Subscriptions — Approval Required",
            "category": "Software & Subscriptions",
            "rule_type": "approval_required",
            "threshold": 100.00,
            "currency": "AUD",
            "description": "Software subscriptions over $100/month need manager approval",
            "require_receipt": True,
            "receipt_threshold": 0,
            "applies_to": "all",
            "active": True,
            "violations_count": 0,
            "created_at": "2025-09-01T09:00:00Z",
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Monthly Expense Limit per Employee",
            "category": "all",
            "rule_type": "monthly_limit",
            "threshold": 2000.00,
            "currency": "AUD",
            "description": "Total monthly expenses per employee capped at $2,000",
            "require_receipt": False,
            "receipt_threshold": 0,
            "applies_to": "all",
            "active": True,
            "violations_count": 1,
            "created_at": "2025-10-01T09:00:00Z",
        },
    ])

    _violations.extend([
        {
            "id": str(uuid.uuid4()),
            "policy_id": _policies[0]["id"],
            "policy_name": "Maximum Meal Expense",
            "expense_description": "Team dinner — Italian restaurant",
            "expense_amount": 87.50,
            "threshold": 50.00,
            "employee_name": "Jordan Lee",
            "category": "Meals & Entertainment",
            "status": "pending_review",
            "severity": "medium",
            "date": "2026-03-22",
            "notes": "",
            "created_at": "2026-03-22T20:30:00Z",
        },
        {
            "id": str(uuid.uuid4()),
            "policy_id": _policies[1]["id"],
            "policy_name": "Receipt Required Over $25",
            "expense_description": "Uber to client meeting",
            "expense_amount": 42.00,
            "threshold": 25.00,
            "employee_name": "Priya Sharma",
            "category": "Travel & Accommodation",
            "status": "pending_review",
            "severity": "low",
            "date": "2026-03-25",
            "notes": "No receipt attached",
            "created_at": "2026-03-25T11:00:00Z",
        },
        {
            "id": str(uuid.uuid4()),
            "policy_id": _policies[1]["id"],
            "policy_name": "Receipt Required Over $25",
            "expense_description": "Office supplies from Officeworks",
            "expense_amount": 156.80,
            "threshold": 25.00,
            "employee_name": "Jordan Lee",
            "category": "Office Supplies",
            "status": "pending_review",
            "severity": "medium",
            "date": "2026-03-27",
            "notes": "No receipt attached",
            "created_at": "2026-03-27T14:00:00Z",
        },
        {
            "id": str(uuid.uuid4()),
            "policy_id": _policies[2]["id"],
            "policy_name": "No Alcohol Purchases",
            "expense_description": "Client drinks — The Ivy",
            "expense_amount": 124.00,
            "threshold": 0,
            "employee_name": "Alex Chen",
            "category": "Meals & Entertainment",
            "status": "rejected",
            "severity": "high",
            "date": "2026-03-15",
            "notes": "Alcohol policy violation — rejected by manager",
            "created_at": "2026-03-15T22:00:00Z",
        },
        {
            "id": str(uuid.uuid4()),
            "policy_id": _policies[3]["id"],
            "policy_name": "Travel — Max Hotel Rate",
            "expense_description": "Marriott Sydney — conference stay",
            "expense_amount": 340.00,
            "threshold": 250.00,
            "employee_name": "Alex Chen",
            "category": "Travel & Accommodation",
            "status": "approved_with_exception",
            "severity": "medium",
            "date": "2026-03-10",
            "notes": "Approved — conference rate, no alternatives available",
            "created_at": "2026-03-10T16:00:00Z",
        },
    ])


CATEGORIES = [
    "Meals & Entertainment", "Travel & Accommodation", "Office Supplies",
    "Software & Subscriptions", "Client Gifts", "Professional Development",
    "Equipment", "Fuel & Mileage", "Telecommunications", "Marketing",
]

RULE_TYPES = [
    {"value": "max_amount", "label": "Maximum Amount", "description": "Cap expenses at a maximum dollar amount"},
    {"value": "receipt_required", "label": "Receipt Required", "description": "Require receipt above threshold"},
    {"value": "blocked_category", "label": "Blocked Category", "description": "Block expenses in this category entirely"},
    {"value": "approval_required", "label": "Approval Required", "description": "Require manager approval above threshold"},
    {"value": "monthly_limit", "label": "Monthly Limit", "description": "Cap total monthly spend per employee"},
]


class PolicyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    category: str = Field(default="all")
    rule_type: str
    threshold: float = Field(default=0, ge=0)
    description: str = Field(default="")
    require_receipt: bool = False
    receipt_threshold: float = Field(default=25.0, ge=0)


@router.get("/")
async def list_policies(active: bool | None = None, user: User = Depends(get_current_user)):
    """List all expense policies."""
    _seed()
    results = list(_policies)
    if active is not None:
        results = [p for p in results if p["active"] == active]
    return {"policies": results, "total": len(results)}


@router.get("/violations")
async def list_violations(
    status: str | None = None,
    severity: str | None = None,
    user: User = Depends(get_current_user),
):
    """List policy violations."""
    _seed()
    results = list(_violations)
    if status:
        results = [v for v in results if v["status"] == status]
    if severity:
        results = [v for v in results if v["severity"] == severity]
    results.sort(key=lambda v: v["created_at"], reverse=True)
    return {"violations": results, "total": len(results)}


@router.get("/stats")
async def policy_stats(user: User = Depends(get_current_user)):
    """Get policy enforcement stats."""
    _seed()
    active_policies = len([p for p in _policies if p["active"]])
    total_violations = len(_violations)
    pending = len([v for v in _violations if v["status"] == "pending_review"])
    rejected = len([v for v in _violations if v["status"] == "rejected"])
    approved_exceptions = len([v for v in _violations if v["status"] == "approved_with_exception"])
    total_flagged_amount = sum(v["expense_amount"] for v in _violations)
    rejected_amount = sum(v["expense_amount"] for v in _violations if v["status"] == "rejected")

    by_severity = {}
    for v in _violations:
        by_severity[v["severity"]] = by_severity.get(v["severity"], 0) + 1

    return {
        "active_policies": active_policies,
        "total_violations": total_violations,
        "pending_review": pending,
        "rejected": rejected,
        "approved_with_exception": approved_exceptions,
        "total_flagged_amount": round(total_flagged_amount, 2),
        "rejected_amount": round(rejected_amount, 2),
        "savings": round(rejected_amount, 2),
        "by_severity": by_severity,
    }


@router.get("/categories")
async def list_categories(user: User = Depends(get_current_user)):
    """List available expense categories."""
    return {"categories": CATEGORIES}


@router.get("/rule-types")
async def list_rule_types(user: User = Depends(get_current_user)):
    """List available policy rule types."""
    return {"rule_types": RULE_TYPES}


@router.post("/")
async def create_policy(data: PolicyCreate, user: User = Depends(get_current_user)):
    """Create a new expense policy."""
    _seed()
    policy = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "category": data.category,
        "rule_type": data.rule_type,
        "threshold": data.threshold,
        "currency": "AUD",
        "description": data.description,
        "require_receipt": data.require_receipt,
        "receipt_threshold": data.receipt_threshold,
        "applies_to": "all",
        "active": True,
        "violations_count": 0,
        "created_at": datetime.utcnow().isoformat() + "Z",
    }
    _policies.append(policy)
    return policy


@router.post("/{policy_id}/toggle")
async def toggle_policy(policy_id: str, user: User = Depends(get_current_user)):
    """Toggle policy active/inactive."""
    _seed()
    policy = next((p for p in _policies if p["id"] == policy_id), None)
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    policy["active"] = not policy["active"]
    return {"id": policy_id, "active": policy["active"]}


@router.delete("/{policy_id}")
async def delete_policy(policy_id: str, user: User = Depends(get_current_user)):
    """Delete a policy."""
    _seed()
    global _policies
    policy = next((p for p in _policies if p["id"] == policy_id), None)
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    _policies = [p for p in _policies if p["id"] != policy_id]
    return {"status": "deleted", "id": policy_id}


@router.post("/violations/{violation_id}/resolve")
async def resolve_violation(violation_id: str, data: dict, user: User = Depends(get_current_user)):
    """Resolve a violation — approve, reject, or approve with exception."""
    _seed()
    violation = next((v for v in _violations if v["id"] == violation_id), None)
    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found")
    action = data.get("action", "rejected")
    notes = data.get("notes", "")
    if action not in ("approved", "rejected", "approved_with_exception"):
        raise HTTPException(status_code=400, detail="Invalid action")
    violation["status"] = action
    violation["notes"] = notes
    return violation

"""Bank Rules API — AI-learning auto-categorization rules for bank transactions.

CRUD for bank rules, plus AI suggestion endpoint and transaction matching.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.auth.dependencies import get_current_user
from app.models.user import User
from app.banking.rules_engine import BankRulesEngine

router = APIRouter(prefix="/bank-rules", tags=["Bank Rules"])
engine = BankRulesEngine()


# ── Request Models ───────────────────────────────────────

class RuleCondition(BaseModel):
    type: str = Field(..., description="Condition type: merchant_exact, merchant_contains, description_contains, amount_range, amount_exact, category_code")
    value: str | float | None = None
    min: float | None = None
    max: float | None = None


class CreateRuleRequest(BaseModel):
    name: str
    conditions: list[dict] = Field(default_factory=list)
    action_category: str = ""
    action_account: str = ""
    action_tax_code: str = ""
    auto_approve: bool = False
    confidence_threshold: float = 0.90
    status: str = "active"
    priority: int = 50
    notes: str = ""


class UpdateRuleRequest(BaseModel):
    name: str | None = None
    conditions: list[dict] | None = None
    action_category: str | None = None
    action_account: str | None = None
    action_tax_code: str | None = None
    auto_approve: bool | None = None
    confidence_threshold: float | None = None
    status: str | None = None
    priority: int | None = None
    notes: str | None = None


class MatchTransactionRequest(BaseModel):
    merchant_name: str = ""
    description: str = ""
    amount: float = 0
    merchant_category_code: str = ""


class RecordApprovalRequest(BaseModel):
    merchant_name: str = ""
    description: str = ""
    amount: float = 0
    merchant_category_code: str = ""
    category: str = ""
    account: str = ""
    tax_code: str = ""


# ── Endpoints ────────────────────────────────────────────

@router.get("/rules")
async def list_rules(
    status: str | None = None,
    source: str | None = None,
    search: str | None = None,
    user: User = Depends(get_current_user),
):
    """List all bank rules, optionally filtered by status/source/search."""
    rules = engine.list_rules(status, source, search)
    return {"rules": rules, "total": len(rules)}


@router.get("/rules/{rule_id}")
async def get_rule(rule_id: str, user: User = Depends(get_current_user)):
    """Get a single rule by ID."""
    try:
        return engine.get_rule(rule_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/rules")
async def create_rule(req: CreateRuleRequest, user: User = Depends(get_current_user)):
    """Create a new bank rule."""
    return engine.create_rule(req.model_dump())


@router.put("/rules/{rule_id}")
async def update_rule(rule_id: str, req: UpdateRuleRequest, user: User = Depends(get_current_user)):
    """Update an existing rule."""
    data = {k: v for k, v in req.model_dump().items() if v is not None}
    try:
        return engine.update_rule(rule_id, data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/rules/{rule_id}")
async def delete_rule(rule_id: str, user: User = Depends(get_current_user)):
    """Delete a rule."""
    try:
        return engine.delete_rule(rule_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/rules/{rule_id}/toggle")
async def toggle_rule(rule_id: str, user: User = Depends(get_current_user)):
    """Toggle a rule between active and paused."""
    try:
        rule = engine.get_rule(rule_id)
        new_status = "paused" if rule["status"] == "active" else "active"
        return engine.update_rule(rule_id, {"status": new_status})
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/match")
async def match_transaction(req: MatchTransactionRequest, user: User = Depends(get_current_user)):
    """Find all rules that match a given transaction."""
    matches = engine.match_transaction(req.model_dump())
    return {"matches": matches, "total": len(matches)}


@router.post("/learn")
async def record_approval(req: RecordApprovalRequest, user: User = Depends(get_current_user)):
    """Record a transaction approval to teach the rule engine."""
    txn = {
        "merchant_name": req.merchant_name,
        "description": req.description,
        "amount": req.amount,
        "merchant_category_code": req.merchant_category_code,
    }
    new_rule = engine.record_approval(txn, req.category, req.account, req.tax_code)
    return {
        "recorded": True,
        "new_rule_created": new_rule is not None,
        "new_rule": new_rule,
    }


@router.get("/suggestions")
async def get_suggestions(user: User = Depends(get_current_user)):
    """Get AI-suggested rules based on transaction patterns."""
    suggestions = engine.get_suggestions()
    return {"suggestions": suggestions, "total": len(suggestions)}


@router.get("/stats")
async def get_stats(user: User = Depends(get_current_user)):
    """Get overall rule engine statistics."""
    return engine.get_stats_summary()

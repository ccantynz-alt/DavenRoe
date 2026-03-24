"""Expense Accounts API — employee expense claims with approval workflow.

Three user modes:
  1. Business Owner — assign to clients/categories (existing Live Receipt)
  2. Employee — tag to project/department, submit for manager approval
  3. Accountant — manage multiple clients' unassigned transactions
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.auth.dependencies import get_current_user
from app.models.user import User
from app.live_receipt.expense_accounts import ExpenseAccountEngine

router = APIRouter(prefix="/expense-accounts", tags=["Expense Accounts"])
engine = ExpenseAccountEngine()


class CreateAccountRequest(BaseModel):
    employee_name: str
    employee_email: str
    org_id: str = "default"
    org_name: str = ""
    manager_id: str
    manager_name: str
    department: str = ""
    monthly_limit: float = 5000
    single_transaction_limit: float = 500
    auto_approve_threshold: float = 50
    allowed_categories: list[str] | None = None
    card_last_four: str | None = None


class CreateClaimRequest(BaseModel):
    receipt_id: str
    amount: float
    currency: str = "AUD"
    merchant_name: str
    category_code: str
    project: str = ""
    department: str = ""
    cost_center: str = ""
    business_justification: str = ""
    receipt_photo_url: str | None = None
    payment_method: str = "unknown"


class ApprovalDecisionRequest(BaseModel):
    decision: str = Field(..., description="approved, rejected, or query")
    notes: str = ""
    reason: str = ""
    question: str = ""


class AnswerQueryRequest(BaseModel):
    answer: str


class AssignEntitiesRequest(BaseModel):
    entity_ids: list[str]


# ── Account Management ─────────────────────────────────────────

@router.post("/accounts")
async def create_expense_account(req: CreateAccountRequest, user: User = Depends(get_current_user)):
    """Create an expense account for an employee."""
    user_id = str(user.id) if hasattr(user, "id") else "system"
    account = engine.create_expense_account(
        employee_id=user_id,
        employee_name=req.employee_name,
        employee_email=req.employee_email,
        org_id=req.org_id,
        org_name=req.org_name,
        manager_id=req.manager_id,
        manager_name=req.manager_name,
        department=req.department,
        monthly_limit=req.monthly_limit,
        single_transaction_limit=req.single_transaction_limit,
        auto_approve_threshold=req.auto_approve_threshold,
        allowed_categories=req.allowed_categories,
        card_last_four=req.card_last_four,
    )
    return account


@router.get("/accounts/me")
async def get_my_account(user: User = Depends(get_current_user)):
    """Get the current user's expense account."""
    user_id = str(user.id) if hasattr(user, "id") else "system"
    account = engine.get_expense_account(user_id)
    if not account:
        return {"account": None, "has_account": False}
    return {"account": account, "has_account": True}


@router.get("/accounts/me/summary")
async def get_my_summary(user: User = Depends(get_current_user)):
    """Get expense summary for the current employee."""
    user_id = str(user.id) if hasattr(user, "id") else "system"
    return engine.get_employee_summary(user_id)


# ── Claims ─────────────────────────────────────────────────────

@router.post("/claims")
async def create_claim(req: CreateClaimRequest, user: User = Depends(get_current_user)):
    """Create an expense claim from a live receipt."""
    user_id = str(user.id) if hasattr(user, "id") else "system"
    try:
        claim = engine.create_claim(
            employee_id=user_id,
            receipt_id=req.receipt_id,
            amount=req.amount,
            currency=req.currency,
            merchant_name=req.merchant_name,
            category_code=req.category_code,
            project=req.project,
            department=req.department,
            cost_center=req.cost_center,
            business_justification=req.business_justification,
            receipt_photo_url=req.receipt_photo_url,
            payment_method=req.payment_method,
        )
        return claim
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/claims/{claim_id}/submit")
async def submit_claim(claim_id: str, user: User = Depends(get_current_user)):
    """Submit a claim for approval."""
    try:
        return engine.submit_claim(claim_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/claims")
async def list_my_claims(status: str | None = None, user: User = Depends(get_current_user)):
    """List my expense claims."""
    user_id = str(user.id) if hasattr(user, "id") else "system"
    claims = engine.get_employee_claims(user_id, status)
    return {"claims": claims, "total": len(claims)}


@router.get("/claims/{claim_id}")
async def get_claim(claim_id: str, user: User = Depends(get_current_user)):
    """Get a single claim."""
    claim = engine.expense_claims.get(claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    return claim


@router.post("/claims/{claim_id}/answer")
async def answer_query(claim_id: str, req: AnswerQueryRequest, user: User = Depends(get_current_user)):
    """Answer a manager's question about a claim."""
    try:
        return engine.answer_query(claim_id, req.answer)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── Approvals (Manager view) ──────────────────────────────────

@router.get("/approvals")
async def get_approval_queue(user: User = Depends(get_current_user)):
    """Get claims waiting for my approval (manager view)."""
    user_id = str(user.id) if hasattr(user, "id") else "system"
    claims = engine.get_approval_queue(user_id)
    return {"claims": claims, "total": len(claims)}


@router.post("/approvals/{claim_id}")
async def process_approval(
    claim_id: str,
    req: ApprovalDecisionRequest,
    user: User = Depends(get_current_user),
):
    """Approve, reject, or query an expense claim."""
    user_id = str(user.id) if hasattr(user, "id") else "system"
    user_name = getattr(user, "full_name", getattr(user, "email", "Manager"))

    try:
        if req.decision == "approved":
            return engine.approve_claim(claim_id, user_id, user_name, req.notes)
        elif req.decision == "rejected":
            if not req.reason:
                raise HTTPException(status_code=400, detail="Reason required for rejection")
            return engine.reject_claim(claim_id, user_id, user_name, req.reason)
        elif req.decision == "query":
            if not req.question:
                raise HTTPException(status_code=400, detail="Question required")
            return engine.query_claim(claim_id, user_id, user_name, req.question)
        else:
            raise HTTPException(status_code=400, detail="Decision must be: approved, rejected, or query")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── Accountant Multi-Client ────────────────────────────────────

@router.post("/accountant/entities")
async def assign_accountant_entities(req: AssignEntitiesRequest, user: User = Depends(get_current_user)):
    """Assign entities to an accountant for multi-client management."""
    user_id = str(user.id) if hasattr(user, "id") else "system"
    engine.assign_accountant_entities(user_id, req.entity_ids)
    return {"assigned": len(req.entity_ids)}


@router.get("/accountant/entities")
async def get_accountant_entities(user: User = Depends(get_current_user)):
    """Get entities assigned to this accountant."""
    user_id = str(user.id) if hasattr(user, "id") else "system"
    return {"entities": engine.get_accountant_entities(user_id)}

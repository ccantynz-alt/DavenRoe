"""Smart Tools API — beginner-friendly financial tools for non-accountants."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.auth.dependencies import get_current_user
from app.models.user import User
from app.smart_tools.engine import ExpenseWizard, PlainEnglishTranslator, BusinessChecklist

router = APIRouter(prefix="/smart-tools", tags=["Smart Tools"])
expense_wizard = ExpenseWizard()
translator = PlainEnglishTranslator()
checklist = BusinessChecklist()


class CategorizeRequest(BaseModel):
    description: str = Field(..., min_length=1)
    amount: float
    vendor: str = ""


class PnlData(BaseModel):
    revenue: float = 0
    expenses: float = 0
    net_profit: float | None = None
    prev_revenue: float | None = None
    prev_net_profit: float | None = None
    top_expenses: list[dict] = Field(default_factory=list)


class BalanceSheetData(BaseModel):
    total_assets: float = 0
    total_liabilities: float = 0
    equity: float | None = None
    cash: float = 0
    receivables: float = 0
    payables: float = 0
    monthly_expenses: float = 0


class CashFlowData(BaseModel):
    inflows: float = 0
    outflows: float = 0
    opening_balance: float = 0


@router.post("/categorize")
async def categorize_expense(req: CategorizeRequest, user: User = Depends(get_current_user)):
    """Categorize an expense and tell you if it's claimable — in plain English."""
    return expense_wizard.categorize(req.description, req.amount, req.vendor)


@router.get("/expense-categories")
async def get_expense_categories(user: User = Depends(get_current_user)):
    """Get all expense categories with tips on what's claimable."""
    return {"categories": expense_wizard.get_all_categories()}


@router.post("/translate/pnl")
async def translate_pnl(data: PnlData, user: User = Depends(get_current_user)):
    """Translate a Profit & Loss statement into plain English."""
    return translator.translate_pnl(data.model_dump())


@router.post("/translate/balance-sheet")
async def translate_balance_sheet(data: BalanceSheetData, user: User = Depends(get_current_user)):
    """Translate a Balance Sheet into plain English."""
    return translator.translate_balance_sheet(data.model_dump())


@router.post("/translate/cash-flow")
async def translate_cash_flow(data: CashFlowData, user: User = Depends(get_current_user)):
    """Translate Cash Flow into plain English."""
    return translator.translate_cash_flow(data.model_dump())


@router.get("/setup-checklist")
async def get_setup_checklist(
    jurisdiction: str = "AU",
    has_entity: bool = False,
    has_bank: bool = False,
    has_invoice: bool = False,
    has_employee: bool = False,
    user: User = Depends(get_current_user),
):
    """Get a personalized setup checklist for your business."""
    items = checklist.get_setup_checklist(jurisdiction, has_entity, has_bank, has_invoice, has_employee)
    return {"items": items, "completed": sum(1 for i in items if i["done"]), "total": len(items)}


@router.get("/monthly-checklist")
async def get_monthly_checklist(
    month: int = 0,
    jurisdiction: str = "AU",
    user: User = Depends(get_current_user),
):
    """Get your monthly to-do list for keeping your books in order."""
    from datetime import datetime
    m = month or datetime.now().month
    items = checklist.get_monthly_checklist(m, jurisdiction)
    return {"items": items, "month": m}

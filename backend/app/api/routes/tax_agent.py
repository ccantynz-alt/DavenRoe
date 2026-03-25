"""Tax Knowledge Agent API — answer customer tax questions with jurisdiction-specific knowledge."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.auth.dependencies import get_current_user
from app.models.user import User
from app.tax_agent.agent import TaxAgent

router = APIRouter(prefix="/tax-agent", tags=["Tax Knowledge Agent"])
agent = TaxAgent()


class TaxQuestionRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=2000)
    jurisdiction: str = Field("AU", description="AU, NZ, GB, or US")
    context: dict | None = Field(None, description="Optional business context (turnover, entity type, etc.)")


@router.post("/ask")
async def ask_tax_question(
    req: TaxQuestionRequest,
    user: User = Depends(get_current_user),
):
    """Ask the Tax Agent a question about tax, deductions, or compliance."""
    result = agent.answer(req.question, req.jurisdiction, req.context)
    return result


@router.get("/expenses/{jurisdiction}")
async def get_expense_categories(
    jurisdiction: str,
    user: User = Depends(get_current_user),
):
    """Get all claimable expense categories for a jurisdiction."""
    jur = jurisdiction.upper()
    if jur not in ("AU", "NZ", "GB", "US"):
        raise HTTPException(status_code=400, detail="Unsupported jurisdiction")
    return {"categories": agent.get_expense_categories(jur), "jurisdiction": jur}


@router.get("/bank-fees/{jurisdiction}")
async def get_bank_fee_rules(
    jurisdiction: str,
    user: User = Depends(get_current_user),
):
    """Get bank fee deductibility rules for a specific jurisdiction."""
    jur = jurisdiction.upper()
    if jur not in ("AU", "NZ", "GB", "US"):
        raise HTTPException(status_code=400, detail="Unsupported jurisdiction")
    return agent.get_bank_fee_rules(jur)


@router.get("/jurisdictions")
async def list_jurisdictions(user: User = Depends(get_current_user)):
    """List supported tax jurisdictions with key info."""
    from app.tax_agent.knowledge_base import TAX_KNOWLEDGE
    result = []
    for code, kb in TAX_KNOWLEDGE.items():
        result.append({
            "code": code,
            "authority": kb["authority"],
            "financial_year": kb["financial_year"],
            "currency": kb["currency"],
        })
    return {"jurisdictions": result}

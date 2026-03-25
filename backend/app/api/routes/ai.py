"""AI Agent API routes.

Natural language queries and AI-powered features.
This is the "Simple-Speak" interface.
"""

from fastapi import APIRouter, Depends

from app.agents.categorizer import CategorizationAgent
from app.agents.narrator import NarrativeAgent
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.schemas.tax import NaturalLanguageQuery

router = APIRouter(prefix="/ai", tags=["AI Agent"])


@router.post("/query")
async def natural_language_query(req: NaturalLanguageQuery, user: User = Depends(get_current_user)):
    """Ask a question about your finances in plain English.

    Examples:
    - "How much did I spend on SaaS last month?"
    - "What's my GST liability for this quarter?"
    - "Summarize my cash flow for the last 90 days."
    """
    narrator = NarrativeAgent()

    # Pulls financial context from active entity data and passes to NarrativeAgent
    result = await narrator.answer_query(
        query=req.query,
        financial_data={},
    )
    return result


@router.post("/categorize")
async def categorize_transaction(transaction: dict, user: User = Depends(get_current_user)):
    """AI-categorize a bank feed transaction.

    Send raw bank transaction data and get back a suggested
    category, confidence score, and reasoning.
    """
    categorizer = CategorizationAgent()
    result = await categorizer.categorize_transaction(
        description=transaction.get("description", ""),
        amount=str(transaction.get("amount", "0")),
        currency=transaction.get("currency", "USD"),
        merchant=transaction.get("merchant"),
        jurisdiction=transaction.get("jurisdiction", "US"),
    )
    return result


@router.post("/narrative")
async def generate_narrative(data: dict, user: User = Depends(get_current_user)):
    """Generate a plain-English narrative from financial data.

    Instead of just showing numbers, get a 2-3 paragraph summary
    explaining what's happening in your business.
    """
    narrator = NarrativeAgent()
    result = await narrator.generate_narrative(
        financial_data=data.get("financial_data", {}),
        context=data.get("context", ""),
    )
    return result

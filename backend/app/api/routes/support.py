"""Support API — AI-powered support ticket management and auto-responder."""

from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field

from app.auth.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/support", tags=["Support"])


# ---------------------------------------------------------------------------
# Knowledge Base
# ---------------------------------------------------------------------------

KNOWLEDGE_BASE: list[dict] = [
    {
        "id": "kb-bank-feeds-001",
        "category": "bank feeds",
        "title": "Connecting your bank account",
        "keywords": ["bank", "connect", "feed", "plaid", "basiq", "truelayer", "link", "account"],
        "content": (
            "Astra supports automatic bank feeds through Plaid (US/CA), Basiq (AU/NZ), "
            "and TrueLayer (UK/EU). Navigate to Banking > Connect Account, select your "
            "country, and follow the secure authentication flow. Transactions are imported "
            "automatically every 4 hours and can be manually refreshed at any time."
        ),
    },
    {
        "id": "kb-bank-feeds-002",
        "category": "bank feeds",
        "title": "Bank feed disconnection troubleshooting",
        "keywords": ["bank", "disconnect", "error", "reconnect", "feed", "broken", "not working"],
        "content": (
            "If your bank feed disconnects, go to Banking > Manage Connections and click "
            "Reconnect. Common causes include password changes at your bank, multi-factor "
            "authentication updates, or temporary bank outages. If the issue persists after "
            "reconnecting, try removing and re-adding the connection."
        ),
    },
    {
        "id": "kb-invoicing-001",
        "category": "invoicing",
        "title": "Creating and sending invoices",
        "keywords": ["invoice", "create", "send", "bill", "client", "payment", "due"],
        "content": (
            "Go to Invoicing > New Invoice. Select a client, add line items with descriptions "
            "and amounts, set payment terms, and click Send. Invoices are delivered via email "
            "with a secure payment link. Astra supports credit notes, recurring invoices, and "
            "automatic payment reminders."
        ),
    },
    {
        "id": "kb-invoicing-002",
        "category": "invoicing",
        "title": "Setting up online payments on invoices",
        "keywords": ["invoice", "payment", "stripe", "online", "pay", "credit card"],
        "content": (
            "To accept online payments, connect your Stripe account under Settings > Payments. "
            "Once connected, all new invoices will include a Pay Now button. Clients can pay "
            "via credit card, debit card, or bank transfer. Payments are automatically matched "
            "and reconciled."
        ),
    },
    {
        "id": "kb-payroll-001",
        "category": "payroll",
        "title": "Running payroll",
        "keywords": ["payroll", "pay run", "employee", "salary", "wages", "pay", "run"],
        "content": (
            "Navigate to Payroll > New Pay Run. Select the pay period, review employee hours "
            "and earnings, verify tax withholdings (PAYG for AU, PAYE for NZ/UK, Federal for US), "
            "and approve the run. Astra calculates superannuation (AU 11.5%), KiwiSaver (NZ 3-8%), "
            "and pension contributions (UK) automatically."
        ),
    },
    {
        "id": "kb-payroll-002",
        "category": "payroll",
        "title": "Adding a new employee",
        "keywords": ["employee", "add", "new", "hire", "onboard", "staff", "team"],
        "content": (
            "Go to Payroll > Employees > Add Employee. Enter their personal details, tax file "
            "number or equivalent, employment type (full-time, part-time, contractor), pay rate, "
            "and superannuation/pension fund details. Astra supports employees across AU, NZ, UK, "
            "and US jurisdictions in a single platform."
        ),
    },
    {
        "id": "kb-tax-001",
        "category": "tax",
        "title": "Filing BAS, GST, VAT, or Sales Tax returns",
        "keywords": ["tax", "bas", "gst", "vat", "sales tax", "filing", "lodge", "return", "ato"],
        "content": (
            "Go to Tax Filing, select your jurisdiction and period, and Astra will auto-generate "
            "your return. Review the calculated figures, validate with the built-in checker, and "
            "submit directly to the tax authority. Supported: BAS (AU), GST (NZ), VAT (UK), "
            "Sales Tax (US). The compliance calendar tracks all 40+ deadlines."
        ),
    },
    {
        "id": "kb-tax-002",
        "category": "tax",
        "title": "Cross-border tax treaties and withholding tax",
        "keywords": ["tax", "treaty", "cross-border", "withholding", "dta", "international", "double tax"],
        "content": (
            "Astra includes a cross-border tax treaty engine covering 6 bilateral Double Tax "
            "Agreements (AU-NZ, AU-UK, AU-US, NZ-UK, NZ-US, UK-US). Withholding tax rates are "
            "automatically applied based on the treaty. Navigate to Tax > Treaty Engine to review "
            "applicable rates and optimize your international payments."
        ),
    },
    {
        "id": "kb-ai-001",
        "category": "ai features",
        "title": "Using Ask Astra (AI assistant)",
        "keywords": ["ai", "astra", "ask", "question", "assistant", "natural language", "nlp"],
        "content": (
            "Ask Astra is your AI financial assistant. Type any question in natural language "
            "such as 'What was my revenue last quarter?' or 'Show me overdue invoices'. Astra "
            "queries your financial data in real time and returns answers with supporting details. "
            "Access it from the Ask Astra page or the command bar (Ctrl+K)."
        ),
    },
    {
        "id": "kb-ai-002",
        "category": "ai features",
        "title": "AI-powered transaction categorization",
        "keywords": ["ai", "categorize", "category", "transaction", "auto", "review queue", "confidence"],
        "content": (
            "Astra's AI automatically categorizes bank feed transactions with a confidence score. "
            "High-confidence items (90%+) are auto-approved. Lower-confidence items appear in the "
            "Review Queue for human approval. Over time, the AI learns from your corrections and "
            "improves accuracy. Target accuracy is 95%+."
        ),
    },
    {
        "id": "kb-ai-003",
        "category": "ai features",
        "title": "Autonomous month-end close",
        "keywords": ["ai", "month-end", "close", "autonomous", "agentic", "reconciliation"],
        "content": (
            "The Agentic AI module can perform autonomous month-end close in an average of 4.2 "
            "seconds. It reconciles bank feeds, categorizes remaining transactions, generates "
            "adjusting entries, and produces financial statements. Navigate to Agentic AI > "
            "Month-End Close to run or schedule it."
        ),
    },
    {
        "id": "kb-billing-001",
        "category": "billing",
        "title": "Subscription plans and pricing",
        "keywords": ["billing", "plan", "pricing", "subscription", "cost", "upgrade", "downgrade", "tier"],
        "content": (
            "Astra offers three tiers: Practice ($149/mo) includes all core features and payroll "
            "for a single jurisdiction. Firm ($499/mo) adds multi-jurisdiction support, forensic "
            "intelligence, and priority support. Enterprise (custom pricing) includes unlimited "
            "entities, white-label branding, and dedicated account management. All plans include "
            "unlimited users and entities within the tier."
        ),
    },
    {
        "id": "kb-billing-002",
        "category": "billing",
        "title": "Changing or cancelling your subscription",
        "keywords": ["billing", "cancel", "change", "upgrade", "downgrade", "refund", "subscription"],
        "content": (
            "Go to Settings > Billing to upgrade, downgrade, or cancel your subscription. "
            "Upgrades take effect immediately with prorated billing. Downgrades take effect "
            "at the end of the current billing cycle. Cancellation stops billing at period end "
            "and your data is retained for 90 days."
        ),
    },
    {
        "id": "kb-security-001",
        "category": "security",
        "title": "Data security and encryption",
        "keywords": ["security", "encryption", "data", "safe", "protect", "privacy", "gdpr", "compliance"],
        "content": (
            "Astra uses AES-256 encryption at rest and TLS 1.3 in transit. All data is stored "
            "in SOC 2 Type II certified data centers. We maintain an immutable hash-chain audit "
            "trail for every data change. Role-based access control with 5 permission levels "
            "ensures users only see data they are authorized to access."
        ),
    },
    {
        "id": "kb-security-002",
        "category": "security",
        "title": "Two-factor authentication and password security",
        "keywords": ["security", "2fa", "two-factor", "password", "login", "authentication", "mfa"],
        "content": (
            "Astra supports two-factor authentication (2FA) via authenticator apps. Enable it "
            "under Settings > Security. Passwords are hashed with bcrypt and never stored in "
            "plain text. Password reset is available via email-based secure token flow. We "
            "recommend using a unique, strong password of at least 12 characters."
        ),
    },
    {
        "id": "kb-import-001",
        "category": "data import",
        "title": "Importing data from Xero, QuickBooks, or MYOB",
        "keywords": ["import", "migrate", "xero", "quickbooks", "myob", "data", "switch", "transfer", "csv"],
        "content": (
            "Go to Settings > Data Import to migrate from another platform. Astra supports "
            "direct imports from Xero, QuickBooks, and MYOB via API, as well as CSV/Excel "
            "uploads for chart of accounts, contacts, invoices, and transactions. The import "
            "wizard maps fields automatically and flags any conflicts for review."
        ),
    },
    {
        "id": "kb-import-002",
        "category": "data import",
        "title": "Bulk data upload via CSV",
        "keywords": ["import", "csv", "excel", "upload", "bulk", "data", "spreadsheet"],
        "content": (
            "Navigate to Settings > Data Import > CSV Upload. Download the template for the "
            "data type you want to import (contacts, transactions, invoices, chart of accounts), "
            "fill in your data, and upload. Astra validates the file, shows a preview of the "
            "import, and lets you confirm before committing changes."
        ),
    },
]


# ---------------------------------------------------------------------------
# Ticket store — persisted in-memory for single-instance deployments.
# ---------------------------------------------------------------------------

_tickets: list[dict] = []


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class TicketPriority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"


class TicketStatus(str, Enum):
    open = "open"
    in_progress = "in_progress"
    resolved = "resolved"
    closed = "closed"


class CreateTicketRequest(BaseModel):
    subject: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1, max_length=5000)
    priority: TicketPriority = TicketPriority.medium
    email: Optional[str] = Field(None, description="Contact email (defaults to account email)")


class TicketResponse(BaseModel):
    id: str
    subject: str
    message: str
    priority: str
    status: str
    email: str
    created_at: str
    auto_response: Optional[str] = None


class AutoRespondRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)


class KBArticle(BaseModel):
    id: str
    category: str
    title: str
    content: str
    relevance: float = 0.0


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _search_knowledge_base(query: str, limit: int = 5) -> list[dict]:
    """Search the knowledge base using keyword matching and return ranked results."""
    query_lower = query.lower()
    query_words = set(query_lower.split())
    scored: list[tuple[float, dict]] = []

    for article in KNOWLEDGE_BASE:
        score = 0.0

        # Keyword match scoring
        for kw in article["keywords"]:
            if kw in query_lower:
                score += 3.0
            elif any(w in kw for w in query_words):
                score += 1.5
            elif any(kw in w for w in query_words):
                score += 1.0

        # Title match
        title_lower = article["title"].lower()
        for word in query_words:
            if len(word) > 2 and word in title_lower:
                score += 2.0

        # Category match
        if article["category"].lower() in query_lower:
            score += 2.0

        if score > 0:
            scored.append((score, article))

    scored.sort(key=lambda x: x[0], reverse=True)
    results = []
    for relevance, article in scored[:limit]:
        results.append({
            "id": article["id"],
            "category": article["category"],
            "title": article["title"],
            "content": article["content"],
            "relevance": round(relevance, 2),
        })
    return results


def _generate_auto_response(question: str) -> dict:
    """Generate an AI-style response by finding the best knowledge base matches."""
    results = _search_knowledge_base(question, limit=3)

    if not results:
        return {
            "answered": False,
            "response": (
                "I wasn't able to find a specific answer to your question in our knowledge base. "
                "A support agent will follow up with you shortly. In the meantime, you can browse "
                "our help articles or ask Astra directly using the Ask Astra feature."
            ),
            "sources": [],
            "confidence": 0.0,
        }

    top = results[0]
    confidence = min(top["relevance"] / 10.0, 1.0)

    if confidence >= 0.3:
        supporting = [{"title": r["title"], "category": r["category"], "id": r["id"]} for r in results]
        return {
            "answered": True,
            "response": top["content"],
            "sources": supporting,
            "confidence": round(confidence, 2),
        }

    return {
        "answered": False,
        "response": (
            "I found some possibly related information, but I'm not confident it answers your "
            "question. A support agent will review your query. Here's what might help: "
            + top["content"]
        ),
        "sources": [{"title": top["title"], "category": top["category"], "id": top["id"]}],
        "confidence": round(confidence, 2),
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/tickets", response_model=TicketResponse)
async def create_ticket(req: CreateTicketRequest, user: User = Depends(get_current_user)):
    """Create a new support ticket. An AI auto-response is attempted for common questions."""
    auto = _generate_auto_response(req.subject + " " + req.message)

    ticket = {
        "id": f"TKT-{uuid4().hex[:8].upper()}",
        "subject": req.subject,
        "message": req.message,
        "priority": req.priority.value,
        "status": TicketStatus.open.value if not auto["answered"] else TicketStatus.resolved.value,
        "email": req.email or getattr(user, "email", "unknown@example.com"),
        "user_id": getattr(user, "id", None),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "auto_response": auto["response"] if auto["answered"] else None,
        "ai_confidence": auto["confidence"],
    }
    _tickets.append(ticket)

    return TicketResponse(
        id=ticket["id"],
        subject=ticket["subject"],
        message=ticket["message"],
        priority=ticket["priority"],
        status=ticket["status"],
        email=ticket["email"],
        created_at=ticket["created_at"],
        auto_response=ticket["auto_response"],
    )


@router.get("/tickets")
async def list_tickets(
    status: Optional[TicketStatus] = None,
    priority: Optional[TicketPriority] = None,
    user: User = Depends(get_current_user),
):
    """List support tickets for the current user, with optional status/priority filters."""
    user_id = getattr(user, "id", None)
    results = [t for t in _tickets if t.get("user_id") == user_id]

    if status:
        results = [t for t in results if t["status"] == status.value]
    if priority:
        results = [t for t in results if t["priority"] == priority.value]

    results.sort(key=lambda t: t["created_at"], reverse=True)

    return {
        "tickets": results,
        "total": len(results),
    }


@router.post("/auto-respond")
async def auto_respond(req: AutoRespondRequest, user: User = Depends(get_current_user)):
    """Given a question, return an AI-generated response from the knowledge base."""
    return _generate_auto_response(req.question)


@router.get("/kb/search")
async def search_knowledge_base(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(5, ge=1, le=20),
    user: User = Depends(get_current_user),
):
    """Search knowledge base articles by keyword."""
    results = _search_knowledge_base(q, limit=limit)
    return {
        "query": q,
        "results": results,
        "total": len(results),
    }

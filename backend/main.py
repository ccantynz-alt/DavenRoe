"""DavenRoe — AI-Native Accounting + Tax + Forensic Intelligence Platform.

Main FastAPI application entry point.
"""

import time
import logging
from collections import defaultdict

from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from app.api.routes import (
    agentic, ai, auth, banking, dashboard, entities, forensic, specialists, tax,
    toolkit, transactions,
    reports, clients, documents, multicurrency, auditlog,
    permissions_routes, notifications_routes, integrations,
    messaging, scheduling, integrations_hub,
    inventory, invoicing, marketplace, pdf_export,
    enterprise, payroll, tax_filing,
    financial_health,
    incorporation,
    email_scanner,
    tax_agent,
    peer_review,
    smart_tools,
    time_tracker,
    live_receipt,
    expense_accounts,
    spend_monitor,
    bills,
    suppliers,
    chart_of_accounts,
    journal_entries,
    bank_reconciliation,
    quotes,
    recurring,
    purchase_orders,
    credit_notes,
    fixed_assets,
    budgets,
    support,
    projects,
    scenarios,
    compliance,
    catch_up,
)
from app.core.config import get_settings
from app.legal.middleware import LegalHeadersMiddleware

logger = logging.getLogger(__name__)
settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "AI-native global accounting platform with autonomous bookkeeping, "
        "multi-jurisdiction tax compliance, forensic intelligence, native 4-country payroll, "
        "and treaty-aware cross-border calculations across AU, NZ, UK, US."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)


@app.on_event("startup")
async def startup():
    """Create database tables on startup if they don't exist."""
    try:
        import app.models  # noqa: F401 — ensure all models are registered with Base
        from app.core.database import create_tables
        await create_tables()
        logger.info("Database tables verified/created")
    except Exception as e:
        logger.warning(f"Database not available — running in demo mode: {e}")


# Rate limiting middleware
class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_requests: int = 60, window: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window = window
        self.requests = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        # Clean old entries
        self.requests[client_ip] = [
            t for t in self.requests[client_ip] if now - t < self.window
        ]
        if len(self.requests[client_ip]) >= self.max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again later.",
            )
        self.requests[client_ip].append(now)
        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(self.max_requests)
        response.headers["X-RateLimit-Remaining"] = str(
            self.max_requests - len(self.requests[client_ip])
        )
        return response


# Bot blocking middleware — blocks known scraper and competitor crawlers
class BotBlockMiddleware(BaseHTTPMiddleware):
    BLOCKED_BOTS = {
        "semrushbot", "ahrefsbot", "mj12bot", "dotbot", "blexbot",
        "dataforseobot", "petalbot", "bytespider", "gptbot", "ccbot",
        "diffbot", "scrapy", "httrack", "perplexitybot",
    }

    async def dispatch(self, request: Request, call_next):
        ua = (request.headers.get("user-agent") or "").lower()
        for bot in self.BLOCKED_BOTS:
            if bot in ua:
                return JSONResponse(
                    status_code=403,
                    content={"detail": "Access denied"},
                )
        response = await call_next(request)
        # Security headers on all responses
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response


# Middleware stack (order matters — last added runs first)
app.add_middleware(BotBlockMiddleware)
app.add_middleware(RateLimitMiddleware, max_requests=settings.rate_limit_per_minute)

# Legal compliance headers on every response
app.add_middleware(LegalHeadersMiddleware)

# CORS — use configurable origins
cors_origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

# Auth & Dashboard
app.include_router(auth.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")

# Core Routes
app.include_router(entities.router, prefix="/api/v1")
app.include_router(transactions.router, prefix="/api/v1")
app.include_router(tax.router, prefix="/api/v1")
app.include_router(ai.router, prefix="/api/v1")
app.include_router(forensic.router, prefix="/api/v1")
app.include_router(banking.router, prefix="/api/v1")
app.include_router(specialists.router, prefix="/api/v1")
app.include_router(toolkit.router, prefix="/api/v1")
app.include_router(agentic.router, prefix="/api/v1")

# Platform Features
app.include_router(reports.router, prefix="/api/v1")
app.include_router(clients.router, prefix="/api/v1")
app.include_router(documents.router, prefix="/api/v1")
app.include_router(multicurrency.router, prefix="/api/v1")
app.include_router(auditlog.router, prefix="/api/v1")
app.include_router(permissions_routes.router, prefix="/api/v1")
app.include_router(notifications_routes.router, prefix="/api/v1")
app.include_router(integrations.router, prefix="/api/v1")
app.include_router(messaging.router, prefix="/api/v1")
app.include_router(scheduling.router, prefix="/api/v1")
app.include_router(integrations_hub.router, prefix="/api/v1")
app.include_router(inventory.router, prefix="/api/v1")
app.include_router(invoicing.router, prefix="/api/v1")
app.include_router(marketplace.router, prefix="/api/v1")
app.include_router(pdf_export.router, prefix="/api/v1")
app.include_router(enterprise.router, prefix="/api/v1")
app.include_router(payroll.router, prefix="/api/v1")
app.include_router(tax_filing.router, prefix="/api/v1")
app.include_router(financial_health.router, prefix="/api/v1")
app.include_router(incorporation.router, prefix="/api/v1")
app.include_router(email_scanner.router, prefix="/api/v1")
app.include_router(tax_agent.router, prefix="/api/v1")
app.include_router(peer_review.router, prefix="/api/v1")
app.include_router(smart_tools.router, prefix="/api/v1")
app.include_router(time_tracker.router, prefix="/api/v1")
app.include_router(live_receipt.router, prefix="/api/v1")
app.include_router(expense_accounts.router, prefix="/api/v1")
app.include_router(spend_monitor.router, prefix="/api/v1")
app.include_router(bills.router, prefix="/api/v1")
app.include_router(suppliers.router, prefix="/api/v1")
app.include_router(chart_of_accounts.router, prefix="/api/v1")
app.include_router(journal_entries.router, prefix="/api/v1")
app.include_router(bank_reconciliation.router, prefix="/api/v1")
app.include_router(quotes.router, prefix="/api/v1")
app.include_router(recurring.router, prefix="/api/v1")
app.include_router(purchase_orders.router, prefix="/api/v1")
app.include_router(credit_notes.router, prefix="/api/v1")
app.include_router(fixed_assets.router, prefix="/api/v1")
app.include_router(budgets.router, prefix="/api/v1")
app.include_router(support.router, prefix="/api/v1")
app.include_router(projects.router, prefix="/api/v1")
app.include_router(scenarios.router, prefix="/api/v1")
app.include_router(compliance.router, prefix="/api/v1")
app.include_router(catch_up.router)  # Public catch-up endpoints (no auth required, prefix in router)


@app.get("/")
async def root():
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "status": "operational",
        "pillars": {
            "tax_engine": "Global Tax & Treaty Engine — US, AU, NZ, GB + 6 bilateral DTAs",
            "autonomous_ledger": "AI-drafted double-entry with human review workflow",
            "simple_speak": "Natural language queries and financial narratives",
            "audit_shield": "Real-time risk scoring and continuous audit",
        },
        "agentic_ai": {
            "orchestrator": "Natural language → multi-agent dispatch and execution",
            "month_end_close": "Autonomous close: reconcile, adjust, report, narrate in minutes",
            "cash_flow_forecaster": "13-week rolling forecast with receivables risk scoring",
            "compliance_monitor": "Real-time regulatory monitoring across US, AU, NZ, GB",
        },
        "collaboration": {
            "messaging": "Secure team chat, client portal, tax authority correspondence tracking",
            "scheduling": "Appointment booking with ICS calendar invites, availability management",
            "integrations_hub": "28 integrations — Zoom, Teams, DocuSign, ATO, IRS, Xero, Stripe, Karbon",
        },
        "platform": {
            "reporting": "P&L, Balance Sheet, Trial Balance, Cash Flow, GL, Aged AR/AP",
            "client_management": "Multi-entity management with groups and consolidated reporting",
            "documents": "Upload, OCR, link to transactions, retention tracking",
            "multi_currency": "Foreign currency ledger with realized/unrealized FX gains",
            "audit_trail": "Immutable hash-chain audit log for every change",
            "permissions": "Role-based access: Partner, Manager, Senior, Bookkeeper, Client",
            "notifications": "Deadline alerts, review reminders, anomaly warnings",
            "integrations": "Import/export: Xero, QuickBooks, MYOB, Sage, FreshBooks, CSV",
        },
        "add_ons": {
            "forensic_accounting": "M&A Due Diligence — Benford's Law, anomaly detection, vendor/payroll cross-ref",
            "specialist_toolkits": "12 accounting specializations, 90+ automations",
            "universal_toolkit": "Calculators, validators, reconciliation, reference — everyday tools for every user",
        },
        "capture": {
            "catch_up": "/api/v1/catch-up — public years-behind rescue assessment (no auth)",
            "compare": "/compare/quickbooks, /migrate/from-quickbooks — public marketing pages",
        },
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}

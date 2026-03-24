"""Astra — The World's First Autonomous Global Accounting Agent.

Main FastAPI application entry point.
"""

import time
import logging
from collections import defaultdict

from fastapi import FastAPI, Request, HTTPException, status
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
)
from app.core.config import get_settings
from app.legal.middleware import LegalHeadersMiddleware

logger = logging.getLogger(__name__)
settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "Autonomous global accounting platform with AI-powered bookkeeping, "
        "multi-jurisdiction tax compliance, and treaty-aware cross-border calculations."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)


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


# Middleware stack (order matters — last added runs first)
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
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}

"""Astra — The World's First Autonomous Global Accounting Agent.

Main FastAPI application entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import (
    ai, banking, entities, forensic, specialists, tax, toolkit, transactions,
    reports, clients, documents, multicurrency, auditlog,
    permissions_routes, notifications_routes, integrations,
    messaging, scheduling, integrations_hub,
)
from app.core.config import get_settings
from app.legal.middleware import LegalHeadersMiddleware

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

# Legal compliance headers on every response
app.add_middleware(LegalHeadersMiddleware)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core Routes
app.include_router(entities.router, prefix="/api/v1")
app.include_router(transactions.router, prefix="/api/v1")
app.include_router(tax.router, prefix="/api/v1")
app.include_router(ai.router, prefix="/api/v1")
app.include_router(forensic.router, prefix="/api/v1")
app.include_router(banking.router, prefix="/api/v1")
app.include_router(specialists.router, prefix="/api/v1")
app.include_router(toolkit.router, prefix="/api/v1")

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

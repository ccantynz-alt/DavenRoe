"""Astra — The World's First Autonomous Global Accounting Agent.

Main FastAPI application entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import ai, banking, entities, forensic, specialists, tax, transactions
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

# Routes
app.include_router(entities.router, prefix="/api/v1")
app.include_router(transactions.router, prefix="/api/v1")
app.include_router(tax.router, prefix="/api/v1")
app.include_router(ai.router, prefix="/api/v1")
app.include_router(forensic.router, prefix="/api/v1")
app.include_router(banking.router, prefix="/api/v1")
app.include_router(specialists.router, prefix="/api/v1")


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
        "add_ons": {
            "forensic_accounting": "M&A Due Diligence — Benford's Law, anomaly detection, vendor/payroll cross-ref",
            "specialist_toolkits": "12 accounting specializations, 90+ automations",
        },
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}

"""Marketplace API routes — full app store with install/uninstall.

Provides a rich catalog of 100+ integrations across categories including
CRM, e-commerce, payments, productivity, tax, banking, HR, and more.
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.integrations.marketplace import Marketplace, MarketplaceApp
from app.auth.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/marketplace", tags=["App Marketplace"])
marketplace = Marketplace()

# Installed apps store — persisted in-memory for single-instance deployments.
_installed_apps: dict[str, dict[str, dict]] = {}

# Extended app metadata not in the base catalog (ratings, install counts, features, etc.)
APP_METADATA: dict[str, dict] = {
    "salesforce": {
        "rating": 4.6, "install_count": 12840, "icon": "SF",
        "long_description": "Connect Salesforce CRM to automatically sync customer data, invoices, and payment history. Bi-directional sync keeps your sales pipeline and accounting perfectly aligned.",
        "features": ["Contact & account sync", "Invoice-to-opportunity linking", "Payment status tracking", "Custom field mapping", "Automated revenue recognition"],
        "setup_time": "15 minutes",
    },
    "hubspot": {
        "rating": 4.5, "install_count": 9720, "icon": "HS",
        "long_description": "HubSpot CRM integration syncs contacts, deals, and invoices between your accounting platform and HubSpot. Track customer lifetime value and automate billing workflows.",
        "features": ["Deal-to-invoice automation", "Contact sync", "Revenue attribution", "Custom property mapping", "Workflow triggers"],
        "setup_time": "10 minutes",
    },
    "pipedrive": {
        "rating": 4.4, "install_count": 5430, "icon": "PD",
        "long_description": "Pipedrive integration connects your sales pipeline with accounting. Automatically create invoices when deals close and track payments against pipeline stages.",
        "features": ["Deal-to-invoice conversion", "Contact sync", "Revenue tracking", "Activity logging", "Custom field sync"],
        "setup_time": "10 minutes",
    },
    "shopify": {
        "rating": 4.7, "install_count": 18500, "icon": "SH",
        "long_description": "Automatically import Shopify orders, refunds, and payouts into your ledger. Multi-currency support, tax calculation sync, and inventory cost tracking included.",
        "features": ["Order import & categorization", "Refund tracking", "Payout reconciliation", "Multi-currency support", "Inventory cost sync", "Tax rate synchronization"],
        "setup_time": "20 minutes",
    },
    "woocommerce": {
        "rating": 4.3, "install_count": 8200, "icon": "WC",
        "long_description": "Sync WooCommerce orders, products, and customer data with your accounting. Automated revenue recognition, tax calculations, and refund processing.",
        "features": ["Order sync", "Product catalog import", "Tax calculation", "Refund automation", "Customer data sync"],
        "setup_time": "15 minutes",
    },
    "square": {
        "rating": 4.5, "install_count": 11300, "icon": "SQ",
        "long_description": "Import Square POS transactions, itemized sales, and payouts automatically. Perfect for retail and hospitality businesses needing real-time accounting.",
        "features": ["Transaction import", "Itemized sales tracking", "Payout reconciliation", "Tip tracking", "Multi-location support"],
        "setup_time": "10 minutes",
    },
    "paypal": {
        "rating": 4.2, "install_count": 15600, "icon": "PP",
        "long_description": "Automatically import PayPal transactions, fees, and settlements. Supports multiple currencies, dispute tracking, and automated reconciliation.",
        "features": ["Transaction import", "Fee tracking", "Multi-currency support", "Dispute monitoring", "Settlement reconciliation"],
        "setup_time": "5 minutes",
    },
    "gocardless": {
        "rating": 4.4, "install_count": 6800, "icon": "GC",
        "long_description": "Automate direct debit collection and reconciliation. Import GoCardless payments, track failed collections, and match to outstanding invoices automatically.",
        "features": ["Payment import", "Failed payment alerts", "Invoice matching", "Mandate management", "Bank reconciliation"],
        "setup_time": "15 minutes",
    },
    "wise": {
        "rating": 4.6, "install_count": 9100, "icon": "WS",
        "long_description": "Import Wise (TransferWise) international transfers with real exchange rates. Automatically calculate FX gains/losses and reconcile multi-currency accounts.",
        "features": ["Transfer import", "Real FX rates", "FX gain/loss calculation", "Multi-currency reconciliation", "Batch payment tracking"],
        "setup_time": "10 minutes",
    },
    "slack": {
        "rating": 4.5, "install_count": 14200, "icon": "SL",
        "long_description": "Get real-time accounting notifications in Slack. Invoice payments, overdue alerts, anomaly detection, bank feed updates, and approval requests delivered to your channels.",
        "features": ["Payment notifications", "Overdue invoice alerts", "Anomaly detection alerts", "Approval request routing", "Custom channel mapping", "Daily digest summaries"],
        "setup_time": "5 minutes",
    },
    "ms_teams": {
        "rating": 4.3, "install_count": 10800, "icon": "TM",
        "long_description": "Microsoft Teams integration delivers accounting alerts, approval workflows, and financial summaries directly into your Teams channels and chats.",
        "features": ["Notification cards", "Approval workflows", "Financial summaries", "Bot commands", "Channel alerts"],
        "setup_time": "10 minutes",
    },
    "google_workspace": {
        "rating": 4.4, "install_count": 13500, "icon": "GW",
        "long_description": "Sync with Google Workspace for document storage in Drive, calendar scheduling, Gmail invoice sending, and Sheets-based reporting exports.",
        "features": ["Drive document storage", "Calendar sync", "Gmail invoice delivery", "Sheets export", "Contacts sync"],
        "setup_time": "10 minutes",
    },
    "ato_portal": {
        "rating": 4.1, "install_count": 7600, "icon": "AT",
        "long_description": "Direct connection to the Australian Taxation Office. Lodge BAS, STP reports, and tax returns electronically. Auto-populate GST calculations from your ledger.",
        "features": ["BAS lodgement", "STP Phase 2 reporting", "Income tax prefill", "GST calculation sync", "Activity statement generation"],
        "setup_time": "20 minutes",
    },
    "ird_gateway": {
        "rating": 4.0, "install_count": 4200, "icon": "IR",
        "long_description": "Connect to New Zealand Inland Revenue for GST returns, payday filing, and income tax. Automated compliance with NZ tax obligations.",
        "features": ["GST return filing", "Payday filing", "Income tax returns", "Student loan deductions", "KiwiSaver reporting"],
        "setup_time": "20 minutes",
    },
    "hmrc_mtd": {
        "rating": 4.2, "install_count": 8900, "icon": "HM",
        "long_description": "Making Tax Digital compliant integration with HMRC. Submit VAT returns, maintain digital records, and prepare for income tax self-assessment digitization.",
        "features": ["VAT return submission", "Digital record keeping", "Bridge software compliance", "Anti-fraud headers", "Quarterly reporting"],
        "setup_time": "25 minutes",
    },
    "plaid": {
        "rating": 4.5, "install_count": 11700, "icon": "PL",
        "long_description": "Bank feed aggregation for US and Canadian institutions. Real-time transaction import, balance monitoring, and automated categorization via Plaid's secure API.",
        "features": ["Real-time transactions", "Balance monitoring", "Institution coverage (11,000+)", "Identity verification", "Income verification"],
        "setup_time": "5 minutes",
    },
    "basiq": {
        "rating": 4.3, "install_count": 5100, "icon": "BQ",
        "long_description": "Australian and New Zealand open banking data aggregation. Connect to 170+ financial institutions for real-time bank feed import and reconciliation.",
        "features": ["AU/NZ bank coverage", "Real-time sync", "Transaction enrichment", "Account verification", "Consent management"],
        "setup_time": "10 minutes",
    },
    "truelayer": {
        "rating": 4.4, "install_count": 6300, "icon": "TL",
        "long_description": "Open banking integration for UK and European institutions. PSD2-compliant bank data access with real-time transaction feeds and payment initiation.",
        "features": ["UK/EU bank coverage", "PSD2 compliance", "Payment initiation", "Real-time balances", "Transaction categorization"],
        "setup_time": "10 minutes",
    },
    "bamboohr": {
        "rating": 4.4, "install_count": 7300, "icon": "BB",
        "long_description": "Sync employee data, time-off records, and compensation details from BambooHR. Automate payroll journal entries and track workforce costs by department.",
        "features": ["Employee data sync", "Time-off tracking", "Compensation import", "Department cost allocation", "Headcount reporting"],
        "setup_time": "15 minutes",
    },
    "employment_hero": {
        "rating": 4.5, "install_count": 8400, "icon": "EH",
        "long_description": "Full payroll and HR integration for AU, NZ, GB, SG, and MY. Automated pay run imports, leave accrual tracking, superannuation, and STP compliance.",
        "features": ["Pay run import", "Super/pension tracking", "Leave accrual sync", "STP compliance", "Employee onboarding", "Benefits administration"],
        "setup_time": "20 minutes",
    },
    "lightspeed": {
        "rating": 4.3, "install_count": 6100, "icon": "LS",
        "long_description": "Connect Lightspeed retail and restaurant POS data. Import sales, track inventory costs, manage supplier payments, and reconcile end-of-day settlements.",
        "features": ["Sales import", "Inventory cost tracking", "Supplier payment sync", "Multi-location support", "End-of-day reconciliation"],
        "setup_time": "15 minutes",
    },
    "stripe": {
        "rating": 4.7, "install_count": 19200, "icon": "ST",
        "long_description": "Comprehensive Stripe integration importing charges, subscriptions, refunds, disputes, and payouts. Revenue recognition, fee tracking, and multi-currency support built in.",
        "features": ["Charge import", "Subscription tracking", "Refund processing", "Dispute monitoring", "Payout reconciliation", "Revenue recognition"],
        "setup_time": "10 minutes",
    },
    "expensify": {
        "rating": 4.3, "install_count": 9800, "icon": "EX",
        "long_description": "Import expense reports, receipt scans, and corporate card transactions from Expensify. Automated categorization and approval workflow integration.",
        "features": ["Expense report import", "Receipt OCR data", "Corporate card sync", "Approval workflows", "Policy enforcement"],
        "setup_time": "10 minutes",
    },
    "dext": {
        "rating": 4.5, "install_count": 11200, "icon": "DX",
        "long_description": "Automated receipt and invoice data extraction. Dext captures, reads, and categorizes financial documents, pushing clean data into your accounting ledger.",
        "features": ["Receipt scanning", "Invoice extraction", "Auto-categorization", "Supplier detection", "Multi-currency", "Bank statement OCR"],
        "setup_time": "10 minutes",
    },
    "docusign": {
        "rating": 4.4, "install_count": 8700, "icon": "DS",
        "long_description": "Send engagement letters, contracts, and authorization forms for e-signature via DocuSign. Track signing status and auto-file completed documents.",
        "features": ["E-signature requests", "Template library", "Signing status tracking", "Auto-filing", "Audit trail"],
        "setup_time": "10 minutes",
    },
    "karbon": {
        "rating": 4.6, "install_count": 7200, "icon": "KB",
        "long_description": "Practice management integration for accounting firms. Sync client data, track job progress, manage workflows, and automate recurring tasks between Karbon and DavenRoe.",
        "features": ["Client data sync", "Job tracking", "Workflow automation", "Email integration", "Time tracking import"],
        "setup_time": "15 minutes",
    },
    "fathom": {
        "rating": 4.5, "install_count": 6800, "icon": "FM",
        "long_description": "Export financial data to Fathom for advanced analysis, KPI tracking, and presentation-ready reporting. Automated data sync keeps reports current.",
        "features": ["Financial data export", "KPI dashboards", "Consolidated reporting", "Budget vs actual", "Trend analysis"],
        "setup_time": "10 minutes",
    },
    "cin7": {
        "rating": 4.3, "install_count": 5900, "icon": "C7",
        "long_description": "Advanced inventory and order management integration. Sync stock levels, purchase orders, sales orders, and cost of goods sold automatically.",
        "features": ["Stock level sync", "Purchase order import", "Sales order tracking", "COGS calculation", "Multi-warehouse support"],
        "setup_time": "20 minutes",
    },
    "ignition": {
        "rating": 4.5, "install_count": 6400, "icon": "IG",
        "long_description": "Proposals, engagement letters, and billing automation. Create professional proposals, collect e-signatures, and auto-generate recurring invoices.",
        "features": ["Proposal builder", "E-signature collection", "Recurring billing", "Payment collection", "Client onboarding"],
        "setup_time": "15 minutes",
    },
    "avalara": {
        "rating": 4.2, "install_count": 7800, "icon": "AV",
        "long_description": "Automated US sales tax calculation and compliance. Real-time tax rates for 14,000+ jurisdictions with automated filing and remittance.",
        "features": ["Real-time tax calculation", "Multi-state compliance", "Automated filing", "Exemption management", "Audit support"],
        "setup_time": "25 minutes",
    },
    "harvest": {
        "rating": 4.3, "install_count": 5200, "icon": "HV",
        "long_description": "Import time entries and expenses from Harvest. Automatically generate invoices from tracked time, allocate labor costs, and monitor project profitability.",
        "features": ["Time entry import", "Expense sync", "Invoice generation", "Project cost tracking", "Team utilization reporting"],
        "setup_time": "10 minutes",
    },
}

# Default metadata for apps without specific extended info
DEFAULT_METADATA = {
    "rating": 4.2, "install_count": 3500, "icon": "AP",
    "long_description": "",
    "features": ["Data synchronization", "Automated import", "Real-time updates"],
    "setup_time": "15 minutes",
}

CATEGORY_LABELS = {
    "crm_sales": "CRM & Sales",
    "inventory_ecommerce": "E-commerce & Inventory",
    "payroll_hr": "Payroll & HR",
    "payments": "Payments & Billing",
    "documents": "Documents & E-Signature",
    "tax_compliance": "Tax & Compliance",
    "reporting": "Reporting & Analytics",
    "communication": "Productivity & Communication",
    "banking": "Banking & Open Finance",
    "cloud_storage": "Cloud Storage",
    "time_tracking": "Project & Time Tracking",
    "expenses": "Expense Management",
    "practice_management": "Practice Management",
}


def _enrich_app(app: MarketplaceApp) -> dict:
    """Merge base catalog data with extended metadata."""
    base = app.to_dict()
    meta = APP_METADATA.get(app.id, DEFAULT_METADATA)
    base["rating"] = meta.get("rating", DEFAULT_METADATA["rating"])
    base["install_count"] = meta.get("install_count", DEFAULT_METADATA["install_count"])
    base["icon"] = meta.get("icon", app.name[:2].upper())
    base["long_description"] = meta.get("long_description") or app.description
    base["features"] = meta.get("features", DEFAULT_METADATA["features"])
    base["setup_time"] = meta.get("setup_time", DEFAULT_METADATA["setup_time"])
    base["category_label"] = CATEGORY_LABELS.get(app.category, app.category.replace("_", " ").title())
    return base


def _get_user_id(user: User) -> str:
    return str(user.id) if hasattr(user, 'id') else "default"


# ── Endpoints ───────────────────────────────────────────────


@router.get("/apps")
async def list_apps(
    category: str | None = None,
    search: str | None = None,
    featured: bool = False,
    jurisdiction: str | None = None,
    user: User = Depends(get_current_user),
):
    """List all marketplace apps with optional filtering by category, search, jurisdiction, or featured status."""
    apps = marketplace.list_all(
        category=category,
        jurisdiction=jurisdiction,
        search=search,
        featured_only=featured,
    )
    user_id = _get_user_id(user)
    installed_ids = set(_installed_apps.get(user_id, {}).keys())
    enriched = []
    for app in apps:
        data = _enrich_app(app)
        data["installed"] = app.id in installed_ids
        enriched.append(data)
    return {"apps": enriched, "total": len(enriched)}


@router.get("/categories")
async def list_categories(user: User = Depends(get_current_user)):
    """List all available marketplace categories with counts."""
    raw = marketplace.list_categories()
    categories = []
    for cat in raw:
        categories.append({
            "id": cat["category"],
            "label": CATEGORY_LABELS.get(cat["category"], cat["category"].replace("_", " ").title()),
            "count": cat["count"],
        })
    return {"categories": categories}


@router.get("/installed")
async def list_installed(user: User = Depends(get_current_user)):
    """List all apps installed by the current user."""
    user_id = _get_user_id(user)
    installed = _installed_apps.get(user_id, {})
    result = []
    for app_id, install_info in installed.items():
        app = marketplace.get(app_id)
        if app:
            data = _enrich_app(app)
            data["installed"] = True
            data["installed_at"] = install_info.get("installed_at")
            data["status"] = install_info.get("status", "active")
            result.append(data)
    return {"apps": result, "total": len(result)}


@router.get("/apps/{app_id}")
async def get_app_detail(app_id: str, user: User = Depends(get_current_user)):
    """Get detailed information about a specific marketplace app."""
    app = marketplace.get(app_id)
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    user_id = _get_user_id(user)
    data = _enrich_app(app)
    data["installed"] = app_id in _installed_apps.get(user_id, {})
    install_info = _installed_apps.get(user_id, {}).get(app_id)
    if install_info:
        data["installed_at"] = install_info.get("installed_at")
        data["status"] = install_info.get("status", "active")
    return data


class InstallResponse(BaseModel):
    message: str
    app_id: str
    status: str


@router.post("/apps/{app_id}/install")
async def install_app(app_id: str, user: User = Depends(get_current_user)):
    """Install a marketplace app for the current user."""
    app = marketplace.get(app_id)
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    user_id = _get_user_id(user)
    if user_id not in _installed_apps:
        _installed_apps[user_id] = {}
    if app_id in _installed_apps[user_id]:
        raise HTTPException(status_code=409, detail="App already installed")
    _installed_apps[user_id][app_id] = {
        "installed_at": datetime.utcnow().isoformat(),
        "status": "active",
    }
    return {
        "message": f"{app.name} installed successfully",
        "app_id": app_id,
        "status": "active",
        "installed_at": _installed_apps[user_id][app_id]["installed_at"],
    }


@router.delete("/apps/{app_id}/uninstall")
async def uninstall_app(app_id: str, user: User = Depends(get_current_user)):
    """Uninstall a marketplace app for the current user."""
    app = marketplace.get(app_id)
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    user_id = _get_user_id(user)
    if app_id not in _installed_apps.get(user_id, {}):
        raise HTTPException(status_code=404, detail="App is not installed")
    del _installed_apps[user_id][app_id]
    return {
        "message": f"{app.name} uninstalled successfully",
        "app_id": app_id,
        "status": "removed",
    }


@router.get("/summary")
async def marketplace_summary(user: User = Depends(get_current_user)):
    """Get marketplace summary statistics."""
    user_id = _get_user_id(user)
    summary = marketplace.summary()
    summary["installed_count"] = len(_installed_apps.get(user_id, {}))
    return summary

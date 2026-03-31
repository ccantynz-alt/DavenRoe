"""Integrations Hub — all third-party connections in one place.

An accounting firm needs connections to:
1. Video conferencing (Zoom, Teams, Google Meet)
2. Cloud storage (Google Drive, OneDrive, Dropbox, SharePoint)
3. Email (Outlook, Gmail, SMTP)
4. Tax authority portals (ATO, IRS, IRD, HMRC)
5. CRM (HubSpot, Salesforce, Pipedrive)
6. Payment processors (Stripe, Square, PayPal)
7. Payroll systems (Gusto, Employment Hero, PaySauce)
8. Practice management (Karbon, Ignition, XPM)
9. E-signatures (DocuSign, Adobe Sign)
10. Accounting platforms (Xero, QuickBooks, MYOB — already in importer/exporter)

Each integration has a status, config, and API interface.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum


class IntegrationStatus(str, Enum):
    NOT_CONNECTED = "not_connected"
    CONNECTED = "connected"
    ERROR = "error"
    EXPIRED = "expired"
    PENDING = "pending"


class IntegrationCategory(str, Enum):
    VIDEO = "video_conferencing"
    CLOUD_STORAGE = "cloud_storage"
    EMAIL = "email"
    TAX_AUTHORITY = "tax_authority"
    CRM = "crm"
    PAYMENTS = "payments"
    PAYROLL = "payroll"
    PRACTICE_MANAGEMENT = "practice_management"
    E_SIGNATURE = "e_signature"
    ACCOUNTING = "accounting_platform"
    COMMUNICATION = "communication"


@dataclass
class Integration:
    """A single third-party integration."""
    id: str = ""
    name: str = ""
    description: str = ""
    category: IntegrationCategory = IntegrationCategory.ACCOUNTING
    provider: str = ""
    status: IntegrationStatus = IntegrationStatus.NOT_CONNECTED
    logo_url: str = ""

    # Connection
    auth_type: str = "oauth2"  # oauth2, api_key, webhook
    auth_url: str = ""
    scopes: list[str] = field(default_factory=list)
    config: dict = field(default_factory=dict)

    # Metadata
    connected_at: str = ""
    connected_by: str = ""
    last_sync: str = ""
    supported_jurisdictions: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "category": self.category.value if isinstance(self.category, IntegrationCategory) else self.category,
            "provider": self.provider,
            "status": self.status.value if isinstance(self.status, IntegrationStatus) else self.status,
            "auth_type": self.auth_type,
            "supported_jurisdictions": self.supported_jurisdictions,
            "connected_at": self.connected_at,
            "last_sync": self.last_sync,
        }


class IntegrationsHub:
    """Central registry of all available integrations."""

    def __init__(self):
        self._integrations: dict[str, Integration] = {}
        self._load_catalog()

    def _load_catalog(self):
        """Load all available integrations."""
        catalog = [
            # ── Video Conferencing ───────────────────────────
            Integration(
                id="zoom", name="Zoom", provider="Zoom Video Communications",
                category=IntegrationCategory.VIDEO,
                description="Schedule and join Zoom meetings directly from AlecRae",
                auth_type="oauth2",
                scopes=["meeting:write", "meeting:read", "user:read"],
                supported_jurisdictions=["US", "AU", "NZ", "GB"],
            ),
            Integration(
                id="ms_teams", name="Microsoft Teams", provider="Microsoft",
                category=IntegrationCategory.VIDEO,
                description="Schedule Teams calls and share files via SharePoint",
                auth_type="oauth2",
                scopes=["OnlineMeetings.ReadWrite", "Calendars.ReadWrite"],
                supported_jurisdictions=["US", "AU", "NZ", "GB"],
            ),
            Integration(
                id="google_meet", name="Google Meet", provider="Google",
                category=IntegrationCategory.VIDEO,
                description="Schedule Google Meet video calls with calendar integration",
                auth_type="oauth2",
                scopes=["calendar.events", "meetings.space.created"],
                supported_jurisdictions=["US", "AU", "NZ", "GB"],
            ),

            # ── Cloud Storage ────────────────────────────────
            Integration(
                id="google_drive", name="Google Drive", provider="Google",
                category=IntegrationCategory.CLOUD_STORAGE,
                description="Store and share documents via Google Drive",
                auth_type="oauth2",
                scopes=["drive.file", "drive.readonly"],
                supported_jurisdictions=["US", "AU", "NZ", "GB"],
            ),
            Integration(
                id="onedrive", name="OneDrive / SharePoint", provider="Microsoft",
                category=IntegrationCategory.CLOUD_STORAGE,
                description="Store documents in OneDrive or SharePoint",
                auth_type="oauth2",
                scopes=["Files.ReadWrite.All", "Sites.ReadWrite.All"],
                supported_jurisdictions=["US", "AU", "NZ", "GB"],
            ),
            Integration(
                id="dropbox", name="Dropbox", provider="Dropbox",
                category=IntegrationCategory.CLOUD_STORAGE,
                description="Sync and share files via Dropbox",
                auth_type="oauth2",
                scopes=["files.content.read", "files.content.write"],
                supported_jurisdictions=["US", "AU", "NZ", "GB"],
            ),

            # ── Email ────────────────────────────────────────
            Integration(
                id="outlook", name="Microsoft Outlook", provider="Microsoft",
                category=IntegrationCategory.EMAIL,
                description="Send emails and calendar invites via Outlook",
                auth_type="oauth2",
                scopes=["Mail.Send", "Calendars.ReadWrite"],
                supported_jurisdictions=["US", "AU", "NZ", "GB"],
            ),
            Integration(
                id="gmail", name="Gmail", provider="Google",
                category=IntegrationCategory.EMAIL,
                description="Send emails and calendar invites via Gmail",
                auth_type="oauth2",
                scopes=["gmail.send", "calendar.events"],
                supported_jurisdictions=["US", "AU", "NZ", "GB"],
            ),

            # ── Tax Authority Portals ────────────────────────
            Integration(
                id="ato_portal", name="ATO Online Services", provider="Australian Taxation Office",
                category=IntegrationCategory.TAX_AUTHORITY,
                description="Lodge BAS, tax returns, STP via ATO portal. Track ABN status and tax debt.",
                auth_type="oauth2",
                scopes=["bas.lodge", "taxreturn.lodge", "stp.submit"],
                supported_jurisdictions=["AU"],
            ),
            Integration(
                id="irs_efile", name="IRS e-File", provider="Internal Revenue Service",
                category=IntegrationCategory.TAX_AUTHORITY,
                description="File 1040, 1120, 1065, W-2, 1099 electronically",
                auth_type="api_key",
                scopes=["efile.submit", "transcript.request"],
                supported_jurisdictions=["US"],
            ),
            Integration(
                id="ird_gateway", name="IRD Gateway Services", provider="Inland Revenue NZ",
                category=IntegrationCategory.TAX_AUTHORITY,
                description="File GST returns, payday filing, income tax. Manage myIR for clients.",
                auth_type="oauth2",
                scopes=["gst.file", "payday.file", "incometax.file"],
                supported_jurisdictions=["NZ"],
            ),
            Integration(
                id="hmrc_mtd", name="HMRC Making Tax Digital", provider="HM Revenue & Customs",
                category=IntegrationCategory.TAX_AUTHORITY,
                description="Submit VAT returns and income tax updates via MTD",
                auth_type="oauth2",
                scopes=["write:vat", "read:vat", "write:self-assessment"],
                supported_jurisdictions=["GB"],
            ),

            # ── CRM ─────────────────────────────────────────
            Integration(
                id="hubspot", name="HubSpot CRM", provider="HubSpot",
                category=IntegrationCategory.CRM,
                description="Sync client contacts, track engagement, manage pipeline",
                auth_type="oauth2",
                scopes=["contacts", "deals", "timeline"],
                supported_jurisdictions=["US", "AU", "NZ", "GB"],
            ),
            Integration(
                id="salesforce", name="Salesforce", provider="Salesforce",
                category=IntegrationCategory.CRM,
                description="Enterprise CRM integration for large firms",
                auth_type="oauth2",
                scopes=["api", "refresh_token"],
                supported_jurisdictions=["US", "AU", "NZ", "GB"],
            ),

            # ── Payments ─────────────────────────────────────
            Integration(
                id="stripe", name="Stripe", provider="Stripe",
                category=IntegrationCategory.PAYMENTS,
                description="Accept client payments, auto-reconcile to invoices",
                auth_type="oauth2",
                scopes=["read_write"],
                supported_jurisdictions=["US", "AU", "NZ", "GB"],
            ),
            Integration(
                id="gocardless", name="GoCardless", provider="GoCardless",
                category=IntegrationCategory.PAYMENTS,
                description="Direct debit payments for recurring fees",
                auth_type="oauth2",
                scopes=["read_write"],
                supported_jurisdictions=["AU", "NZ", "GB"],
            ),

            # ── Payroll ──────────────────────────────────────
            Integration(
                id="employment_hero", name="Employment Hero", provider="Employment Hero",
                category=IntegrationCategory.PAYROLL,
                description="Payroll, HR, and leave management (AU/NZ/GB/SG/MY)",
                auth_type="oauth2",
                supported_jurisdictions=["AU", "NZ", "GB"],
            ),
            Integration(
                id="gusto", name="Gusto", provider="Gusto",
                category=IntegrationCategory.PAYROLL,
                description="US payroll, benefits, and HR",
                auth_type="oauth2",
                supported_jurisdictions=["US"],
            ),
            Integration(
                id="paysauce", name="PaySauce", provider="PaySauce",
                category=IntegrationCategory.PAYROLL,
                description="NZ payroll with payday filing",
                auth_type="api_key",
                supported_jurisdictions=["NZ"],
            ),

            # ── Practice Management ──────────────────────────
            Integration(
                id="karbon", name="Karbon", provider="Karbon",
                category=IntegrationCategory.PRACTICE_MANAGEMENT,
                description="Workflow, task management, and client communication for accounting firms",
                auth_type="oauth2",
                supported_jurisdictions=["US", "AU", "NZ", "GB"],
            ),
            Integration(
                id="ignition", name="Ignition (Practice Ignition)", provider="Ignition",
                category=IntegrationCategory.PRACTICE_MANAGEMENT,
                description="Engagement letters, proposals, and billing",
                auth_type="oauth2",
                supported_jurisdictions=["US", "AU", "NZ", "GB"],
            ),
            Integration(
                id="xero_practice_manager", name="Xero Practice Manager (XPM)", provider="Xero",
                category=IntegrationCategory.PRACTICE_MANAGEMENT,
                description="Job management, time tracking, and invoicing for practices",
                auth_type="oauth2",
                supported_jurisdictions=["AU", "NZ", "GB"],
            ),

            # ── E-Signatures ─────────────────────────────────
            Integration(
                id="docusign", name="DocuSign", provider="DocuSign",
                category=IntegrationCategory.E_SIGNATURE,
                description="Send engagement letters, tax returns, and documents for electronic signature",
                auth_type="oauth2",
                scopes=["signature", "impersonation"],
                supported_jurisdictions=["US", "AU", "NZ", "GB"],
            ),
            Integration(
                id="adobe_sign", name="Adobe Acrobat Sign", provider="Adobe",
                category=IntegrationCategory.E_SIGNATURE,
                description="Electronic signatures integrated with Adobe PDF workflows",
                auth_type="oauth2",
                supported_jurisdictions=["US", "AU", "NZ", "GB"],
            ),

            # ── Communication ────────────────────────────────
            Integration(
                id="slack", name="Slack", provider="Slack (Salesforce)",
                category=IntegrationCategory.COMMUNICATION,
                description="Post notifications, alerts, and reports to Slack channels",
                auth_type="oauth2",
                scopes=["chat:write", "channels:read"],
                supported_jurisdictions=["US", "AU", "NZ", "GB"],
            ),

            # ── Accounting Platforms ─────────────────────────
            Integration(
                id="xero", name="Xero", provider="Xero",
                category=IntegrationCategory.ACCOUNTING,
                description="Two-way sync with Xero — import/export transactions, contacts, invoices",
                auth_type="oauth2",
                scopes=["accounting.transactions", "accounting.contacts", "accounting.settings"],
                supported_jurisdictions=["AU", "NZ", "GB", "US"],
            ),
            Integration(
                id="quickbooks", name="QuickBooks Online", provider="Intuit",
                category=IntegrationCategory.ACCOUNTING,
                description="Two-way sync with QuickBooks — transactions, customers, vendors",
                auth_type="oauth2",
                scopes=["com.intuit.quickbooks.accounting"],
                supported_jurisdictions=["US", "AU", "GB"],
            ),
            Integration(
                id="myob", name="MYOB Business", provider="MYOB",
                category=IntegrationCategory.ACCOUNTING,
                description="Sync with MYOB — general ledger, contacts, tax codes",
                auth_type="oauth2",
                supported_jurisdictions=["AU", "NZ"],
            ),
        ]

        for integration in catalog:
            self._integrations[integration.id] = integration

    # ── Operations ───────────────────────────────────────────

    def list_all(self, category: str | None = None, jurisdiction: str | None = None) -> list[Integration]:
        results = list(self._integrations.values())
        if category:
            results = [i for i in results if (i.category.value if isinstance(i.category, IntegrationCategory) else i.category) == category]
        if jurisdiction:
            results = [i for i in results if jurisdiction.upper() in i.supported_jurisdictions]
        return sorted(results, key=lambda i: (i.category.value if isinstance(i.category, IntegrationCategory) else i.category, i.name))

    def get(self, integration_id: str) -> Integration | None:
        return self._integrations.get(integration_id)

    def connect(self, integration_id: str, connected_by: str, config: dict | None = None) -> dict:
        """Initiate connection to an integration."""
        integration = self._integrations.get(integration_id)
        if not integration:
            return {"status": "error", "message": f"Integration '{integration_id}' not found"}

        integration.status = IntegrationStatus.CONNECTED
        integration.connected_at = datetime.utcnow().isoformat()
        integration.connected_by = connected_by
        if config:
            integration.config = config

        return {
            "status": "connected",
            "integration": integration.name,
            "auth_type": integration.auth_type,
            "auth_url": integration.auth_url or f"https://auth.astra.accounting/connect/{integration_id}",
            "scopes": integration.scopes,
        }

    def disconnect(self, integration_id: str) -> bool:
        integration = self._integrations.get(integration_id)
        if integration:
            integration.status = IntegrationStatus.NOT_CONNECTED
            integration.config = {}
            return True
        return False

    def get_connected(self) -> list[Integration]:
        return [i for i in self._integrations.values() if i.status == IntegrationStatus.CONNECTED]

    def list_categories(self) -> list[dict]:
        categories = {}
        for i in self._integrations.values():
            cat = i.category.value if isinstance(i.category, IntegrationCategory) else i.category
            if cat not in categories:
                categories[cat] = {"category": cat, "count": 0, "connected": 0}
            categories[cat]["count"] += 1
            if i.status == IntegrationStatus.CONNECTED:
                categories[cat]["connected"] += 1
        return sorted(categories.values(), key=lambda c: c["category"])

    def summary(self) -> dict:
        total = len(self._integrations)
        connected = len(self.get_connected())
        return {
            "total_integrations": total,
            "connected": connected,
            "categories": self.list_categories(),
        }

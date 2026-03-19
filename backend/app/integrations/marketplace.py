"""App Marketplace — expanded catalog of 100+ integrations.

Xero has 1,000+ apps. We can't match that overnight, but we can
catalog every integration category an accounting firm needs and
build the registry for partners to plug into.

This supplements the integrations hub (28 direct integrations)
with a broader marketplace of partner apps.
"""

from dataclasses import dataclass, field


@dataclass
class MarketplaceApp:
    id: str = ""
    name: str = ""
    category: str = ""
    description: str = ""
    provider: str = ""
    pricing: str = ""
    jurisdictions: list[str] = field(default_factory=list)
    url: str = ""
    featured: bool = False

    def to_dict(self) -> dict:
        return {
            "id": self.id, "name": self.name, "category": self.category,
            "description": self.description, "provider": self.provider,
            "pricing": self.pricing, "jurisdictions": self.jurisdictions,
            "featured": self.featured,
        }


# Complete marketplace catalog
MARKETPLACE_APPS = [
    # ── Payroll & HR (15) ────────────────────────────────────
    MarketplaceApp("employment_hero", "Employment Hero", "payroll_hr", "Payroll, HR, and benefits platform", "Employment Hero", "From $8/employee/mo", ["AU", "NZ", "GB", "SG", "MY"], featured=True),
    MarketplaceApp("gusto", "Gusto", "payroll_hr", "Full-service US payroll with tax filing", "Gusto", "From $40/mo + $6/person", ["US"], featured=True),
    MarketplaceApp("paysauce", "PaySauce", "payroll_hr", "NZ payroll with payday filing", "PaySauce", "From $4/employee/mo", ["NZ"]),
    MarketplaceApp("deputy", "Deputy", "payroll_hr", "Workforce management, scheduling, timesheet", "Deputy", "From $4.50/user/mo", ["US", "AU", "GB"]),
    MarketplaceApp("tanda", "Tanda", "payroll_hr", "AU workforce management with award interpretation", "Tanda", "Contact for pricing", ["AU"]),
    MarketplaceApp("keypay", "KeyPay", "payroll_hr", "Cloud payroll for AU/NZ/GB/SG/MY", "KeyPay", "From $4/employee/mo", ["AU", "NZ", "GB", "SG", "MY"]),
    MarketplaceApp("adp", "ADP", "payroll_hr", "Enterprise payroll and HR", "ADP", "Contact for pricing", ["US", "GB"]),
    MarketplaceApp("bamboohr", "BambooHR", "payroll_hr", "HR management for SMBs", "BambooHR", "Contact for pricing", ["US", "GB", "AU"]),
    MarketplaceApp("rippling", "Rippling", "payroll_hr", "Unified HR, IT, and payroll", "Rippling", "From $8/user/mo", ["US"]),
    MarketplaceApp("paychex", "Paychex", "payroll_hr", "Payroll and HR services", "Paychex", "Contact for pricing", ["US"]),
    MarketplaceApp("sage_payroll", "Sage Payroll", "payroll_hr", "UK payroll with RTI", "Sage", "From £7/mo", ["GB"]),
    MarketplaceApp("brightpay", "BrightPay", "payroll_hr", "UK/IE payroll software", "Bright", "From £139/year", ["GB", "IE"]),
    MarketplaceApp("smartly", "Smartly", "payroll_hr", "NZ payroll with holiday pay", "Smartly", "From $5/employee/mo", ["NZ"]),
    MarketplaceApp("enablehr", "enableHR", "payroll_hr", "AU HR compliance and onboarding", "enableHR", "Contact for pricing", ["AU"]),
    MarketplaceApp("flare", "Flare HR", "payroll_hr", "Employee benefits and onboarding AU", "Flare", "Contact for pricing", ["AU"]),

    # ── Inventory & eCommerce (12) ───────────────────────────
    MarketplaceApp("cin7", "Cin7 (DEAR Inventory)", "inventory_ecommerce", "Advanced inventory and order management", "Cin7", "From $349/mo", ["US", "AU", "NZ", "GB"], featured=True),
    MarketplaceApp("shopify", "Shopify", "inventory_ecommerce", "eCommerce platform with POS", "Shopify", "From $39/mo", ["US", "AU", "NZ", "GB"]),
    MarketplaceApp("woocommerce", "WooCommerce", "inventory_ecommerce", "WordPress eCommerce plugin", "Automattic", "Free + extensions", ["US", "AU", "NZ", "GB"]),
    MarketplaceApp("unleashed", "Unleashed", "inventory_ecommerce", "Inventory management for manufacturers", "Unleashed", "From $349/mo", ["AU", "NZ", "GB", "US"]),
    MarketplaceApp("tradegecko", "QuickBooks Commerce", "inventory_ecommerce", "Multi-channel inventory", "Intuit", "From $39/mo", ["US", "AU", "GB"]),
    MarketplaceApp("square", "Square", "inventory_ecommerce", "POS and payment processing", "Square", "2.6% + 10¢ per transaction", ["US", "AU", "GB"]),
    MarketplaceApp("lightspeed", "Lightspeed", "inventory_ecommerce", "Retail and restaurant POS", "Lightspeed", "From $89/mo", ["US", "AU", "GB"]),
    MarketplaceApp("vend", "Lightspeed Retail (Vend)", "inventory_ecommerce", "Retail POS popular in NZ/AU", "Lightspeed", "From $119/mo", ["AU", "NZ"]),
    MarketplaceApp("amazon_seller", "Amazon Seller Central", "inventory_ecommerce", "Amazon marketplace integration", "Amazon", "From $39.99/mo", ["US", "AU", "GB"]),
    MarketplaceApp("ebay", "eBay", "inventory_ecommerce", "eBay marketplace integration", "eBay", "Listing fees vary", ["US", "AU", "GB"]),
    MarketplaceApp("bigcommerce", "BigCommerce", "inventory_ecommerce", "Enterprise eCommerce platform", "BigCommerce", "From $39/mo", ["US", "AU", "GB"]),
    MarketplaceApp("fishbowl", "Fishbowl Inventory", "inventory_ecommerce", "Manufacturing and warehouse management", "Fishbowl", "From $349/mo", ["US"]),

    # ── CRM & Sales (8) ─────────────────────────────────────
    MarketplaceApp("hubspot", "HubSpot CRM", "crm_sales", "CRM with marketing and sales tools", "HubSpot", "Free tier + paid", ["US", "AU", "NZ", "GB"], featured=True),
    MarketplaceApp("salesforce", "Salesforce", "crm_sales", "Enterprise CRM platform", "Salesforce", "From $25/user/mo", ["US", "AU", "NZ", "GB"]),
    MarketplaceApp("pipedrive", "Pipedrive", "crm_sales", "Sales-focused CRM for SMBs", "Pipedrive", "From $14/user/mo", ["US", "AU", "NZ", "GB"]),
    MarketplaceApp("zoho_crm", "Zoho CRM", "crm_sales", "Full CRM suite", "Zoho", "Free tier + paid", ["US", "AU", "NZ", "GB"]),
    MarketplaceApp("capsule", "Capsule CRM", "crm_sales", "Simple CRM for small teams", "Capsule", "From $18/user/mo", ["US", "AU", "NZ", "GB"]),
    MarketplaceApp("copper", "Copper CRM", "crm_sales", "Google Workspace-native CRM", "Copper", "From $29/user/mo", ["US", "AU", "GB"]),
    MarketplaceApp("insightly", "Insightly", "crm_sales", "CRM with project management", "Insightly", "From $29/user/mo", ["US", "AU", "GB"]),
    MarketplaceApp("activecampaign", "ActiveCampaign", "crm_sales", "Email marketing and CRM automation", "ActiveCampaign", "From $29/mo", ["US", "AU", "GB"]),

    # ── Practice Management (8) ──────────────────────────────
    MarketplaceApp("karbon", "Karbon", "practice_management", "Workflow and practice management for firms", "Karbon", "From $59/user/mo", ["US", "AU", "NZ", "GB"], featured=True),
    MarketplaceApp("ignition", "Ignition", "practice_management", "Proposals, engagement letters, billing", "Ignition", "From $99/mo", ["US", "AU", "NZ", "GB"]),
    MarketplaceApp("xpm", "Xero Practice Manager", "practice_management", "Job management and time tracking", "Xero", "From $10/mo", ["AU", "NZ", "GB"]),
    MarketplaceApp("canopy", "Canopy", "practice_management", "US tax practice management", "Canopy", "From $45/user/mo", ["US"]),
    MarketplaceApp("taxdome", "TaxDome", "practice_management", "All-in-one practice management", "TaxDome", "From $50/mo", ["US", "AU", "GB"]),
    MarketplaceApp("jetpack_workflow", "Jetpack Workflow", "practice_management", "Workflow automation for accountants", "Jetpack Workflow", "From $36/user/mo", ["US"]),
    MarketplaceApp("financial_cents", "Financial Cents", "practice_management", "Practice management for bookkeepers", "Financial Cents", "From $39/user/mo", ["US"]),
    MarketplaceApp("suitedash", "SuiteDash", "practice_management", "Client portal and project management", "SuiteDash", "From $19/mo", ["US", "AU", "GB"]),

    # ── Payments & Billing (8) ───────────────────────────────
    MarketplaceApp("stripe", "Stripe", "payments", "Online payment processing", "Stripe", "2.9% + 30¢", ["US", "AU", "NZ", "GB"], featured=True),
    MarketplaceApp("gocardless", "GoCardless", "payments", "Direct debit payments", "GoCardless", "1% + 20p (capped)", ["AU", "NZ", "GB"]),
    MarketplaceApp("paypal", "PayPal", "payments", "Online payments and invoicing", "PayPal", "2.9% + 30¢", ["US", "AU", "NZ", "GB"]),
    MarketplaceApp("wise", "Wise (TransferWise)", "payments", "International money transfers", "Wise", "Low FX margins", ["US", "AU", "NZ", "GB"]),
    MarketplaceApp("airwallex", "Airwallex", "payments", "Global payment infrastructure", "Airwallex", "Contact for pricing", ["AU", "GB", "US"]),
    MarketplaceApp("pinch", "Pinch Payments", "payments", "AU direct debit and card payments", "Pinch", "From 1.4% per transaction", ["AU"]),
    MarketplaceApp("ezidebit", "Ezidebit", "payments", "AU/NZ recurring payment solutions", "Ezidebit", "Contact for pricing", ["AU", "NZ"]),
    MarketplaceApp("eway", "Eway", "payments", "AU payment gateway", "Eway", "1.0% + A$0.20", ["AU", "NZ"]),

    # ── Document & E-Signature (8) ───────────────────────────
    MarketplaceApp("docusign", "DocuSign", "documents", "Electronic signatures", "DocuSign", "From $10/mo", ["US", "AU", "NZ", "GB"], featured=True),
    MarketplaceApp("adobe_sign", "Adobe Acrobat Sign", "documents", "E-signatures with PDF workflows", "Adobe", "From $12.99/mo", ["US", "AU", "NZ", "GB"]),
    MarketplaceApp("pandadoc", "PandaDoc", "documents", "Document automation and e-sign", "PandaDoc", "From $35/user/mo", ["US", "AU", "GB"]),
    MarketplaceApp("dext", "Dext (Receipt Bank)", "documents", "Receipt and invoice data extraction", "Dext", "From $24/mo", ["US", "AU", "NZ", "GB"], featured=True),
    MarketplaceApp("hubdoc", "Hubdoc", "documents", "Document collection and OCR", "Xero", "Included with Xero", ["US", "AU", "NZ", "GB"]),
    MarketplaceApp("autoentry", "AutoEntry", "documents", "Automated data entry from documents", "Sage", "From $24/mo", ["US", "AU", "NZ", "GB"]),
    MarketplaceApp("smartvault", "SmartVault", "documents", "Secure document storage for accountants", "SmartVault", "From $28/user/mo", ["US"]),
    MarketplaceApp("sharefile", "ShareFile", "documents", "Secure file sharing and storage", "Citrix", "From $10/user/mo", ["US", "AU", "GB"]),

    # ── Tax & Compliance (10) ────────────────────────────────
    MarketplaceApp("ato_portal", "ATO Online Services", "tax_compliance", "Lodge BAS, tax returns, STP", "ATO", "Free", ["AU"]),
    MarketplaceApp("irs_efile", "IRS e-File", "tax_compliance", "Electronic tax return filing", "IRS", "Free", ["US"]),
    MarketplaceApp("ird_gateway", "IRD Gateway Services", "tax_compliance", "GST, payday filing, income tax", "IRD", "Free", ["NZ"]),
    MarketplaceApp("hmrc_mtd", "HMRC Making Tax Digital", "tax_compliance", "VAT and income tax digital filing", "HMRC", "Free", ["GB"]),
    MarketplaceApp("avalara", "Avalara", "tax_compliance", "Automated sales tax calculation (US)", "Avalara", "Contact for pricing", ["US"]),
    MarketplaceApp("taxjar", "TaxJar", "tax_compliance", "US sales tax automation", "Stripe", "From $19/mo", ["US"]),
    MarketplaceApp("wolters_kluwer", "CCH iFirm", "tax_compliance", "Tax compliance and lodgment (AU)", "Wolters Kluwer", "Contact for pricing", ["AU", "NZ"]),
    MarketplaceApp("bgl", "BGL Corporate Solutions", "tax_compliance", "SMSF administration and ASIC compliance", "BGL", "Contact for pricing", ["AU"]),
    MarketplaceApp("class_super", "Class Super", "tax_compliance", "SMSF accounting and compliance", "Class/HUB24", "From $45/fund/mo", ["AU"]),
    MarketplaceApp("tax_calc", "TaxCalc", "tax_compliance", "UK self-assessment and accounts production", "TaxCalc", "From £145/year", ["GB"]),

    # ── Reporting & Analytics (6) ────────────────────────────
    MarketplaceApp("fathom", "Fathom", "reporting", "Financial analysis and reporting", "Fathom", "From $39/mo", ["US", "AU", "NZ", "GB"], featured=True),
    MarketplaceApp("spotlight", "Spotlight Reporting", "reporting", "Forecasting and board reporting", "Spotlight", "From $49/mo", ["AU", "NZ", "GB"]),
    MarketplaceApp("futrli", "Futrli", "reporting", "Business advisory dashboards", "Futrli/Sage", "From $40/mo", ["US", "AU", "GB"]),
    MarketplaceApp("syft", "Syft Analytics", "reporting", "Multi-entity financial analytics", "Syft", "From $29/mo", ["AU", "NZ", "GB", "US"]),
    MarketplaceApp("reach_reporting", "Reach Reporting", "reporting", "Visual financial dashboards", "Reach", "From $99/mo", ["US", "AU", "GB"]),
    MarketplaceApp("jirav", "Jirav", "reporting", "FP&A and workforce planning", "Jirav", "From $250/mo", ["US"]),

    # ── Communication & Productivity (8) ─────────────────────
    MarketplaceApp("slack", "Slack", "communication", "Team messaging platform", "Salesforce", "Free tier + paid", ["US", "AU", "NZ", "GB"]),
    MarketplaceApp("ms_teams", "Microsoft Teams", "communication", "Video calls and team chat", "Microsoft", "Included with M365", ["US", "AU", "NZ", "GB"]),
    MarketplaceApp("zoom", "Zoom", "communication", "Video conferencing", "Zoom", "Free tier + paid", ["US", "AU", "NZ", "GB"]),
    MarketplaceApp("google_workspace", "Google Workspace", "communication", "Gmail, Drive, Calendar, Meet", "Google", "From $6/user/mo", ["US", "AU", "NZ", "GB"]),
    MarketplaceApp("microsoft_365", "Microsoft 365", "communication", "Outlook, OneDrive, Teams, Excel", "Microsoft", "From $6/user/mo", ["US", "AU", "NZ", "GB"]),
    MarketplaceApp("calendly", "Calendly", "communication", "Online appointment scheduling", "Calendly", "Free tier + paid", ["US", "AU", "NZ", "GB"]),
    MarketplaceApp("loom", "Loom", "communication", "Async video messaging", "Loom", "Free tier + paid", ["US", "AU", "NZ", "GB"]),
    MarketplaceApp("notion", "Notion", "communication", "Team wiki and project management", "Notion", "Free tier + paid", ["US", "AU", "NZ", "GB"]),

    # ── Banking & Fintech (6) ────────────────────────────────
    MarketplaceApp("plaid", "Plaid", "banking", "Bank feed aggregation (US, CA)", "Plaid", "API pricing", ["US", "CA"]),
    MarketplaceApp("basiq", "Basiq", "banking", "Open banking data (AU, NZ)", "Basiq", "API pricing", ["AU", "NZ"]),
    MarketplaceApp("truelayer", "TrueLayer", "banking", "Open banking (UK, EU)", "TrueLayer", "API pricing", ["GB", "IE", "EU"]),
    MarketplaceApp("yodlee", "Yodlee (Envestnet)", "banking", "Financial data aggregation", "Envestnet", "API pricing", ["US", "AU", "GB"]),
    MarketplaceApp("mx", "MX", "banking", "Financial data connectivity", "MX", "API pricing", ["US"]),
    MarketplaceApp("akahu", "Akahu", "banking", "NZ open finance platform", "Akahu", "API pricing", ["NZ"]),

    # ── Cloud Storage (5) ────────────────────────────────────
    MarketplaceApp("google_drive", "Google Drive", "cloud_storage", "Cloud file storage", "Google", "15GB free + paid", ["US", "AU", "NZ", "GB"]),
    MarketplaceApp("onedrive", "OneDrive", "cloud_storage", "Microsoft cloud storage", "Microsoft", "5GB free + paid", ["US", "AU", "NZ", "GB"]),
    MarketplaceApp("dropbox", "Dropbox", "cloud_storage", "File sync and sharing", "Dropbox", "From $11.99/mo", ["US", "AU", "NZ", "GB"]),
    MarketplaceApp("box", "Box", "cloud_storage", "Enterprise content management", "Box", "From $15/user/mo", ["US", "AU", "GB"]),
    MarketplaceApp("sharepoint", "SharePoint", "cloud_storage", "Intranet and document management", "Microsoft", "Included with M365", ["US", "AU", "NZ", "GB"]),

    # ── Project & Time Tracking (6) ──────────────────────────
    MarketplaceApp("harvest", "Harvest", "time_tracking", "Time tracking and invoicing", "Harvest", "From $10.80/user/mo", ["US", "AU", "NZ", "GB"]),
    MarketplaceApp("toggl", "Toggl Track", "time_tracking", "Simple time tracking", "Toggl", "Free tier + paid", ["US", "AU", "NZ", "GB"]),
    MarketplaceApp("clockify", "Clockify", "time_tracking", "Free time tracker for teams", "Clockify", "Free tier + paid", ["US", "AU", "NZ", "GB"]),
    MarketplaceApp("asana", "Asana", "time_tracking", "Project management", "Asana", "Free tier + paid", ["US", "AU", "NZ", "GB"]),
    MarketplaceApp("monday", "Monday.com", "time_tracking", "Work management platform", "Monday", "From $8/user/mo", ["US", "AU", "NZ", "GB"]),
    MarketplaceApp("wrike", "Wrike", "time_tracking", "Professional project management", "Wrike", "Free tier + paid", ["US", "AU", "GB"]),

    # ── Expense Management (4) ───────────────────────────────
    MarketplaceApp("expensify", "Expensify", "expenses", "Receipt scanning and expense reports", "Expensify", "From $5/user/mo", ["US", "AU", "NZ", "GB"], featured=True),
    MarketplaceApp("spendesk", "Spendesk", "expenses", "Spend management platform", "Spendesk", "Contact for pricing", ["US", "GB"]),
    MarketplaceApp("pleo", "Pleo", "expenses", "Smart company cards with auto-categorization", "Pleo", "Free tier + paid", ["GB", "DK", "SE", "DE"]),
    MarketplaceApp("divipay", "DiviPay", "expenses", "AU corporate cards and expense management", "DiviPay", "From $25/mo", ["AU"]),
]


class Marketplace:
    """App marketplace with search and filtering."""

    def __init__(self):
        self._apps = {app.id: app for app in MARKETPLACE_APPS}

    def list_all(self, category: str | None = None, jurisdiction: str | None = None,
                  search: str | None = None, featured_only: bool = False) -> list[MarketplaceApp]:
        results = list(self._apps.values())
        if category:
            results = [a for a in results if a.category == category]
        if jurisdiction:
            results = [a for a in results if jurisdiction.upper() in a.jurisdictions or "EU" in a.jurisdictions]
        if search:
            q = search.lower()
            results = [a for a in results if q in a.name.lower() or q in a.description.lower() or q in a.category.lower()]
        if featured_only:
            results = [a for a in results if a.featured]
        return sorted(results, key=lambda a: (a.category, a.name))

    def get(self, app_id: str) -> MarketplaceApp | None:
        return self._apps.get(app_id)

    def list_categories(self) -> list[dict]:
        categories = {}
        for app in self._apps.values():
            if app.category not in categories:
                categories[app.category] = 0
            categories[app.category] += 1
        return [{"category": k, "count": v} for k, v in sorted(categories.items())]

    def summary(self) -> dict:
        return {
            "total_apps": len(self._apps),
            "categories": len(set(a.category for a in self._apps.values())),
            "featured": sum(1 for a in self._apps.values() if a.featured),
            "by_category": self.list_categories(),
        }

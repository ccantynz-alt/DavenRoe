# Ledger.AI (Astra) - Development Standards

## Zero-Tolerance Frontend Policy

This is a live, customer-facing product competing against Xero, QuickBooks, MYOB, Sage, and FreshBooks. First impressions are everything — visitors decide in 30 seconds.

### Rules (Non-Negotiable)

1. **No broken links.** Every link must go somewhere real. If it can't, remove it.
2. **No 404 pages.** If a route exists, it must render real content.
3. **No "Coming Soon" or placeholder content.** Either build it or take it away.
4. **No lorem ipsum.** All text must be real, professional copy.
5. **No `href="#"` links.** Every anchor must navigate to a real destination.
6. **No empty states that look broken.** Empty states must have clear CTAs and look intentional.
7. **Fix on sight.** If you encounter anything that violates these rules while working, fix it immediately. No asking for permission. No deferring. Just fix it.
8. **No stub pages.** Every page in the navigation must be fully functional.
9. **No console errors in production.** Clean console output only.
10. **No dead imports or unused code** that suggests incomplete work.

### Quality Bar

- Every page must look like it belongs on a $10M SaaS product
- Every interaction must feel polished and responsive
- Every feature shown must actually work
- Copy must be professional, confident, and specific (not generic marketing fluff)
- Loading states must be smooth, not jarring
- Error states must be helpful, not scary

### Competitive Context

We compete with: Xero (4.6M subscribers), QuickBooks (7M+), MYOB (AU/NZ leader), Sage, FreshBooks.
Our advantages: Multi-agent AI architecture, forensic intelligence, autonomous month-end close, cross-border tax treaty engine, AI command center, native payroll, tax e-filing.
Our gaps to close: mobile native app (PWA implemented), direct bank feed connections (Plaid/Basiq/TrueLayer integrated).

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + React Router 6
- **Backend**: FastAPI + SQLAlchemy (async) + Neon PostgreSQL
- **AI**: Anthropic Claude API (claude-sonnet-4-20250514)
- **Banking**: Plaid (US/CA), Basiq (AU/NZ), TrueLayer (UK/EU)
- **Payments**: Stripe
- **Email**: Mailgun

## Project Structure

- `/frontend` - Main Astra platform (React SPA, port 5173)
- `/forensic-frontend` - Forensic accounting tools (port 3001)
- `/backend` - FastAPI application with 30+ API routers
- `/api` - Vercel serverless adapter
- `/legal` - Legal compliance documents (AI disclosure, ToS, privacy policy)

## Platform Features (Implemented)

### Core Accounting
- **Dashboard** — Real-time stats, pillar status, system health
- **Clients** — Multi-entity management with filters
- **Review Queue** — AI-drafted transactions with approval workflow
- **Bank Feeds** — Plaid/Basiq/TrueLayer with reconciliation engine
- **Invoicing** — Full lifecycle (draft→send→pay), credit notes
- **Documents** — Upload, OCR, search, audit trail
- **Reports** — P&L, Balance Sheet, Trial Balance, Cash Flow, GL, AR/AP
- **Inventory** — SKU tracking, assemblies, multi-location

### Tax & Compliance
- **Tax Engine** — GST/VAT/WHT calculations, 6 bilateral DTAs
- **Tax Filing** — BAS (AU), GST (NZ), VAT (UK), Sales Tax (US) generation + validation + lodgement
- **Compliance Calendar** — 40+ deadlines across 4 jurisdictions

### Payroll
- **Employee Management** — Full CRUD, employment types, jurisdictions
- **Pay Runs** — Create, process, approve payroll cycles
- **Tax Withholding** — PAYG (AU), PAYE (NZ/UK), Federal (US)
- **Superannuation** — AU 11.5%, NZ KiwiSaver 3-8%, UK pension
- **Leave Management** — Annual, sick, personal, long service tracking

### AI Features
- **Ask Astra** — Natural language financial queries
- **AI Command Center** — Cash flow forecasts, anomaly alerts, receipt scanning, NLP reports, weekly digest
- **Agentic AI** — Multi-agent orchestrator, month-end close, compliance monitor, cash flow forecaster
- **AI Categorizer** — Auto-categorize bank feed transactions with confidence scoring

### Forensic Intelligence (Unique)
- **Benford's Law Analysis** — First/second digit distribution testing
- **Vendor Audit** — Ghost vendor detection, concentration analysis, payment splitting
- **Due Diligence** — 90-minute financial health audit with 5 forensic engines
- **Money Trail** — Cash flow pattern analysis

### Platform
- **Integration Marketplace** — 22+ apps across CRM, e-commerce, payments, productivity, tax, HR
- **Enterprise** — Multi-practice, white-label branding, data import/export, bulk operations
- **Activity Feed** — Real-time audit timeline with hash chain integrity verification
- **Client Portal** — Scoped access for clients to view their own data
- **Specialist Toolkits** — 12 specializations, 90+ automations
- **Settings** — Profile, Practice, Notifications, Billing

### Security & Infrastructure
- **Authentication** — JWT with bcrypt, role-based access control (5 roles)
- **Entity-Level Access** — Enforce data isolation per entity
- **Rate Limiting** — Per-IP request throttling
- **CORS** — Configurable origin restrictions
- **Audit Trail** — Immutable hash-chain audit log
- **Password Reset** — Email-based token flow
- **Error Boundary** — Graceful React crash recovery
- **Toast Notifications** — Professional error/success feedback
- **PWA** — Progressive Web App with service worker + offline support
- **PDF Export** — HTML-based professional report generation

## Frontend Routes (31 total)

| Route | Page | Status |
|-------|------|--------|
| `/` | Dashboard | Complete |
| `/clients` | Clients | Complete |
| `/review` | Review Queue | Complete |
| `/banking` | Bank Feeds | Complete |
| `/invoicing` | Invoicing | Complete |
| `/payroll` | Payroll | Complete |
| `/documents` | Documents | Complete |
| `/reports` | Reports | Complete |
| `/tax` | Tax Engine | Complete |
| `/tax-filing` | Tax Filing | Complete |
| `/compliance` | Compliance Calendar | Complete |
| `/portal` | Client Portal | Complete |
| `/inventory` | Inventory | Complete |
| `/specialists` | Specialist Tools | Complete |
| `/toolkit` | Toolkit | Complete |
| `/integrations` | Integrations | Complete |
| `/marketplace` | Marketplace | Complete |
| `/ai-insights` | AI Command Center | Complete |
| `/enterprise` | Enterprise | Complete |
| `/activity` | Activity Feed | Complete |
| `/ask` | Ask Astra | Complete |
| `/agentic` | Agentic AI | Complete |
| `/settings` | Settings | Complete |
| `/about` | About (public) | Complete |
| `/security` | Security (public) | Complete |
| `/privacy` | Privacy (public) | Complete |
| `/terms` | Terms (public) | Complete |
| `/contact` | Contact (public) | Complete |

## Backend API Routers (30+)

All routes require JWT authentication (except /auth/login, /auth/register, /auth/password-reset).

auth, dashboard, entities, transactions, tax, tax_filing, ai, forensic, banking, specialists, toolkit, agentic, reports, clients, documents, multicurrency, auditlog, permissions, notifications, integrations, messaging, scheduling, integrations_hub, inventory, invoicing, marketplace, pdf_export, enterprise, payroll

## Development Branch

All work happens on feature branches prefixed with `claude/`.

---

## Live Competitive Intelligence (Updated March 2026)

### Market Landscape

| Competitor | Subscribers | Revenue | Target | Primary Markets |
|-----------|------------|---------|--------|-----------------|
| **Xero** | 4.2M+ | ~NZ$1.9B (~US$1.15B) | SMB + Accountants | AU/NZ/UK (dominant), US (growing) |
| **QuickBooks** | 7M+ | ~US$16B (Intuit total) | SMB + Self-employed | US/CA (dominant), expanding globally |
| **MYOB** | ~1.2M | ~A$500M | SMB (legacy) | AU/NZ only |
| **Sage** | 6M+ | ~GBP2.2B | SMB to Mid-market | UK (dominant), EU, Africa, US (Intacct) |
| **FreshBooks** | ~5M active | ~US$150M+ (est.) | Freelancers/Micro | US/CA primarily |

### Competitor Weaknesses We Exploit

#### Xero (Our Primary Target)
- **NO forensic intelligence** — Zero fraud detection, no Benford's, no vendor audit
- **NO autonomous AI** — "Just Ask Xero" is read-only basic NLP, still in limited rollout
- **Weak reporting** — #1 user complaint, limited customization, no dimensional analysis
- **NO compliance calendar** — No deadline tracking across jurisdictions
- **NO native US payroll** — Requires Gusto integration
- **Basic inventory** — No assemblies, no multi-location, no serial/lot tracking
- **NO autonomous month-end close** — Fully manual
- **Multi-entity = separate subscriptions** — No consolidated view
- **NO cross-border tax treaties** — Each jurisdiction separate
- **Pricing pain** — Starter plan (20 invoices/month limit), payroll only in Premium tier
- **App marketplace is their moat** — 1,000+ apps, 200K+ accountant partners

#### QuickBooks (Our Secondary Target)
- **NO forensic tools** — Zero fraud detection
- **Basic AI** — Intuit Assist is conversational but can't take autonomous actions
- **Aggressive price increases** — Users report 20-30% annual hikes, biggest churn driver
- **US-centric** — No native payroll outside US, weak multi-jurisdiction
- **Multi-entity = separate subscriptions** — No consolidated reporting
- **NO compliance calendar** — Users track deadlines externally
- **NO client portal** — Must use third-party
- **Poor customer support** — Consistently rated worst among competitors
- **Vendor lock-in** — Difficult to export data cleanly
- **ProAdvisor network is their moat** — 500K+ accountants

#### MYOB (AU/NZ Capture Opportunity)
- **Outdated UX** — Desktop heritage, looks 10 years behind
- **NO AI assistant** — No NLP, no chatbot, no autonomous features
- **AU/NZ only** — No multi-jurisdiction capability
- **Losing market share** — Declining to Xero, perfect capture window
- **Weak integration ecosystem** — ~200 apps vs Xero's 1,000+
- **Mobile app is weak** — Limited functionality, crash reports
- **Slow feature development** — Users report stagnation

#### Sage (Mid-Market Gap)
- **Fragmented product line** — Confusing: BC ($33/mo) vs Intacct ($15K+/year)
- **Pricing gap** — Nothing between $33/mo and $15K+/year (we fill this perfectly)
- **Sage Copilot is immature** — Just launched, very basic
- **Legacy brand perception** — Seen as "old school"
- **Poor mobile experience** — Apps are afterthoughts

#### FreshBooks (Invoicing-Only)
- **Not real accounting** — Invoicing-first with accounting bolted on
- **NO inventory** — Critical gap for product businesses
- **NO native payroll** — Requires Gusto
- **Can't scale** — Caps at micro-businesses (1-10 employees)
- **US/CA only** — Limited international tax compliance
- **NO tax filing** — No direct filing to tax authorities

### Universal Competitor Gaps (NONE of them have these)

| Feature | Xero | QBO | MYOB | Sage | FreshBooks | **Astra** |
|---------|------|-----|------|------|------------|-----------|
| Forensic Intelligence | - | - | - | - | - | **YES** |
| Benford's Law Analysis | - | - | - | - | - | **YES** |
| Autonomous Month-End Close | - | - | - | - | - | **YES** |
| Multi-Agent AI Architecture | - | - | - | - | - | **YES** |
| Cross-Border Tax Treaties (6 DTAs) | - | - | - | - | - | **YES** |
| Compliance Calendar (40+ deadlines) | - | - | - | - | - | **YES** |
| Multi-Jurisdiction in One Subscription | - | - | - | - | - | **YES** |
| Ghost Vendor Detection | - | - | - | - | - | **YES** |
| AI Confidence Scoring + Review Queue | - | - | - | - | - | **YES** |
| Native 4-Country Payroll | - | - | - | - | - | **YES** |

### End-User Pain Points (Ranked by Frequency)

1. **Poor customer support** — #1 complaint across ALL platforms
2. **Price increases without value** — 15-30% annual hikes trigger churn
3. **Bank feed disconnections** — Universal frustration
4. **Limited reporting** — Biggest Xero complaint
5. **Multi-entity nightmare** — Separate subscriptions per business
6. **Mobile apps are afterthoughts** — "Can check but can't do anything"
7. **Tax compliance confusion** — Users don't know if they're compliant
8. **Manual reconciliation tedium** — Hundreds of transactions monthly
9. **Vendor lock-in** — Poor data export
10. **Learning curve** — Non-accountants struggle with double-entry

### What Users Actually Want (Priority Order)

1. **AI that saves time, not makes decisions** — "AI drafts, human approves" (our exact model)
2. **All-in-one pricing** — No add-ons, no per-entity charges
3. **Cash flow visibility** — "Will I be okay next month?"
4. **Get paid faster** — Integrated payments, auto-reminders
5. **95%+ categorisation accuracy** — Current platforms average 60-70%
6. **Tax confidence** — Certainty they're compliant
7. **Mobile-first** — Full capability, not companion app
8. **Plain English financial insights** — Not just raw P&L
9. **Compliance autopilot** — Auto-file, auto-alert, auto-validate
10. **Scenario planning** — "What if I hire 2 people?"

### Key Strategic Insight

> **Accountants are kingmakers.** If you win the accountant, you win their 50-200 clients.
> 38% of users switch platforms due to price. 24% due to missing features. 18% due to poor support.
> Accountant recommendation drives 8% of switches directly — but influences nearly all.

### Astra's Killer Differentiators (Features NO Competitor Has)

1. **Forensic Intelligence for Everyone** — Not enterprise-only. Benford's, ghost vendors, money trail.
2. **Autonomous Month-End Close** — 4.2 seconds average. Competitors: days to weeks.
3. **Multi-Agent AI Architecture** — Not a chatbot. Real autonomous agents that act.
4. **Cross-Border Tax Treaty Engine** — 6 bilateral DTAs with automatic WHT optimization.
5. **True Multi-Jurisdiction** — AU/NZ/UK/US in ONE subscription, ONE platform.
6. **Compliance Calendar** — 40+ deadlines. No competitor tracks these.
7. **AI Review Queue** — Confidence scoring on every transaction. Human-in-the-loop by design.
8. **Native Payroll Included** — Not a $50-125/mo add-on like QBO/Xero.
9. **Client Portal Built-In** — Scoped access, document upload, real-time dashboards.
10. **Specialist Toolkits** — 12 specializations, 90+ automations. Vertical depth.

### Pricing Strategy (Competitive Positioning)

| Tier | Price | vs Xero | vs QBO | Positioning |
|------|-------|---------|--------|-------------|
| Practice ($149/mo) | All-inclusive | Xero Premium = $79 + payroll add-on | QBO Plus = $90 + payroll $45-125 | More features for similar total cost |
| Firm ($499/mo) | Multi-jurisdiction + forensics | No Xero equivalent at any price | QBO Advanced = $200 but no forensics | Unique — they literally can't buy this elsewhere |
| Enterprise (custom) | Unlimited, white-label | Xero has no enterprise tier | QBO doesn't compete here | Fills Sage Intacct gap ($15K+/yr) at fraction of cost |

### Next Features to Build (Ranked by Competitive Impact)

1. **Financial Health Score** — Like a credit score for businesses. No competitor has this.
2. **Intelligent Document Chasing** — AI that auto-emails clients for missing receipts/docs.
3. **Scenario Planning Engine** — "What if" financial modeling.
4. **Proactive Tax Alerts** — "You're approaching the VAT threshold" before it happens.
5. **Cash Flow Timing Optimizer** — "Delay this payment, accelerate these invoices."
6. **Vendor Intelligence** — "You're paying 23% more than average for this service."
7. **Smart Payment Reminders** — Tone-appropriate based on client relationship.
8. **Real-Time Collaboration** — Google Docs-level multi-user financial editing.
9. **Vertical Specializations** — Construction, healthcare, nonprofit, e-commerce modules.
10. **Embedded Finance** — Banking, lending, insurance within the platform.

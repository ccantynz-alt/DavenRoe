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

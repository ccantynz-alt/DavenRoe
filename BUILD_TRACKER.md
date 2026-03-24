# Astra Build Tracker — Master Feature Registry

> **Purpose**: Single source of truth for every feature built, in progress, or planned.
> Nothing falls through the cracks. Updated after every build session.
>
> **Last updated**: 2026-03-24

---

## BUILT — Shipped & Working

### Core Accounting (Foundation)
| # | Feature | Route | Backend | Notes |
|---|---------|-------|---------|-------|
| 1 | Dashboard — real-time stats, pillar status, system health | `/` | `dashboard.py` | Complete |
| 2 | Clients — multi-entity management with filters | `/clients` | `clients.py` | Complete |
| 3 | Review Queue — AI-drafted transactions with approval workflow | `/review` | `transactions.py` | Complete |
| 4 | Bank Feeds — Plaid/Basiq/TrueLayer + reconciliation engine | `/banking` | `banking.py` | Complete |
| 5 | Invoicing — full lifecycle (draft→send→pay), credit notes | `/invoicing` | `invoicing.py` | Complete |
| 6 | Documents — upload, OCR, search, audit trail | `/documents` | `documents.py` | Complete |
| 7 | Reports — P&L, Balance Sheet, Trial Balance, Cash Flow, GL, AR/AP | `/reports` | `reports.py` | Complete |
| 8 | Inventory — SKU tracking, assemblies, multi-location | `/inventory` | `inventory.py` | Complete |
| 9 | Multi-currency support | (integrated) | `multicurrency.py` | Complete |

### Tax & Compliance
| # | Feature | Route | Backend | Notes |
|---|---------|-------|---------|-------|
| 10 | Tax Engine — GST/VAT/WHT, 6 bilateral DTAs | `/tax` | `tax.py` | Complete |
| 11 | Tax Filing — BAS (AU), GST (NZ), VAT (UK), Sales Tax (US) | `/tax-filing` | `tax_filing.py` | Complete |
| 12 | Compliance Calendar — 40+ deadlines, 4 jurisdictions | `/compliance` | (frontend) | Complete |
| 13 | Tax Knowledge Agent — AI-powered tax advice | `/tax-agent` | `tax_agent.py` | Complete |

### Payroll
| # | Feature | Route | Backend | Notes |
|---|---------|-------|---------|-------|
| 14 | Employee Management — CRUD, employment types, jurisdictions | `/payroll` | `payroll.py` | Complete |
| 15 | Pay Runs — create, process, approve payroll cycles | `/payroll` | `payroll.py` | Complete |
| 16 | Tax Withholding — PAYG (AU), PAYE (NZ/UK), Federal+State (US) | `/payroll` | `payroll.py` | Complete |
| 17 | Superannuation — AU 11.5%, NZ KiwiSaver, UK pension, US 401(k) | `/payroll` | `payroll.py` | Complete |
| 18 | Leave Management — annual, sick, personal, long service | `/payroll` | `payroll.py` | Complete |
| 19 | Company Incorporation — formation automation (unique feature) | `/incorporation` | `incorporation.py` | Complete |

### AI & Intelligence
| # | Feature | Route | Backend | Notes |
|---|---------|-------|---------|-------|
| 20 | Ask Astra — natural language financial queries | `/ask` | `ai.py` | Complete |
| 21 | AI Command Center — forecasts, anomalies, receipts, NLP reports | `/ai-insights` | `ai.py` | Complete |
| 22 | Agentic AI — multi-agent orchestrator, month-end close | `/agentic` | `agentic.py` | Complete |
| 23 | AI Categorizer — auto-categorize bank feeds with confidence | (integrated) | `banking.py` | Complete |
| 24 | Email Scanner — automated email-based document capture | `/email-scanner` | `email_scanner.py` | Complete |

### Forensic Intelligence (Unique — Zero Competitors)
| # | Feature | Route | Backend | Notes |
|---|---------|-------|---------|-------|
| 25 | Benford's Law Analysis — first/second digit distribution | `/specialists` | `forensic.py` | Complete |
| 26 | Vendor Audit — ghost vendor detection, concentration analysis | `/specialists` | `forensic.py` | Complete |
| 27 | Due Diligence — 90-minute financial health audit, 5 engines | `/specialists` | `forensic.py` | Complete |
| 28 | Money Trail — cash flow pattern analysis | `/specialists` | `forensic.py` | Complete |

### Expense Management (NEW — March 2026)
| # | Feature | Route | Backend | Notes |
|---|---------|-------|---------|-------|
| 29 | Live Receipt — real-time expense capture (manual/snap/voice) | `/live-receipt` | `live_receipt.py` | Complete |
| 30 | Employee Expense Accounts — account assignment + categorization | (integrated) | `expense_accounts.py` | Complete |
| 31 | Spend Monitor — real-time fraud detection, 4 detection layers | `/spend-monitor` | `spend_monitor.py` | Complete |

### Time & Productivity
| # | Feature | Route | Backend | Notes |
|---|---------|-------|---------|-------|
| 32 | Time Tracker — billable hours, timers, team timesheets | `/time-tracker` | `time_tracker.py` | Complete |
| 33 | Smart Tools — beginner-friendly feature modules | `/smart-tools` | `smart_tools.py` | Complete |
| 34 | Peer Review — collaborative review workflow | `/peer-review` | `peer_review.py` | Complete |

### Platform & Infrastructure
| # | Feature | Route | Backend | Notes |
|---|---------|-------|---------|-------|
| 35 | Integration Marketplace — 22+ apps | `/integrations` | `integrations.py` | Complete |
| 36 | Enterprise — multi-practice, white-label, bulk ops | `/enterprise` | `enterprise.py` | Complete |
| 37 | Activity Feed — real-time audit with hash-chain integrity | `/activity` | `activity_feed.py` | Complete |
| 38 | Client Portal — scoped access for clients | `/portal` | (frontend) | Complete |
| 39 | Specialist Toolkits — 12 specializations, 90+ automations | `/specialists` | `specialists.py` | Complete |
| 40 | Financial Health Score — 0-100 business credit score | `/financial-health` | `financial_health.py` | Complete |
| 41 | Settings — profile, practice, notifications, billing | `/settings` | (frontend) | Complete |

### Authentication & Security
| # | Feature | Route | Backend | Notes |
|---|---------|-------|---------|-------|
| 42 | JWT Authentication + bcrypt + RBAC (5 roles) | `/login` | `auth.py` | Complete |
| 43 | Entity-level data isolation | (integrated) | `permissions.py` | Complete |
| 44 | Rate limiting — per-IP throttling | (middleware) | `main.py` | Complete |
| 45 | Audit trail — immutable hash-chain log | (integrated) | `auditlog.py` | Complete |
| 46 | PWA — service worker + offline support | (frontend) | — | Complete |
| 47 | PDF Export — HTML-based professional reports | (integrated) | `pdf_export.py` | Complete |

### Public Pages
| # | Feature | Route | Notes |
|---|---------|-------|-------|
| 48 | Landing page — hero, features, pricing, testimonials, FAQ | `/` (public) | Complete |
| 49 | About | `/about` | Complete |
| 50 | Security | `/security` | Complete |
| 51 | Privacy | `/privacy` | Complete |
| 52 | Terms | `/terms` | Complete |
| 53 | Contact | `/contact` | Complete |

---

## NOT YET BUILT — Planned Features (Priority Order)

### P0 — Existential Gaps (Must Build ASAP)

| # | Feature | Why | Competitive Context |
|---|---------|-----|---------------------|
| 54 | **Integration Platform & Open API** | Xero has 1,000+ apps. We have 22. Accountants won't switch without ecosystem. | OAuth2 public API, webhook system, SDK, developer portal. Target: 50 by Q2, 200+ by Q4. |
| 55 | **Accountant Partner Program ("Astra Certified")** | Accountants control 50-200 clients each. QBO has 500K+ ProAdvisors, Xero has 200K+ partners. | Free practice tier, certification course, directory, revenue share, bulk migration tools. Target: 1,000 certified by Q4. |

### P1 — Competitive Gaps (This Quarter)

| # | Feature | Why | Status |
|---|---------|-----|--------|
| 56 | **Project Management Module** | FreshBooks has it (drag-drop, Agile). QBO has job costing. We have nothing for project-based businesses. | NOT STARTED — needs Kanban, budgets, milestones, profitability reports |
| 57 | **Scenario Planning Engine** | #10 most wanted feature. Zero competitors offer it. "What if I hire 2 people?" with Monte Carlo simulation. | NOT STARTED |
| 58 | **Mobile Native App (Capacitor/RN)** | Xero/QBO have native apps rated 4.5+. PWA exists but not enough for "mobile-first" users. | PWA DONE, native NOT STARTED |
| 59 | **Help Center & Support Infrastructure** | "Poor support" is #1 complaint about EVERY competitor. Searchable KB, in-app help, AI chatbot, community forum. | NOT STARTED |

### P2 — Competitive Moat Deepening (Next Quarter)

| # | Feature | Why | Status |
|---|---------|-----|--------|
| 60 | **Dimensional Reporting Engine** | Sage Intacct's #1 selling point. User-defined dimensions, pivot tables, drill-down. | NOT STARTED |
| 61 | **Proactive AI Alerts System** | "VAT threshold approaching", "Cash negative in 22 days", "Travel 340% above average" | PARTIAL (basic alerts in Agentic AI) |
| 62 | **Intelligent Document Chasing** | Accountants spend 40% of time chasing docs. Auto-email escalation sequences. | NOT STARTED |
| 63 | **Real-Time Multi-User Collaboration** | Google Docs-style simultaneous editing. No competitor has this. | NOT STARTED |
| 64 | **Cash Flow Timing Optimizer** | "Delay this payment 7 days, accelerate these 3 invoices" — beyond visibility to optimization. | NOT STARTED |
| 65 | **Vendor Intelligence** | "You're paying 23% more than similar businesses for office supplies." Benchmark against platform averages. | NOT STARTED |
| 66 | **Smart Payment Reminders** | Tone-appropriate based on client relationship (polite → firm → urgent). | NOT STARTED |
| 67 | **Vertical Specializations** | Construction, healthcare, nonprofit, e-commerce — deep industry modules. | PARTIAL (12 specialist toolkits exist) |
| 68 | **Embedded Finance** | Banking, lending, insurance within the platform. | NOT STARTED |

### Ideas Discussed But Not Yet Prioritized

| # | Idea | Origin | Notes |
|---|------|--------|-------|
| 69 | Chrome extension for time tracking | Time Tracker discussion | Would let users track time from any browser tab |
| 70 | Voice-to-invoice | Live Receipt discussion | Dictate an invoice on mobile |
| 71 | AI-powered audit prep checklist | Forensic discussion | Auto-generate everything an auditor needs |
| 72 | Contractor 1099/payment automation | Payroll discussion | Manage contractors alongside employees |
| 73 | Client health dashboard for accountants | Partner program discussion | See all clients' financial health at a glance |
| 74 | Auto-reconciliation confidence tuning | Bank feeds discussion | Let users set how aggressive AI matching is |
| 75 | Receipt forwarding email address | Email scanner discussion | receipts@[practice].astra.ai auto-captures |
| 76 | Scheduled report delivery | Reports discussion | Auto-email P&L every Monday morning |
| 77 | Tax scenario comparison | Tax engine discussion | Compare entity structures for tax optimization |
| 78 | Multi-entity consolidated reporting | Enterprise discussion | Roll-up P&L across all entities |
| 79 | Approval workflow builder | Enterprise discussion | Custom approval chains for invoices, expenses, pay runs |
| 80 | Wage theft detection | Spend Monitor discussion | Flag underpayment relative to award rates |

---

## Feature Counts

| Category | Count |
|----------|-------|
| **BUILT & SHIPPED** | 53 features across 41+ routes |
| **PLANNED P0** | 2 (existential) |
| **PLANNED P1** | 4 (competitive gaps) |
| **PLANNED P2** | 9 (moat deepening) |
| **IDEAS (unprioritized)** | 12 |
| **TOTAL TRACKED** | 80 |

---

## Session Log

| Date | What Was Built | Priority | Commit |
|------|---------------|----------|--------|
| 2026-03-24 | Spend Monitor — real-time employee fraud detection | P1 (theft prevention) | 3eb394b |
| 2026-03-24 | Employee Expense Accounts — account assignment | P1 (expense management) | 9b227e5 |
| 2026-03-24 | Live Receipt — real-time expense capture (3 modes) | P1 (expense management) | a6f2356 |
| 2026-03-24 | Smart Tools + Time Tracker | P1 (time tracking gap) | a976b6e |
| 2026-03-24 | Email Scanner + Tax Agent + Peer Review | P1/P2 mixed | eecc2c3 |
| 2026-03-24 | Company Incorporation | Unique differentiator | 1d4fe5b |
| 2026-03-24 | Financial Health Score | P1 (competitive gap) | 84a7633 |
| 2026-03-24 | Payroll overhaul — US state tax + 401(k) | P1 (payroll depth) | 13721e5 |

---

## How To Use This File

1. **Before building**: Check "NOT YET BUILT" section → pick highest priority item
2. **After building**: Move item to "BUILT" section → add to Session Log → update counts
3. **New idea comes up**: Add to "Ideas Discussed" section immediately — don't lose it
4. **Competitor ships something**: Add to CLAUDE.md threat watch → add response feature here
5. **Every session start**: Read this file → announce what you're building and why

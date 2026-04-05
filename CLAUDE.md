# AlecRae Accounting - Development Standards

## AGGRESSIVE DOMINANCE MANDATE (Non-Negotiable — Founder Directive, April 2026)

> **We are AGGRESSIVE. We WILL be the best. There is no second place.**
>
> Technology moves so fast — if you stop to smell the roses, you'll be second, third, fourth, fifth place.
> We are living in the age of AI. We need to be INSANELY ADVANCED.
>
> This system must serve TWO user types equally well:
> - **"Charlie Brown" (Novice)** — The small business owner who's never touched accounting software. Everything must be intuitive, guided, and forgiving. Smart defaults, plain-English explanations, wizards that hold their hand.
> - **"007" (Expert)** — The accountant, tax agent, forensic specialist. Power features, keyboard shortcuts, bulk operations, deep configuration, advanced reporting. Every tool they need, zero friction.
>
> The UI/UX must feel like a **$100K build**. Not $10K. Not $50K. One hundred thousand dollars of polish, animation, interaction design, and visual hierarchy. Every screen must make competitors' products look dated.
>
> ### Non-Negotiable Design Principles:
> 1. **NO raw HTML** — Every interactive element uses Radix UI primitives with Tailwind styling
> 2. **NO lazy software** — Every feature is fully implemented, not stubbed
> 3. **NO generic SaaS look** — Custom design language that screams premium
> 4. **Fully automated** — When we apply for API access with IRD, ATO, HMRC, or IRS, the software must be so polished they approve on sight
> 5. **We adapt for OURSELVES** — No moonwalking. No copying. We set the standard.
> 6. **AI-native everything** — Every workflow should leverage AI where it reduces friction
> 7. **Motion & micro-interactions** — Framer Motion on every transition. Nothing should feel static.
> 8. **Glass morphism + depth** — Modern visual language with layering, blur, and subtle gradients
> 9. **Dark mode first** — The app UI is dark-themed by default (dashboard, all pages). Landing page can use light sections for contrast.
> 10. **Scan the entire internet** for the most aggressive, best architecture, components, and design patterns before building anything new
>
> ### Why This Matters:
> We are building software that tax authorities will grant API access to.
> We are building software that accountants will stake their practice on.
> We are building software that will make Xero, QuickBooks, MYOB, Sage, and FreshBooks look like they're from 2015.
> There is NO second place. Either we are the best, or we are irrelevant.
>
> **Come back to these notes before EVERY future work session. This is the DNA of the product.**

### NEVER STOP BUILDING (Founder Directive, April 2026)

> The founder works full-time and manages multiple projects. Claude is the **primary builder**.
> There is no "waiting for instructions." There is no "pausing for feedback."
>
> **Rules:**
> 1. **Never take the foot off the gas.** Build continuously until every AT RISK item is DOMINANT.
> 2. **Never stop at any cost.** If one feature is done, immediately start the next.
> 3. **Launch parallel agents** whenever possible — 5+ agents building simultaneously is the norm.
> 4. **Commit and push frequently** — small, working commits. The founder may check in at any time.
> 5. **Self-direct completely.** The scorecard is the backlog. The priority order is the sprint plan. Execute.
> 6. **Report progress, don't ask questions.** "Built X, now building Y" — not "should I build Y?"
> 7. **Every session = maximum output.** No warm-up, no planning paralysis. Read scorecard, build, ship.
> 8. **The project is not complete until every gap is closed and every feature is DOMINANT.**

---

## Autonomous Development Directive (Non-Negotiable)

### Self-Driving Development — Do NOT Wait for Instructions

Claude is a **self-directing development agent**, not a passive assistant. The user should NEVER need to ask "what's next?" or "what should we build?" Claude must:

1. **Auto-assess on every session start.** Read the Competitive Scorecard below. Identify the highest-priority AT RISK item that is not yet in progress. Start building it. No prompting required.
2. **Chain tasks automatically.** When you finish a feature, immediately move to the next highest-priority item. Do not stop and ask "what now?" — the scorecard tells you what now.
3. **Report, don't ask.** Tell the user what you're building and why ("Starting Time Tracking module — P1 gap, FreshBooks has this on all plans, we have nothing"). Don't ask permission to start P0/P1 work.
4. **Fix on sight, build on plan.** If you encounter a bug or quality issue while building, fix it immediately (per Zero-Tolerance Policy). Then resume the planned work.
5. **Prioritize ruthlessly.** Follow this priority order at all times:
   - **P0 first** — Existential gaps (integration ecosystem, partner program)
   - **P1 second** — Competitive gaps (time tracking, project mgmt, financial health score, scenario planning, mobile, support)
   - **P2 third** — Moat deepening (dimensional reporting, proactive alerts, collaboration, document chasing)
   - **Polish/maintenance last** — Only when no P0/P1/P2 gaps remain
6. **Announce intent, then execute.** At the start of each session, output a 2-3 line status: what was last completed, what you're building now, and why it's the priority. Then start coding.
7. **Never idle.** If the user gives a vague prompt like "keep going" or "what's next" or even just opens a session, treat it as "continue executing the build plan." The scorecard IS the backlog.
8. **Update the scorecard.** When you complete a feature that closes a gap, update the Competitive Scorecard in this file — move items from AT RISK to DOMINANT, adjust percentages, and add any new gaps discovered.

### Session Start Protocol

Every new session, Claude must:
```
1. Read CLAUDE.md → Check Competitive Scorecard
2. Identify highest-priority uncompleted AT RISK item
3. Output: "Building [Feature] — [Priority] — [Why this is next]"
4. Begin implementation immediately
```

> **The user hired an autonomous agent, not a chatbot. Act like one.**
> If there's a gap in the scorecard, you should already be closing it.
> The only acceptable idle state is: all items are DOMINANT.

---

## Mandatory Audit Protocol (Non-Negotiable)

Surface-level checks are NOT acceptable. "File exists" is not the same as "code works." Every audit must be production-grade.

### Audit Levels

**After ANY code change — run Level 2 minimum:**

| Level | When | What To Do | Command |
|-------|------|------------|---------|
| **Level 1** | Quick check | Build frontend, verify no compile errors | `npm run build` |
| **Level 2** | After adding/modifying a feature | Test every import actually resolves. Check every new file's imports point to real modules with correct export names. Verify the build. | Import test + build |
| **Level 3** | Before any deployment or push | FULL PRODUCTION CRAWL: Import every single backend module. Check every frontend page. Check every nav link has a matching route. Check every route file's imports exist. Check requirements.txt has every dependency. | Full crawl |
| **Level 4** | Before launch / major release | Everything in Level 3 + check env vars documented, DB schema matches models, auth flow works end-to-end, all API endpoints return proper responses, no hardcoded secrets, no unverified marketing claims | Full deployment audit |

### Rules:
1. **Never say "build passes" as proof something works.** Vite bundles frontend — it does NOT catch Python backend errors.
2. **Never say "file exists" as proof an import works.** The file might exist but export the wrong name, or import something that doesn't exist.
3. **After building ANY backend route**, actually try to import it: `from app.api.routes.new_route import router`
4. **After adding ANY dependency**, check it's in BOTH `requirements.txt` (Vercel root) AND `backend/requirements.txt` (local dev).
5. **After ANY session that touches 3+ files**, run a Level 3 crawl before pushing.
6. **Every push to production** requires a Level 3 crawl. No exceptions.

### Deployment Strategy — Blue-Green

**Production** is sacred. Never push untested code to production.

- `main` branch = production (what customers see)
- `claude/*` branches = development (where Claude works)
- All development happens on `claude/*` branches
- Merge to `main` ONLY after Level 3 crawl passes
- Vercel preview deployments on `claude/*` branches for testing
- Production deployment on `main` only

---

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

## Frontend Routes (32 total)

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
| `/financial-health` | Financial Health Score | Complete |
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

---

## Competitive Dominance Mandate (Non-Negotiable)

### The 50-70% Rule

> **Astra must be 50-70% more advanced than the BEST competitor in every capability category.**
> If we are not past that threshold, we MUST add features, modify architecture, design new products,
> or expand existing ones until we are. No exceptions. No "good enough." Share of wallet demands dominance.

This is a standing directive. Every development session must evaluate whether new work maintains or extends our lead. If a competitor closes a gap, we must respond immediately by leapfrogging — not matching.

### Current Competitive Scorecard (Updated March 2026)

#### DOMINANT (50-70%+ Ahead) — Protect & Extend

| # | Capability | Best Competitor | Astra Advantage | Status |
|---|-----------|----------------|----------------|--------|
| 1 | Forensic Intelligence (Benford's, Ghost Vendor, Money Trail) | None have it | +100% | DOMINANT |
| 2 | Multi-Agent AI Architecture | Sage Copilot (Intacct only, $10K+/yr) | +70% | DOMINANT |
| 3 | Cross-Border Tax Treaty Engine (6 DTAs) | None have it | +100% | DOMINANT |
| 4 | Multi-Jurisdiction Single Subscription (AU/NZ/UK/US) | None offer this | +100% | DOMINANT |
| 5 | Compliance Calendar (40+ deadlines, 4 jurisdictions) | None have it | +100% | DOMINANT |
| 6 | AI Review Queue + Confidence Scoring | None have it | +100% | DOMINANT |
| 7 | Native 4-Country Payroll (included, not add-on) | Xero (AU/NZ only, add-on pricing) | +60% | DOMINANT |
| 8 | Autonomous Month-End Close (4.2s average) | Sage Copilot (partial, $10K+/yr gate) | +50% | DOMINANT |
| 9 | Client Portal (built-in, scoped access) | QBO (none), Xero (basic) | +60% | DOMINANT |
| 10 | Specialist Toolkits (12 specializations, 90+ automations) | None at this depth | +80% | DOMINANT |

#### AT RISK (Below 50% Advantage) — Must Improve Immediately

| # | Capability | Best Competitor | Their Advantage | Gap | Priority |
|---|-----------|----------------|----------------|-----|----------|
| 1 | Integration Ecosystem | Xero (1,000+ apps) vs Astra (22) | -98% | CRITICAL | P0 |
| 2 | Accountant Partner Program | Xero (200K+), QBO (500K+ ProAdvisors) | -99% | CRITICAL | P0 |
| 3 | Time Tracking (billable hours, timers, Chrome ext) | FreshBooks (all plans, built-in) | -100% | HIGH | P1 |
| 4 | Project Management (tasks, budgets, profitability) | FreshBooks (drag-drop, Agile-friendly) | -100% | HIGH | P1 |
| 5 | Mobile Native Experience | Xero/QBO (native iOS + Android apps) | -40% | HIGH | P1 |
| 6 | Scenario Planning / What-If Modeling | None mature (users' #10 want) | Not built | HIGH | P1 |
| 7 | Financial Health Score | None have it (users want it most) | BUILT (v1) | CLOSING | P1 |
| 8 | Dimensional Reporting (multi-dimensional GL) | Sage Intacct (dynamic dimensions) | -50% | MEDIUM | P2 |
| 9 | Proactive AI Alerts (variance, threshold, anomaly) | Sage Copilot (real-time variance) | -30% | MEDIUM | P2 |
| 10 | Customer Support Infrastructure (KB, chat, phone) | All competitors have it | -80% | HIGH | P1 |
| 11 | Real-Time Multi-User Collaboration | None have it (opportunity) | Not built | MEDIUM | P2 |
| 12 | Intelligent Document Chasing | None have it (opportunity) | Not built | MEDIUM | P2 |

#### OVERALL POSITION: ~55% ahead on UNIQUE FEATURES, ~80% behind on ECOSYSTEM & REACH

### Enforcement Rules

1. **Before building any new feature**, check this scorecard. If an "AT RISK" item exists at P0/P1, it takes priority over nice-to-haves.
2. **If a competitor announces a feature that closes one of our DOMINANT gaps**, immediately escalate. Design a response that leapfrogs their announcement, not just matches it.
3. **Every sprint must move at least one AT RISK item toward DOMINANT.** No sprint should be 100% maintenance or polish if gaps remain.
4. **Integration count must increase by 10+ per quarter** until we reach 200+. The ecosystem gap is existential.
5. **No feature is "done" at MVP.** If the best competitor has a more polished version, iterate until ours is demonstrably better.
6. **Track competitor releases weekly.** Sage Copilot, Xero's AI, QBO Intuit Assist, MYOB AI BAS — all are shipping AI features now. Our lead shrinks every month we don't extend it.

### What Must Be Built to Hit 50-70% Dominance Everywhere

#### P0 — Existential Gaps (Build NOW)

1. **Integration Platform & Open API**
   - Public REST API with OAuth2 for third-party developers
   - Webhook system for real-time event notifications
   - Integration SDK/templates so partners can build connectors fast
   - Target: 50 integrations by Q2 2026, 200+ by Q4 2026
   - *Why*: Xero's 1,000+ app marketplace is their #1 moat. Without an ecosystem, accountants won't switch.

2. **Accountant Partner Program ("Astra Certified")**
   - Free practice management tier for accountants
   - Certification course + badge + directory listing
   - Revenue share on client referrals
   - Bulk client migration tools (import from Xero/QBO/MYOB)
   - Target: 1,000 certified accountants by Q4 2026
   - *Why*: Accountants control 50-200 clients each. Win the accountant, win the book.

#### P1 — Competitive Gaps (Build This Quarter)

3. **Time Tracking Module**
   - Start/stop timers, manual entry, Chrome extension
   - Billable vs non-billable classification
   - Auto-attach billable time to invoices
   - Team timesheets with approval workflow
   - Project time budgets with burn-down tracking
   - *Why*: FreshBooks includes this on ALL plans. Service businesses (our target) need it.

4. **Project Management Module**
   - Project creation with budgets, milestones, due dates
   - Task assignment to team members
   - Project profitability reports (revenue vs cost vs time)
   - Drag-and-drop Kanban + list views
   - Link projects to invoices, expenses, time entries
   - *Why*: FreshBooks offers this. QBO has job costing. We have nothing for project-based businesses.

5. **Financial Health Score**
   - Composite score (0-100) based on: liquidity, profitability, efficiency, growth, risk
   - Trend tracking over time with AI-generated improvement recommendations
   - Benchmark against industry averages
   - Shareable score card for loan applications and investor meetings
   - *Why*: No competitor has this. It's the single most requested "wish" feature across all platforms.

6. **Scenario Planning Engine**
   - "What if I hire 2 people?" / "What if revenue drops 20%?" / "What if I open a new location?"
   - Monte Carlo simulation for probability ranges
   - Side-by-side scenario comparison with visual charts
   - AI-narrated impact summary in plain English
   - *Why*: #10 most wanted feature. Zero competitors offer it. Massive differentiation for advisory firms.

7. **Mobile App Enhancement (React Native or Capacitor)**
   - Push notifications for approvals, payment received, compliance deadlines
   - Receipt capture with instant OCR + categorization
   - Invoice creation and sending on mobile
   - Dashboard and cash flow view
   - Offline mode with sync
   - *Why*: Xero and QBO have native apps rated 4.5+. PWA is not enough for "mobile-first" users.

8. **Help Center & Support Infrastructure**
   - Searchable knowledge base with 200+ articles
   - In-app contextual help tooltips
   - AI-powered support chatbot (Astra answers support questions too)
   - Community forum for accountants and users
   - *Why*: "Poor support" is the #1 complaint about EVERY competitor. This is a capture opportunity.

#### P2 — Competitive Moat Deepening (Next Quarter)

9. **Dimensional Reporting Engine**
   - User-defined dimensions (department, location, project, cost center, fund)
   - Slice any report by any combination of dimensions
   - Dynamic pivot tables with drill-down
   - *Why*: Sage Intacct's #1 selling point. We need this for mid-market capture.

10. **Proactive AI Alerts System**
    - "You're approaching the VAT registration threshold — 3 months at current trajectory"
    - "Cash flow will go negative in 22 days unless Invoice #1847 is collected"
    - "Unusual spike in travel expenses this month — 340% above 6-month average"
    - "Payroll tax deposit due in 5 days — estimated amount: $14,200"
    - *Why*: Sage Copilot does basic variance. We must do predictive + prescriptive.

11. **Intelligent Document Chasing**
    - AI auto-emails clients for missing receipts, invoices, bank statements
    - Escalation sequences (polite → firm → urgent) with tone AI
    - Dashboard showing chase status per client
    - *Why*: Accountants spend 40% of time chasing documents. Automate this entirely.

12. **Real-Time Multi-User Collaboration**
    - Google Docs-style simultaneous editing on financial data
    - Presence indicators, cursor tracking, inline comments
    - @mention team members on specific transactions
    - *Why*: No competitor has this. Future-proofs for remote advisory teams.

13. **Cash Flow Timing Optimizer**
    - AI recommends: "Delay this supplier payment by 7 days, accelerate these 3 invoices"
    - Models optimal payment/collection schedule to maximize cash position
    - Auto-generates payment schedule with one-click execution
    - *Why*: "Cash flow visibility" is the #3 user want. Go beyond visibility to optimization.

14. **Vendor Intelligence**
    - Benchmark vendor pricing against anonymized platform averages
    - "You're paying 23% more than similar businesses for office supplies"
    - Contract renewal alerts with negotiation data points
    - *Why*: Unique feature. Turns Astra from accounting tool into business intelligence platform.

### Competitive Threat Watch List

| Competitor | Threat | Our Response | Urgency |
|-----------|--------|-------------|---------|
| Sage Copilot | AI close automation at scale (150K+ users) | Extend our agentic AI to handle MORE than close — full autonomous accounting | HIGH |
| Xero "Just Ask Xero" | NLP expanding from read-only to action-capable | Our Ask Astra already acts. Stay 2 generations ahead. | MEDIUM |
| QBO Intuit Assist | $16B R&D budget backing AI development | Feature velocity. Ship faster than they can. Our advantage is agility. | HIGH |
| MYOB AI BAS | AI-powered BAS preparation (beta, free to users) | Our tax filing already does this + 3 more jurisdictions. Extend with AI audit. | LOW |
| FreshBooks + Kick | "Self-driving bookkeeping" partnership | Our agentic AI is already more capable. Monitor for feature parity. | LOW |

### Share of Wallet Strategy

> **Goal: Capture 100% of a practice's financial software spend in ONE subscription.**
>
> Competitors fragment spend: QBO ($90) + Gusto payroll ($125) + Dext documents ($30) + Fathom reporting ($50) + Chaser debt collection ($40) + Float cash flow ($49) = **$384/month across 6 vendors.**
>
> Astra Practice tier ($149/month) replaces ALL of them. That's our share-of-wallet pitch:
> **"One platform. One subscription. One login. Everything."**
>
> Every feature we DON'T have is a reason for a customer to keep a competing subscription.
> Every gap in this scorecard is leaked revenue. Close the gaps. Capture the wallet.

---

## Technology Stack Mandate — Best-of-Breed Only (Non-Negotiable)

### Zero Tolerance for Outdated Components

> **If it's old, rip it out and replace it. No exceptions. No "it still works." No legacy debt.**
> Every dependency, every component, every pattern MUST be the most advanced, fastest, most modern
> option available. If a newer, better alternative exists — migrate immediately.

### Current Approved Stack (Verified Cutting-Edge as of March 2026)

| Layer | Technology | Version | Status | Notes |
|-------|-----------|---------|--------|-------|
| **Runtime** | React | 19.x | APPROVED | Latest with RSC-ready architecture |
| **Build** | Vite | 6.x | APPROVED | ESM-native, sub-second HMR, esbuild minification |
| **CSS** | Tailwind CSS | 4.x | APPROVED | JIT-only, zero-runtime, CSS-first config |
| **Router** | React Router | 7.x | APPROVED | Latest with Suspense boundary support |
| **State (server)** | TanStack Query | 5.x | APPROVED | Deduplication, background refetch, optimistic updates |
| **State (client)** | Zustand | 5.x | APPROVED | Minimal, no boilerplate, middleware support |
| **Forms** | React Hook Form + Zod | 7.x + 3.x | APPROVED | Uncontrolled by default (fastest), schema validation |
| **Components** | Radix UI Primitives | Latest | APPROVED | Headless, accessible, composable — zero HTML overhead |
| **Animation** | Framer Motion | 11.x | APPROVED | Hardware-accelerated, layout animations |
| **Charts** | Recharts | 2.x | APPROVED | React-native SVG charts, tree-shakeable |
| **Tables** | TanStack Table | 8.x | APPROVED | Headless, virtual scrolling capable |
| **Icons** | Lucide React | Latest | APPROVED | Tree-shakeable, 468+ icons |
| **HTTP** | Axios | Latest | APPROVED | Interceptors, retry, cancel tokens |
| **Dates** | date-fns | 4.x | APPROVED | Tree-shakeable, immutable, ESM-native |
| **Toasts** | Sonner | Latest | APPROVED | Minimal, stackable, accessible |
| **Command** | cmdk | 1.x | APPROVED | ⌘K interface, accessible |

### Mandatory Performance Patterns

1. **Route-based code splitting** — Every page MUST use `React.lazy()` + `<Suspense>`. Zero eagerly-loaded pages except the shell.
2. **Manual chunk splitting** — Vendor libraries MUST be separated into cacheable chunks (vendor-react, vendor-radix, vendor-charts, etc.).
3. **Build target: `esnext`** — No transpilation for legacy browsers. We target modern evergreen browsers only.
4. **CSS code splitting** — Enabled by default in Vite 6. Each route only loads its own CSS.
5. **esbuild minification** — For both JS and CSS. Faster than Terser, smaller output.
6. **No source maps in production** — Zero exposure of source code.
7. **Service Worker caching** — Cache-first for static assets, network-first for API calls.
8. **React Query stale/gc times** — 2min stale, 10min garbage collection. Aggressive background refetch.
9. **Preconnect/DNS-prefetch** — All external origins (fonts, Plaid, Basiq, TrueLayer) must be preconnected.
10. **Image lazy loading** — All images MUST use `loading="lazy"`. No eager image loads below the fold.

### Zero-HTML Component Philosophy

> **We use ZERO raw HTML where a component library exists.**
> - No `<select>` — use Radix Select
> - No `<dialog>` — use Radix Dialog
> - No `<details>` — use Radix Accordion
> - No `<input type="checkbox">` — use Radix Checkbox/Switch
> - No `<ul><li>` dropdowns — use Radix DropdownMenu
> - No `<div>` tooltips — use Radix Tooltip
> - No `<progress>` — use Radix Progress
> - No `<table>` without TanStack Table
> - No manual modals, drawers, popovers — use Radix/Vaul
>
> Every interactive element must be an accessible, headless primitive with proper ARIA, keyboard navigation, and focus management. Raw HTML is banned for interactive UI.

### Upgrade Protocol

When evaluating whether to upgrade a dependency:
1. **Check npm/GitHub weekly** for major version releases of our stack
2. **If a new major version ships** (e.g., React 20, Vite 7, Tailwind 5) — evaluate within 48 hours, migrate within 2 weeks
3. **If a faster alternative emerges** (e.g., a build tool faster than Vite) — evaluate immediately, prototype within 1 week
4. **Never pin to old versions** "because it works" — that's how tech debt accumulates
5. **Run `npm outdated` monthly** — anything >1 major version behind gets upgraded immediately

### Banned Technologies

| Technology | Why Banned | Replacement |
|-----------|-----------|-------------|
| Create React App | Dead project, slow builds | Vite |
| Webpack | Slower than Vite by 10-100x | Vite |
| Styled Components / CSS-in-JS runtime | Runtime overhead, bundle bloat | Tailwind CSS |
| Material UI / Ant Design | Heavy, opinionated, slow | Radix UI + Tailwind |
| Redux / Redux Toolkit | Boilerplate, unnecessary complexity | Zustand + React Query |
| Moment.js | Deprecated, 300KB+ | date-fns |
| jQuery | Legacy, unnecessary with React | Native React |
| Bootstrap | Utility-class conflict, heavy | Tailwind CSS |
| Lodash (full) | Tree-shaking issues, ES native alternatives exist | Native JS / date-fns |
| TypeORM (if ever backend) | Query builder overhead | Drizzle ORM / raw SQL |

---

## Nuclear SEO Campaign — Global Domination Strategy (Non-Negotiable)

### Mission: Rank #1 for Every Accounting Software Query in AU/NZ/UK/US

> **We don't just want visibility. We want to OWN the search results.**
> Every potential customer searching for accounting software must see Astra
> before they see Xero, QuickBooks, MYOB, Sage, or FreshBooks.

### SEO Architecture (Already Implemented)

- JSON-LD structured data: SoftwareApplication + FAQPage + Organization + BreadcrumbList
- Open Graph + Twitter Card meta tags on every page
- Canonical URLs with hreflang for AU/NZ/UK/US
- Sitemap with hreflang alternate links
- robots.txt allowing SEO tools (Semrush, Ahrefs) for competitive visibility
- PWA manifest for app store indexing

### Content SEO Strategy (Must Build)

#### 1. Comparison Landing Pages (HIGH PRIORITY)
Build dedicated public pages targeting "[competitor] alternative" keywords:
- `/compare/xero` — "Astra vs Xero — Why Accountants Are Switching"
- `/compare/quickbooks` — "Astra vs QuickBooks — Full Feature Comparison"
- `/compare/myob` — "Astra vs MYOB — Modern AI vs Legacy Software"
- `/compare/sage` — "Astra vs Sage — Enterprise Features at SMB Prices"
- `/compare/freshbooks` — "Astra vs FreshBooks — Real Accounting vs Invoicing"
Each page must: show feature-by-feature comparison table, include pricing comparison, have clear CTAs, use proper H1/H2/H3 hierarchy.

#### 2. Use Case Landing Pages
- `/for/accountants` — "Accounting Practice Management Software"
- `/for/bookkeepers` — "AI Bookkeeping Software for Bookkeepers"
- `/for/small-business` — "Small Business Accounting Software"
- `/for/freelancers` — "Freelancer Invoicing & Tax Software"
- `/for/construction` — "Construction Accounting Software"
- `/for/ecommerce` — "E-Commerce Accounting & Inventory"
- `/for/nonprofits` — "Nonprofit Fund Accounting Software"
- `/for/healthcare` — "Healthcare Practice Accounting"

#### 3. Feature Landing Pages
- `/features/ai-bookkeeping` — Target "AI accounting software"
- `/features/forensic-accounting` — Target "forensic accounting tools"
- `/features/multi-jurisdiction-tax` — Target "multi-country tax compliance"
- `/features/payroll` — Target "payroll software included"
- `/features/bank-feeds` — Target "automatic bank reconciliation"
- `/features/invoicing` — Target "invoice software free"
- `/features/inventory` — Target "inventory management accounting"

#### 4. Educational Content Hub (Blog/Resources)
- `/resources/guides` — Long-form guides (2,000-5,000 words)
  - "Complete Guide to BAS Lodgement in Australia"
  - "GST Filing Guide for New Zealand Businesses"
  - "UK VAT Return: Step-by-Step Guide"
  - "US Sales Tax Compliance by State"
  - "How to Detect Fraud in Your Books (Benford's Law Explained)"
  - "Month-End Close Checklist for Accountants"
- `/resources/templates` — Downloadable templates (lead magnets)
  - Invoice templates, BAS worksheets, payroll checklists
- `/resources/webinars` — Video content for authority building
- `/resources/glossary` — SEO-rich accounting terminology (200+ terms)

#### 5. Technical SEO Requirements
- **Core Web Vitals**: LCP < 2.5s, FID < 100ms, CLS < 0.1 (enforce with Lighthouse CI)
- **Page speed**: Mobile score > 90, Desktop score > 95
- **Internal linking**: Every page must link to 3-5 related pages
- **Schema markup on EVERY public page**: Article, HowTo, FAQ, Product, Review
- **Meta descriptions**: Unique, 150-160 chars, include primary keyword + CTA
- **H1 tags**: One per page, include primary target keyword
- **Image alt text**: Descriptive, keyword-rich, on every image
- **URL structure**: Clean, descriptive, keyword-containing slugs
- **Canonical tags**: On every page to prevent duplicate content

#### 6. Local SEO (Per-Country)
- Google Business Profile for each target market
- Country-specific content with local terminology (GST vs VAT vs Sales Tax)
- Local currency pricing on region-specific pages
- Testimonials/case studies from each target country

#### 7. Link Building Strategy
- Guest posts on accounting industry blogs
- Partner program pages with backlinks from certified accountants
- Integration partner pages with reciprocal links
- Press releases for major feature launches
- Industry award submissions (Fintech, SaaS, Accounting Tech)

### SEO Enforcement Rules

1. **Every new public page** must include: proper meta title/description, JSON-LD schema, OG tags, canonical URL, and be added to sitemap.xml
2. **Every public page** must pass Lighthouse SEO audit at 100/100
3. **No orphan pages** — every page reachable within 3 clicks from homepage
4. **No duplicate content** — unique title/description/H1 on every page
5. **Monitor weekly**: Google Search Console, Ahrefs/Semrush rankings, Core Web Vitals
6. **Target keywords per page**: 1 primary, 2-3 secondary, mapped in a keyword spreadsheet

---

## Missing Features — Day-to-Day Pain Points to Solve (Non-Negotiable)

### What Accountants/Bookkeepers Struggle With Daily

These are the real-world daily pain points that NO competitor fully solves. Building these turns Astra from "another accounting app" into "the platform I can't live without."

#### P1 — Must-Build (Immediate Competitive Impact)

| # | Feature | Pain Point It Solves | Competitor Status |
|---|---------|---------------------|-------------------|
| 1 | **Auto Bank Rule Engine** | "I categorize the same transactions every month manually" — Smart rules that learn from approvals and auto-apply to future transactions. Confidence scoring + auto-approve above threshold. | Xero has basic rules. QBO has some. None have AI-learning rules. |
| 2 | **Client Communication Log** | "I can't remember what I discussed with the client last week" — Unified log of emails, calls, notes, document requests per client. Linked to transactions and tax periods. | No competitor has this built-in. Everyone uses separate CRM. |
| 3 | **Deadline Countdown Dashboard** | "I missed a filing deadline because I forgot" — Visual countdown timers for EVERY deadline per client per jurisdiction. SMS/email/push alerts at 30/14/7/3/1 days. | No competitor has real-time countdown. They just have calendar events. |
| 4 | **Batch Operations Hub** | "I need to send 50 invoices / approve 100 transactions / file 20 BAS" — Bulk select + batch execute for every repetitive operation. Progress tracking with error recovery. | Xero has basic batch. QBO is limited. None have intelligent batching. |
| 5 | **Smart Receipt Matching** | "I have 200 receipts and 200 transactions — matching them takes hours" — AI matches receipts to transactions by amount, date, vendor. Handles fuzzy matching for rounding, currency conversion. | Dext/Hubdoc do this as separate products ($30/mo). Not built into any accounting platform. |
| 6 | **Expense Policy Enforcer** | "Employees submit expenses that violate our policy and I catch them too late" — Define rules (max meal $50, no alcohol, require receipt over $25). Auto-flag violations before approval. | SAP Concur has this ($8/user/mo). No SMB accounting platform does. |
| 7 | **Multi-Currency Auto-Revaluation** | "I manually revalue foreign currency balances every month-end" — Automatic FX revaluation using daily rates. Unrealized gain/loss calculations. Multi-currency P&L. | Xero does basic FX. None do automatic revaluation with gain/loss. |
| 8 | **Year-End Rollover Wizard** | "Year-end close is a nightmare — retained earnings, opening balances, tax provisions" — One-click year-end: auto-calculate retained earnings, create opening balances, carry forward provisions, generate year-end reports. | All competitors require manual year-end. Some have basic rollover. |
| 9 | **Audit Preparation Pack** | "My client is being audited and I need to pull everything together fast" — One-click audit pack: trial balance, GL, bank statements, receipts, aged receivables/payables, tax returns, rolled into a single PDF/ZIP. | No competitor generates audit packs. Accountants assemble manually. |
| 10 | **WIP (Work in Progress) Tracker** | "I don't know how much unbilled work each staff member has" — Real-time WIP by staff, by client, by engagement. Billable utilization %. WIP aging report. Auto-generate invoices from WIP. | Practice management tools have this (Karbon $59/mo, Ignition). Not in accounting platforms. |

#### P2 — Should-Build (Moat Deepening)

| # | Feature | Pain Point It Solves |
|---|---------|---------------------|
| 11 | **Loan & Liability Tracker** | Track loan balances, interest accruals, repayment schedules. Auto-create journal entries for interest. Amortization schedules. |
| 12 | **Dividend Calculator & Distribution** | Calculate franking credits (AU), imputation (NZ), dividend tax (UK/US). Generate distribution statements. |
| 13 | **Related Party Transaction Monitor** | Flag transactions between related entities. Ensure arm's-length pricing. Generate related party disclosure notes. |
| 14 | **Practice Workflow Automator** | "New client onboarded" → auto-create entity, set up bank feeds, create compliance calendar, assign team member, send welcome email. Zero manual steps. |
| 15 | **Client Health Dashboard** | At-a-glance view per client: overdue filings, missing documents, aging receivables, communication gaps. Red/amber/green status. |
| 16 | **Trust Account Management** | For law firms, real estate: separate trust account ledgers, automatic trust reconciliation, trust audit reports. Required in AU/NZ. |
| 17 | **Depreciation Schedule Engine** | Automatic asset depreciation: straight-line, diminishing value, units of production. Tax vs accounting depreciation. AU/NZ/UK/US rates built-in. |
| 18 | **GST/VAT Partial Exemption Calculator** | For mixed-supply businesses: auto-calculate input tax credit apportionment. Partial exemption methods (AU, NZ, UK). |
| 19 | **Inter-Entity Elimination Engine** | For group reporting: auto-eliminate inter-company transactions, generate consolidated P&L/BS. |
| 20 | **Custom Report Builder** | Drag-and-drop report builder. Any data field, any filter, any grouping. Save templates. Schedule auto-generation. |

#### P3 — Nice-to-Have (Future Differentiation)

| # | Feature | Description |
|---|---------|-------------|
| 21 | **AI Meeting Notes Summarizer** | Record client meetings, AI summarizes action items, creates tasks, links to transactions |
| 22 | **Regulatory Change Alerts** | AI monitors tax law changes (ATO, IRD, HMRC, IRS) and alerts when they affect clients |
| 23 | **Benchmarking Reports** | Compare client metrics against industry averages (anonymized platform data) |
| 24 | **White-Label Client App** | Accountants brand the client portal as their own app |
| 25 | **AI Tax Return Reviewer** | Before filing: AI reviews return for common errors, missing deductions, audit triggers |
| 26 | **Payment Gateway (Direct)** | Accept payments directly in Astra without Stripe — lower fees, faster settlement |
| 27 | **Embedded Lending** | "Based on your financials, you qualify for a $50K line of credit" — in-platform |
| 28 | **Carbon Accounting** | Track Scope 1/2/3 emissions from expense data. ESG reporting for compliance. |
| 29 | **Crypto Asset Tracking** | Import wallet/exchange data, calculate capital gains, cost base tracking |
| 30 | **Employee Self-Service Portal** | Employees view payslips, submit leave, update bank details, upload receipts |

### Enforcement

1. **Every sprint must ship at least 1 item from this list** in addition to the competitive scorecard work
2. **Features must be production-quality** — no stubs, no "coming soon", no placeholder UI
3. **Each feature ships with**: full UI, API endpoints, data persistence, error handling, loading states, empty states
4. **Priority order**: P1 first, then P2, then P3. Skip ahead only if a P1 is blocked by external dependency
5. **Update this list** when a feature is complete — move to "Implemented" section with date

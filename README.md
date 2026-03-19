# Astra — Autonomous Global Accounting Agent

The world's first autonomous accounting platform. AI-powered bookkeeping with
multi-jurisdiction tax compliance, treaty-aware cross-border calculations, and
a human-in-the-loop review workflow.

## The Four Pillars

| Pillar | What It Does |
|--------|-------------|
| **Global Tax Engine** | Deterministic tax calculations for US (IRS), AU (ATO), NZ (IRD), GB (HMRC). 6 bilateral DTAs with automatic WHT treaty application. |
| **Autonomous Ledger** | AI drafts double-entry transactions from bank feeds. Humans approve or flag. No manual data entry. |
| **Simple-Speak Interface** | Natural language financial queries. "How much did I spend on SaaS last month?" gets a real answer. |
| **Audit Shield** | Real-time risk scoring on every transaction. Continuous audit, not year-end panic. |

## Architecture

```
Frontend (React 18 + Vite + Tailwind)
  ├── Dashboard — pillar status, quick stats
  ├── Review Queue — approve/flag AI-drafted transactions
  ├── Tax Engine — interactive GST/WHT/treaty calculator
  └── Ask Astra — natural language financial queries

Backend (FastAPI + Python 3.11+)
  ├── Tax Engine (DETERMINISTIC)
  │   ├── Jurisdiction Registry — AU/NZ/US/GB rates, brackets, legislation refs
  │   ├── Treaty Engine — 6 bilateral DTAs, WHT calculations
  │   └── Tax Calculator — unified interface
  ├── AI Agents (PROBABILISTIC)
  │   ├── Categorizer — bank feed → chart of accounts
  │   ├── Narrator — financial data → plain English
  │   └── Auditor — real-time risk scoring (rules-based)
  ├── Models — Entity, Account, Transaction, Invoice, Tax, Audit
  └── API — RESTful routes for all operations

Database (Neon PostgreSQL + asyncpg)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | FastAPI, Python 3.11+, SQLAlchemy 2.0 |
| Database | Neon PostgreSQL (asyncpg) |
| AI | Anthropic Claude API |
| Banking | Plaid API |
| Email | Mailgun |
| Payments | Stripe |

## Getting Started

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # fill in your values
uvicorn main:app --host 0.0.0.0 --port 10000 --reload

# Frontend
cd frontend
npm install
npm run dev
```

API docs: http://localhost:10000/docs

## Key Design Decisions

- **Deterministic vs Probabilistic**: Tax math is hard-coded from legislation (zero AI guessing). AI is only used for categorization and narrative — things where "best guess + human review" is acceptable.
- **Statutory-First**: Tax compliance is built into the core, not bolted on as add-ons.
- **Human-in-the-Loop**: AI drafts, humans approve. Every transaction flows through the Review Queue.
- **Continuous Audit**: Risk scoring happens on every transaction, not at year-end.

## Roadmap

| Phase | Focus | Status |
|-------|-------|--------|
| Phase 1 | The Brain — multi-currency ledger, tax engine, AI agents | **In Progress** |
| Phase 2 | The Connectors — bank APIs, government portal integration | Planned |
| Phase 3 | The Agent — full reviewer dashboard with live data | Planned |
| Phase 4 | Global Scale — top 50 trade-partner country treaties | Planned |

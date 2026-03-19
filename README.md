# Ledger.Ai

AI-powered accounting platform for cross-border tax treaty management.

## Features
- Multi-jurisdiction accounting (US, NZ, AU, UK)
- Automated tax treaty calculations — all 6 bilateral combinations
- AI-assisted bookkeeping via Claude API
- Invoice management, bank reconciliation, tax reporting
- Making Tax Digital (UK) compliance

## Tech Stack
| Layer    | Tech                             |
|----------|----------------------------------|
| Frontend | React 18, CRA + CRACO, Tailwind |
| Backend  | FastAPI, Python 3.11+            |
| Database | Neon PostgreSQL (asyncpg)        |
| AI       | Anthropic Claude API             |
| Email    | Mailgun                          |
| Payments | Stripe                           |

## Getting Started
```bash
# Frontend
cd frontend && npm install && npm start

# Backend
cd backend && pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 10000

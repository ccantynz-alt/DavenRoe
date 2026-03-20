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
Our advantages: Multi-agent AI architecture, forensic intelligence, autonomous month-end close, cross-border tax treaty engine.
Our gaps to close: mobile app, native payroll, direct tax e-filing, integration marketplace.

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
- `/backend` - FastAPI application with 16+ API routers
- `/api` - Additional API code
- `/legal` - Legal compliance documents (AI disclosure, ToS, privacy policy)

## Development Branch

All work happens on feature branches prefixed with `claude/`.

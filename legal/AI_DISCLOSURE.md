# DavenRoe — AI Disclosure & Transparency Statement

**Last Updated: March 2026**

## What AI Does in DavenRoe

DavenRoe uses artificial intelligence in specific, clearly defined areas.
This document explains exactly what the AI does and does not do.

## Deterministic (Non-AI) Components — 100% Rule-Based

The following components use **hard-coded logic from published legislation**.
No AI is involved. These are mathematically verifiable:

| Component | What It Does | Source |
|-----------|-------------|--------|
| Tax Rate Registry | Calculates GST, VAT, income tax, corporate tax | Published legislation (cited per rate) |
| Treaty Engine | Applies bilateral DTA withholding rates | Published treaty texts |
| Audit Risk Scorer | Flags transactions based on reporting thresholds | Regulatory thresholds (AUSTRAC, FinCEN, etc.) |
| Double-Entry Validation | Ensures debits equal credits | Accounting standards |
| Forensic Engines | Benford's Law, statistical anomaly detection | Established statistical methods |

## AI-Powered (Probabilistic) Components

The following components use the Claude AI model. Their outputs are
**suggestions, not decisions**:

| Component | What It Does | Confidence Shown | Human Review |
|-----------|-------------|-----------------|--------------|
| Transaction Categorizer | Suggests account categories for bank feed transactions | Yes (0-100%) | **Required** |
| Financial Narrator | Writes plain-English summaries of financial data | N/A (narrative) | Recommended |
| Due Diligence Reporter | Generates forensic analysis reports | N/A (narrative) | **Required** |
| Natural Language Queries | Answers questions about your finances | N/A (conversational) | Recommended |

## Key Principles

1. **AI never files anything.** Tax returns, BAS, GST returns, and 1099s are
   drafted by the system but require explicit human submission.

2. **AI never moves money.** DavenRoe reads bank feeds but cannot initiate
   transactions, transfers, or payments.

3. **AI always shows its work.** Every AI categorization includes a confidence
   score and reasoning explanation.

4. **AI suggestions are always reviewable.** The Review Queue shows every
   AI-drafted transaction for human approval before posting.

5. **Tax math is never AI.** All tax calculations use deterministic logic.
   The AI writes narratives about tax data but never computes tax amounts.

## AI Model Information

- **Provider**: Anthropic (Claude)
- **Data Usage**: Your data is sent to Anthropic's API for processing.
  Per Anthropic's commercial terms, your data is NOT used to train AI models.
- **Data Retention**: API inputs/outputs are retained by Anthropic for up to
  30 days for trust and safety purposes, then deleted.

## How to Override AI Decisions

Every AI suggestion in DavenRoe can be:
- **Approved** — accepted as-is
- **Edited** — modified before approval
- **Flagged** — marked for professional review
- **Voided** — rejected entirely

You are always in control.

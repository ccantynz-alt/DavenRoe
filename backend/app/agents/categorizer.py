"""Transaction Categorization Agent.

PROBABILISTIC layer — uses Claude to categorize bank feed transactions.
The AI drafts; humans approve. This is the "Bookkeeper to Reviewer" shift.
"""

import json

import anthropic

from app.core.config import get_settings

SYSTEM_PROMPT = """You are a senior bookkeeper AI for Astra, an autonomous accounting platform.

Your job is to categorize bank feed transactions into the correct Chart of Accounts category.

Rules:
1. Analyze the transaction description, amount, and merchant name.
2. Assign the most likely account category (e.g., "Office Supplies", "SaaS Subscriptions", "Travel", etc.).
3. Provide a confidence score from 0.0 to 1.0.
4. If confidence < 0.7, flag for human review.
5. Provide brief reasoning for your categorization.
6. If you detect a potential tax deduction, note it.
7. Consider the entity's jurisdiction for tax-relevant categorization.

Respond in JSON format:
{
  "category": "account category name",
  "account_code": "suggested account code",
  "confidence": 0.95,
  "reasoning": "why you chose this category",
  "tax_relevant": true/false,
  "tax_code": "GST/VAT/EXEMPT/etc",
  "flags": ["any concerns or notes"],
  "suggested_description": "cleaned-up description for the ledger"
}"""


class CategorizationAgent:
    """Uses Claude to categorize transactions from bank feeds."""

    def __init__(self):
        settings = get_settings()
        self.client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        self.model = settings.anthropic_model

    async def categorize_transaction(
        self,
        description: str,
        amount: str,
        currency: str = "USD",
        merchant: str | None = None,
        jurisdiction: str = "US",
        account_list: list[dict] | None = None,
    ) -> dict:
        """Categorize a single bank feed transaction."""
        user_message = f"""Categorize this transaction:
- Description: {description}
- Amount: {currency} {amount}
- Merchant: {merchant or 'Unknown'}
- Jurisdiction: {jurisdiction}
"""
        if account_list:
            accounts_str = "\n".join(
                f"  {a['code']}: {a['name']} ({a['account_type']})"
                for a in account_list
            )
            user_message += f"\nAvailable accounts:\n{accounts_str}"

        response = await self.client.messages.create(
            model=self.model,
            max_tokens=500,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )

        try:
            result = json.loads(response.content[0].text)
        except (json.JSONDecodeError, IndexError):
            result = {
                "category": "Uncategorized",
                "confidence": 0.0,
                "reasoning": "Failed to parse AI response",
                "flags": ["requires_manual_review"],
                "raw_response": response.content[0].text if response.content else "",
            }

        return result

    async def categorize_batch(
        self, transactions: list[dict], jurisdiction: str = "US",
        account_list: list[dict] | None = None,
    ) -> list[dict]:
        """Categorize multiple transactions."""
        results = []
        for txn in transactions:
            result = await self.categorize_transaction(
                description=txn.get("description", ""),
                amount=str(txn.get("amount", "0")),
                currency=txn.get("currency", "USD"),
                merchant=txn.get("merchant"),
                jurisdiction=jurisdiction,
                account_list=account_list,
            )
            result["original_transaction"] = txn
            results.append(result)
        return results

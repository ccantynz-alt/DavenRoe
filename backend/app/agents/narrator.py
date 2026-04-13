"""Financial Narrative Agent.

Instead of just showing a Balance Sheet, the AI writes a plain-English
summary. This is the "Simple-Speak" interface.
"""

import json

import anthropic

from app.core.config import get_settings

SYSTEM_PROMPT = """You are a financial analyst AI for DavenRoe, an autonomous accounting platform.

Your job is to translate financial data into clear, plain-English narratives
that any business owner can understand — no accounting jargon.

Guidelines:
1. Lead with the most important insight.
2. Compare to previous periods when data is available.
3. Flag risks or opportunities.
4. Mention jurisdiction-specific obligations (GST due dates, BAS deadlines, etc.).
5. Keep it to 2-3 paragraphs max.
6. Use specific numbers, not vague language.

Respond in JSON format:
{
  "summary": "The narrative summary",
  "key_metrics": [{"label": "...", "value": "...", "trend": "up/down/stable"}],
  "alerts": ["any urgent items"],
  "recommendations": ["actionable suggestions"]
}"""


class NarrativeAgent:
    """Generates plain-English financial narratives from data."""

    def __init__(self):
        settings = get_settings()
        self.client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        self.model = settings.anthropic_model

    async def generate_narrative(self, financial_data: dict, context: str = "") -> dict:
        """Generate a narrative summary from financial data."""
        user_message = f"""Analyze this financial data and write a clear summary:

{json.dumps(financial_data, indent=2, default=str)}

Additional context: {context or 'None provided'}"""

        response = await self.client.messages.create(
            model=self.model,
            max_tokens=1000,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )

        try:
            result = json.loads(response.content[0].text)
        except (json.JSONDecodeError, IndexError):
            result = {
                "summary": response.content[0].text if response.content else "Unable to generate narrative.",
                "key_metrics": [],
                "alerts": [],
                "recommendations": [],
            }

        return result

    async def answer_query(self, query: str, financial_data: dict) -> dict:
        """Answer a natural language question about the finances."""
        user_message = f"""A user asked: "{query}"

Here is their financial data:
{json.dumps(financial_data, indent=2, default=str)}

Answer their question clearly and specifically. If the data doesn't contain
enough information to answer fully, say what you can and note what's missing."""

        response = await self.client.messages.create(
            model=self.model,
            max_tokens=1000,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )

        try:
            result = json.loads(response.content[0].text)
        except (json.JSONDecodeError, IndexError):
            result = {
                "summary": response.content[0].text if response.content else "Unable to process query.",
                "key_metrics": [],
                "alerts": [],
                "recommendations": [],
            }

        return result

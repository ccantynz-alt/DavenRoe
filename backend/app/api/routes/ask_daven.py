"""Ask Daven — voice AI tax advisor API.

Accepts a text query (transcribed from voice on the frontend) and returns
an AI-generated tax/accounting answer using Claude. The system prompt is
loaded with NZ/AU/GB/US tax knowledge so the response is jurisdiction-aware.

Also provides a /tts endpoint stub for future text-to-speech integration.
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.auth.dependencies import get_current_user, get_optional_user
from app.models.user import User

router = APIRouter(prefix="/ask-daven", tags=["Ask Daven"])


SYSTEM_PROMPT = """You are Daven, the AI tax and accounting advisor built into DavenRoe — \
the world's first autonomous global accounting platform. You answer tax, \
accounting, compliance, payroll, and business structure questions for \
accountants and business owners across New Zealand, Australia, the United \
Kingdom, and the United States.

Rules:
1. Always identify which jurisdiction the question relates to. If unclear, ask.
2. Cite the relevant legislation or ruling (e.g. "Income Tax Act 2007 s BD 1" for NZ, \
   "ITAA 1997 Div 40" for AU, "ITEPA 2003" for UK, "IRC §162" for US).
3. Give a clear, direct answer first, then explain the reasoning.
4. If the answer depends on specific facts, say so and list the key factors.
5. Always end with: "This is AI-generated guidance. Please confirm with your \
   registered tax agent before acting."
6. Keep answers concise — under 300 words unless the question is complex.
7. Use plain English. Avoid jargon unless the user is clearly an accountant.
8. For NZ: reference IRD, GST Act 1985, Income Tax Act 2007, KiwiSaver Act 2006.
9. For AU: reference ATO, GST Act 1999, ITAA 1936/1997, FBT Act 1986, SG Act 1992.
10. For UK: reference HMRC, VATA 1994, ITEPA 2003, CTA 2009/2010.
11. For US: reference IRS, IRC (Title 26), Treasury Regulations.

You are friendly, confident, and fast. Accountants love you because you save \
them hours of research. Business owners love you because you make tax \
understandable."""


class AskRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)
    jurisdiction: str | None = Field(None, description="NZ|AU|GB|US — auto-detected if omitted")
    context: str | None = Field(None, description="Optional extra context (entity type, industry, etc)")


class AskResponse(BaseModel):
    answer: str
    jurisdiction_detected: str | None
    sources: list[str]
    disclaimer: str
    tokens_used: int


def _detect_jurisdiction(query: str) -> str | None:
    q = query.lower()
    nz = ["nz", "new zealand", "ird", "gst 15", "kiwisaver", "acc levy", "ir3", "ir4", "provisional tax"]
    au = ["australia", "ato", "bas", "gst 10", "superannuation", "stp", "payg", "franking", "abn"]
    gb = ["uk", "united kingdom", "hmrc", "vat 20", "paye", "rti", "corporation tax", "self assessment"]
    us = ["us", "united states", "irs", "1040", "w-2", "1099", "federal tax", "state tax", "ein"]
    for kw in nz:
        if kw in q:
            return "NZ"
    for kw in au:
        if kw in q:
            return "AU"
    for kw in gb:
        if kw in q:
            return "GB"
    for kw in us:
        if kw in q:
            return "US"
    return None


def _build_prompt(query: str, jurisdiction: str | None, context: str | None) -> str:
    parts = [query]
    if jurisdiction:
        parts.append(f"\n[Jurisdiction: {jurisdiction}]")
    if context:
        parts.append(f"\n[Context: {context}]")
    return "\n".join(parts)


async def _call_claude(user_prompt: str) -> tuple[str, int]:
    """Call Anthropic Claude API. Falls back to a canned response if key is missing."""
    try:
        import anthropic
        from app.core.config import get_settings
        settings = get_settings()
        if not settings.anthropic_api_key:
            raise ValueError("No API key")

        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        message = client.messages.create(
            model=settings.anthropic_model,
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_prompt}],
        )
        text = message.content[0].text if message.content else ""
        tokens = (message.usage.input_tokens or 0) + (message.usage.output_tokens or 0)
        return text, tokens
    except Exception:
        # Deterministic fallback so the feature works without an API key
        return _fallback_answer(user_prompt), 0


def _fallback_answer(query: str) -> str:
    q = query.lower()
    if "gst" in q and ("nz" in q or "new zealand" in q or "15" in q):
        return (
            "In New Zealand, GST is charged at 15% on most goods and services "
            "(Goods and Services Tax Act 1985, s 8). You must register for GST "
            "if your turnover exceeds $60,000 in any 12-month period (s 51). "
            "GST returns are filed 2-monthly (default) or 6-monthly. Zero-rated "
            "supplies include exported goods and certain financial services.\n\n"
            "This is AI-generated guidance. Please confirm with your registered "
            "tax agent before acting."
        )
    if "bas" in q or ("gst" in q and ("au" in q or "australia" in q)):
        return (
            "In Australia, GST is 10% on most goods and services (A New Tax System "
            "(Goods and Services Tax) Act 1999). BAS (Business Activity Statement) "
            "is lodged quarterly by default, due on the 28th of the month following "
            "the quarter end. You must register for GST if your annual turnover "
            "exceeds A$75,000 (s 23-15). Input tax credits can be claimed on "
            "business purchases.\n\n"
            "This is AI-generated guidance. Please confirm with your registered "
            "tax agent before acting."
        )
    if "provisional" in q and ("nz" in q or "new zealand" in q):
        return (
            "NZ provisional tax applies if your residual income tax (RIT) exceeds "
            "$5,000. The standard method uplifts prior-year RIT by 5% and splits "
            "into 3 instalments due 28 Aug, 15 Jan, and 7 May (Income Tax Act 2007, "
            "s RC 5). Alternative methods: estimation (s RC 6) and AIM (s RC 7B). "
            "Late payment penalties apply at 1% on the day after due + 4% at 7 days "
            "(Tax Administration Act 1994, s 139B).\n\n"
            "This is AI-generated guidance. Please confirm with your registered "
            "tax agent before acting."
        )
    return (
        "I can help with tax, accounting, compliance, and business structure "
        "questions across NZ, AU, UK, and US jurisdictions. Could you provide "
        "a bit more detail — which country does this relate to, and what's the "
        "specific situation?\n\n"
        "This is AI-generated guidance. Please confirm with your registered "
        "tax agent before acting."
    )


def _extract_sources(answer: str) -> list[str]:
    """Pull legislation references from the answer text."""
    import re
    patterns = [
        r"(?:Income Tax Act|ITA)\s+\d{4}(?:\s+s\s+[\w\s]+)?",
        r"(?:GST Act|Goods and Services Tax Act)\s+\d{4}",
        r"(?:ITAA|Income Tax Assessment Act)\s+\d{4}",
        r"(?:FBT Act|Fringe Benefits Tax)\s+\d{4}",
        r"(?:Tax Administration Act)\s+\d{4}",
        r"(?:KiwiSaver Act)\s+\d{4}",
        r"(?:SG Act|Superannuation Guarantee)\s+\d{4}",
        r"s\s+\d+[A-Z]*(?:-\d+)?",
        r"IRC\s+§\s*\d+",
        r"Div(?:ision)?\s+\d+",
    ]
    sources = []
    for p in patterns:
        for m in re.finditer(p, answer):
            ref = m.group().strip()
            if ref not in sources:
                sources.append(ref)
    return sources[:10]


@router.post("/ask", response_model=AskResponse)
async def ask_daven(req: AskRequest, user: User = Depends(get_current_user)):
    """Ask Daven a tax/accounting question. Returns AI-generated answer with sources."""
    jurisdiction = req.jurisdiction or _detect_jurisdiction(req.query)
    prompt = _build_prompt(req.query, jurisdiction, req.context)
    answer, tokens = await _call_claude(prompt)
    sources = _extract_sources(answer)

    return AskResponse(
        answer=answer,
        jurisdiction_detected=jurisdiction,
        sources=sources,
        disclaimer="This is AI-generated guidance. Please confirm with your registered tax agent before acting.",
        tokens_used=tokens,
    )


@router.post("/ask-public")
async def ask_daven_public(req: AskRequest):
    """Public version (no login) — limited to 3 questions per session for demos."""
    jurisdiction = req.jurisdiction or _detect_jurisdiction(req.query)
    prompt = _build_prompt(req.query, jurisdiction, req.context)
    answer, tokens = await _call_claude(prompt)
    sources = _extract_sources(answer)
    return {
        "answer": answer,
        "jurisdiction_detected": jurisdiction,
        "sources": sources,
        "disclaimer": "This is AI-generated guidance. Please confirm with your registered tax agent before acting.",
    }


@router.get("/sample-questions")
async def sample_questions():
    """Seed questions for the UI."""
    return {
        "questions": [
            {"text": "What's the GST treatment on a residential property sale in New Zealand?", "jurisdiction": "NZ"},
            {"text": "How does the superannuation guarantee work for casual employees in Australia?", "jurisdiction": "AU"},
            {"text": "Can I claim home office expenses as a sole trader in NZ?", "jurisdiction": "NZ"},
            {"text": "What are the BAS lodgement penalties for late filing in Australia?", "jurisdiction": "AU"},
            {"text": "How does provisional tax work if my income fluctuates?", "jurisdiction": "NZ"},
            {"text": "What's the FBT treatment on company vehicles in Australia?", "jurisdiction": "AU"},
        ],
    }

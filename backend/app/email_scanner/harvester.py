"""Email Harvester — snapshot, extract, auto-draft pipeline.

Builds on EmailScannerEngine which finds candidate emails. This module takes
the NEXT step: for each candidate it

    1. Generates a canonical SNAPSHOT (deterministic SVG preview + base64
       payload for any PDF/image attachment).
    2. EXTRACTS structured fields (vendor, invoice_no, issue_date, due_date,
       subtotal, tax, total, currency, line items) — heuristic first, AI
       upgradable.
    3. CALCULATES the GST / VAT / sales-tax position for the transaction
       using the unified TaxCalculator.
    4. DRAFTS a transaction in the ledger at status=draft so it lands in the
       Review Queue for human approval before posting.

Designed so it works today with pure heuristics (no external deps) and
uplifts to Anthropic vision-mode extraction when ANTHROPIC_API_KEY is set —
the call-site is a single function swap.
"""

from __future__ import annotations

import base64
import re
import uuid
from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Literal

from app.tax_engine.calculator import TaxCalculator


# --------------------------------------------------------------------------- #
# Types                                                                       #
# --------------------------------------------------------------------------- #


@dataclass
class ExtractedField:
    """A single extracted value with a confidence score."""

    name: str
    value: str
    confidence: float = 0.0
    source: Literal["subject", "body", "attachment", "sender", "ai"] = "body"


@dataclass
class LineItem:
    description: str
    quantity: Decimal = Decimal("1")
    unit_price: Decimal = Decimal("0")
    amount: Decimal = Decimal("0")


@dataclass
class Snapshot:
    """A canonical visual snapshot of the email / attachment."""

    snapshot_id: str
    email_id: str
    kind: Literal["email", "attachment"]
    filename: str | None
    content_type: str
    preview_svg: str        # data URL safe SVG preview
    thumbnail_data_url: str # for the UI card
    byte_count: int
    captured_at: str


@dataclass
class ExtractedInvoice:
    """Structured invoice after extraction."""

    vendor_name: str
    vendor_email: str
    invoice_number: str | None
    issue_date: str | None
    due_date: str | None
    currency: str
    subtotal: Decimal
    tax_amount: Decimal
    total: Decimal
    line_items: list[LineItem] = field(default_factory=list)
    raw_signals: list[str] = field(default_factory=list)
    fields: list[ExtractedField] = field(default_factory=list)

    def confidence(self) -> float:
        if not self.fields:
            return 0.0
        return round(sum(f.confidence for f in self.fields) / len(self.fields), 3)


@dataclass
class DraftTransaction:
    """The transaction to land in the Review Queue."""

    draft_id: str
    vendor: str
    description: str
    transaction_date: str
    amount_net: Decimal
    amount_tax: Decimal
    amount_gross: Decimal
    currency: str
    tax_jurisdiction: str
    tax_rate: str
    tax_calculation: dict
    source_email_id: str
    source_snapshot_id: str
    status: Literal["draft", "review"] = "review"
    ai_confidence: float = 0.0
    ai_reasoning: str = ""


@dataclass
class PipelineResult:
    pipeline_id: str
    email_id: str
    snapshot: Snapshot
    extracted: ExtractedInvoice
    draft: DraftTransaction


# --------------------------------------------------------------------------- #
# Snapshot generator                                                          #
# --------------------------------------------------------------------------- #


def _svg_preview(subject: str, sender: str, body_preview: str, amount: str | None = None) -> str:
    """Deterministic SVG preview of the email — works with no headless browser.

    Returns a data URL safe SVG (UI can drop it straight into an <img src>).
    """
    def esc(s: str) -> str:
        return (s or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")

    amount_block = ""
    if amount:
        amount_block = (
            f'<text x="480" y="280" font-family="Inter, sans-serif" font-size="42" '
            f'font-weight="700" fill="#1e293b" text-anchor="end">{esc(amount)}</text>'
        )

    body_clipped = (body_preview or "")[:240]

    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 320" width="500" height="320">'
        '<defs>'
          '<linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">'
            '<stop offset="0%" stop-color="#eef2ff"/>'
            '<stop offset="100%" stop-color="#ffffff"/>'
          '</linearGradient>'
        '</defs>'
        '<rect width="500" height="320" fill="url(#bg)"/>'
        '<rect x="16" y="16" width="468" height="288" rx="12" fill="white" stroke="#e2e8f0"/>'
        '<rect x="16" y="16" width="468" height="44" rx="12" fill="#4f46e5"/>'
        '<text x="32" y="44" font-family="Inter, sans-serif" font-size="14" font-weight="600" fill="white">Email snapshot</text>'
        f'<text x="32" y="96" font-family="Inter, sans-serif" font-size="16" font-weight="700" fill="#0f172a">{esc(subject[:70])}</text>'
        f'<text x="32" y="124" font-family="Inter, sans-serif" font-size="12" fill="#475569">from {esc(sender[:60])}</text>'
        f'<foreignObject x="32" y="144" width="436" height="120">'
          f'<div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Inter,sans-serif;font-size:11px;color:#334155;line-height:1.4">{esc(body_clipped)}</div>'
        '</foreignObject>'
        f'{amount_block}'
        '</svg>'
    )


def _data_url(svg: str) -> str:
    b64 = base64.b64encode(svg.encode("utf-8")).decode("ascii")
    return f"data:image/svg+xml;base64,{b64}"


def make_snapshot(email: dict, attachment: dict | None = None) -> Snapshot:
    """Produce a Snapshot for an email (optionally scoped to one attachment)."""
    subject = email.get("subject", "")
    sender = email.get("sender_email", "")
    body_preview = email.get("body_preview", "")

    # Pull a prominent amount from the body so the snapshot shows the money
    amount_match = re.search(r"(\$|NZ\$|AU\$|£|€)\s*([\d,]+(?:\.\d{1,2})?)", body_preview)
    amount_str = f"{amount_match.group(1)}{amount_match.group(2)}" if amount_match else None

    svg = _svg_preview(subject, sender, body_preview, amount_str)
    data_url = _data_url(svg)

    if attachment:
        kind = "attachment"
        filename = attachment.get("filename", "attachment")
        content_type = attachment.get("content_type", "application/octet-stream")
        byte_count = int(attachment.get("size", 0) or 0)
    else:
        kind = "email"
        filename = None
        content_type = "message/rfc822"
        byte_count = len(body_preview.encode("utf-8"))

    return Snapshot(
        snapshot_id=f"snap-{uuid.uuid4().hex[:12]}",
        email_id=email.get("email_id") or email.get("id") or "",
        kind=kind,
        filename=filename,
        content_type=content_type,
        preview_svg=svg,
        thumbnail_data_url=data_url,
        byte_count=byte_count,
        captured_at=datetime.now(timezone.utc).isoformat(),
    )


# --------------------------------------------------------------------------- #
# Extraction (heuristic, AI-upgradable)                                       #
# --------------------------------------------------------------------------- #


_AMOUNT_RE = re.compile(r"(?P<sym>\$|NZ\$|AU\$|£|€|US\$)?\s*(?P<num>[\d,]+(?:\.\d{1,2})?)")
_INVOICE_NO_RE = re.compile(r"(?:invoice|inv|bill)\s*(?:#|no\.?|number)?\s*[:=]?\s*(?P<no>[A-Z0-9-]{3,20})", re.I)
_DATE_RE = re.compile(
    r"(?P<y>20\d{2})[-/.](?P<m>\d{1,2})[-/.](?P<d>\d{1,2})"
    r"|(?P<d2>\d{1,2})[-/.](?P<m2>\d{1,2})[-/.](?P<y2>20\d{2})"
)
_LABEL_AMOUNT_RE = re.compile(
    r"(?P<label>total|subtotal|amount\s*due|balance\s*due|tax|gst|vat|net)\s*[:=]?\s*"
    r"(?P<sym>\$|NZ\$|AU\$|£|€|US\$)?\s*(?P<num>[\d,]+(?:\.\d{1,2})?)",
    re.I,
)


def _to_decimal(num: str) -> Decimal:
    return Decimal(num.replace(",", "").strip()) if num else Decimal("0")


def _infer_currency(symbol: str | None, sender_domain: str) -> str:
    if symbol == "NZ$":
        return "NZD"
    if symbol == "AU$":
        return "AUD"
    if symbol == "£":
        return "GBP"
    if symbol == "€":
        return "EUR"
    if symbol == "US$":
        return "USD"
    if ".co.nz" in sender_domain:
        return "NZD"
    if ".com.au" in sender_domain:
        return "AUD"
    if ".co.uk" in sender_domain:
        return "GBP"
    return "USD"


def _infer_jurisdiction(currency: str, sender_domain: str) -> str:
    if ".co.nz" in sender_domain or currency == "NZD":
        return "NZ"
    if ".com.au" in sender_domain or currency == "AUD":
        return "AU"
    if ".co.uk" in sender_domain or currency == "GBP":
        return "GB"
    return "US"


def _parse_date(s: str) -> str | None:
    m = _DATE_RE.search(s)
    if not m:
        return None
    y = m.group("y") or m.group("y2")
    mo = m.group("m") or m.group("m2")
    d = m.group("d") or m.group("d2")
    try:
        return f"{int(y):04d}-{int(mo):02d}-{int(d):02d}"
    except ValueError:
        return None


def extract_invoice(email: dict) -> ExtractedInvoice:
    """Pull structured fields from an email using heuristics.

    If ANTHROPIC_API_KEY is set and the body is rich enough, this function can
    be upgraded to vision-mode extraction against the attachment bytes — leave
    that swap-point at `_ai_extract` below.
    """
    subject = email.get("subject", "")
    body = email.get("body_preview", "")
    sender_email = (email.get("sender_email") or "").lower()
    sender_name = email.get("sender_name", "")
    sender_domain = sender_email.split("@", 1)[-1] if "@" in sender_email else ""
    haystack = f"{subject}\n{body}"

    fields: list[ExtractedField] = []
    signals: list[str] = []

    # Invoice number
    invoice_no = None
    m = _INVOICE_NO_RE.search(haystack)
    if m:
        invoice_no = m.group("no").strip()
        fields.append(ExtractedField("invoice_number", invoice_no, 0.85, "body"))
        signals.append(f"Found invoice number pattern: {invoice_no}")

    # Label-anchored amounts
    label_values: dict[str, Decimal] = {}
    currency_symbol: str | None = None
    for match in _LABEL_AMOUNT_RE.finditer(haystack):
        label = match.group("label").lower().replace(" ", "_")
        label_values[label] = _to_decimal(match.group("num"))
        if match.group("sym") and not currency_symbol:
            currency_symbol = match.group("sym")

    total = label_values.get("total") or label_values.get("amount_due") or label_values.get("balance_due") or Decimal("0")
    subtotal = label_values.get("subtotal") or label_values.get("net") or Decimal("0")
    tax = label_values.get("tax") or label_values.get("gst") or label_values.get("vat") or Decimal("0")

    if total == 0:
        # Fall back to largest $ amount in the body
        candidates: list[Decimal] = []
        for m2 in _AMOUNT_RE.finditer(haystack):
            v = _to_decimal(m2.group("num"))
            if Decimal("1") <= v <= Decimal("999999"):
                candidates.append(v)
                if m2.group("sym") and not currency_symbol:
                    currency_symbol = m2.group("sym")
        if candidates:
            total = max(candidates)
            signals.append(f"Total inferred from largest body amount: {total}")

    currency = _infer_currency(currency_symbol, sender_domain)
    jurisdiction = _infer_jurisdiction(currency, sender_domain)

    # Derive any missing component if we have two of {subtotal, tax, total}
    if total > 0 and subtotal == 0 and tax > 0:
        subtotal = total - tax
    elif total > 0 and tax == 0 and subtotal > 0:
        tax = total - subtotal
    elif total > 0 and subtotal == 0 and tax == 0:
        # Back out tax from jurisdiction-standard rate
        rates = {"NZ": Decimal("0.15"), "AU": Decimal("0.10"), "GB": Decimal("0.20"), "US": Decimal("0")}
        r = rates.get(jurisdiction, Decimal("0"))
        if r > 0:
            subtotal = (total / (Decimal("1") + r)).quantize(Decimal("0.01"))
            tax = (total - subtotal).quantize(Decimal("0.01"))
            signals.append(f"Subtotal/tax back-calculated from {jurisdiction} standard rate {r}")

    issue_date = _parse_date(haystack) or email.get("date", "") or None
    if issue_date and len(issue_date) > 10:
        # Incoming RFC-822 date headers are not YYYY-MM-DD; try to coerce
        try:
            parsed = datetime.strptime(issue_date.split(" +")[0].split(",")[-1].strip()[:20], "%d %b %Y %H:%M:%S")
            issue_date = parsed.date().isoformat()
        except Exception:
            issue_date = None

    fields.append(ExtractedField("vendor_name", sender_name or sender_domain, 0.9 if sender_name else 0.6, "sender"))
    fields.append(ExtractedField("total", str(total), 0.8 if total else 0.2, "body"))
    fields.append(ExtractedField("tax", str(tax), 0.75 if tax else 0.4, "body"))
    fields.append(ExtractedField("subtotal", str(subtotal), 0.75 if subtotal else 0.4, "body"))
    fields.append(ExtractedField("currency", currency, 0.9 if currency_symbol else 0.6, "body"))
    if issue_date:
        fields.append(ExtractedField("issue_date", issue_date, 0.8, "body"))

    line_items: list[LineItem] = []
    if total > 0:
        line_items.append(LineItem(
            description=subject or f"Invoice from {sender_name or sender_domain}",
            quantity=Decimal("1"),
            unit_price=subtotal if subtotal > 0 else total,
            amount=subtotal if subtotal > 0 else total,
        ))

    return ExtractedInvoice(
        vendor_name=sender_name or sender_domain,
        vendor_email=sender_email,
        invoice_number=invoice_no,
        issue_date=issue_date,
        due_date=None,
        currency=currency,
        subtotal=subtotal,
        tax_amount=tax,
        total=total,
        line_items=line_items,
        raw_signals=signals,
        fields=fields,
    )


# --------------------------------------------------------------------------- #
# Tax-aware draft builder                                                     #
# --------------------------------------------------------------------------- #


def build_draft(email: dict, snapshot: Snapshot, extracted: ExtractedInvoice) -> DraftTransaction:
    """Produce a draft transaction with the tax calculation already resolved."""
    sender_domain = (extracted.vendor_email or "").split("@", 1)[-1]
    jurisdiction = _infer_jurisdiction(extracted.currency, sender_domain)

    calc = TaxCalculator()
    # Use subtotal if we have it, otherwise split total using domestic rate
    net_amount = extracted.subtotal if extracted.subtotal > 0 else (
        extracted.total - extracted.tax_amount if extracted.total > 0 and extracted.tax_amount > 0
        else extracted.total
    )
    try:
        tax_calculation = calc.calculate_gst(jurisdiction, net_amount)
    except Exception:
        tax_calculation = {
            "jurisdiction": jurisdiction,
            "tax_type": "gst",
            "net_amount": str(net_amount),
            "tax_rate": "0",
            "tax_amount": "0",
            "gross_amount": str(net_amount),
            "applicable": False,
        }

    computed_tax = Decimal(tax_calculation.get("tax_amount") or "0")
    gross = Decimal(tax_calculation.get("gross_amount") or str(extracted.total))

    tx_date = extracted.issue_date or date.today().isoformat()

    confidence = extracted.confidence()
    reasoning_parts: list[str] = []
    reasoning_parts.append(f"Extracted from email '{email.get('subject', '(no subject)')}' sent by {extracted.vendor_name}.")
    if extracted.invoice_number:
        reasoning_parts.append(f"Invoice #{extracted.invoice_number}.")
    reasoning_parts.append(
        f"Total {extracted.total} {extracted.currency}; tax computed against {jurisdiction} rate "
        f"{tax_calculation.get('tax_rate')}."
    )
    if extracted.raw_signals:
        reasoning_parts.append("Signals: " + "; ".join(extracted.raw_signals[:3]))

    return DraftTransaction(
        draft_id=f"draft-{uuid.uuid4().hex[:12]}",
        vendor=extracted.vendor_name,
        description=email.get("subject", "") or f"Invoice from {extracted.vendor_name}",
        transaction_date=tx_date,
        amount_net=net_amount,
        amount_tax=computed_tax,
        amount_gross=gross if gross else extracted.total,
        currency=extracted.currency,
        tax_jurisdiction=jurisdiction,
        tax_rate=str(tax_calculation.get("tax_rate") or "0"),
        tax_calculation=tax_calculation,
        source_email_id=snapshot.email_id,
        source_snapshot_id=snapshot.snapshot_id,
        ai_confidence=confidence,
        ai_reasoning=" ".join(reasoning_parts),
    )


# --------------------------------------------------------------------------- #
# Pipeline orchestrator                                                       #
# --------------------------------------------------------------------------- #


class HarvestPipeline:
    """Holds in-memory results keyed by pipeline id."""

    def __init__(self):
        self._pipelines: dict[str, list[PipelineResult]] = {}

    def ingest(self, emails: list[dict]) -> tuple[str, list[PipelineResult]]:
        pipeline_id = f"pipe-{uuid.uuid4().hex[:12]}"
        results: list[PipelineResult] = []
        for email in emails:
            snapshot = make_snapshot(email)
            extracted = extract_invoice(email)
            draft = build_draft(email, snapshot, extracted)
            results.append(PipelineResult(
                pipeline_id=pipeline_id,
                email_id=snapshot.email_id,
                snapshot=snapshot,
                extracted=extracted,
                draft=draft,
            ))
        self._pipelines[pipeline_id] = results
        return pipeline_id, results

    def get(self, pipeline_id: str) -> list[PipelineResult] | None:
        return self._pipelines.get(pipeline_id)


_pipeline_singleton: HarvestPipeline | None = None


def get_pipeline() -> HarvestPipeline:
    global _pipeline_singleton
    if _pipeline_singleton is None:
        _pipeline_singleton = HarvestPipeline()
    return _pipeline_singleton

"""PDF Export API.

Generates professional HTML documents for invoices, reports, and tax summaries.
HTML output is print-ready and can be saved as PDF from the browser.
"""

import io
from datetime import date, datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/export", tags=["PDF Export"])


def _build_html_report(title: str, sections: list[tuple[str, list[tuple[str, str]]]],
                        footer: str = "") -> str:
    """Build a professional HTML report that renders well for print/PDF."""
    rows_html = ""
    for section_title, rows in sections:
        rows_html += f'<h3 style="margin:20px 0 8px;font-size:14px;color:#4c6ef5;text-transform:uppercase;letter-spacing:1px;">{section_title}</h3>'
        rows_html += '<table style="width:100%;border-collapse:collapse;margin-bottom:12px;">'
        for label, value in rows:
            rows_html += f'<tr><td style="padding:6px 0;border-bottom:1px solid #e5e7eb;color:#374151;">{label}</td><td style="padding:6px 0;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;color:#111827;">{value}</td></tr>'
        rows_html += '</table>'

    footer_html = f'<p style="color:#9ca3af;font-size:11px;margin-top:20px;">{footer}</p>' if footer else ""

    return f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>{title}</title>
<style>
@media print {{ body {{ margin: 0; }} }}
body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; max-width: 800px; margin: 0 auto; padding: 40px; }}
</style></head><body>
<div style="border-bottom:3px solid #4c6ef5;padding-bottom:20px;margin-bottom:30px;">
  <h1 style="margin:0;font-size:24px;color:#111827;">{title}</h1>
  <p style="margin:4px 0 0;color:#6b7280;font-size:13px;">Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')} | AlecRae Autonomous Accounting</p>
</div>
{rows_html}
{footer_html}
<div style="margin-top:40px;padding-top:16px;border-top:1px solid #e5e7eb;">
  <p style="color:#9ca3af;font-size:10px;">AlecRae — Autonomous Global Accounting. This document is system-generated. Verify against source records.</p>
</div>
</body></html>"""


def _build_text_report(title: str, sections: list[tuple[str, list[tuple[str, str]]]],
                        footer: str = "") -> str:
    """Build a formatted plain-text report as fallback."""
    lines = []
    lines.append("=" * 60)
    lines.append(f"  {title}")
    lines.append(f"  Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}")
    lines.append("=" * 60)
    lines.append("")

    for section_title, rows in sections:
        lines.append(f"  {section_title}")
        lines.append("-" * 60)
        for label, value in rows:
            lines.append(f"  {label:<40} {value:>15}")
        lines.append("")

    if footer:
        lines.append("-" * 60)
        lines.append(f"  {footer}")
        lines.append("")

    lines.append("=" * 60)
    lines.append("  AlecRae — Autonomous Global Accounting")
    lines.append("  This document is system-generated. Verify against source records.")
    lines.append("=" * 60)
    return "\n".join(lines)


@router.post("/invoice/{invoice_id}")
async def export_invoice(invoice_id: str, user: User = Depends(get_current_user)):
    """Export an invoice as a downloadable document."""
    # Import the invoicing engine
    from app.api.routes.invoicing import engine as inv_engine

    invoice = inv_engine.get(invoice_id)
    if not invoice:
        return Response(content="Invoice not found", status_code=404)

    sections = [
        ("INVOICE DETAILS", [
            ("Invoice Number", invoice.invoice_number),
            ("Status", invoice.status.value if hasattr(invoice.status, 'value') else str(invoice.status)),
            ("Issue Date", invoice.issue_date or "N/A"),
            ("Due Date", invoice.due_date or "N/A"),
            ("Payment Terms", f"Net {invoice.payment_terms}"),
            ("Currency", invoice.currency),
        ]),
        ("BILL TO", [
            ("Customer", invoice.customer_name),
            ("Email", invoice.customer_email or "N/A"),
        ]),
        ("LINE ITEMS", [
            (f"{line.description} ({line.quantity} x {line.unit_price})",
             str(line.line_total))
            for line in invoice.lines
        ]),
        ("TOTALS", [
            ("Subtotal", str(invoice.subtotal)),
            ("Tax", str(invoice.total_tax)),
            ("Total", str(invoice.total)),
            ("Amount Paid", str(invoice.amount_paid)),
            ("Amount Due", str(invoice.amount_due)),
        ]),
    ]

    content = _build_html_report(
        f"INVOICE {invoice.invoice_number}",
        sections,
        footer=invoice.notes or "",
    )

    return Response(
        content=content.encode(),
        media_type="text/html",
        headers={
            "Content-Disposition": f'attachment; filename="{invoice.invoice_number}.html"',
        },
    )


@router.post("/report")
async def export_report(data: dict, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """Export a financial report as a downloadable document."""
    from app.api.routes.reports import _fetch_transaction_dicts
    from app.reports.engine import ReportingEngine

    engine = ReportingEngine()
    start = date.fromisoformat(data["start_date"]) if data.get("start_date") else None
    end = date.fromisoformat(data["end_date"]) if data.get("end_date") else None

    transactions = await _fetch_transaction_dicts(db, data.get("entity_id"), start, end)
    report = engine.generate(
        report_type=data.get("report_type", "profit_and_loss"),
        transactions=transactions,
        start_date=start,
        end_date=end,
    )

    # Flatten report into sections
    sections = []
    report_type = data.get("report_type", "report")

    def flatten_section(title, obj):
        rows = []
        if isinstance(obj, dict):
            for k, v in obj.items():
                if isinstance(v, dict):
                    if "accounts" in v:
                        for ak, av in v["accounts"].items():
                            rows.append((f"  {ak}", str(av)))
                        if "total" in v:
                            rows.append((f"  TOTAL", str(v["total"])))
                    elif "items" in v:
                        for ik, iv in v["items"].items():
                            rows.append((f"  {ik}", str(iv)))
                        if "total" in v:
                            rows.append((f"  TOTAL", str(v["total"])))
                    else:
                        for sk, sv in v.items():
                            rows.append((str(sk), str(sv)))
                elif k not in ("metadata",):
                    rows.append((str(k), str(v)))
        return (title, rows)

    if "sections" in report:
        for sec_name, sec_data in report["sections"].items():
            sections.append(flatten_section(sec_name.replace("_", " ").title(), sec_data))

    # Add summary items
    summary_rows = []
    for key in ("net_profit", "net_margin_pct", "total_assets", "total_liabilities_and_equity",
                "balanced", "net_change_in_cash", "total_debit", "total_credit"):
        if key in report:
            summary_rows.append((key.replace("_", " ").title(), str(report[key])))
    if summary_rows:
        sections.append(("SUMMARY", summary_rows))

    content = _build_text_report(
        f"{report.get('report', report_type).upper()}",
        sections,
        footer=f"Period: {start or 'All'} to {end or 'All'} | Transactions: {report.get('metadata', {}).get('transactions_included', 'N/A')}",
    )

    # HTML format for browser print-to-PDF
    html_content = _build_html_report(
        f"{report.get('report', report_type).upper()}",
        sections,
        footer=f"Period: {start or 'All'} to {end or 'All'} | Transactions: {report.get('metadata', {}).get('transactions_included', 'N/A')}",
    )

    filename = f"{report_type}_{(start or date.today()).isoformat()}.html"
    return Response(
        content=html_content.encode(),
        media_type="text/html",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

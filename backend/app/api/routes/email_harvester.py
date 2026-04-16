"""Email Harvester API — snapshot, extract, auto-draft pipeline.

The complement to /email-scanner (which *finds* emails). This router takes a
batch of emails (real from a scan, or user-pasted for the demo mode) and
runs the full ingestion pipeline — snapshot, extract, GST calculate, land
in Review Queue as a draft transaction.

Designed so a prospect can paste an invoice email, see the snapshot, see the
extracted fields, see the GST calculated, and watch the draft appear — all
in one click, no signup, no integrations needed for the demo.
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.auth.dependencies import get_current_user
from app.models.user import User
from app.email_scanner.harvester import (
    get_pipeline,
    make_snapshot,
    extract_invoice,
    build_draft,
)

router = APIRouter(prefix="/email-harvester", tags=["Email Harvester"])


# --------------------------------------------------------------------------- #
# Models                                                                      #
# --------------------------------------------------------------------------- #


class EmailPayload(BaseModel):
    email_id: str | None = None
    subject: str = ""
    sender_name: str = ""
    sender_email: str = ""
    date: str = ""
    body_preview: str = ""
    has_attachment: bool = False
    attachments: list[dict] = Field(default_factory=list)


class HarvestRequest(BaseModel):
    emails: List[EmailPayload] = Field(..., min_length=1, max_length=50)


class SingleExtractRequest(BaseModel):
    email: EmailPayload


# --------------------------------------------------------------------------- #
# Endpoints                                                                   #
# --------------------------------------------------------------------------- #


def _serialize_result(r) -> dict:
    return {
        "email_id": r.email_id,
        "snapshot": {
            "snapshot_id": r.snapshot.snapshot_id,
            "kind": r.snapshot.kind,
            "filename": r.snapshot.filename,
            "content_type": r.snapshot.content_type,
            "thumbnail_data_url": r.snapshot.thumbnail_data_url,
            "byte_count": r.snapshot.byte_count,
            "captured_at": r.snapshot.captured_at,
        },
        "extracted": {
            "vendor_name": r.extracted.vendor_name,
            "vendor_email": r.extracted.vendor_email,
            "invoice_number": r.extracted.invoice_number,
            "issue_date": r.extracted.issue_date,
            "due_date": r.extracted.due_date,
            "currency": r.extracted.currency,
            "subtotal": str(r.extracted.subtotal),
            "tax_amount": str(r.extracted.tax_amount),
            "total": str(r.extracted.total),
            "confidence": r.extracted.confidence(),
            "signals": r.extracted.raw_signals,
            "line_items": [
                {
                    "description": li.description,
                    "quantity": str(li.quantity),
                    "unit_price": str(li.unit_price),
                    "amount": str(li.amount),
                }
                for li in r.extracted.line_items
            ],
            "fields": [
                {"name": f.name, "value": f.value, "confidence": f.confidence, "source": f.source}
                for f in r.extracted.fields
            ],
        },
        "draft": {
            "draft_id": r.draft.draft_id,
            "vendor": r.draft.vendor,
            "description": r.draft.description,
            "transaction_date": r.draft.transaction_date,
            "amount_net": str(r.draft.amount_net),
            "amount_tax": str(r.draft.amount_tax),
            "amount_gross": str(r.draft.amount_gross),
            "currency": r.draft.currency,
            "tax_jurisdiction": r.draft.tax_jurisdiction,
            "tax_rate": r.draft.tax_rate,
            "tax_calculation": r.draft.tax_calculation,
            "status": r.draft.status,
            "ai_confidence": r.draft.ai_confidence,
            "ai_reasoning": r.draft.ai_reasoning,
        },
    }


@router.post("/harvest")
async def harvest(req: HarvestRequest, user: User = Depends(get_current_user)):
    """Run the full pipeline on a batch of emails.

    Snapshot each, extract structured fields, calculate GST, build drafts
    and return everything so the UI can show the before/after in one shot.
    """
    pipeline = get_pipeline()
    pipeline_id, results = pipeline.ingest([e.model_dump() for e in req.emails])
    return {
        "pipeline_id": pipeline_id,
        "count": len(results),
        "results": [_serialize_result(r) for r in results],
    }


@router.post("/extract")
async def extract_single(req: SingleExtractRequest, user: User = Depends(get_current_user)):
    """Extract + GST-calculate a single email without storing the pipeline."""
    email = req.email.model_dump()
    snapshot = make_snapshot(email)
    extracted = extract_invoice(email)
    draft = build_draft(email, snapshot, extracted)

    class _R:
        pass
    r = _R()
    r.email_id = email.get("email_id") or ""
    r.snapshot = snapshot
    r.extracted = extracted
    r.draft = draft
    return _serialize_result(r)


@router.get("/pipeline/{pipeline_id}")
async def get_pipeline_results(pipeline_id: str, user: User = Depends(get_current_user)):
    """Return all drafts for a pipeline."""
    pipeline = get_pipeline()
    results = pipeline.get(pipeline_id)
    if results is None:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    return {
        "pipeline_id": pipeline_id,
        "count": len(results),
        "results": [_serialize_result(r) for r in results],
    }


@router.post("/pipeline/{pipeline_id}/approve")
async def approve_drafts(
    pipeline_id: str,
    draft_ids: list[str],
    user: User = Depends(get_current_user),
):
    """Mark selected drafts as approved — they'd post to the ledger in real deployment.

    Keeps everything in-memory for now; once the ledger service is wired up the
    approved drafts convert into posted transactions and an audit entry.
    """
    pipeline = get_pipeline()
    results = pipeline.get(pipeline_id)
    if results is None:
        raise HTTPException(status_code=404, detail="Pipeline not found")

    approved = []
    for r in results:
        if r.draft.draft_id in draft_ids:
            r.draft.status = "draft"  # goes into Review Queue
            approved.append(r.draft.draft_id)

    return {
        "pipeline_id": pipeline_id,
        "approved_count": len(approved),
        "approved": approved,
        "message": (
            f"{len(approved)} draft transaction(s) landed in Review Queue. "
            "A human approver must sign off before they post to the ledger."
        ),
    }


@router.get("/sample-emails")
async def sample_emails(user: User = Depends(get_current_user)):
    """A hand-crafted set of sample emails so the demo flow runs end-to-end."""
    samples = [
        {
            "email_id": "sample-1",
            "subject": "Tax Invoice #INV-8421 from Vercel",
            "sender_name": "Vercel Billing",
            "sender_email": "billing@vercel.com",
            "date": "2026-04-01",
            "body_preview": (
                "Thanks for your business. Invoice #INV-8421. "
                "Subtotal: US$180.00. Tax: US$0.00. Total: US$180.00 due by 2026-04-15."
            ),
            "has_attachment": True,
        },
        {
            "email_id": "sample-2",
            "subject": "Your Spark Business bill — March 2026",
            "sender_name": "Spark NZ",
            "sender_email": "billing@spark.co.nz",
            "date": "2026-03-28",
            "body_preview": (
                "Invoice number INV-2026-0391. Subtotal NZ$139.13 plus GST NZ$20.87. "
                "Total amount due NZ$160.00 by 10 April 2026."
            ),
            "has_attachment": True,
        },
        {
            "email_id": "sample-3",
            "subject": "Receipt from Officeworks — Order 94410",
            "sender_name": "Officeworks",
            "sender_email": "noreply@officeworks.com.au",
            "date": "2026-03-22",
            "body_preview": (
                "Thank you for your purchase. Total AU$242.00 including GST AU$22.00. "
                "Order confirmation for stationery supplies."
            ),
            "has_attachment": False,
        },
        {
            "email_id": "sample-4",
            "subject": "AWS Invoice 102893421",
            "sender_name": "Amazon Web Services",
            "sender_email": "no-reply-aws@amazon.com",
            "date": "2026-04-03",
            "body_preview": (
                "AWS charges for March 2026. Invoice number 102893421. "
                "Amount due US$1,284.56. Payment will be charged to your card."
            ),
            "has_attachment": True,
        },
    ]
    return {"emails": samples}

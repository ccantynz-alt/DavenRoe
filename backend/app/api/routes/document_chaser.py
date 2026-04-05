"""Intelligent Document Chasing API — automated client document follow-up system."""

import uuid
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.auth.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/document-chaser", tags=["Document Chaser"])

# ── Pydantic models ──────────────────────────────────────────────────────────

class ChaseRequestCreate(BaseModel):
    client_id: str
    client_name: str
    document_type: str  # receipt, invoice, bank_statement, tax_form, other
    description: str = ""
    due_date: str  # ISO date
    template_id: Optional[str] = None
    auto_escalate: bool = True
    tone: str = "friendly"  # friendly, professional, firm, urgent

class ChaseRequestUpdate(BaseModel):
    status: Optional[str] = None
    stage: Optional[int] = None
    tone: Optional[str] = None
    auto_escalate: Optional[bool] = None
    next_chase_date: Optional[str] = None

class SendChaseRequest(BaseModel):
    request_id: str
    tone: Optional[str] = None
    custom_message: Optional[str] = None

class BulkChaseRequest(BaseModel):
    client_ids: list[str]
    document_type: str
    due_date: str
    template_id: Optional[str] = None
    tone: str = "friendly"

# ── Demo data ────────────────────────────────────────────────────────────────

_CLIENTS = [
    {"id": "c1", "name": "Horizon Industries Pty Ltd"},
    {"id": "c2", "name": "Oakwood & Partners"},
    {"id": "c3", "name": "NexGen Solutions Ltd"},
    {"id": "c4", "name": "BluePeak Consulting"},
    {"id": "c5", "name": "Southern Cross Ventures"},
    {"id": "c6", "name": "Kauri Digital NZ"},
    {"id": "c7", "name": "Thames Valley Imports"},
    {"id": "c8", "name": "Redback Mining Corp"},
]

_DOC_TYPES = ["receipt", "invoice", "bank_statement", "tax_form", "payslip", "contract"]

_TEMPLATES = [
    {
        "id": "t1", "name": "BAS Document Request", "category": "tax",
        "stages": {
            1: "Hi {name}, we're preparing your BAS for the {period} quarter and need your {doc_type}. Could you please send it through at your earliest convenience?",
            2: "Just following up on our earlier request for your {doc_type}. We need this to finalise your BAS for {period}. Please send it through when you get a chance.",
            3: "We still require your {doc_type} to complete your BAS lodgement for {period}. The filing deadline is approaching — please provide this as a matter of priority.",
            4: "URGENT: Your BAS filing deadline is imminent and we are still missing your {doc_type}. Without this document, we cannot lodge on time. Please provide immediately to avoid penalties.",
        },
    },
    {
        "id": "t2", "name": "Bank Statement Request", "category": "reconciliation",
        "stages": {
            1: "Hi {name}, we need your {period} bank statements for {account} to complete your monthly reconciliation. Could you download and send these through?",
            2: "Following up — we're still waiting on your {period} bank statements for {account}. These are needed to reconcile your accounts accurately.",
            3: "We require your {period} bank statements for {account} urgently. Your reconciliation is overdue and we cannot proceed without this document.",
            4: "FINAL NOTICE: Your {period} bank statements for {account} are critically overdue. This is blocking your entire month-end close. Please provide immediately.",
        },
    },
    {
        "id": "t3", "name": "Receipt Collection", "category": "expenses",
        "stages": {
            1: "Hi {name}, we have {count} transactions without matching receipts for {period}. Could you gather and upload these when convenient?",
            2: "Just a reminder — we still need receipts for {count} transactions from {period}. These are required for GST/tax deduction claims.",
            3: "We are still missing receipts for {count} transactions. Without these, we may not be able to claim the associated tax deductions. Please prioritise.",
            4: "URGENT: {count} transactions remain unsubstantiated for {period}. Tax deductions totalling ${amount} are at risk. Please provide receipts immediately.",
        },
    },
    {
        "id": "t4", "name": "Tax Return Documents", "category": "tax",
        "stages": {
            1: "Hi {name}, it's tax time! We need the following documents to prepare your {year} tax return: {doc_list}. Please send these through when you can.",
            2: "Following up on your {year} tax return documents. We still need: {doc_list}. Early lodgement means an earlier refund!",
            3: "Your {year} tax return preparation is stalled because we're missing: {doc_list}. Please provide these to avoid delays in your lodgement.",
            4: "URGENT: Tax return deadline is approaching and we cannot file without: {doc_list}. Please provide immediately to avoid late-lodgement penalties.",
        },
    },
    {
        "id": "t5", "name": "Invoice Collection", "category": "accounts",
        "stages": {
            1: "Hi {name}, we need copies of your outstanding invoices for {period} to update your accounts receivable. Could you export and send these?",
            2: "Reminder: we're still waiting on your {period} invoices. Your AR aging report is incomplete without these.",
            3: "Your accounts receivable records are out of date. We need your {period} invoices urgently to provide accurate financial reporting.",
            4: "FINAL NOTICE: Without your {period} invoices, your financial statements will be materially incomplete. Please provide today.",
        },
    },
    {
        "id": "t6", "name": "Payroll Records", "category": "payroll",
        "stages": {
            1: "Hi {name}, we need your updated payroll records for {period} including timesheets, leave taken, and any salary changes. Please send when ready.",
            2: "Following up on payroll records for {period}. We need these to process superannuation/KiwiSaver obligations on time.",
            3: "Payroll records for {period} are overdue. Super/pension contributions cannot be processed without them. Please prioritise.",
            4: "URGENT: Payroll compliance deadlines are at risk. We need your {period} records immediately to avoid penalties.",
        },
    },
]

_DEMO_REQUESTS = [
    {
        "id": "dr1", "client_id": "c1", "client_name": "Horizon Industries Pty Ltd",
        "document_type": "bank_statement", "description": "March 2026 ANZ Business Account",
        "due_date": "2026-03-28", "status": "overdue", "stage": 3, "tone": "firm",
        "auto_escalate": True, "created_at": "2026-03-10T09:00:00Z",
        "next_chase_date": "2026-04-06", "days_waiting": 26,
        "history": [
            {"date": "2026-03-10T09:00:00Z", "stage": 1, "tone": "friendly", "status": "sent", "opened": True, "responded": False},
            {"date": "2026-03-17T09:00:00Z", "stage": 2, "tone": "professional", "status": "sent", "opened": True, "responded": False},
            {"date": "2026-03-24T09:00:00Z", "stage": 3, "tone": "firm", "status": "sent", "opened": False, "responded": False},
        ],
    },
    {
        "id": "dr2", "client_id": "c2", "client_name": "Oakwood & Partners",
        "document_type": "receipt", "description": "Q1 2026 expense receipts (14 missing)",
        "due_date": "2026-04-10", "status": "pending", "stage": 2, "tone": "professional",
        "auto_escalate": True, "created_at": "2026-03-20T10:30:00Z",
        "next_chase_date": "2026-04-07", "days_waiting": 16,
        "history": [
            {"date": "2026-03-20T10:30:00Z", "stage": 1, "tone": "friendly", "status": "sent", "opened": True, "responded": False},
            {"date": "2026-03-27T10:30:00Z", "stage": 2, "tone": "professional", "status": "sent", "opened": True, "responded": False},
        ],
    },
    {
        "id": "dr3", "client_id": "c3", "client_name": "NexGen Solutions Ltd",
        "document_type": "tax_form", "description": "FY2025 payment summaries for all employees",
        "due_date": "2026-04-15", "status": "pending", "stage": 1, "tone": "friendly",
        "auto_escalate": True, "created_at": "2026-04-01T08:00:00Z",
        "next_chase_date": "2026-04-08", "days_waiting": 4,
        "history": [
            {"date": "2026-04-01T08:00:00Z", "stage": 1, "tone": "friendly", "status": "sent", "opened": False, "responded": False},
        ],
    },
    {
        "id": "dr4", "client_id": "c4", "client_name": "BluePeak Consulting",
        "document_type": "invoice", "description": "Outstanding sales invoices Feb-Mar 2026",
        "due_date": "2026-04-05", "status": "overdue", "stage": 4, "tone": "urgent",
        "auto_escalate": True, "created_at": "2026-03-05T11:00:00Z",
        "next_chase_date": None, "days_waiting": 31,
        "history": [
            {"date": "2026-03-05T11:00:00Z", "stage": 1, "tone": "friendly", "status": "sent", "opened": True, "responded": False},
            {"date": "2026-03-12T11:00:00Z", "stage": 2, "tone": "professional", "status": "sent", "opened": True, "responded": False},
            {"date": "2026-03-19T11:00:00Z", "stage": 3, "tone": "firm", "status": "sent", "opened": True, "responded": False},
            {"date": "2026-03-26T11:00:00Z", "stage": 4, "tone": "urgent", "status": "sent", "opened": True, "responded": False},
        ],
    },
    {
        "id": "dr5", "client_id": "c5", "client_name": "Southern Cross Ventures",
        "document_type": "bank_statement", "description": "March 2026 Westpac statements",
        "due_date": "2026-04-08", "status": "received", "stage": 1, "tone": "friendly",
        "auto_escalate": False, "created_at": "2026-03-28T14:00:00Z",
        "next_chase_date": None, "days_waiting": 0,
        "history": [
            {"date": "2026-03-28T14:00:00Z", "stage": 1, "tone": "friendly", "status": "sent", "opened": True, "responded": True},
        ],
    },
    {
        "id": "dr6", "client_id": "c6", "client_name": "Kauri Digital NZ",
        "document_type": "tax_form", "description": "GST return supporting docs Q1 2026",
        "due_date": "2026-04-20", "status": "pending", "stage": 1, "tone": "friendly",
        "auto_escalate": True, "created_at": "2026-04-02T09:15:00Z",
        "next_chase_date": "2026-04-09", "days_waiting": 3,
        "history": [
            {"date": "2026-04-02T09:15:00Z", "stage": 1, "tone": "friendly", "status": "sent", "opened": True, "responded": False},
        ],
    },
    {
        "id": "dr7", "client_id": "c7", "client_name": "Thames Valley Imports",
        "document_type": "receipt", "description": "Import duty receipts Feb 2026",
        "due_date": "2026-03-31", "status": "overdue", "stage": 2, "tone": "professional",
        "auto_escalate": True, "created_at": "2026-03-15T13:00:00Z",
        "next_chase_date": "2026-04-05", "days_waiting": 21,
        "history": [
            {"date": "2026-03-15T13:00:00Z", "stage": 1, "tone": "friendly", "status": "sent", "opened": True, "responded": False},
            {"date": "2026-03-22T13:00:00Z", "stage": 2, "tone": "professional", "status": "sent", "opened": False, "responded": False},
        ],
    },
    {
        "id": "dr8", "client_id": "c8", "client_name": "Redback Mining Corp",
        "document_type": "bank_statement", "description": "March 2026 NAB Business Plus",
        "due_date": "2026-04-12", "status": "received", "stage": 2, "tone": "professional",
        "auto_escalate": False, "created_at": "2026-03-18T10:00:00Z",
        "next_chase_date": None, "days_waiting": 0,
        "history": [
            {"date": "2026-03-18T10:00:00Z", "stage": 1, "tone": "friendly", "status": "sent", "opened": True, "responded": False},
            {"date": "2026-03-25T10:00:00Z", "stage": 2, "tone": "professional", "status": "sent", "opened": True, "responded": True},
        ],
    },
]


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/requests")
async def list_chase_requests(
    status_filter: Optional[str] = Query(None, alias="status"),
    client_id: Optional[str] = Query(None),
    document_type: Optional[str] = Query(None),
    user: User = Depends(get_current_user),
):
    """List all document chase requests with optional filters."""
    results = list(_DEMO_REQUESTS)
    if status_filter:
        results = [r for r in results if r["status"] == status_filter]
    if client_id:
        results = [r for r in results if r["client_id"] == client_id]
    if document_type:
        results = [r for r in results if r["document_type"] == document_type]
    return {
        "requests": results,
        "total": len(results),
        "clients": _CLIENTS,
    }


@router.post("/requests")
async def create_chase_request(
    body: ChaseRequestCreate,
    user: User = Depends(get_current_user),
):
    """Create a new document chase request."""
    new_req = {
        "id": f"dr{uuid.uuid4().hex[:6]}",
        "client_id": body.client_id,
        "client_name": body.client_name,
        "document_type": body.document_type,
        "description": body.description,
        "due_date": body.due_date,
        "status": "pending",
        "stage": 1,
        "tone": body.tone,
        "auto_escalate": body.auto_escalate,
        "created_at": datetime.utcnow().isoformat() + "Z",
        "next_chase_date": (datetime.utcnow() + timedelta(days=7)).strftime("%Y-%m-%d"),
        "days_waiting": 0,
        "history": [],
    }
    _DEMO_REQUESTS.append(new_req)
    return new_req


@router.put("/requests/{request_id}")
async def update_chase_request(
    request_id: str,
    body: ChaseRequestUpdate,
    user: User = Depends(get_current_user),
):
    """Update a chase request (status, stage, tone, etc.)."""
    req = next((r for r in _DEMO_REQUESTS if r["id"] == request_id), None)
    if not req:
        raise HTTPException(status_code=404, detail="Chase request not found")
    if body.status is not None:
        req["status"] = body.status
    if body.stage is not None:
        req["stage"] = body.stage
    if body.tone is not None:
        req["tone"] = body.tone
    if body.auto_escalate is not None:
        req["auto_escalate"] = body.auto_escalate
    if body.next_chase_date is not None:
        req["next_chase_date"] = body.next_chase_date
    return req


@router.post("/send")
async def send_chase(
    body: SendChaseRequest,
    user: User = Depends(get_current_user),
):
    """Send or resend a chase email for a request."""
    req = next((r for r in _DEMO_REQUESTS if r["id"] == body.request_id), None)
    if not req:
        raise HTTPException(status_code=404, detail="Chase request not found")
    tone = body.tone or req["tone"]
    entry = {
        "date": datetime.utcnow().isoformat() + "Z",
        "stage": req["stage"],
        "tone": tone,
        "status": "sent",
        "opened": False,
        "responded": False,
    }
    req["history"].append(entry)
    return {"status": "sent", "request_id": req["id"], "stage": req["stage"], "tone": tone}


@router.get("/analytics")
async def get_chase_analytics(
    user: User = Depends(get_current_user),
):
    """Get document chasing analytics and performance metrics."""
    total = len(_DEMO_REQUESTS)
    received = sum(1 for r in _DEMO_REQUESTS if r["status"] == "received")
    overdue = sum(1 for r in _DEMO_REQUESTS if r["status"] == "overdue")
    pending = sum(1 for r in _DEMO_REQUESTS if r["status"] == "pending")

    by_type = {}
    for r in _DEMO_REQUESTS:
        dt = r["document_type"]
        by_type.setdefault(dt, {"total": 0, "received": 0, "overdue": 0, "pending": 0})
        by_type[dt]["total"] += 1
        by_type[dt][r["status"]] = by_type[dt].get(r["status"], 0) + 1

    by_client = {}
    for r in _DEMO_REQUESTS:
        cn = r["client_name"]
        by_client.setdefault(cn, {"total": 0, "received": 0, "avg_days": 0, "days_list": []})
        by_client[cn]["total"] += 1
        if r["status"] == "received":
            by_client[cn]["received"] += 1
        by_client[cn]["days_list"].append(r["days_waiting"])
    for cn, data in by_client.items():
        data["avg_days"] = round(sum(data["days_list"]) / len(data["days_list"]), 1) if data["days_list"] else 0
        del data["days_list"]

    avg_response_days = round(
        sum(r["days_waiting"] for r in _DEMO_REQUESTS if r["status"] == "received")
        / max(received, 1), 1
    )

    monthly_trend = [
        {"month": "Oct 2025", "sent": 18, "received": 16, "rate": 89},
        {"month": "Nov 2025", "sent": 22, "received": 19, "rate": 86},
        {"month": "Dec 2025", "sent": 15, "received": 12, "rate": 80},
        {"month": "Jan 2026", "sent": 25, "received": 22, "rate": 88},
        {"month": "Feb 2026", "sent": 28, "received": 24, "rate": 86},
        {"month": "Mar 2026", "sent": 32, "received": 21, "rate": 66},
    ]

    return {
        "summary": {
            "total_requests": total,
            "received": received,
            "overdue": overdue,
            "pending": pending,
            "success_rate": round(received / max(total, 1) * 100, 1),
            "avg_response_days": avg_response_days,
            "auto_chases_sent": 47,
            "time_saved_hours": 32.5,
        },
        "by_type": by_type,
        "by_client": by_client,
        "monthly_trend": monthly_trend,
    }


@router.get("/templates")
async def list_templates(
    user: User = Depends(get_current_user),
):
    """List available chase templates."""
    return {"templates": _TEMPLATES}


@router.post("/bulk")
async def bulk_chase(
    body: BulkChaseRequest,
    user: User = Depends(get_current_user),
):
    """Send bulk chase requests to multiple clients."""
    created = []
    for cid in body.client_ids:
        client = next((c for c in _CLIENTS if c["id"] == cid), None)
        if not client:
            continue
        new_req = {
            "id": f"dr{uuid.uuid4().hex[:6]}",
            "client_id": cid,
            "client_name": client["name"],
            "document_type": body.document_type,
            "description": f"Bulk request: {body.document_type}",
            "due_date": body.due_date,
            "status": "pending",
            "stage": 1,
            "tone": body.tone,
            "auto_escalate": True,
            "created_at": datetime.utcnow().isoformat() + "Z",
            "next_chase_date": (datetime.utcnow() + timedelta(days=7)).strftime("%Y-%m-%d"),
            "days_waiting": 0,
            "history": [
                {
                    "date": datetime.utcnow().isoformat() + "Z",
                    "stage": 1,
                    "tone": body.tone,
                    "status": "sent",
                    "opened": False,
                    "responded": False,
                }
            ],
        }
        _DEMO_REQUESTS.append(new_req)
        created.append(new_req)
    return {"created": len(created), "requests": created}

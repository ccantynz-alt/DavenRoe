"""Client Communication Log API routes.

Unified log of emails, calls, notes, and document requests per client.
Linked to transactions, tax periods, and team members. Replaces the
need for a separate CRM tool — no competitor has this built-in.
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from app.auth.dependencies import get_current_user
from app.models.user import User
import uuid

router = APIRouter(prefix="/client-comms", tags=["Client Communications"])

# ── In-memory store ─────────────────────────────────────────────────────

_entries = []
_seed_done = False


def _seed():
    global _seed_done
    if _seed_done:
        return
    _seed_done = True

    _entries.extend([
        {
            "id": str(uuid.uuid4()),
            "client_id": "client-001",
            "client_name": "Meridian Corp",
            "type": "email",
            "direction": "outbound",
            "subject": "BAS Q3 lodgement confirmation",
            "body": "Hi Sarah, confirming your Q3 BAS has been lodged with the ATO. Refund of $4,280 expected within 14 business days. Let me know if you have any questions.",
            "contact_name": "Sarah Mitchell",
            "contact_email": "sarah@meridiancorp.com.au",
            "linked_items": [{"type": "tax_filing", "id": "bas-q3-2026", "label": "BAS Q3 2025-26"}],
            "tags": ["tax", "bas", "lodgement"],
            "staff_name": "Alex Chen",
            "pinned": False,
            "created_at": "2026-03-28T14:30:00Z",
        },
        {
            "id": str(uuid.uuid4()),
            "client_id": "client-001",
            "client_name": "Meridian Corp",
            "type": "call",
            "direction": "inbound",
            "subject": "Payroll query — new hire onboarding",
            "body": "Sarah called about onboarding a new employee starting April 7. Needs help with super fund choice form and TFN declaration. Agreed to send templates by EOD today. Also mentioned potential office lease renewal — wants to discuss lease vs buy analysis next week.",
            "contact_name": "Sarah Mitchell",
            "contact_email": "sarah@meridiancorp.com.au",
            "linked_items": [{"type": "payroll", "id": "emp-new-001", "label": "New hire — April 2026"}],
            "tags": ["payroll", "onboarding", "follow-up"],
            "staff_name": "Alex Chen",
            "pinned": True,
            "created_at": "2026-03-26T10:15:00Z",
        },
        {
            "id": str(uuid.uuid4()),
            "client_id": "client-001",
            "client_name": "Meridian Corp",
            "type": "note",
            "direction": "internal",
            "subject": "FY26 planning discussion notes",
            "body": "Met with Sarah and CFO James to discuss FY26 budget. Key points:\n- Revenue target $2.4M (up 15%)\n- Hiring 3 new staff in Q1\n- New office lease from July — $4,200/mo\n- Want quarterly management reports instead of annual\n- Interested in scenario planning for expansion into NZ market\n\nAction items: Set up quarterly reporting schedule. Run NZ expansion scenario. Review employment contracts for new hires.",
            "contact_name": "Sarah Mitchell & James Wong",
            "contact_email": "",
            "linked_items": [{"type": "project", "id": "proj-fy26", "label": "FY26 Planning"}],
            "tags": ["planning", "meeting", "budget"],
            "staff_name": "Alex Chen",
            "pinned": True,
            "created_at": "2026-03-20T16:00:00Z",
        },
        {
            "id": str(uuid.uuid4()),
            "client_id": "client-001",
            "client_name": "Meridian Corp",
            "type": "document_request",
            "direction": "outbound",
            "subject": "Missing receipts — March expenses",
            "body": "Hi Sarah, we're missing receipts for 3 transactions in March:\n- Mar 8: $234.50 — Office Supplies Co\n- Mar 15: $67.40 — Uber Eats\n- Mar 18: $1,247.80 — Amazon Web Services\n\nCould you upload these via the client portal or reply to this email with photos? Need them before month-end close on April 5.",
            "contact_name": "Sarah Mitchell",
            "contact_email": "sarah@meridiancorp.com.au",
            "linked_items": [{"type": "document", "id": "doc-req-mar", "label": "March receipts"}],
            "tags": ["documents", "receipts", "month-end"],
            "staff_name": "Priya Sharma",
            "pinned": False,
            "created_at": "2026-03-25T11:00:00Z",
        },
        {
            "id": str(uuid.uuid4()),
            "client_id": "client-002",
            "client_name": "Pinnacle Ltd",
            "type": "email",
            "direction": "outbound",
            "subject": "Annual financial statements ready for review",
            "body": "Hi David, your FY25 financial statements are ready. I've uploaded the draft P&L, Balance Sheet, and Director's Report to the portal. Please review and let me know of any amendments before we finalise for the auditor.",
            "contact_name": "David Park",
            "contact_email": "david@pinnacle.co.nz",
            "linked_items": [{"type": "report", "id": "fs-fy25", "label": "FY25 Financial Statements"}],
            "tags": ["annual", "financial-statements", "review"],
            "staff_name": "Alex Chen",
            "pinned": False,
            "created_at": "2026-03-22T09:30:00Z",
        },
        {
            "id": str(uuid.uuid4()),
            "client_id": "client-002",
            "client_name": "Pinnacle Ltd",
            "type": "call",
            "direction": "outbound",
            "subject": "Follow-up: Overdue invoice collection",
            "body": "Called David to discuss overdue debtor — Summit Holdings owes $15,600 (45 days overdue). David confirmed he's been chasing them. Agreed to escalate with a formal demand letter if not paid by April 15. Also discussed setting up automated payment reminders.",
            "contact_name": "David Park",
            "contact_email": "david@pinnacle.co.nz",
            "linked_items": [{"type": "invoice", "id": "inv-1218", "label": "Invoice #1218 — Summit Holdings"}],
            "tags": ["collections", "overdue", "follow-up"],
            "staff_name": "Alex Chen",
            "pinned": False,
            "created_at": "2026-03-18T15:45:00Z",
        },
        {
            "id": str(uuid.uuid4()),
            "client_id": "client-003",
            "client_name": "Vortex Digital",
            "type": "email",
            "direction": "inbound",
            "subject": "RE: GST registration threshold",
            "body": "Thanks for the heads-up about approaching the GST threshold. We hit $72K revenue this quarter — can you confirm when we need to register? Also, what changes would we need to make to our invoicing?",
            "contact_name": "Lisa Tran",
            "contact_email": "lisa@vortexdigital.com.au",
            "linked_items": [{"type": "tax", "id": "gst-reg", "label": "GST Registration"}],
            "tags": ["gst", "registration", "compliance"],
            "staff_name": "Priya Sharma",
            "pinned": False,
            "created_at": "2026-03-15T08:20:00Z",
        },
        {
            "id": str(uuid.uuid4()),
            "client_id": "client-003",
            "client_name": "Vortex Digital",
            "type": "note",
            "direction": "internal",
            "subject": "Vortex — approaching GST threshold",
            "body": "Lisa's company is approaching the $75K GST turnover threshold. Current YTD revenue is $72K with 3 months remaining. At current trajectory they'll exceed threshold by end of May. Need to: 1) Register for GST before they exceed threshold 2) Update invoice templates to include GST 3) Set up BAS reporting in their entity 4) Brief Lisa on GST obligations and input tax credits.",
            "contact_name": "",
            "contact_email": "",
            "linked_items": [],
            "tags": ["gst", "compliance", "urgent"],
            "staff_name": "Priya Sharma",
            "pinned": True,
            "created_at": "2026-03-15T09:00:00Z",
        },
        {
            "id": str(uuid.uuid4()),
            "client_id": "client-004",
            "client_name": "Apex Advisory",
            "type": "document_request",
            "direction": "outbound",
            "subject": "Year-end documents needed",
            "body": "Hi Mark, for the FY25 year-end we still need:\n- December bank statement (Westpac business account)\n- Vehicle logbook for FBT purposes\n- Updated asset register (any purchases/disposals in H2)\n- Director loan agreement (if balance has changed)\n\nDeadline: April 30 for timely lodgement.",
            "contact_name": "Mark Stevens",
            "contact_email": "mark@apexadvisory.com.au",
            "linked_items": [],
            "tags": ["year-end", "documents", "deadline"],
            "staff_name": "Alex Chen",
            "pinned": False,
            "created_at": "2026-03-10T14:00:00Z",
        },
        {
            "id": str(uuid.uuid4()),
            "client_id": "client-005",
            "client_name": "Summit Holdings",
            "type": "email",
            "direction": "outbound",
            "subject": "Overdue payment — Invoice #1218",
            "body": "Dear Tom, this is a friendly reminder that Invoice #1218 for $15,600 was due on February 28 and remains outstanding. Please arrange payment at your earliest convenience. If you have any queries about this invoice, please don't hesitate to contact us.",
            "contact_name": "Tom Richardson",
            "contact_email": "tom@summitholdings.com",
            "linked_items": [{"type": "invoice", "id": "inv-1218", "label": "Invoice #1218"}],
            "tags": ["collections", "overdue", "reminder"],
            "staff_name": "Priya Sharma",
            "pinned": False,
            "created_at": "2026-03-12T10:30:00Z",
        },
    ])


# ── Schemas ─────────────────────────────────────────────────────────────

class CommCreate(BaseModel):
    client_id: str
    client_name: str
    type: str = Field(..., description="email, call, note, document_request, sms")
    direction: str = Field(default="outbound", description="inbound, outbound, internal")
    subject: str = Field(..., min_length=1, max_length=300)
    body: str = Field(default="")
    contact_name: str = Field(default="")
    contact_email: str = Field(default="")
    linked_items: list = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    staff_name: str = Field(default="")
    pinned: bool = False


class CommUpdate(BaseModel):
    subject: str | None = None
    body: str | None = None
    tags: list[str] | None = None
    pinned: bool | None = None
    linked_items: list | None = None


# ── Endpoints ───────────────────────────────────────────────────────────

@router.get("/")
async def list_comms(
    client_id: str | None = None,
    type: str | None = None,
    tag: str | None = None,
    pinned: bool | None = None,
    search: str | None = None,
    limit: int = Query(default=50, le=200),
    user: User = Depends(get_current_user),
):
    """List communication entries with filters."""
    _seed()
    results = list(_entries)
    if client_id:
        results = [e for e in results if e["client_id"] == client_id]
    if type:
        results = [e for e in results if e["type"] == type]
    if tag:
        results = [e for e in results if tag in e.get("tags", [])]
    if pinned is not None:
        results = [e for e in results if e["pinned"] == pinned]
    if search:
        s = search.lower()
        results = [e for e in results if s in e["subject"].lower() or s in e["body"].lower() or s in e["client_name"].lower()]

    results.sort(key=lambda e: e["created_at"], reverse=True)
    return {"entries": results[:limit], "total": len(results)}


@router.get("/stats")
async def comm_stats(user: User = Depends(get_current_user)):
    """Summary stats across all communications."""
    _seed()
    total = len(_entries)
    by_type = {}
    by_client = {}
    pinned_count = 0
    for e in _entries:
        by_type[e["type"]] = by_type.get(e["type"], 0) + 1
        by_client[e["client_name"]] = by_client.get(e["client_name"], 0) + 1
        if e["pinned"]:
            pinned_count += 1

    # Most active clients (sorted by comm count)
    top_clients = sorted(by_client.items(), key=lambda x: x[1], reverse=True)[:5]

    return {
        "total_entries": total,
        "pinned": pinned_count,
        "by_type": by_type,
        "top_clients": [{"name": name, "count": count} for name, count in top_clients],
        "this_week": sum(1 for e in _entries if e["created_at"] >= "2026-03-24"),
        "pending_follow_ups": sum(1 for e in _entries if "follow-up" in e.get("tags", [])),
    }


@router.get("/clients")
async def comm_clients(user: User = Depends(get_current_user)):
    """List unique clients with communication counts."""
    _seed()
    clients = {}
    for e in _entries:
        cid = e["client_id"]
        if cid not in clients:
            clients[cid] = {"client_id": cid, "client_name": e["client_name"], "total": 0, "last_contact": e["created_at"], "types": set()}
        clients[cid]["total"] += 1
        clients[cid]["types"].add(e["type"])
        if e["created_at"] > clients[cid]["last_contact"]:
            clients[cid]["last_contact"] = e["created_at"]

    result = []
    for c in clients.values():
        c["types"] = list(c["types"])
        result.append(c)
    result.sort(key=lambda c: c["last_contact"], reverse=True)
    return {"clients": result}


@router.get("/{entry_id}")
async def get_comm(entry_id: str, user: User = Depends(get_current_user)):
    """Get a single communication entry."""
    _seed()
    entry = next((e for e in _entries if e["id"] == entry_id), None)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    return entry


@router.post("/")
async def create_comm(data: CommCreate, user: User = Depends(get_current_user)):
    """Create a new communication entry."""
    _seed()
    entry = {
        "id": str(uuid.uuid4()),
        "client_id": data.client_id,
        "client_name": data.client_name,
        "type": data.type,
        "direction": data.direction,
        "subject": data.subject,
        "body": data.body,
        "contact_name": data.contact_name,
        "contact_email": data.contact_email,
        "linked_items": data.linked_items,
        "tags": data.tags,
        "staff_name": data.staff_name,
        "pinned": data.pinned,
        "created_at": datetime.utcnow().isoformat() + "Z",
    }
    _entries.insert(0, entry)
    return entry


@router.put("/{entry_id}")
async def update_comm(entry_id: str, data: CommUpdate, user: User = Depends(get_current_user)):
    """Update a communication entry."""
    _seed()
    entry = next((e for e in _entries if e["id"] == entry_id), None)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    updates = data.model_dump(exclude_unset=True)
    for key, value in updates.items():
        entry[key] = value
    return entry


@router.delete("/{entry_id}")
async def delete_comm(entry_id: str, user: User = Depends(get_current_user)):
    """Delete a communication entry."""
    _seed()
    global _entries
    entry = next((e for e in _entries if e["id"] == entry_id), None)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    _entries = [e for e in _entries if e["id"] != entry_id]
    return {"status": "deleted", "id": entry_id}


@router.post("/{entry_id}/pin")
async def toggle_pin(entry_id: str, user: User = Depends(get_current_user)):
    """Toggle pin status on an entry."""
    _seed()
    entry = next((e for e in _entries if e["id"] == entry_id), None)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    entry["pinned"] = not entry["pinned"]
    return {"id": entry_id, "pinned": entry["pinned"]}

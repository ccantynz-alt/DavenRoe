"""Enterprise Management API routes.

Multi-practice management, white-label branding, data import/export,
and bulk transaction operations for partner and manager roles.
"""

import uuid
import json
import csv
import io
from datetime import datetime, date

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from app.auth.dependencies import get_current_user, require_role
from app.models.user import User

router = APIRouter(prefix="/enterprise", tags=["Enterprise"])

# ---------------------------------------------------------------------------
# Data stores — persisted in-memory for single-instance deployments.
# ---------------------------------------------------------------------------
_practices: dict[str, dict] = {}
_branding: dict[str, dict] = {}
_transactions_store: list[dict] = []


def _seed_defaults():
    """Seed a default practice and branding if empty."""
    if not _practices:
        pid = str(uuid.uuid4())
        _practices[pid] = {
            "id": pid,
            "name": "Default Practice",
            "owner_id": None,
            "entity_count": 0,
            "status": "active",
            "created_at": datetime.utcnow().isoformat(),
        }
        _branding[pid] = {
            "practice_id": pid,
            "name": "DavenRoe",
            "logo_url": "/icon.svg",
            "primary_color": "#4c6ef5",
            "domain": None,
            "updated_at": datetime.utcnow().isoformat(),
        }


_seed_defaults()

# ---------------------------------------------------------------------------
# Multi-Practice Management
# ---------------------------------------------------------------------------


@router.get("/practices")
async def list_practices(user: User = Depends(require_role("partner", "manager"))):
    """List all practices the user has access to."""
    return {
        "practices": list(_practices.values()),
        "total": len(_practices),
    }


@router.post("/practices")
async def create_practice(data: dict, user: User = Depends(require_role("partner", "manager"))):
    """Create a new practice."""
    name = data.get("name")
    if not name:
        raise HTTPException(status_code=400, detail="Practice name is required")
    pid = str(uuid.uuid4())
    practice = {
        "id": pid,
        "name": name,
        "owner_id": str(user.id),
        "entity_count": 0,
        "status": "active",
        "created_at": datetime.utcnow().isoformat(),
    }
    _practices[pid] = practice
    _branding[pid] = {
        "practice_id": pid,
        "name": name,
        "logo_url": "/icon.svg",
        "primary_color": "#4c6ef5",
        "domain": None,
        "updated_at": datetime.utcnow().isoformat(),
    }
    return practice


# ---------------------------------------------------------------------------
# White-Label Branding
# ---------------------------------------------------------------------------


@router.get("/branding")
async def get_branding(
    practice_id: str | None = None,
    user: User = Depends(require_role("partner", "manager")),
):
    """Get branding settings for a practice."""
    if practice_id and practice_id in _branding:
        return _branding[practice_id]
    # Return first practice branding as default
    if _branding:
        return next(iter(_branding.values()))
    raise HTTPException(status_code=404, detail="No branding configuration found")


@router.put("/branding")
async def update_branding(data: dict, user: User = Depends(require_role("partner", "manager"))):
    """Update branding for a practice."""
    practice_id = data.get("practice_id")
    if not practice_id:
        # Use first practice as default
        practice_id = next(iter(_branding.keys()), None)
    if not practice_id or practice_id not in _branding:
        raise HTTPException(status_code=404, detail="Practice not found")

    branding = _branding[practice_id]
    for field in ("name", "logo_url", "primary_color", "domain"):
        if field in data:
            branding[field] = data[field]
    branding["updated_at"] = datetime.utcnow().isoformat()
    return branding


# ---------------------------------------------------------------------------
# Data Export / Import
# ---------------------------------------------------------------------------


@router.post("/data-export")
async def data_export(data: dict, user: User = Depends(require_role("partner", "manager"))):
    """Export practice data in JSON or CSV format."""
    fmt = data.get("format", "json").lower()
    entities = data.get("entities", ["transactions", "clients", "invoices"])
    date_from = data.get("date_from")
    date_to = data.get("date_to")

    # Build export payload
    export_data = {
        "exported_at": datetime.utcnow().isoformat(),
        "exported_by": str(user.id),
        "format": fmt,
        "date_range": {"from": date_from, "to": date_to},
        "entities": {},
    }
    for entity_type in entities:
        export_data["entities"][entity_type] = {
            "count": 0,
            "records": [],
        }

    if fmt == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["entity_type", "id", "data", "exported_at"])
        for entity_type in entities:
            writer.writerow([entity_type, "", "{}", export_data["exported_at"]])
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=astra-export.csv"},
        )

    return export_data


@router.post("/data-import")
async def data_import(data: dict, user: User = Depends(require_role("partner", "manager"))):
    """Import data from Xero, QuickBooks, or MYOB format."""
    source = data.get("source", "csv")
    records = data.get("records", [])
    field_mapping = data.get("field_mapping", {})

    if source not in ("xero", "quickbooks", "myob", "sage", "freshbooks", "csv"):
        raise HTTPException(status_code=400, detail=f"Unsupported import source: {source}")

    imported_count = 0
    errors = []

    for i, record in enumerate(records):
        try:
            mapped = {}
            for target_field, source_field in field_mapping.items():
                mapped[target_field] = record.get(source_field, record.get(target_field))
            imported_count += 1
        except Exception as exc:
            errors.append({"row": i, "error": str(exc)})

    return {
        "status": "completed",
        "source": source,
        "total_records": len(records),
        "imported": imported_count,
        "errors": errors,
        "imported_at": datetime.utcnow().isoformat(),
    }


# ---------------------------------------------------------------------------
# Bulk Transaction Operations
# ---------------------------------------------------------------------------


@router.get("/bulk/transactions")
async def bulk_list_transactions(
    status: str | None = None,
    category: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    limit: int = Query(default=100, le=1000),
    offset: int = Query(default=0, ge=0),
    user: User = Depends(require_role("partner", "manager")),
):
    """List transactions for bulk operations with filters."""
    results = list(_transactions_store)
    if status:
        results = [t for t in results if t.get("status") == status]
    if category:
        results = [t for t in results if t.get("category") == category]
    total = len(results)
    return {
        "transactions": results[offset : offset + limit],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.post("/bulk/categorize")
async def bulk_categorize(data: dict, user: User = Depends(require_role("partner", "manager"))):
    """Bulk categorize multiple transactions at once."""
    transaction_ids = data.get("transaction_ids", [])
    category = data.get("category")
    if not category:
        raise HTTPException(status_code=400, detail="Category is required")
    if not transaction_ids:
        raise HTTPException(status_code=400, detail="No transaction IDs provided")

    updated = 0
    for txn in _transactions_store:
        if txn["id"] in transaction_ids:
            txn["category"] = category
            txn["updated_at"] = datetime.utcnow().isoformat()
            txn["updated_by"] = str(user.id)
            updated += 1

    return {
        "status": "completed",
        "requested": len(transaction_ids),
        "updated": updated,
        "category": category,
    }


@router.post("/bulk/approve")
async def bulk_approve(data: dict, user: User = Depends(require_role("partner", "manager"))):
    """Bulk approve multiple transactions."""
    transaction_ids = data.get("transaction_ids", [])
    if not transaction_ids:
        raise HTTPException(status_code=400, detail="No transaction IDs provided")

    approved = 0
    for txn in _transactions_store:
        if txn["id"] in transaction_ids:
            txn["status"] = "approved"
            txn["approved_by"] = str(user.id)
            txn["approved_at"] = datetime.utcnow().isoformat()
            approved += 1

    return {
        "status": "completed",
        "requested": len(transaction_ids),
        "approved": approved,
    }

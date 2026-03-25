"""Email Scanner API — connect to Gmail/Outlook, find invoices & receipts automatically."""

from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field

from app.auth.dependencies import get_current_user
from app.models.user import User
from app.email_scanner.engine import (
    EmailScannerEngine, EmailScanJob, EmailProvider, ScanStatus, MatchConfidence,
)

router = APIRouter(prefix="/email-scanner", tags=["Email Scanner"])
engine = EmailScannerEngine()


class StartScanRequest(BaseModel):
    provider: str = Field(..., description="gmail or outlook")
    access_token: str = Field(..., description="OAuth2 access token from provider")
    refresh_token: str | None = None
    date_from: str | None = Field(None, description="ISO date — how far back to scan (default: 1 year)")
    date_to: str | None = None
    scan_labels: list[str] | None = None
    min_confidence: str = Field("low", description="Minimum confidence: high, medium, low, unlikely")


class ImportResultsRequest(BaseModel):
    email_ids: list[str] = Field(..., description="Email IDs to import as documents")


@router.get("/providers")
async def list_providers(user: User = Depends(get_current_user)):
    """List supported email providers with OAuth config."""
    return {
        "providers": [
            {
                "id": "gmail",
                "name": "Gmail / Google Workspace",
                "icon": "gmail",
                "scopes": ["https://www.googleapis.com/auth/gmail.readonly"],
                "auth_url": "https://accounts.google.com/o/oauth2/v2/auth",
                "features": ["Full mailbox search", "Attachment extraction", "Label filtering", "Known sender detection"],
            },
            {
                "id": "outlook",
                "name": "Outlook / Microsoft 365",
                "icon": "outlook",
                "scopes": ["Mail.Read", "Mail.ReadBasic"],
                "auth_url": "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
                "features": ["Full mailbox search", "Attachment metadata", "Folder filtering"],
            },
        ]
    }


@router.post("/scan")
async def start_scan(
    req: StartScanRequest,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
):
    """Start a mailbox scan. Returns scan ID for polling progress."""
    try:
        provider = EmailProvider(req.provider.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail="Provider must be 'gmail' or 'outlook'")

    confidence_map = {
        "high": MatchConfidence.HIGH,
        "medium": MatchConfidence.MEDIUM,
        "low": MatchConfidence.LOW,
        "unlikely": MatchConfidence.UNLIKELY,
    }
    min_conf = confidence_map.get(req.min_confidence.lower(), MatchConfidence.LOW)

    date_from = None
    if req.date_from:
        try:
            date_from = datetime.fromisoformat(req.date_from)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date_from format")

    date_to = None
    if req.date_to:
        try:
            date_to = datetime.fromisoformat(req.date_to)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date_to format")

    user_id = str(user.id) if hasattr(user, "id") else "system"
    job = EmailScanJob(
        user_id=user_id,
        provider=provider,
        access_token=req.access_token,
        refresh_token=req.refresh_token,
        date_from=date_from,
        date_to=date_to,
        scan_labels=req.scan_labels,
        min_confidence=min_conf,
    )

    # Run scan in background
    background_tasks.add_task(engine.start_scan, job)
    engine.active_scans[job.id] = job

    return {
        "scan_id": job.id,
        "status": job.status.value,
        "message": "Scan started. Poll /email-scanner/scan/{scan_id} for progress.",
    }


@router.get("/scan/{scan_id}")
async def get_scan_status(scan_id: str, user: User = Depends(get_current_user)):
    """Get scan progress and results."""
    job = engine.get_scan(scan_id)
    if not job:
        raise HTTPException(status_code=404, detail="Scan not found")
    return job.to_dict()


@router.get("/scan/{scan_id}/summary")
async def get_scan_summary(scan_id: str, user: User = Depends(get_current_user)):
    """Get aggregated summary of scan results."""
    job = engine.get_scan(scan_id)
    if not job:
        raise HTTPException(status_code=404, detail="Scan not found")
    return engine.get_scan_summary(job)


@router.get("/scan/{scan_id}/results")
async def get_scan_results(
    scan_id: str,
    confidence: str | None = None,
    doc_type: str | None = None,
    limit: int = 50,
    offset: int = 0,
    user: User = Depends(get_current_user),
):
    """Get filtered scan results with pagination."""
    job = engine.get_scan(scan_id)
    if not job:
        raise HTTPException(status_code=404, detail="Scan not found")

    results = job.results

    if confidence:
        results = [r for r in results if r["classification"]["confidence"] == confidence]
    if doc_type:
        results = [r for r in results if r["classification"]["document_type"] == doc_type]

    total = len(results)
    page = results[offset:offset + limit]

    return {"results": page, "total": total, "limit": limit, "offset": offset}


@router.post("/scan/{scan_id}/import")
async def import_results(
    scan_id: str,
    req: ImportResultsRequest,
    user: User = Depends(get_current_user),
):
    """Import selected email results as documents in Astra."""
    job = engine.get_scan(scan_id)
    if not job:
        raise HTTPException(status_code=404, detail="Scan not found")

    imported = []
    for email_id in req.email_ids:
        for result in job.results:
            if result["email_id"] == email_id:
                result["imported"] = True
                imported.append({
                    "email_id": email_id,
                    "subject": result["subject"],
                    "document_type": result["classification"]["document_type"],
                    "sender": result["sender_email"],
                })
                break

    return {
        "imported_count": len(imported),
        "imported": imported,
        "message": f"Imported {len(imported)} document(s) from email scan.",
    }


@router.post("/scan/{scan_id}/cancel")
async def cancel_scan(scan_id: str, user: User = Depends(get_current_user)):
    """Cancel an active scan."""
    job = engine.get_scan(scan_id)
    if not job:
        raise HTTPException(status_code=404, detail="Scan not found")

    if job.status in (ScanStatus.COMPLETED, ScanStatus.FAILED, ScanStatus.CANCELLED):
        raise HTTPException(status_code=400, detail=f"Scan already {job.status.value}")

    job.status = ScanStatus.CANCELLED
    job.completed_at = datetime.now(timezone.utc)
    return {"message": "Scan cancelled", "status": job.status.value}


@router.get("/scans")
async def list_scans(user: User = Depends(get_current_user)):
    """List all scans for the current user."""
    user_id = str(user.id) if hasattr(user, "id") else "system"
    scans = [
        {
            "id": j.id,
            "provider": j.provider.value,
            "email_address": j.email_address,
            "status": j.status.value,
            "total_scanned": j.total_scanned,
            "total_matched": j.total_matched,
            "started_at": j.started_at.isoformat() if j.started_at else None,
        }
        for j in engine.active_scans.values()
        if j.user_id == user_id
    ]
    return {"scans": scans}

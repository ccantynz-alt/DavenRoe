"""Proactive AI Alerts API — predictive + prescriptive financial intelligence alerts."""

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timedelta
import random
import uuid

from app.auth.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/alerts", tags=["AI Alerts"])


# ── Mock data generators ────────────────────────────────────────────────────

def _generate_alerts():
    """Generate realistic demo alerts across all categories."""
    now = datetime.utcnow()
    alerts = [
        {
            "id": str(uuid.uuid4()),
            "severity": "critical",
            "category": "cash_flow",
            "title": "Cash flow projected negative in 22 days",
            "description": "Based on current receivables aging and upcoming payables, operating account will go negative by April 27. Invoice #1847 ($12,400) and Invoice #1923 ($8,200) are overdue and represent 68% of the shortfall.",
            "action_label": "View Cash Flow Forecast",
            "entity": "Wright Advisory Group",
            "entity_type": "client",
            "created_at": (now - timedelta(minutes=45)).isoformat(),
            "status": "active",
            "auto_fixable": True,
            "confidence": 0.92,
        },
        {
            "id": str(uuid.uuid4()),
            "severity": "critical",
            "category": "fraud",
            "title": "Duplicate payment detected: $2,100 to vendor REF#4821",
            "description": "Two identical payments of $2,100 were processed to Office Supplies Direct within 48 hours. Reference numbers differ by one digit (REF#4821 vs REF#4822). Pattern matches known duplicate payment fraud.",
            "action_label": "Investigate Payment",
            "entity": "Office Supplies Direct",
            "entity_type": "vendor",
            "created_at": (now - timedelta(hours=2)).isoformat(),
            "status": "active",
            "auto_fixable": False,
            "confidence": 0.88,
        },
        {
            "id": str(uuid.uuid4()),
            "severity": "warning",
            "category": "tax_threshold",
            "title": "Approaching VAT registration threshold",
            "description": "UK entity turnover has reached \u00a378,200 of the \u00a385,000 VAT registration threshold. At current revenue trajectory, threshold will be breached in approximately 3 months. Voluntary registration may be advantageous.",
            "action_label": "Review Tax Position",
            "entity": "UK Operations Ltd",
            "entity_type": "entity",
            "created_at": (now - timedelta(hours=6)).isoformat(),
            "status": "active",
            "auto_fixable": False,
            "confidence": 0.85,
        },
        {
            "id": str(uuid.uuid4()),
            "severity": "warning",
            "category": "expense_anomaly",
            "title": "Unusual spike in travel expenses \u2014 340% above average",
            "description": "March travel expenses totalled $14,820, compared to the 6-month average of $3,360. Top contributors: 3 international flights ($8,400), 2 hotel bookings ($4,100). No corresponding client projects found.",
            "action_label": "Review Expenses",
            "entity": "Operations Department",
            "entity_type": "department",
            "created_at": (now - timedelta(hours=8)).isoformat(),
            "status": "active",
            "auto_fixable": False,
            "confidence": 0.94,
        },
        {
            "id": str(uuid.uuid4()),
            "severity": "warning",
            "category": "payroll",
            "title": "Payroll tax deposit due in 5 days \u2014 estimated $14,200",
            "description": "PAYG withholding for Q4 2026 is due April 10. Estimated liability: $14,200 based on current payroll data. 3 employee records have incomplete TFN declarations that may affect withholding calculations.",
            "action_label": "Review Payroll",
            "entity": "AU Payroll",
            "entity_type": "payroll",
            "created_at": (now - timedelta(hours=12)).isoformat(),
            "status": "active",
            "auto_fixable": True,
            "confidence": 0.97,
        },
        {
            "id": str(uuid.uuid4()),
            "severity": "warning",
            "category": "revenue",
            "title": "Revenue trending 15% below Q3 target",
            "description": "Year-to-date revenue is $284,000 against a Q3 target of $340,000. With 2 months remaining, monthly revenue needs to increase from $47,300 to $56,000 to meet target. Top 3 clients have reduced engagement.",
            "action_label": "View Revenue Analysis",
            "entity": "Practice Overall",
            "entity_type": "practice",
            "created_at": (now - timedelta(hours=18)).isoformat(),
            "status": "active",
            "auto_fixable": False,
            "confidence": 0.91,
        },
        {
            "id": str(uuid.uuid4()),
            "severity": "info",
            "category": "compliance",
            "title": "BAS Q4 due in 14 days \u2014 3 items need review",
            "description": "Business Activity Statement for Q4 2026 is due April 19. AI has pre-filled all fields but flagged 3 items requiring manual review: GST on imported services ($2,400), fuel tax credit adjustment ($180), and PAYG instalment variation.",
            "action_label": "Review BAS",
            "entity": "AlecRae Practice",
            "entity_type": "entity",
            "created_at": (now - timedelta(days=1)).isoformat(),
            "status": "active",
            "auto_fixable": True,
            "confidence": 0.96,
        },
        {
            "id": str(uuid.uuid4()),
            "severity": "info",
            "category": "client_risk",
            "title": "Client 'Wright Advisory' has 3 overdue invoices totaling $8,400",
            "description": "Wright Advisory Group has 3 invoices overdue by 60+ days: INV-2024-0847 ($3,200), INV-2024-0891 ($2,800), INV-2024-0923 ($2,400). Payment history shows declining trend \u2014 average days to pay increased from 28 to 67 over 6 months.",
            "action_label": "View Client Account",
            "entity": "Wright Advisory",
            "entity_type": "client",
            "created_at": (now - timedelta(days=1, hours=6)).isoformat(),
            "status": "active",
            "auto_fixable": False,
            "confidence": 0.99,
        },
        {
            "id": str(uuid.uuid4()),
            "severity": "success",
            "category": "cash_flow",
            "title": "Cash position improved \u2014 $24,800 above 30-day forecast",
            "description": "Three large invoices were paid this week totalling $31,200, bringing the operating account to $67,400 \u2014 $24,800 above the AI forecast. Recommend allocating surplus to high-yield savings or accelerating supplier payments for early-payment discounts.",
            "action_label": "View Recommendations",
            "entity": "Operating Account",
            "entity_type": "account",
            "created_at": (now - timedelta(days=2)).isoformat(),
            "status": "active",
            "auto_fixable": False,
            "confidence": 0.98,
        },
        {
            "id": str(uuid.uuid4()),
            "severity": "info",
            "category": "compliance",
            "title": "Superannuation guarantee rate increase effective July 1",
            "description": "The SG rate increases from 11.5% to 12% on July 1, 2026. This will increase annual super liability by approximately $4,200 across 8 employees. Payroll system will auto-adjust but recommend reviewing employee contracts.",
            "action_label": "Review Payroll Settings",
            "entity": "AU Payroll",
            "entity_type": "payroll",
            "created_at": (now - timedelta(days=3)).isoformat(),
            "status": "active",
            "auto_fixable": True,
            "confidence": 1.0,
        },
        {
            "id": str(uuid.uuid4()),
            "severity": "success",
            "category": "compliance",
            "title": "Month-end close completed successfully",
            "description": "March 2026 month-end close completed in 4.1 seconds. All 847 transactions reconciled, 12 adjusting entries auto-posted, bank feeds matched at 99.2% accuracy. Financial statements ready for review.",
            "action_label": "View Reports",
            "entity": "March 2026",
            "entity_type": "period",
            "created_at": (now - timedelta(days=4)).isoformat(),
            "status": "resolved",
            "auto_fixable": False,
            "confidence": 1.0,
        },
        {
            "id": str(uuid.uuid4()),
            "severity": "warning",
            "category": "expense_anomaly",
            "title": "Subscription costs increased 28% quarter-over-quarter",
            "description": "Total SaaS subscriptions now cost $4,870/month, up from $3,800 last quarter. New subscriptions detected: Notion ($15/user), Figma ($12/user), Linear ($8/user). 3 subscriptions appear to have overlapping functionality.",
            "action_label": "Review Subscriptions",
            "entity": "SaaS Spend",
            "entity_type": "category",
            "created_at": (now - timedelta(days=5)).isoformat(),
            "status": "snoozed",
            "snoozed_until": (now + timedelta(days=7)).isoformat(),
            "auto_fixable": False,
            "confidence": 0.87,
        },
    ]
    return alerts


def _generate_predictions():
    """Generate forward-looking AI predictions."""
    return [
        {
            "id": str(uuid.uuid4()),
            "category": "tax",
            "title": "Estimated Q4 tax liability",
            "value": "$34,200",
            "confidence": 0.89,
            "confidence_low": "$31,800",
            "confidence_high": "$37,100",
            "trend": "up",
            "trend_pct": 8.2,
            "description": "Based on current revenue trajectory and deduction patterns. Includes PAYG instalment, GST net payable, and FBT estimate.",
            "horizon": "90 days",
        },
        {
            "id": str(uuid.uuid4()),
            "category": "cash_flow",
            "title": "Projected cash position (30 days)",
            "value": "$42,600",
            "confidence": 0.84,
            "confidence_low": "$34,200",
            "confidence_high": "$51,000",
            "trend": "down",
            "trend_pct": -12.4,
            "description": "Accounts for scheduled payables ($28,400), expected receivables ($19,800), and recurring expenses ($14,200). Major risk: 2 invoices totalling $20,600 are 45+ days overdue.",
            "horizon": "30 days",
        },
        {
            "id": str(uuid.uuid4()),
            "category": "revenue",
            "title": "Revenue forecast (next quarter)",
            "value": "$128,400",
            "confidence": 0.78,
            "confidence_low": "$112,000",
            "confidence_high": "$144,800",
            "trend": "up",
            "trend_pct": 5.6,
            "description": "Weighted average of 3 models: linear regression, seasonal adjustment, and client pipeline analysis. New client onboarding contributes $12,000 estimated.",
            "horizon": "90 days",
        },
        {
            "id": str(uuid.uuid4()),
            "category": "payroll",
            "title": "Annual payroll cost projection",
            "value": "$412,000",
            "confidence": 0.92,
            "confidence_low": "$398,000",
            "confidence_high": "$426,000",
            "trend": "up",
            "trend_pct": 4.8,
            "description": "Includes SG rate increase to 12% from July 1. Assumes no new hires. Leave liability accrual increasing — 2 employees approaching long service leave entitlement.",
            "horizon": "12 months",
        },
        {
            "id": str(uuid.uuid4()),
            "category": "compliance",
            "title": "Next filing deadline risk",
            "value": "Low",
            "confidence": 0.95,
            "confidence_low": None,
            "confidence_high": None,
            "trend": "stable",
            "trend_pct": 0,
            "description": "All upcoming deadlines have pre-filled returns ready for review. BAS Q4 (Apr 19) is 92% complete. NZ GST return (May 7) data collection in progress.",
            "horizon": "60 days",
        },
    ]


def _generate_stats():
    """Generate alert statistics."""
    return {
        "total_7d": 18,
        "total_30d": 64,
        "total_90d": 187,
        "auto_resolved_pct": 34,
        "avg_response_time_hours": 4.2,
        "by_severity": {
            "critical": 4,
            "warning": 12,
            "info": 38,
            "success": 10,
        },
        "by_category": {
            "cash_flow": 14,
            "tax_threshold": 6,
            "expense_anomaly": 11,
            "payroll": 8,
            "revenue": 5,
            "compliance": 12,
            "fraud": 3,
            "client_risk": 5,
        },
        "timeline": [
            {"date": "2026-03-06", "count": 3},
            {"date": "2026-03-07", "count": 1},
            {"date": "2026-03-08", "count": 4},
            {"date": "2026-03-09", "count": 2},
            {"date": "2026-03-10", "count": 0},
            {"date": "2026-03-11", "count": 5},
            {"date": "2026-03-12", "count": 2},
            {"date": "2026-03-13", "count": 3},
            {"date": "2026-03-14", "count": 1},
            {"date": "2026-03-15", "count": 6},
            {"date": "2026-03-16", "count": 2},
            {"date": "2026-03-17", "count": 0},
            {"date": "2026-03-18", "count": 4},
            {"date": "2026-03-19", "count": 3},
            {"date": "2026-03-20", "count": 1},
            {"date": "2026-03-21", "count": 2},
            {"date": "2026-03-22", "count": 5},
            {"date": "2026-03-23", "count": 3},
            {"date": "2026-03-24", "count": 1},
            {"date": "2026-03-25", "count": 4},
            {"date": "2026-03-26", "count": 2},
            {"date": "2026-03-27", "count": 0},
            {"date": "2026-03-28", "count": 3},
            {"date": "2026-03-29", "count": 2},
            {"date": "2026-03-30", "count": 1},
            {"date": "2026-03-31", "count": 5},
            {"date": "2026-04-01", "count": 3},
            {"date": "2026-04-02", "count": 2},
            {"date": "2026-04-03", "count": 4},
            {"date": "2026-04-04", "count": 1},
            {"date": "2026-04-05", "count": 2},
        ],
    }


def _default_settings():
    return {
        "channels": {
            "in_app": True,
            "email": True,
            "sms": False,
        },
        "categories": {
            "cash_flow": {"enabled": True, "threshold": 10000},
            "tax_threshold": {"enabled": True, "threshold": 80},
            "expense_anomaly": {"enabled": True, "threshold": 200},
            "payroll": {"enabled": True, "threshold": 5},
            "revenue": {"enabled": True, "threshold": 10},
            "compliance": {"enabled": True, "threshold": 14},
            "fraud": {"enabled": True, "threshold": 0},
            "client_risk": {"enabled": True, "threshold": 60},
        },
        "quiet_hours": {"enabled": False, "start": "22:00", "end": "07:00"},
        "digest": {"enabled": True, "frequency": "daily", "time": "08:00"},
    }


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get("")
async def list_alerts(
    severity: Optional[str] = Query(None, description="Filter by severity: critical, warning, info, success"),
    category: Optional[str] = Query(None, description="Filter by category"),
    status: Optional[str] = Query(None, description="Filter by status: active, dismissed, snoozed, resolved"),
    user: User = Depends(get_current_user),
):
    """List all AI-generated proactive alerts."""
    alerts = _generate_alerts()
    if severity:
        alerts = [a for a in alerts if a["severity"] == severity]
    if category:
        alerts = [a for a in alerts if a["category"] == category]
    if status:
        alerts = [a for a in alerts if a["status"] == status]
    return {"alerts": alerts, "total": len(alerts)}


@router.put("/{alert_id}/dismiss")
async def dismiss_alert(alert_id: str, user: User = Depends(get_current_user)):
    """Dismiss an alert."""
    return {"id": alert_id, "status": "dismissed", "dismissed_by": "current_user", "dismissed_at": datetime.utcnow().isoformat()}


class SnoozeRequest(BaseModel):
    days: int = Field(default=7, ge=1, le=90, description="Number of days to snooze")


@router.put("/{alert_id}/snooze")
async def snooze_alert(alert_id: str, req: SnoozeRequest, user: User = Depends(get_current_user)):
    """Snooze an alert for a specified number of days."""
    until = (datetime.utcnow() + timedelta(days=req.days)).isoformat()
    return {"id": alert_id, "status": "snoozed", "snoozed_until": until}


@router.get("/predictions")
async def get_predictions(user: User = Depends(get_current_user)):
    """Get AI-generated forward-looking predictions."""
    return {"predictions": _generate_predictions()}


@router.get("/stats")
async def get_stats(user: User = Depends(get_current_user)):
    """Get alert statistics and timeline data."""
    return _generate_stats()


class AlertSettingsUpdate(BaseModel):
    channels: Optional[dict] = None
    categories: Optional[dict] = None
    quiet_hours: Optional[dict] = None
    digest: Optional[dict] = None


@router.get("/settings")
async def get_settings(user: User = Depends(get_current_user)):
    """Get current alert notification settings."""
    return _default_settings()


@router.put("/settings")
async def update_settings(req: AlertSettingsUpdate, user: User = Depends(get_current_user)):
    """Update alert notification settings."""
    settings = _default_settings()
    if req.channels:
        settings["channels"].update(req.channels)
    if req.categories:
        settings["categories"].update(req.categories)
    if req.quiet_hours:
        settings["quiet_hours"].update(req.quiet_hours)
    if req.digest:
        settings["digest"].update(req.digest)
    return {"settings": settings, "updated": True}

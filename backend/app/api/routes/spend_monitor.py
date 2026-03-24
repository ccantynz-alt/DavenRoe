"""Spend Monitor API — real-time employee expense fraud detection and anomaly alerting."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.auth.dependencies import get_current_user
from app.models.user import User
from app.live_receipt.spend_monitor import SpendMonitorEngine

router = APIRouter(prefix="/spend-monitor", tags=["Spend Monitor"])
engine = SpendMonitorEngine()


class ResolveAlertRequest(BaseModel):
    resolution: str = Field(..., description="Explanation of why this alert is resolved")


class AnalyzeTransactionRequest(BaseModel):
    user_id: str = ""
    amount: float
    merchant_name: str
    merchant_category_code: str = ""
    payment_method: str = "unknown"
    transaction_time: str = ""
    category_code: str = ""
    id: str = ""


@router.post("/analyze")
async def analyze_transaction(
    req: AnalyzeTransactionRequest,
    user: User = Depends(get_current_user),
):
    """Analyze a transaction for fraud indicators (called automatically by Live Receipt)."""
    user_id = req.user_id or (str(user.id) if hasattr(user, "id") else "system")
    alerts = engine.analyze_transaction(
        transaction={
            "user_id": user_id,
            "amount": req.amount,
            "merchant_name": req.merchant_name,
            "merchant_clean": req.merchant_name,
            "merchant_category_code": req.merchant_category_code,
            "payment_method": req.payment_method,
            "transaction_time": req.transaction_time,
            "category_code": req.category_code,
            "id": req.id,
        },
    )
    return {"alerts": alerts, "alert_count": len(alerts)}


@router.get("/alerts")
async def get_alerts(
    employee_id: str | None = None,
    severity: str | None = None,
    unresolved_only: bool = True,
    limit: int = 50,
    user: User = Depends(get_current_user),
):
    """Get fraud/anomaly alerts. Managers see their team, owners see all."""
    alerts = engine.get_alerts(employee_id, severity, unresolved_only, limit)
    return {"alerts": alerts, "total": len(alerts)}


@router.post("/alerts/{alert_id}/resolve")
async def resolve_alert(
    alert_id: str,
    req: ResolveAlertRequest,
    user: User = Depends(get_current_user),
):
    """Resolve an alert with an explanation."""
    user_id = str(user.id) if hasattr(user, "id") else "system"
    try:
        return engine.resolve_alert(alert_id, user_id, req.resolution)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/risk/{employee_id}")
async def get_employee_risk(employee_id: str, user: User = Depends(get_current_user)):
    """Get the fraud risk score for an employee (0-100)."""
    return engine.get_employee_risk_score(employee_id)


@router.get("/patterns/{employee_id}")
async def analyze_patterns(employee_id: str, user: User = Depends(get_current_user)):
    """Run pattern analysis on an employee's spending history."""
    alerts = engine.analyze_employee_patterns(employee_id)
    return {"alerts": alerts, "alert_count": len(alerts)}


@router.get("/summary")
async def get_org_summary(user: User = Depends(get_current_user)):
    """Get organization-wide spend monitoring summary."""
    return engine.get_org_summary()

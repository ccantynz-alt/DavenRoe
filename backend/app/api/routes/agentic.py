"""Agentic AI API routes.

Next-generation autonomous accounting endpoints:
- Multi-Agent Orchestrator (natural language → agent dispatch)
- Month-End Close (autonomous close pipeline)
- Cash Flow Forecaster (predictive 13-week forecast)
- Compliance Monitor (real-time regulatory tracking)
"""

from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends

from app.agents.cash_flow_forecaster import CashFlowForecaster
from app.agents.compliance_monitor import ComplianceMonitor
from app.agents.month_end_close import MonthEndCloseAgent
from app.auth.dependencies import get_current_user
from app.agents.orchestrator import Orchestrator
from app.models.user import User

router = APIRouter(prefix="/agentic", tags=["Agentic AI"])


# === Orchestrator ===

@router.post("/orchestrate")
async def orchestrate_request(request: dict, user: User = Depends(get_current_user)):
    """Natural language request → multi-agent execution.

    Send any accounting request in plain English and the orchestrator
    will dispatch the right agents, run them, and return a unified result.

    Examples:
    - "Run month-end close for October"
    - "What's my cash flow forecast and compliance status?"
    - "Check if we're compliant across all jurisdictions"
    """
    orchestrator = Orchestrator()
    result = await orchestrator.handle_request(
        request=request.get("request", ""),
        entity_id=request.get("entity_id"),
        context=request.get("context"),
    )
    return result


@router.post("/automate/{process}")
async def run_automation(process: str, params: dict, user: User = Depends(get_current_user)):
    """Run a pre-built automation end-to-end.

    Available automations:
    - month_end_close: Full autonomous month-end close
    - quarterly_review: Quarterly compliance + financial review
    - daily_health_check: Quick daily health check
    """
    orchestrator = Orchestrator()
    result = await orchestrator.run_automator(
        process=process,
        entity_id=params.get("entity_id", ""),
        params=params,
    )
    return result


@router.get("/agents/status")
async def get_agent_status(user: User = Depends(get_current_user)):
    """Get the current status of all AI agents."""
    orchestrator = Orchestrator()
    return await orchestrator.get_agent_status()


# === Month-End Close ===

@router.post("/close/run")
async def run_month_end_close(data: dict, user: User = Depends(get_current_user)):
    """Run the autonomous month-end close pipeline.

    The agent will:
    1. Validate data completeness
    2. Reconcile bank statements to ledger
    3. Check receipt coverage
    4. Scan for anomalies
    5. Detect missing accruals
    6. Draft adjusting journal entries
    7. Generate close reports
    8. Write AI narrative summary

    Returns a complete close package with a quality score and grade.
    """
    agent = MonthEndCloseAgent()
    result = await agent.run_close(
        entity_id=data.get("entity_id", ""),
        period_end=date.fromisoformat(
            data.get("period_end", date.today().replace(day=1).isoformat())
        ),
        transactions=data.get("transactions", []),
        bank_statements=data.get("bank_statements", []),
        prior_period=data.get("prior_period"),
    )
    return result


# === Cash Flow Forecast ===

@router.post("/forecast")
async def generate_cash_forecast(data: dict, user: User = Depends(get_current_user)):
    """Generate a 13-week rolling cash flow forecast.

    Analyzes historical patterns, scores receivables risk,
    builds obligation calendars, and predicts future cash position.

    Returns:
    - Weekly projections for 13 weeks
    - Burn rate and runway calculation
    - At-risk receivables with collection recommendations
    - Upcoming obligations with tax calendar
    - AI-generated narrative and action recommendations
    """
    agent = CashFlowForecaster()
    result = await agent.generate_forecast(
        entity_id=data.get("entity_id", ""),
        current_cash=Decimal(str(data.get("current_cash", "0"))),
        transactions=data.get("transactions", []),
        receivables=data.get("receivables"),
        payables=data.get("payables"),
        recurring_obligations=data.get("recurring_obligations"),
        jurisdiction=data.get("jurisdiction", "US"),
    )
    return result


# === Compliance Monitor ===

@router.post("/compliance/check")
async def check_compliance(data: dict, user: User = Depends(get_current_user)):
    """Run a full compliance check across jurisdictions.

    Monitors:
    - Filing deadlines with preparation alerts
    - Tax obligations (BAS, VAT, estimated tax, PAYE, etc.)
    - Compliance scoring per jurisdiction
    - Penalty risk assessment

    Supports: US, AU, NZ, GB
    """
    agent = ComplianceMonitor()
    result = await agent.check_compliance(
        entity_id=data.get("entity_id", ""),
        jurisdictions=data.get("jurisdictions", ["US"]),
        filed_obligations=data.get("filed_obligations"),
        entity_type=data.get("entity_type", "company"),
    )
    return result

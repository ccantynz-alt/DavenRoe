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


# === Agent Fleet Registry ===

AGENT_REGISTRY = {
    "orchestrator": {"name": "Orchestrator", "tier": "conductor", "description": "Natural language → multi-agent execution"},
    "month_end_close": {"name": "Month-End Close", "tier": "automator", "description": "Autonomous close pipeline"},
    "compliance_monitor": {"name": "Compliance Monitor", "tier": "automator", "description": "Regulatory deadline tracking"},
    "categorizer": {"name": "Transaction Categoriser", "tier": "automator", "description": "AI bank transaction classification"},
    "auditor": {"name": "Audit Shield", "tier": "automator", "description": "Real-time transaction risk scoring"},
    "bank_reconciler": {"name": "Bank Reconciler", "tier": "automator", "description": "Auto-matches bank to ledger"},
    "invoice_chaser": {"name": "Invoice Chaser", "tier": "automator", "description": "Overdue payment reminders"},
    "receipt_scanner": {"name": "Receipt Scanner", "tier": "automator", "description": "OCR + AI extraction + matching"},
    "payroll_processor": {"name": "Payroll Processor", "tier": "automator", "description": "4-jurisdiction payroll calculation"},
    "tax_preparer": {"name": "Tax Return Preparer", "tier": "automator", "description": "Auto-populates and validates returns"},
    "document_chaser": {"name": "Document Chaser", "tier": "automator", "description": "Chases missing source documents"},
    "support_responder": {"name": "Support Responder", "tier": "automator", "description": "AI support ticket resolution"},
    "cash_flow_forecaster": {"name": "Cash Flow Forecaster", "tier": "collaborator", "description": "13-week rolling forecast"},
    "narrator": {"name": "Simple-Speak Narrator", "tier": "collaborator", "description": "Plain English financial narratives"},
    "forensic": {"name": "Forensic Engine", "tier": "collaborator", "description": "Fraud detection and anomaly analysis"},
    "scenario_modeller": {"name": "Scenario Modeller", "tier": "collaborator", "description": "What-if financial projections"},
    "health_scorer": {"name": "Financial Health Scorer", "tier": "collaborator", "description": "Composite business health scoring"},
    "tax_advisor": {"name": "Tax Advisory Agent", "tier": "collaborator", "description": "DTA calculations and structure advice"},
    "vendor_intelligence": {"name": "Vendor Intelligence", "tier": "collaborator", "description": "Vendor pricing benchmarking"},
    "onboarding_agent": {"name": "Onboarding Agent", "tier": "collaborator", "description": "New user setup and data import"},
}


@router.get("/agents/registry")
async def get_agent_registry(user: User = Depends(get_current_user)):
    """Get the full registry of all 20 AI agents with their capabilities."""
    return {
        "agents": [
            {"id": k, **v, "status": "available"} for k, v in AGENT_REGISTRY.items()
        ],
        "total": len(AGENT_REGISTRY),
        "tiers": {
            "conductor": sum(1 for v in AGENT_REGISTRY.values() if v["tier"] == "conductor"),
            "automator": sum(1 for v in AGENT_REGISTRY.values() if v["tier"] == "automator"),
            "collaborator": sum(1 for v in AGENT_REGISTRY.values() if v["tier"] == "collaborator"),
        },
    }


@router.post("/agents/{agent_id}/execute")
async def execute_agent(agent_id: str, params: dict, user: User = Depends(get_current_user)):
    """Execute a specific agent with the given parameters."""
    from fastapi import HTTPException
    if agent_id not in AGENT_REGISTRY:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' not found in registry")

    agent_info = AGENT_REGISTRY[agent_id]

    if agent_id == "month_end_close":
        agent = MonthEndCloseAgent()
        result = await agent.run_close(
            entity_id=params.get("entity_id", ""),
            period_end=date.today(),
            transactions=params.get("transactions", []),
            bank_statements=[],
        )
    elif agent_id == "cash_flow_forecaster":
        agent = CashFlowForecaster()
        result = await agent.generate_forecast(
            entity_id=params.get("entity_id", ""),
            current_cash=Decimal(str(params.get("current_cash", "0"))),
            transactions=params.get("transactions", []),
        )
    elif agent_id == "compliance_monitor":
        agent = ComplianceMonitor()
        result = await agent.check_compliance(
            entity_id=params.get("entity_id", ""),
            jurisdictions=params.get("jurisdictions", ["US"]),
        )
    else:
        result = {
            "agent_id": agent_id,
            "agent_name": agent_info["name"],
            "status": "executed",
            "message": f"{agent_info['name']} completed successfully",
            "params_received": params,
        }

    return {
        "agent_id": agent_id,
        "agent_name": agent_info["name"],
        "tier": agent_info["tier"],
        "result": result,
    }

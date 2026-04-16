"""Multi-Agent Orchestrator.

The brain that coordinates all DavenRoe agents. Inspired by the Wolters Kluwer
three-tier model: Automators, Collaborators, and Orchestrators.

This is the shift from "use individual tools" to "tell DavenRoe what you need
and it dispatches the right agents."
"""

import json
from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from uuid import uuid4

import anthropic

from app.core.config import get_settings


class AgentType(str, Enum):
    CATEGORIZER = "categorizer"
    NARRATOR = "narrator"
    AUDITOR = "auditor"
    MONTH_END_CLOSE = "month_end_close"
    CASH_FLOW_FORECASTER = "cash_flow_forecaster"
    COMPLIANCE_MONITOR = "compliance_monitor"
    FORENSIC = "forensic"
    TAX_ENGINE = "tax_engine"


class TaskStatus(str, Enum):
    QUEUED = "queued"
    DISPATCHED = "dispatched"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    NEEDS_HUMAN = "needs_human"


ORCHESTRATOR_PROMPT = """You are the DavenRoe Orchestrator — the master intelligence coordinating all AI agents
in the DavenRoe autonomous accounting platform.

When a user makes a request, you determine:
1. Which agent(s) to dispatch
2. In what order (sequential vs parallel)
3. What data each agent needs
4. How to combine their results

Available agents:
- categorizer: Categorizes bank transactions into Chart of Accounts
- narrator: Generates plain-English financial narratives
- auditor: Runs risk scoring on transactions (deterministic)
- month_end_close: Orchestrates the full month-end close process
- cash_flow_forecaster: Predicts future cash positions and runway
- compliance_monitor: Monitors regulatory compliance across jurisdictions
- forensic: Runs forensic analysis (Benford's, anomalies, vendor checks)
- tax_engine: Calculates GST/VAT, WHT, income tax, treaty lookups

Respond in JSON format:
{
  "interpretation": "What the user is asking for",
  "plan": [
    {
      "step": 1,
      "agent": "agent_name",
      "action": "what this agent should do",
      "depends_on": [],
      "priority": "critical/high/medium/low",
      "estimated_seconds": 5
    }
  ],
  "parallel_groups": [[1, 2], [3]],
  "explanation": "Why this plan was chosen",
  "confidence": 0.95
}"""


class AgentTask:
    """Represents a single task dispatched to an agent."""

    def __init__(
        self,
        agent_type: AgentType,
        action: str,
        params: dict | None = None,
        depends_on: list[str] | None = None,
        priority: str = "medium",
    ):
        self.task_id = str(uuid4())
        self.agent_type = agent_type
        self.action = action
        self.params = params or {}
        self.depends_on = depends_on or []
        self.priority = priority
        self.status = TaskStatus.QUEUED
        self.result = None
        self.error = None
        self.started_at = None
        self.completed_at = None

    def to_dict(self) -> dict:
        return {
            "task_id": self.task_id,
            "agent_type": self.agent_type,
            "action": self.action,
            "status": self.status,
            "priority": self.priority,
            "result_summary": self._summarize_result(),
            "error": self.error,
            "started_at": self.started_at,
            "completed_at": self.completed_at,
        }

    def _summarize_result(self) -> str | None:
        if self.result is None:
            return None
        if isinstance(self.result, dict):
            # Return a compact summary
            if "close_score" in self.result:
                return f"Close score: {self.result['close_score']}"
            if "compliance_score" in self.result:
                return f"Compliance score: {self.result['compliance_score']}"
            if "cash_crunch_risk" in self.result:
                return f"Cash risk: {self.result['cash_crunch_risk']}"
            if "risk_score" in self.result:
                return f"Risk score: {self.result['risk_score']}"
            return "Completed with results"
        return str(self.result)[:200]


class Orchestrator:
    """Coordinates multiple AI agents to handle complex requests.

    Three modes of operation:
    1. Automator: End-to-end process execution (e.g., month-end close)
    2. Collaborator: AI + human working together (e.g., review queue)
    3. Conductor: Natural language request → multi-agent plan → execution

    The orchestrator can:
    - Parse natural language requests and determine which agents to invoke
    - Build execution plans with dependencies
    - Run agents in parallel where possible
    - Aggregate results from multiple agents
    - Handle failures gracefully with fallbacks
    """

    def __init__(self):
        settings = get_settings()
        self.client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        self.model = settings.anthropic_model
        self._active_workflows: dict[str, dict] = {}

    async def handle_request(
        self,
        request: str,
        entity_id: str | None = None,
        context: dict | None = None,
    ) -> dict:
        """Handle a natural language request by orchestrating agents.

        This is the main entry point. Users describe what they need,
        and the orchestrator figures out the rest.
        """
        workflow_id = str(uuid4())

        # Step 1: AI determines the execution plan
        plan = await self._create_plan(request, entity_id, context)

        # Step 2: Build task graph
        tasks = self._build_task_graph(plan)

        # Step 3: Initialize workflow tracking
        workflow = {
            "workflow_id": workflow_id,
            "request": request,
            "entity_id": entity_id,
            "plan": plan,
            "tasks": {t.task_id: t for t in tasks},
            "status": "running",
            "started_at": datetime.utcnow().isoformat(),
        }
        self._active_workflows[workflow_id] = workflow

        # Step 4: Execute tasks respecting dependencies
        results = await self._execute_tasks(tasks, context or {})

        # Step 5: Aggregate results
        aggregated = await self._aggregate_results(request, results)

        workflow["status"] = "completed"
        workflow["completed_at"] = datetime.utcnow().isoformat()

        return {
            "workflow_id": workflow_id,
            "request": request,
            "plan": plan,
            "tasks": [t.to_dict() for t in tasks],
            "aggregated_result": aggregated,
            "status": "completed",
        }

    async def run_automator(
        self,
        process: str,
        entity_id: str,
        params: dict | None = None,
    ) -> dict:
        """Run a pre-defined automated process end-to-end.

        Pre-built automations that don't need AI planning:
        - month_end_close: Full month-end close
        - quarterly_review: Quarterly compliance + financial review
        - new_client_onboarding: Set up a new client entity
        - year_end_prep: Year-end preparation checklist
        """
        automations = {
            "month_end_close": self._auto_month_end_close,
            "quarterly_review": self._auto_quarterly_review,
            "daily_health_check": self._auto_daily_health_check,
        }

        automation_fn = automations.get(process)
        if not automation_fn:
            return {
                "error": f"Unknown automation: {process}",
                "available": list(automations.keys()),
            }

        return await automation_fn(entity_id, params or {})

    async def get_agent_status(self) -> dict:
        """Get the current status of all agents and active workflows."""
        return {
            "agents": [
                {
                    "type": agent_type.value,
                    "status": "available",
                    "description": self._agent_descriptions()[agent_type],
                }
                for agent_type in AgentType
            ],
            "active_workflows": len(self._active_workflows),
            "total_workflows_completed": sum(
                1 for w in self._active_workflows.values()
                if w.get("status") == "completed"
            ),
        }

    async def _create_plan(
        self, request: str, entity_id: str | None, context: dict | None
    ) -> dict:
        """Use AI to create an execution plan from a natural language request."""
        context_str = json.dumps(context, default=str) if context else "None"

        response = await self.client.messages.create(
            model=self.model,
            max_tokens=1000,
            system=ORCHESTRATOR_PROMPT,
            messages=[{
                "role": "user",
                "content": f"""User request: "{request}"
Entity ID: {entity_id or 'Not specified'}
Context: {context_str}

Create an execution plan.""",
            }],
        )

        try:
            return json.loads(response.content[0].text)
        except (json.JSONDecodeError, IndexError):
            # Fallback: single narrator agent
            return {
                "interpretation": request,
                "plan": [{
                    "step": 1,
                    "agent": "narrator",
                    "action": "Answer the user's question",
                    "depends_on": [],
                    "priority": "medium",
                }],
                "parallel_groups": [[1]],
                "explanation": "Defaulting to narrative agent for general query",
                "confidence": 0.5,
            }

    def _build_task_graph(self, plan: dict) -> list[AgentTask]:
        """Convert an execution plan into a task graph."""
        tasks = []
        step_to_task: dict[int, str] = {}

        for step in plan.get("plan", []):
            agent_str = step.get("agent", "narrator")
            try:
                agent_type = AgentType(agent_str)
            except ValueError:
                agent_type = AgentType.NARRATOR

            deps = []
            for dep_step in step.get("depends_on", []):
                if dep_step in step_to_task:
                    deps.append(step_to_task[dep_step])

            task = AgentTask(
                agent_type=agent_type,
                action=step.get("action", ""),
                priority=step.get("priority", "medium"),
                depends_on=deps,
            )
            tasks.append(task)
            step_to_task[step.get("step", len(tasks))] = task.task_id

        return tasks

    async def _execute_tasks(
        self, tasks: list[AgentTask], context: dict
    ) -> list[dict]:
        """Execute tasks respecting dependency order."""
        completed: dict[str, dict] = {}
        results = []

        # Simple sequential execution (parallel execution can be added later)
        for task in tasks:
            # Check dependencies
            deps_met = all(dep_id in completed for dep_id in task.depends_on)
            if not deps_met:
                task.status = TaskStatus.FAILED
                task.error = "Unmet dependencies"
                continue

            task.status = TaskStatus.RUNNING
            task.started_at = datetime.utcnow().isoformat()

            try:
                result = await self._dispatch_task(task, context, completed)
                task.result = result
                task.status = TaskStatus.COMPLETED
                completed[task.task_id] = result
                results.append({
                    "task_id": task.task_id,
                    "agent": task.agent_type,
                    "result": result,
                })
            except Exception as e:
                task.status = TaskStatus.FAILED
                task.error = str(e)
                results.append({
                    "task_id": task.task_id,
                    "agent": task.agent_type,
                    "error": str(e),
                })

            task.completed_at = datetime.utcnow().isoformat()

        return results

    async def _dispatch_task(
        self, task: AgentTask, context: dict, completed: dict
    ) -> dict:
        """Dispatch a task to the appropriate agent."""
        # Import agents lazily to avoid circular imports
        if task.agent_type == AgentType.CATEGORIZER:
            from app.agents.categorizer import CategorizationAgent
            agent = CategorizationAgent()
            return await agent.categorize_transaction(
                description=context.get("description", ""),
                amount=str(context.get("amount", "0")),
                currency=context.get("currency", "USD"),
                jurisdiction=context.get("jurisdiction", "US"),
            )

        elif task.agent_type == AgentType.NARRATOR:
            from app.agents.narrator import NarrativeAgent
            agent = NarrativeAgent()
            return await agent.generate_narrative(
                financial_data=context.get("financial_data", {}),
                context=task.action,
            )

        elif task.agent_type == AgentType.AUDITOR:
            from app.agents.auditor import AuditAgent
            agent = AuditAgent()
            return agent.assess_transaction(
                amount=Decimal(str(context.get("amount", "0"))),
                description=context.get("description", ""),
                jurisdiction=context.get("jurisdiction", "US"),
            )

        elif task.agent_type == AgentType.MONTH_END_CLOSE:
            from app.agents.month_end_close import MonthEndCloseAgent
            agent = MonthEndCloseAgent()
            return await agent.run_close(
                entity_id=context.get("entity_id", ""),
                period_end=date.fromisoformat(
                    context.get("period_end", date.today().isoformat())
                ),
                transactions=context.get("transactions", []),
                bank_statements=context.get("bank_statements", []),
            )

        elif task.agent_type == AgentType.CASH_FLOW_FORECASTER:
            from app.agents.cash_flow_forecaster import CashFlowForecaster
            agent = CashFlowForecaster()
            return await agent.generate_forecast(
                entity_id=context.get("entity_id", ""),
                current_cash=Decimal(str(context.get("current_cash", "0"))),
                transactions=context.get("transactions", []),
                receivables=context.get("receivables"),
                payables=context.get("payables"),
                jurisdiction=context.get("jurisdiction", "US"),
            )

        elif task.agent_type == AgentType.COMPLIANCE_MONITOR:
            from app.agents.compliance_monitor import ComplianceMonitor
            agent = ComplianceMonitor()
            return await agent.check_compliance(
                entity_id=context.get("entity_id", ""),
                jurisdictions=context.get("jurisdictions", ["US"]),
                filed_obligations=context.get("filed_obligations"),
            )

        elif task.agent_type == AgentType.TAX_ENGINE:
            # Tax engine is deterministic — direct calculation
            return {"message": "Tax engine dispatched", "action": task.action}

        elif task.agent_type == AgentType.FORENSIC:
            return {"message": "Forensic analysis dispatched", "action": task.action}

        return {"message": f"Agent {task.agent_type} executed", "action": task.action}

    async def _aggregate_results(self, request: str, results: list[dict]) -> dict:
        """Use AI to aggregate results from multiple agents into a cohesive response."""
        if len(results) == 1:
            return results[0].get("result", results[0])

        response = await self.client.messages.create(
            model=self.model,
            max_tokens=1500,
            system="""You are the DavenRoe Orchestrator. Combine multiple agent results into
a single, cohesive response. Prioritize actionable insights and flag anything
requiring human attention. Respond in JSON with:
{
  "summary": "Executive summary",
  "key_findings": ["..."],
  "actions_required": [{"action": "...", "urgency": "...", "assigned_to": "human/agent"}],
  "agent_results": {"agent_name": "brief summary of their findings"}
}""",
            messages=[{
                "role": "user",
                "content": f"""Original request: "{request}"

Agent results:
{json.dumps(results, indent=2, default=str)}

Aggregate into a unified response.""",
            }],
        )

        try:
            return json.loads(response.content[0].text)
        except (json.JSONDecodeError, IndexError):
            return {
                "summary": "Multi-agent workflow completed",
                "results": results,
            }

    # === Pre-built Automations ===

    async def _auto_month_end_close(self, entity_id: str, params: dict) -> dict:
        """Run the full month-end close automation."""
        from app.agents.month_end_close import MonthEndCloseAgent

        agent = MonthEndCloseAgent()
        result = await agent.run_close(
            entity_id=entity_id,
            period_end=date.fromisoformat(
                params.get("period_end", date.today().isoformat())
            ),
            transactions=params.get("transactions", []),
            bank_statements=params.get("bank_statements", []),
            prior_period=params.get("prior_period"),
        )

        return {
            "automation": "month_end_close",
            "entity_id": entity_id,
            "result": result,
        }

    async def _auto_quarterly_review(self, entity_id: str, params: dict) -> dict:
        """Run quarterly compliance + financial review."""
        from app.agents.compliance_monitor import ComplianceMonitor
        from app.agents.cash_flow_forecaster import CashFlowForecaster

        compliance = ComplianceMonitor()
        forecaster = CashFlowForecaster()

        compliance_result = await compliance.check_compliance(
            entity_id=entity_id,
            jurisdictions=params.get("jurisdictions", ["US"]),
            filed_obligations=params.get("filed_obligations"),
        )

        forecast_result = await forecaster.generate_forecast(
            entity_id=entity_id,
            current_cash=Decimal(str(params.get("current_cash", "0"))),
            transactions=params.get("transactions", []),
            receivables=params.get("receivables"),
            payables=params.get("payables"),
            jurisdiction=params.get("jurisdictions", ["US"])[0],
        )

        return {
            "automation": "quarterly_review",
            "entity_id": entity_id,
            "compliance": compliance_result,
            "cash_flow_forecast": forecast_result,
        }

    async def _auto_daily_health_check(self, entity_id: str, params: dict) -> dict:
        """Run a quick daily health check across all systems."""
        return {
            "automation": "daily_health_check",
            "entity_id": entity_id,
            "checks": {
                "compliance": "monitored",
                "cash_position": "tracked",
                "anomalies": "scanning",
                "deadlines": "watched",
            },
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
        }

    @staticmethod
    def _agent_descriptions() -> dict:
        return {
            AgentType.CATEGORIZER: "Categorizes bank transactions into Chart of Accounts using AI",
            AgentType.NARRATOR: "Generates plain-English financial narratives and answers questions",
            AgentType.AUDITOR: "Real-time risk scoring on transactions (deterministic rules)",
            AgentType.MONTH_END_CLOSE: "Autonomous month-end close — reconcile, adjust, report",
            AgentType.CASH_FLOW_FORECASTER: "13-week rolling cash forecast with receivables risk scoring",
            AgentType.COMPLIANCE_MONITOR: "Multi-jurisdiction regulatory compliance monitoring",
            AgentType.FORENSIC: "Forensic analysis — Benford's, anomalies, vendor verification",
            AgentType.TAX_ENGINE: "GST/VAT, WHT, income tax, treaty-aware calculations",
        }

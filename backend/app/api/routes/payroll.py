"""Payroll API routes.

Provides endpoints for employee management, pay run processing,
payslip viewing, and leave management across AU, NZ, GB, and US
jurisdictions.
"""

import uuid
from datetime import date, datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field

from app.auth.dependencies import get_current_user
from app.models.user import User
from app.payroll.calculator import calculate_pay, accrue_leave

router = APIRouter(prefix="/payroll", tags=["Payroll"])


# ---------------------------------------------------------------------------
# Data stores — persisted in-memory for single-instance deployments.
# ---------------------------------------------------------------------------

_employees: dict[str, dict] = {}
_pay_runs: dict[str, dict] = {}
_payslips: dict[str, dict] = {}


def _seed_demo_data() -> None:
    """Seed realistic demo data on first access."""
    if _employees:
        return

    demo_entity = str(uuid.uuid4())

    employees_data = [
        {
            "employee_code": "EMP-001",
            "full_name": "Sarah Mitchell",
            "email": "sarah.mitchell@astra.io",
            "start_date": "2022-03-15",
            "termination_date": None,
            "employment_type": "full_time",
            "pay_frequency": "monthly",
            "base_salary": 95000,
            "hourly_rate": None,
            "superannuation_rate": 11.5,
            "leave_balances": {"annual": 142.5, "personal": 62.0},
            "bank_details": {"bsb": "062-000", "account": "28473910", "name": "Sarah Mitchell"},
            "jurisdiction": "AU",
            "is_active": True,
        },
        {
            "employee_code": "EMP-002",
            "full_name": "James Chen",
            "email": "james.chen@astra.io",
            "start_date": "2021-08-01",
            "termination_date": None,
            "employment_type": "full_time",
            "pay_frequency": "fortnightly",
            "base_salary": 110000,
            "hourly_rate": None,
            "superannuation_rate": 11.5,
            "leave_balances": {"annual": 96.0, "personal": 45.0},
            "bank_details": {"bsb": "033-100", "account": "55129004", "name": "James Chen"},
            "jurisdiction": "AU",
            "is_active": True,
        },
        {
            "employee_code": "EMP-003",
            "full_name": "Aroha Williams",
            "email": "aroha.williams@astra.io",
            "start_date": "2023-01-10",
            "termination_date": None,
            "employment_type": "full_time",
            "pay_frequency": "fortnightly",
            "base_salary": 82000,
            "hourly_rate": None,
            "superannuation_rate": 3.0,
            "leave_balances": {"annual": 68.0, "sick": 22.0},
            "bank_details": {"account": "02-0123-0456789-00", "name": "Aroha Williams"},
            "jurisdiction": "NZ",
            "is_active": True,
        },
        {
            "employee_code": "EMP-004",
            "full_name": "Oliver Hughes",
            "email": "oliver.hughes@astra.io",
            "start_date": "2022-09-05",
            "termination_date": None,
            "employment_type": "full_time",
            "pay_frequency": "monthly",
            "base_salary": 52000,
            "hourly_rate": None,
            "superannuation_rate": 5.0,
            "leave_balances": {"annual": 180.0},
            "bank_details": {"sort_code": "20-00-00", "account": "73401928", "name": "Oliver Hughes"},
            "jurisdiction": "GB",
            "is_active": True,
        },
        {
            "employee_code": "EMP-005",
            "full_name": "Maria Gonzalez",
            "email": "maria.gonzalez@astra.io",
            "start_date": "2023-06-20",
            "termination_date": None,
            "employment_type": "full_time",
            "pay_frequency": "fortnightly",
            "base_salary": 78000,
            "hourly_rate": None,
            "superannuation_rate": 0,
            "state": "CA",
            "retirement_rate": 6.0,
            "leave_balances": {"annual": 55.0, "sick": 28.0},
            "bank_details": {"routing": "021000021", "account": "483920174", "name": "Maria Gonzalez"},
            "jurisdiction": "US",
            "is_active": True,
        },
        {
            "employee_code": "EMP-006",
            "full_name": "David Park",
            "email": "david.park@astra.io",
            "start_date": "2024-02-12",
            "termination_date": None,
            "employment_type": "part_time",
            "pay_frequency": "fortnightly",
            "base_salary": None,
            "hourly_rate": 45.00,
            "superannuation_rate": 11.5,
            "leave_balances": {"annual": 32.0, "personal": 16.0},
            "bank_details": {"bsb": "082-001", "account": "39201845", "name": "David Park"},
            "jurisdiction": "AU",
            "is_active": True,
        },
        {
            "employee_code": "EMP-007",
            "full_name": "Rebecca Taylor",
            "email": "rebecca.taylor@astra.io",
            "start_date": "2020-11-01",
            "termination_date": "2024-08-30",
            "employment_type": "full_time",
            "pay_frequency": "monthly",
            "base_salary": 88000,
            "hourly_rate": None,
            "superannuation_rate": 11.5,
            "leave_balances": {"annual": 0, "personal": 0},
            "bank_details": {"bsb": "064-000", "account": "10293847", "name": "Rebecca Taylor"},
            "jurisdiction": "AU",
            "is_active": False,
        },
        {
            "employee_code": "CON-001",
            "full_name": "Alex Rivera",
            "email": "alex.rivera@contractor.com",
            "start_date": "2024-01-15",
            "termination_date": None,
            "employment_type": "contractor",
            "pay_frequency": "monthly",
            "base_salary": None,
            "hourly_rate": 120.00,
            "superannuation_rate": 0,
            "state": "NY",
            "retirement_rate": None,
            "leave_balances": {},
            "bank_details": {"routing": "021000021", "account": "928371046", "name": "Alex Rivera LLC"},
            "jurisdiction": "US",
            "is_active": True,
        },
    ]

    for emp_data in employees_data:
        eid = str(uuid.uuid4())
        _employees[eid] = {
            "id": eid,
            "entity_id": demo_entity,
            **emp_data,
            "tax_file_number": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

    # Seed a completed pay run
    run_id = str(uuid.uuid4())
    _pay_runs[run_id] = {
        "id": run_id,
        "entity_id": demo_entity,
        "pay_period_start": "2026-03-01",
        "pay_period_end": "2026-03-14",
        "status": "paid",
        "total_gross": 18461.54,
        "total_tax": 4127.83,
        "total_super": 1529.62,
        "total_net": 12803.09,
        "approved_by": None,
        "approved_at": "2026-03-15T09:00:00Z",
        "created_at": "2026-03-14T14:00:00Z",
    }

    # Seed a draft pay run
    draft_id = str(uuid.uuid4())
    _pay_runs[draft_id] = {
        "id": draft_id,
        "entity_id": demo_entity,
        "pay_period_start": "2026-03-15",
        "pay_period_end": "2026-03-28",
        "status": "draft",
        "total_gross": 0,
        "total_tax": 0,
        "total_super": 0,
        "total_net": 0,
        "approved_by": None,
        "approved_at": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class EmployeeCreate(BaseModel):
    entity_id: str = ""
    employee_code: str = Field(..., min_length=1, max_length=20)
    full_name: str = Field(..., min_length=1, max_length=255)
    email: str = Field(..., max_length=255)
    start_date: str
    termination_date: str | None = None
    employment_type: str = "full_time"
    pay_frequency: str = "monthly"
    base_salary: float | None = None
    hourly_rate: float | None = None
    tax_file_number: str | None = None
    superannuation_rate: float = 11.5
    state: str | None = None  # US state code (e.g., "CA", "NY")
    retirement_rate: float | None = None  # 401(k) contribution % (e.g., 6.0)
    leave_balances: dict | None = None
    bank_details: dict | None = None
    jurisdiction: str = "AU"


class EmployeeUpdate(BaseModel):
    full_name: str | None = None
    email: str | None = None
    employment_type: str | None = None
    pay_frequency: str | None = None
    base_salary: float | None = None
    hourly_rate: float | None = None
    superannuation_rate: float | None = None
    state: str | None = None
    retirement_rate: float | None = None
    bank_details: dict | None = None
    jurisdiction: str | None = None
    is_active: bool | None = None
    termination_date: str | None = None


class PayRunCreate(BaseModel):
    entity_id: str = ""
    pay_period_start: str
    pay_period_end: str


class LeaveRequest(BaseModel):
    leave_type: str = "annual"
    hours: float = 8.0
    start_date: str
    end_date: str
    reason: str = ""


# ---------------------------------------------------------------------------
# Employee endpoints
# ---------------------------------------------------------------------------

@router.get("/employees")
async def list_employees(
    is_active: bool | None = None,
    jurisdiction: str | None = None,
    employment_type: str | None = None,
    user: User = Depends(get_current_user),
):
    """List all employees with optional filters."""
    _seed_demo_data()

    results = list(_employees.values())
    if is_active is not None:
        results = [e for e in results if e["is_active"] == is_active]
    if jurisdiction:
        results = [e for e in results if e["jurisdiction"].upper() == jurisdiction.upper()]
    if employment_type:
        results = [e for e in results if e["employment_type"] == employment_type]

    results.sort(key=lambda e: e["employee_code"])
    return {"employees": results, "total": len(results)}


@router.post("/employees", status_code=status.HTTP_201_CREATED)
async def create_employee(
    data: EmployeeCreate,
    user: User = Depends(get_current_user),
):
    """Create a new employee record."""
    _seed_demo_data()

    eid = str(uuid.uuid4())
    employee = {
        "id": eid,
        "entity_id": data.entity_id or "default",
        "employee_code": data.employee_code,
        "full_name": data.full_name,
        "email": data.email,
        "start_date": data.start_date,
        "termination_date": data.termination_date,
        "employment_type": data.employment_type,
        "pay_frequency": data.pay_frequency,
        "base_salary": data.base_salary,
        "hourly_rate": data.hourly_rate,
        "tax_file_number": data.tax_file_number,
        "superannuation_rate": data.superannuation_rate,
        "state": data.state,
        "retirement_rate": data.retirement_rate,
        "leave_balances": data.leave_balances or {},
        "bank_details": data.bank_details or {},
        "jurisdiction": data.jurisdiction,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _employees[eid] = employee
    return employee


@router.get("/employees/{employee_id}")
async def get_employee(
    employee_id: str,
    user: User = Depends(get_current_user),
):
    """Get a single employee by ID."""
    _seed_demo_data()

    emp = _employees.get(employee_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp


@router.put("/employees/{employee_id}")
async def update_employee(
    employee_id: str,
    data: EmployeeUpdate,
    user: User = Depends(get_current_user),
):
    """Update an existing employee."""
    _seed_demo_data()

    emp = _employees.get(employee_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    updates = data.model_dump(exclude_unset=True)
    for key, value in updates.items():
        if value is not None:
            emp[key] = value

    return emp


# ---------------------------------------------------------------------------
# Pay run endpoints
# ---------------------------------------------------------------------------

@router.get("/pay-runs")
async def list_pay_runs(
    status_filter: str | None = None,
    user: User = Depends(get_current_user),
):
    """List all pay runs, optionally filtered by status."""
    _seed_demo_data()

    results = list(_pay_runs.values())
    if status_filter:
        results = [r for r in results if r["status"] == status_filter]

    results.sort(key=lambda r: r["pay_period_end"], reverse=True)
    return {"pay_runs": results, "total": len(results)}


@router.post("/pay-runs", status_code=status.HTTP_201_CREATED)
async def create_pay_run(
    data: PayRunCreate,
    user: User = Depends(get_current_user),
):
    """Create a new draft pay run."""
    _seed_demo_data()

    run_id = str(uuid.uuid4())
    pay_run = {
        "id": run_id,
        "entity_id": data.entity_id or "default",
        "pay_period_start": data.pay_period_start,
        "pay_period_end": data.pay_period_end,
        "status": "draft",
        "total_gross": 0,
        "total_tax": 0,
        "total_super": 0,
        "total_net": 0,
        "approved_by": None,
        "approved_at": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _pay_runs[run_id] = pay_run
    return pay_run


@router.get("/pay-runs/{run_id}")
async def get_pay_run(
    run_id: str,
    user: User = Depends(get_current_user),
):
    """Get a pay run with all its payslips."""
    _seed_demo_data()

    run = _pay_runs.get(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Pay run not found")

    slips = [s for s in _payslips.values() if s["pay_run_id"] == run_id]
    return {**run, "payslips": slips}


@router.post("/pay-runs/{run_id}/process")
async def process_pay_run(
    run_id: str,
    user: User = Depends(get_current_user),
):
    """Process a draft pay run — calculate all payslips for active employees."""
    _seed_demo_data()

    run = _pay_runs.get(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Pay run not found")
    if run["status"] not in ("draft", "processing"):
        raise HTTPException(status_code=400, detail=f"Cannot process a pay run with status '{run['status']}'")

    run["status"] = "processing"

    # Remove old payslips for this run
    for sid in list(_payslips.keys()):
        if _payslips[sid]["pay_run_id"] == run_id:
            del _payslips[sid]

    active_employees = [e for e in _employees.values() if e["is_active"]]
    total_gross = Decimal("0")
    total_tax = Decimal("0")
    total_super = Decimal("0")
    total_net = Decimal("0")
    generated_slips = []

    for emp in active_employees:
        # Determine period gross pay
        freq = emp["pay_frequency"]
        if emp["base_salary"]:
            periods = {"weekly": 52, "fortnightly": 26, "monthly": 12}
            period_gross = Decimal(str(emp["base_salary"])) / periods.get(freq, 12)
        elif emp["hourly_rate"]:
            hours = {"weekly": 38, "fortnightly": 76, "monthly": 164.67}
            period_gross = Decimal(str(emp["hourly_rate"])) * Decimal(str(hours.get(freq, 164.67)))
        else:
            continue

        period_gross = period_gross.quantize(Decimal("0.01"))

        calc = calculate_pay(
            jurisdiction=emp["jurisdiction"],
            gross_period=period_gross,
            frequency=freq,
            super_rate=emp.get("superannuation_rate"),
            state=emp.get("state"),
            retirement_rate=emp.get("retirement_rate"),
        )

        # Accrue leave
        new_balances = accrue_leave(
            emp["jurisdiction"],
            freq,
            emp.get("leave_balances"),
        )
        emp["leave_balances"] = new_balances

        slip_id = str(uuid.uuid4())
        slip = {
            "id": slip_id,
            "pay_run_id": run_id,
            "employee_id": emp["id"],
            "employee_name": emp["full_name"],
            "employee_code": emp["employee_code"],
            "jurisdiction": emp["jurisdiction"],
            "hours_worked": float({"weekly": 38, "fortnightly": 76, "monthly": 164.67}.get(freq, 164.67)),
            "gross_pay": float(calc.gross_pay),
            "tax_withheld": float(calc.tax_withheld),
            "super_contribution": float(calc.super_contribution),
            "net_pay": float(calc.net_pay),
            "deductions": {},
            "allowances": {},
            "leave_taken": {},
            "ytd_gross": float(calc.gross_pay * 6),
            "ytd_tax": float(calc.tax_withheld * 6),
            "breakdown": calc.breakdown,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        # Convert Decimal values in breakdown to float for JSON serialization
        slip["breakdown"] = {k: float(v) if isinstance(v, Decimal) else v for k, v in calc.breakdown.items()}

        _payslips[slip_id] = slip
        generated_slips.append(slip)

        total_gross += calc.gross_pay
        total_tax += calc.tax_withheld
        total_super += calc.super_contribution
        total_net += calc.net_pay

    run["total_gross"] = float(total_gross.quantize(Decimal("0.01")))
    run["total_tax"] = float(total_tax.quantize(Decimal("0.01")))
    run["total_super"] = float(total_super.quantize(Decimal("0.01")))
    run["total_net"] = float(total_net.quantize(Decimal("0.01")))
    run["status"] = "processing"

    return {
        **run,
        "payslips": generated_slips,
        "employees_processed": len(generated_slips),
    }


@router.post("/pay-runs/{run_id}/approve")
async def approve_pay_run(
    run_id: str,
    user: User = Depends(get_current_user),
):
    """Approve a processed pay run, moving it to 'approved' status."""
    _seed_demo_data()

    run = _pay_runs.get(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Pay run not found")
    if run["status"] not in ("processing",):
        raise HTTPException(
            status_code=400,
            detail=f"Only 'processing' pay runs can be approved (current: '{run['status']}')",
        )

    run["status"] = "approved"
    run["approved_by"] = str(user.id) if hasattr(user, "id") else "system"
    run["approved_at"] = datetime.now(timezone.utc).isoformat()

    return run


# ---------------------------------------------------------------------------
# Payslip endpoints
# ---------------------------------------------------------------------------

@router.get("/payslips/{slip_id}")
async def get_payslip(
    slip_id: str,
    user: User = Depends(get_current_user),
):
    """Get a single payslip by ID."""
    _seed_demo_data()

    slip = _payslips.get(slip_id)
    if not slip:
        raise HTTPException(status_code=404, detail="Payslip not found")
    return slip


# ---------------------------------------------------------------------------
# Leave management
# ---------------------------------------------------------------------------

@router.get("/leave/{employee_id}")
async def get_leave_balances(
    employee_id: str,
    user: User = Depends(get_current_user),
):
    """Get current leave balances for an employee."""
    _seed_demo_data()

    emp = _employees.get(employee_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    return {
        "employee_id": employee_id,
        "employee_name": emp["full_name"],
        "jurisdiction": emp["jurisdiction"],
        "balances": emp.get("leave_balances", {}),
    }


@router.post("/leave/{employee_id}/request")
async def request_leave(
    employee_id: str,
    data: LeaveRequest,
    user: User = Depends(get_current_user),
):
    """Request leave for an employee — deducts from balance if sufficient."""
    _seed_demo_data()

    emp = _employees.get(employee_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    balances = emp.get("leave_balances", {})
    current = balances.get(data.leave_type, 0)

    if current < data.hours:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient {data.leave_type} leave balance. Available: {current}h, requested: {data.hours}h",
        )

    balances[data.leave_type] = round(current - data.hours, 2)
    emp["leave_balances"] = balances

    return {
        "status": "approved",
        "employee_id": employee_id,
        "leave_type": data.leave_type,
        "hours_deducted": data.hours,
        "remaining_balance": balances[data.leave_type],
        "period": {"start": data.start_date, "end": data.end_date},
        "reason": data.reason,
    }


# ---------------------------------------------------------------------------
# Summary endpoint
# ---------------------------------------------------------------------------

@router.get("/us-states")
async def list_us_states(user: User = Depends(get_current_user)):
    """List all US states with their income tax type and rate."""
    from app.payroll.state_taxes import get_all_states
    return {"states": get_all_states()}


@router.get("/summary")
async def payroll_summary(user: User = Depends(get_current_user)):
    """Aggregate payroll stats for dashboard cards."""
    _seed_demo_data()

    active = [e for e in _employees.values() if e["is_active"]]
    runs = list(_pay_runs.values())
    latest_run = max(runs, key=lambda r: r["pay_period_end"]) if runs else None

    total_annual_cost = sum(
        e.get("base_salary") or (e.get("hourly_rate", 0) * 2080)
        for e in active
    )
    ytd_gross = sum(r["total_gross"] for r in runs if r["status"] in ("approved", "paid"))

    return {
        "total_employees": len(active),
        "inactive_employees": len([e for e in _employees.values() if not e["is_active"]]),
        "total_annual_cost": round(total_annual_cost, 2),
        "ytd_gross_paid": round(ytd_gross, 2),
        "next_pay_run": latest_run["pay_period_end"] if latest_run and latest_run["status"] == "draft" else None,
        "pending_runs": len([r for r in runs if r["status"] in ("draft", "processing")]),
        "jurisdictions": list(set(e["jurisdiction"] for e in active)),
    }

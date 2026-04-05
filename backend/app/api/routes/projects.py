"""Project Management API — budgets, tasks, milestones, profitability tracking."""

from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.auth.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/projects", tags=["Project Management"])

# Data store — persisted in-memory for single-instance deployments.
_projects: dict[str, dict] = {}


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    client: str = Field(..., min_length=1)
    description: str = ""
    budget: float = Field(0, ge=0)
    hourly_rate: float = Field(200, ge=0)
    billing_type: str = Field("hourly", pattern="^(fixed|hourly|milestone)$")
    start_date: str = ""
    due_date: str = ""
    team_members: list[str] = []
    template: str = ""


class ProjectUpdate(BaseModel):
    name: str | None = None
    client: str | None = None
    description: str | None = None
    budget: float | None = None
    hourly_rate: float | None = None
    billing_type: str | None = None
    start_date: str | None = None
    due_date: str | None = None
    status: str | None = None
    team_members: list[str] | None = None


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1)
    assignee: str = ""
    priority: str = "medium"
    due: str = ""
    estimated_hours: float = 0
    description: str = ""
    subtasks: list[str] = []


class TaskUpdate(BaseModel):
    title: str | None = None
    assignee: str | None = None
    priority: str | None = None
    status: str | None = None
    due: str | None = None
    hours: float | None = None
    estimated_hours: float | None = None
    description: str | None = None


class MilestoneCreate(BaseModel):
    name: str = Field(..., min_length=1)
    due: str = ""


class CommentCreate(BaseModel):
    text: str = Field(..., min_length=1)
    author: str = ""


@router.get("/")
async def list_projects(
    status: str | None = None,
    client: str | None = None,
    search: str | None = None,
    user: User = Depends(get_current_user),
):
    """List all projects, optionally filtered by status, client, or search term."""
    projects = list(_projects.values())
    if status:
        projects = [p for p in projects if p["status"] == status]
    if client:
        projects = [p for p in projects if p["client"].lower() == client.lower()]
    if search:
        q = search.lower()
        projects = [p for p in projects if q in p["name"].lower() or q in p["client"].lower()]
    return {"projects": projects, "total": len(projects)}


@router.post("/", status_code=201)
async def create_project(req: ProjectCreate, user: User = Depends(get_current_user)):
    """Create a new project."""
    project = {
        "id": str(uuid4()),
        "name": req.name,
        "client": req.client,
        "description": req.description,
        "budget": req.budget,
        "hourly_rate": req.hourly_rate,
        "billing_type": req.billing_type,
        "start_date": req.start_date,
        "due_date": req.due_date,
        "status": "planning",
        "spent": 0,
        "billable_hours": 0,
        "non_billable_hours": 0,
        "revenue": 0,
        "team_members": req.team_members,
        "tasks": [],
        "milestones": [],
        "comments": [],
        "template": req.template,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": str(user.id),
    }
    _projects[project["id"]] = project
    return project


@router.get("/{project_id}")
async def get_project(project_id: str, user: User = Depends(get_current_user)):
    """Get a single project by ID."""
    project = _projects.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.put("/{project_id}")
async def update_project(project_id: str, req: ProjectUpdate, user: User = Depends(get_current_user)):
    """Update a project's details."""
    project = _projects.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    update_data = req.model_dump(exclude_none=True)
    if "status" in update_data:
        valid = {"planning", "active", "on_hold", "completed", "cancelled"}
        if update_data["status"] not in valid:
            raise HTTPException(status_code=400, detail=f"Status must be one of: {', '.join(valid)}")
    project.update(update_data)
    return project


@router.delete("/{project_id}", status_code=204)
async def delete_project(project_id: str, user: User = Depends(get_current_user)):
    """Delete a project."""
    if project_id not in _projects:
        raise HTTPException(status_code=404, detail="Project not found")
    del _projects[project_id]
    return None


@router.patch("/{project_id}/status")
async def update_project_status(project_id: str, data: dict, user: User = Depends(get_current_user)):
    """Update project status (planning, active, on_hold, completed, cancelled)."""
    project = _projects.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    new_status = data.get("status")
    valid = {"planning", "active", "on_hold", "completed", "cancelled"}
    if new_status not in valid:
        raise HTTPException(status_code=400, detail=f"Status must be one of: {', '.join(valid)}")
    project["status"] = new_status
    return project


@router.post("/{project_id}/tasks", status_code=201)
async def add_task(project_id: str, req: TaskCreate, user: User = Depends(get_current_user)):
    """Add a task to a project."""
    project = _projects.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    task = {
        "id": str(uuid4()),
        "title": req.title,
        "assignee": req.assignee,
        "priority": req.priority,
        "status": "todo",
        "hours": 0,
        "estimated_hours": req.estimated_hours,
        "due": req.due,
        "description": req.description,
        "subtasks": [{"id": str(uuid4()), "text": s, "done": False} for s in req.subtasks],
        "comments": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    project["tasks"].append(task)
    return task


@router.put("/{project_id}/tasks/{task_id}")
async def update_task(project_id: str, task_id: str, req: TaskUpdate, user: User = Depends(get_current_user)):
    """Update a task's fields."""
    project = _projects.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    task = next((t for t in project["tasks"] if t["id"] == task_id), None)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    update_data = req.model_dump(exclude_none=True)
    if "status" in update_data:
        valid = {"todo", "in_progress", "review", "done"}
        if update_data["status"] not in valid:
            raise HTTPException(status_code=400, detail=f"Task status must be one of: {', '.join(valid)}")
    task.update(update_data)
    return task


@router.delete("/{project_id}/tasks/{task_id}", status_code=204)
async def delete_task(project_id: str, task_id: str, user: User = Depends(get_current_user)):
    """Delete a task from a project."""
    project = _projects.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project["tasks"] = [t for t in project["tasks"] if t["id"] != task_id]
    return None


@router.post("/{project_id}/milestones", status_code=201)
async def add_milestone(project_id: str, req: MilestoneCreate, user: User = Depends(get_current_user)):
    """Add a milestone to a project."""
    project = _projects.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    milestone = {
        "id": str(uuid4()),
        "name": req.name,
        "due": req.due,
        "done": False,
    }
    project["milestones"].append(milestone)
    return milestone


@router.patch("/{project_id}/milestones/{milestone_id}")
async def toggle_milestone(project_id: str, milestone_id: str, user: User = Depends(get_current_user)):
    """Toggle a milestone's completion status."""
    project = _projects.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    ms = next((m for m in project["milestones"] if m["id"] == milestone_id), None)
    if not ms:
        raise HTTPException(status_code=404, detail="Milestone not found")
    ms["done"] = not ms["done"]
    return ms


@router.post("/{project_id}/tasks/{task_id}/comments", status_code=201)
async def add_task_comment(
    project_id: str, task_id: str, req: CommentCreate, user: User = Depends(get_current_user)
):
    """Add a comment to a task."""
    project = _projects.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    task = next((t for t in project["tasks"] if t["id"] == task_id), None)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    comment = {
        "id": str(uuid4()),
        "text": req.text,
        "author": req.author or str(user.id),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    task.setdefault("comments", []).append(comment)
    return comment


@router.get("/{project_id}/profitability")
async def get_profitability(project_id: str, user: User = Depends(get_current_user)):
    """Get profitability breakdown for a project."""
    project = _projects.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    revenue = project["revenue"]
    costs = project["spent"]
    profit = revenue - costs
    margin = round((profit / revenue) * 100, 1) if revenue else 0
    budget_remaining = project["budget"] - costs
    budget_utilisation = round((costs / project["budget"]) * 100, 1) if project["budget"] else 0
    effective_rate = round(revenue / project["billable_hours"], 2) if project["billable_hours"] else 0

    # Monthly burn data for chart
    burn_data = []
    total = 0
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
    monthly_cost = costs / max(len(months), 1)
    monthly_rev = revenue / max(len(months), 1)
    for i, m in enumerate(months):
        total += monthly_cost
        burn_data.append({
            "month": m,
            "costs": round(total, 2),
            "revenue": round(monthly_rev * (i + 1), 2),
            "budget": project["budget"],
        })

    return {
        "revenue": revenue,
        "costs": costs,
        "profit": profit,
        "margin": margin,
        "budget_remaining": budget_remaining,
        "budget_utilisation": budget_utilisation,
        "effective_rate": effective_rate,
        "billable_hours": project["billable_hours"],
        "non_billable_hours": project["non_billable_hours"],
        "burn_data": burn_data,
    }


@router.get("/summary/all")
async def projects_summary(user: User = Depends(get_current_user)):
    """Get aggregate project statistics."""
    projects = list(_projects.values())
    total_revenue = sum(p["revenue"] for p in projects)
    total_spent = sum(p["spent"] for p in projects)

    # Team utilisation
    team_hours = {}
    for p in projects:
        for t in p.get("tasks", []):
            assignee = t.get("assignee", "Unassigned")
            if assignee:
                team_hours.setdefault(assignee, {"billable": 0, "total": 0})
                team_hours[assignee]["billable"] += t.get("hours", 0)
                team_hours[assignee]["total"] += t.get("hours", 0) + t.get("estimated_hours", 0)

    return {
        "total": len(projects),
        "active": sum(1 for p in projects if p["status"] == "active"),
        "completed": sum(1 for p in projects if p["status"] == "completed"),
        "on_hold": sum(1 for p in projects if p["status"] == "on_hold"),
        "overdue": sum(
            1 for p in projects
            if p.get("due_date") and p["status"] not in ("completed", "cancelled")
            and p["due_date"] < datetime.now(timezone.utc).strftime("%Y-%m-%d")
        ),
        "total_budget": sum(p["budget"] for p in projects),
        "total_spent": total_spent,
        "total_revenue": total_revenue,
        "total_profit": total_revenue - total_spent,
        "total_hours": sum(p["billable_hours"] for p in projects),
        "avg_margin": round(
            ((total_revenue - total_spent) / total_revenue * 100) if total_revenue else 0, 1
        ),
        "team_utilisation": team_hours,
    }

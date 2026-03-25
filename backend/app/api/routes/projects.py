"""Project Management API — budgets, tasks, milestones, profitability tracking."""

from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
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
    start_date: str = ""
    due_date: str = ""


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1)
    assignee: str = ""
    priority: str = "medium"
    due: str = ""


class TaskStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(todo|in_progress|review|done)$")


@router.get("/")
async def list_projects(status: str | None = None, user: User = Depends(get_current_user)):
    """List all projects, optionally filtered by status."""
    projects = list(_projects.values())
    if status:
        projects = [p for p in projects if p["status"] == status]
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
        "start_date": req.start_date,
        "due_date": req.due_date,
        "status": "planning",
        "spent": 0,
        "billable_hours": 0,
        "non_billable_hours": 0,
        "revenue": 0,
        "tasks": [],
        "milestones": [],
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
        "due": req.due,
    }
    project["tasks"].append(task)
    return task


@router.patch("/{project_id}/tasks/{task_id}")
async def update_task_status(project_id: str, task_id: str, req: TaskStatusUpdate, user: User = Depends(get_current_user)):
    """Update a task's status."""
    project = _projects.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    task = next((t for t in project["tasks"] if t["id"] == task_id), None)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task["status"] = req.status
    return task


@router.get("/summary/all")
async def projects_summary(user: User = Depends(get_current_user)):
    """Get aggregate project statistics."""
    projects = list(_projects.values())
    return {
        "total": len(projects),
        "active": sum(1 for p in projects if p["status"] == "active"),
        "total_budget": sum(p["budget"] for p in projects),
        "total_spent": sum(p["spent"] for p in projects),
        "total_revenue": sum(p["revenue"] for p in projects),
        "total_hours": sum(p["billable_hours"] for p in projects),
    }

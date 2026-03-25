"""Company Incorporation API — automated business formation across AU, NZ, GB, US."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.auth.dependencies import get_current_user
from app.models.user import User
from app.incorporation.engine import IncorporationEngine

router = APIRouter(prefix="/incorporation", tags=["Company Incorporation"])
engine = IncorporationEngine()

# Application store — persisted in-memory for single-instance deployments.
_applications: dict[str, dict] = {}


class IncorporationApplicationCreate(BaseModel):
    jurisdiction: str = Field(..., description="AU, NZ, GB, or US")
    structure_code: str = Field(..., description="Company structure code")
    company_name: str = Field(..., min_length=3, max_length=255)
    trading_name: str | None = None
    principal_activity: str = ""
    directors: list[dict] = Field(default_factory=list)
    shareholders: list[dict] = Field(default_factory=list)
    secretary: dict | None = None
    registered_address: dict = Field(default_factory=dict)
    principal_address: dict | None = None
    state_of_formation: str | None = None
    registered_agent: str | None = None
    share_capital: dict | None = None
    financial_year_end: str | None = None


@router.get("/jurisdictions")
async def list_jurisdictions(user: User = Depends(get_current_user)):
    """List all supported jurisdictions with their company structures."""
    result = {}
    for code in ["AU", "NZ", "GB", "US"]:
        info = engine.get_jurisdiction_info(code)
        result[code] = {
            "name": info["name"],
            "authority": info["authority"],
            "structures": [
                {
                    "code": s["code"],
                    "name": s["name"],
                    "description": s["description"],
                    "min_directors": s["min_directors"],
                    "requires_resident_director": s["requires_resident_director"],
                    "filing_fee": float(s["filing_fee"]),
                }
                for s in info["structures"]
            ],
            "registrations": info["registrations"],
            "states": info.get("states", []),
        }
    return {"jurisdictions": result}


@router.get("/structures/{jurisdiction}")
async def get_structures(jurisdiction: str, user: User = Depends(get_current_user)):
    """Get available company structures for a jurisdiction."""
    try:
        structures = engine.get_structures(jurisdiction)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"structures": [{**s, "filing_fee": float(s["filing_fee"]), "annual_review_fee": float(s["annual_review_fee"])} for s in structures]}


@router.get("/costs/{jurisdiction}/{structure_code}")
async def estimate_costs(
    jurisdiction: str,
    structure_code: str,
    state: str | None = None,
    user: User = Depends(get_current_user),
):
    """Estimate incorporation costs for a given jurisdiction and structure."""
    try:
        costs = engine.estimate_costs(jurisdiction, structure_code, state)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return costs


@router.post("/validate")
async def validate_application(
    data: IncorporationApplicationCreate,
    user: User = Depends(get_current_user),
):
    """Validate an incorporation application without creating it."""
    result = engine.validate_application(data.model_dump())
    return result


@router.post("/applications", status_code=status.HTTP_201_CREATED)
async def create_application(
    data: IncorporationApplicationCreate,
    user: User = Depends(get_current_user),
):
    """Create a new company incorporation application."""
    user_id = str(user.id) if hasattr(user, "id") else "system"
    result = engine.create_application(data.model_dump(), user_id)

    if not result["success"]:
        raise HTTPException(status_code=422, detail=result["errors"])

    app = result["application"]
    _applications[app["id"]] = app

    # Generate documents
    app["documents"] = engine.generate_documents(app)

    return app


@router.get("/applications")
async def list_applications(user: User = Depends(get_current_user)):
    """List all incorporation applications."""
    apps = sorted(_applications.values(), key=lambda a: a["created_at"], reverse=True)
    return {"applications": apps, "total": len(apps)}


@router.get("/applications/{app_id}")
async def get_application(app_id: str, user: User = Depends(get_current_user)):
    """Get a single incorporation application."""
    app = _applications.get(app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app


@router.post("/applications/{app_id}/submit")
async def submit_application(app_id: str, user: User = Depends(get_current_user)):
    """Submit an application for processing."""
    app = _applications.get(app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if app["status"] != "draft":
        raise HTTPException(status_code=400, detail=f"Cannot submit application with status '{app['status']}'")

    # Validate before submission
    validation = engine.validate_application(app)
    if not validation["valid"]:
        raise HTTPException(status_code=422, detail=validation["errors"])

    updated = engine.submit_application(app)
    _applications[app_id] = updated
    return updated


@router.get("/applications/{app_id}/documents")
async def get_documents(app_id: str, user: User = Depends(get_current_user)):
    """Get documents generated for an application."""
    app = _applications.get(app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    if "documents" not in app:
        app["documents"] = engine.generate_documents(app)

    return {"documents": app["documents"]}


@router.post("/applications/{app_id}/registrations/{reg_code}/complete")
async def complete_registration(
    app_id: str,
    reg_code: str,
    reference_number: str | None = None,
    user: User = Depends(get_current_user),
):
    """Mark a registration step as completed."""
    app = _applications.get(app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    from datetime import datetime, timezone
    for step in app.get("filing_steps", []):
        if step["registration"] == reg_code:
            step["status"] = "completed"
            step["reference_number"] = reference_number
            step["completed_at"] = datetime.now(timezone.utc).isoformat()
            break
    else:
        # Check registrations list
        for reg in app.get("registrations", []):
            if reg["code"] == reg_code:
                reg["status"] = "completed"
                break
        else:
            raise HTTPException(status_code=404, detail=f"Registration '{reg_code}' not found")

    # Check if all mandatory registrations are done
    all_done = all(
        r["status"] == "completed"
        for r in app.get("registrations", [])
        if r["mandatory"]
    )
    if all_done and app.get("filing_steps"):
        all_filed = all(s["status"] == "completed" for s in app["filing_steps"])
        if all_filed:
            app["status"] = "completed"
            app["completed_at"] = datetime.now(timezone.utc).isoformat()

    return app

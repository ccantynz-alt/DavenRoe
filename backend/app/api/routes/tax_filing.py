"""Tax Filing API routes.

Generate, validate, and lodge tax returns across AU, NZ, GB, and US jurisdictions.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.auth.dependencies import get_current_user
from app.models.user import User
from app.tax_engine.returns import TaxReturnEngine

router = APIRouter(prefix="/tax/returns", tags=["Tax Filing"])

engine = TaxReturnEngine()


# ── Schemas ─────────────────────────────────────────────────────

class GenerateReturnRequest(BaseModel):
    return_type: str = Field(
        ...,
        description="Return type: BAS, GST_NZ, VAT_UK, or SALES_TAX_US",
        pattern="^(BAS|GST_NZ|VAT_UK|SALES_TAX_US)$",
    )
    period: str = Field(
        ...,
        description="Period: Q1–Q4, M01–M12, or FY",
        pattern="^(Q[1-4]|M(0[1-9]|1[0-2])|FY)$",
    )
    year: int = Field(..., ge=2020, le=2030, description="Tax year")
    entity_id: str | None = Field(None, description="Optional entity ID")
    data: dict | None = Field(None, description="Override data for line items")


# ── Routes ──────────────────────────────────────────────────────

@router.post("/generate")
async def generate_return(
    req: GenerateReturnRequest,
    user: User = Depends(get_current_user),
):
    """Generate a tax return for the given jurisdiction and period."""
    try:
        tax_return = engine.generate(
            return_type=req.return_type,
            period=req.period,
            year=req.year,
            entity_id=req.entity_id,
            data=req.data,
        )
        return tax_return.to_dict()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/")
async def list_returns(
    return_type: str | None = None,
    status: str | None = None,
    entity_id: str | None = None,
    user: User = Depends(get_current_user),
):
    """List generated tax returns with optional filters."""
    returns = engine.list_returns(
        return_type=return_type,
        status=status,
        entity_id=entity_id,
    )
    return {
        "returns": [r.to_dict() for r in returns],
        "total": len(returns),
    }


@router.get("/deadlines")
async def get_deadlines(
    jurisdiction: str | None = None,
    user: User = Depends(get_current_user),
):
    """Get upcoming filing deadlines for all or a specific jurisdiction."""
    return {"deadlines": engine.get_deadlines(jurisdiction=jurisdiction)}


@router.get("/{return_id}")
async def get_return(
    return_id: str,
    user: User = Depends(get_current_user),
):
    """Get a specific tax return by ID."""
    tax_return = engine.get(return_id)
    if not tax_return:
        raise HTTPException(status_code=404, detail="Tax return not found")
    return tax_return.to_dict()


@router.post("/{return_id}/validate")
async def validate_return(
    return_id: str,
    user: User = Depends(get_current_user),
):
    """Run pre-submission validation checks on a tax return."""
    tax_return = engine.get(return_id)
    if not tax_return:
        raise HTTPException(status_code=404, detail="Tax return not found")

    results = engine.validate(return_id)
    return {
        "return_id": return_id,
        "status": tax_return.status.value,
        "validations": [v.to_dict() for v in results],
        "pass_count": sum(1 for v in results if v.severity.value == "pass"),
        "warning_count": sum(1 for v in results if v.severity.value == "warning"),
        "fail_count": sum(1 for v in results if v.severity.value == "fail"),
    }


@router.post("/{return_id}/lodge")
async def lodge_return(
    return_id: str,
    user: User = Depends(get_current_user),
):
    """Mark a tax return as lodged (e-filing readiness)."""
    tax_return = engine.lodge(return_id)
    if not tax_return:
        raise HTTPException(status_code=404, detail="Tax return not found")

    if tax_return.status.value != "lodged":
        fail_count = sum(
            1 for v in tax_return.validations if v.severity.value == "fail"
        )
        raise HTTPException(
            status_code=422,
            detail=f"Cannot lodge: {fail_count} validation failure(s) must be resolved first.",
        )

    return {
        "return_id": return_id,
        "status": tax_return.status.value,
        "lodged_at": tax_return.lodged_at.isoformat() if tax_return.lodged_at else None,
        "message": "Return marked as lodged and ready for e-filing submission.",
    }

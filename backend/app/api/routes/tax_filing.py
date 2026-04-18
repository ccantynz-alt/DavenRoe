"""Tax Filing API routes — wired to PostgreSQL.

Generate, validate, and lodge tax returns across AU, NZ, GB, and US.
Returns persist to the TaxReturn model. Falls back to in-memory engine
if database is unavailable.
"""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select

from app.auth.dependencies import get_current_user
from app.core.database import get_db
from app.models.document import TaxReturn
from app.models.user import User
from app.tax_engine.returns import TaxReturnEngine

router = APIRouter(prefix="/tax/returns", tags=["Tax Filing"])
_fallback_engine = TaxReturnEngine()


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


_JURISDICTION_MAP = {
    "BAS": "AU", "GST_NZ": "NZ", "VAT_UK": "GB", "SALES_TAX_US": "US",
}

_PERIOD_DATES = {
    "Q1": ("01-01", "03-31"), "Q2": ("04-01", "06-30"),
    "Q3": ("07-01", "09-30"), "Q4": ("10-01", "12-31"),
    "FY": ("01-01", "12-31"),
}


def _tax_return_to_dict(r: TaxReturn) -> dict:
    return {
        "id": str(r.id),
        "entity_id": r.entity_id,
        "return_type": r.return_type,
        "jurisdiction": r.jurisdiction,
        "period_start": r.period_start,
        "period_end": r.period_end,
        "status": r.status,
        "total_revenue": r.total_revenue,
        "total_tax": r.total_tax,
        "data": r.data or {},
        "validation_results": r.validation_results,
        "lodged_at": r.lodged_at.isoformat() if r.lodged_at else None,
        "lodged_reference": r.lodged_reference,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }


@router.post("/generate")
async def generate_return(req: GenerateReturnRequest, user: User = Depends(get_current_user)):
    # Use the in-memory engine for generation logic (tax calcs)
    try:
        mem_return = _fallback_engine.generate(
            return_type=req.return_type, period=req.period,
            year=req.year, entity_id=req.entity_id, data=req.data,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    mem_dict = mem_return.to_dict()
    jurisdiction = _JURISDICTION_MAP.get(req.return_type, "AU")
    period_start_suffix, period_end_suffix = _PERIOD_DATES.get(req.period, ("01-01", "12-31"))

    db_return = TaxReturn(
        entity_id=req.entity_id or "",
        return_type=req.return_type,
        jurisdiction=jurisdiction,
        period_start=f"{req.year}-{period_start_suffix}",
        period_end=f"{req.year}-{period_end_suffix}",
        status="draft",
        total_revenue=str(mem_dict.get("total_revenue") or mem_dict.get("total_sales", "0")),
        total_tax=str(mem_dict.get("total_tax") or mem_dict.get("tax_payable", "0")),
        data=mem_dict,
    )

    try:
        async for db in get_db():
            db.add(db_return)
            await db.flush()
            result = _tax_return_to_dict(db_return)
            result["line_items"] = mem_dict.get("line_items", [])
            return result
    except Exception:
        return mem_dict


@router.get("/")
async def list_returns(
    return_type: str | None = None, status: str | None = None,
    entity_id: str | None = None, user: User = Depends(get_current_user),
):
    try:
        async for db in get_db():
            stmt = select(TaxReturn).order_by(TaxReturn.created_at.desc())
            if return_type:
                stmt = stmt.where(TaxReturn.return_type == return_type)
            if status:
                stmt = stmt.where(TaxReturn.status == status)
            if entity_id:
                stmt = stmt.where(TaxReturn.entity_id == entity_id)
            result = await db.execute(stmt)
            returns = result.scalars().all()
            if returns:
                return {"returns": [_tax_return_to_dict(r) for r in returns], "total": len(returns)}
    except Exception:
        pass
    returns = _fallback_engine.list_returns(return_type=return_type, status=status, entity_id=entity_id)
    return {"returns": [r.to_dict() for r in returns], "total": len(returns)}


@router.get("/deadlines")
async def get_deadlines(jurisdiction: str | None = None, user: User = Depends(get_current_user)):
    return {"deadlines": _fallback_engine.get_deadlines(jurisdiction=jurisdiction)}


@router.get("/{return_id}")
async def get_return(return_id: str, user: User = Depends(get_current_user)):
    try:
        async for db in get_db():
            stmt = select(TaxReturn).where(TaxReturn.id == uuid.UUID(return_id))
            result = await db.execute(stmt)
            ret = result.scalar_one_or_none()
            if ret:
                return _tax_return_to_dict(ret)
    except Exception:
        pass
    ret = _fallback_engine.get(return_id)
    if not ret:
        raise HTTPException(status_code=404, detail="Tax return not found")
    return ret.to_dict()


@router.post("/{return_id}/validate")
async def validate_return(return_id: str, user: User = Depends(get_current_user)):
    # Validation logic stays in engine (pure calc, no DB needed)
    try:
        async for db in get_db():
            stmt = select(TaxReturn).where(TaxReturn.id == uuid.UUID(return_id))
            result = await db.execute(stmt)
            ret = result.scalar_one_or_none()
            if ret:
                # Run validation against the stored data
                validations = _fallback_engine._validate_return_data(ret.return_type, ret.data or {})
                ret.validation_results = validations
                ret.status = "validated" if all(v.get("severity") != "fail" for v in validations) else "draft"
                await db.flush()
                return {
                    "return_id": return_id,
                    "status": ret.status,
                    "validations": validations,
                    "pass_count": sum(1 for v in validations if v.get("severity") == "pass"),
                    "warning_count": sum(1 for v in validations if v.get("severity") == "warning"),
                    "fail_count": sum(1 for v in validations if v.get("severity") == "fail"),
                }
    except Exception:
        pass

    mem_ret = _fallback_engine.get(return_id)
    if not mem_ret:
        raise HTTPException(status_code=404, detail="Tax return not found")
    results = _fallback_engine.validate(return_id)
    return {
        "return_id": return_id,
        "status": mem_ret.status.value,
        "validations": [v.to_dict() for v in results],
        "pass_count": sum(1 for v in results if v.severity.value == "pass"),
        "warning_count": sum(1 for v in results if v.severity.value == "warning"),
        "fail_count": sum(1 for v in results if v.severity.value == "fail"),
    }


@router.post("/{return_id}/lodge")
async def lodge_return(return_id: str, user: User = Depends(get_current_user)):
    try:
        async for db in get_db():
            stmt = select(TaxReturn).where(TaxReturn.id == uuid.UUID(return_id))
            result = await db.execute(stmt)
            ret = result.scalar_one_or_none()
            if ret:
                if ret.validation_results:
                    fails = [v for v in ret.validation_results if v.get("severity") == "fail"]
                    if fails:
                        raise HTTPException(status_code=422, detail=f"Cannot lodge: {len(fails)} validation failure(s)")
                ret.status = "lodged"
                ret.lodged_at = datetime.now(timezone.utc)
                ret.lodged_reference = f"{ret.jurisdiction}-{ret.return_type}-{uuid.uuid4().hex[:8].upper()}"
                await db.flush()
                return {
                    "return_id": return_id,
                    "status": ret.status,
                    "lodged_at": ret.lodged_at.isoformat(),
                    "lodged_reference": ret.lodged_reference,
                    "message": "Return marked as lodged and ready for e-filing submission.",
                }
    except HTTPException:
        raise
    except Exception:
        pass

    mem_ret = _fallback_engine.lodge(return_id)
    if not mem_ret:
        raise HTTPException(status_code=404, detail="Tax return not found")
    return {
        "return_id": return_id,
        "status": mem_ret.status.value,
        "lodged_at": mem_ret.lodged_at.isoformat() if mem_ret.lodged_at else None,
        "message": "Return marked as lodged and ready for e-filing submission.",
    }

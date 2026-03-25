"""Financial Health Score API — business wellness scoring and trend analysis."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, check_entity_access
from app.core.database import get_db
from app.models.user import User
from app.models.entity import Entity
from app.health_score.engine import FinancialHealthEngine

router = APIRouter(prefix="/financial-health", tags=["Financial Health Score"])
engine = FinancialHealthEngine()


@router.get("/score")
async def get_health_score(
    entity_id: str | None = Query(None, description="Entity UUID. Omit to use first active entity."),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the financial health score for an entity (0-100 composite)."""
    eid = await _resolve_entity(entity_id, user, db)
    score_data = await engine.calculate_score(eid, db)
    return score_data


@router.get("/trend")
async def get_health_trend(
    entity_id: str | None = Query(None),
    months: int = Query(6, ge=1, le=24),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get historical health score trend over N months."""
    eid = await _resolve_entity(entity_id, user, db)
    trend_data = await engine.get_trend(eid, months, db)
    return trend_data


@router.get("/summary")
async def get_health_summary(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get health scores for all accessible entities (overview)."""
    entities = await _get_accessible_entities(user, db)
    summaries = []
    for entity in entities:
        try:
            score = await engine.calculate_score(entity.id, db)
            summaries.append({
                "entity_id": str(entity.id),
                "entity_name": entity.name,
                "composite_score": score["composite_score"],
                "grade": score["grade"],
                "pillars": {k: v["score"] for k, v in score["pillars"].items()},
            })
        except (ValueError, TypeError, KeyError):
            summaries.append({
                "entity_id": str(entity.id),
                "entity_name": entity.name,
                "composite_score": None,
                "grade": "N/A",
                "pillars": {},
                "error": "Insufficient data",
            })
    return {"entities": summaries}


async def _resolve_entity(entity_id: str | None, user: User, db: AsyncSession) -> uuid.UUID:
    """Resolve entity_id parameter or default to first active entity."""
    if entity_id:
        eid = uuid.UUID(entity_id)
        if not check_entity_access(user, str(eid)):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No access to this entity")
        return eid

    # Default: first active entity the user can access
    query = select(Entity).where(Entity.is_active == True).limit(1)  # noqa: E712
    result = await db.execute(query)
    entity = result.scalar_one_or_none()
    if not entity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active entities found")
    return entity.id


async def _get_accessible_entities(user: User, db: AsyncSession) -> list:
    """Get all entities the user can access."""
    query = select(Entity).where(Entity.is_active == True)  # noqa: E712
    if user.role not in ("partner", "manager") and user.entity_access:
        entity_ids = [uuid.UUID(eid) for eid in user.entity_access]
        query = query.where(Entity.id.in_(entity_ids))
    result = await db.execute(query)
    return result.scalars().all()

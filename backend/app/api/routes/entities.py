"""Entity (business) management routes."""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.dependencies import get_current_user
from app.core.database import get_db
from app.models.entity import Entity, EntityJurisdiction
from app.models.user import User
from app.schemas.entity import EntityCreate, EntityOut, EntityUpdate

router = APIRouter(prefix="/entities", tags=["Entities"])


@router.post("/", response_model=EntityOut, status_code=201)
async def create_entity(data: EntityCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Create a new business entity with jurisdiction nexus."""
    entity = Entity(
        name=data.name,
        legal_name=data.legal_name,
        entity_type=data.entity_type,
        primary_currency=data.primary_currency,
        tax_id=data.tax_id,
        tax_id_type=data.tax_id_type,
        email=data.email,
        phone=data.phone,
        address=data.address,
    )

    for j in data.jurisdictions:
        entity.jurisdictions.append(EntityJurisdiction(
            jurisdiction_code=j.jurisdiction_code,
            tax_registration_id=j.tax_registration_id,
            is_primary=j.is_primary,
            nexus_type=j.nexus_type,
            effective_from=j.effective_from,
        ))

    db.add(entity)
    await db.flush()
    await db.refresh(entity, ["jurisdictions"])
    return entity


@router.get("/", response_model=list[EntityOut])
async def list_entities(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """List all entities."""
    result = await db.execute(
        select(Entity).options(selectinload(Entity.jurisdictions)).order_by(Entity.name)
    )
    return result.scalars().all()


@router.get("/{entity_id}", response_model=EntityOut)
async def get_entity(entity_id: uuid.UUID, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get a single entity by ID."""
    result = await db.execute(
        select(Entity).options(selectinload(Entity.jurisdictions)).where(Entity.id == entity_id)
    )
    entity = result.scalar_one_or_none()
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    return entity


@router.patch("/{entity_id}", response_model=EntityOut)
async def update_entity(entity_id: uuid.UUID, data: EntityUpdate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Update an entity."""
    result = await db.execute(
        select(Entity).options(selectinload(Entity.jurisdictions)).where(Entity.id == entity_id)
    )
    entity = result.scalar_one_or_none()
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(entity, field, value)

    await db.flush()
    await db.refresh(entity, ["jurisdictions"])
    return entity

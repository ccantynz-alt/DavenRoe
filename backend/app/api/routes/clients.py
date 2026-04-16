"""Client Management API routes — wired to PostgreSQL.

Uses the SQLAlchemy Entity model for real persistence. Falls back to
the in-memory ClientManager if the database is unavailable.
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.auth.dependencies import get_current_user
from app.core.database import get_db
from app.models.entity import Entity, EntityJurisdiction
from app.models.user import User

# Fallback
from app.clients.manager import ClientManager
from app.clients.groups import GroupManager

router = APIRouter(prefix="/clients", tags=["Client Management"])
_fallback_manager = ClientManager()
_fallback_groups = GroupManager()


def _entity_to_dict(e: Entity) -> dict:
    return {
        "id": str(e.id),
        "name": e.name,
        "legal_name": e.legal_name,
        "entity_type": e.entity_type,
        "primary_currency": e.primary_currency,
        "tax_id": e.tax_id,
        "tax_id_type": e.tax_id_type,
        "email": e.email,
        "phone": e.phone,
        "address": e.address,
        "is_active": e.is_active,
        "status": "active" if e.is_active else "inactive",
        "jurisdictions": [
            {
                "code": j.jurisdiction_code,
                "tax_registration_id": j.tax_registration_id,
                "is_primary": j.is_primary,
                "nexus_type": j.nexus_type,
            }
            for j in (e.jurisdictions or [])
        ],
        "created_at": e.created_at.isoformat() if e.created_at else None,
    }


@router.post("/")
async def create_client(data: dict, user: User = Depends(get_current_user)):
    name = data.get("name", "Unnamed Entity")
    entity = Entity(
        name=name,
        legal_name=data.get("legal_name", name),
        entity_type=data.get("entity_type", "company"),
        primary_currency=data.get("primary_currency", data.get("currency", "NZD")),
        tax_id=data.get("tax_id"),
        tax_id_type=data.get("tax_id_type"),
        email=data.get("email"),
        phone=data.get("phone"),
        address=data.get("address"),
        is_active=True,
    )
    try:
        async for db in get_db():
            db.add(entity)
            await db.flush()
            await db.refresh(entity, attribute_names=["jurisdictions"])
            return _entity_to_dict(entity)
    except Exception:
        e = _fallback_manager.create(**data)
        return e.to_dict()


@router.get("/")
async def list_clients(
    status: str | None = None, entity_type: str | None = None,
    jurisdiction: str | None = None, search: str | None = None,
    user: User = Depends(get_current_user),
):
    try:
        async for db in get_db():
            stmt = select(Entity).options(selectinload(Entity.jurisdictions)).order_by(Entity.name)
            if status == "active":
                stmt = stmt.where(Entity.is_active == True)
            elif status == "inactive":
                stmt = stmt.where(Entity.is_active == False)
            if entity_type:
                stmt = stmt.where(Entity.entity_type == entity_type)
            if search:
                stmt = stmt.where(Entity.name.ilike(f"%{search}%"))
            result = await db.execute(stmt)
            entities = result.scalars().all()
            if entities:
                return {"entities": [_entity_to_dict(e) for e in entities], "total": len(entities)}
    except Exception:
        pass
    entities = _fallback_manager.list_all(status=status, entity_type=entity_type, jurisdiction=jurisdiction, search=search)
    return {"entities": [e.to_dict() for e in entities], "total": len(entities)}


@router.get("/summary")
async def client_summary(user: User = Depends(get_current_user)):
    try:
        async for db in get_db():
            total = await db.scalar(select(func.count(Entity.id)))
            active = await db.scalar(select(func.count(Entity.id)).where(Entity.is_active == True))
            by_type_result = await db.execute(
                select(Entity.entity_type, func.count(Entity.id)).group_by(Entity.entity_type)
            )
            by_type = {row[0]: row[1] for row in by_type_result}
            return {"total": total or 0, "active": active or 0, "inactive": (total or 0) - (active or 0), "by_type": by_type}
    except Exception:
        return _fallback_manager.summary()


@router.get("/{entity_id}")
async def get_client(entity_id: str, user: User = Depends(get_current_user)):
    try:
        async for db in get_db():
            stmt = select(Entity).options(selectinload(Entity.jurisdictions)).where(Entity.id == uuid.UUID(entity_id))
            result = await db.execute(stmt)
            entity = result.scalar_one_or_none()
            if entity:
                return _entity_to_dict(entity)
    except Exception:
        pass
    entity = _fallback_manager.get(entity_id)
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    return entity.to_dict()


@router.put("/{entity_id}")
async def update_client(entity_id: str, data: dict, user: User = Depends(get_current_user)):
    try:
        async for db in get_db():
            stmt = select(Entity).where(Entity.id == uuid.UUID(entity_id))
            result = await db.execute(stmt)
            entity = result.scalar_one_or_none()
            if entity:
                for field in ["name", "legal_name", "entity_type", "primary_currency", "tax_id", "tax_id_type", "email", "phone", "address"]:
                    if field in data:
                        setattr(entity, field, data[field])
                if "is_active" in data:
                    entity.is_active = data["is_active"]
                await db.flush()
                await db.refresh(entity, attribute_names=["jurisdictions"])
                return _entity_to_dict(entity)
    except Exception:
        pass
    entity = _fallback_manager.update(entity_id, **data)
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    return entity.to_dict()


@router.post("/{entity_id}/archive")
async def archive_client(entity_id: str, user: User = Depends(get_current_user)):
    try:
        async for db in get_db():
            stmt = select(Entity).where(Entity.id == uuid.UUID(entity_id))
            result = await db.execute(stmt)
            entity = result.scalar_one_or_none()
            if entity:
                entity.is_active = False
                await db.flush()
                return {"status": "archived"}
    except Exception:
        pass
    if not _fallback_manager.archive(entity_id):
        raise HTTPException(status_code=404, detail="Entity not found")
    return {"status": "archived"}


# Groups (still in-memory — lower priority)
@router.post("/groups/")
async def create_group(data: dict, user: User = Depends(get_current_user)):
    group = _fallback_groups.create(**data)
    return group.to_dict()


@router.get("/groups/")
async def list_groups(user: User = Depends(get_current_user)):
    return {"groups": [g.to_dict() for g in _fallback_groups.list_all()]}

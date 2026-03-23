"""Client Management API routes."""

from fastapi import APIRouter, Depends, HTTPException
from app.auth.dependencies import get_current_user
from app.clients.manager import ClientManager
from app.clients.groups import GroupManager
from app.models.user import User

router = APIRouter(prefix="/clients", tags=["Client Management"])
manager = ClientManager()
groups = GroupManager()


@router.post("/")
async def create_client(data: dict, user: User = Depends(get_current_user)):
    """Create a new client entity."""
    entity = manager.create(**data)
    return entity.to_dict()


@router.get("/")
async def list_clients(
    status: str | None = None, entity_type: str | None = None,
    jurisdiction: str | None = None, search: str | None = None,
    user: User = Depends(get_current_user),
):
    """List all client entities with optional filters."""
    entities = manager.list_all(status=status, entity_type=entity_type, jurisdiction=jurisdiction, search=search)
    return {"entities": [e.to_dict() for e in entities], "total": len(entities)}


@router.get("/summary")
async def client_summary(user: User = Depends(get_current_user)):
    return manager.summary()


@router.get("/{entity_id}")
async def get_client(entity_id: str, user: User = Depends(get_current_user)):
    entity = manager.get(entity_id)
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    return entity.to_dict()


@router.put("/{entity_id}")
async def update_client(entity_id: str, data: dict, user: User = Depends(get_current_user)):
    entity = manager.update(entity_id, **data)
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    return entity.to_dict()


@router.post("/{entity_id}/archive")
async def archive_client(entity_id: str, user: User = Depends(get_current_user)):
    if not manager.archive(entity_id):
        raise HTTPException(status_code=404, detail="Entity not found")
    return {"status": "archived"}


# Groups
@router.post("/groups/")
async def create_group(data: dict, user: User = Depends(get_current_user)):
    group = groups.create(**data)
    return group.to_dict()


@router.get("/groups/")
async def list_groups(user: User = Depends(get_current_user)):
    return {"groups": [g.to_dict() for g in groups.list_all()]}

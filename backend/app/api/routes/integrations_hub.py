"""Integrations Hub API routes."""

from fastapi import APIRouter, Depends, HTTPException
from app.integrations.hub import IntegrationsHub
from app.auth.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/integrations/hub", tags=["Integrations Hub"])
hub = IntegrationsHub()


@router.get("/")
async def list_integrations(category: str | None = None, jurisdiction: str | None = None, user: User = Depends(get_current_user)):
    integrations = hub.list_all(category=category, jurisdiction=jurisdiction)
    return {"integrations": [i.to_dict() for i in integrations], "total": len(integrations)}


@router.get("/categories")
async def list_categories(user: User = Depends(get_current_user)):
    return {"categories": hub.list_categories()}


@router.get("/connected")
async def list_connected(user: User = Depends(get_current_user)):
    connected = hub.get_connected()
    return {"connected": [i.to_dict() for i in connected], "count": len(connected)}


@router.get("/{integration_id}")
async def get_integration(integration_id: str, user: User = Depends(get_current_user)):
    integration = hub.get(integration_id)
    if not integration:
        raise HTTPException(status_code=404, detail=f"Integration '{integration_id}' not found")
    return integration.to_dict()


@router.post("/{integration_id}/connect")
async def connect_integration(integration_id: str, data: dict = None, user: User = Depends(get_current_user)):
    data = data or {}
    return hub.connect(integration_id, data.get("user_id", ""), data.get("config"))


@router.post("/{integration_id}/disconnect")
async def disconnect_integration(integration_id: str, user: User = Depends(get_current_user)):
    if not hub.disconnect(integration_id):
        raise HTTPException(status_code=404, detail="Integration not found")
    return {"status": "disconnected"}


@router.get("/summary/all")
async def integration_summary(user: User = Depends(get_current_user)):
    return hub.summary()

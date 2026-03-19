"""Marketplace API routes."""
from fastapi import APIRouter, HTTPException
from app.integrations.marketplace import Marketplace

router = APIRouter(prefix="/marketplace", tags=["App Marketplace"])
marketplace = Marketplace()

@router.get("/")
async def list_apps(category: str | None = None, jurisdiction: str | None = None, search: str | None = None, featured: bool = False):
    apps = marketplace.list_all(category=category, jurisdiction=jurisdiction, search=search, featured_only=featured)
    return {"apps": [a.to_dict() for a in apps], "total": len(apps)}

@router.get("/categories")
async def list_categories():
    return {"categories": marketplace.list_categories()}

@router.get("/summary")
async def marketplace_summary():
    return marketplace.summary()

@router.get("/{app_id}")
async def get_app(app_id: str):
    app = marketplace.get(app_id)
    if not app: raise HTTPException(404, "App not found")
    return app.to_dict()

"""Permissions & RBAC API routes."""

from fastapi import APIRouter, Depends, HTTPException
from app.permissions.rbac import RBACManager, Permission
from app.auth.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/permissions", tags=["Permissions"])
rbac = RBACManager()


@router.get("/roles")
async def list_roles(user: User = Depends(get_current_user)):
    return {"roles": [r.to_dict() for r in rbac.list_roles()]}


@router.post("/users")
async def create_user(data: dict, user: User = Depends(get_current_user)):
    try:
        user = rbac.create_user(
            email=data.get("email", ""),
            name=data.get("name", ""),
            role_id=data.get("role_id", "bookkeeper"),
            entity_access=data.get("entity_access", []),
        )
        return user.to_dict()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/users")
async def list_users(role_id: str | None = None, user: User = Depends(get_current_user)):
    return {"users": [u.to_dict() for u in rbac.list_users(role_id)]}


@router.post("/check")
async def check_authorization(data: dict, user: User = Depends(get_current_user)):
    return rbac.authorize(
        user_id=data.get("user_id", ""),
        permission=Permission(data.get("permission", "transaction:read")),
        entity_id=data.get("entity_id"),
    )

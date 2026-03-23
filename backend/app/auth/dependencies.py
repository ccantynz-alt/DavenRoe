"""FastAPI dependencies for authentication.

Use `get_current_user` to protect any endpoint. Use `require_role`
to restrict to specific roles.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.service import decode_token, get_user_by_id
from app.core.database import get_db
from app.models.user import User

security = HTTPBearer(auto_error=False)


async def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Extract and validate the JWT token, return the current user."""
    if not creds:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(creds.credentials)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user = await get_user_by_id(db, payload["sub"])
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    return user


async def get_optional_user(
    creds: HTTPAuthorizationCredentials | None = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    """Return the current user if authenticated, None otherwise."""
    if not creds:
        return None
    payload = decode_token(creds.credentials)
    if not payload or "sub" not in payload:
        return None
    return await get_user_by_id(db, payload["sub"])


def require_role(*roles: str):
    """Dependency factory — restrict endpoint to specific roles."""
    async def checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{user.role}' does not have access. Required: {', '.join(roles)}",
            )
        return user
    return checker


def check_entity_access(user: User, entity_id: str) -> bool:
    """Check if user has access to a specific entity.

    Partners and managers have full access (empty entity_access = all).
    Other roles must have the entity_id in their entity_access list.
    """
    if user.role in ("partner", "manager"):
        return True
    if not user.entity_access:
        return True  # empty list = all-access for legacy compatibility
    return str(entity_id) in user.entity_access


def require_entity_access(entity_id_param: str = "entity_id"):
    """Dependency factory — verify user can access the specified entity."""
    async def checker(user: User = Depends(get_current_user), **kwargs) -> User:
        entity_id = kwargs.get(entity_id_param)
        if entity_id and not check_entity_access(user, str(entity_id)):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this entity",
            )
        return user
    return checker

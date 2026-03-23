"""Authentication API routes — register, login, user management."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_role
from app.auth.service import (
    authenticate_user,
    create_access_token,
    get_user_by_email,
    hash_password,
)
from app.core.database import get_db
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ── Schemas ──────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=1, max_length=255)
    role: str = Field(default="bookkeeper", pattern="^(partner|manager|senior|bookkeeper|client)$")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    is_verified: bool
    entity_access: list[str]
    created_at: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


# In-memory reset tokens (use Redis or DB in production)
_reset_tokens: dict[str, dict] = {}


# ── Routes ───────────────────────────────────────────────────

@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user account."""
    existing = await get_user_by_email(db, req.email)
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        email=req.email,
        hashed_password=hash_password(req.password),
        full_name=req.full_name,
        role=req.role,
        is_verified=True,  # Auto-verify for now
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    token = create_access_token(str(user.id), user.role)
    return TokenResponse(
        access_token=token,
        user={
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
        },
    )


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate and receive a JWT token."""
    user = await authenticate_user(db, req.email, req.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    from datetime import datetime, timezone
    user.last_login = datetime.now(timezone.utc)
    await db.flush()

    token = create_access_token(str(user.id), user.role)
    return TokenResponse(
        access_token=token,
        user={
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
        },
    )


@router.get("/me")
async def get_me(user: User = Depends(get_current_user)):
    """Get the current authenticated user."""
    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "is_active": user.is_active,
        "is_verified": user.is_verified,
        "entity_access": user.entity_access or [],
        "last_login": user.last_login.isoformat() if user.last_login else None,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


@router.get("/users")
async def list_users(
    _admin: User = Depends(require_role("partner", "manager")),
    db: AsyncSession = Depends(get_db),
):
    """List all users (partner/manager only)."""
    from sqlalchemy import select
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    return [
        {
            "id": str(u.id),
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "is_active": u.is_active,
            "last_login": u.last_login.isoformat() if u.last_login else None,
        }
        for u in users
    ]


@router.post("/password-reset/request")
async def request_password_reset(req: PasswordResetRequest, db: AsyncSession = Depends(get_db)):
    """Request a password reset email."""
    user = await get_user_by_email(db, req.email)
    # Always return success to prevent email enumeration
    if user:
        import secrets
        from datetime import datetime, timezone, timedelta
        token = secrets.token_urlsafe(32)
        _reset_tokens[token] = {
            "user_id": str(user.id),
            "expires": datetime.now(timezone.utc) + timedelta(hours=1),
        }
        # In production, send email via Mailgun with reset link
        # For now, token is stored and can be used directly
    return {"message": "If an account with that email exists, a reset link has been sent."}


@router.post("/password-reset/confirm")
async def confirm_password_reset(req: PasswordResetConfirm, db: AsyncSession = Depends(get_db)):
    """Reset password using a reset token."""
    from datetime import datetime, timezone
    token_data = _reset_tokens.get(req.token)
    if not token_data:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    if datetime.now(timezone.utc) > token_data["expires"]:
        del _reset_tokens[req.token]
        raise HTTPException(status_code=400, detail="Reset token has expired")

    from app.auth.service import get_user_by_id
    user = await get_user_by_id(db, token_data["user_id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = hash_password(req.new_password)
    await db.flush()

    del _reset_tokens[req.token]
    return {"message": "Password has been reset successfully. Please log in with your new password."}


@router.post("/change-password")
async def change_password(
    req: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Change password for the current authenticated user."""
    from app.auth.service import verify_password
    if not verify_password(req.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    user.hashed_password = hash_password(req.new_password)
    await db.flush()
    return {"message": "Password changed successfully."}


@router.patch("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    data: dict,
    _admin: User = Depends(require_role("partner")),
    db: AsyncSession = Depends(get_db),
):
    """Update a user's role (partner only)."""
    from app.auth.service import get_user_by_id
    user = await get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    new_role = data.get("role")
    if new_role not in ("partner", "manager", "senior", "bookkeeper", "client"):
        raise HTTPException(status_code=422, detail="Invalid role")

    user.role = new_role
    await db.flush()
    return {"status": "updated", "user_id": user_id, "new_role": new_role}

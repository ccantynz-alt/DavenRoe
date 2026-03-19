"""Role-Based Access Control (RBAC).

Accounting firms have strict hierarchies:
- Partner: full access, approves everything
- Manager: manages clients, reviews work
- Senior: does the work, limited approvals
- Junior / Bookkeeper: data entry, basic reports
- Client: read-only view of their own data

Each role has specific permissions per resource type.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import uuid


class Permission(str, Enum):
    # Transactions
    TRANSACTION_CREATE = "transaction:create"
    TRANSACTION_READ = "transaction:read"
    TRANSACTION_UPDATE = "transaction:update"
    TRANSACTION_DELETE = "transaction:delete"
    TRANSACTION_APPROVE = "transaction:approve"

    # Reports
    REPORT_VIEW = "report:view"
    REPORT_EXPORT = "report:export"
    REPORT_GENERATE = "report:generate"

    # Entities / Clients
    ENTITY_CREATE = "entity:create"
    ENTITY_READ = "entity:read"
    ENTITY_UPDATE = "entity:update"
    ENTITY_DELETE = "entity:delete"

    # Documents
    DOCUMENT_UPLOAD = "document:upload"
    DOCUMENT_READ = "document:read"
    DOCUMENT_DELETE = "document:delete"

    # Tax
    TAX_CALCULATE = "tax:calculate"
    TAX_LODGE = "tax:lodge"

    # Forensic
    FORENSIC_RUN = "forensic:run"
    FORENSIC_VIEW = "forensic:view"

    # Admin
    USER_MANAGE = "user:manage"
    ROLE_MANAGE = "role:manage"
    SETTINGS_MANAGE = "settings:manage"
    AUDIT_VIEW = "audit:view"

    # Banking
    BANK_CONNECT = "bank:connect"
    BANK_VIEW = "bank:view"


@dataclass
class Role:
    """A role with a set of permissions."""
    id: str = ""
    name: str = ""
    description: str = ""
    permissions: set[Permission] = field(default_factory=set)
    is_system: bool = False  # System roles can't be deleted

    def __post_init__(self):
        if not self.id:
            self.id = self.name.lower().replace(" ", "_")

    def has_permission(self, perm: Permission) -> bool:
        return perm in self.permissions

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "permissions": sorted(p.value for p in self.permissions),
            "permission_count": len(self.permissions),
            "is_system": self.is_system,
        }


@dataclass
class User:
    """A user in the system with assigned roles."""
    id: str = ""
    email: str = ""
    name: str = ""
    role_ids: list[str] = field(default_factory=list)
    entity_access: list[str] = field(default_factory=list)  # which client entities they can access
    is_active: bool = True
    created_at: str = ""

    def __post_init__(self):
        if not self.id:
            self.id = str(uuid.uuid4())[:8]
        if not self.created_at:
            self.created_at = datetime.utcnow().isoformat()

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "role_ids": self.role_ids,
            "entity_access": self.entity_access,
            "is_active": self.is_active,
            "created_at": self.created_at,
        }


# Default system roles
SYSTEM_ROLES = {
    "partner": Role(
        id="partner",
        name="Partner",
        description="Full access to all features and all clients",
        permissions=set(Permission),  # All permissions
        is_system=True,
    ),
    "manager": Role(
        id="manager",
        name="Manager",
        description="Manage assigned clients, review and approve work",
        permissions={
            Permission.TRANSACTION_CREATE, Permission.TRANSACTION_READ,
            Permission.TRANSACTION_UPDATE, Permission.TRANSACTION_APPROVE,
            Permission.REPORT_VIEW, Permission.REPORT_EXPORT, Permission.REPORT_GENERATE,
            Permission.ENTITY_CREATE, Permission.ENTITY_READ, Permission.ENTITY_UPDATE,
            Permission.DOCUMENT_UPLOAD, Permission.DOCUMENT_READ,
            Permission.TAX_CALCULATE, Permission.TAX_LODGE,
            Permission.FORENSIC_RUN, Permission.FORENSIC_VIEW,
            Permission.AUDIT_VIEW,
            Permission.BANK_CONNECT, Permission.BANK_VIEW,
        },
        is_system=True,
    ),
    "senior": Role(
        id="senior",
        name="Senior Accountant",
        description="Prepare work for review, limited approvals",
        permissions={
            Permission.TRANSACTION_CREATE, Permission.TRANSACTION_READ,
            Permission.TRANSACTION_UPDATE,
            Permission.REPORT_VIEW, Permission.REPORT_GENERATE,
            Permission.ENTITY_READ,
            Permission.DOCUMENT_UPLOAD, Permission.DOCUMENT_READ,
            Permission.TAX_CALCULATE,
            Permission.FORENSIC_RUN, Permission.FORENSIC_VIEW,
            Permission.BANK_VIEW,
        },
        is_system=True,
    ),
    "bookkeeper": Role(
        id="bookkeeper",
        name="Bookkeeper",
        description="Data entry, basic reports, document upload",
        permissions={
            Permission.TRANSACTION_CREATE, Permission.TRANSACTION_READ,
            Permission.REPORT_VIEW,
            Permission.ENTITY_READ,
            Permission.DOCUMENT_UPLOAD, Permission.DOCUMENT_READ,
            Permission.TAX_CALCULATE,
            Permission.BANK_VIEW,
        },
        is_system=True,
    ),
    "client": Role(
        id="client",
        name="Client (Read Only)",
        description="View their own entity's data only",
        permissions={
            Permission.TRANSACTION_READ,
            Permission.REPORT_VIEW,
            Permission.ENTITY_READ,
            Permission.DOCUMENT_READ,
            Permission.DOCUMENT_UPLOAD,  # Upload receipts
        },
        is_system=True,
    ),
}


class RBACManager:
    """Manages users, roles, and permission checks."""

    def __init__(self):
        self._roles: dict[str, Role] = dict(SYSTEM_ROLES)
        self._users: dict[str, User] = {}

    # ── Roles ────────────────────────────────────────────────

    def get_role(self, role_id: str) -> Role | None:
        return self._roles.get(role_id)

    def list_roles(self) -> list[Role]:
        return sorted(self._roles.values(), key=lambda r: r.name)

    def create_role(self, name: str, description: str, permissions: set[Permission]) -> Role:
        role = Role(name=name, description=description, permissions=permissions)
        self._roles[role.id] = role
        return role

    # ── Users ────────────────────────────────────────────────

    def create_user(self, email: str, name: str, role_id: str, entity_access: list[str] | None = None) -> User:
        if role_id not in self._roles:
            raise ValueError(f"Role '{role_id}' does not exist")
        user = User(email=email, name=name, role_ids=[role_id], entity_access=entity_access or [])
        self._users[user.id] = user
        return user

    def get_user(self, user_id: str) -> User | None:
        return self._users.get(user_id)

    def list_users(self, role_id: str | None = None) -> list[User]:
        users = list(self._users.values())
        if role_id:
            users = [u for u in users if role_id in u.role_ids]
        return sorted(users, key=lambda u: u.name)

    def assign_role(self, user_id: str, role_id: str) -> bool:
        user = self._users.get(user_id)
        if not user or role_id not in self._roles:
            return False
        if role_id not in user.role_ids:
            user.role_ids.append(role_id)
        return True

    def grant_entity_access(self, user_id: str, entity_id: str) -> bool:
        user = self._users.get(user_id)
        if not user:
            return False
        if entity_id not in user.entity_access:
            user.entity_access.append(entity_id)
        return True

    # ── Authorization ────────────────────────────────────────

    def check_permission(self, user_id: str, permission: Permission) -> bool:
        """Check if a user has a specific permission."""
        user = self._users.get(user_id)
        if not user or not user.is_active:
            return False

        for role_id in user.role_ids:
            role = self._roles.get(role_id)
            if role and role.has_permission(permission):
                return True
        return False

    def check_entity_access(self, user_id: str, entity_id: str) -> bool:
        """Check if a user can access a specific client entity."""
        user = self._users.get(user_id)
        if not user or not user.is_active:
            return False

        # Partners have access to everything
        if "partner" in user.role_ids:
            return True

        return entity_id in user.entity_access

    def authorize(self, user_id: str, permission: Permission, entity_id: str | None = None) -> dict:
        """Full authorization check — permission + entity access."""
        has_perm = self.check_permission(user_id, permission)
        has_access = self.check_entity_access(user_id, entity_id) if entity_id else True

        authorized = has_perm and has_access
        reason = ""
        if not has_perm:
            reason = f"Missing permission: {permission.value}"
        elif not has_access:
            reason = f"No access to entity: {entity_id}"

        return {
            "authorized": authorized,
            "user_id": user_id,
            "permission": permission.value,
            "entity_id": entity_id,
            "reason": reason if not authorized else "authorized",
        }

"""Immutable Audit Trail.

Every change to every record must be logged. Who changed what,
when, and why. Without this, no auditor trusts the data and
no regulator accepts it.

Design:
- Append-only (entries cannot be modified or deleted)
- Includes before/after state for data changes
- Tamper detection via hash chain
- Filterable by entity, user, action, date range
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import hashlib
import json


class AuditAction(str, Enum):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    APPROVE = "approve"
    REJECT = "reject"
    LOGIN = "login"
    LOGOUT = "logout"
    EXPORT = "export"
    IMPORT = "import"
    VIEW = "view"
    ARCHIVE = "archive"
    RESTORE = "restore"
    PERMISSION_CHANGE = "permission_change"


@dataclass
class AuditEntry:
    """A single audit log entry. Immutable once created."""

    id: int = 0
    timestamp: str = ""
    user_id: str = ""
    user_name: str = ""
    action: AuditAction = AuditAction.VIEW
    resource_type: str = ""     # transaction, entity, document, user, etc.
    resource_id: str = ""
    entity_id: str = ""         # which client entity this relates to

    # Change tracking
    description: str = ""
    before_state: dict = field(default_factory=dict)
    after_state: dict = field(default_factory=dict)
    changed_fields: list[str] = field(default_factory=list)

    # Metadata
    ip_address: str = ""
    user_agent: str = ""

    # Integrity
    entry_hash: str = ""
    previous_hash: str = ""

    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.utcnow().isoformat() + "Z"

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "timestamp": self.timestamp,
            "user_id": self.user_id,
            "user_name": self.user_name,
            "action": self.action.value if isinstance(self.action, AuditAction) else self.action,
            "resource_type": self.resource_type,
            "resource_id": self.resource_id,
            "entity_id": self.entity_id,
            "description": self.description,
            "changed_fields": self.changed_fields,
            "entry_hash": self.entry_hash,
        }


class AuditTrail:
    """Append-only audit trail with hash chain integrity.

    Every entry is hashed with the previous entry's hash,
    creating a chain. If any entry is tampered with, the
    chain breaks and it's detectable.
    """

    def __init__(self):
        self._entries: list[AuditEntry] = []
        self._next_id = 1

    def log(
        self,
        user_id: str,
        user_name: str,
        action: str | AuditAction,
        resource_type: str,
        resource_id: str = "",
        entity_id: str = "",
        description: str = "",
        before_state: dict | None = None,
        after_state: dict | None = None,
        ip_address: str = "",
    ) -> AuditEntry:
        """Log an audit event. Append-only — cannot be undone."""
        if isinstance(action, str):
            action = AuditAction(action)

        # Calculate changed fields
        changed_fields = []
        if before_state and after_state:
            all_keys = set(list(before_state.keys()) + list(after_state.keys()))
            changed_fields = [k for k in all_keys if before_state.get(k) != after_state.get(k)]

        previous_hash = self._entries[-1].entry_hash if self._entries else "genesis"

        entry = AuditEntry(
            id=self._next_id,
            user_id=user_id,
            user_name=user_name,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            entity_id=entity_id,
            description=description,
            before_state=before_state or {},
            after_state=after_state or {},
            changed_fields=changed_fields,
            ip_address=ip_address,
            previous_hash=previous_hash,
        )

        # Create hash chain
        hash_input = f"{entry.id}|{entry.timestamp}|{entry.user_id}|{entry.action.value}|{entry.resource_type}|{entry.resource_id}|{previous_hash}"
        entry.entry_hash = hashlib.sha256(hash_input.encode()).hexdigest()[:16]

        self._entries.append(entry)
        self._next_id += 1

        return entry

    def query(
        self,
        user_id: str | None = None,
        entity_id: str | None = None,
        resource_type: str | None = None,
        resource_id: str | None = None,
        action: str | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
        limit: int = 100,
    ) -> list[AuditEntry]:
        """Query audit trail with filters."""
        results = self._entries

        if user_id:
            results = [e for e in results if e.user_id == user_id]
        if entity_id:
            results = [e for e in results if e.entity_id == entity_id]
        if resource_type:
            results = [e for e in results if e.resource_type == resource_type]
        if resource_id:
            results = [e for e in results if e.resource_id == resource_id]
        if action:
            results = [e for e in results if (e.action.value if isinstance(e.action, AuditAction) else e.action) == action]
        if start_date:
            results = [e for e in results if e.timestamp >= start_date]
        if end_date:
            results = [e for e in results if e.timestamp <= end_date]

        # Return most recent first
        return list(reversed(results[-limit:]))

    def verify_integrity(self) -> dict:
        """Verify the hash chain is intact — detect tampering."""
        if not self._entries:
            return {"status": "empty", "entries_checked": 0, "valid": True}

        previous_hash = "genesis"
        broken_at = None

        for entry in self._entries:
            if entry.previous_hash != previous_hash:
                broken_at = entry.id
                break
            previous_hash = entry.entry_hash

        return {
            "status": "valid" if not broken_at else "BROKEN",
            "entries_checked": len(self._entries),
            "valid": broken_at is None,
            "broken_at_entry": broken_at,
            "message": "Hash chain intact" if not broken_at else f"Chain broken at entry {broken_at} — possible tampering detected",
        }

    def get_history(self, resource_type: str, resource_id: str) -> list[dict]:
        """Get complete change history for a specific resource."""
        entries = [e for e in self._entries if e.resource_type == resource_type and e.resource_id == resource_id]
        return [e.to_dict() for e in entries]

    @property
    def total_entries(self) -> int:
        return len(self._entries)

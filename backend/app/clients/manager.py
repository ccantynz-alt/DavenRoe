"""Multi-Entity / Client Management.

Every accounting firm manages dozens to hundreds of clients.
This provides the data model and operations for managing them.

Each client entity has:
- Basic info (name, type, jurisdiction, tax IDs)
- Contact details
- Financial year settings
- Active status
- Tags and grouping
"""

from dataclasses import dataclass, field
from datetime import date, datetime
from enum import Enum
from typing import Any
import uuid


class EntityType(str, Enum):
    SOLE_TRADER = "sole_trader"
    PARTNERSHIP = "partnership"
    COMPANY = "company"
    TRUST = "trust"
    SMSF = "smsf"
    NFP = "not_for_profit"
    GOVERNMENT = "government"
    INDIVIDUAL = "individual"


class EntityStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ONBOARDING = "onboarding"
    ARCHIVED = "archived"
    DEREGISTERED = "deregistered"


@dataclass
class ClientEntity:
    """A single client entity — could be a company, trust, individual, etc."""

    # Identity
    id: str = ""
    name: str = ""
    trading_name: str = ""
    entity_type: EntityType = EntityType.COMPANY
    status: EntityStatus = EntityStatus.ACTIVE
    jurisdiction: str = "AU"

    # Tax identifiers
    tax_ids: dict[str, str] = field(default_factory=dict)
    # e.g. {"abn": "51 824 753 556", "acn": "000 014 675", "tfn": "..."}

    # Contact
    contact_name: str = ""
    contact_email: str = ""
    contact_phone: str = ""
    address: dict = field(default_factory=dict)

    # Financial settings
    fy_start_month: int = 7  # July (AU default)
    fy_start_day: int = 1
    reporting_currency: str = "AUD"
    gst_registered: bool = True
    bas_frequency: str = "quarterly"  # monthly, quarterly, annually

    # Organization
    tags: list[str] = field(default_factory=list)
    group_id: str = ""
    partner: str = ""     # assigned partner
    manager: str = ""     # assigned manager
    notes: str = ""

    # Timestamps
    created_at: str = ""
    updated_at: str = ""

    def __post_init__(self):
        if not self.id:
            self.id = str(uuid.uuid4())[:8]
        if not self.created_at:
            self.created_at = datetime.utcnow().isoformat()
        self.updated_at = datetime.utcnow().isoformat()

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "trading_name": self.trading_name,
            "entity_type": self.entity_type.value if isinstance(self.entity_type, EntityType) else self.entity_type,
            "status": self.status.value if isinstance(self.status, EntityStatus) else self.status,
            "jurisdiction": self.jurisdiction,
            "tax_ids": self.tax_ids,
            "contact_name": self.contact_name,
            "contact_email": self.contact_email,
            "contact_phone": self.contact_phone,
            "address": self.address,
            "fy_start_month": self.fy_start_month,
            "reporting_currency": self.reporting_currency,
            "gst_registered": self.gst_registered,
            "bas_frequency": self.bas_frequency,
            "tags": self.tags,
            "group_id": self.group_id,
            "partner": self.partner,
            "manager": self.manager,
            "notes": self.notes,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }


class ClientManager:
    """Manages all client entities for an accounting firm.

    In production this would be backed by a database.
    For now, in-memory with full CRUD.
    """

    def __init__(self):
        self._entities: dict[str, ClientEntity] = {}

    def create(self, **kwargs) -> ClientEntity:
        """Create a new client entity."""
        if "entity_type" in kwargs and isinstance(kwargs["entity_type"], str):
            kwargs["entity_type"] = EntityType(kwargs["entity_type"])
        if "status" in kwargs and isinstance(kwargs["status"], str):
            kwargs["status"] = EntityStatus(kwargs["status"])

        entity = ClientEntity(**kwargs)
        self._entities[entity.id] = entity
        return entity

    def get(self, entity_id: str) -> ClientEntity | None:
        return self._entities.get(entity_id)

    def update(self, entity_id: str, **kwargs) -> ClientEntity | None:
        entity = self._entities.get(entity_id)
        if not entity:
            return None

        for key, value in kwargs.items():
            if key == "entity_type" and isinstance(value, str):
                value = EntityType(value)
            if key == "status" and isinstance(value, str):
                value = EntityStatus(value)
            if hasattr(entity, key):
                setattr(entity, key, value)

        entity.updated_at = datetime.utcnow().isoformat()
        return entity

    def archive(self, entity_id: str) -> bool:
        entity = self._entities.get(entity_id)
        if entity:
            entity.status = EntityStatus.ARCHIVED
            entity.updated_at = datetime.utcnow().isoformat()
            return True
        return False

    def list_all(
        self,
        status: str | None = None,
        entity_type: str | None = None,
        jurisdiction: str | None = None,
        tag: str | None = None,
        search: str | None = None,
        partner: str | None = None,
        manager: str | None = None,
    ) -> list[ClientEntity]:
        """List entities with optional filters."""
        results = list(self._entities.values())

        if status:
            results = [e for e in results if e.status.value == status]
        if entity_type:
            results = [e for e in results if e.entity_type.value == entity_type]
        if jurisdiction:
            results = [e for e in results if e.jurisdiction.upper() == jurisdiction.upper()]
        if tag:
            results = [e for e in results if tag in e.tags]
        if partner:
            results = [e for e in results if e.partner == partner]
        if manager:
            results = [e for e in results if e.manager == manager]
        if search:
            q = search.lower()
            results = [e for e in results if q in e.name.lower() or q in e.trading_name.lower() or q in e.contact_name.lower()]

        return sorted(results, key=lambda e: e.name)

    def count_by_status(self) -> dict[str, int]:
        counts = {}
        for entity in self._entities.values():
            status = entity.status.value
            counts[status] = counts.get(status, 0) + 1
        return counts

    def count_by_type(self) -> dict[str, int]:
        counts = {}
        for entity in self._entities.values():
            etype = entity.entity_type.value
            counts[etype] = counts.get(etype, 0) + 1
        return counts

    def summary(self) -> dict:
        """Dashboard summary of all clients."""
        return {
            "total_entities": len(self._entities),
            "by_status": self.count_by_status(),
            "by_type": self.count_by_type(),
            "jurisdictions": list(set(e.jurisdiction for e in self._entities.values())),
        }

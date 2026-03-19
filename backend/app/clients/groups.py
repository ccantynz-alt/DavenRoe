"""Entity Groups — for related entities and consolidated reporting.

A family might have:
- A company (Pty Ltd)
- A family trust
- An SMSF
- Individual tax returns for 2 directors

These all need to be grouped together.
"""

from dataclasses import dataclass, field
from datetime import datetime
import uuid


@dataclass
class EntityGroup:
    """A group of related entities."""

    id: str = ""
    name: str = ""
    description: str = ""
    entity_ids: list[str] = field(default_factory=list)
    primary_entity_id: str = ""  # The main entity in the group
    tags: list[str] = field(default_factory=list)
    created_at: str = ""

    def __post_init__(self):
        if not self.id:
            self.id = str(uuid.uuid4())[:8]
        if not self.created_at:
            self.created_at = datetime.utcnow().isoformat()

    def add_entity(self, entity_id: str):
        if entity_id not in self.entity_ids:
            self.entity_ids.append(entity_id)

    def remove_entity(self, entity_id: str):
        self.entity_ids = [eid for eid in self.entity_ids if eid != entity_id]

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "entity_ids": self.entity_ids,
            "entity_count": len(self.entity_ids),
            "primary_entity_id": self.primary_entity_id,
            "tags": self.tags,
            "created_at": self.created_at,
        }


class GroupManager:
    """Manages entity groups."""

    def __init__(self):
        self._groups: dict[str, EntityGroup] = {}

    def create(self, **kwargs) -> EntityGroup:
        group = EntityGroup(**kwargs)
        self._groups[group.id] = group
        return group

    def get(self, group_id: str) -> EntityGroup | None:
        return self._groups.get(group_id)

    def list_all(self) -> list[EntityGroup]:
        return sorted(self._groups.values(), key=lambda g: g.name)

    def find_groups_for_entity(self, entity_id: str) -> list[EntityGroup]:
        return [g for g in self._groups.values() if entity_id in g.entity_ids]

    def delete(self, group_id: str) -> bool:
        if group_id in self._groups:
            del self._groups[group_id]
            return True
        return False

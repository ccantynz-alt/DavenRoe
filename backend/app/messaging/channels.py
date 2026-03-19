"""Channel Management — team channels, client portals, tax authority links.

Channels are persistent conversation spaces:
- #general — whole firm
- #client-acme — team discussion about Acme Pty Ltd
- @client:john — direct with client John
- @tax:ato-acme — ATO correspondence for Acme
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import uuid


class ChannelType(str, Enum):
    FIRM_WIDE = "firm_wide"        # Everyone in the firm
    TEAM = "team"                  # Specific team (e.g., tax team, audit team)
    ENTITY = "entity"             # About a specific client entity
    CLIENT_PORTAL = "client_portal"  # Visible to client
    TAX_AUTHORITY = "tax_authority"  # Tax office correspondence


@dataclass
class Channel:
    """A persistent channel for ongoing communication."""
    id: str = ""
    name: str = ""
    description: str = ""
    channel_type: ChannelType = ChannelType.TEAM
    entity_id: str = ""
    member_ids: list[str] = field(default_factory=list)
    is_private: bool = False
    is_archived: bool = False
    created_by: str = ""
    created_at: str = ""

    def __post_init__(self):
        if not self.id:
            self.id = str(uuid.uuid4())[:8]
        if not self.created_at:
            self.created_at = datetime.utcnow().isoformat()

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "channel_type": self.channel_type.value if isinstance(self.channel_type, ChannelType) else self.channel_type,
            "entity_id": self.entity_id,
            "member_count": len(self.member_ids),
            "is_private": self.is_private,
            "is_archived": self.is_archived,
            "created_at": self.created_at,
        }


class ChannelManager:
    """Manages communication channels."""

    def __init__(self):
        self._channels: dict[str, Channel] = {}

    def create(self, **kwargs) -> Channel:
        if "channel_type" in kwargs and isinstance(kwargs["channel_type"], str):
            kwargs["channel_type"] = ChannelType(kwargs["channel_type"])
        channel = Channel(**kwargs)
        self._channels[channel.id] = channel
        return channel

    def get(self, channel_id: str) -> Channel | None:
        return self._channels.get(channel_id)

    def list_for_user(self, user_id: str) -> list[Channel]:
        return [c for c in self._channels.values()
                if user_id in c.member_ids and not c.is_archived]

    def list_for_entity(self, entity_id: str) -> list[Channel]:
        return [c for c in self._channels.values()
                if c.entity_id == entity_id and not c.is_archived]

    def add_member(self, channel_id: str, user_id: str) -> bool:
        channel = self._channels.get(channel_id)
        if channel and user_id not in channel.member_ids:
            channel.member_ids.append(user_id)
            return True
        return False

    def remove_member(self, channel_id: str, user_id: str) -> bool:
        channel = self._channels.get(channel_id)
        if channel and user_id in channel.member_ids:
            channel.member_ids.remove(user_id)
            return True
        return False

    def archive(self, channel_id: str) -> bool:
        channel = self._channels.get(channel_id)
        if channel:
            channel.is_archived = True
            return True
        return False

    def setup_default_channels(self, firm_member_ids: list[str]) -> list[Channel]:
        """Create default channels for a new firm."""
        defaults = [
            self.create(name="general", description="Firm-wide announcements and discussion",
                        channel_type=ChannelType.FIRM_WIDE, member_ids=list(firm_member_ids)),
            self.create(name="tax-team", description="Tax compliance discussion",
                        channel_type=ChannelType.TEAM, member_ids=list(firm_member_ids)),
            self.create(name="audit-team", description="Audit & assurance discussion",
                        channel_type=ChannelType.TEAM, member_ids=list(firm_member_ids)),
            self.create(name="bookkeeping", description="Bookkeeping and data entry",
                        channel_type=ChannelType.TEAM, member_ids=list(firm_member_ids)),
        ]
        return defaults

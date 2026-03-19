"""Secure Messaging Engine.

Accountants need to communicate with:
1. Their team (partner ↔ manager ↔ senior ↔ bookkeeper)
2. Their clients (accountant ↔ client portal)
3. Tax authorities (accountant ↔ ATO/IRS/IRD/HMRC correspondence tracking)

This replaces the need for Microsoft Teams, Slack, or email chains.
All messages are encrypted at rest, linked to entities, and part
of the audit trail.

Key design:
- Conversations are scoped to entities (every message is about a client)
- Messages can have attachments (linked to document manager)
- Tax authority correspondence is tracked with reference numbers
- Client portal messages are visible to the client
- Internal team messages are NOT visible to clients
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import uuid


class MessageType(str, Enum):
    TEXT = "text"
    FILE = "file"
    SYSTEM = "system"          # Auto-generated (e.g., "John approved transaction #123")
    TAX_CORRESPONDENCE = "tax_correspondence"  # Tracked comms with tax office
    NOTE = "note"              # Internal note (not sent to anyone)


class ConversationType(str, Enum):
    TEAM = "team"              # Internal team discussion about a client
    CLIENT = "client"          # Accountant ↔ client communication
    TAX_AUTHORITY = "tax_authority"  # Correspondence with ATO/IRS/IRD/HMRC
    DIRECT = "direct"          # 1:1 between two users


class MessageStatus(str, Enum):
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"


@dataclass
class Message:
    """A single message in a conversation."""
    id: str = ""
    conversation_id: str = ""
    sender_id: str = ""
    sender_name: str = ""
    message_type: MessageType = MessageType.TEXT
    content: str = ""
    status: MessageStatus = MessageStatus.SENT

    # Attachments
    attachment_ids: list[str] = field(default_factory=list)  # Links to document manager

    # Tax authority specifics
    tax_reference: str = ""    # e.g., ATO reference number, IRS notice number
    tax_authority: str = ""    # ATO, IRS, IRD, HMRC

    # Metadata
    entity_id: str = ""
    reply_to: str = ""         # Reply threading
    edited: bool = False
    pinned: bool = False
    created_at: str = ""

    def __post_init__(self):
        if not self.id:
            self.id = str(uuid.uuid4())[:12]
        if not self.created_at:
            self.created_at = datetime.utcnow().isoformat() + "Z"

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "conversation_id": self.conversation_id,
            "sender_id": self.sender_id,
            "sender_name": self.sender_name,
            "message_type": self.message_type.value if isinstance(self.message_type, MessageType) else self.message_type,
            "content": self.content,
            "status": self.status.value if isinstance(self.status, MessageStatus) else self.status,
            "attachment_ids": self.attachment_ids,
            "tax_reference": self.tax_reference,
            "tax_authority": self.tax_authority,
            "entity_id": self.entity_id,
            "reply_to": self.reply_to,
            "pinned": self.pinned,
            "created_at": self.created_at,
        }


@dataclass
class Conversation:
    """A conversation thread — could be team, client, or tax authority."""
    id: str = ""
    title: str = ""
    conversation_type: ConversationType = ConversationType.TEAM
    entity_id: str = ""        # Which client entity this relates to
    participant_ids: list[str] = field(default_factory=list)
    participant_names: list[str] = field(default_factory=list)

    # Tax authority specifics
    tax_authority: str = ""
    tax_case_number: str = ""

    # State
    is_archived: bool = False
    is_muted: bool = False
    last_message_at: str = ""
    created_at: str = ""

    def __post_init__(self):
        if not self.id:
            self.id = str(uuid.uuid4())[:8]
        if not self.created_at:
            self.created_at = datetime.utcnow().isoformat() + "Z"

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "conversation_type": self.conversation_type.value if isinstance(self.conversation_type, ConversationType) else self.conversation_type,
            "entity_id": self.entity_id,
            "participant_ids": self.participant_ids,
            "participant_names": self.participant_names,
            "tax_authority": self.tax_authority,
            "tax_case_number": self.tax_case_number,
            "is_archived": self.is_archived,
            "last_message_at": self.last_message_at,
            "created_at": self.created_at,
        }


class MessagingEngine:
    """Manages all conversations and messages."""

    def __init__(self):
        self._conversations: dict[str, Conversation] = {}
        self._messages: dict[str, list[Message]] = {}  # conversation_id → messages

    # ── Conversations ────────────────────────────────────────

    def create_conversation(self, **kwargs) -> Conversation:
        if "conversation_type" in kwargs and isinstance(kwargs["conversation_type"], str):
            kwargs["conversation_type"] = ConversationType(kwargs["conversation_type"])
        conv = Conversation(**kwargs)
        self._conversations[conv.id] = conv
        self._messages[conv.id] = []
        return conv

    def get_conversation(self, conv_id: str) -> Conversation | None:
        return self._conversations.get(conv_id)

    def list_conversations(
        self, entity_id: str | None = None, user_id: str | None = None,
        conv_type: str | None = None, include_archived: bool = False,
    ) -> list[Conversation]:
        results = list(self._conversations.values())
        if entity_id:
            results = [c for c in results if c.entity_id == entity_id]
        if user_id:
            results = [c for c in results if user_id in c.participant_ids]
        if conv_type:
            results = [c for c in results if (c.conversation_type.value if isinstance(c.conversation_type, ConversationType) else c.conversation_type) == conv_type]
        if not include_archived:
            results = [c for c in results if not c.is_archived]
        return sorted(results, key=lambda c: c.last_message_at or c.created_at, reverse=True)

    def archive_conversation(self, conv_id: str) -> bool:
        conv = self._conversations.get(conv_id)
        if conv:
            conv.is_archived = True
            return True
        return False

    # ── Messages ─────────────────────────────────────────────

    def send_message(self, conversation_id: str, **kwargs) -> Message | None:
        if conversation_id not in self._conversations:
            return None

        if "message_type" in kwargs and isinstance(kwargs["message_type"], str):
            kwargs["message_type"] = MessageType(kwargs["message_type"])

        msg = Message(conversation_id=conversation_id, **kwargs)
        self._messages[conversation_id].append(msg)

        # Update conversation
        self._conversations[conversation_id].last_message_at = msg.created_at
        return msg

    def get_messages(self, conversation_id: str, limit: int = 50, before: str | None = None) -> list[Message]:
        msgs = self._messages.get(conversation_id, [])
        if before:
            msgs = [m for m in msgs if m.created_at < before]
        return msgs[-limit:]

    def pin_message(self, conversation_id: str, message_id: str) -> bool:
        for msg in self._messages.get(conversation_id, []):
            if msg.id == message_id:
                msg.pinned = True
                return True
        return False

    def get_pinned(self, conversation_id: str) -> list[Message]:
        return [m for m in self._messages.get(conversation_id, []) if m.pinned]

    def search_messages(self, query: str, entity_id: str | None = None) -> list[Message]:
        """Search across all messages."""
        q = query.lower()
        results = []
        for conv_id, msgs in self._messages.items():
            conv = self._conversations.get(conv_id)
            if entity_id and conv and conv.entity_id != entity_id:
                continue
            for msg in msgs:
                if q in msg.content.lower():
                    results.append(msg)
        return results

    # ── Tax Authority Correspondence ─────────────────────────

    def log_tax_correspondence(
        self, entity_id: str, tax_authority: str, reference: str,
        content: str, sender_id: str, sender_name: str,
        direction: str = "inbound",
    ) -> tuple[Conversation, Message]:
        """Log correspondence with a tax authority.

        Every letter, notice, or response to/from ATO/IRS/IRD/HMRC
        should be tracked here.
        """
        # Find or create conversation for this entity + authority
        existing = [c for c in self._conversations.values()
                    if c.entity_id == entity_id and c.tax_authority == tax_authority
                    and not c.is_archived]

        if existing:
            conv = existing[0]
        else:
            conv = self.create_conversation(
                title=f"{tax_authority} Correspondence",
                conversation_type=ConversationType.TAX_AUTHORITY,
                entity_id=entity_id,
                tax_authority=tax_authority,
            )

        msg = self.send_message(
            conv.id,
            sender_id=sender_id,
            sender_name=f"{'← ' if direction == 'inbound' else '→ '}{sender_name}",
            message_type=MessageType.TAX_CORRESPONDENCE,
            content=content,
            tax_reference=reference,
            tax_authority=tax_authority,
            entity_id=entity_id,
        )

        return conv, msg

    # ── Stats ────────────────────────────────────────────────

    def unread_count(self, user_id: str) -> int:
        count = 0
        for conv in self._conversations.values():
            if user_id in conv.participant_ids:
                for msg in self._messages.get(conv.id, []):
                    if msg.sender_id != user_id and msg.status != MessageStatus.READ:
                        count += 1
        return count

    def summary(self, user_id: str | None = None) -> dict:
        convs = list(self._conversations.values())
        if user_id:
            convs = [c for c in convs if user_id in c.participant_ids]

        by_type = {}
        total_messages = 0
        for c in convs:
            ct = c.conversation_type.value if isinstance(c.conversation_type, ConversationType) else c.conversation_type
            by_type[ct] = by_type.get(ct, 0) + 1
            total_messages += len(self._messages.get(c.id, []))

        return {
            "total_conversations": len(convs),
            "by_type": by_type,
            "total_messages": total_messages,
            "unread": self.unread_count(user_id) if user_id else 0,
        }

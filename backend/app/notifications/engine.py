"""Notification & Alert Engine.

Proactive alerts so accountants don't miss deadlines or anomalies.

Types:
- Deadline alerts (BAS, tax returns, STP, super guarantee)
- Review notifications (transactions pending approval)
- Anomaly alerts (from forensic/audit engines)
- Reconciliation reminders
- Document expiry warnings
- Custom user-set reminders
"""

from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from enum import Enum
import uuid


class NotificationType(str, Enum):
    DEADLINE = "deadline"
    REVIEW = "review"
    ANOMALY = "anomaly"
    RECONCILIATION = "reconciliation"
    DOCUMENT = "document"
    SYSTEM = "system"
    CUSTOM = "custom"


class NotificationPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class NotificationChannel(str, Enum):
    IN_APP = "in_app"
    EMAIL = "email"
    PUSH = "push"


@dataclass
class Notification:
    """A single notification."""
    id: str = ""
    type: NotificationType = NotificationType.SYSTEM
    priority: NotificationPriority = NotificationPriority.MEDIUM
    title: str = ""
    message: str = ""
    user_id: str = ""
    entity_id: str = ""
    resource_type: str = ""
    resource_id: str = ""
    channels: list[NotificationChannel] = field(default_factory=lambda: [NotificationChannel.IN_APP])
    read: bool = False
    actioned: bool = False
    action_url: str = ""
    due_date: str = ""
    created_at: str = ""

    def __post_init__(self):
        if not self.id:
            self.id = str(uuid.uuid4())[:8]
        if not self.created_at:
            self.created_at = datetime.utcnow().isoformat()

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "type": self.type.value if isinstance(self.type, NotificationType) else self.type,
            "priority": self.priority.value if isinstance(self.priority, NotificationPriority) else self.priority,
            "title": self.title,
            "message": self.message,
            "user_id": self.user_id,
            "entity_id": self.entity_id,
            "read": self.read,
            "actioned": self.actioned,
            "action_url": self.action_url,
            "due_date": self.due_date,
            "created_at": self.created_at,
        }


class NotificationEngine:
    """Manages notifications and generates alerts from system events."""

    def __init__(self):
        self._notifications: list[Notification] = []

    def create(self, **kwargs) -> Notification:
        """Create a notification."""
        if "type" in kwargs and isinstance(kwargs["type"], str):
            kwargs["type"] = NotificationType(kwargs["type"])
        if "priority" in kwargs and isinstance(kwargs["priority"], str):
            kwargs["priority"] = NotificationPriority(kwargs["priority"])

        notif = Notification(**kwargs)
        self._notifications.append(notif)
        return notif

    def mark_read(self, notification_id: str) -> bool:
        for n in self._notifications:
            if n.id == notification_id:
                n.read = True
                return True
        return False

    def mark_actioned(self, notification_id: str) -> bool:
        for n in self._notifications:
            if n.id == notification_id:
                n.actioned = True
                n.read = True
                return True
        return False

    def get_for_user(self, user_id: str, unread_only: bool = False) -> list[Notification]:
        results = [n for n in self._notifications if n.user_id == user_id]
        if unread_only:
            results = [n for n in results if not n.read]
        return sorted(results, key=lambda n: n.created_at, reverse=True)

    def get_for_entity(self, entity_id: str) -> list[Notification]:
        return [n for n in self._notifications if n.entity_id == entity_id]

    # ── Alert Generators ─────────────────────────────────────

    def generate_deadline_alerts(
        self,
        deadlines: list[dict],
        user_id: str,
        days_before: list[int] | None = None,
    ) -> list[Notification]:
        """Generate alerts for upcoming deadlines.

        Args:
            deadlines: [{name, due_date, type, entity_id?}]
            user_id: who to notify
            days_before: alert X days before (default: [1, 3, 7, 14])
        """
        if days_before is None:
            days_before = [1, 3, 7, 14]

        today = date.today()
        alerts = []

        for deadline in deadlines:
            due_str = deadline.get("due_date", "")
            if not due_str or not due_str[0].isdigit():
                continue

            try:
                due = date.fromisoformat(due_str[:10])
            except ValueError:
                continue

            days_until = (due - today).days

            for threshold in days_before:
                if days_until == threshold:
                    priority = NotificationPriority.URGENT if threshold <= 1 else NotificationPriority.HIGH if threshold <= 3 else NotificationPriority.MEDIUM

                    alert = self.create(
                        type=NotificationType.DEADLINE,
                        priority=priority,
                        title=f"{deadline.get('name', 'Deadline')} — {threshold} day{'s' if threshold != 1 else ''} away",
                        message=f"{deadline.get('name', 'Deadline')} is due on {due_str}. Penalty: {deadline.get('penalty', 'See legislation')}.",
                        user_id=user_id,
                        entity_id=deadline.get("entity_id", ""),
                        due_date=due_str,
                    )
                    alerts.append(alert)

                if days_until < 0:
                    alert = self.create(
                        type=NotificationType.DEADLINE,
                        priority=NotificationPriority.URGENT,
                        title=f"OVERDUE: {deadline.get('name', 'Deadline')}",
                        message=f"{deadline.get('name', 'Deadline')} was due {abs(days_until)} days ago on {due_str}.",
                        user_id=user_id,
                        entity_id=deadline.get("entity_id", ""),
                        due_date=due_str,
                    )
                    alerts.append(alert)
                    break  # Only one overdue alert per deadline

        return alerts

    def generate_review_alerts(self, pending_count: int, user_id: str, entity_id: str = "") -> Notification | None:
        """Alert when transactions are waiting for review."""
        if pending_count == 0:
            return None

        priority = NotificationPriority.HIGH if pending_count > 10 else NotificationPriority.MEDIUM

        return self.create(
            type=NotificationType.REVIEW,
            priority=priority,
            title=f"{pending_count} transactions pending review",
            message=f"There are {pending_count} AI-drafted transactions waiting for your approval.",
            user_id=user_id,
            entity_id=entity_id,
            action_url="/review",
        )

    def generate_anomaly_alert(self, anomaly: dict, user_id: str, entity_id: str = "") -> Notification:
        """Alert when forensic/audit engines detect something unusual."""
        return self.create(
            type=NotificationType.ANOMALY,
            priority=NotificationPriority.HIGH,
            title=f"Anomaly detected: {anomaly.get('type', 'Unknown')}",
            message=anomaly.get("description", "An unusual pattern was detected in the data."),
            user_id=user_id,
            entity_id=entity_id,
        )

    def summary(self, user_id: str) -> dict:
        """Notification summary for a user."""
        user_notifs = [n for n in self._notifications if n.user_id == user_id]
        unread = [n for n in user_notifs if not n.read]

        by_type = {}
        for n in unread:
            t = n.type.value if isinstance(n.type, NotificationType) else n.type
            by_type[t] = by_type.get(t, 0) + 1

        return {
            "total": len(user_notifs),
            "unread": len(unread),
            "by_type": by_type,
            "urgent": sum(1 for n in unread if n.priority == NotificationPriority.URGENT),
        }

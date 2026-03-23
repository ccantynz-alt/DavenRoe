"""Audit trail helper — call from any route to log actions."""

from app.auditlog.trail import AuditTrail

# Shared singleton instance
_trail = AuditTrail()


def get_trail() -> AuditTrail:
    return _trail


def audit_log(
    user_id: str,
    user_name: str,
    action: str,
    resource_type: str,
    resource_id: str = "",
    entity_id: str = "",
    description: str = "",
    before_state: dict | None = None,
    after_state: dict | None = None,
    ip_address: str = "",
):
    """Log an audit event from any route handler."""
    return _trail.log(
        user_id=user_id,
        user_name=user_name,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        entity_id=entity_id,
        description=description,
        before_state=before_state,
        after_state=after_state,
        ip_address=ip_address,
    )

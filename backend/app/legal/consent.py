"""User consent and acceptance tracking.

Before a user can act on AI outputs or forensic findings,
they must explicitly acknowledge the disclaimers. This creates
a legally defensible record of informed consent.
"""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel


class ConsentType(str, Enum):
    TERMS_OF_SERVICE = "terms_of_service"
    AI_DISCLOSURE = "ai_disclosure"
    PRIVACY_POLICY = "privacy_policy"
    FORENSIC_DISCLAIMER = "forensic_disclaimer"
    TAX_DISCLAIMER = "tax_disclaimer"


class ConsentRecord(BaseModel):
    """Record of a user accepting a disclaimer/ToS.

    Stored immutably — once accepted, the record cannot be modified.
    This is our proof that the user was informed.
    """
    user_id: str
    consent_type: ConsentType
    version: str  # version of the document accepted
    accepted_at: datetime
    ip_address: str | None = None
    user_agent: str | None = None


class ConsentGate:
    """Checks whether a user has accepted required disclaimers
    before allowing access to specific features.

    Usage:
        gate = ConsentGate()

        # Before showing forensic results
        if not gate.has_consent(user_id, ConsentType.FORENSIC_DISCLAIMER):
            return {"error": "Must accept forensic disclaimer", "redirect": "/consent/forensic"}
    """

    # Which consents are required for which features
    REQUIRED_CONSENTS = {
        "forensic": [ConsentType.TERMS_OF_SERVICE, ConsentType.FORENSIC_DISCLAIMER],
        "ai": [ConsentType.TERMS_OF_SERVICE, ConsentType.AI_DISCLOSURE],
        "tax": [ConsentType.TERMS_OF_SERVICE, ConsentType.TAX_DISCLAIMER],
        "general": [ConsentType.TERMS_OF_SERVICE, ConsentType.PRIVACY_POLICY],
    }

    def __init__(self):
        # In production, this queries the database
        self._consents: dict[str, set[ConsentType]] = {}

    def record_consent(self, user_id: str, consent_type: ConsentType, ip_address: str | None = None) -> ConsentRecord:
        """Record that a user accepted a disclaimer."""
        self._consents.setdefault(user_id, set()).add(consent_type)
        return ConsentRecord(
            user_id=user_id,
            consent_type=consent_type,
            version="2026.03",
            accepted_at=datetime.utcnow(),
            ip_address=ip_address,
        )

    def has_consent(self, user_id: str, consent_type: ConsentType) -> bool:
        """Check if user has accepted a specific disclaimer."""
        return consent_type in self._consents.get(user_id, set())

    def check_feature_access(self, user_id: str, feature: str) -> dict:
        """Check if user has all required consents for a feature."""
        required = self.REQUIRED_CONSENTS.get(feature, [ConsentType.TERMS_OF_SERVICE])
        missing = [c for c in required if not self.has_consent(user_id, c)]

        return {
            "allowed": len(missing) == 0,
            "missing_consents": [c.value for c in missing],
            "feature": feature,
        }

"""Tests for legal protection framework."""

from app.legal.disclaimers import get_disclaimer, wrap_response
from app.legal.consent import ConsentGate, ConsentType


def test_ai_disclaimer():
    disclaimer = get_disclaimer("ai")
    assert "not constitute professional" in disclaimer.lower() or "draft" in disclaimer.lower()
    assert "human review" in disclaimer.lower()


def test_tax_disclaimer():
    disclaimer = get_disclaimer("tax")
    assert "not constitute tax advice" in disclaimer.lower() or "tax advice" in disclaimer.lower()


def test_forensic_disclaimer():
    disclaimer = get_disclaimer("forensic")
    assert "investigative aids" in disclaimer.lower()
    assert "do not prove" in disclaimer.lower() or "independently verified" in disclaimer.lower()


def test_due_diligence_disclaimer():
    disclaimer = get_disclaimer("due_diligence")
    assert "screening tool" in disclaimer.lower() or "preliminary" in disclaimer.lower()


def test_wrap_response_adds_legal():
    data = {"result": "some tax calculation"}
    wrapped = wrap_response(data, "tax", ai_generated=False)
    assert "_legal" in wrapped
    assert wrapped["_legal"]["output_type"] == "tax"
    assert wrapped["_legal"]["ai_generated"] is False


def test_wrap_response_ai_requires_review():
    data = {"result": "categorization"}
    wrapped = wrap_response(data, "ai", ai_generated=True)
    assert wrapped["_legal"]["requires_human_review"] is True
    assert wrapped["_legal"]["ai_generated"] is True
    assert wrapped["_legal"]["liability_accepted"] is False


def test_wrap_response_forensic_requires_review():
    wrapped = wrap_response({}, "forensic", ai_generated=False)
    assert wrapped["_legal"]["requires_human_review"] is True


def test_consent_gate_record_and_check():
    gate = ConsentGate()
    gate.record_consent("user1", ConsentType.TERMS_OF_SERVICE)
    assert gate.has_consent("user1", ConsentType.TERMS_OF_SERVICE)
    assert not gate.has_consent("user1", ConsentType.AI_DISCLOSURE)


def test_consent_gate_feature_access_blocked():
    gate = ConsentGate()
    # User hasn't consented to anything
    result = gate.check_feature_access("user1", "forensic")
    assert result["allowed"] is False
    assert "terms_of_service" in result["missing_consents"]
    assert "forensic_disclaimer" in result["missing_consents"]


def test_consent_gate_feature_access_granted():
    gate = ConsentGate()
    gate.record_consent("user1", ConsentType.TERMS_OF_SERVICE)
    gate.record_consent("user1", ConsentType.FORENSIC_DISCLAIMER)
    result = gate.check_feature_access("user1", "forensic")
    assert result["allowed"] is True
    assert result["missing_consents"] == []

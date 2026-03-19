"""Tests for the audit agent risk scoring."""

from decimal import Decimal

from app.agents.auditor import AuditAgent


def test_low_risk_transaction():
    agent = AuditAgent()
    result = agent.assess_transaction(
        amount=Decimal("50"),
        description="Office supplies from Staples",
        jurisdiction="US",
    )
    assert result["risk_score"] < 20
    assert result["risk_level"] == "low"
    assert result["requires_review"] is False


def test_large_transaction_flagged():
    agent = AuditAgent()
    result = agent.assess_transaction(
        amount=Decimal("15000"),
        description="Consulting payment to vendor",
        jurisdiction="US",
    )
    assert result["risk_score"] >= 25
    assert any(f["rule"] == "large_transaction" for f in result["flags"])


def test_just_under_threshold():
    agent = AuditAgent()
    result = agent.assess_transaction(
        amount=Decimal("9800"),
        description="Wire transfer",
        jurisdiction="US",
    )
    assert any(f["rule"] == "just_under_threshold" for f in result["flags"])


def test_vague_description():
    agent = AuditAgent()
    result = agent.assess_transaction(
        amount=Decimal("500"),
        description="misc",
        jurisdiction="AU",
    )
    assert any(f["rule"] == "vague_description" for f in result["flags"])


def test_cross_border_flagged():
    agent = AuditAgent()
    result = agent.assess_transaction(
        amount=Decimal("5000"),
        description="Payment to overseas contractor",
        jurisdiction="AU",
        is_cross_border=True,
    )
    assert any(f["rule"] == "cross_border" for f in result["flags"])


def test_related_party():
    agent = AuditAgent()
    result = agent.assess_transaction(
        amount=Decimal("20000"),
        description="Loan repayment",
        jurisdiction="NZ",
        counterparty="Director J. Smith",
    )
    assert any(f["rule"] == "related_party" for f in result["flags"])
    assert result["requires_review"] is True

"""Forensic Accounting & M&A Due Diligence models.

A Case represents a due diligence engagement. Findings are individual
flags discovered during analysis. Reports are generated summaries.

Evidence chain is immutable — every finding links to source data.
"""

import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ForensicCase(Base):
    """A due diligence engagement / forensic investigation."""
    __tablename__ = "forensic_cases"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    case_type: Mapped[str] = mapped_column(String(50), nullable=False)
    # ma_due_diligence, fraud_investigation, audit_support, litigation_support
    client_entity_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("entities.id"))
    target_entity_name: Mapped[str] = mapped_column(String(255), nullable=False)
    target_jurisdiction: Mapped[str | None] = mapped_column(String(10))
    status: Mapped[str] = mapped_column(String(30), default="open")
    # open, in_progress, review, closed, archived
    priority: Mapped[str] = mapped_column(String(20), default="normal")
    # low, normal, high, critical
    assigned_to: Mapped[str | None] = mapped_column(String(255))

    # Analysis scope
    analysis_period_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    analysis_period_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    data_sources: Mapped[dict | None] = mapped_column(JSONB)
    # {"bank_statements": 36, "tax_filings": 3, "payroll_records": 36, ...}

    # Results summary
    overall_risk_score: Mapped[int | None] = mapped_column()  # 0-100
    total_findings: Mapped[int] = mapped_column(Integer, default=0)
    critical_findings: Mapped[int] = mapped_column(Integer, default=0)
    estimated_exposure: Mapped[Decimal | None] = mapped_column(Numeric(19, 4))

    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    findings: Mapped[list["ForensicFinding"]] = relationship(back_populates="case", cascade="all, delete-orphan")


class ForensicFinding(Base):
    """An individual finding from forensic analysis.

    Every finding is linked to the engine that generated it and includes
    the raw evidence data — immutable audit trail.
    """
    __tablename__ = "forensic_findings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("forensic_cases.id"), nullable=False)
    finding_number: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    # benfords_violation, amount_outlier, timing_anomaly, ghost_vendor,
    # ghost_employee, payroll_mismatch, payment_splitting, circular_transaction,
    # vendor_concentration, revenue_concentration, round_number_bias
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    # low, medium, high, critical
    engine: Mapped[str] = mapped_column(String(50), nullable=False)
    # benfords, anomaly_detector, vendor_verifier, payroll_crossref, money_trail

    description: Mapped[str] = mapped_column(Text, nullable=False)
    impact: Mapped[str | None] = mapped_column(Text)  # financial/legal impact
    recommendation: Mapped[str | None] = mapped_column(Text)
    estimated_amount: Mapped[Decimal | None] = mapped_column(Numeric(19, 4))

    # Evidence (immutable)
    evidence_data: Mapped[dict | None] = mapped_column(JSONB)
    # Raw output from the engine — cannot be altered after creation
    source_transactions: Mapped[dict | None] = mapped_column(JSONB)
    # IDs/refs of transactions that triggered this finding

    # Review workflow
    is_confirmed: Mapped[bool | None] = mapped_column(Boolean)  # None=unreviewed, True=confirmed, False=false positive
    reviewer_notes: Mapped[str | None] = mapped_column(Text)
    reviewed_by: Mapped[str | None] = mapped_column(String(255))
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    case: Mapped["ForensicCase"] = relationship(back_populates="findings")


class ForensicReport(Base):
    """Generated due diligence report."""
    __tablename__ = "forensic_reports"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("forensic_cases.id"), nullable=False)
    report_type: Mapped[str] = mapped_column(String(50), nullable=False)
    # executive_summary, detailed_findings, financial_health_audit, risk_assessment
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)  # markdown
    ai_generated: Mapped[bool] = mapped_column(Boolean, default=True)
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

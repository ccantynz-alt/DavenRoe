"""Document model for persistent document storage."""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_id: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    filename: Mapped[str] = mapped_column(String(500), nullable=False)
    content_type: Mapped[str] = mapped_column(String(100), nullable=False, default="application/pdf")
    doc_type: Mapped[str] = mapped_column(String(50), nullable=False, default="other")
    description: Mapped[str] = mapped_column(Text, default="")
    tags: Mapped[dict | None] = mapped_column(JSONB, default=list)
    document_date: Mapped[str | None] = mapped_column(String(20))
    file_size: Mapped[int] = mapped_column(Integer, default=0)
    file_hash: Mapped[str | None] = mapped_column(String(64))
    ocr_text: Mapped[str | None] = mapped_column(Text)
    ocr_confidence: Mapped[float | None] = mapped_column(default=None)
    ocr_extracted: Mapped[dict | None] = mapped_column(JSONB)
    linked_transaction_id: Mapped[str | None] = mapped_column(String(50))
    status: Mapped[str] = mapped_column(String(20), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class TaxReturn(Base):
    __tablename__ = "tax_returns"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_id: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    return_type: Mapped[str] = mapped_column(String(30), nullable=False)
    jurisdiction: Mapped[str] = mapped_column(String(10), nullable=False)
    period_start: Mapped[str] = mapped_column(String(20), nullable=False)
    period_end: Mapped[str] = mapped_column(String(20), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="draft")
    total_revenue: Mapped[str | None] = mapped_column(String(30))
    total_tax: Mapped[str | None] = mapped_column(String(30))
    data: Mapped[dict | None] = mapped_column(JSONB)
    validation_results: Mapped[dict | None] = mapped_column(JSONB)
    lodged_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    lodged_reference: Mapped[str | None] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

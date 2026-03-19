"""Transaction and journal entry models.

Every financial event is a Transaction with two or more TransactionLines
(double-entry). The AI agent drafts these; humans approve them.
"""

import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("entities.id"), nullable=False)
    transaction_date: Mapped[date] = mapped_column(Date, nullable=False)
    posted_date: Mapped[date | None] = mapped_column(Date)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    reference: Mapped[str | None] = mapped_column(String(100))  # invoice #, check #, etc.
    transaction_type: Mapped[str] = mapped_column(String(30), nullable=False)
    # journal, invoice, bill, payment, transfer, bank_feed, adjustment
    source: Mapped[str] = mapped_column(String(30), default="manual")
    # manual, bank_feed, ai_draft, import, api
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    exchange_rate: Mapped[Decimal] = mapped_column(Numeric(15, 8), default=Decimal("1.0"))
    total_amount: Mapped[Decimal] = mapped_column(Numeric(19, 4), nullable=False)

    # AI workflow fields
    status: Mapped[str] = mapped_column(String(20), default="draft")
    # draft, pending_review, approved, posted, void
    ai_confidence: Mapped[Decimal | None] = mapped_column(Numeric(5, 4))  # 0.0000 to 1.0000
    ai_reasoning: Mapped[str | None] = mapped_column(Text)  # why the AI categorized it this way
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Compliance
    tax_jurisdiction: Mapped[str | None] = mapped_column(String(10))
    risk_score: Mapped[int | None] = mapped_column()  # 0-100, for audit flagging
    risk_flags: Mapped[dict | None] = mapped_column(JSONB)

    # Reconciliation
    bank_transaction_id: Mapped[str | None] = mapped_column(String(100))
    invoice_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("invoices.id"))
    is_reconciled: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    lines: Mapped[list["TransactionLine"]] = relationship(back_populates="transaction", cascade="all, delete-orphan")
    invoice: Mapped["Invoice | None"] = relationship(back_populates="transactions")  # noqa: F821


class TransactionLine(Base):
    """Individual debit/credit line in a journal entry."""
    __tablename__ = "transaction_lines"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    transaction_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("transactions.id"), nullable=False)
    account_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("accounts.id"), nullable=False)
    debit: Mapped[Decimal] = mapped_column(Numeric(19, 4), default=Decimal("0"))
    credit: Mapped[Decimal] = mapped_column(Numeric(19, 4), default=Decimal("0"))
    description: Mapped[str | None] = mapped_column(String(500))
    tax_code: Mapped[str | None] = mapped_column(String(20))
    tax_amount: Mapped[Decimal] = mapped_column(Numeric(19, 4), default=Decimal("0"))
    foreign_amount: Mapped[Decimal | None] = mapped_column(Numeric(19, 4))  # amount in foreign currency
    foreign_currency: Mapped[str | None] = mapped_column(String(3))

    # Relationships
    transaction: Mapped["Transaction"] = relationship(back_populates="lines")
    account: Mapped["Account"] = relationship(back_populates="transaction_lines")  # noqa: F821

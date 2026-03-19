"""Invoice model for accounts receivable and payable.

Invoices are central to the 3-Way Matching system:
Bank Statement + Invoice + Purchase Order.
"""

import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("entities.id"), nullable=False)
    invoice_number: Mapped[str] = mapped_column(String(50), nullable=False)
    direction: Mapped[str] = mapped_column(String(10), nullable=False)  # receivable, payable
    counterparty_name: Mapped[str] = mapped_column(String(255), nullable=False)
    counterparty_entity_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("entities.id"))
    counterparty_jurisdiction: Mapped[str | None] = mapped_column(String(10))

    issue_date: Mapped[date] = mapped_column(Date, nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    subtotal: Mapped[Decimal] = mapped_column(Numeric(19, 4), nullable=False)
    tax_amount: Mapped[Decimal] = mapped_column(Numeric(19, 4), default=Decimal("0"))
    total: Mapped[Decimal] = mapped_column(Numeric(19, 4), nullable=False)
    amount_paid: Mapped[Decimal] = mapped_column(Numeric(19, 4), default=Decimal("0"))
    status: Mapped[str] = mapped_column(String(20), default="draft")
    # draft, sent, partially_paid, paid, overdue, void

    # Cross-border fields
    withholding_tax_rate: Mapped[Decimal | None] = mapped_column(Numeric(7, 4))
    withholding_tax_amount: Mapped[Decimal | None] = mapped_column(Numeric(19, 4))
    treaty_applied: Mapped[str | None] = mapped_column(String(20))  # e.g., "US-NZ"
    tax_details: Mapped[dict | None] = mapped_column(JSONB)  # full breakdown

    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    lines: Mapped[list["InvoiceLine"]] = relationship(back_populates="invoice", cascade="all, delete-orphan")
    transactions: Mapped[list["Transaction"]] = relationship(back_populates="invoice")  # noqa: F821


class InvoiceLine(Base):
    __tablename__ = "invoice_lines"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("invoices.id"), nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("1"))
    unit_price: Mapped[Decimal] = mapped_column(Numeric(19, 4), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(19, 4), nullable=False)
    tax_code: Mapped[str | None] = mapped_column(String(20))
    tax_rate: Mapped[Decimal | None] = mapped_column(Numeric(7, 4))
    tax_amount: Mapped[Decimal] = mapped_column(Numeric(19, 4), default=Decimal("0"))
    account_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("accounts.id"))

    invoice: Mapped["Invoice"] = relationship(back_populates="lines")

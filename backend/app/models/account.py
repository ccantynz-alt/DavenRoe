"""Chart of Accounts model.

Implements a flexible double-entry chart of accounts that supports
multi-currency and multi-jurisdiction reporting.
"""

import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("entities.id"), nullable=False)
    code: Mapped[str] = mapped_column(String(20), nullable=False)  # e.g., 1000, 2100, 4000
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    account_type: Mapped[str] = mapped_column(String(30), nullable=False)
    # asset, liability, equity, revenue, expense, contra_asset, contra_revenue
    account_subtype: Mapped[str | None] = mapped_column(String(50))
    # bank, accounts_receivable, accounts_payable, tax_payable, retained_earnings, etc.
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    parent_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("accounts.id"))
    tax_code: Mapped[str | None] = mapped_column(String(20))  # GST, VAT, SALES_TAX, EXEMPT
    description: Mapped[str | None] = mapped_column(String(500))
    is_system: Mapped[bool] = mapped_column(Boolean, default=False)  # system-generated, non-deletable
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    balance: Mapped[Decimal] = mapped_column(Numeric(19, 4), default=Decimal("0"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    entity: Mapped["Entity"] = relationship(back_populates="accounts")  # noqa: F821
    children: Mapped[list["Account"]] = relationship(back_populates="parent")
    parent: Mapped["Account | None"] = relationship(back_populates="children", remote_side=[id])
    transaction_lines: Mapped[list["TransactionLine"]] = relationship(back_populates="account")  # noqa: F821

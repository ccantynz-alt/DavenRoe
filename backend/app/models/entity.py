"""Business entity and nexus models.

An Entity is a business (company, sole trader, etc.).
EntityJurisdiction tracks where an entity has tax nexus — the legal concept
that determines which governments can tax them.
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Entity(Base):
    __tablename__ = "entities"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    legal_name: Mapped[str] = mapped_column(String(255), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)  # company, sole_trader, partnership, trust
    primary_currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    tax_id: Mapped[str | None] = mapped_column(String(50))  # EIN, ABN, IRD number
    tax_id_type: Mapped[str | None] = mapped_column(String(20))  # EIN, ABN, NZBN
    email: Mapped[str | None] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(50))
    address: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    jurisdictions: Mapped[list["EntityJurisdiction"]] = relationship(back_populates="entity", cascade="all, delete-orphan")
    accounts: Mapped[list["Account"]] = relationship(back_populates="entity", cascade="all, delete-orphan")  # noqa: F821


class EntityJurisdiction(Base):
    """Tracks where an entity has tax nexus (is legally taxable)."""
    __tablename__ = "entity_jurisdictions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("entities.id"), nullable=False)
    jurisdiction_code: Mapped[str] = mapped_column(String(10), nullable=False)  # US, AU, NZ, US-CA, AU-NSW
    tax_registration_id: Mapped[str | None] = mapped_column(String(50))  # state/country-specific tax ID
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)
    nexus_type: Mapped[str] = mapped_column(String(30), default="physical")  # physical, economic, voluntary
    effective_from: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    effective_to: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    entity: Mapped["Entity"] = relationship(back_populates="jurisdictions")

"""Tax jurisdiction, rate, and treaty models.

This is the DETERMINISTIC layer — hard-coded tax law logic.
No AI guessing here. Tax math uses published rates and rules only.
"""

import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Boolean, Date, DateTime, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class TaxJurisdiction(Base):
    """A taxing authority (country or sub-national)."""
    __tablename__ = "tax_jurisdictions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(10), unique=True, nullable=False)  # US, AU, NZ, GB, US-CA
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    country_code: Mapped[str] = mapped_column(String(2), nullable=False)  # ISO 3166-1 alpha-2
    level: Mapped[str] = mapped_column(String(20), nullable=False)  # federal, state, local
    currency: Mapped[str] = mapped_column(String(3), nullable=False)
    tax_year_start_month: Mapped[int] = mapped_column(default=1)  # AU = 7 (July), US = 1, NZ = 4
    tax_year_start_day: Mapped[int] = mapped_column(default=1)
    filing_portal_url: Mapped[str | None] = mapped_column(String(500))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSONB)


class TaxRate(Base):
    """Tax rates for a jurisdiction, effective over a date range.

    Supports income tax brackets, GST/VAT, WHT, corporate tax, etc.
    """
    __tablename__ = "tax_rates"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    jurisdiction_code: Mapped[str] = mapped_column(String(10), nullable=False)
    tax_type: Mapped[str] = mapped_column(String(30), nullable=False)
    # income_tax, corporate_tax, gst, vat, sales_tax, withholding_tax, capital_gains
    rate: Mapped[Decimal] = mapped_column(Numeric(7, 4), nullable=False)  # e.g., 0.1500 = 15%
    bracket_min: Mapped[Decimal | None] = mapped_column(Numeric(19, 4))  # for progressive brackets
    bracket_max: Mapped[Decimal | None] = mapped_column(Numeric(19, 4))
    applies_to: Mapped[str] = mapped_column(String(30), default="all")
    # all, resident, non_resident, company, individual
    effective_from: Mapped[date] = mapped_column(Date, nullable=False)
    effective_to: Mapped[date | None] = mapped_column(Date)
    description: Mapped[str | None] = mapped_column(String(500))
    legislation_ref: Mapped[str | None] = mapped_column(String(500))  # link to the actual law


class TaxTreaty(Base):
    """Double Tax Agreement (DTA) between two countries.

    Based on OECD Model Tax Convention. Determines WHT rates,
    permanent establishment thresholds, and tiebreaker rules.
    """
    __tablename__ = "tax_treaties"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    country_a: Mapped[str] = mapped_column(String(2), nullable=False)  # ISO alpha-2
    country_b: Mapped[str] = mapped_column(String(2), nullable=False)
    treaty_name: Mapped[str] = mapped_column(String(255), nullable=False)
    signed_date: Mapped[date | None] = mapped_column(Date)
    effective_date: Mapped[date | None] = mapped_column(Date)

    # Withholding tax rates under treaty (override domestic rates)
    wht_dividends: Mapped[Decimal | None] = mapped_column(Numeric(7, 4))  # e.g., 0.15
    wht_interest: Mapped[Decimal | None] = mapped_column(Numeric(7, 4))
    wht_royalties: Mapped[Decimal | None] = mapped_column(Numeric(7, 4))
    wht_services: Mapped[Decimal | None] = mapped_column(Numeric(7, 4))  # technical/management fees

    # Permanent establishment threshold (days)
    pe_threshold_days: Mapped[int | None] = mapped_column()

    # Full treaty details
    treaty_details: Mapped[dict | None] = mapped_column(JSONB)
    source_url: Mapped[str | None] = mapped_column(String(500))
    notes: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

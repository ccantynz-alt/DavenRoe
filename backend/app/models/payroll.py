"""Payroll models — Employee, PayRun, PaySlip.

Supports multi-jurisdiction payroll across AU, NZ, GB, and US with
tax withholding, superannuation/pension, and leave tracking.
"""

import uuid
from datetime import date, datetime

from sqlalchemy import (
    Boolean, Date, DateTime, ForeignKey, Numeric, String, Text, func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Employee(Base):
    """An employee (or contractor) attached to a business entity."""
    __tablename__ = "payroll_employees"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("entities.id"), nullable=False, index=True,
    )
    employee_code: Mapped[str] = mapped_column(String(20), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    termination_date: Mapped[date | None] = mapped_column(Date)
    employment_type: Mapped[str] = mapped_column(
        String(20), nullable=False, default="full_time",
    )  # full_time, part_time, casual, contractor
    pay_frequency: Mapped[str] = mapped_column(
        String(20), nullable=False, default="monthly",
    )  # weekly, fortnightly, monthly
    base_salary: Mapped[float | None] = mapped_column(Numeric(14, 2))
    hourly_rate: Mapped[float | None] = mapped_column(Numeric(8, 2))
    tax_file_number: Mapped[str | None] = mapped_column(
        Text,
    )  # encrypted at application level
    superannuation_rate: Mapped[float] = mapped_column(
        Numeric(5, 2), nullable=False, default=11.5,
    )
    leave_balances: Mapped[dict | None] = mapped_column(JSONB, default=dict)
    # e.g. {"annual": 160, "sick": 80, "personal": 40}  — stored in hours
    bank_details: Mapped[dict | None] = mapped_column(JSONB, default=dict)
    # e.g. {"bsb": "062-000", "account": "12345678", "name": "John Doe"}
    jurisdiction: Mapped[str] = mapped_column(
        String(10), nullable=False, default="AU",
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )

    # Relationships
    payslips: Mapped[list["PaySlip"]] = relationship(
        back_populates="employee", cascade="all, delete-orphan",
    )


class PayRun(Base):
    """A batch pay run covering one pay period for an entity."""
    __tablename__ = "payroll_pay_runs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("entities.id"), nullable=False, index=True,
    )
    pay_period_start: Mapped[date] = mapped_column(Date, nullable=False)
    pay_period_end: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="draft",
    )  # draft, processing, approved, paid
    total_gross: Mapped[float] = mapped_column(Numeric(14, 2), default=0)
    total_tax: Mapped[float] = mapped_column(Numeric(14, 2), default=0)
    total_super: Mapped[float] = mapped_column(Numeric(14, 2), default=0)
    total_net: Mapped[float] = mapped_column(Numeric(14, 2), default=0)
    approved_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )

    # Relationships
    payslips: Mapped[list["PaySlip"]] = relationship(
        back_populates="pay_run", cascade="all, delete-orphan",
    )


class PaySlip(Base):
    """Individual payslip generated for an employee within a pay run."""
    __tablename__ = "payroll_payslips"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    pay_run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("payroll_pay_runs.id"), nullable=False, index=True,
    )
    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("payroll_employees.id"), nullable=False, index=True,
    )
    hours_worked: Mapped[float] = mapped_column(Numeric(8, 2), default=0)
    gross_pay: Mapped[float] = mapped_column(Numeric(14, 2), default=0)
    tax_withheld: Mapped[float] = mapped_column(Numeric(14, 2), default=0)
    super_contribution: Mapped[float] = mapped_column(Numeric(14, 2), default=0)
    net_pay: Mapped[float] = mapped_column(Numeric(14, 2), default=0)
    deductions: Mapped[dict | None] = mapped_column(JSONB, default=dict)
    # e.g. {"salary_sacrifice": 500, "union_fees": 25}
    allowances: Mapped[dict | None] = mapped_column(JSONB, default=dict)
    # e.g. {"travel": 200, "phone": 50}
    leave_taken: Mapped[dict | None] = mapped_column(JSONB, default=dict)
    # e.g. {"annual": 8, "sick": 0}
    ytd_gross: Mapped[float] = mapped_column(Numeric(14, 2), default=0)
    ytd_tax: Mapped[float] = mapped_column(Numeric(14, 2), default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )

    # Relationships
    pay_run: Mapped["PayRun"] = relationship(back_populates="payslips")
    employee: Mapped["Employee"] = relationship(back_populates="payslips")

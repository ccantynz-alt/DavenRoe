"""Pydantic schemas for Transaction API."""

import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class TransactionLineCreate(BaseModel):
    account_id: uuid.UUID
    debit: Decimal = Decimal("0")
    credit: Decimal = Decimal("0")
    description: str | None = None
    tax_code: str | None = None
    tax_amount: Decimal = Decimal("0")
    foreign_amount: Decimal | None = None
    foreign_currency: str | None = None


class TransactionCreate(BaseModel):
    entity_id: uuid.UUID
    transaction_date: date
    description: str = Field(..., max_length=500)
    reference: str | None = None
    transaction_type: str = Field(default="journal", examples=["journal", "invoice", "bill", "payment", "transfer", "bank_feed"])
    currency: str = Field(default="USD", max_length=3)
    exchange_rate: Decimal = Decimal("1.0")
    total_amount: Decimal
    tax_jurisdiction: str | None = None
    lines: list[TransactionLineCreate] = Field(..., min_length=2)


class TransactionLineOut(BaseModel):
    id: uuid.UUID
    account_id: uuid.UUID
    debit: Decimal
    credit: Decimal
    description: str | None
    tax_code: str | None
    tax_amount: Decimal

    model_config = {"from_attributes": True}


class TransactionOut(BaseModel):
    id: uuid.UUID
    entity_id: uuid.UUID
    transaction_date: date
    description: str
    reference: str | None
    transaction_type: str
    source: str
    currency: str
    total_amount: Decimal
    status: str
    ai_confidence: Decimal | None
    ai_reasoning: str | None
    risk_score: int | None
    is_reconciled: bool
    created_at: datetime
    lines: list[TransactionLineOut] = []

    model_config = {"from_attributes": True}


class TransactionApproval(BaseModel):
    action: str = Field(..., examples=["approve", "flag", "void"])
    reason: str | None = None

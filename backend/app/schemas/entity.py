"""Pydantic schemas for Entity API."""

import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class EntityJurisdictionCreate(BaseModel):
    jurisdiction_code: str = Field(..., max_length=10, examples=["US", "AU", "NZ", "GB"])
    tax_registration_id: str | None = None
    is_primary: bool = False
    nexus_type: str = "physical"
    effective_from: datetime


class EntityCreate(BaseModel):
    name: str = Field(..., max_length=255)
    legal_name: str = Field(..., max_length=255)
    entity_type: str = Field(..., examples=["company", "sole_trader", "partnership", "trust"])
    primary_currency: str = Field(default="USD", max_length=3)
    tax_id: str | None = None
    tax_id_type: str | None = None
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    jurisdictions: list[EntityJurisdictionCreate] = []


class EntityUpdate(BaseModel):
    name: str | None = None
    legal_name: str | None = None
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    primary_currency: str | None = None
    is_active: bool | None = None


class EntityJurisdictionOut(BaseModel):
    id: uuid.UUID
    jurisdiction_code: str
    tax_registration_id: str | None
    is_primary: bool
    nexus_type: str
    effective_from: datetime
    effective_to: datetime | None

    model_config = {"from_attributes": True}


class EntityOut(BaseModel):
    id: uuid.UUID
    name: str
    legal_name: str
    entity_type: str
    primary_currency: str
    tax_id: str | None
    tax_id_type: str | None
    email: str | None
    is_active: bool
    created_at: datetime
    jurisdictions: list[EntityJurisdictionOut] = []

    model_config = {"from_attributes": True}

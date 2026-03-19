"""Pydantic schemas for Tax API."""

from decimal import Decimal
from pydantic import BaseModel, Field


class GSTCalculationRequest(BaseModel):
    jurisdiction: str = Field(..., examples=["AU", "NZ", "GB"])
    net_amount: Decimal


class CrossBorderWHTRequest(BaseModel):
    gross_amount: Decimal
    payer_country: str = Field(..., examples=["US", "AU", "NZ", "GB"])
    payee_country: str = Field(..., examples=["US", "AU", "NZ", "GB"])
    income_type: str = Field(default="services", examples=["dividends", "interest", "royalties", "services"])


class IncomeTaxRequest(BaseModel):
    jurisdiction: str = Field(..., examples=["US", "AU", "NZ", "GB"])
    taxable_income: Decimal
    applies_to: str = Field(default="resident", examples=["resident", "non_resident", "individual_single"])


class TransactionTaxAnalysisRequest(BaseModel):
    amount: Decimal
    source_jurisdiction: str
    target_jurisdiction: str | None = None
    transaction_type: str = "expense"
    income_type: str = "services"


class NaturalLanguageQuery(BaseModel):
    query: str = Field(..., examples=[
        "How much did I spend on SaaS in Sydney last month vs. San Francisco?",
        "What's my GST liability for this quarter?",
        "Summarize my cash flow for the last 90 days.",
    ])
    entity_id: str | None = None

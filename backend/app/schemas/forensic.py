"""Pydantic schemas for Forensic Accounting API."""

from decimal import Decimal
from pydantic import BaseModel, Field


class BenfordsRequest(BaseModel):
    amounts: list[str | float] = Field(..., min_length=10, description="List of financial amounts to analyze")


class AnomalyScanRequest(BaseModel):
    transactions: list[dict] = Field(..., min_length=5, description="Transactions with 'amount', 'date', 'description' fields")


class VendorVerificationRequest(BaseModel):
    vendors: list[dict] = Field(..., description="Vendors with 'name', 'tax_id', 'address', 'phone', 'email'")
    employees: list[dict] = Field(default=[], description="Employees for cross-reference")
    transactions: list[dict] = Field(default=[], description="Transactions for concentration analysis")


class PayrollCrossRefRequest(BaseModel):
    payroll_records: list[dict] = Field(..., description="Payroll records with 'employee_id', 'gross_pay', 'tax_withheld', 'period'")
    tax_filings: list[dict] = Field(default=[], description="Tax filings with 'period', 'total_gross', 'total_tax_withheld'")


class FullDueDiligenceRequest(BaseModel):
    """Complete data package for a 90-minute Financial Health Audit."""
    target_name: str = Field(..., description="Name of the company being analyzed")
    transactions: list[dict] = Field(default=[], description="3 years of bank statement transactions")
    payroll_records: list[dict] = Field(default=[], description="Payroll records")
    tax_filings: list[dict] = Field(default=[], description="Tax filings")
    vendors: list[dict] = Field(default=[], description="Vendor master list")
    employees: list[dict] = Field(default=[], description="Employee list")

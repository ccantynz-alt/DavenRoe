"""Reporting API routes."""

from datetime import date
from fastapi import APIRouter
from app.reports.engine import ReportingEngine

router = APIRouter(prefix="/reports", tags=["Reports"])
engine = ReportingEngine()


@router.get("/available")
async def available_reports():
    """List all available report types."""
    return {"reports": engine.available_reports()}


@router.post("/generate")
async def generate_report(data: dict):
    """Generate a financial report."""
    start = date.fromisoformat(data["start_date"]) if data.get("start_date") else None
    end = date.fromisoformat(data["end_date"]) if data.get("end_date") else None
    return engine.generate(
        report_type=data.get("report_type", "profit_and_loss"),
        transactions=data.get("transactions", []),
        start_date=start,
        end_date=end,
        comparative=data.get("comparative", False),
        entity_id=data.get("entity_id"),
    )

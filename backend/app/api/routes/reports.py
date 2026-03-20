"""Reporting API routes.

Reports now query the database directly — no more passing
transactions from the frontend.
"""

from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.transaction import Transaction, TransactionLine
from app.models.account import Account
from app.reports.engine import ReportingEngine

router = APIRouter(prefix="/reports", tags=["Reports"])
engine = ReportingEngine()


async def _fetch_transaction_dicts(
    db: AsyncSession,
    entity_id: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
) -> list[dict]:
    """Fetch approved transactions from DB and convert to dicts for the report engine."""
    query = (
        select(Transaction)
        .options(selectinload(Transaction.lines).selectinload(TransactionLine.account))
        .where(Transaction.status.in_(["approved", "posted"]))
    )
    if entity_id:
        import uuid
        query = query.where(Transaction.entity_id == uuid.UUID(entity_id))
    if start_date:
        query = query.where(Transaction.transaction_date >= start_date)
    if end_date:
        query = query.where(Transaction.transaction_date <= end_date)

    result = await db.execute(query)
    transactions = result.scalars().all()

    # Flatten into dicts the report engine expects (one dict per line)
    flat = []
    for txn in transactions:
        for line in txn.lines:
            amount = float(line.debit - line.credit)
            flat.append({
                "date": txn.transaction_date,
                "description": line.description or txn.description,
                "reference": txn.reference or "",
                "account_code": line.account.code if line.account else "",
                "account_name": line.account.name if line.account else "",
                "account": line.account.code if line.account else "",
                "amount": amount,
                "entity_id": str(txn.entity_id),
                "currency": txn.currency,
                "customer": txn.description.split("—")[0].strip() if "—" in txn.description else txn.description,
            })
    return flat


@router.get("/available")
async def available_reports():
    """List all available report types."""
    return {"reports": engine.available_reports()}


@router.post("/generate")
async def generate_report(data: dict, db: AsyncSession = Depends(get_db)):
    """Generate a financial report from real ledger data."""
    start = date.fromisoformat(data["start_date"]) if data.get("start_date") else None
    end = date.fromisoformat(data["end_date"]) if data.get("end_date") else None
    entity_id = data.get("entity_id")

    # Fetch real transactions from the database
    transactions = await _fetch_transaction_dicts(db, entity_id, start, end)

    return engine.generate(
        report_type=data.get("report_type", "profit_and_loss"),
        transactions=transactions,
        start_date=start,
        end_date=end,
        comparative=data.get("comparative", False),
        entity_id=entity_id,
    )


@router.get("/quick/{report_type}")
async def quick_report(
    report_type: str,
    entity_id: str | None = None,
    months: int = Query(default=1, ge=1, le=24),
    db: AsyncSession = Depends(get_db),
):
    """Generate a report with sensible defaults — no body needed."""
    from datetime import timedelta
    end = date.today()
    start = date(end.year, end.month, 1)
    if months > 1:
        # Go back N months
        month = end.month - months + 1
        year = end.year
        while month < 1:
            month += 12
            year -= 1
        start = date(year, month, 1)

    transactions = await _fetch_transaction_dicts(db, entity_id, start, end)

    return engine.generate(
        report_type=report_type,
        transactions=transactions,
        start_date=start,
        end_date=end,
        entity_id=entity_id,
    )

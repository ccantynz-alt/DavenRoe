"""Dashboard API — real-time aggregated stats for the frontend."""

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.transaction import Transaction
from app.models.entity import Entity
from app.models.invoice import Invoice

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    """Aggregate dashboard stats from real database data."""

    # Pending review count
    pending_result = await db.execute(
        select(func.count(Transaction.id)).where(
            Transaction.status.in_(["draft", "pending_review"])
        )
    )
    pending_review = pending_result.scalar() or 0

    # Risk alerts (risk_score >= 40)
    risk_result = await db.execute(
        select(func.count(Transaction.id)).where(
            Transaction.risk_score >= 40,
            Transaction.status.in_(["draft", "pending_review"]),
        )
    )
    risk_alerts = risk_result.scalar() or 0

    # Active entities
    entity_result = await db.execute(
        select(func.count(Entity.id)).where(Entity.is_active == True)  # noqa: E712
    )
    active_entities = entity_result.scalar() or 0

    # Total transactions this month
    from datetime import date
    first_of_month = date.today().replace(day=1)
    month_txn_result = await db.execute(
        select(func.count(Transaction.id)).where(
            Transaction.transaction_date >= first_of_month
        )
    )
    transactions_this_month = month_txn_result.scalar() or 0

    # Approved this month
    approved_result = await db.execute(
        select(func.count(Transaction.id)).where(
            Transaction.status == "approved",
            Transaction.transaction_date >= first_of_month,
        )
    )
    approved_this_month = approved_result.scalar() or 0

    # Outstanding invoices
    outstanding_result = await db.execute(
        select(func.coalesce(func.sum(Invoice.total - Invoice.amount_paid), 0)).where(
            Invoice.status.in_(["sent", "partially_paid", "overdue"])
        )
    )
    outstanding_amount = float(outstanding_result.scalar() or 0)

    # Overdue invoices
    overdue_result = await db.execute(
        select(func.count(Invoice.id)).where(
            Invoice.status == "overdue"
        )
    )
    overdue_count = overdue_result.scalar() or 0

    # Total revenue (paid invoices, receivable direction)
    revenue_result = await db.execute(
        select(func.coalesce(func.sum(Invoice.amount_paid), 0)).where(
            Invoice.direction == "receivable",
            Invoice.amount_paid > 0,
        )
    )
    total_revenue = float(revenue_result.scalar() or 0)

    return {
        "pending_review": pending_review,
        "risk_alerts": risk_alerts,
        "active_entities": active_entities,
        "transactions_this_month": transactions_this_month,
        "approved_this_month": approved_this_month,
        "outstanding_amount": outstanding_amount,
        "overdue_invoices": overdue_count,
        "total_revenue": total_revenue,
        "jurisdictions": 4,  # US, AU, NZ, GB — always 4
    }

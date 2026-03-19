"""Transaction management routes.

Transactions are the core of the ledger. The AI drafts them;
users approve or flag them via the reviewer dashboard.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.agents.auditor import AuditAgent
from app.core.database import get_db
from app.models.transaction import Transaction, TransactionLine
from app.schemas.transaction import TransactionApproval, TransactionCreate, TransactionOut

router = APIRouter(prefix="/transactions", tags=["Transactions"])

auditor = AuditAgent()


@router.post("/", response_model=TransactionOut, status_code=201)
async def create_transaction(data: TransactionCreate, db: AsyncSession = Depends(get_db)):
    """Create a new transaction (journal entry).

    Validates double-entry: total debits must equal total credits.
    Runs through the audit agent for risk scoring.
    """
    # Validate double-entry
    total_debits = sum(line.debit for line in data.lines)
    total_credits = sum(line.credit for line in data.lines)
    if total_debits != total_credits:
        raise HTTPException(
            status_code=422,
            detail=f"Double-entry violation: debits ({total_debits}) != credits ({total_credits})",
        )

    # Run audit assessment
    audit_result = auditor.assess_transaction(
        amount=data.total_amount,
        description=data.description,
        jurisdiction=data.tax_jurisdiction or "US",
        transaction_type=data.transaction_type,
    )

    txn = Transaction(
        entity_id=data.entity_id,
        transaction_date=data.transaction_date,
        description=data.description,
        reference=data.reference,
        transaction_type=data.transaction_type,
        currency=data.currency,
        exchange_rate=data.exchange_rate,
        total_amount=data.total_amount,
        tax_jurisdiction=data.tax_jurisdiction,
        source="manual",
        status="pending_review" if audit_result["requires_review"] else "draft",
        risk_score=audit_result["risk_score"],
        risk_flags=audit_result,
    )

    for line in data.lines:
        txn.lines.append(TransactionLine(
            account_id=line.account_id,
            debit=line.debit,
            credit=line.credit,
            description=line.description,
            tax_code=line.tax_code,
            tax_amount=line.tax_amount,
            foreign_amount=line.foreign_amount,
            foreign_currency=line.foreign_currency,
        ))

    db.add(txn)
    await db.flush()
    await db.refresh(txn, ["lines"])
    return txn


@router.get("/", response_model=list[TransactionOut])
async def list_transactions(
    entity_id: uuid.UUID | None = None,
    status: str | None = None,
    limit: int = Query(default=50, le=200),
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    """List transactions with optional filters."""
    query = select(Transaction).options(selectinload(Transaction.lines))
    if entity_id:
        query = query.where(Transaction.entity_id == entity_id)
    if status:
        query = query.where(Transaction.status == status)
    query = query.order_by(Transaction.transaction_date.desc()).offset(offset).limit(limit)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/review", response_model=list[TransactionOut])
async def get_review_queue(
    entity_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Get transactions pending human review (the Reviewer Dashboard feed)."""
    query = (
        select(Transaction)
        .options(selectinload(Transaction.lines))
        .where(Transaction.status.in_(["draft", "pending_review"]))
        .order_by(Transaction.risk_score.desc(), Transaction.created_at.asc())
    )
    if entity_id:
        query = query.where(Transaction.entity_id == entity_id)

    result = await db.execute(query)
    return result.scalars().all()


@router.post("/{transaction_id}/review", response_model=TransactionOut)
async def review_transaction(
    transaction_id: uuid.UUID,
    approval: TransactionApproval,
    db: AsyncSession = Depends(get_db),
):
    """Approve, flag, or void a transaction. This is the human-in-the-loop."""
    result = await db.execute(
        select(Transaction).options(selectinload(Transaction.lines)).where(Transaction.id == transaction_id)
    )
    txn = result.scalar_one_or_none()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    action_map = {
        "approve": "approved",
        "flag": "pending_review",
        "void": "void",
    }
    new_status = action_map.get(approval.action)
    if not new_status:
        raise HTTPException(status_code=422, detail=f"Invalid action: {approval.action}")

    txn.status = new_status
    if approval.action == "approve":
        txn.posted_date = txn.transaction_date

    await db.flush()
    await db.refresh(txn, ["lines"])
    return txn

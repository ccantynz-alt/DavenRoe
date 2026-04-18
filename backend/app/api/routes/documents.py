"""Document Management API routes — wired to PostgreSQL."""

import uuid
import hashlib

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func

from app.auth.dependencies import get_current_user
from app.core.database import get_db
from app.models.document import Document
from app.models.user import User

# Fallback
from app.documents.manager import DocumentManager

router = APIRouter(prefix="/documents", tags=["Documents"])
_fallback = DocumentManager()


def _doc_to_dict(d: Document) -> dict:
    return {
        "id": str(d.id),
        "entity_id": d.entity_id,
        "filename": d.filename,
        "content_type": d.content_type,
        "doc_type": d.doc_type,
        "description": d.description,
        "tags": d.tags or [],
        "document_date": d.document_date,
        "file_size": d.file_size,
        "file_hash": d.file_hash,
        "ocr_text": d.ocr_text,
        "ocr_confidence": d.ocr_confidence,
        "linked_transaction_id": d.linked_transaction_id,
        "status": d.status,
        "created_at": d.created_at.isoformat() if d.created_at else None,
    }


@router.post("/upload")
async def upload_document(data: dict, user: User = Depends(get_current_user)):
    content = (data.get("content", "") or "").encode()
    filename = data.get("filename", "unknown")
    file_hash = hashlib.sha256(content).hexdigest()[:16] if content else None

    doc = Document(
        entity_id=data.get("entity_id", ""),
        filename=filename,
        content_type=data.get("content_type", "application/pdf"),
        doc_type=data.get("doc_type", "other"),
        description=data.get("description", ""),
        tags=data.get("tags", []),
        document_date=data.get("document_date", ""),
        file_size=len(content),
        file_hash=file_hash,
        status="active",
    )

    try:
        async for db in get_db():
            db.add(doc)
            await db.flush()
            return _doc_to_dict(doc)
    except Exception:
        d = _fallback.upload(
            file_content=content, filename=filename,
            content_type=data.get("content_type", "application/pdf"),
            entity_id=data.get("entity_id", ""),
            doc_type=data.get("doc_type", "other"),
            description=data.get("description", ""),
            tags=data.get("tags", []),
            document_date=data.get("document_date", ""),
        )
        return d.to_dict()


@router.get("/search/{query}")
async def search_documents(query: str, entity_id: str | None = None, user: User = Depends(get_current_user)):
    try:
        async for db in get_db():
            stmt = select(Document).where(
                (Document.filename.ilike(f"%{query}%")) |
                (Document.description.ilike(f"%{query}%")) |
                (Document.ocr_text.ilike(f"%{query}%"))
            )
            if entity_id:
                stmt = stmt.where(Document.entity_id == entity_id)
            result = await db.execute(stmt)
            docs = result.scalars().all()
            return {"results": [_doc_to_dict(d) for d in docs], "count": len(docs)}
    except Exception:
        results = _fallback.search(query, entity_id)
        return {"results": [d.to_dict() for d in results], "count": len(results)}


@router.post("/{doc_id}/link/{transaction_id}")
async def link_document(doc_id: str, transaction_id: str, user: User = Depends(get_current_user)):
    try:
        async for db in get_db():
            stmt = select(Document).where(Document.id == uuid.UUID(doc_id))
            result = await db.execute(stmt)
            doc = result.scalar_one_or_none()
            if doc:
                doc.linked_transaction_id = transaction_id
                await db.flush()
                return {"status": "linked"}
    except Exception:
        pass
    if not _fallback.link_to_transaction(doc_id, transaction_id):
        raise HTTPException(status_code=404, detail="Document not found")
    return {"status": "linked"}


@router.post("/{doc_id}/ocr")
async def store_ocr(doc_id: str, data: dict, user: User = Depends(get_current_user)):
    try:
        async for db in get_db():
            stmt = select(Document).where(Document.id == uuid.UUID(doc_id))
            result = await db.execute(stmt)
            doc = result.scalar_one_or_none()
            if doc:
                doc.ocr_text = data.get("text", "")
                doc.ocr_confidence = data.get("confidence", 0)
                doc.ocr_extracted = data.get("extracted_data")
                await db.flush()
                return {"status": "processed"}
    except Exception:
        pass
    if not _fallback.process_ocr(doc_id, data.get("text", ""), data.get("confidence", 0), data.get("extracted_data")):
        raise HTTPException(status_code=404, detail="Document not found")
    return {"status": "processed"}


@router.get("/summary")
async def document_summary(user: User = Depends(get_current_user)):
    try:
        async for db in get_db():
            total = await db.scalar(select(func.count(Document.id)))
            by_type = await db.execute(
                select(Document.doc_type, func.count(Document.id)).group_by(Document.doc_type)
            )
            return {
                "total_documents": total or 0,
                "by_type": {row[0]: row[1] for row in by_type},
            }
    except Exception:
        return _fallback.summary()

"""Document Management API routes."""

from fastapi import APIRouter, Depends, HTTPException
from app.auth.dependencies import get_current_user
from app.documents.manager import DocumentManager
from app.models.user import User

router = APIRouter(prefix="/documents", tags=["Documents"])
doc_manager = DocumentManager()


@router.post("/upload")
async def upload_document(data: dict, user: User = Depends(get_current_user)):
    """Upload a document. Accepts metadata; file binary handled via multipart endpoint."""
    try:
        doc = doc_manager.upload(
            file_content=data.get("content", "").encode(),
            filename=data.get("filename", "unknown"),
            content_type=data.get("content_type", "application/pdf"),
            entity_id=data.get("entity_id", ""),
            doc_type=data.get("doc_type", "other"),
            description=data.get("description", ""),
            tags=data.get("tags", []),
            document_date=data.get("document_date", ""),
        )
        return doc.to_dict()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/search/{query}")
async def search_documents(query: str, entity_id: str | None = None, user: User = Depends(get_current_user)):
    results = doc_manager.search(query, entity_id)
    return {"results": [d.to_dict() for d in results], "count": len(results)}


@router.post("/{doc_id}/link/{transaction_id}")
async def link_document(doc_id: str, transaction_id: str, user: User = Depends(get_current_user)):
    if not doc_manager.link_to_transaction(doc_id, transaction_id):
        raise HTTPException(status_code=404, detail="Document not found")
    return {"status": "linked"}


@router.post("/{doc_id}/ocr")
async def store_ocr(doc_id: str, data: dict, user: User = Depends(get_current_user)):
    if not doc_manager.process_ocr(doc_id, data.get("text", ""), data.get("confidence", 0), data.get("extracted_data")):
        raise HTTPException(status_code=404, detail="Document not found")
    return {"status": "processed"}


@router.get("/summary")
async def document_summary(user: User = Depends(get_current_user)):
    return doc_manager.summary()

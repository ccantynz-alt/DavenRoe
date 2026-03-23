"""Document Management System.

Accountants live in documents: receipts, invoices, bank statements,
contracts, tax notices, trust deeds. Every transaction should have
a source document attached.

Features:
- Upload with metadata and tagging
- Link documents to transactions and entities
- OCR text extraction (stub for Tesseract/AWS Textract integration)
- Search across all documents
- Retention policy tracking
"""

import logging
from dataclasses import dataclass, field
from datetime import date, datetime
from enum import Enum
import hashlib
import uuid

logger = logging.getLogger(__name__)


class DocumentType(str, Enum):
    INVOICE = "invoice"
    RECEIPT = "receipt"
    BANK_STATEMENT = "bank_statement"
    CONTRACT = "contract"
    TAX_NOTICE = "tax_notice"
    TAX_RETURN = "tax_return"
    TRUST_DEED = "trust_deed"
    FINANCIAL_STATEMENT = "financial_statement"
    PAYSLIP = "payslip"
    BAS = "bas"
    CORRESPONDENCE = "correspondence"
    PHOTO = "photo"
    OTHER = "other"


class DocumentStatus(str, Enum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"     # OCR in progress
    PROCESSED = "processed"       # OCR complete
    LINKED = "linked"             # Attached to transaction
    ARCHIVED = "archived"


@dataclass
class Document:
    """A single document in the system."""

    id: str = ""
    filename: str = ""
    original_filename: str = ""
    content_type: str = ""        # application/pdf, image/jpeg, etc.
    size_bytes: int = 0
    file_hash: str = ""           # SHA256 for deduplication

    # Classification
    doc_type: DocumentType = DocumentType.OTHER
    status: DocumentStatus = DocumentStatus.UPLOADED

    # Ownership
    entity_id: str = ""
    uploaded_by: str = ""

    # Linking
    transaction_ids: list[str] = field(default_factory=list)
    linked_account: str = ""

    # OCR
    ocr_text: str = ""
    ocr_confidence: float = 0.0
    extracted_data: dict = field(default_factory=dict)
    # e.g. {"vendor": "...", "amount": "1234.56", "date": "2024-01-15", "invoice_number": "INV-001"}

    # Metadata
    document_date: str = ""       # Date on the document itself
    description: str = ""
    tags: list[str] = field(default_factory=list)
    notes: str = ""

    # Retention
    retention_years: int = 7      # Default: 7 years (AU/NZ tax requirement)
    retention_expiry: str = ""

    # Timestamps
    created_at: str = ""
    updated_at: str = ""

    def __post_init__(self):
        if not self.id:
            self.id = str(uuid.uuid4())[:12]
        if not self.created_at:
            self.created_at = datetime.utcnow().isoformat()
        self.updated_at = datetime.utcnow().isoformat()

        if self.document_date and not self.retention_expiry:
            try:
                doc_date = date.fromisoformat(self.document_date[:10])
                self.retention_expiry = str(doc_date.replace(year=doc_date.year + self.retention_years))
            except (ValueError, OverflowError):
                logger.exception("Failed to calculate retention expiry from document date '%s'", self.document_date)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "filename": self.filename,
            "original_filename": self.original_filename,
            "content_type": self.content_type,
            "size_bytes": self.size_bytes,
            "doc_type": self.doc_type.value if isinstance(self.doc_type, DocumentType) else self.doc_type,
            "status": self.status.value if isinstance(self.status, DocumentStatus) else self.status,
            "entity_id": self.entity_id,
            "transaction_ids": self.transaction_ids,
            "ocr_text": self.ocr_text[:200] + "..." if len(self.ocr_text) > 200 else self.ocr_text,
            "extracted_data": self.extracted_data,
            "document_date": self.document_date,
            "description": self.description,
            "tags": self.tags,
            "retention_expiry": self.retention_expiry,
            "created_at": self.created_at,
        }


class DocumentManager:
    """Manages all documents in the system."""

    SUPPORTED_TYPES = {
        "application/pdf", "image/jpeg", "image/png", "image/tiff",
        "text/csv", "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }

    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

    def __init__(self):
        self._documents: dict[str, Document] = {}

    def upload(self, file_content: bytes, filename: str, content_type: str, **kwargs) -> Document:
        """Upload a new document."""
        if content_type not in self.SUPPORTED_TYPES:
            raise ValueError(f"Unsupported file type: {content_type}. Supported: {', '.join(sorted(self.SUPPORTED_TYPES))}")

        if len(file_content) > self.MAX_FILE_SIZE:
            raise ValueError(f"File too large. Maximum: {self.MAX_FILE_SIZE // (1024*1024)}MB")

        file_hash = hashlib.sha256(file_content).hexdigest()

        # Check for duplicates
        for existing in self._documents.values():
            if existing.file_hash == file_hash:
                return existing  # Return existing instead of duplicating

        doc = Document(
            original_filename=filename,
            filename=f"{uuid.uuid4().hex[:8]}_{filename}",
            content_type=content_type,
            size_bytes=len(file_content),
            file_hash=file_hash,
            **kwargs,
        )

        self._documents[doc.id] = doc
        return doc

    def get(self, doc_id: str) -> Document | None:
        return self._documents.get(doc_id)

    def link_to_transaction(self, doc_id: str, transaction_id: str) -> bool:
        """Link a document to a transaction."""
        doc = self._documents.get(doc_id)
        if not doc:
            return False
        if transaction_id not in doc.transaction_ids:
            doc.transaction_ids.append(transaction_id)
        doc.status = DocumentStatus.LINKED
        return True

    def process_ocr(self, doc_id: str, ocr_text: str, confidence: float = 0.0, extracted_data: dict | None = None) -> bool:
        """Store OCR results for a document.

        In production, this would call Tesseract/AWS Textract/Google Vision.
        """
        doc = self._documents.get(doc_id)
        if not doc:
            return False
        doc.ocr_text = ocr_text
        doc.ocr_confidence = confidence
        doc.extracted_data = extracted_data or {}
        doc.status = DocumentStatus.PROCESSED
        return True

    def search(self, query: str, entity_id: str | None = None) -> list[Document]:
        """Search documents by text content, filename, or metadata."""
        q = query.lower()
        results = []
        for doc in self._documents.values():
            if entity_id and doc.entity_id != entity_id:
                continue
            searchable = f"{doc.filename} {doc.original_filename} {doc.description} {doc.ocr_text} {' '.join(doc.tags)}".lower()
            if q in searchable:
                results.append(doc)
        return results

    def list_by_entity(self, entity_id: str) -> list[Document]:
        return [d for d in self._documents.values() if d.entity_id == entity_id]

    def list_by_transaction(self, transaction_id: str) -> list[Document]:
        return [d for d in self._documents.values() if transaction_id in d.transaction_ids]

    def list_expiring(self, before_date: date) -> list[Document]:
        """Find documents approaching retention expiry."""
        results = []
        for doc in self._documents.values():
            if doc.retention_expiry:
                try:
                    expiry = date.fromisoformat(doc.retention_expiry[:10])
                    if expiry <= before_date:
                        results.append(doc)
                except ValueError:
                    logger.exception("Failed to parse retention expiry date '%s' for document '%s'", doc.retention_expiry, doc.id)
        return results

    def summary(self) -> dict:
        by_type = {}
        by_status = {}
        total_size = 0
        for doc in self._documents.values():
            dt = doc.doc_type.value if isinstance(doc.doc_type, DocumentType) else doc.doc_type
            by_type[dt] = by_type.get(dt, 0) + 1
            ds = doc.status.value if isinstance(doc.status, DocumentStatus) else doc.status
            by_status[ds] = by_status.get(ds, 0) + 1
            total_size += doc.size_bytes

        return {
            "total_documents": len(self._documents),
            "by_type": by_type,
            "by_status": by_status,
            "total_size_mb": round(total_size / (1024 * 1024), 2),
        }

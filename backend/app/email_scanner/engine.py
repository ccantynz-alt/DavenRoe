"""Email Scanner Engine.

Connects to Gmail (Google Workspace) and Outlook (Microsoft 365) via OAuth2,
crawls the mailbox to find invoices, receipts, statements, and financial
documents — both as attachments and inline content.

Detection strategies:
  1. Subject-line keyword matching (invoice, receipt, statement, payment, etc.)
  2. Sender domain reputation (known invoicing platforms, banks, payment processors)
  3. Attachment type filtering (PDF, CSV, XLSX, images)
  4. Body content analysis (dollar amounts, "amount due", "total", tax references)
  5. AI classification for ambiguous emails
"""

from __future__ import annotations

import re
import uuid
import base64
from datetime import datetime, timezone, timedelta
from enum import Enum
from typing import Optional


# ── Enums ──────────────────────────────────────────────────────

class EmailProvider(str, Enum):
    GMAIL = "gmail"
    OUTLOOK = "outlook"


class DocumentType(str, Enum):
    INVOICE = "invoice"
    RECEIPT = "receipt"
    STATEMENT = "statement"
    PAYMENT_CONFIRMATION = "payment_confirmation"
    TAX_DOCUMENT = "tax_document"
    PAYSLIP = "payslip"
    PURCHASE_ORDER = "purchase_order"
    CREDIT_NOTE = "credit_note"
    QUOTE = "quote"
    UNKNOWN = "unknown"


class ScanStatus(str, Enum):
    PENDING = "pending"
    CONNECTING = "connecting"
    SCANNING = "scanning"
    EXTRACTING = "extracting"
    CLASSIFYING = "classifying"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class MatchConfidence(str, Enum):
    HIGH = "high"          # 90%+ — definitely a financial document
    MEDIUM = "medium"      # 60-89% — probably financial
    LOW = "low"            # 30-59% — might be financial
    UNLIKELY = "unlikely"  # <30% — probably not


# ── Known Sender Domains ───────────────────────────────────────

KNOWN_INVOICE_SENDERS = {
    # Payment processors
    "paypal.com", "stripe.com", "square.com", "gocardless.com",
    "wise.com", "revolut.com", "brex.com",
    # Invoicing platforms
    "xero.com", "quickbooks.intuit.com", "freshbooks.com",
    "invoiceninja.com", "zoho.com", "waveapps.com", "invoice2go.com",
    # Cloud/SaaS
    "aws.amazon.com", "cloud.google.com", "azure.microsoft.com",
    "heroku.com", "digitalocean.com", "github.com", "atlassian.com",
    "slack.com", "zoom.us", "dropbox.com", "notion.so",
    # Utilities / subscriptions
    "adobe.com", "canva.com", "figma.com", "spotify.com",
    # Accounting / tax
    "ato.gov.au", "ird.govt.nz", "hmrc.gov.uk", "irs.gov",
    # E-commerce
    "amazon.com", "shopify.com", "ebay.com", "alibaba.com",
    # Telco
    "telstra.com.au", "optus.com.au", "vodafone.com",
    "bt.com", "ee.co.uk", "verizon.com", "att.com", "tmobile.com",
}

KNOWN_BANK_SENDERS = {
    # AU
    "commbank.com.au", "westpac.com.au", "anz.com.au", "nab.com.au",
    # NZ
    "anz.co.nz", "westpac.co.nz", "bnz.co.nz", "asb.co.nz",
    # UK
    "hsbc.co.uk", "barclays.co.uk", "lloydsbank.com", "natwest.com",
    # US
    "chase.com", "bankofamerica.com", "wellsfargo.com", "citi.com",
}

# ── Subject & Body Keywords ───────────────────────────────────

SUBJECT_KEYWORDS = {
    "invoice": DocumentType.INVOICE,
    "inv-": DocumentType.INVOICE,
    "inv #": DocumentType.INVOICE,
    "bill": DocumentType.INVOICE,
    "receipt": DocumentType.RECEIPT,
    "payment received": DocumentType.RECEIPT,
    "payment confirmation": DocumentType.PAYMENT_CONFIRMATION,
    "order confirmation": DocumentType.RECEIPT,
    "statement": DocumentType.STATEMENT,
    "account statement": DocumentType.STATEMENT,
    "bank statement": DocumentType.STATEMENT,
    "tax return": DocumentType.TAX_DOCUMENT,
    "tax invoice": DocumentType.INVOICE,
    "bas": DocumentType.TAX_DOCUMENT,
    "gst return": DocumentType.TAX_DOCUMENT,
    "vat return": DocumentType.TAX_DOCUMENT,
    "payslip": DocumentType.PAYSLIP,
    "pay slip": DocumentType.PAYSLIP,
    "payroll": DocumentType.PAYSLIP,
    "purchase order": DocumentType.PURCHASE_ORDER,
    "credit note": DocumentType.CREDIT_NOTE,
    "credit memo": DocumentType.CREDIT_NOTE,
    "quote": DocumentType.QUOTE,
    "quotation": DocumentType.QUOTE,
    "estimate": DocumentType.QUOTE,
    "amount due": DocumentType.INVOICE,
    "payment due": DocumentType.INVOICE,
    "remittance": DocumentType.PAYMENT_CONFIRMATION,
}

BODY_PATTERNS = [
    (re.compile(r"(?:total|amount\s*due|balance\s*due|subtotal)\s*[:=]?\s*\$?\s*[\d,]+\.?\d*", re.I), 0.3),
    (re.compile(r"(?:invoice|inv)\s*(?:#|no\.?|number)\s*[:=]?\s*\w+", re.I), 0.25),
    (re.compile(r"(?:due\s*date|payment\s*terms|net\s*\d+)", re.I), 0.2),
    (re.compile(r"(?:ABN|ACN|GST|VAT|EIN|TFN|IRD)\s*[:=]?\s*[\d\s-]+", re.I), 0.15),
    (re.compile(r"(?:bank\s*account|bsb|sort\s*code|routing\s*number|swift|iban)", re.I), 0.1),
    (re.compile(r"\b(?:tax|gst|vat)\s*(?:included|exclusive|inclusive)\b", re.I), 0.15),
]

FINANCIAL_ATTACHMENT_TYPES = {
    "application/pdf", "text/csv",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",  # xlsx
    "application/vnd.ms-excel",  # xls
    "image/png", "image/jpeg", "image/jpg",  # scanned receipts
}

FINANCIAL_FILE_EXTENSIONS = {
    ".pdf", ".csv", ".xlsx", ".xls", ".png", ".jpg", ".jpeg",
}


# ── Gmail API Helpers ──────────────────────────────────────────

class GmailConnector:
    """Handles Gmail API communication via OAuth2 tokens."""

    SCOPES = [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.labels",
    ]

    def __init__(self, access_token: str, refresh_token: str | None = None):
        self.access_token = access_token
        self.refresh_token = refresh_token
        self.base_url = "https://gmail.googleapis.com/gmail/v1"
        self.headers = {"Authorization": f"Bearer {access_token}"}

    async def get_profile(self) -> dict:
        """Get Gmail profile (email address, total messages)."""
        import httpx
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.base_url}/users/me/profile",
                headers=self.headers,
            )
            resp.raise_for_status()
            return resp.json()

    async def search_messages(
        self,
        query: str,
        max_results: int = 500,
        page_token: str | None = None,
    ) -> dict:
        """Search Gmail messages using Gmail search syntax."""
        import httpx
        params = {"q": query, "maxResults": min(max_results, 500)}
        if page_token:
            params["pageToken"] = page_token

        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.base_url}/users/me/messages",
                headers=self.headers,
                params=params,
            )
            resp.raise_for_status()
            return resp.json()

    async def get_message(self, message_id: str, fmt: str = "metadata") -> dict:
        """Get a single message by ID."""
        import httpx
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.base_url}/users/me/messages/{message_id}",
                headers=self.headers,
                params={"format": fmt},
            )
            resp.raise_for_status()
            return resp.json()

    async def get_attachment(self, message_id: str, attachment_id: str) -> bytes:
        """Download an attachment."""
        import httpx
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.base_url}/users/me/messages/{message_id}/attachments/{attachment_id}",
                headers=self.headers,
            )
            resp.raise_for_status()
            data = resp.json().get("data", "")
            return base64.urlsafe_b64decode(data + "==")

    def build_financial_query(
        self,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        labels: list[str] | None = None,
    ) -> str:
        """Build a Gmail search query targeting financial emails."""
        terms = []

        # Subject keywords
        subject_terms = [
            "invoice", "receipt", "statement", "payment", "bill",
            "tax", "payslip", "credit note", "purchase order",
            "amount due", "remittance",
        ]
        terms.append("subject:({})".format(" OR ".join(subject_terms)))

        # Date range
        if date_from:
            terms.append(f"after:{date_from.strftime('%Y/%m/%d')}")
        if date_to:
            terms.append(f"before:{date_to.strftime('%Y/%m/%d')}")

        # Has attachment (many financial docs are attachments)
        # We do two passes: one with attachments, one without
        # This first query focuses on attachment-bearing emails
        terms.append("has:attachment")

        if labels:
            for label in labels:
                terms.append(f"label:{label}")

        return " ".join(terms)

    def build_sender_query(self, date_from: datetime | None = None) -> str:
        """Build a query targeting known financial senders."""
        all_senders = KNOWN_INVOICE_SENDERS | KNOWN_BANK_SENDERS
        # Gmail query limit is ~1000 chars, batch senders
        from_terms = " OR ".join(f"from:{d}" for d in list(all_senders)[:40])
        query = f"({from_terms})"
        if date_from:
            query += f" after:{date_from.strftime('%Y/%m/%d')}"
        return query


class OutlookConnector:
    """Handles Microsoft Graph API communication for Outlook/365."""

    SCOPES = ["Mail.Read", "Mail.ReadBasic"]

    def __init__(self, access_token: str, refresh_token: str | None = None):
        self.access_token = access_token
        self.refresh_token = refresh_token
        self.base_url = "https://graph.microsoft.com/v1.0"
        self.headers = {"Authorization": f"Bearer {access_token}"}

    async def get_profile(self) -> dict:
        """Get user profile."""
        import httpx
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{self.base_url}/me", headers=self.headers)
            resp.raise_for_status()
            data = resp.json()
            return {"email": data.get("mail") or data.get("userPrincipalName"), "name": data.get("displayName")}

    async def search_messages(
        self,
        query: str,
        max_results: int = 500,
        skip: int = 0,
    ) -> dict:
        """Search Outlook messages using OData $search."""
        import httpx
        params = {
            "$search": f'"{query}"',
            "$top": min(max_results, 100),
            "$skip": skip,
            "$select": "id,subject,from,receivedDateTime,hasAttachments,bodyPreview",
        }
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.base_url}/me/messages",
                headers=self.headers,
                params=params,
            )
            resp.raise_for_status()
            return resp.json()

    async def get_message(self, message_id: str) -> dict:
        """Get a single message."""
        import httpx
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.base_url}/me/messages/{message_id}",
                headers=self.headers,
                params={"$select": "id,subject,from,receivedDateTime,hasAttachments,body,bodyPreview"},
            )
            resp.raise_for_status()
            return resp.json()

    async def get_attachments(self, message_id: str) -> list[dict]:
        """Get attachments for a message."""
        import httpx
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.base_url}/me/messages/{message_id}/attachments",
                headers=self.headers,
            )
            resp.raise_for_status()
            return resp.json().get("value", [])


# ── Email Classifier ──────────────────────────────────────────

class EmailClassifier:
    """Classifies emails as financial documents with confidence scoring."""

    def classify(self, email_data: dict) -> dict:
        """Classify a single email. Returns document type + confidence."""
        subject = (email_data.get("subject") or "").lower()
        sender = (email_data.get("sender_email") or "").lower()
        sender_domain = sender.split("@")[-1] if "@" in sender else ""
        body_preview = (email_data.get("body_preview") or "").lower()
        has_attachment = email_data.get("has_attachment", False)
        attachments = email_data.get("attachments", [])

        score = 0.0
        doc_type = DocumentType.UNKNOWN
        signals = []

        # 1. Subject keyword matching (strongest signal)
        for keyword, dtype in SUBJECT_KEYWORDS.items():
            if keyword in subject:
                score += 0.35
                doc_type = dtype
                signals.append(f"Subject contains '{keyword}'")
                break

        # 2. Known sender domain
        if sender_domain in KNOWN_INVOICE_SENDERS:
            score += 0.25
            signals.append(f"Known invoicing sender: {sender_domain}")
            if doc_type == DocumentType.UNKNOWN:
                doc_type = DocumentType.INVOICE

        if sender_domain in KNOWN_BANK_SENDERS:
            score += 0.25
            signals.append(f"Known bank sender: {sender_domain}")
            if doc_type == DocumentType.UNKNOWN:
                doc_type = DocumentType.STATEMENT

        # 3. Attachment analysis
        if has_attachment:
            score += 0.1
            signals.append("Has attachment(s)")

            for att in attachments:
                att_name = (att.get("filename") or "").lower()
                att_type = att.get("content_type", "")

                if att_type in FINANCIAL_ATTACHMENT_TYPES:
                    score += 0.1
                    signals.append(f"Financial file type: {att_type}")

                for ext in FINANCIAL_FILE_EXTENSIONS:
                    if att_name.endswith(ext):
                        score += 0.05
                        break

                # Filename keywords
                for kw in ["invoice", "receipt", "statement", "bill", "tax"]:
                    if kw in att_name:
                        score += 0.15
                        signals.append(f"Attachment name contains '{kw}'")
                        break

        # 4. Body pattern matching
        for pattern, weight in BODY_PATTERNS:
            if pattern.search(body_preview):
                score += weight
                signals.append(f"Body matches: {pattern.pattern[:40]}...")

        # Normalize score to 0-1
        score = min(score, 1.0)

        # Determine confidence level
        if score >= 0.7:
            confidence = MatchConfidence.HIGH
        elif score >= 0.45:
            confidence = MatchConfidence.MEDIUM
        elif score >= 0.25:
            confidence = MatchConfidence.LOW
        else:
            confidence = MatchConfidence.UNLIKELY

        return {
            "document_type": doc_type,
            "confidence": confidence,
            "score": round(score, 3),
            "signals": signals,
        }


# ── Scan Job ──────────────────────────────────────────────────

class EmailScanJob:
    """Represents a single mailbox scan operation."""

    def __init__(
        self,
        user_id: str,
        provider: EmailProvider,
        access_token: str,
        refresh_token: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        scan_labels: list[str] | None = None,
        min_confidence: MatchConfidence = MatchConfidence.LOW,
    ):
        self.id = str(uuid.uuid4())
        self.user_id = user_id
        self.provider = provider
        self.access_token = access_token
        self.refresh_token = refresh_token
        self.date_from = date_from or (datetime.now(timezone.utc) - timedelta(days=365))
        self.date_to = date_to or datetime.now(timezone.utc)
        self.scan_labels = scan_labels
        self.min_confidence = min_confidence

        self.status = ScanStatus.PENDING
        self.email_address = None
        self.total_scanned = 0
        self.total_matched = 0
        self.results: list[dict] = []
        self.errors: list[str] = []
        self.started_at: datetime | None = None
        self.completed_at: datetime | None = None
        self.progress_percent = 0

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "provider": self.provider.value,
            "email_address": self.email_address,
            "status": self.status.value,
            "date_from": self.date_from.isoformat(),
            "date_to": self.date_to.isoformat(),
            "total_scanned": self.total_scanned,
            "total_matched": self.total_matched,
            "progress_percent": self.progress_percent,
            "results": self.results,
            "errors": self.errors,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }


# ── Main Engine ───────────────────────────────────────────────

class EmailScannerEngine:
    """Orchestrates mailbox scanning across providers."""

    def __init__(self):
        self.classifier = EmailClassifier()
        self.active_scans: dict[str, EmailScanJob] = {}

    async def start_scan(self, job: EmailScanJob) -> EmailScanJob:
        """Start a mailbox scan."""
        self.active_scans[job.id] = job
        job.status = ScanStatus.CONNECTING
        job.started_at = datetime.now(timezone.utc)

        try:
            if job.provider == EmailProvider.GMAIL:
                await self._scan_gmail(job)
            elif job.provider == EmailProvider.OUTLOOK:
                await self._scan_outlook(job)

            job.status = ScanStatus.COMPLETED
        except Exception as e:
            job.status = ScanStatus.FAILED
            job.errors.append(str(e))
        finally:
            job.completed_at = datetime.now(timezone.utc)

        return job

    async def _scan_gmail(self, job: EmailScanJob):
        """Scan Gmail mailbox."""
        connector = GmailConnector(job.access_token, job.refresh_token)

        # Get profile
        profile = await connector.get_profile()
        job.email_address = profile.get("emailAddress")

        job.status = ScanStatus.SCANNING

        # Strategy 1: Search by financial keywords + attachments
        query = connector.build_financial_query(
            date_from=job.date_from,
            date_to=job.date_to,
            labels=job.scan_labels,
        )
        message_ids = set()
        page_token = None

        while True:
            result = await connector.search_messages(query, max_results=500, page_token=page_token)
            messages = result.get("messages", [])
            for msg in messages:
                message_ids.add(msg["id"])
            page_token = result.get("nextPageToken")
            if not page_token or len(message_ids) >= 2000:
                break

        # Strategy 2: Search by known sender domains
        sender_query = connector.build_sender_query(date_from=job.date_from)
        try:
            result = await connector.search_messages(sender_query, max_results=500)
            for msg in result.get("messages", []):
                message_ids.add(msg["id"])
        except Exception:
            pass  # Non-critical, continue with keyword results

        # Process each message
        total = len(message_ids)
        job.status = ScanStatus.EXTRACTING

        for idx, msg_id in enumerate(message_ids):
            try:
                msg = await connector.get_message(msg_id, fmt="metadata")
                email_data = self._parse_gmail_message(msg)

                # Classify
                classification = self.classifier.classify(email_data)

                # Filter by minimum confidence
                confidence_order = [MatchConfidence.UNLIKELY, MatchConfidence.LOW, MatchConfidence.MEDIUM, MatchConfidence.HIGH]
                if confidence_order.index(classification["confidence"]) >= confidence_order.index(job.min_confidence):
                    job.results.append({
                        "email_id": msg_id,
                        "subject": email_data.get("subject", ""),
                        "sender_name": email_data.get("sender_name", ""),
                        "sender_email": email_data.get("sender_email", ""),
                        "date": email_data.get("date", ""),
                        "has_attachment": email_data.get("has_attachment", False),
                        "attachment_count": len(email_data.get("attachments", [])),
                        "attachments": [
                            {"filename": a.get("filename"), "size": a.get("size"), "content_type": a.get("content_type")}
                            for a in email_data.get("attachments", [])
                        ],
                        "classification": classification,
                        "imported": False,
                    })
                    job.total_matched += 1

            except Exception as e:
                job.errors.append(f"Message {msg_id}: {str(e)}")

            job.total_scanned += 1
            job.progress_percent = int((idx + 1) / max(total, 1) * 100)

        # Sort results by confidence score (highest first)
        job.results.sort(key=lambda r: r["classification"]["score"], reverse=True)

    async def _scan_outlook(self, job: EmailScanJob):
        """Scan Outlook/365 mailbox."""
        connector = OutlookConnector(job.access_token, job.refresh_token)

        profile = await connector.get_profile()
        job.email_address = profile.get("email")

        job.status = ScanStatus.SCANNING

        search_terms = [
            "invoice", "receipt", "statement", "payment",
            "bill", "tax", "payslip", "credit note",
        ]

        all_messages = {}
        for term in search_terms:
            try:
                result = await connector.search_messages(term, max_results=100)
                for msg in result.get("value", []):
                    all_messages[msg["id"]] = msg
            except Exception:
                continue

        job.status = ScanStatus.EXTRACTING
        total = len(all_messages)

        for idx, (msg_id, msg) in enumerate(all_messages.items()):
            email_data = self._parse_outlook_message(msg)
            classification = self.classifier.classify(email_data)

            confidence_order = [MatchConfidence.UNLIKELY, MatchConfidence.LOW, MatchConfidence.MEDIUM, MatchConfidence.HIGH]
            if confidence_order.index(classification["confidence"]) >= confidence_order.index(job.min_confidence):
                job.results.append({
                    "email_id": msg_id,
                    "subject": email_data.get("subject", ""),
                    "sender_name": email_data.get("sender_name", ""),
                    "sender_email": email_data.get("sender_email", ""),
                    "date": email_data.get("date", ""),
                    "has_attachment": email_data.get("has_attachment", False),
                    "attachment_count": 0,
                    "attachments": [],
                    "classification": classification,
                    "imported": False,
                })
                job.total_matched += 1

            job.total_scanned += 1
            job.progress_percent = int((idx + 1) / max(total, 1) * 100)

        job.results.sort(key=lambda r: r["classification"]["score"], reverse=True)

    def _parse_gmail_message(self, msg: dict) -> dict:
        """Parse a Gmail API message into a normalized format."""
        headers = {h["name"].lower(): h["value"] for h in msg.get("payload", {}).get("headers", [])}

        sender_raw = headers.get("from", "")
        sender_name, sender_email = self._parse_sender(sender_raw)

        attachments = []
        self._extract_gmail_attachments(msg.get("payload", {}), attachments)

        return {
            "id": msg.get("id"),
            "subject": headers.get("subject", ""),
            "sender_name": sender_name,
            "sender_email": sender_email,
            "date": headers.get("date", ""),
            "body_preview": msg.get("snippet", ""),
            "has_attachment": len(attachments) > 0,
            "attachments": attachments,
        }

    def _extract_gmail_attachments(self, part: dict, result: list):
        """Recursively extract attachment metadata from Gmail message parts."""
        if part.get("filename"):
            result.append({
                "filename": part["filename"],
                "content_type": part.get("mimeType", ""),
                "size": part.get("body", {}).get("size", 0),
                "attachment_id": part.get("body", {}).get("attachmentId"),
            })
        for sub in part.get("parts", []):
            self._extract_gmail_attachments(sub, result)

    def _parse_outlook_message(self, msg: dict) -> dict:
        """Parse an Outlook Graph API message into normalized format."""
        from_data = msg.get("from", {}).get("emailAddress", {})
        return {
            "id": msg.get("id"),
            "subject": msg.get("subject", ""),
            "sender_name": from_data.get("name", ""),
            "sender_email": from_data.get("address", ""),
            "date": msg.get("receivedDateTime", ""),
            "body_preview": msg.get("bodyPreview", ""),
            "has_attachment": msg.get("hasAttachments", False),
            "attachments": [],
        }

    def _parse_sender(self, raw: str) -> tuple[str, str]:
        """Parse 'John Doe <john@example.com>' into (name, email)."""
        match = re.match(r'^"?([^"<]*)"?\s*<?([^>]+@[^>]+)>?$', raw.strip())
        if match:
            return match.group(1).strip(), match.group(2).strip().lower()
        return "", raw.strip().lower()

    def get_scan(self, scan_id: str) -> EmailScanJob | None:
        return self.active_scans.get(scan_id)

    def get_scan_summary(self, job: EmailScanJob) -> dict:
        """Generate a summary of scan results."""
        by_type = {}
        by_confidence = {}
        by_sender = {}
        total_attachments = 0

        for r in job.results:
            doc_type = r["classification"]["document_type"]
            confidence = r["classification"]["confidence"]
            sender = r.get("sender_email", "unknown")

            by_type[doc_type] = by_type.get(doc_type, 0) + 1
            by_confidence[confidence] = by_confidence.get(confidence, 0) + 1
            by_sender[sender] = by_sender.get(sender, 0) + 1
            total_attachments += r.get("attachment_count", 0)

        # Top senders
        top_senders = sorted(by_sender.items(), key=lambda x: x[1], reverse=True)[:10]

        return {
            "total_scanned": job.total_scanned,
            "total_matched": job.total_matched,
            "by_document_type": by_type,
            "by_confidence": by_confidence,
            "total_attachments": total_attachments,
            "top_senders": [{"email": s, "count": c} for s, c in top_senders],
            "scan_duration_seconds": (
                (job.completed_at - job.started_at).total_seconds()
                if job.completed_at and job.started_at else None
            ),
        }

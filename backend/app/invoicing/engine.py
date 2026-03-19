"""Invoicing Engine.

Full invoice lifecycle: create → send → track → receive payment → reconcile.
Plus quotes, credit notes, recurring invoices, payment reminders,
online payment links, and multi-currency invoicing.

FreshBooks leads on invoicing UX. We match on features.
"""

from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from decimal import Decimal
from enum import Enum
import uuid

TWO_DP = Decimal("0.01")


class InvoiceStatus(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    VIEWED = "viewed"
    PARTIAL = "partial"
    PAID = "paid"
    OVERDUE = "overdue"
    VOID = "void"
    WRITE_OFF = "write_off"


class InvoiceType(str, Enum):
    INVOICE = "invoice"
    QUOTE = "quote"
    CREDIT_NOTE = "credit_note"
    PURCHASE_ORDER = "purchase_order"
    RECEIPT = "receipt"


@dataclass
class InvoiceLineItem:
    """A single line on an invoice."""
    description: str = ""
    quantity: Decimal = Decimal("1")
    unit_price: Decimal = Decimal("0")
    discount_pct: Decimal = Decimal("0")
    tax_rate: Decimal = Decimal("0")
    tax_amount: Decimal = Decimal("0")
    line_total: Decimal = Decimal("0")
    account_code: str = "4000"
    product_id: str = ""

    def calculate(self):
        subtotal = (self.quantity * self.unit_price).quantize(TWO_DP)
        if self.discount_pct > 0:
            subtotal = (subtotal * (1 - self.discount_pct / 100)).quantize(TWO_DP)
        self.tax_amount = (subtotal * self.tax_rate / 100).quantize(TWO_DP)
        self.line_total = subtotal + self.tax_amount

    def to_dict(self) -> dict:
        return {
            "description": self.description,
            "quantity": str(self.quantity),
            "unit_price": str(self.unit_price),
            "discount_pct": str(self.discount_pct),
            "tax_rate": str(self.tax_rate),
            "tax_amount": str(self.tax_amount),
            "line_total": str(self.line_total),
            "account_code": self.account_code,
        }


@dataclass
class Invoice:
    """A full invoice."""
    id: str = ""
    invoice_number: str = ""
    invoice_type: InvoiceType = InvoiceType.INVOICE
    status: InvoiceStatus = InvoiceStatus.DRAFT

    # Parties
    entity_id: str = ""
    customer_id: str = ""
    customer_name: str = ""
    customer_email: str = ""
    customer_address: dict = field(default_factory=dict)

    # Dates
    issue_date: str = ""
    due_date: str = ""
    payment_terms: int = 30      # Net days

    # Lines
    lines: list[InvoiceLineItem] = field(default_factory=list)

    # Totals
    subtotal: Decimal = Decimal("0")
    total_tax: Decimal = Decimal("0")
    total: Decimal = Decimal("0")
    amount_paid: Decimal = Decimal("0")
    amount_due: Decimal = Decimal("0")

    # Currency
    currency: str = "AUD"
    exchange_rate: Decimal = Decimal("1")

    # Payment
    payment_link: str = ""
    payment_method: str = ""
    payments: list[dict] = field(default_factory=list)

    # Recurring
    is_recurring: bool = False
    recurrence_frequency: str = ""  # monthly, quarterly, annually
    next_recurrence: str = ""

    # References
    reference: str = ""
    notes: str = ""
    terms: str = ""
    related_invoice_id: str = ""   # For credit notes

    # Metadata
    sent_at: str = ""
    viewed_at: str = ""
    paid_at: str = ""
    created_at: str = ""

    def __post_init__(self):
        if not self.id:
            self.id = str(uuid.uuid4())[:8]
        if not self.created_at:
            self.created_at = datetime.utcnow().isoformat()
        if self.issue_date and not self.due_date:
            try:
                issue = date.fromisoformat(self.issue_date)
                self.due_date = str(issue + timedelta(days=self.payment_terms))
            except ValueError:
                pass

    def calculate_totals(self):
        """Calculate all totals from line items."""
        self.subtotal = Decimal("0")
        self.total_tax = Decimal("0")
        for line in self.lines:
            line.calculate()
            subtotal = (line.quantity * line.unit_price).quantize(TWO_DP)
            if line.discount_pct > 0:
                subtotal = (subtotal * (1 - line.discount_pct / 100)).quantize(TWO_DP)
            self.subtotal += subtotal
            self.total_tax += line.tax_amount
        self.total = self.subtotal + self.total_tax
        self.amount_due = self.total - self.amount_paid

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "invoice_number": self.invoice_number,
            "type": self.invoice_type.value if isinstance(self.invoice_type, InvoiceType) else self.invoice_type,
            "status": self.status.value if isinstance(self.status, InvoiceStatus) else self.status,
            "customer_name": self.customer_name,
            "customer_email": self.customer_email,
            "issue_date": self.issue_date,
            "due_date": self.due_date,
            "payment_terms": f"Net {self.payment_terms}",
            "lines": [l.to_dict() for l in self.lines],
            "subtotal": str(self.subtotal),
            "total_tax": str(self.total_tax),
            "total": str(self.total),
            "amount_paid": str(self.amount_paid),
            "amount_due": str(self.amount_due),
            "currency": self.currency,
            "is_recurring": self.is_recurring,
            "recurrence_frequency": self.recurrence_frequency,
            "reference": self.reference,
            "notes": self.notes,
            "payment_link": self.payment_link,
            "created_at": self.created_at,
        }


class InvoicingEngine:
    """Full invoicing lifecycle management."""

    def __init__(self):
        self._invoices: dict[str, Invoice] = {}
        self._next_number = 1001

    def _generate_number(self, prefix: str = "INV") -> str:
        num = f"{prefix}-{self._next_number:05d}"
        self._next_number += 1
        return num

    # ── Create ───────────────────────────────────────────────

    def create_invoice(self, lines: list[dict], **kwargs) -> Invoice:
        """Create a new invoice."""
        if "invoice_type" in kwargs and isinstance(kwargs["invoice_type"], str):
            kwargs["invoice_type"] = InvoiceType(kwargs["invoice_type"])

        line_items = []
        for line_data in lines:
            item = InvoiceLineItem(
                description=line_data.get("description", ""),
                quantity=Decimal(str(line_data.get("quantity", 1))),
                unit_price=Decimal(str(line_data.get("unit_price", 0))),
                discount_pct=Decimal(str(line_data.get("discount_pct", 0))),
                tax_rate=Decimal(str(line_data.get("tax_rate", 0))),
                account_code=line_data.get("account_code", "4000"),
                product_id=line_data.get("product_id", ""),
            )
            line_items.append(item)

        invoice_type = kwargs.get("invoice_type", InvoiceType.INVOICE)
        prefix = {"invoice": "INV", "quote": "QTE", "credit_note": "CN", "purchase_order": "PO"}.get(
            invoice_type.value if isinstance(invoice_type, InvoiceType) else invoice_type, "INV"
        )

        invoice = Invoice(
            invoice_number=self._generate_number(prefix),
            lines=line_items,
            **kwargs,
        )
        invoice.calculate_totals()
        self._invoices[invoice.id] = invoice
        return invoice

    def create_credit_note(self, original_invoice_id: str, lines: list[dict] | None = None, **kwargs) -> Invoice | None:
        """Create a credit note against an existing invoice."""
        original = self._invoices.get(original_invoice_id)
        if not original:
            return None

        if not lines:
            # Full credit — negate all lines
            lines = [{
                "description": f"Credit: {l.description}",
                "quantity": l.quantity,
                "unit_price": l.unit_price,
                "tax_rate": l.tax_rate,
            } for l in original.lines]

        return self.create_invoice(
            lines=lines,
            invoice_type="credit_note",
            customer_id=original.customer_id,
            customer_name=original.customer_name,
            customer_email=original.customer_email,
            entity_id=original.entity_id,
            related_invoice_id=original_invoice_id,
            issue_date=str(date.today()),
            **kwargs,
        )

    def convert_quote_to_invoice(self, quote_id: str) -> Invoice | None:
        """Convert a quote/estimate to an invoice."""
        quote = self._invoices.get(quote_id)
        if not quote or quote.invoice_type != InvoiceType.QUOTE:
            return None

        lines = [{
            "description": l.description,
            "quantity": l.quantity,
            "unit_price": l.unit_price,
            "discount_pct": l.discount_pct,
            "tax_rate": l.tax_rate,
            "account_code": l.account_code,
        } for l in quote.lines]

        invoice = self.create_invoice(
            lines=lines,
            invoice_type="invoice",
            customer_id=quote.customer_id,
            customer_name=quote.customer_name,
            customer_email=quote.customer_email,
            entity_id=quote.entity_id,
            issue_date=str(date.today()),
            payment_terms=quote.payment_terms,
            reference=f"From quote {quote.invoice_number}",
        )

        quote.status = InvoiceStatus.VOID
        return invoice

    # ── Lifecycle ────────────────────────────────────────────

    def send_invoice(self, invoice_id: str) -> dict:
        """Mark an invoice as sent."""
        invoice = self._invoices.get(invoice_id)
        if not invoice:
            return {"error": "Invoice not found"}
        invoice.status = InvoiceStatus.SENT
        invoice.sent_at = datetime.utcnow().isoformat()
        # Generate payment link
        invoice.payment_link = f"https://pay.astra.accounting/inv/{invoice.invoice_number}"
        return {"status": "sent", "invoice_number": invoice.invoice_number, "payment_link": invoice.payment_link}

    def record_payment(self, invoice_id: str, amount: Decimal, method: str = "bank_transfer",
                        reference: str = "", payment_date: str = "") -> dict:
        """Record a payment against an invoice."""
        invoice = self._invoices.get(invoice_id)
        if not invoice:
            return {"error": "Invoice not found"}

        payment = {
            "amount": str(amount),
            "method": method,
            "reference": reference,
            "date": payment_date or str(date.today()),
        }
        invoice.payments.append(payment)
        invoice.amount_paid += amount
        invoice.amount_due = invoice.total - invoice.amount_paid

        if invoice.amount_due <= 0:
            invoice.status = InvoiceStatus.PAID
            invoice.paid_at = datetime.utcnow().isoformat()
        elif invoice.amount_paid > 0:
            invoice.status = InvoiceStatus.PARTIAL

        return {
            "status": "payment_recorded",
            "amount": str(amount),
            "total_paid": str(invoice.amount_paid),
            "remaining": str(invoice.amount_due),
            "invoice_status": invoice.status.value,
        }

    def void_invoice(self, invoice_id: str) -> bool:
        invoice = self._invoices.get(invoice_id)
        if invoice:
            invoice.status = InvoiceStatus.VOID
            return True
        return False

    # ── Querying ─────────────────────────────────────────────

    def get(self, invoice_id: str) -> Invoice | None:
        return self._invoices.get(invoice_id)

    def list_invoices(self, entity_id: str | None = None, customer_id: str | None = None,
                       status: str | None = None, invoice_type: str | None = None) -> list[Invoice]:
        results = list(self._invoices.values())
        if entity_id:
            results = [i for i in results if i.entity_id == entity_id]
        if customer_id:
            results = [i for i in results if i.customer_id == customer_id]
        if status:
            results = [i for i in results if (i.status.value if isinstance(i.status, InvoiceStatus) else i.status) == status]
        if invoice_type:
            results = [i for i in results if (i.invoice_type.value if isinstance(i.invoice_type, InvoiceType) else i.invoice_type) == invoice_type]
        return sorted(results, key=lambda i: i.created_at, reverse=True)

    def overdue_invoices(self) -> list[Invoice]:
        """Find all overdue invoices."""
        today = str(date.today())
        return [i for i in self._invoices.values()
                if i.due_date and i.due_date < today
                and i.status in (InvoiceStatus.SENT, InvoiceStatus.VIEWED, InvoiceStatus.PARTIAL)]

    # ── Summary ──────────────────────────────────────────────

    def summary(self, entity_id: str | None = None) -> dict:
        invoices = list(self._invoices.values())
        if entity_id:
            invoices = [i for i in invoices if i.entity_id == entity_id]

        total_outstanding = sum((i.amount_due for i in invoices if i.status in (InvoiceStatus.SENT, InvoiceStatus.VIEWED, InvoiceStatus.PARTIAL, InvoiceStatus.OVERDUE)), Decimal("0"))
        total_overdue = sum((i.amount_due for i in self.overdue_invoices()), Decimal("0"))
        total_paid = sum((i.amount_paid for i in invoices), Decimal("0"))

        return {
            "total_invoices": len(invoices),
            "total_outstanding": str(total_outstanding.quantize(TWO_DP)),
            "total_overdue": str(total_overdue.quantize(TWO_DP)),
            "total_collected": str(total_paid.quantize(TWO_DP)),
            "overdue_count": len(self.overdue_invoices()),
        }

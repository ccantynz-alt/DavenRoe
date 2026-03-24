"""Live Receipt Engine — real-time transaction capture and instant categorization.

Flow:
  1. Bank/card processor fires a webhook when an EFTPOS, debit, credit, or
     mobile-pay transaction is processed
  2. Engine receives the transaction, auto-categorizes it, and creates a
     pending receipt
  3. Push notification sent to user's device: "You just spent $42.50 at
     Officeworks — tap to assign"
  4. User opens the tap-to-assign screen:
     - If it's for a client → pick the client from a recent/favorites list
     - If it's a business expense → one tap to confirm category
     - If it's personal → one tap to mark as personal/drawings
  5. Receipt is filed, categorized, and linked — done in 5 seconds

Supported payment methods:
  - EFTPOS / Debit card
  - Credit card (Visa, Mastercard, Amex)
  - Apple Pay / Google Pay / Samsung Pay
  - Bank transfer (real-time via NPP/Faster Payments/FedNow)
  - Direct debit

Webhook sources:
  - Plaid (US/CA) — transactions.sync webhook
  - Basiq (AU/NZ) — transaction webhook
  - TrueLayer (UK/EU) — transaction webhook
  - Stripe Issuing — issuing_transaction.created webhook
  - Open Banking APIs (PSD2/CDR)
"""

from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone, timedelta
from enum import Enum


class PaymentMethod(str, Enum):
    EFTPOS = "eftpos"
    DEBIT = "debit"
    CREDIT = "credit"
    APPLE_PAY = "apple_pay"
    GOOGLE_PAY = "google_pay"
    SAMSUNG_PAY = "samsung_pay"
    BANK_TRANSFER = "bank_transfer"
    DIRECT_DEBIT = "direct_debit"
    UNKNOWN = "unknown"


class AssignmentType(str, Enum):
    CLIENT_EXPENSE = "client_expense"      # Billable to a specific client
    BUSINESS_EXPENSE = "business_expense"  # Your own business cost
    PERSONAL = "personal"                  # Not a business expense (drawings)
    SPLIT = "split"                        # Split between business/personal or multiple clients


class ReceiptStatus(str, Enum):
    PENDING = "pending"          # Just arrived, waiting for user action
    ASSIGNED = "assigned"        # User has categorized + assigned
    AUTO_ASSIGNED = "auto_assigned"  # AI auto-assigned (high confidence)
    SKIPPED = "skipped"          # User will deal with it later
    DISMISSED = "dismissed"      # Marked as not relevant


# ── Auto-categorization from merchant name ─────────────────────

MERCHANT_CATEGORIES = {
    # Office supplies
    "officeworks": ("office_supplies", "Office Supplies"),
    "staples": ("office_supplies", "Office Supplies"),
    "office depot": ("office_supplies", "Office Supplies"),
    # Software / Tech
    "adobe": ("software", "Software & Subscriptions"),
    "microsoft": ("software", "Software & Subscriptions"),
    "google": ("software", "Software & Subscriptions"),
    "apple.com": ("software", "Software & Subscriptions"),
    "canva": ("software", "Software & Subscriptions"),
    "zoom": ("software", "Software & Subscriptions"),
    "slack": ("software", "Software & Subscriptions"),
    "atlassian": ("software", "Software & Subscriptions"),
    "github": ("software", "Software & Subscriptions"),
    "aws": ("software", "Cloud & Hosting"),
    "digitalocean": ("software", "Cloud & Hosting"),
    "heroku": ("software", "Cloud & Hosting"),
    # Travel
    "uber": ("travel", "Transport"),
    "lyft": ("travel", "Transport"),
    "ola": ("travel", "Transport"),
    "didi": ("travel", "Transport"),
    "qantas": ("travel", "Flights"),
    "virgin": ("travel", "Flights"),
    "jetstar": ("travel", "Flights"),
    "air new zealand": ("travel", "Flights"),
    "british airways": ("travel", "Flights"),
    "united airlines": ("travel", "Flights"),
    "delta": ("travel", "Flights"),
    "booking.com": ("travel", "Accommodation"),
    "airbnb": ("travel", "Accommodation"),
    "hilton": ("travel", "Accommodation"),
    "marriott": ("travel", "Accommodation"),
    # Meals
    "uber eats": ("meals", "Meals & Entertainment"),
    "doordash": ("meals", "Meals & Entertainment"),
    "menulog": ("meals", "Meals & Entertainment"),
    "deliveroo": ("meals", "Meals & Entertainment"),
    # Fuel
    "shell": ("fuel", "Fuel & Vehicle"),
    "bp": ("fuel", "Fuel & Vehicle"),
    "caltex": ("fuel", "Fuel & Vehicle"),
    "ampol": ("fuel", "Fuel & Vehicle"),
    "7-eleven": ("fuel", "Fuel & Vehicle"),
    "exxon": ("fuel", "Fuel & Vehicle"),
    "chevron": ("fuel", "Fuel & Vehicle"),
    # Telecoms
    "telstra": ("phone_internet", "Phone & Internet"),
    "optus": ("phone_internet", "Phone & Internet"),
    "vodafone": ("phone_internet", "Phone & Internet"),
    "verizon": ("phone_internet", "Phone & Internet"),
    "at&t": ("phone_internet", "Phone & Internet"),
    "t-mobile": ("phone_internet", "Phone & Internet"),
    "nbn": ("phone_internet", "Phone & Internet"),
    # Insurance
    "allianz": ("insurance", "Insurance"),
    "qbe": ("insurance", "Insurance"),
    "suncorp": ("insurance", "Insurance"),
    # Groceries (likely personal)
    "woolworths": ("personal", "Groceries (Personal)"),
    "coles": ("personal", "Groceries (Personal)"),
    "aldi": ("personal", "Groceries (Personal)"),
    "countdown": ("personal", "Groceries (Personal)"),
    "tesco": ("personal", "Groceries (Personal)"),
    "walmart": ("personal", "Groceries (Personal)"),
    "costco": ("personal", "Groceries (Personal)"),
    # Payment processing (business)
    "stripe": ("bank_fees", "Payment Processing"),
    "paypal": ("bank_fees", "Payment Processing"),
    "square": ("bank_fees", "Payment Processing"),
    "gocardless": ("bank_fees", "Payment Processing"),
    # Printing / Marketing
    "vistaprint": ("advertising", "Marketing & Print"),
    "moo.com": ("advertising", "Marketing & Print"),
}


class LiveReceiptEngine:
    """Processes real-time transactions and manages instant assignment."""

    def __init__(self):
        self.pending_receipts: dict[str, dict] = {}
        self.assigned_receipts: dict[str, dict] = {}
        self.user_preferences: dict[str, dict] = {}  # user_id -> preferences
        self.notification_queue: list[dict] = []
        self.recent_clients: dict[str, list[str]] = {}  # user_id -> [client names]

    def receive_transaction(
        self,
        user_id: str,
        amount: float,
        currency: str,
        merchant_name: str,
        merchant_category_code: str | None = None,
        payment_method: str = "unknown",
        card_last_four: str | None = None,
        transaction_id: str | None = None,
        bank_reference: str | None = None,
        timestamp: str | None = None,
        source: str = "webhook",
    ) -> dict:
        """Process an incoming transaction from a bank/card webhook."""
        receipt_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)

        # Auto-categorize from merchant name
        category = self._auto_categorize(merchant_name)

        # Detect payment method from string
        pm = self._detect_payment_method(payment_method)

        # Check if this merchant has been assigned before (learn from history)
        learned = self._check_learned_assignment(user_id, merchant_name)

        receipt = {
            "id": receipt_id,
            "user_id": user_id,
            "transaction_id": transaction_id or receipt_id,
            "bank_reference": bank_reference,
            "amount": abs(amount),
            "currency": currency,
            "merchant_name": merchant_name,
            "merchant_clean": self._clean_merchant_name(merchant_name),
            "merchant_category_code": merchant_category_code,
            "payment_method": pm.value,
            "card_last_four": card_last_four,
            "category_code": category[0] if category else None,
            "category_label": category[1] if category else None,
            "suggested_assignment": learned.get("assignment_type") if learned else None,
            "suggested_client": learned.get("client_name") if learned else None,
            "assignment_type": None,
            "assigned_client": None,
            "assigned_category": category[0] if category else None,
            "note": "",
            "photo_url": None,
            "status": ReceiptStatus.PENDING.value,
            "is_likely_personal": category[0] == "personal" if category else False,
            "confidence": learned.get("confidence", 0.5) if learned else (0.7 if category else 0.3),
            "source": source,
            "transaction_time": timestamp or now.isoformat(),
            "received_at": now.isoformat(),
            "assigned_at": None,
            "notification_sent": False,
        }

        # Auto-assign if we're very confident from history
        if learned and learned.get("confidence", 0) >= 0.9:
            receipt["status"] = ReceiptStatus.AUTO_ASSIGNED.value
            receipt["assignment_type"] = learned["assignment_type"]
            receipt["assigned_client"] = learned.get("client_name")
            receipt["assigned_at"] = now.isoformat()
            self.assigned_receipts[receipt_id] = receipt
        else:
            self.pending_receipts[receipt_id] = receipt

        # Queue push notification
        self.notification_queue.append({
            "user_id": user_id,
            "receipt_id": receipt_id,
            "title": f"${abs(amount):.2f} at {self._clean_merchant_name(merchant_name)}",
            "body": self._build_notification_body(receipt),
            "action_url": f"/live-receipt/{receipt_id}",
            "created_at": now.isoformat(),
        })
        receipt["notification_sent"] = True

        return receipt

    def assign_receipt(
        self,
        receipt_id: str,
        assignment_type: str,
        client_name: str | None = None,
        category_code: str | None = None,
        note: str = "",
        split_details: list[dict] | None = None,
    ) -> dict:
        """Assign a pending receipt — the 'tap to assign' action."""
        receipt = self.pending_receipts.get(receipt_id) or self.assigned_receipts.get(receipt_id)
        if not receipt:
            raise ValueError("Receipt not found")

        now = datetime.now(timezone.utc)
        receipt["assignment_type"] = assignment_type
        receipt["assigned_client"] = client_name
        receipt["note"] = note
        receipt["assigned_at"] = now.isoformat()
        receipt["status"] = ReceiptStatus.ASSIGNED.value

        if category_code:
            receipt["assigned_category"] = category_code

        if split_details:
            receipt["split_details"] = split_details

        # Move from pending to assigned
        if receipt_id in self.pending_receipts:
            del self.pending_receipts[receipt_id]
        self.assigned_receipts[receipt_id] = receipt

        # Learn from this assignment for future auto-suggest
        self._learn_assignment(receipt)

        # Track recent clients
        if client_name:
            user_id = receipt["user_id"]
            if user_id not in self.recent_clients:
                self.recent_clients[user_id] = []
            clients = self.recent_clients[user_id]
            if client_name in clients:
                clients.remove(client_name)
            clients.insert(0, client_name)
            self.recent_clients[user_id] = clients[:20]  # Keep last 20

        return receipt

    def skip_receipt(self, receipt_id: str) -> dict:
        """Skip a receipt (will deal with it later in review queue)."""
        receipt = self.pending_receipts.get(receipt_id)
        if not receipt:
            raise ValueError("Receipt not found")
        receipt["status"] = ReceiptStatus.SKIPPED.value
        return receipt

    def dismiss_receipt(self, receipt_id: str) -> dict:
        """Dismiss a receipt (not relevant / duplicate)."""
        receipt = self.pending_receipts.get(receipt_id)
        if not receipt:
            raise ValueError("Receipt not found")
        receipt["status"] = ReceiptStatus.DISMISSED.value
        del self.pending_receipts[receipt_id]
        return receipt

    def get_pending(self, user_id: str) -> list[dict]:
        """Get all pending receipts for a user, newest first."""
        results = [r for r in self.pending_receipts.values() if r["user_id"] == user_id]
        return sorted(results, key=lambda r: r["received_at"], reverse=True)

    def get_recent_assigned(self, user_id: str, limit: int = 20) -> list[dict]:
        """Get recently assigned receipts."""
        results = [r for r in self.assigned_receipts.values() if r["user_id"] == user_id]
        results.sort(key=lambda r: r["assigned_at"] or r["received_at"], reverse=True)
        return results[:limit]

    def get_recent_clients(self, user_id: str) -> list[str]:
        """Get recently used client names for quick assignment."""
        return self.recent_clients.get(user_id, [])

    def get_notifications(self, user_id: str, limit: int = 10) -> list[dict]:
        """Get recent notifications for a user."""
        notifs = [n for n in self.notification_queue if n["user_id"] == user_id]
        return sorted(notifs, key=lambda n: n["created_at"], reverse=True)[:limit]

    def get_stats(self, user_id: str) -> dict:
        """Get stats for the live receipt system."""
        pending = [r for r in self.pending_receipts.values() if r["user_id"] == user_id]
        assigned = [r for r in self.assigned_receipts.values() if r["user_id"] == user_id]

        total_pending_amount = sum(r["amount"] for r in pending)
        total_assigned_amount = sum(r["amount"] for r in assigned)
        auto_assigned = sum(1 for r in assigned if r["status"] == ReceiptStatus.AUTO_ASSIGNED.value)

        # Average assignment time
        assignment_times = []
        for r in assigned:
            if r.get("received_at") and r.get("assigned_at"):
                received = datetime.fromisoformat(r["received_at"])
                assigned_at = datetime.fromisoformat(r["assigned_at"])
                assignment_times.append((assigned_at - received).total_seconds())

        avg_time = sum(assignment_times) / len(assignment_times) if assignment_times else 0

        return {
            "pending_count": len(pending),
            "pending_amount": round(total_pending_amount, 2),
            "assigned_today": sum(
                1 for r in assigned
                if r.get("assigned_at") and
                datetime.fromisoformat(r["assigned_at"]).date() == datetime.now(timezone.utc).date()
            ),
            "total_assigned": len(assigned),
            "total_assigned_amount": round(total_assigned_amount, 2),
            "auto_assigned_count": auto_assigned,
            "auto_assign_rate": round(auto_assigned / max(len(assigned), 1) * 100, 1),
            "avg_assignment_seconds": round(avg_time, 1),
            "currency": pending[0]["currency"] if pending else assigned[0]["currency"] if assigned else "AUD",
        }

    # ── Internal Helpers ───────────────────────────────────────

    def _auto_categorize(self, merchant_name: str) -> tuple[str, str] | None:
        """Auto-categorize from merchant name."""
        name_lower = merchant_name.lower().strip()
        for keyword, category in MERCHANT_CATEGORIES.items():
            if keyword in name_lower:
                return category
        return None

    def _detect_payment_method(self, raw: str) -> PaymentMethod:
        """Detect payment method from raw string."""
        r = raw.lower()
        if "apple" in r:
            return PaymentMethod.APPLE_PAY
        if "google" in r:
            return PaymentMethod.GOOGLE_PAY
        if "samsung" in r:
            return PaymentMethod.SAMSUNG_PAY
        if "eftpos" in r:
            return PaymentMethod.EFTPOS
        if "debit" in r:
            return PaymentMethod.DEBIT
        if "credit" in r:
            return PaymentMethod.CREDIT
        if "transfer" in r:
            return PaymentMethod.BANK_TRANSFER
        if "direct" in r:
            return PaymentMethod.DIRECT_DEBIT
        return PaymentMethod.UNKNOWN

    def _clean_merchant_name(self, name: str) -> str:
        """Clean up merchant names from raw bank data."""
        # Remove common junk from bank merchant strings
        clean = re.sub(r'\s*(AU|AUS|NZ|UK|US|GB)\s*$', '', name, flags=re.I)
        clean = re.sub(r'\s*\d{4,}$', '', clean)  # trailing numbers
        clean = re.sub(r'\s*(EFTPOS|POS|DEBIT|CREDIT|VISA|MC|AMEX)\s*', ' ', clean, flags=re.I)
        clean = re.sub(r'\s+', ' ', clean).strip()
        # Title case
        if clean.isupper() or clean.islower():
            clean = clean.title()
        return clean or name

    def _check_learned_assignment(self, user_id: str, merchant_name: str) -> dict | None:
        """Check if we've learned how to assign this merchant from history."""
        prefs = self.user_preferences.get(user_id, {})
        merchant_key = merchant_name.lower().strip()

        for key, pref in prefs.items():
            if key in merchant_key or merchant_key in key:
                return pref

        return None

    def _learn_assignment(self, receipt: dict):
        """Learn from a user's assignment to auto-suggest next time."""
        user_id = receipt["user_id"]
        merchant_key = receipt["merchant_name"].lower().strip()

        if user_id not in self.user_preferences:
            self.user_preferences[user_id] = {}

        existing = self.user_preferences[user_id].get(merchant_key, {})
        count = existing.get("count", 0) + 1

        self.user_preferences[user_id][merchant_key] = {
            "assignment_type": receipt["assignment_type"],
            "client_name": receipt.get("assigned_client"),
            "category_code": receipt.get("assigned_category"),
            "count": count,
            "confidence": min(0.95, 0.5 + count * 0.1),  # Grows with repetition
            "last_used": receipt["assigned_at"],
        }

    def _build_notification_body(self, receipt: dict) -> str:
        """Build the notification message body."""
        parts = []
        if receipt.get("payment_method") and receipt["payment_method"] != "unknown":
            method_labels = {
                "eftpos": "EFTPOS", "debit": "Debit Card", "credit": "Credit Card",
                "apple_pay": "Apple Pay", "google_pay": "Google Pay",
                "samsung_pay": "Samsung Pay", "bank_transfer": "Bank Transfer",
            }
            parts.append(method_labels.get(receipt["payment_method"], receipt["payment_method"]))

        if receipt.get("card_last_four"):
            parts.append(f"****{receipt['card_last_four']}")

        if receipt.get("category_label"):
            parts.append(f"Looks like: {receipt['category_label']}")

        if receipt.get("suggested_client"):
            parts.append(f"Assign to {receipt['suggested_client']}?")
        elif receipt.get("is_likely_personal"):
            parts.append("Looks personal — tap to confirm")
        else:
            parts.append("Tap to assign to a client or category")

        return " · ".join(parts)

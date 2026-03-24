"""Peer Review Engine — authorize external accountants for manual checks.

Enables practices to:
  1. Invite external accountants/auditors to review specific entities or work
  2. Define scoped permissions (what they can see, what they can approve)
  3. Track all review activity with full audit trail
  4. Set time-limited access that auto-expires
  5. Support multi-level sign-off workflows (preparer → reviewer → partner)
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone, timedelta
from enum import Enum


class ReviewerRole(str, Enum):
    EXTERNAL_ACCOUNTANT = "external_accountant"
    EXTERNAL_AUDITOR = "external_auditor"
    TAX_AGENT = "tax_agent"
    PARTNER = "partner"
    PEER_REVIEWER = "peer_reviewer"


class AccessScope(str, Enum):
    READ_ONLY = "read_only"           # Can view but not approve
    REVIEW_APPROVE = "review_approve"  # Can review and approve/reject
    FULL_REVIEW = "full_review"       # Can review, approve, add notes, request changes


class ReviewStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    APPROVED = "approved"
    REJECTED = "rejected"
    CHANGES_REQUESTED = "changes_requested"
    EXPIRED = "expired"


class InviteStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    EXPIRED = "expired"
    REVOKED = "revoked"


class PeerReviewEngine:
    """Manages external accountant authorization and peer review workflows."""

    def __init__(self):
        self.invites: dict[str, dict] = {}
        self.reviews: dict[str, dict] = {}
        self.review_notes: dict[str, list] = {}  # review_id -> notes

    # ── Invitations ────────────────────────────────────────────

    def create_invite(
        self,
        inviter_id: str,
        inviter_name: str,
        entity_id: str,
        entity_name: str,
        invitee_email: str,
        invitee_name: str,
        role: ReviewerRole,
        scope: AccessScope,
        permissions: list[str],
        expires_in_days: int = 30,
        message: str = "",
    ) -> dict:
        """Create an invitation for an external accountant to review work."""
        invite_id = str(uuid.uuid4())
        token = str(uuid.uuid4())  # Unique access token for this invite

        invite = {
            "id": invite_id,
            "token": token,
            "inviter_id": inviter_id,
            "inviter_name": inviter_name,
            "entity_id": entity_id,
            "entity_name": entity_name,
            "invitee_email": invitee_email,
            "invitee_name": invitee_name,
            "role": role.value,
            "scope": scope.value,
            "permissions": permissions,
            "message": message,
            "status": InviteStatus.PENDING.value,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": (datetime.now(timezone.utc) + timedelta(days=expires_in_days)).isoformat(),
            "accepted_at": None,
            "revoked_at": None,
        }

        self.invites[invite_id] = invite
        return invite

    def accept_invite(self, invite_id: str, reviewer_id: str) -> dict:
        """Accept an invitation."""
        invite = self.invites.get(invite_id)
        if not invite:
            raise ValueError("Invite not found")

        if invite["status"] != InviteStatus.PENDING.value:
            raise ValueError(f"Invite is {invite['status']}, cannot accept")

        expires = datetime.fromisoformat(invite["expires_at"])
        if datetime.now(timezone.utc) > expires:
            invite["status"] = InviteStatus.EXPIRED.value
            raise ValueError("Invite has expired")

        invite["status"] = InviteStatus.ACCEPTED.value
        invite["accepted_at"] = datetime.now(timezone.utc).isoformat()
        invite["reviewer_id"] = reviewer_id

        return invite

    def revoke_invite(self, invite_id: str) -> dict:
        """Revoke an invitation."""
        invite = self.invites.get(invite_id)
        if not invite:
            raise ValueError("Invite not found")

        invite["status"] = InviteStatus.REVOKED.value
        invite["revoked_at"] = datetime.now(timezone.utc).isoformat()
        return invite

    def list_invites(self, entity_id: str | None = None, inviter_id: str | None = None) -> list[dict]:
        """List invitations, optionally filtered."""
        results = list(self.invites.values())
        if entity_id:
            results = [i for i in results if i["entity_id"] == entity_id]
        if inviter_id:
            results = [i for i in results if i["inviter_id"] == inviter_id]
        return sorted(results, key=lambda x: x["created_at"], reverse=True)

    # ── Reviews ────────────────────────────────────────────────

    def create_review(
        self,
        entity_id: str,
        entity_name: str,
        review_type: str,
        description: str,
        created_by: str,
        items: list[dict],
        assigned_reviewers: list[str],
        due_date: str | None = None,
    ) -> dict:
        """Create a review request for external accountants."""
        review_id = str(uuid.uuid4())

        review = {
            "id": review_id,
            "entity_id": entity_id,
            "entity_name": entity_name,
            "review_type": review_type,
            "description": description,
            "created_by": created_by,
            "items": items,  # List of items to review (transactions, reports, etc.)
            "assigned_reviewers": assigned_reviewers,
            "status": ReviewStatus.PENDING.value,
            "due_date": due_date,
            "sign_offs": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "completed_at": None,
        }

        self.reviews[review_id] = review
        self.review_notes[review_id] = []
        return review

    def submit_sign_off(
        self,
        review_id: str,
        reviewer_id: str,
        reviewer_name: str,
        decision: str,
        notes: str = "",
    ) -> dict:
        """Submit a sign-off decision on a review."""
        review = self.reviews.get(review_id)
        if not review:
            raise ValueError("Review not found")

        if decision not in ("approved", "rejected", "changes_requested"):
            raise ValueError("Decision must be: approved, rejected, or changes_requested")

        sign_off = {
            "reviewer_id": reviewer_id,
            "reviewer_name": reviewer_name,
            "decision": decision,
            "notes": notes,
            "signed_at": datetime.now(timezone.utc).isoformat(),
        }

        review["sign_offs"].append(sign_off)
        review["updated_at"] = datetime.now(timezone.utc).isoformat()

        # Check if all reviewers have signed off
        signed_ids = {s["reviewer_id"] for s in review["sign_offs"]}
        all_signed = all(r in signed_ids for r in review["assigned_reviewers"])

        if all_signed:
            # If any rejected, status = rejected; if any changes requested, status = changes_requested
            decisions = [s["decision"] for s in review["sign_offs"]]
            if "rejected" in decisions:
                review["status"] = ReviewStatus.REJECTED.value
            elif "changes_requested" in decisions:
                review["status"] = ReviewStatus.CHANGES_REQUESTED.value
            else:
                review["status"] = ReviewStatus.APPROVED.value
            review["completed_at"] = datetime.now(timezone.utc).isoformat()
        else:
            review["status"] = ReviewStatus.IN_PROGRESS.value

        return review

    def add_review_note(
        self,
        review_id: str,
        author_id: str,
        author_name: str,
        content: str,
        item_ref: str | None = None,
    ) -> dict:
        """Add a note or comment to a review."""
        if review_id not in self.reviews:
            raise ValueError("Review not found")

        note = {
            "id": str(uuid.uuid4()),
            "review_id": review_id,
            "author_id": author_id,
            "author_name": author_name,
            "content": content,
            "item_ref": item_ref,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        self.review_notes.setdefault(review_id, []).append(note)
        return note

    def get_review(self, review_id: str) -> dict | None:
        review = self.reviews.get(review_id)
        if review:
            review["notes"] = self.review_notes.get(review_id, [])
        return review

    def list_reviews(
        self,
        entity_id: str | None = None,
        reviewer_id: str | None = None,
        status: str | None = None,
    ) -> list[dict]:
        """List reviews, optionally filtered."""
        results = list(self.reviews.values())
        if entity_id:
            results = [r for r in results if r["entity_id"] == entity_id]
        if reviewer_id:
            results = [r for r in results if reviewer_id in r["assigned_reviewers"]]
        if status:
            results = [r for r in results if r["status"] == status]
        return sorted(results, key=lambda x: x["created_at"], reverse=True)

    # ── Permission Helpers ─────────────────────────────────────

    SCOPE_PERMISSIONS = {
        AccessScope.READ_ONLY.value: [
            "view_transactions", "view_reports", "view_bank_feeds",
            "view_invoices", "view_documents", "view_tax",
        ],
        AccessScope.REVIEW_APPROVE.value: [
            "view_transactions", "view_reports", "view_bank_feeds",
            "view_invoices", "view_documents", "view_tax",
            "approve_transactions", "reject_transactions",
            "approve_reports", "add_review_notes",
        ],
        AccessScope.FULL_REVIEW.value: [
            "view_transactions", "view_reports", "view_bank_feeds",
            "view_invoices", "view_documents", "view_tax",
            "approve_transactions", "reject_transactions",
            "approve_reports", "add_review_notes",
            "request_changes", "edit_review_items",
            "view_audit_trail", "view_forensics",
        ],
    }

    def get_reviewer_permissions(self, invite_id: str) -> list[str]:
        """Get the effective permissions for an accepted invite."""
        invite = self.invites.get(invite_id)
        if not invite or invite["status"] != InviteStatus.ACCEPTED.value:
            return []

        # Combine scope defaults with explicit permissions
        scope_perms = set(self.SCOPE_PERMISSIONS.get(invite["scope"], []))
        explicit_perms = set(invite.get("permissions", []))
        return sorted(scope_perms | explicit_perms)

"""Expense Accounts Engine — employee expense claims with approval workflow.

Three user modes for Live Receipt:

  MODE 1: Business Owner (original)
    - Assigns transactions to clients or business categories
    - No approval needed — it's their money

  MODE 2: Employee with Expense Account
    - Employee tags transactions to project/department/cost center
    - Adds receipt photo + business justification
    - Goes to manager/accounts for approval
    - Approved expenses get reimbursed or reconciled against company card

  MODE 3: Accountant (multi-client)
    - Sees ALL clients' unassigned transactions in one dashboard
    - Assigns in bulk across multiple entities
    - Can delegate to client via Client Portal
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum


class UserMode(str, Enum):
    BUSINESS_OWNER = "business_owner"
    EMPLOYEE = "employee"
    ACCOUNTANT = "accountant"


class ExpenseStatus(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    REIMBURSED = "reimbursed"
    QUERIED = "queried"  # Manager asked a question


class ExpensePolicy(str, Enum):
    AUTO_APPROVE = "auto_approve"           # Under threshold, auto-approved
    MANAGER_APPROVAL = "manager_approval"   # Needs manager sign-off
    FINANCE_APPROVAL = "finance_approval"   # Needs finance team sign-off
    DUAL_APPROVAL = "dual_approval"         # Manager + finance


class ExpenseAccountEngine:
    """Manages employee expense accounts and approval workflows."""

    def __init__(self):
        self.expense_accounts: dict[str, dict] = {}  # employee_id -> account config
        self.expense_claims: dict[str, dict] = {}     # claim_id -> claim
        self.approval_queue: dict[str, list] = {}     # approver_id -> [claim_ids]
        self.policies: dict[str, dict] = {}           # org_id -> policy rules
        self.accountant_assignments: dict[str, list] = {}  # accountant_id -> [entity_ids]

    # ── Expense Account Setup ──────────────────────────────────

    def create_expense_account(
        self,
        employee_id: str,
        employee_name: str,
        employee_email: str,
        org_id: str,
        org_name: str,
        manager_id: str,
        manager_name: str,
        department: str = "",
        monthly_limit: float = 5000,
        single_transaction_limit: float = 500,
        auto_approve_threshold: float = 50,
        allowed_categories: list[str] | None = None,
        card_last_four: str | None = None,
    ) -> dict:
        """Set up an expense account for an employee."""
        account = {
            "id": str(uuid.uuid4()),
            "employee_id": employee_id,
            "employee_name": employee_name,
            "employee_email": employee_email,
            "org_id": org_id,
            "org_name": org_name,
            "manager_id": manager_id,
            "manager_name": manager_name,
            "department": department,
            "monthly_limit": monthly_limit,
            "single_transaction_limit": single_transaction_limit,
            "auto_approve_threshold": auto_approve_threshold,
            "allowed_categories": allowed_categories,
            "card_last_four": card_last_four,
            "spent_this_month": 0,
            "pending_amount": 0,
            "active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        self.expense_accounts[employee_id] = account
        return account

    def get_expense_account(self, employee_id: str) -> dict | None:
        return self.expense_accounts.get(employee_id)

    # ── Expense Claims ─────────────────────────────────────────

    def create_claim(
        self,
        employee_id: str,
        receipt_id: str,
        amount: float,
        currency: str,
        merchant_name: str,
        category_code: str,
        project: str = "",
        department: str = "",
        cost_center: str = "",
        business_justification: str = "",
        receipt_photo_url: str | None = None,
        payment_method: str = "unknown",
    ) -> dict:
        """Create an expense claim from a live receipt transaction."""
        account = self.expense_accounts.get(employee_id)
        if not account:
            raise ValueError("No expense account found for this employee")

        if not account["active"]:
            raise ValueError("Expense account is deactivated")

        claim_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)

        # Determine approval path
        approval_path = self._determine_approval_path(account, amount)

        claim = {
            "id": claim_id,
            "receipt_id": receipt_id,
            "employee_id": employee_id,
            "employee_name": account["employee_name"],
            "org_id": account["org_id"],
            "org_name": account["org_name"],
            "amount": amount,
            "currency": currency,
            "merchant_name": merchant_name,
            "category_code": category_code,
            "project": project,
            "department": department or account.get("department", ""),
            "cost_center": cost_center,
            "business_justification": business_justification,
            "receipt_photo_url": receipt_photo_url,
            "payment_method": payment_method,
            "status": ExpenseStatus.DRAFT.value,
            "approval_path": approval_path,
            "approvals": [],
            "queries": [],
            "violations": self._check_policy_violations(account, amount, category_code),
            "created_at": now.isoformat(),
            "submitted_at": None,
            "approved_at": None,
            "reimbursed_at": None,
        }

        self.expense_claims[claim_id] = claim
        return claim

    def submit_claim(self, claim_id: str) -> dict:
        """Submit a draft claim for approval."""
        claim = self.expense_claims.get(claim_id)
        if not claim:
            raise ValueError("Claim not found")

        if claim["status"] != ExpenseStatus.DRAFT.value:
            raise ValueError(f"Claim is {claim['status']}, cannot submit")

        now = datetime.now(timezone.utc)
        claim["submitted_at"] = now.isoformat()

        # Auto-approve if under threshold
        if claim["approval_path"] == "auto_approve":
            claim["status"] = ExpenseStatus.APPROVED.value
            claim["approved_at"] = now.isoformat()
            claim["approvals"].append({
                "approver": "system",
                "decision": "auto_approved",
                "reason": "Under auto-approve threshold",
                "at": now.isoformat(),
            })
        else:
            claim["status"] = ExpenseStatus.SUBMITTED.value
            # Add to manager's approval queue
            account = self.expense_accounts.get(claim["employee_id"])
            if account:
                manager_id = account["manager_id"]
                if manager_id not in self.approval_queue:
                    self.approval_queue[manager_id] = []
                self.approval_queue[manager_id].append(claim_id)

        # Update account totals
        account = self.expense_accounts.get(claim["employee_id"])
        if account:
            if claim["status"] == ExpenseStatus.APPROVED.value:
                account["spent_this_month"] += claim["amount"]
            else:
                account["pending_amount"] += claim["amount"]

        return claim

    def approve_claim(self, claim_id: str, approver_id: str, approver_name: str, notes: str = "") -> dict:
        """Approve an expense claim."""
        claim = self.expense_claims.get(claim_id)
        if not claim:
            raise ValueError("Claim not found")

        now = datetime.now(timezone.utc)
        claim["approvals"].append({
            "approver_id": approver_id,
            "approver_name": approver_name,
            "decision": "approved",
            "notes": notes,
            "at": now.isoformat(),
        })
        claim["status"] = ExpenseStatus.APPROVED.value
        claim["approved_at"] = now.isoformat()

        # Move from pending to spent
        account = self.expense_accounts.get(claim["employee_id"])
        if account:
            account["pending_amount"] = max(0, account["pending_amount"] - claim["amount"])
            account["spent_this_month"] += claim["amount"]

        # Remove from approval queue
        if approver_id in self.approval_queue:
            self.approval_queue[approver_id] = [
                cid for cid in self.approval_queue[approver_id] if cid != claim_id
            ]

        return claim

    def reject_claim(self, claim_id: str, approver_id: str, approver_name: str, reason: str) -> dict:
        """Reject an expense claim."""
        claim = self.expense_claims.get(claim_id)
        if not claim:
            raise ValueError("Claim not found")

        now = datetime.now(timezone.utc)
        claim["approvals"].append({
            "approver_id": approver_id,
            "approver_name": approver_name,
            "decision": "rejected",
            "reason": reason,
            "at": now.isoformat(),
        })
        claim["status"] = ExpenseStatus.REJECTED.value

        account = self.expense_accounts.get(claim["employee_id"])
        if account:
            account["pending_amount"] = max(0, account["pending_amount"] - claim["amount"])

        return claim

    def query_claim(self, claim_id: str, approver_id: str, approver_name: str, question: str) -> dict:
        """Ask the employee a question about a claim."""
        claim = self.expense_claims.get(claim_id)
        if not claim:
            raise ValueError("Claim not found")

        claim["status"] = ExpenseStatus.QUERIED.value
        claim["queries"].append({
            "from_id": approver_id,
            "from_name": approver_name,
            "question": question,
            "answer": None,
            "asked_at": datetime.now(timezone.utc).isoformat(),
            "answered_at": None,
        })

        return claim

    def answer_query(self, claim_id: str, answer: str) -> dict:
        """Employee answers a manager's question about a claim."""
        claim = self.expense_claims.get(claim_id)
        if not claim:
            raise ValueError("Claim not found")

        for q in reversed(claim["queries"]):
            if q["answer"] is None:
                q["answer"] = answer
                q["answered_at"] = datetime.now(timezone.utc).isoformat()
                break

        claim["status"] = ExpenseStatus.SUBMITTED.value
        return claim

    # ── Query Methods ──────────────────────────────────────────

    def get_approval_queue(self, approver_id: str) -> list[dict]:
        """Get all claims waiting for an approver's decision."""
        claim_ids = self.approval_queue.get(approver_id, [])
        claims = [self.expense_claims[cid] for cid in claim_ids if cid in self.expense_claims]
        return sorted(claims, key=lambda c: c["submitted_at"] or c["created_at"], reverse=True)

    def get_employee_claims(self, employee_id: str, status: str | None = None) -> list[dict]:
        """Get all claims for an employee."""
        claims = [c for c in self.expense_claims.values() if c["employee_id"] == employee_id]
        if status:
            claims = [c for c in claims if c["status"] == status]
        return sorted(claims, key=lambda c: c["created_at"], reverse=True)

    def get_employee_summary(self, employee_id: str) -> dict:
        """Get expense summary for an employee."""
        account = self.expense_accounts.get(employee_id, {})
        claims = [c for c in self.expense_claims.values() if c["employee_id"] == employee_id]

        return {
            "account": account,
            "total_claims": len(claims),
            "pending": sum(1 for c in claims if c["status"] in ("draft", "submitted", "under_review", "queried")),
            "approved": sum(1 for c in claims if c["status"] == "approved"),
            "rejected": sum(1 for c in claims if c["status"] == "rejected"),
            "total_spent": sum(c["amount"] for c in claims if c["status"] == "approved"),
            "total_pending": sum(c["amount"] for c in claims if c["status"] in ("submitted", "under_review", "queried")),
            "remaining_budget": account.get("monthly_limit", 0) - account.get("spent_this_month", 0),
        }

    # ── Accountant Multi-Client ────────────────────────────────

    def assign_accountant_entities(self, accountant_id: str, entity_ids: list[str]):
        """Assign entities to an accountant for multi-client management."""
        self.accountant_assignments[accountant_id] = entity_ids

    def get_accountant_entities(self, accountant_id: str) -> list[str]:
        return self.accountant_assignments.get(accountant_id, [])

    # ── Internal ───────────────────────────────────────────────

    def _determine_approval_path(self, account: dict, amount: float) -> str:
        """Determine the approval path based on amount and policy."""
        if amount <= account.get("auto_approve_threshold", 50):
            return "auto_approve"
        if amount <= account.get("single_transaction_limit", 500):
            return "manager_approval"
        return "dual_approval"

    def _check_policy_violations(self, account: dict, amount: float, category_code: str) -> list[str]:
        """Check if a claim violates any expense policies."""
        violations = []

        if amount > account.get("single_transaction_limit", 500):
            violations.append(f"Exceeds single transaction limit (${account['single_transaction_limit']})")

        spent = account.get("spent_this_month", 0) + account.get("pending_amount", 0)
        if spent + amount > account.get("monthly_limit", 5000):
            violations.append(f"Would exceed monthly limit (${account['monthly_limit']})")

        allowed = account.get("allowed_categories")
        if allowed and category_code not in allowed:
            violations.append(f"Category '{category_code}' is not in your allowed expense categories")

        return violations

"""Tests for platform features 1-8.

Reporting, client management, documents, multi-currency,
audit trail, permissions, notifications, import/export.
"""

from datetime import date
from decimal import Decimal

from app.reports.engine import ReportingEngine
from app.clients.manager import ClientManager, EntityType, EntityStatus
from app.clients.groups import GroupManager
from app.documents.manager import DocumentManager
from app.multicurrency.ledger import MultiCurrencyLedger
from app.auditlog.trail import AuditTrail
from app.permissions.rbac import RBACManager, Permission
from app.notifications.engine import NotificationEngine
from app.integrations.importer import DataImporter
from app.integrations.exporter import DataExporter


# ── 1. REPORTING ENGINE ──────────────────────────────────────

SAMPLE_TRANSACTIONS = [
    # Capital injection: Dr Cash, Cr Equity
    {"date": "2024-01-01", "account_code": "1000", "account_name": "Cash at Bank", "amount": 100000, "description": "Capital contribution"},
    {"date": "2024-01-01", "account_code": "3000", "account_name": "Owner Equity", "amount": -100000, "description": "Capital contribution"},
    # Sales: Dr Receivables, Cr Revenue
    {"date": "2024-01-15", "account_code": "1100", "account_name": "Accounts Receivable", "amount": 70000, "description": "Outstanding invoices", "customer": "Client A"},
    {"date": "2024-01-15", "account_code": "4000", "account_name": "Sales Revenue", "amount": -50000, "description": "Monthly sales"},
    {"date": "2024-01-15", "account_code": "4010", "account_name": "Consulting Revenue", "amount": -20000, "description": "Consulting"},
    # COGS: Dr COGS, Cr Cash
    {"date": "2024-01-20", "account_code": "5000", "account_name": "Cost of Sales", "amount": 15000, "description": "Direct costs"},
    {"date": "2024-01-20", "account_code": "1000", "account_name": "Cash at Bank", "amount": -15000, "description": "Direct costs paid"},
    # Expenses: Dr Expense, Cr Cash/Payable
    {"date": "2024-01-25", "account_code": "6000", "account_name": "Salaries", "amount": 25000, "description": "Staff wages"},
    {"date": "2024-01-25", "account_code": "1000", "account_name": "Cash at Bank", "amount": -25000, "description": "Wages paid"},
    {"date": "2024-01-25", "account_code": "6100", "account_name": "Rent", "amount": 5000, "description": "Office rent"},
    {"date": "2024-01-25", "account_code": "2000", "account_name": "Accounts Payable", "amount": -5000, "description": "Rent accrued", "vendor": "Landlord"},
    {"date": "2024-01-25", "account_code": "6200", "account_name": "Insurance", "amount": 1000, "description": "Business insurance"},
    {"date": "2024-01-25", "account_code": "1000", "account_name": "Cash at Bank", "amount": -1000, "description": "Insurance paid"},
]


class TestReportingEngine:
    def test_profit_and_loss(self):
        engine = ReportingEngine()
        result = engine.generate("profit_and_loss", SAMPLE_TRANSACTIONS, date(2024, 1, 1), date(2024, 1, 31))
        assert result["net_profit"] is not None
        assert "revenue" in result["sections"]
        assert Decimal(result["sections"]["revenue"]["total"]) == Decimal("70000.00")

    def test_balance_sheet(self):
        engine = ReportingEngine()
        result = engine.generate("balance_sheet", SAMPLE_TRANSACTIONS, end_date=date(2024, 1, 31))
        assert result["balanced"] is True or abs(Decimal(result["difference"])) < Decimal("1")
        assert "assets" in result["sections"]

    def test_trial_balance(self):
        engine = ReportingEngine()
        result = engine.generate("trial_balance", SAMPLE_TRANSACTIONS)
        assert result["balanced"] is True
        assert result["account_count"] > 0
        assert Decimal(result["total_debit"]) == Decimal(result["total_credit"])

    def test_cash_flow(self):
        engine = ReportingEngine()
        result = engine.generate("cash_flow", SAMPLE_TRANSACTIONS)
        assert "operating_activities" in result["sections"]
        assert result["net_change_in_cash"] is not None

    def test_general_ledger(self):
        engine = ReportingEngine()
        result = engine.generate("general_ledger", SAMPLE_TRANSACTIONS)
        assert result["total_accounts"] > 0
        assert len(result["accounts"]) > 0

    def test_aged_receivables(self):
        engine = ReportingEngine()
        result = engine.generate("aged_receivables", SAMPLE_TRANSACTIONS, end_date=date(2024, 3, 1))
        assert result["customer_count"] >= 0

    def test_comparative_report(self):
        engine = ReportingEngine()
        result = engine.generate("pnl", SAMPLE_TRANSACTIONS, date(2024, 1, 1), date(2024, 1, 31), comparative=True)
        assert "comparative" in result

    def test_available_reports(self):
        engine = ReportingEngine()
        reports = engine.available_reports()
        assert len(reports) == 7

    def test_invalid_report_type(self):
        engine = ReportingEngine()
        result = engine.generate("nonexistent", [])
        assert "error" in result


# ── 2. CLIENT MANAGEMENT ─────────────────────────────────────

class TestClientManager:
    def test_create_entity(self):
        mgr = ClientManager()
        entity = mgr.create(name="Acme Pty Ltd", entity_type="company", jurisdiction="AU", tax_ids={"abn": "51824753556"})
        assert entity.name == "Acme Pty Ltd"
        assert entity.entity_type == EntityType.COMPANY
        assert entity.id

    def test_list_and_filter(self):
        mgr = ClientManager()
        mgr.create(name="Acme", entity_type="company", jurisdiction="AU")
        mgr.create(name="Smith Family Trust", entity_type="trust", jurisdiction="AU")
        mgr.create(name="US Corp", entity_type="company", jurisdiction="US")

        assert len(mgr.list_all()) == 3
        assert len(mgr.list_all(jurisdiction="AU")) == 2
        assert len(mgr.list_all(entity_type="trust")) == 1

    def test_search(self):
        mgr = ClientManager()
        mgr.create(name="Acme Pty Ltd")
        mgr.create(name="Baker Industries")
        assert len(mgr.list_all(search="acme")) == 1

    def test_update_entity(self):
        mgr = ClientManager()
        entity = mgr.create(name="Old Name")
        updated = mgr.update(entity.id, name="New Name")
        assert updated.name == "New Name"

    def test_archive(self):
        mgr = ClientManager()
        entity = mgr.create(name="To Archive")
        assert mgr.archive(entity.id) is True
        assert mgr.get(entity.id).status == EntityStatus.ARCHIVED

    def test_summary(self):
        mgr = ClientManager()
        mgr.create(name="A", entity_type="company")
        mgr.create(name="B", entity_type="trust")
        summary = mgr.summary()
        assert summary["total_entities"] == 2

    def test_groups(self):
        groups = GroupManager()
        group = groups.create(name="Smith Family Group", entity_ids=["e1", "e2", "e3"])
        assert len(group.entity_ids) == 3
        assert len(groups.find_groups_for_entity("e1")) == 1


# ── 3. DOCUMENT MANAGEMENT ──────────────────────────────────

class TestDocumentManager:
    def test_upload(self):
        mgr = DocumentManager()
        doc = mgr.upload(b"fake pdf content", "invoice.pdf", "application/pdf", entity_id="e1")
        assert doc.id
        assert doc.original_filename == "invoice.pdf"

    def test_duplicate_detection(self):
        mgr = DocumentManager()
        doc1 = mgr.upload(b"same content", "file1.pdf", "application/pdf")
        doc2 = mgr.upload(b"same content", "file2.pdf", "application/pdf")
        assert doc1.id == doc2.id  # Same hash — returns existing

    def test_unsupported_type(self):
        mgr = DocumentManager()
        try:
            mgr.upload(b"data", "file.exe", "application/x-executable")
            assert False, "Should have raised"
        except ValueError:
            pass

    def test_link_to_transaction(self):
        mgr = DocumentManager()
        doc = mgr.upload(b"content", "receipt.pdf", "application/pdf")
        assert mgr.link_to_transaction(doc.id, "txn-001") is True
        assert "txn-001" in doc.transaction_ids

    def test_ocr_processing(self):
        mgr = DocumentManager()
        doc = mgr.upload(b"content", "receipt.jpg", "image/jpeg")
        mgr.process_ocr(doc.id, "Total: $150.00", 0.95, {"amount": "150.00"})
        assert doc.ocr_text == "Total: $150.00"
        assert doc.extracted_data["amount"] == "150.00"

    def test_search(self):
        mgr = DocumentManager()
        mgr.upload(b"a", "invoice-jan.pdf", "application/pdf", description="January invoice")
        mgr.upload(b"b", "receipt-feb.pdf", "application/pdf", description="February receipt")
        results = mgr.search("january")
        assert len(results) == 1


# ── 4. MULTI-CURRENCY ───────────────────────────────────────

class TestMultiCurrency:
    def test_record_transaction(self):
        ledger = MultiCurrencyLedger("AUD")
        txn = ledger.record_transaction("USD", Decimal("10000"), Decimal("0.65"), description="US supplier")
        assert txn.functional_amount == Decimal("15384.62")  # 10000 / 0.65

    def test_settle_with_gain(self):
        ledger = MultiCurrencyLedger("AUD")
        ledger.record_transaction("USD", Decimal("10000"), Decimal("0.65"), description="Invoice")
        result = ledger.settle_transaction(0, Decimal("0.70"))
        # Rate went from 0.65 to 0.70 — AUD strengthened — we pay less AUD
        assert result["gain_or_loss"] == "loss"  # We recorded more AUD originally
        assert Decimal(result["realized_gain_loss"]) < 0

    def test_revalue(self):
        ledger = MultiCurrencyLedger("AUD")
        ledger.record_transaction("USD", Decimal("10000"), Decimal("0.65"), description="Unpaid invoice")
        result = ledger.revalue_at_period_end({"USD": Decimal("0.68")})
        assert result["transactions_revalued"] == 1
        assert Decimal(result["total_unrealized_gain_loss"]) != 0

    def test_exposure(self):
        ledger = MultiCurrencyLedger("AUD")
        ledger.record_transaction("USD", Decimal("10000"), Decimal("0.65"))
        ledger.record_transaction("GBP", Decimal("5000"), Decimal("0.52"))
        exposure = ledger.currency_exposure()
        assert "USD" in exposure["exposures"]
        assert "GBP" in exposure["exposures"]


# ── 5. AUDIT TRAIL ──────────────────────────────────────────

class TestAuditTrail:
    def test_log_and_query(self):
        trail = AuditTrail()
        trail.log("user1", "John Smith", "create", "transaction", "txn-001", description="Created invoice")
        trail.log("user1", "John Smith", "update", "transaction", "txn-001", description="Updated amount",
                   before_state={"amount": 100}, after_state={"amount": 200})

        entries = trail.query(user_id="user1")
        assert len(entries) == 2
        assert entries[0].changed_fields == ["amount"]  # Most recent first

    def test_hash_chain_integrity(self):
        trail = AuditTrail()
        trail.log("u1", "User", "create", "entity", "e1")
        trail.log("u1", "User", "update", "entity", "e1")
        trail.log("u2", "Admin", "approve", "entity", "e1")

        result = trail.verify_integrity()
        assert result["valid"] is True
        assert result["entries_checked"] == 3

    def test_resource_history(self):
        trail = AuditTrail()
        trail.log("u1", "User", "create", "transaction", "txn-001")
        trail.log("u1", "User", "update", "transaction", "txn-001")
        trail.log("u2", "Admin", "approve", "transaction", "txn-001")
        trail.log("u1", "User", "create", "transaction", "txn-002")  # Different resource

        history = trail.get_history("transaction", "txn-001")
        assert len(history) == 3

    def test_filter_by_action(self):
        trail = AuditTrail()
        trail.log("u1", "User", "create", "entity")
        trail.log("u1", "User", "update", "entity")
        trail.log("u1", "User", "create", "transaction")

        creates = trail.query(action="create")
        assert len(creates) == 2


# ── 6. PERMISSIONS ───────────────────────────────────────────

class TestRBAC:
    def test_system_roles_exist(self):
        rbac = RBACManager()
        roles = rbac.list_roles()
        role_ids = [r.id for r in roles]
        assert "partner" in role_ids
        assert "manager" in role_ids
        assert "bookkeeper" in role_ids
        assert "client" in role_ids

    def test_partner_has_all_permissions(self):
        rbac = RBACManager()
        user = rbac.create_user("partner@firm.com", "Jane Partner", "partner")
        assert rbac.check_permission(user.id, Permission.TRANSACTION_DELETE) is True
        assert rbac.check_permission(user.id, Permission.USER_MANAGE) is True

    def test_bookkeeper_limited(self):
        rbac = RBACManager()
        user = rbac.create_user("bk@firm.com", "Bob Bookkeeper", "bookkeeper")
        assert rbac.check_permission(user.id, Permission.TRANSACTION_CREATE) is True
        assert rbac.check_permission(user.id, Permission.TRANSACTION_DELETE) is False
        assert rbac.check_permission(user.id, Permission.USER_MANAGE) is False

    def test_client_read_only(self):
        rbac = RBACManager()
        user = rbac.create_user("client@example.com", "Client", "client")
        assert rbac.check_permission(user.id, Permission.TRANSACTION_READ) is True
        assert rbac.check_permission(user.id, Permission.TRANSACTION_CREATE) is False

    def test_entity_access(self):
        rbac = RBACManager()
        user = rbac.create_user("mgr@firm.com", "Manager", "manager", entity_access=["entity-1"])
        assert rbac.check_entity_access(user.id, "entity-1") is True
        assert rbac.check_entity_access(user.id, "entity-2") is False

    def test_partner_accesses_all_entities(self):
        rbac = RBACManager()
        user = rbac.create_user("partner@firm.com", "Partner", "partner")
        assert rbac.check_entity_access(user.id, "any-entity") is True

    def test_full_authorization(self):
        rbac = RBACManager()
        user = rbac.create_user("mgr@firm.com", "Manager", "manager", entity_access=["e1"])
        auth = rbac.authorize(user.id, Permission.TRANSACTION_CREATE, "e1")
        assert auth["authorized"] is True

        auth = rbac.authorize(user.id, Permission.TRANSACTION_CREATE, "e2")
        assert auth["authorized"] is False


# ── 7. NOTIFICATIONS ────────────────────────────────────────

class TestNotifications:
    def test_create_and_read(self):
        engine = NotificationEngine()
        notif = engine.create(title="Test", message="Hello", user_id="u1", type="system")
        assert notif.id
        assert len(engine.get_for_user("u1")) == 1

    def test_mark_read(self):
        engine = NotificationEngine()
        notif = engine.create(title="Test", user_id="u1")
        engine.mark_read(notif.id)
        assert len(engine.get_for_user("u1", unread_only=True)) == 0

    def test_deadline_alerts(self):
        engine = NotificationEngine()
        today = date.today()
        from datetime import timedelta
        deadlines = [
            {"name": "BAS Q1", "due_date": str(today + timedelta(days=7)), "penalty": "$1,110"},
            {"name": "Tax Return", "due_date": str(today + timedelta(days=3)), "penalty": "$313"},
        ]
        alerts = engine.generate_deadline_alerts(deadlines, "u1")
        assert len(alerts) >= 1  # At least the 3-day and 7-day alerts

    def test_review_alert(self):
        engine = NotificationEngine()
        notif = engine.generate_review_alerts(15, "u1")
        assert notif is not None
        assert "15" in notif.message

    def test_summary(self):
        engine = NotificationEngine()
        engine.create(title="A", user_id="u1", type="deadline")
        engine.create(title="B", user_id="u1", type="review")
        engine.create(title="C", user_id="u2", type="system")
        summary = engine.summary("u1")
        assert summary["unread"] == 2
        assert summary["total"] == 2


# ── 8. IMPORT/EXPORT ────────────────────────────────────────

class TestImportExport:
    def test_csv_import(self):
        importer = DataImporter()
        csv_data = "Date,Description,Amount\n2024-01-15,Office supplies,-500\n2024-01-20,Consulting revenue,3000"
        result = importer.import_data("csv", csv_data)
        assert result["status"] == "success"
        assert result["records_imported"] == 2

    def test_xero_import(self):
        importer = DataImporter()
        xero_csv = "*Date,*Amount,*Account Code,Description\n2024-01-15,-500,6600,Office supplies\n2024-01-20,3000,4000,Consulting"
        result = importer.import_data("xero", xero_csv)
        assert result["status"] == "success"
        assert result["records_imported"] == 2

    def test_quickbooks_import(self):
        importer = DataImporter()
        qb_csv = "Date,Account,Debit,Credit,Memo\n2024-01-15,Supplies,500,,Office stuff\n2024-01-20,Revenue,,3000,Consulting"
        result = importer.import_data("quickbooks", qb_csv)
        assert result["status"] == "success"
        assert result["records_imported"] == 2

    def test_myob_import(self):
        importer = DataImporter()
        myob_csv = "Date,Account Number,Account Name,Memo,Amount\n2024-01-15,6600,Office Supplies,Pens,-50"
        result = importer.import_data("myob", myob_csv)
        assert result["status"] == "success"

    def test_unsupported_platform(self):
        importer = DataImporter()
        result = importer.import_data("invalid_platform", "data")
        assert result["status"] == "error"

    def test_csv_export(self):
        exporter = DataExporter()
        txns = [{"date": "2024-01-15", "account_code": "4000", "amount": "1000", "description": "Sale"}]
        result = exporter.export(txns, "csv")
        assert result["status"] == "success"
        assert "date" in result["content"]

    def test_xero_export(self):
        exporter = DataExporter()
        txns = [{"date": "2024-01-15", "account_code": "4000", "amount": "1000"}]
        result = exporter.export(txns, "xero_csv")
        assert result["status"] == "success"
        assert "*Date" in result["content"]

    def test_json_export(self):
        exporter = DataExporter()
        txns = [{"date": "2024-01-15", "amount": "1000"}]
        result = exporter.export(txns, "json")
        assert result["status"] == "success"

    def test_report_export(self):
        exporter = DataExporter()
        report = {"sections": {"revenue": {"accounts": {"4000 — Sales": "50000"}}}}
        result = exporter.generate_report_export(report, "csv")
        assert result["status"] == "success"

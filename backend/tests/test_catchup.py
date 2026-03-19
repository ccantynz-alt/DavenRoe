"""Tests for the catch-up features: bank coverage, inventory, invoicing, marketplace."""

from decimal import Decimal
from app.banking.coverage import get_total_coverage, PROVIDER_COVERAGE
from app.inventory.manager import InventoryManager
from app.invoicing.engine import InvoicingEngine, InvoiceStatus, InvoiceType
from app.integrations.marketplace import Marketplace


# ── Bank Coverage ────────────────────────────────────────────

class TestBankCoverage:
    def test_total_institutions(self):
        coverage = get_total_coverage()
        assert coverage["total_institutions"] >= 21000

    def test_total_countries(self):
        coverage = get_total_coverage()
        assert coverage["total_countries"] >= 29

    def test_all_providers(self):
        assert len(PROVIDER_COVERAGE) == 3

    def test_au_coverage(self):
        au = PROVIDER_COVERAGE["basiq"]["countries"]["AU"]
        assert au["institutions"] >= 200
        assert "Commonwealth Bank" in au["major_banks"]

    def test_us_coverage(self):
        us = PROVIDER_COVERAGE["plaid"]["countries"]["US"]
        assert us["institutions"] >= 11000

    def test_uk_coverage(self):
        gb = PROVIDER_COVERAGE["truelayer"]["countries"]["GB"]
        assert gb["institutions"] >= 600
        assert "Barclays" in gb["major_banks"]

    def test_eu_coverage(self):
        de = PROVIDER_COVERAGE["truelayer"]["countries"]["DE"]
        assert de["institutions"] >= 2500  # Germany has tons of Sparkassen


# ── Inventory ────────────────────────────────────────────────

class TestInventory:
    def test_create_product(self):
        mgr = InventoryManager()
        p = mgr.create_product(sku="WIDGET-001", name="Blue Widget", unit_cost=Decimal("10"), sale_price=Decimal("25"))
        assert p.id
        assert p.sku == "WIDGET-001"

    def test_receive_stock(self):
        mgr = InventoryManager()
        p = mgr.create_product(sku="A", name="Item A", costing_method="weighted_average")
        result = mgr.receive_stock(p.id, Decimal("100"), Decimal("10"))
        assert result["status"] == "received"
        assert p.quantity_on_hand == Decimal("100")

    def test_weighted_average_costing(self):
        mgr = InventoryManager()
        p = mgr.create_product(sku="A", name="Item", costing_method="weighted_average")
        mgr.receive_stock(p.id, Decimal("100"), Decimal("10"))
        mgr.receive_stock(p.id, Decimal("100"), Decimal("20"))
        assert p.unit_cost == Decimal("15.00")  # (100*10 + 100*20) / 200

    def test_sell_stock(self):
        mgr = InventoryManager()
        p = mgr.create_product(sku="A", name="Item", unit_cost=Decimal("10"), sale_price=Decimal("25"))
        mgr.receive_stock(p.id, Decimal("50"), Decimal("10"))
        result = mgr.sell_stock(p.id, Decimal("10"))
        assert result["status"] == "sold"
        assert result["cogs"] == "100.00"
        assert result["revenue"] == "250.00"
        assert result["gross_profit"] == "150.00"
        assert p.quantity_on_hand == Decimal("40")

    def test_insufficient_stock(self):
        mgr = InventoryManager()
        p = mgr.create_product(sku="A", name="Item")
        mgr.receive_stock(p.id, Decimal("5"), Decimal("10"))
        result = mgr.sell_stock(p.id, Decimal("10"))
        assert "error" in result

    def test_fifo_costing(self):
        mgr = InventoryManager()
        p = mgr.create_product(sku="FIFO", name="FIFO Item", costing_method="fifo")
        mgr.receive_stock(p.id, Decimal("10"), Decimal("5"))   # Layer 1: 10 @ $5
        mgr.receive_stock(p.id, Decimal("10"), Decimal("8"))   # Layer 2: 10 @ $8
        result = mgr.sell_stock(p.id, Decimal("15"))
        # FIFO: 10 @ $5 + 5 @ $8 = $50 + $40 = $90
        assert result["cogs"] == "90.00"

    def test_stocktake_adjustment(self):
        mgr = InventoryManager()
        p = mgr.create_product(sku="A", name="Item")
        mgr.receive_stock(p.id, Decimal("100"), Decimal("10"))
        result = mgr.adjust_stock(p.id, Decimal("95"), "stocktake variance")
        assert result["adjustment"] == "-5"
        assert p.quantity_on_hand == Decimal("95")

    def test_reorder_report(self):
        mgr = InventoryManager()
        p = mgr.create_product(sku="LOW", name="Low Stock", reorder_point=Decimal("20"))
        mgr.receive_stock(p.id, Decimal("10"), Decimal("5"))
        report = mgr.reorder_report()
        assert report["items_to_reorder"] == 1

    def test_assembly(self):
        mgr = InventoryManager()
        comp1 = mgr.create_product(sku="C1", name="Component 1", unit_cost=Decimal("5"))
        comp2 = mgr.create_product(sku="C2", name="Component 2", unit_cost=Decimal("3"))
        mgr.receive_stock(comp1.id, Decimal("100"), Decimal("5"))
        mgr.receive_stock(comp2.id, Decimal("100"), Decimal("3"))

        assembly = mgr.create_product(
            sku="KIT-1", name="Assembled Kit", is_assembly=True,
            components=[{"product_id": comp1.id, "quantity": 2}, {"product_id": comp2.id, "quantity": 3}],
        )
        result = mgr.build_assembly(assembly.id, Decimal("5"))
        assert result["status"] == "assembled"
        # Cost: 5 * (2*5 + 3*3) = 5 * 19 = 95, per unit = 19
        assert result["cost_per_unit"] == "19.00"

    def test_valuation_report(self):
        mgr = InventoryManager()
        mgr.create_product(sku="A", name="A", unit_cost=Decimal("10"))
        p = mgr.get_product(mgr.list_products()[0].id)
        mgr.receive_stock(p.id, Decimal("100"), Decimal("10"))
        report = mgr.valuation_report()
        assert Decimal(report["total_value"]) == Decimal("1000.00")


# ── Invoicing ────────────────────────────────────────────────

class TestInvoicing:
    def test_create_invoice(self):
        engine = InvoicingEngine()
        inv = engine.create_invoice(
            lines=[{"description": "Consulting", "quantity": 10, "unit_price": 200, "tax_rate": 10}],
            customer_name="Acme Pty Ltd", issue_date="2024-01-15",
        )
        assert inv.invoice_number.startswith("INV-")
        assert inv.subtotal == Decimal("2000.00")
        assert inv.total_tax == Decimal("200.00")
        assert inv.total == Decimal("2200.00")

    def test_send_invoice(self):
        engine = InvoicingEngine()
        inv = engine.create_invoice(lines=[{"description": "Work", "unit_price": 1000}], customer_name="Client")
        result = engine.send_invoice(inv.id)
        assert result["status"] == "sent"
        assert "payment_link" in result

    def test_record_payment_full(self):
        engine = InvoicingEngine()
        inv = engine.create_invoice(lines=[{"description": "Work", "unit_price": 1000}])
        engine.send_invoice(inv.id)
        result = engine.record_payment(inv.id, Decimal("1000"))
        assert result["invoice_status"] == "paid"

    def test_partial_payment(self):
        engine = InvoicingEngine()
        inv = engine.create_invoice(lines=[{"description": "Work", "unit_price": 1000}])
        engine.record_payment(inv.id, Decimal("400"))
        assert inv.status == InvoiceStatus.PARTIAL
        assert inv.amount_due == Decimal("600")

    def test_create_quote_and_convert(self):
        engine = InvoicingEngine()
        quote = engine.create_invoice(
            lines=[{"description": "Project", "unit_price": 5000}],
            invoice_type="quote", customer_name="Client",
        )
        assert quote.invoice_number.startswith("QTE-")
        inv = engine.convert_quote_to_invoice(quote.id)
        assert inv.invoice_number.startswith("INV-")
        assert inv.total == quote.total

    def test_credit_note(self):
        engine = InvoicingEngine()
        inv = engine.create_invoice(lines=[{"description": "Service", "unit_price": 500}])
        cn = engine.create_credit_note(inv.id)
        assert cn.invoice_number.startswith("CN-")
        assert cn.related_invoice_id == inv.id

    def test_line_discount(self):
        engine = InvoicingEngine()
        inv = engine.create_invoice(
            lines=[{"description": "Item", "quantity": 1, "unit_price": 100, "discount_pct": 10, "tax_rate": 10}],
        )
        assert inv.subtotal == Decimal("90.00")  # 100 - 10%
        assert inv.total_tax == Decimal("9.00")   # 10% of 90
        assert inv.total == Decimal("99.00")

    def test_due_date_from_terms(self):
        engine = InvoicingEngine()
        inv = engine.create_invoice(
            lines=[{"description": "Work", "unit_price": 100}],
            issue_date="2024-01-15", payment_terms=30,
        )
        assert inv.due_date == "2024-02-14"

    def test_summary(self):
        engine = InvoicingEngine()
        engine.create_invoice(lines=[{"description": "A", "unit_price": 1000}])
        engine.create_invoice(lines=[{"description": "B", "unit_price": 2000}])
        summary = engine.summary()
        assert summary["total_invoices"] == 2


# ── App Marketplace ──────────────────────────────────────────

class TestMarketplace:
    def test_total_apps(self):
        mp = Marketplace()
        assert mp.summary()["total_apps"] >= 100

    def test_categories(self):
        mp = Marketplace()
        cats = mp.list_categories()
        cat_names = [c["category"] for c in cats]
        assert "payroll_hr" in cat_names
        assert "inventory_ecommerce" in cat_names
        assert "tax_compliance" in cat_names
        assert "payments" in cat_names

    def test_filter_by_jurisdiction(self):
        mp = Marketplace()
        au_apps = mp.list_all(jurisdiction="AU")
        assert len(au_apps) >= 40

    def test_search(self):
        mp = Marketplace()
        results = mp.list_all(search="payroll")
        assert len(results) >= 5

    def test_featured_apps(self):
        mp = Marketplace()
        featured = mp.list_all(featured_only=True)
        assert len(featured) >= 8

    def test_get_specific_app(self):
        mp = Marketplace()
        app = mp.get("shopify")
        assert app is not None
        assert app.name == "Shopify"

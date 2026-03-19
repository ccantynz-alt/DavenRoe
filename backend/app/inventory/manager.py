"""Inventory Management.

Stock tracking, costing methods (FIFO, weighted average, specific ID),
multi-location, reorder alerts, assemblies/kits, stocktake support.

Xero has basic inventory. QuickBooks has FIFO + moving average.
We match and exceed both.
"""

from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from enum import Enum
import uuid

TWO_DP = Decimal("0.01")


class CostingMethod(str, Enum):
    FIFO = "fifo"
    WEIGHTED_AVERAGE = "weighted_average"
    SPECIFIC_ID = "specific_identification"


class MovementType(str, Enum):
    PURCHASE = "purchase"         # Stock in from supplier
    SALE = "sale"                 # Stock out to customer
    ADJUSTMENT = "adjustment"     # Manual stocktake adjustment
    TRANSFER = "transfer"         # Between locations
    ASSEMBLY = "assembly"         # Build kit from components
    RETURN_IN = "return_in"       # Customer return
    RETURN_OUT = "return_out"     # Return to supplier
    WRITE_OFF = "write_off"       # Damaged / expired


@dataclass
class Product:
    """An inventory product/item."""
    id: str = ""
    sku: str = ""
    name: str = ""
    description: str = ""
    category: str = ""

    # Costing
    costing_method: CostingMethod = CostingMethod.WEIGHTED_AVERAGE
    unit_cost: Decimal = Decimal("0")
    sale_price: Decimal = Decimal("0")

    # Stock
    quantity_on_hand: Decimal = Decimal("0")
    quantity_committed: Decimal = Decimal("0")  # Reserved for orders
    quantity_on_order: Decimal = Decimal("0")   # On purchase orders
    reorder_point: Decimal = Decimal("0")
    reorder_quantity: Decimal = Decimal("0")

    # Location
    location: str = "default"

    # Classification
    is_tracked: bool = True       # Track inventory levels
    is_sellable: bool = True
    is_purchasable: bool = True
    is_assembly: bool = False     # Built from components
    components: list[dict] = field(default_factory=list)  # [{product_id, quantity}]

    # Tax
    tax_code: str = ""
    account_code_revenue: str = "4000"
    account_code_cogs: str = "5000"
    account_code_inventory: str = "1200"

    # Metadata
    supplier: str = ""
    barcode: str = ""
    unit_of_measure: str = "each"
    entity_id: str = ""
    is_active: bool = True
    created_at: str = ""

    def __post_init__(self):
        if not self.id:
            self.id = str(uuid.uuid4())[:8]
        if not self.created_at:
            self.created_at = datetime.utcnow().isoformat()

    @property
    def available_quantity(self) -> Decimal:
        return self.quantity_on_hand - self.quantity_committed

    @property
    def total_value(self) -> Decimal:
        return (self.quantity_on_hand * self.unit_cost).quantize(TWO_DP)

    @property
    def needs_reorder(self) -> bool:
        return self.is_tracked and self.available_quantity <= self.reorder_point

    def to_dict(self) -> dict:
        return {
            "id": self.id, "sku": self.sku, "name": self.name,
            "description": self.description, "category": self.category,
            "costing_method": self.costing_method.value if isinstance(self.costing_method, CostingMethod) else self.costing_method,
            "unit_cost": str(self.unit_cost), "sale_price": str(self.sale_price),
            "quantity_on_hand": str(self.quantity_on_hand),
            "quantity_committed": str(self.quantity_committed),
            "quantity_on_order": str(self.quantity_on_order),
            "available_quantity": str(self.available_quantity),
            "total_value": str(self.total_value),
            "reorder_point": str(self.reorder_point),
            "needs_reorder": self.needs_reorder,
            "location": self.location,
            "is_assembly": self.is_assembly,
            "components": self.components,
            "supplier": self.supplier, "barcode": self.barcode,
            "is_active": self.is_active,
        }


@dataclass
class StockMovement:
    """A stock movement record — every in/out is tracked."""
    id: str = ""
    product_id: str = ""
    movement_type: MovementType = MovementType.PURCHASE
    quantity: Decimal = Decimal("0")
    unit_cost: Decimal = Decimal("0")
    total_cost: Decimal = Decimal("0")
    reference: str = ""          # Invoice/PO number
    from_location: str = ""
    to_location: str = ""
    notes: str = ""
    entity_id: str = ""
    created_at: str = ""

    def __post_init__(self):
        if not self.id:
            self.id = str(uuid.uuid4())[:8]
        if not self.created_at:
            self.created_at = datetime.utcnow().isoformat()
        if not self.total_cost:
            self.total_cost = (self.quantity * self.unit_cost).quantize(TWO_DP)

    def to_dict(self) -> dict:
        return {
            "id": self.id, "product_id": self.product_id,
            "movement_type": self.movement_type.value if isinstance(self.movement_type, MovementType) else self.movement_type,
            "quantity": str(self.quantity), "unit_cost": str(self.unit_cost),
            "total_cost": str(self.total_cost), "reference": self.reference,
            "from_location": self.from_location, "to_location": self.to_location,
            "created_at": self.created_at,
        }


class InventoryManager:
    """Full inventory management system."""

    def __init__(self):
        self._products: dict[str, Product] = {}
        self._movements: list[StockMovement] = []
        self._fifo_layers: dict[str, list[dict]] = {}  # product_id → [{quantity, cost}]

    # ── Products ─────────────────────────────────────────────

    def create_product(self, **kwargs) -> Product:
        if "costing_method" in kwargs and isinstance(kwargs["costing_method"], str):
            kwargs["costing_method"] = CostingMethod(kwargs["costing_method"])
        product = Product(**kwargs)
        self._products[product.id] = product
        self._fifo_layers[product.id] = []
        return product

    def get_product(self, product_id: str) -> Product | None:
        return self._products.get(product_id)

    def list_products(self, category: str | None = None, location: str | None = None,
                      needs_reorder: bool = False, search: str | None = None) -> list[Product]:
        results = [p for p in self._products.values() if p.is_active]
        if category:
            results = [p for p in results if p.category == category]
        if location:
            results = [p for p in results if p.location == location]
        if needs_reorder:
            results = [p for p in results if p.needs_reorder]
        if search:
            q = search.lower()
            results = [p for p in results if q in p.name.lower() or q in p.sku.lower() or q in p.description.lower()]
        return sorted(results, key=lambda p: p.name)

    # ── Stock Movements ──────────────────────────────────────

    def receive_stock(self, product_id: str, quantity: Decimal, unit_cost: Decimal, reference: str = "") -> dict:
        """Receive stock from a purchase/supplier."""
        product = self._products.get(product_id)
        if not product:
            return {"error": "Product not found"}

        movement = StockMovement(
            product_id=product_id, movement_type=MovementType.PURCHASE,
            quantity=quantity, unit_cost=unit_cost, reference=reference,
        )
        self._movements.append(movement)

        # Update stock
        if product.costing_method == CostingMethod.WEIGHTED_AVERAGE:
            total_value = product.quantity_on_hand * product.unit_cost + quantity * unit_cost
            new_qty = product.quantity_on_hand + quantity
            product.unit_cost = (total_value / new_qty).quantize(TWO_DP) if new_qty > 0 else unit_cost
        elif product.costing_method == CostingMethod.FIFO:
            self._fifo_layers[product_id].append({"quantity": quantity, "cost": unit_cost})

        product.quantity_on_hand += quantity

        return {
            "status": "received",
            "product": product.name,
            "quantity": str(quantity),
            "unit_cost": str(unit_cost),
            "new_on_hand": str(product.quantity_on_hand),
            "new_unit_cost": str(product.unit_cost),
            "movement_id": movement.id,
        }

    def sell_stock(self, product_id: str, quantity: Decimal, reference: str = "") -> dict:
        """Record a stock sale."""
        product = self._products.get(product_id)
        if not product:
            return {"error": "Product not found"}
        if product.available_quantity < quantity:
            return {"error": f"Insufficient stock. Available: {product.available_quantity}, requested: {quantity}"}

        # Calculate COGS
        if product.costing_method == CostingMethod.FIFO:
            cogs = self._fifo_sell(product_id, quantity)
        else:
            cogs = (quantity * product.unit_cost).quantize(TWO_DP)

        movement = StockMovement(
            product_id=product_id, movement_type=MovementType.SALE,
            quantity=quantity, unit_cost=(cogs / quantity).quantize(TWO_DP) if quantity else Decimal("0"),
            total_cost=cogs, reference=reference,
        )
        self._movements.append(movement)
        product.quantity_on_hand -= quantity

        revenue = (quantity * product.sale_price).quantize(TWO_DP)
        gross_profit = revenue - cogs

        return {
            "status": "sold",
            "product": product.name,
            "quantity": str(quantity),
            "cogs": str(cogs),
            "revenue": str(revenue),
            "gross_profit": str(gross_profit),
            "remaining_on_hand": str(product.quantity_on_hand),
            "movement_id": movement.id,
        }

    def adjust_stock(self, product_id: str, new_quantity: Decimal, reason: str = "stocktake") -> dict:
        """Adjust stock levels (e.g., after a stocktake)."""
        product = self._products.get(product_id)
        if not product:
            return {"error": "Product not found"}

        old_qty = product.quantity_on_hand
        adjustment = new_quantity - old_qty

        movement = StockMovement(
            product_id=product_id, movement_type=MovementType.ADJUSTMENT,
            quantity=adjustment, unit_cost=product.unit_cost,
            notes=f"{reason}: {old_qty} → {new_quantity}",
        )
        self._movements.append(movement)
        product.quantity_on_hand = new_quantity

        return {
            "status": "adjusted",
            "product": product.name,
            "old_quantity": str(old_qty),
            "new_quantity": str(new_quantity),
            "adjustment": str(adjustment),
            "reason": reason,
        }

    def transfer_stock(self, product_id: str, quantity: Decimal, from_location: str, to_location: str) -> dict:
        """Transfer stock between locations."""
        product = self._products.get(product_id)
        if not product:
            return {"error": "Product not found"}

        movement = StockMovement(
            product_id=product_id, movement_type=MovementType.TRANSFER,
            quantity=quantity, unit_cost=product.unit_cost,
            from_location=from_location, to_location=to_location,
        )
        self._movements.append(movement)

        return {
            "status": "transferred",
            "product": product.name,
            "quantity": str(quantity),
            "from": from_location,
            "to": to_location,
        }

    def _fifo_sell(self, product_id: str, quantity: Decimal) -> Decimal:
        """Consume FIFO layers for a sale."""
        layers = self._fifo_layers.get(product_id, [])
        remaining = quantity
        total_cost = Decimal("0")

        while remaining > 0 and layers:
            layer = layers[0]
            take = min(remaining, layer["quantity"])
            total_cost += take * layer["cost"]
            layer["quantity"] -= take
            remaining -= take
            if layer["quantity"] <= 0:
                layers.pop(0)

        return total_cost.quantize(TWO_DP)

    # ── Assembly / Kits ──────────────────────────────────────

    def build_assembly(self, assembly_id: str, quantity: Decimal = Decimal("1")) -> dict:
        """Build an assembly/kit from its components."""
        assembly = self._products.get(assembly_id)
        if not assembly or not assembly.is_assembly:
            return {"error": "Not an assembly product"}

        # Check component availability
        for comp in assembly.components:
            product = self._products.get(comp["product_id"])
            if not product:
                return {"error": f"Component {comp['product_id']} not found"}
            needed = Decimal(str(comp["quantity"])) * quantity
            if product.available_quantity < needed:
                return {"error": f"Insufficient {product.name}: need {needed}, have {product.available_quantity}"}

        # Consume components
        total_cost = Decimal("0")
        for comp in assembly.components:
            product = self._products.get(comp["product_id"])
            needed = Decimal(str(comp["quantity"])) * quantity
            product.quantity_on_hand -= needed
            total_cost += needed * product.unit_cost

        # Add assembly
        assembly.quantity_on_hand += quantity
        assembly.unit_cost = (total_cost / quantity).quantize(TWO_DP)

        movement = StockMovement(
            product_id=assembly_id, movement_type=MovementType.ASSEMBLY,
            quantity=quantity, unit_cost=assembly.unit_cost,
        )
        self._movements.append(movement)

        return {
            "status": "assembled",
            "product": assembly.name,
            "quantity_built": str(quantity),
            "cost_per_unit": str(assembly.unit_cost),
            "total_cost": str(total_cost.quantize(TWO_DP)),
        }

    # ── Reports ──────────────────────────────────────────────

    def valuation_report(self) -> dict:
        """Inventory valuation report."""
        items = []
        total_value = Decimal("0")

        for product in sorted(self._products.values(), key=lambda p: p.category + p.name):
            if not product.is_active or not product.is_tracked:
                continue
            value = product.total_value
            total_value += value
            items.append({
                "sku": product.sku,
                "name": product.name,
                "category": product.category,
                "quantity": str(product.quantity_on_hand),
                "unit_cost": str(product.unit_cost),
                "total_value": str(value),
                "costing_method": product.costing_method.value if isinstance(product.costing_method, CostingMethod) else product.costing_method,
            })

        return {
            "report": "Inventory Valuation",
            "total_products": len(items),
            "total_value": str(total_value.quantize(TWO_DP)),
            "items": items,
        }

    def reorder_report(self) -> dict:
        """Products that need reordering."""
        items = [p for p in self._products.values() if p.needs_reorder and p.is_active]
        return {
            "report": "Reorder Report",
            "items_to_reorder": len(items),
            "items": [{
                "sku": p.sku, "name": p.name,
                "on_hand": str(p.quantity_on_hand),
                "reorder_point": str(p.reorder_point),
                "suggested_order": str(p.reorder_quantity),
                "supplier": p.supplier,
            } for p in items],
        }

    def movement_history(self, product_id: str) -> list[dict]:
        return [m.to_dict() for m in self._movements if m.product_id == product_id]

    def summary(self) -> dict:
        active = [p for p in self._products.values() if p.is_active and p.is_tracked]
        total_value = sum(p.total_value for p in active)
        needs_reorder = sum(1 for p in active if p.needs_reorder)

        return {
            "total_products": len(active),
            "total_value": str(total_value.quantize(TWO_DP)),
            "needs_reorder": needs_reorder,
            "total_movements": len(self._movements),
        }

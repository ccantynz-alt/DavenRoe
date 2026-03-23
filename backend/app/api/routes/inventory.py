"""Inventory API routes."""
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from app.inventory.manager import InventoryManager
from app.auth.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/inventory", tags=["Inventory"])
manager = InventoryManager()

@router.post("/products")
async def create_product(data: dict, user: User = Depends(get_current_user)):
    product = manager.create_product(**data)
    return product.to_dict()

@router.get("/products")
async def list_products(category: str | None = None, needs_reorder: bool = False, search: str | None = None, user: User = Depends(get_current_user)):
    return {"products": [p.to_dict() for p in manager.list_products(category=category, needs_reorder=needs_reorder, search=search)]}

@router.get("/products/{product_id}")
async def get_product(product_id: str, user: User = Depends(get_current_user)):
    p = manager.get_product(product_id)
    if not p: raise HTTPException(404, "Product not found")
    return p.to_dict()

@router.post("/receive")
async def receive_stock(data: dict, user: User = Depends(get_current_user)):
    return manager.receive_stock(data["product_id"], Decimal(str(data["quantity"])), Decimal(str(data["unit_cost"])), data.get("reference", ""))

@router.post("/sell")
async def sell_stock(data: dict, user: User = Depends(get_current_user)):
    return manager.sell_stock(data["product_id"], Decimal(str(data["quantity"])), data.get("reference", ""))

@router.post("/adjust")
async def adjust_stock(data: dict, user: User = Depends(get_current_user)):
    return manager.adjust_stock(data["product_id"], Decimal(str(data["new_quantity"])), data.get("reason", "stocktake"))

@router.post("/transfer")
async def transfer_stock(data: dict, user: User = Depends(get_current_user)):
    return manager.transfer_stock(data["product_id"], Decimal(str(data["quantity"])), data["from_location"], data["to_location"])

@router.post("/assemble")
async def build_assembly(data: dict, user: User = Depends(get_current_user)):
    return manager.build_assembly(data["assembly_id"], Decimal(str(data.get("quantity", 1))))

@router.get("/reports/valuation")
async def valuation_report(user: User = Depends(get_current_user)):
    return manager.valuation_report()

@router.get("/reports/reorder")
async def reorder_report(user: User = Depends(get_current_user)):
    return manager.reorder_report()

@router.get("/summary")
async def inventory_summary(user: User = Depends(get_current_user)):
    return manager.summary()

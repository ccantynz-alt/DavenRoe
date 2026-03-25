"""Inventory API routes."""
from decimal import Decimal, InvalidOperation
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from app.inventory.manager import InventoryManager
from app.auth.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/inventory", tags=["Inventory"])
manager = InventoryManager()


class ReceiveStockRequest(BaseModel):
    product_id: str = Field(..., min_length=1)
    quantity: float = Field(..., gt=0)
    unit_cost: float = Field(..., ge=0)
    reference: str = ""


class SellStockRequest(BaseModel):
    product_id: str = Field(..., min_length=1)
    quantity: float = Field(..., gt=0)
    reference: str = ""


class AdjustStockRequest(BaseModel):
    product_id: str = Field(..., min_length=1)
    new_quantity: float = Field(..., ge=0)
    reason: str = "stocktake"


class TransferStockRequest(BaseModel):
    product_id: str = Field(..., min_length=1)
    quantity: float = Field(..., gt=0)
    from_location: str = Field(..., min_length=1)
    to_location: str = Field(..., min_length=1)


class AssembleRequest(BaseModel):
    assembly_id: str = Field(..., min_length=1)
    quantity: float = Field(1, gt=0)


@router.post("/products")
async def create_product(data: dict, user: User = Depends(get_current_user)):
    try:
        product = manager.create_product(**data)
        return product.to_dict()
    except (TypeError, ValueError) as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/products")
async def list_products(category: str | None = None, needs_reorder: bool = False, search: str | None = None, user: User = Depends(get_current_user)):
    return {"products": [p.to_dict() for p in manager.list_products(category=category, needs_reorder=needs_reorder, search=search)]}


@router.get("/products/{product_id}")
async def get_product(product_id: str, user: User = Depends(get_current_user)):
    p = manager.get_product(product_id)
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return p.to_dict()


@router.post("/receive")
async def receive_stock(req: ReceiveStockRequest, user: User = Depends(get_current_user)):
    try:
        return manager.receive_stock(req.product_id, Decimal(str(req.quantity)), Decimal(str(req.unit_cost)), req.reference)
    except (ValueError, KeyError) as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/sell")
async def sell_stock(req: SellStockRequest, user: User = Depends(get_current_user)):
    try:
        return manager.sell_stock(req.product_id, Decimal(str(req.quantity)), req.reference)
    except (ValueError, KeyError) as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/adjust")
async def adjust_stock(req: AdjustStockRequest, user: User = Depends(get_current_user)):
    try:
        return manager.adjust_stock(req.product_id, Decimal(str(req.new_quantity)), req.reason)
    except (ValueError, KeyError) as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/transfer")
async def transfer_stock(req: TransferStockRequest, user: User = Depends(get_current_user)):
    try:
        return manager.transfer_stock(req.product_id, Decimal(str(req.quantity)), req.from_location, req.to_location)
    except (ValueError, KeyError) as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/assemble")
async def build_assembly(req: AssembleRequest, user: User = Depends(get_current_user)):
    try:
        return manager.build_assembly(req.assembly_id, Decimal(str(req.quantity)))
    except (ValueError, KeyError) as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/reports/valuation")
async def valuation_report(user: User = Depends(get_current_user)):
    return manager.valuation_report()


@router.get("/reports/reorder")
async def reorder_report(user: User = Depends(get_current_user)):
    return manager.reorder_report()


@router.get("/summary")
async def inventory_summary(user: User = Depends(get_current_user)):
    return manager.summary()

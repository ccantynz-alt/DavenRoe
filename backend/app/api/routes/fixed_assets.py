"""Fixed Assets API routes."""

from fastapi import APIRouter, Depends, HTTPException
from app.auth.dependencies import get_current_user
from app.models.user import User
from datetime import datetime
import uuid

router = APIRouter(prefix="/fixed-assets", tags=["Fixed Assets"])

# In-memory store (replace with DB later)
_assets = []
_seed_done = False


def _generate_depreciation_schedule(purchase_price, residual_value, useful_life_years, method, purchase_date):
    """Generate a depreciation schedule for an asset."""
    schedule = []
    depreciable = purchase_price - residual_value
    if depreciable <= 0 or useful_life_years <= 0:
        return schedule
    accumulated = 0.0
    nbv = purchase_price

    if method == "straight_line":
        annual_dep = depreciable / useful_life_years
        for year in range(1, useful_life_years + 1):
            dep = round(min(annual_dep, nbv - residual_value), 2)
            if dep <= 0:
                break
            accumulated = round(accumulated + dep, 2)
            nbv = round(purchase_price - accumulated, 2)
            schedule.append({"period": f"Year {year}", "depreciation": dep, "accumulated": accumulated, "nbv": nbv})
    elif method == "diminishing_value":
        rate = 1 - (residual_value / purchase_price) ** (1 / useful_life_years) if purchase_price > 0 and residual_value > 0 else (2 / useful_life_years)
        for year in range(1, useful_life_years + 1):
            dep = round(nbv * rate, 2)
            dep = round(min(dep, nbv - residual_value), 2)
            if dep <= 0:
                break
            accumulated = round(accumulated + dep, 2)
            nbv = round(purchase_price - accumulated, 2)
            schedule.append({"period": f"Year {year}", "depreciation": dep, "accumulated": accumulated, "nbv": nbv})

    return schedule


def _seed():
    global _seed_done
    if _seed_done:
        return
    _seed_done = True
    demos = [
        {
            "asset_number": "FA-0001",
            "name": "Office Furniture — Desks & Chairs",
            "category": "furniture",
            "purchase_date": "2024-03-15",
            "purchase_price": 12500.00,
            "depreciation_method": "straight_line",
            "useful_life_years": 10,
            "residual_value": 500.00,
            "accumulated_depreciation": 2400.00,
            "net_book_value": 10100.00,
            "status": "active",
            "location": "Level 8, 120 Collins St, Melbourne",
            "serial_number": None,
            "supplier": "Officeworks Business",
        },
        {
            "asset_number": "FA-0002",
            "name": "Dell Latitude 5540 Laptops (x5)",
            "category": "equipment",
            "purchase_date": "2025-06-01",
            "purchase_price": 8500.00,
            "depreciation_method": "diminishing_value",
            "useful_life_years": 4,
            "residual_value": 500.00,
            "accumulated_depreciation": 3187.50,
            "net_book_value": 5312.50,
            "status": "active",
            "location": "Level 8, 120 Collins St, Melbourne",
            "serial_number": "DL5540-BATCH-2025Q2",
            "supplier": "Dell Technologies",
        },
        {
            "asset_number": "FA-0003",
            "name": "Toyota HiAce Van",
            "category": "vehicles",
            "purchase_date": "2023-09-10",
            "purchase_price": 45000.00,
            "depreciation_method": "diminishing_value",
            "useful_life_years": 8,
            "residual_value": 8000.00,
            "accumulated_depreciation": 12600.00,
            "net_book_value": 32400.00,
            "status": "active",
            "location": "Basement Parking — Bay 12",
            "serial_number": "JTFSX23P200012345",
            "supplier": "Melbourne City Toyota",
        },
        {
            "asset_number": "FA-0004",
            "name": "Microsoft 365 E5 Licences (perpetual)",
            "category": "software",
            "purchase_date": "2025-01-15",
            "purchase_price": 6000.00,
            "depreciation_method": "straight_line",
            "useful_life_years": 3,
            "residual_value": 0,
            "accumulated_depreciation": 2500.00,
            "net_book_value": 3500.00,
            "status": "active",
            "location": "N/A — digital asset",
            "serial_number": "MS365-E5-2025-ENT",
            "supplier": "Microsoft Corporation",
        },
        {
            "asset_number": "FA-0005",
            "name": "Building Fit-Out — Level 8",
            "category": "leasehold_improvements",
            "purchase_date": "2024-01-20",
            "purchase_price": 85000.00,
            "depreciation_method": "straight_line",
            "useful_life_years": 7,
            "residual_value": 0,
            "accumulated_depreciation": 26785.71,
            "net_book_value": 58214.29,
            "status": "active",
            "location": "Level 8, 120 Collins St, Melbourne",
            "serial_number": None,
            "supplier": "Buildcorp Commercial",
        },
        {
            "asset_number": "FA-0006",
            "name": "HP LaserJet Pro MFP",
            "category": "equipment",
            "purchase_date": "2024-06-01",
            "purchase_price": 2200.00,
            "depreciation_method": "straight_line",
            "useful_life_years": 5,
            "residual_value": 200.00,
            "accumulated_depreciation": 720.00,
            "net_book_value": 1480.00,
            "status": "active",
            "location": "Level 8 — Print Room",
            "serial_number": "CNBRF4L0T7",
            "supplier": "HP Australia",
        },
        {
            "asset_number": "FA-0007",
            "name": "Old Reception Desk",
            "category": "furniture",
            "purchase_date": "2018-03-01",
            "purchase_price": 3500.00,
            "depreciation_method": "straight_line",
            "useful_life_years": 7,
            "residual_value": 0,
            "accumulated_depreciation": 3500.00,
            "net_book_value": 0,
            "status": "fully_depreciated",
            "location": "Storage — Level B1",
            "serial_number": None,
            "supplier": "Custom Joinery Pty Ltd",
        },
        {
            "asset_number": "FA-0008",
            "name": "Samsung 65\" Conference Display",
            "category": "equipment",
            "purchase_date": "2023-11-15",
            "purchase_price": 3800.00,
            "depreciation_method": "straight_line",
            "useful_life_years": 5,
            "residual_value": 200.00,
            "accumulated_depreciation": 1728.00,
            "net_book_value": 2072.00,
            "status": "active",
            "location": "Level 8 — Boardroom",
            "serial_number": "QM65R-2023-AU",
            "supplier": "Samsung Business",
        },
    ]
    for d in demos:
        schedule = _generate_depreciation_schedule(
            d["purchase_price"], d["residual_value"], d["useful_life_years"], d["depreciation_method"], d["purchase_date"]
        )
        _assets.append({
            "id": str(uuid.uuid4()),
            "created_at": datetime.utcnow().isoformat(),
            "depreciation_schedule": schedule,
            **d,
        })


@router.get("/")
async def list_fixed_assets(category: str | None = None, status: str | None = None, user: User = Depends(get_current_user)):
    """List all fixed assets with optional filters."""
    _seed()
    results = _assets
    if category:
        results = [a for a in results if a["category"] == category]
    if status:
        results = [a for a in results if a["status"] == status]
    return {"assets": results, "total": len(results)}


@router.get("/summary")
async def fixed_assets_summary(user: User = Depends(get_current_user)):
    """Fixed asset summary — total value, depreciation, net book value."""
    _seed()
    total_cost = sum(a["purchase_price"] for a in _assets)
    total_depreciation = sum(a["accumulated_depreciation"] for a in _assets)
    total_nbv = sum(a["net_book_value"] for a in _assets)
    by_category = {}
    for a in _assets:
        cat = a["category"]
        if cat not in by_category:
            by_category[cat] = {"count": 0, "cost": 0, "nbv": 0}
        by_category[cat]["count"] += 1
        by_category[cat]["cost"] = round(by_category[cat]["cost"] + a["purchase_price"], 2)
        by_category[cat]["nbv"] = round(by_category[cat]["nbv"] + a["net_book_value"], 2)
    return {
        "total_assets": len(_assets),
        "active": len([a for a in _assets if a["status"] == "active"]),
        "disposed": len([a for a in _assets if a["status"] == "disposed"]),
        "fully_depreciated": len([a for a in _assets if a["status"] == "fully_depreciated"]),
        "total_cost": round(total_cost, 2),
        "total_accumulated_depreciation": round(total_depreciation, 2),
        "total_net_book_value": round(total_nbv, 2),
        "by_category": by_category,
    }


@router.post("/")
async def register_fixed_asset(data: dict, user: User = Depends(get_current_user)):
    """Register a new fixed asset."""
    _seed()
    asset_nums = [int(a["asset_number"].replace("FA-", "")) for a in _assets if a["asset_number"].startswith("FA-")]
    next_num = max(asset_nums, default=0) + 1
    purchase_price = data.get("purchase_price", 0)
    residual_value = data.get("residual_value", 0)
    useful_life = data.get("useful_life_years", 5)
    method = data.get("depreciation_method", "straight_line")
    schedule = _generate_depreciation_schedule(purchase_price, residual_value, useful_life, method, data.get("purchase_date", ""))
    asset = {
        "id": str(uuid.uuid4()),
        "asset_number": f"FA-{next_num:04d}",
        "created_at": datetime.utcnow().isoformat(),
        "status": "active",
        "accumulated_depreciation": 0,
        "net_book_value": purchase_price,
        "depreciation_schedule": schedule,
        **data,
    }
    _assets.append(asset)
    return asset


@router.get("/{asset_id}")
async def get_fixed_asset(asset_id: str, user: User = Depends(get_current_user)):
    """Get a single fixed asset with depreciation schedule."""
    _seed()
    for a in _assets:
        if a["id"] == asset_id:
            return a
    raise HTTPException(status_code=404, detail="Fixed asset not found")


@router.put("/{asset_id}")
async def update_fixed_asset(asset_id: str, data: dict, user: User = Depends(get_current_user)):
    """Update a fixed asset."""
    _seed()
    for i, a in enumerate(_assets):
        if a["id"] == asset_id:
            if a["status"] == "disposed":
                raise HTTPException(status_code=400, detail="Cannot update a disposed asset")
            _assets[i] = {**a, **data}
            return _assets[i]
    raise HTTPException(status_code=404, detail="Fixed asset not found")


@router.post("/{asset_id}/dispose")
async def dispose_fixed_asset(asset_id: str, data: dict | None = None, user: User = Depends(get_current_user)):
    """Dispose or sell a fixed asset."""
    _seed()
    body = data or {}
    for i, a in enumerate(_assets):
        if a["id"] == asset_id:
            if a["status"] == "disposed":
                raise HTTPException(status_code=400, detail="Asset is already disposed")
            sale_price = body.get("sale_price", 0)
            gain_loss = round(sale_price - a["net_book_value"], 2)
            _assets[i]["status"] = "disposed"
            _assets[i]["disposal_date"] = body.get("disposal_date", datetime.utcnow().strftime("%Y-%m-%d"))
            _assets[i]["sale_price"] = sale_price
            _assets[i]["disposal_gain_loss"] = gain_loss
            return {
                "asset": _assets[i],
                "disposal_summary": {
                    "net_book_value_at_disposal": a["net_book_value"],
                    "sale_price": sale_price,
                    "gain_loss": gain_loss,
                    "type": "gain" if gain_loss >= 0 else "loss",
                },
            }
    raise HTTPException(status_code=404, detail="Fixed asset not found")


@router.post("/{asset_id}/depreciate")
async def run_depreciation(asset_id: str, data: dict | None = None, user: User = Depends(get_current_user)):
    """Run depreciation for a fixed asset (one period)."""
    _seed()
    body = data or {}
    for i, a in enumerate(_assets):
        if a["id"] == asset_id:
            if a["status"] != "active":
                raise HTTPException(status_code=400, detail=f"Cannot depreciate a {a['status']} asset")
            if a["net_book_value"] <= a.get("residual_value", 0):
                _assets[i]["status"] = "fully_depreciated"
                return {"message": "Asset is fully depreciated", "asset": _assets[i]}

            depreciable = a["purchase_price"] - a.get("residual_value", 0)
            if a["depreciation_method"] == "straight_line":
                period_dep = depreciable / a.get("useful_life_years", 1)
            else:
                rate = body.get("rate", 2 / a.get("useful_life_years", 1))
                period_dep = a["net_book_value"] * rate

            period_dep = round(min(period_dep, a["net_book_value"] - a.get("residual_value", 0)), 2)
            _assets[i]["accumulated_depreciation"] = round(a["accumulated_depreciation"] + period_dep, 2)
            _assets[i]["net_book_value"] = round(a["purchase_price"] - _assets[i]["accumulated_depreciation"], 2)

            if _assets[i]["net_book_value"] <= a.get("residual_value", 0):
                _assets[i]["status"] = "fully_depreciated"

            return {
                "period_depreciation": period_dep,
                "accumulated_depreciation": _assets[i]["accumulated_depreciation"],
                "net_book_value": _assets[i]["net_book_value"],
                "status": _assets[i]["status"],
            }
    raise HTTPException(status_code=404, detail="Fixed asset not found")

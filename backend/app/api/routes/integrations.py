"""Import/Export API routes."""

from fastapi import APIRouter, Depends
from app.integrations.importer import DataImporter
from app.integrations.exporter import DataExporter
from app.auth.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/integrations", tags=["Import/Export"])
importer = DataImporter()
exporter = DataExporter()


@router.get("/platforms")
async def supported_platforms(user: User = Depends(get_current_user)):
    return {
        "import": importer.SUPPORTED_PLATFORMS,
        "export": exporter.SUPPORTED_FORMATS,
    }


@router.post("/import")
async def import_data(data: dict, user: User = Depends(get_current_user)):
    return importer.import_data(
        platform=data.get("platform", "csv"),
        data=data.get("data", ""),
        data_type=data.get("data_type", "transactions"),
    )


@router.post("/export")
async def export_data(data: dict, user: User = Depends(get_current_user)):
    return exporter.export(
        transactions=data.get("transactions", []),
        format=data.get("format", "csv"),
    )


@router.post("/export/report")
async def export_report(data: dict, user: User = Depends(get_current_user)):
    return exporter.generate_report_export(
        report=data.get("report", {}),
        format=data.get("format", "csv"),
    )

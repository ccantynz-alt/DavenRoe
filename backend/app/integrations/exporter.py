"""Data Export Engine.

Export from AlecRae to Xero, QuickBooks, MYOB, CSV, and PDF.
If data can't get out, the platform becomes a prison.
"""

import csv
import io
import json
from decimal import Decimal


class DataExporter:
    """Export data to external formats and platforms."""

    SUPPORTED_FORMATS = {
        "csv": "Generic CSV",
        "xero_csv": "Xero CSV Import Format",
        "quickbooks_csv": "QuickBooks CSV Import Format",
        "myob_csv": "MYOB CSV Import Format",
        "json": "JSON",
    }

    def export(self, transactions: list[dict], format: str = "csv", **options) -> dict:
        """Export transactions to specified format."""
        exporters = {
            "csv": self._export_csv,
            "xero_csv": self._export_xero,
            "quickbooks_csv": self._export_quickbooks,
            "myob_csv": self._export_myob,
            "json": self._export_json,
        }

        exporter = exporters.get(format.lower())
        if not exporter:
            return {
                "status": "error",
                "message": f"Unsupported format: {format}",
                "supported": list(self.SUPPORTED_FORMATS.keys()),
            }

        content = exporter(transactions, **options)

        return {
            "status": "success",
            "format": self.SUPPORTED_FORMATS.get(format, format),
            "records_exported": len(transactions),
            "content": content,
        }

    def _export_csv(self, transactions: list[dict], **options) -> str:
        """Export as generic CSV."""
        if not transactions:
            return ""

        fields = ["date", "account_code", "account_name", "description", "reference", "amount", "counterparty"]
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        for txn in transactions:
            writer.writerow(txn)
        return output.getvalue()

    def _export_xero(self, transactions: list[dict], **options) -> str:
        """Export in Xero manual journal CSV import format."""
        fields = ["*Date", "*Amount", "*Account Code", "Description", "Reference", "Tax Rate"]
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()

        for txn in transactions:
            writer.writerow({
                "*Date": txn.get("date", ""),
                "*Amount": txn.get("amount", ""),
                "*Account Code": txn.get("account_code", ""),
                "Description": txn.get("description", ""),
                "Reference": txn.get("reference", ""),
                "Tax Rate": txn.get("tax_rate", ""),
            })

        return output.getvalue()

    def _export_quickbooks(self, transactions: list[dict], **options) -> str:
        """Export in QuickBooks IIF-compatible CSV format."""
        fields = ["Date", "Account", "Name", "Memo", "Amount", "Class"]
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()

        for txn in transactions:
            amount = Decimal(str(txn.get("amount", 0)))
            writer.writerow({
                "Date": txn.get("date", ""),
                "Account": txn.get("account_name", txn.get("account_code", "")),
                "Name": txn.get("counterparty", ""),
                "Memo": txn.get("description", ""),
                "Amount": str(amount),
                "Class": txn.get("category", ""),
            })

        return output.getvalue()

    def _export_myob(self, transactions: list[dict], **options) -> str:
        """Export in MYOB import format."""
        fields = ["Date", "Account Number", "Account Name", "Memo", "Amount", "Tax Code", "Invoice Number", "Name"]
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()

        for txn in transactions:
            writer.writerow({
                "Date": txn.get("date", ""),
                "Account Number": txn.get("account_code", ""),
                "Account Name": txn.get("account_name", ""),
                "Memo": txn.get("description", ""),
                "Amount": txn.get("amount", ""),
                "Tax Code": txn.get("tax_code", ""),
                "Invoice Number": txn.get("reference", ""),
                "Name": txn.get("counterparty", ""),
            })

        return output.getvalue()

    def _export_json(self, transactions: list[dict], **options) -> str:
        """Export as JSON."""
        return json.dumps(transactions, indent=2, default=str)

    def generate_report_export(self, report: dict, format: str = "csv") -> dict:
        """Export a generated report to CSV or JSON."""
        if format == "json":
            return {
                "status": "success",
                "format": "JSON",
                "content": json.dumps(report, indent=2, default=str),
            }

        # CSV — flatten report into rows
        lines = []
        if "lines" in report:
            lines = report["lines"]
        elif "sections" in report:
            for section_name, section in report["sections"].items():
                if isinstance(section, dict) and "accounts" in section:
                    for account, amount in section["accounts"].items():
                        lines.append({"section": section_name, "account": account, "amount": amount})

        if not lines:
            return {"status": "success", "format": "CSV", "content": json.dumps(report, indent=2)}

        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=lines[0].keys(), extrasaction="ignore")
        writer.writeheader()
        writer.writerows(lines)

        return {
            "status": "success",
            "format": "CSV",
            "records": len(lines),
            "content": output.getvalue(),
        }

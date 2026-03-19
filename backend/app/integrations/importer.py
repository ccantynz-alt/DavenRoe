"""Data Import Engine.

Import from Xero, QuickBooks, MYOB, and CSV/Excel.
Nobody starts from zero — if they can't bring their existing
data in, they won't use the platform.

Each platform has its own export format. We normalize everything
into Astra's internal format.
"""

import csv
import io
import json
from datetime import date
from decimal import Decimal


class DataImporter:
    """Import data from external accounting platforms."""

    SUPPORTED_PLATFORMS = {
        "xero": "Xero",
        "quickbooks": "QuickBooks Online",
        "myob": "MYOB",
        "csv": "Generic CSV",
        "sage": "Sage",
        "freshbooks": "FreshBooks",
    }

    def import_data(self, platform: str, data: str | bytes, data_type: str = "transactions") -> dict:
        """Import data from a supported platform.

        Args:
            platform: xero, quickbooks, myob, csv
            data: the raw data (CSV string, JSON string, or bytes)
            data_type: transactions, chart_of_accounts, contacts, invoices
        """
        importers = {
            "xero": self._import_xero,
            "quickbooks": self._import_quickbooks,
            "myob": self._import_myob,
            "csv": self._import_csv,
            "sage": self._import_sage,
            "freshbooks": self._import_freshbooks,
        }

        importer = importers.get(platform.lower())
        if not importer:
            return {
                "status": "error",
                "message": f"Unsupported platform: {platform}",
                "supported": list(self.SUPPORTED_PLATFORMS.keys()),
            }

        try:
            result = importer(data, data_type)
            return {
                "status": "success",
                "platform": self.SUPPORTED_PLATFORMS.get(platform, platform),
                "data_type": data_type,
                **result,
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def _import_xero(self, data: str, data_type: str) -> dict:
        """Import from Xero export format (CSV with Xero-specific columns)."""
        return self._parse_csv(data, column_map={
            "Date": "date",
            "*Date": "date",
            "Description": "description",
            "*Description": "description",
            "Reference": "reference",
            "Amount": "amount",
            "*Amount": "amount",
            "Account": "account_name",
            "*Account": "account_name",
            "Account Code": "account_code",
            "Tax Rate": "tax_rate",
            "Contact": "counterparty",
        }, platform="xero")

    def _import_quickbooks(self, data: str, data_type: str) -> dict:
        """Import from QuickBooks export format."""
        return self._parse_csv(data, column_map={
            "Date": "date",
            "Transaction Type": "type",
            "No.": "reference",
            "Name": "counterparty",
            "Memo/Description": "description",
            "Memo": "description",
            "Account": "account_name",
            "Amount": "amount",
            "Debit": "debit",
            "Credit": "credit",
            "Class": "category",
        }, platform="quickbooks")

    def _import_myob(self, data: str, data_type: str) -> dict:
        """Import from MYOB export format."""
        return self._parse_csv(data, column_map={
            "Date": "date",
            "Memo": "description",
            "Name": "counterparty",
            "Amount": "amount",
            "Account Number": "account_code",
            "Account Name": "account_name",
            "Tax Code": "tax_code",
            "Job": "project",
            "Invoice Number": "reference",
        }, platform="myob")

    def _import_sage(self, data: str, data_type: str) -> dict:
        """Import from Sage export format."""
        return self._parse_csv(data, column_map={
            "Date": "date",
            "Reference": "reference",
            "Details": "description",
            "Nominal": "account_code",
            "Debit": "debit",
            "Credit": "credit",
            "Type": "type",
        }, platform="sage")

    def _import_freshbooks(self, data: str, data_type: str) -> dict:
        """Import from FreshBooks export format."""
        return self._parse_csv(data, column_map={
            "Date": "date",
            "Description": "description",
            "Category": "account_name",
            "Amount": "amount",
            "Tax": "tax_amount",
            "Vendor": "counterparty",
        }, platform="freshbooks")

    def _import_csv(self, data: str, data_type: str) -> dict:
        """Import from generic CSV — auto-detect columns."""
        return self._parse_csv(data, column_map={}, platform="csv")

    def _parse_csv(self, data: str, column_map: dict, platform: str) -> dict:
        """Parse CSV data and normalize to Astra format."""
        if isinstance(data, bytes):
            data = data.decode("utf-8-sig")  # Handle BOM

        reader = csv.DictReader(io.StringIO(data))
        rows = list(reader)

        if not rows:
            return {"records_imported": 0, "transactions": [], "warnings": ["Empty file"]}

        # Auto-detect columns if no mapping provided
        if not column_map:
            column_map = self._auto_detect_columns(rows[0].keys())

        transactions = []
        warnings = []
        skipped = 0

        for i, row in enumerate(rows):
            txn = {}
            for src_col, dest_field in column_map.items():
                if src_col in row:
                    txn[dest_field] = row[src_col].strip() if row[src_col] else ""

            # Handle debit/credit columns (QuickBooks, Sage)
            if "debit" in txn and "credit" in txn:
                try:
                    debit = Decimal(txn.pop("debit").replace(",", "")) if txn.get("debit") else Decimal("0")
                    credit = Decimal(txn.pop("credit").replace(",", "")) if txn.get("credit") else Decimal("0")
                    txn["amount"] = str(debit - credit)
                except Exception:
                    pass

            # Clean amount
            if "amount" in txn and txn["amount"]:
                try:
                    txn["amount"] = str(Decimal(txn["amount"].replace(",", "").replace("$", "").replace("£", "").replace("€", "")))
                except Exception:
                    warnings.append(f"Row {i + 1}: Could not parse amount '{txn['amount']}'")
                    skipped += 1
                    continue

            if txn.get("date") or txn.get("amount"):
                txn["_source_platform"] = platform
                txn["_source_row"] = i + 1
                transactions.append(txn)
            else:
                skipped += 1

        return {
            "records_imported": len(transactions),
            "records_skipped": skipped,
            "columns_detected": list(column_map.values()),
            "transactions": transactions,
            "warnings": warnings,
        }

    @staticmethod
    def _auto_detect_columns(headers: list[str] | dict) -> dict:
        """Auto-detect column mapping from header names."""
        headers = list(headers) if not isinstance(headers, list) else headers
        mapping = {}

        date_keywords = ["date", "posted", "transaction date"]
        amount_keywords = ["amount", "total", "value", "sum"]
        desc_keywords = ["description", "memo", "narrative", "details", "particulars"]
        ref_keywords = ["reference", "ref", "number", "no", "invoice"]
        account_keywords = ["account", "category", "nominal", "gl code"]

        for header in headers:
            h = header.lower().strip()
            if any(k in h for k in date_keywords):
                mapping[header] = "date"
            elif any(k == h for k in amount_keywords):
                mapping[header] = "amount"
            elif h in ("debit", "dr"):
                mapping[header] = "debit"
            elif h in ("credit", "cr"):
                mapping[header] = "credit"
            elif any(k in h for k in desc_keywords):
                mapping[header] = "description"
            elif any(k in h for k in ref_keywords):
                mapping[header] = "reference"
            elif any(k in h for k in account_keywords):
                mapping[header] = "account_name"

        return mapping

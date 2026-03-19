"""Quick Reference Tools.

Fiscal year dates, lodgment/filing due dates, chart of accounts templates.
The stuff accountants look up constantly.
"""

from datetime import date


class FiscalYearReference:
    """Fiscal year dates and periods by jurisdiction.

    "What financial year are we in?" — asked daily.
    """

    FY_CONFIGS = {
        "AU": {"start_month": 7, "start_day": 1, "label": "1 July – 30 June"},
        "NZ": {"start_month": 4, "start_day": 1, "label": "1 April – 31 March"},
        "GB": {"start_month": 4, "start_day": 6, "label": "6 April – 5 April"},
        "US": {"start_month": 1, "start_day": 1, "label": "1 January – 31 December (calendar year default)"},
    }

    def current_fy(self, jurisdiction: str, ref_date: date | None = None) -> dict:
        """What financial year are we in right now?"""
        ref = ref_date or date.today()
        jurisdiction = jurisdiction.upper()
        config = self.FY_CONFIGS.get(jurisdiction)

        if not config:
            return {"error": f"Unsupported jurisdiction: {jurisdiction}"}

        sm, sd = config["start_month"], config["start_day"]

        if ref.month > sm or (ref.month == sm and ref.day >= sd):
            fy_start = date(ref.year, sm, sd)
            fy_end_year = ref.year + 1
        else:
            fy_start = date(ref.year - 1, sm, sd)
            fy_end_year = ref.year

        # Calculate end date
        if jurisdiction == "GB":
            fy_end = date(fy_end_year, 4, 5)
        elif jurisdiction == "AU":
            fy_end = date(fy_end_year, 6, 30)
        elif jurisdiction == "NZ":
            fy_end = date(fy_end_year, 3, 31)
        else:
            fy_end = date(fy_end_year, 12, 31)

        days_elapsed = (ref - fy_start).days
        days_total = (fy_end - fy_start).days
        days_remaining = (fy_end - ref).days

        return {
            "jurisdiction": jurisdiction,
            "financial_year": f"FY{fy_end.year}" if jurisdiction != "US" else f"FY{fy_start.year}",
            "start_date": str(fy_start),
            "end_date": str(fy_end),
            "standard_period": config["label"],
            "days_elapsed": days_elapsed,
            "days_remaining": max(0, days_remaining),
            "progress_pct": round(days_elapsed / days_total * 100, 1) if days_total else 0,
            "current_quarter": self._current_quarter(ref, jurisdiction, sm),
        }

    def _current_quarter(self, ref: date, jurisdiction: str, fy_start_month: int) -> dict:
        """Determine current quarter within the financial year."""
        month_offset = (ref.month - fy_start_month) % 12
        quarter = month_offset // 3 + 1

        quarter_labels = {
            "AU": {1: "Q1 (Jul-Sep)", 2: "Q2 (Oct-Dec)", 3: "Q3 (Jan-Mar)", 4: "Q4 (Apr-Jun)"},
            "NZ": {1: "Q1 (Apr-Jun)", 2: "Q2 (Jul-Sep)", 3: "Q3 (Oct-Dec)", 4: "Q4 (Jan-Mar)"},
            "GB": {1: "Q1 (Apr-Jun)", 2: "Q2 (Jul-Sep)", 3: "Q3 (Oct-Dec)", 4: "Q4 (Jan-Mar)"},
            "US": {1: "Q1 (Jan-Mar)", 2: "Q2 (Apr-Jun)", 3: "Q3 (Jul-Sep)", 4: "Q4 (Oct-Dec)"},
        }

        return {
            "quarter": quarter,
            "label": quarter_labels.get(jurisdiction, {}).get(quarter, f"Q{quarter}"),
        }

    def all_jurisdictions(self, ref_date: date | None = None) -> dict:
        """Show FY info for all jurisdictions at once."""
        return {jur: self.current_fy(jur, ref_date) for jur in self.FY_CONFIGS}


class LodgmentDueDates:
    """Key filing/lodgment due dates by jurisdiction.

    Missing a deadline means penalties. This shows what's coming.
    """

    def upcoming(self, jurisdiction: str, ref_date: date | None = None) -> dict:
        """Get upcoming lodgment deadlines."""
        ref = ref_date or date.today()
        jurisdiction = jurisdiction.upper()

        deadlines = self._deadlines(jurisdiction, ref.year)

        upcoming = [d for d in deadlines if date.fromisoformat(d["due_date"]) >= ref]
        overdue = [d for d in deadlines if date.fromisoformat(d["due_date"]) < ref]

        # Sort upcoming by date
        upcoming.sort(key=lambda d: d["due_date"])
        overdue.sort(key=lambda d: d["due_date"])

        return {
            "jurisdiction": jurisdiction,
            "as_of": str(ref),
            "upcoming": upcoming[:10],
            "overdue": overdue,
            "next_deadline": upcoming[0] if upcoming else None,
        }

    def _deadlines(self, jurisdiction: str, year: int) -> list[dict]:
        """Generate key deadlines for a jurisdiction and year."""
        if jurisdiction == "AU":
            return [
                # BAS quarterly
                {"name": "BAS Q1 (Jul-Sep)", "due_date": f"{year}-10-28", "type": "BAS", "penalty": "Up to $1,110 per period"},
                {"name": "BAS Q2 (Oct-Dec)", "due_date": f"{year + 1}-02-28", "type": "BAS", "penalty": "Up to $1,110 per period"},
                {"name": "BAS Q3 (Jan-Mar)", "due_date": f"{year}-04-28", "type": "BAS", "penalty": "Up to $1,110 per period"},
                {"name": "BAS Q4 (Apr-Jun)", "due_date": f"{year}-07-28", "type": "BAS", "penalty": "Up to $1,110 per period"},
                # Income tax
                {"name": "Individual Tax Return", "due_date": f"{year}-10-31", "type": "Income Tax", "penalty": "$313 per 28-day period"},
                {"name": "Company Tax Return", "due_date": f"{year + 1}-02-28", "type": "Income Tax", "penalty": "$313 per 28-day period"},
                # STP
                {"name": "STP Finalisation", "due_date": f"{year}-07-14", "type": "Payroll", "penalty": "$313 per 28-day period"},
                # Superannuation
                {"name": "Super Guarantee Q1", "due_date": f"{year}-10-28", "type": "Super", "penalty": "SG Charge + admin fee + interest"},
                {"name": "Super Guarantee Q2", "due_date": f"{year + 1}-01-28", "type": "Super", "penalty": "SG Charge + admin fee + interest"},
                {"name": "Super Guarantee Q3", "due_date": f"{year}-04-28", "type": "Super", "penalty": "SG Charge + admin fee + interest"},
                {"name": "Super Guarantee Q4", "due_date": f"{year}-07-28", "type": "Super", "penalty": "SG Charge + admin fee + interest"},
            ]
        elif jurisdiction == "NZ":
            return [
                {"name": "GST Return (2-monthly)", "due_date": f"{year}-03-28", "type": "GST", "penalty": "$250 initial + $250 per month"},
                {"name": "GST Return (2-monthly)", "due_date": f"{year}-05-28", "type": "GST", "penalty": "$250 initial + $250 per month"},
                {"name": "GST Return (2-monthly)", "due_date": f"{year}-07-28", "type": "GST", "penalty": "$250 initial + $250 per month"},
                {"name": "Individual IR3", "due_date": f"{year}-07-07", "type": "Income Tax", "penalty": "1% per month on outstanding tax"},
                {"name": "Provisional Tax P1", "due_date": f"{year}-08-28", "type": "Provisional Tax", "penalty": "Use of money interest"},
                {"name": "Payday Filing", "due_date": "Ongoing — within 2 working days", "type": "Payroll", "penalty": "$250 per failure"},
            ]
        elif jurisdiction == "GB":
            return [
                {"name": "Self Assessment", "due_date": f"{year}-01-31", "type": "Income Tax", "penalty": "GBP 100 + daily penalties"},
                {"name": "Corporation Tax Payment", "due_date": "9 months + 1 day after period end", "type": "Corporation Tax", "penalty": "Interest + surcharges"},
                {"name": "VAT Return (quarterly)", "due_date": f"{year}-05-07", "type": "VAT", "penalty": "Points-based + surcharge"},
                {"name": "VAT Return (quarterly)", "due_date": f"{year}-08-07", "type": "VAT", "penalty": "Points-based + surcharge"},
                {"name": "VAT Return (quarterly)", "due_date": f"{year}-11-07", "type": "VAT", "penalty": "Points-based + surcharge"},
                {"name": "VAT Return (quarterly)", "due_date": f"{year + 1}-02-07", "type": "VAT", "penalty": "Points-based + surcharge"},
                {"name": "RTI FPS", "due_date": "On or before each payday", "type": "Payroll", "penalty": "GBP 100-400 per month"},
            ]
        elif jurisdiction == "US":
            return [
                {"name": "Individual 1040", "due_date": f"{year}-04-15", "type": "Income Tax", "penalty": "5% per month up to 25%"},
                {"name": "Corporate 1120", "due_date": f"{year}-04-15", "type": "Income Tax", "penalty": "5% per month up to 25%"},
                {"name": "Partnership 1065", "due_date": f"{year}-03-15", "type": "Income Tax", "penalty": "$220 per partner per month"},
                {"name": "Estimated Tax Q1", "due_date": f"{year}-04-15", "type": "Estimated Tax", "penalty": "Underpayment penalty"},
                {"name": "Estimated Tax Q2", "due_date": f"{year}-06-15", "type": "Estimated Tax", "penalty": "Underpayment penalty"},
                {"name": "Estimated Tax Q3", "due_date": f"{year}-09-15", "type": "Estimated Tax", "penalty": "Underpayment penalty"},
                {"name": "Estimated Tax Q4", "due_date": f"{year + 1}-01-15", "type": "Estimated Tax", "penalty": "Underpayment penalty"},
                {"name": "W-2/1099 Filing", "due_date": f"{year}-01-31", "type": "Payroll", "penalty": "$60-$310 per form"},
                {"name": "Form 941 (Quarterly)", "due_date": f"{year}-04-30", "type": "Payroll", "penalty": "2-15% per month"},
            ]
        return []


class ChartOfAccountsTemplates:
    """Industry-specific chart of accounts templates.

    Setting up a new client's COA is one of the first things
    a bookkeeper does — and getting it right saves months of pain.
    """

    TEMPLATES = {
        "professional_services": {
            "name": "Professional Services (Law, Accounting, Consulting)",
            "accounts": {
                "1000-1999 Assets": [
                    ("1000", "Cash at Bank"),
                    ("1010", "Petty Cash"),
                    ("1100", "Accounts Receivable"),
                    ("1110", "WIP — Unbilled Time"),
                    ("1120", "Employee Advances"),
                    ("1200", "Prepaid Expenses"),
                    ("1300", "Office Equipment"),
                    ("1310", "Computer Equipment"),
                    ("1350", "Accumulated Depreciation"),
                    ("1400", "Security Deposits"),
                ],
                "2000-2999 Liabilities": [
                    ("2000", "Accounts Payable"),
                    ("2100", "Credit Card"),
                    ("2200", "GST/VAT Collected"),
                    ("2210", "GST/VAT Paid"),
                    ("2300", "PAYG/PAYE Withholding"),
                    ("2310", "Superannuation/Pension Payable"),
                    ("2400", "Accrued Expenses"),
                    ("2500", "Income in Advance (Unearned)"),
                    ("2600", "Loan — Business"),
                ],
                "3000-3999 Equity": [
                    ("3000", "Owner's Equity / Share Capital"),
                    ("3100", "Retained Earnings"),
                    ("3200", "Drawings / Distributions"),
                ],
                "4000-4999 Revenue": [
                    ("4000", "Professional Fees"),
                    ("4010", "Consulting Revenue"),
                    ("4020", "Fixed-Fee Engagements"),
                    ("4030", "Reimbursable Expenses"),
                    ("4100", "Interest Income"),
                    ("4200", "Other Income"),
                ],
                "5000-5999 Direct Costs": [
                    ("5000", "Subcontractor Costs"),
                    ("5100", "Direct Project Costs"),
                ],
                "6000-6999 Operating Expenses": [
                    ("6000", "Salaries & Wages"),
                    ("6010", "Superannuation / Pension"),
                    ("6020", "Workers Compensation"),
                    ("6030", "Staff Training"),
                    ("6100", "Rent"),
                    ("6110", "Utilities"),
                    ("6120", "Internet & Phone"),
                    ("6200", "Insurance — Professional Indemnity"),
                    ("6210", "Insurance — General"),
                    ("6300", "Software Subscriptions"),
                    ("6310", "IT Support"),
                    ("6400", "Marketing & Advertising"),
                    ("6410", "Client Entertainment"),
                    ("6500", "Travel"),
                    ("6510", "Motor Vehicle Expenses"),
                    ("6600", "Office Supplies"),
                    ("6610", "Postage & Printing"),
                    ("6700", "Accounting & Legal Fees"),
                    ("6710", "Bank Fees"),
                    ("6800", "Depreciation"),
                    ("6900", "Sundry Expenses"),
                ],
            },
        },
        "retail": {
            "name": "Retail / E-Commerce",
            "accounts": {
                "1000-1999 Assets": [
                    ("1000", "Cash at Bank"),
                    ("1010", "Petty Cash"),
                    ("1020", "Square / Stripe Clearing"),
                    ("1100", "Accounts Receivable"),
                    ("1200", "Inventory"),
                    ("1210", "Inventory — In Transit"),
                    ("1300", "Prepaid Expenses"),
                    ("1400", "Shop Fitout"),
                    ("1410", "POS Equipment"),
                    ("1450", "Accumulated Depreciation"),
                ],
                "2000-2999 Liabilities": [
                    ("2000", "Accounts Payable"),
                    ("2100", "Credit Card"),
                    ("2200", "GST/VAT Collected"),
                    ("2210", "GST/VAT Paid"),
                    ("2300", "PAYG/PAYE Withholding"),
                    ("2310", "Superannuation/Pension Payable"),
                    ("2400", "Gift Cards Outstanding"),
                    ("2500", "Customer Deposits"),
                    ("2600", "Loan — Business"),
                ],
                "3000-3999 Equity": [
                    ("3000", "Owner's Equity / Share Capital"),
                    ("3100", "Retained Earnings"),
                    ("3200", "Drawings / Distributions"),
                ],
                "4000-4999 Revenue": [
                    ("4000", "Sales Revenue"),
                    ("4010", "Online Sales"),
                    ("4020", "Wholesale Revenue"),
                    ("4100", "Shipping Revenue"),
                    ("4200", "Other Income"),
                    ("4900", "Sales Returns & Allowances"),
                ],
                "5000-5999 Cost of Goods Sold": [
                    ("5000", "Purchases"),
                    ("5010", "Freight & Customs"),
                    ("5020", "Inventory Adjustments"),
                    ("5030", "Shrinkage / Write-offs"),
                    ("5100", "Payment Processing Fees"),
                ],
                "6000-6999 Operating Expenses": [
                    ("6000", "Salaries & Wages"),
                    ("6010", "Superannuation / Pension"),
                    ("6100", "Rent"),
                    ("6110", "Utilities"),
                    ("6200", "Insurance"),
                    ("6300", "Marketing & Advertising"),
                    ("6310", "Website / Platform Fees"),
                    ("6400", "Packaging & Supplies"),
                    ("6500", "Depreciation"),
                    ("6600", "Bank Fees"),
                    ("6700", "Repairs & Maintenance"),
                    ("6900", "Sundry Expenses"),
                ],
            },
        },
        "construction": {
            "name": "Construction / Trades",
            "accounts": {
                "1000-1999 Assets": [
                    ("1000", "Cash at Bank"),
                    ("1010", "Cash — Trust Account"),
                    ("1100", "Accounts Receivable"),
                    ("1110", "Retentions Receivable"),
                    ("1200", "WIP — Projects"),
                    ("1300", "Materials on Hand"),
                    ("1400", "Plant & Equipment"),
                    ("1410", "Vehicles"),
                    ("1420", "Tools & Small Equipment"),
                    ("1450", "Accumulated Depreciation"),
                ],
                "2000-2999 Liabilities": [
                    ("2000", "Accounts Payable"),
                    ("2010", "Subcontractor Payable"),
                    ("2100", "Credit Card"),
                    ("2200", "GST/VAT Collected"),
                    ("2210", "GST/VAT Paid"),
                    ("2300", "PAYG/PAYE Withholding"),
                    ("2310", "Superannuation/Pension Payable"),
                    ("2400", "Retentions Held"),
                    ("2500", "Progress Claims in Advance"),
                    ("2600", "Equipment Finance"),
                    ("2610", "Business Loan"),
                ],
                "3000-3999 Equity": [
                    ("3000", "Owner's Equity / Share Capital"),
                    ("3100", "Retained Earnings"),
                    ("3200", "Drawings / Distributions"),
                ],
                "4000-4999 Revenue": [
                    ("4000", "Contract Revenue"),
                    ("4010", "Variation Claims"),
                    ("4020", "Day Labour Revenue"),
                    ("4100", "Equipment Hire Income"),
                    ("4200", "Other Income"),
                ],
                "5000-5999 Direct Costs": [
                    ("5000", "Materials"),
                    ("5010", "Subcontractor Costs"),
                    ("5020", "Direct Labour"),
                    ("5030", "Equipment Hire"),
                    ("5040", "Permits & Compliance"),
                    ("5050", "Waste Disposal"),
                ],
                "6000-6999 Operating Expenses": [
                    ("6000", "Salaries — Admin"),
                    ("6010", "Superannuation"),
                    ("6020", "Workers Compensation"),
                    ("6100", "Rent — Office / Yard"),
                    ("6200", "Insurance — Public Liability"),
                    ("6210", "Insurance — Contract Works"),
                    ("6300", "Vehicle Running Costs"),
                    ("6310", "Fuel"),
                    ("6400", "Repairs & Maintenance"),
                    ("6500", "Safety & Compliance"),
                    ("6600", "Depreciation"),
                    ("6700", "Bank Fees"),
                    ("6900", "Sundry Expenses"),
                ],
            },
        },
        "hospitality": {
            "name": "Hospitality (Restaurant, Cafe, Bar)",
            "accounts": {
                "1000-1999 Assets": [
                    ("1000", "Cash at Bank"),
                    ("1010", "Petty Cash / Till Float"),
                    ("1020", "EFTPOS Clearing"),
                    ("1100", "Accounts Receivable"),
                    ("1200", "Food Inventory"),
                    ("1210", "Beverage Inventory"),
                    ("1300", "Prepaid Expenses"),
                    ("1400", "Kitchen Equipment"),
                    ("1410", "Fitout"),
                    ("1450", "Accumulated Depreciation"),
                ],
                "2000-2999 Liabilities": [
                    ("2000", "Accounts Payable"),
                    ("2100", "Credit Card"),
                    ("2200", "GST/VAT Collected"),
                    ("2300", "PAYG/PAYE Withholding"),
                    ("2310", "Superannuation/Pension Payable"),
                    ("2400", "Tips Payable"),
                    ("2500", "Gift Vouchers Outstanding"),
                    ("2600", "Lease Liability"),
                ],
                "3000-3999 Equity": [
                    ("3000", "Owner's Equity / Share Capital"),
                    ("3100", "Retained Earnings"),
                    ("3200", "Drawings / Distributions"),
                ],
                "4000-4999 Revenue": [
                    ("4000", "Food Revenue"),
                    ("4010", "Beverage Revenue"),
                    ("4020", "Takeaway / Delivery Revenue"),
                    ("4030", "Catering Revenue"),
                    ("4100", "Other Income"),
                ],
                "5000-5999 Cost of Sales": [
                    ("5000", "Food Purchases"),
                    ("5010", "Beverage Purchases"),
                    ("5020", "Packaging — Takeaway"),
                    ("5030", "Inventory Waste / Spoilage"),
                ],
                "6000-6999 Operating Expenses": [
                    ("6000", "Wages — Kitchen"),
                    ("6010", "Wages — Front of House"),
                    ("6020", "Superannuation / Pension"),
                    ("6030", "Workers Compensation"),
                    ("6100", "Rent"),
                    ("6110", "Utilities"),
                    ("6200", "Insurance"),
                    ("6300", "Cleaning & Laundry"),
                    ("6400", "Marketing"),
                    ("6410", "Uber Eats / DoorDash Commissions"),
                    ("6500", "Repairs & Maintenance"),
                    ("6510", "Smallwares & Replacements"),
                    ("6600", "Liquor Licensing"),
                    ("6700", "Depreciation"),
                    ("6800", "Bank & EFTPOS Fees"),
                    ("6900", "Sundry Expenses"),
                ],
            },
        },
        "medical": {
            "name": "Medical / Healthcare Practice",
            "accounts": {
                "1000-1999 Assets": [
                    ("1000", "Cash at Bank"),
                    ("1010", "Cash — Trust Account"),
                    ("1100", "Accounts Receivable — Patients"),
                    ("1110", "Accounts Receivable — Medicare/Insurance"),
                    ("1200", "Prepaid Expenses"),
                    ("1300", "Medical Equipment"),
                    ("1310", "IT Equipment"),
                    ("1320", "Fitout"),
                    ("1350", "Accumulated Depreciation"),
                ],
                "2000-2999 Liabilities": [
                    ("2000", "Accounts Payable"),
                    ("2100", "GST/VAT (if applicable)"),
                    ("2200", "PAYG/PAYE Withholding"),
                    ("2210", "Superannuation/Pension Payable"),
                    ("2300", "Patient Deposits"),
                    ("2400", "Equipment Finance"),
                ],
                "3000-3999 Equity": [
                    ("3000", "Owner's Equity / Share Capital"),
                    ("3100", "Retained Earnings"),
                    ("3200", "Drawings / Distributions"),
                ],
                "4000-4999 Revenue": [
                    ("4000", "Consultation Fees"),
                    ("4010", "Procedure Revenue"),
                    ("4020", "Medicare / Insurance Rebates"),
                    ("4030", "Allied Health Revenue"),
                    ("4100", "Other Income"),
                ],
                "5000-5999 Direct Costs": [
                    ("5000", "Medical Supplies & Consumables"),
                    ("5010", "Pathology / Lab Costs"),
                    ("5020", "Locum Costs"),
                ],
                "6000-6999 Operating Expenses": [
                    ("6000", "Salaries — Clinical Staff"),
                    ("6010", "Salaries — Admin Staff"),
                    ("6020", "Superannuation / Pension"),
                    ("6100", "Rent"),
                    ("6200", "Insurance — Medical Indemnity"),
                    ("6210", "Insurance — General"),
                    ("6300", "Practice Software (PMS)"),
                    ("6310", "IT Support"),
                    ("6400", "Continuing Education (CPD)"),
                    ("6500", "Registration & Memberships"),
                    ("6600", "Depreciation"),
                    ("6700", "Bank Fees"),
                    ("6900", "Sundry Expenses"),
                ],
            },
        },
    }

    def list_templates(self) -> dict:
        """List available chart of accounts templates."""
        return {
            "templates": [
                {"id": k, "name": v["name"], "account_count": sum(len(accs) for accs in v["accounts"].values())}
                for k, v in self.TEMPLATES.items()
            ],
        }

    def get_template(self, template_id: str) -> dict | None:
        """Get a specific chart of accounts template."""
        template = self.TEMPLATES.get(template_id)
        if not template:
            return None
        return {
            "id": template_id,
            "name": template["name"],
            "sections": template["accounts"],
            "total_accounts": sum(len(accs) for accs in template["accounts"].values()),
        }

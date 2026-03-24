"""Company Incorporation Engine.

Handles business formation across four jurisdictions:
  - AU: ASIC registration → ACN → ABN → TFN → GST
  - NZ: Companies Office → NZBN → IRD → GST
  - UK: Companies House → UTR → PAYE → VAT
  - US: State SOS → EIN → State Tax → Sales Tax

Each jurisdiction has specific requirements for:
  - Company structure types
  - Director/officer requirements
  - Shareholder/member requirements
  - Registered address rules
  - Document generation
  - Filing fee estimates
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from decimal import Decimal


# ── Jurisdiction Configuration ──────────────────────────────────

JURISDICTIONS = {
    "AU": {
        "name": "Australia",
        "authority": "Australian Securities & Investments Commission (ASIC)",
        "structures": [
            {
                "code": "pty_ltd",
                "name": "Proprietary Limited (Pty Ltd)",
                "description": "Most common business structure for SMEs. Limited liability, 1-50 shareholders.",
                "min_directors": 1,
                "min_shareholders": 1,
                "max_shareholders": 50,
                "requires_secretary": False,
                "requires_resident_director": True,
                "filing_fee": Decimal("576"),
                "annual_review_fee": Decimal("310"),
            },
            {
                "code": "ltd",
                "name": "Public Company Limited (Ltd)",
                "description": "For larger companies seeking public investment. Unlimited shareholders.",
                "min_directors": 3,
                "min_shareholders": 1,
                "max_shareholders": None,
                "requires_secretary": True,
                "requires_resident_director": True,
                "filing_fee": Decimal("576"),
                "annual_review_fee": Decimal("1404"),
            },
            {
                "code": "sole_trader",
                "name": "Sole Trader",
                "description": "Simplest structure. No separation between personal and business assets.",
                "min_directors": 0,
                "min_shareholders": 0,
                "max_shareholders": 0,
                "requires_secretary": False,
                "requires_resident_director": False,
                "filing_fee": Decimal("0"),
                "annual_review_fee": Decimal("0"),
            },
        ],
        "registrations": [
            {"code": "acn", "name": "Australian Company Number (ACN)", "mandatory": True, "authority": "ASIC", "timeline": "1-3 business days"},
            {"code": "abn", "name": "Australian Business Number (ABN)", "mandatory": True, "authority": "ABR", "timeline": "Same day (online)"},
            {"code": "tfn", "name": "Tax File Number (TFN)", "mandatory": True, "authority": "ATO", "timeline": "28 business days"},
            {"code": "gst", "name": "GST Registration", "mandatory": False, "authority": "ATO", "timeline": "Same day (if turnover > $75K)", "threshold": "$75,000 annual turnover"},
            {"code": "payg", "name": "PAYG Withholding", "mandatory": False, "authority": "ATO", "timeline": "Same day", "condition": "If employing staff"},
            {"code": "super", "name": "Superannuation Fund", "mandatory": False, "authority": "ATO", "timeline": "Varies", "condition": "If employing staff"},
        ],
        "required_fields": ["company_name", "registered_address", "principal_activity", "financial_year_end"],
        "address_format": ["street", "suburb", "state", "postcode"],
        "states": ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"],
    },
    "NZ": {
        "name": "New Zealand",
        "authority": "New Zealand Companies Office",
        "structures": [
            {
                "code": "ltd",
                "name": "Limited Company (Ltd)",
                "description": "Standard company structure. Must have at least one NZ-resident director.",
                "min_directors": 1,
                "min_shareholders": 1,
                "max_shareholders": None,
                "requires_secretary": False,
                "requires_resident_director": True,
                "filing_fee": Decimal("150"),
                "annual_review_fee": Decimal("53.53"),
            },
            {
                "code": "lp",
                "name": "Limited Partnership (LP)",
                "description": "Partnership with limited liability for limited partners.",
                "min_directors": 0,
                "min_shareholders": 2,
                "max_shareholders": None,
                "requires_secretary": False,
                "requires_resident_director": False,
                "filing_fee": Decimal("270"),
                "annual_review_fee": Decimal("53.53"),
            },
            {
                "code": "sole_trader",
                "name": "Sole Trader",
                "description": "Individual trading on their own. No company registration needed.",
                "min_directors": 0,
                "min_shareholders": 0,
                "max_shareholders": 0,
                "requires_secretary": False,
                "requires_resident_director": False,
                "filing_fee": Decimal("0"),
                "annual_review_fee": Decimal("0"),
            },
        ],
        "registrations": [
            {"code": "nzbn", "name": "NZ Business Number (NZBN)", "mandatory": True, "authority": "MBIE", "timeline": "Automatic with company registration"},
            {"code": "ird", "name": "IRD Number", "mandatory": True, "authority": "Inland Revenue", "timeline": "5-10 business days"},
            {"code": "gst", "name": "GST Registration", "mandatory": False, "authority": "Inland Revenue", "timeline": "5 business days", "threshold": "$60,000 annual turnover"},
            {"code": "kiwisaver", "name": "KiwiSaver Employer", "mandatory": False, "authority": "Inland Revenue", "timeline": "Automatic", "condition": "If employing staff"},
        ],
        "required_fields": ["company_name", "registered_address", "principal_activity"],
        "address_format": ["street", "suburb", "city", "postcode"],
        "states": [],
    },
    "GB": {
        "name": "United Kingdom",
        "authority": "Companies House",
        "structures": [
            {
                "code": "ltd",
                "name": "Private Limited Company (Ltd)",
                "description": "Most common structure. Limited liability, 1+ shareholders.",
                "min_directors": 1,
                "min_shareholders": 1,
                "max_shareholders": None,
                "requires_secretary": False,
                "requires_resident_director": False,
                "filing_fee": Decimal("12"),
                "annual_review_fee": Decimal("13"),
            },
            {
                "code": "plc",
                "name": "Public Limited Company (PLC)",
                "description": "Can offer shares to the public. Minimum £50,000 share capital.",
                "min_directors": 2,
                "min_shareholders": 1,
                "max_shareholders": None,
                "requires_secretary": True,
                "requires_resident_director": False,
                "filing_fee": Decimal("40"),
                "annual_review_fee": Decimal("13"),
            },
            {
                "code": "llp",
                "name": "Limited Liability Partnership (LLP)",
                "description": "Partnership with limited liability. Popular for professional services.",
                "min_directors": 0,
                "min_shareholders": 2,
                "max_shareholders": None,
                "requires_secretary": False,
                "requires_resident_director": False,
                "filing_fee": Decimal("12"),
                "annual_review_fee": Decimal("13"),
            },
            {
                "code": "sole_trader",
                "name": "Sole Trader",
                "description": "Self-employed individual. Must register with HMRC for Self Assessment.",
                "min_directors": 0,
                "min_shareholders": 0,
                "max_shareholders": 0,
                "requires_secretary": False,
                "requires_resident_director": False,
                "filing_fee": Decimal("0"),
                "annual_review_fee": Decimal("0"),
            },
        ],
        "registrations": [
            {"code": "crn", "name": "Company Registration Number (CRN)", "mandatory": True, "authority": "Companies House", "timeline": "24 hours (online)"},
            {"code": "utr", "name": "Unique Taxpayer Reference (UTR)", "mandatory": True, "authority": "HMRC", "timeline": "7-10 business days"},
            {"code": "vat", "name": "VAT Registration", "mandatory": False, "authority": "HMRC", "timeline": "30 business days", "threshold": "£90,000 annual turnover"},
            {"code": "paye", "name": "PAYE Employer Scheme", "mandatory": False, "authority": "HMRC", "timeline": "5 business days", "condition": "If employing staff"},
            {"code": "pension", "name": "Workplace Pension", "mandatory": False, "authority": "The Pensions Regulator", "timeline": "Before first employee", "condition": "If employing staff"},
        ],
        "required_fields": ["company_name", "registered_address", "sic_code", "share_capital"],
        "address_format": ["street", "city", "county", "postcode"],
        "states": [],
    },
    "US": {
        "name": "United States",
        "authority": "State Secretary of State + IRS",
        "structures": [
            {
                "code": "llc",
                "name": "Limited Liability Company (LLC)",
                "description": "Flexible structure with pass-through taxation. Most popular for small businesses.",
                "min_directors": 0,
                "min_shareholders": 1,
                "max_shareholders": None,
                "requires_secretary": False,
                "requires_resident_director": False,
                "filing_fee": Decimal("100"),
                "annual_review_fee": Decimal("50"),
            },
            {
                "code": "c_corp",
                "name": "C Corporation",
                "description": "Standard corporation. Double taxation but unlimited growth potential. Required for VC funding.",
                "min_directors": 1,
                "min_shareholders": 1,
                "max_shareholders": None,
                "requires_secretary": False,
                "requires_resident_director": False,
                "filing_fee": Decimal("100"),
                "annual_review_fee": Decimal("225"),
            },
            {
                "code": "s_corp",
                "name": "S Corporation",
                "description": "Pass-through taxation with corporate structure. Max 100 shareholders, US citizens/residents only.",
                "min_directors": 1,
                "min_shareholders": 1,
                "max_shareholders": 100,
                "requires_secretary": False,
                "requires_resident_director": False,
                "filing_fee": Decimal("100"),
                "annual_review_fee": Decimal("225"),
            },
            {
                "code": "sole_prop",
                "name": "Sole Proprietorship",
                "description": "Simplest structure. No state filing needed. Business income on personal return.",
                "min_directors": 0,
                "min_shareholders": 0,
                "max_shareholders": 0,
                "requires_secretary": False,
                "requires_resident_director": False,
                "filing_fee": Decimal("0"),
                "annual_review_fee": Decimal("0"),
            },
        ],
        "registrations": [
            {"code": "sos", "name": "State Filing (Articles of Organization/Incorporation)", "mandatory": True, "authority": "Secretary of State", "timeline": "1-10 business days (varies by state)"},
            {"code": "ein", "name": "Employer Identification Number (EIN)", "mandatory": True, "authority": "IRS", "timeline": "Immediate (online)"},
            {"code": "state_tax", "name": "State Tax Registration", "mandatory": True, "authority": "State Revenue Department", "timeline": "5-15 business days"},
            {"code": "sales_tax", "name": "Sales Tax Permit", "mandatory": False, "authority": "State Revenue", "timeline": "5-10 business days", "condition": "If selling taxable goods/services"},
            {"code": "boi", "name": "Beneficial Ownership Information (BOI)", "mandatory": True, "authority": "FinCEN", "timeline": "Within 90 days of formation"},
        ],
        "required_fields": ["company_name", "registered_agent", "state_of_formation", "principal_address"],
        "address_format": ["street", "city", "state", "zip"],
        "states": [
            "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN",
            "IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH",
            "NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT",
            "VT","VA","WA","WV","WI","WY",
        ],
    },
}

# US state filing fees (approximate, varies)
US_STATE_FILING_FEES = {
    "DE": 90, "WY": 100, "NV": 75, "CA": 70, "NY": 200, "TX": 300,
    "FL": 125, "IL": 150, "OH": 99, "PA": 125, "GA": 100, "NC": 125,
    "MI": 50, "NJ": 125, "VA": 100, "WA": 200, "MA": 500, "AZ": 50,
    "CO": 50, "MN": 155, "WI": 130, "MO": 50, "IN": 95, "TN": 300,
    "MD": 100, "OR": 100, "CT": 120, "UT": 54, "IA": 50, "SC": 110,
    "KS": 160, "MS": 50, "NE": 100, "NM": 50, "ID": 100, "HI": 50,
    "ME": 175, "NH": 100, "RI": 150, "MT": 70, "SD": 150, "ND": 135,
    "AK": 250, "VT": 125, "WV": 100, "KY": 40, "AL": 200, "OK": 100,
    "AR": 45, "LA": 75, "DC": 220,
}


class IncorporationEngine:
    """Handles company formation logic and validation."""

    def get_jurisdiction_info(self, jurisdiction: str) -> dict:
        """Get full configuration for a jurisdiction."""
        jur = jurisdiction.upper()
        if jur not in JURISDICTIONS:
            raise ValueError(f"Unsupported jurisdiction: {jur}")
        return JURISDICTIONS[jur]

    def get_structures(self, jurisdiction: str) -> list[dict]:
        """Get available company structures for a jurisdiction."""
        return self.get_jurisdiction_info(jurisdiction)["structures"]

    def get_registrations(self, jurisdiction: str) -> list[dict]:
        """Get required registrations for a jurisdiction."""
        return self.get_jurisdiction_info(jurisdiction)["registrations"]

    def estimate_costs(self, jurisdiction: str, structure_code: str, state: str | None = None) -> dict:
        """Estimate total incorporation costs."""
        jur_info = self.get_jurisdiction_info(jurisdiction)
        structure = next((s for s in jur_info["structures"] if s["code"] == structure_code), None)
        if not structure:
            raise ValueError(f"Unknown structure: {structure_code}")

        filing_fee = float(structure["filing_fee"])
        annual_fee = float(structure["annual_review_fee"])

        # US state-specific fees
        if jurisdiction.upper() == "US" and state:
            filing_fee = US_STATE_FILING_FEES.get(state.upper(), 100)

        costs = {
            "filing_fee": filing_fee,
            "annual_review_fee": annual_fee,
            "estimated_professional_fees": 0,
            "total_initial": filing_fee,
            "total_annual": annual_fee,
            "currency": {"AU": "AUD", "NZ": "NZD", "GB": "GBP", "US": "USD"}[jurisdiction.upper()],
        }

        return costs

    def validate_application(self, data: dict) -> dict:
        """Validate an incorporation application. Returns errors dict."""
        errors = {}
        jurisdiction = data.get("jurisdiction", "").upper()

        if jurisdiction not in JURISDICTIONS:
            errors["jurisdiction"] = "Unsupported jurisdiction"
            return {"valid": False, "errors": errors}

        jur_info = JURISDICTIONS[jurisdiction]
        structure_code = data.get("structure_code")
        structure = next((s for s in jur_info["structures"] if s["code"] == structure_code), None)

        if not structure:
            errors["structure_code"] = "Invalid company structure"
            return {"valid": False, "errors": errors}

        # Company name
        name = data.get("company_name", "").strip()
        if not name:
            errors["company_name"] = "Company name is required"
        elif len(name) < 3:
            errors["company_name"] = "Company name must be at least 3 characters"

        # Directors
        directors = data.get("directors", [])
        if len(directors) < structure["min_directors"]:
            errors["directors"] = f"Minimum {structure['min_directors']} director(s) required"

        if structure.get("requires_resident_director"):
            has_resident = any(d.get("is_resident", False) for d in directors)
            if not has_resident and directors:
                errors["directors_residency"] = f"At least one director must be a resident of {jur_info['name']}"

        # Shareholders / members
        shareholders = data.get("shareholders", [])
        if structure["min_shareholders"] > 0 and len(shareholders) < structure["min_shareholders"]:
            errors["shareholders"] = f"Minimum {structure['min_shareholders']} shareholder(s) required"

        if structure["max_shareholders"] and len(shareholders) > structure["max_shareholders"]:
            errors["shareholders_max"] = f"Maximum {structure['max_shareholders']} shareholders allowed"

        # Registered address
        address = data.get("registered_address", {})
        if not address.get("street"):
            errors["registered_address"] = "Registered address is required"

        # US: state of formation
        if jurisdiction == "US":
            if not data.get("state_of_formation"):
                errors["state_of_formation"] = "State of formation is required"
            if not data.get("registered_agent"):
                errors["registered_agent"] = "Registered agent name is required"

        # Secretary (if required)
        if structure.get("requires_secretary") and not data.get("secretary"):
            errors["secretary"] = "Company secretary is required for this structure"

        return {"valid": len(errors) == 0, "errors": errors}

    def create_application(self, data: dict, user_id: str) -> dict:
        """Create a new incorporation application."""
        validation = self.validate_application(data)
        if not validation["valid"]:
            return {"success": False, "errors": validation["errors"]}

        jurisdiction = data["jurisdiction"].upper()
        jur_info = JURISDICTIONS[jurisdiction]
        structure = next(s for s in jur_info["structures"] if s["code"] == data["structure_code"])
        costs = self.estimate_costs(jurisdiction, data["structure_code"], data.get("state_of_formation"))

        app_id = str(uuid.uuid4())
        application = {
            "id": app_id,
            "status": "draft",
            "jurisdiction": jurisdiction,
            "structure_code": data["structure_code"],
            "structure_name": structure["name"],
            "company_name": data["company_name"],
            "trading_name": data.get("trading_name"),
            "principal_activity": data.get("principal_activity", ""),
            "directors": data.get("directors", []),
            "shareholders": data.get("shareholders", []),
            "secretary": data.get("secretary"),
            "registered_address": data.get("registered_address", {}),
            "principal_address": data.get("principal_address", {}),
            "state_of_formation": data.get("state_of_formation"),
            "registered_agent": data.get("registered_agent"),
            "share_capital": data.get("share_capital"),
            "financial_year_end": data.get("financial_year_end"),
            "estimated_costs": costs,
            "registrations": self._build_registration_checklist(jurisdiction, data),
            "created_by": user_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "submitted_at": None,
            "completed_at": None,
        }

        return {"success": True, "application": application}

    def submit_application(self, application: dict) -> dict:
        """Submit an application for processing. Returns updated application with next steps."""
        application["status"] = "submitted"
        application["submitted_at"] = datetime.now(timezone.utc).isoformat()

        # Generate next steps based on jurisdiction
        jurisdiction = application["jurisdiction"]
        steps = []
        registrations = application.get("registrations", [])

        for reg in registrations:
            steps.append({
                "registration": reg["code"],
                "name": reg["name"],
                "authority": reg["authority"],
                "status": "pending",
                "timeline": reg["timeline"],
                "reference_number": None,
                "completed_at": None,
            })

        application["filing_steps"] = steps
        return application

    def _build_registration_checklist(self, jurisdiction: str, data: dict) -> list[dict]:
        """Build the list of registrations needed based on jurisdiction and choices."""
        jur_info = JURISDICTIONS[jurisdiction]
        checklist = []

        for reg in jur_info["registrations"]:
            needed = reg["mandatory"]
            if not needed and reg.get("condition"):
                # Could auto-detect based on data, for now include as optional
                needed = False

            checklist.append({
                "code": reg["code"],
                "name": reg["name"],
                "authority": reg["authority"],
                "mandatory": reg["mandatory"],
                "needed": needed,
                "timeline": reg["timeline"],
                "threshold": reg.get("threshold"),
                "condition": reg.get("condition"),
                "status": "not_started",
            })

        return checklist

    def generate_documents(self, application: dict) -> list[dict]:
        """Generate the documents needed for filing."""
        jurisdiction = application["jurisdiction"]
        structure = application["structure_code"]
        docs = []

        if jurisdiction == "AU":
            if structure in ("pty_ltd", "ltd"):
                docs.append({"name": "Form 201 — Application for Registration", "type": "asic_form", "status": "generated"})
                docs.append({"name": "Company Constitution", "type": "constitution", "status": "generated"})
                docs.append({"name": "Consent to Act as Director", "type": "consent", "status": "requires_signature"})
                docs.append({"name": "Share Register", "type": "register", "status": "generated"})

        elif jurisdiction == "NZ":
            if structure == "ltd":
                docs.append({"name": "Application for Incorporation", "type": "companies_office", "status": "generated"})
                docs.append({"name": "Company Constitution", "type": "constitution", "status": "generated"})
                docs.append({"name": "Consent to Act as Director", "type": "consent", "status": "requires_signature"})
                docs.append({"name": "Share Allocation Statement", "type": "shares", "status": "generated"})

        elif jurisdiction == "GB":
            if structure in ("ltd", "plc"):
                docs.append({"name": "IN01 — Application to Register a Company", "type": "companies_house", "status": "generated"})
                docs.append({"name": "Memorandum of Association", "type": "memorandum", "status": "generated"})
                docs.append({"name": "Articles of Association", "type": "articles", "status": "generated"})
                docs.append({"name": "Statement of Capital", "type": "capital", "status": "generated"})

        elif jurisdiction == "US":
            if structure == "llc":
                state = application.get("state_of_formation", "DE")
                docs.append({"name": f"Articles of Organization ({state})", "type": "articles", "status": "generated"})
                docs.append({"name": "Operating Agreement", "type": "operating_agreement", "status": "generated"})
                docs.append({"name": "IRS Form SS-4 (EIN Application)", "type": "irs_form", "status": "generated"})
                docs.append({"name": "BOI Report (FinCEN)", "type": "boi", "status": "requires_info"})
            elif structure in ("c_corp", "s_corp"):
                state = application.get("state_of_formation", "DE")
                docs.append({"name": f"Articles of Incorporation ({state})", "type": "articles", "status": "generated"})
                docs.append({"name": "Corporate Bylaws", "type": "bylaws", "status": "generated"})
                docs.append({"name": "IRS Form SS-4 (EIN Application)", "type": "irs_form", "status": "generated"})
                docs.append({"name": "Organizational Resolutions", "type": "resolutions", "status": "generated"})
                docs.append({"name": "Stock Certificates", "type": "stock", "status": "generated"})
                docs.append({"name": "BOI Report (FinCEN)", "type": "boi", "status": "requires_info"})
                if structure == "s_corp":
                    docs.append({"name": "IRS Form 2553 (S-Corp Election)", "type": "irs_form", "status": "generated"})

        return docs

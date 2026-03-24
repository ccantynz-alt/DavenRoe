"""Tax Knowledge Base — comprehensive tax rules, deductions, and limits across AU, NZ, UK, US.

This module contains structured tax knowledge that the Tax Agent uses to answer
questions about claimable expenses, deduction limits, compliance requirements,
and general tax obligations. All data is jurisdiction-specific and updated for
the 2025-2026 financial year.

IMPORTANT: This is general guidance only. Users should consult a qualified tax
professional for advice specific to their circumstances.
"""

from __future__ import annotations


# ═══════════════════════════════════════════════════════════════
# AUSTRALIA (ATO)
# ═══════════════════════════════════════════════════════════════

AU_TAX = {
    "jurisdiction": "AU",
    "authority": "Australian Taxation Office (ATO)",
    "financial_year": "1 July – 30 June",
    "currency": "AUD",

    "income_tax_rates": {
        "resident": [
            {"min": 0, "max": 18200, "rate": 0, "base": 0},
            {"min": 18201, "max": 45000, "rate": 0.19, "base": 0},
            {"min": 45001, "max": 120000, "rate": 0.325, "base": 5092},
            {"min": 120001, "max": 180000, "rate": 0.37, "base": 29467},
            {"min": 180001, "max": None, "rate": 0.45, "base": 51667},
        ],
        "company": 0.25,  # Base rate entity (turnover < $50M)
        "company_full": 0.30,  # Full rate
        "medicare_levy": 0.02,
    },

    "gst": {
        "rate": 0.10,
        "threshold": 75000,
        "registration_mandatory_above": 75000,
        "reporting_periods": ["Monthly", "Quarterly", "Annually"],
        "bas_due_dates": {
            "quarterly": "28th of month after quarter end",
            "monthly": "21st of following month",
            "annual": "28 February",
        },
        "gst_free_items": [
            "Most basic food (fresh fruit, vegetables, meat, bread, milk, eggs)",
            "Health services (medical, dental, optometry, physiotherapy)",
            "Education courses (formal education, approved courses)",
            "Child care",
            "Exports of goods and services",
            "Religious services",
            "Water, sewerage, drainage",
            "International transport",
            "Precious metals (first supply)",
            "Some residential rent",
        ],
        "input_taxed_items": [
            "Financial supplies (loans, interest, share trading)",
            "Residential rent (existing residential premises)",
        ],
    },

    "claimable_expenses": {
        "work_from_home": {
            "rate": 0.67,  # per hour
            "method": "Fixed rate method (67 cents per hour)",
            "alternative": "Actual cost method (requires detailed records)",
            "requirements": "Must keep a record of hours worked from home (timesheet, diary, roster)",
            "covers": "Electricity, gas, phone, internet, stationery, computer consumables, depreciation of equipment",
            "max_hours": None,
            "notes": "Cannot also claim separate deductions for items covered by the rate",
        },
        "vehicle": {
            "cents_per_km": {
                "rate": 0.85,  # per km for 2024-25
                "max_km": 5000,
                "max_deduction": 4250,
                "requirements": "No written evidence needed but must be able to show how you calculated",
            },
            "logbook": {
                "method": "Keep a logbook for 12 continuous weeks, valid for 5 years",
                "claim": "Business-use percentage of ALL car expenses",
                "expenses_included": "Fuel, insurance, registration, repairs, depreciation, interest on car loan",
                "car_limit": 68108,  # 2024-25 car cost limit for depreciation
            },
        },
        "travel": {
            "domestic": "Actual expenses for accommodation, meals, incidentals when travelling for work",
            "overseas": "Actual expenses with full records, or ATO reasonable travel allowance amounts",
            "allowance_rates": "See ATO TD for current year reasonable amounts",
            "commuting": "NOT deductible — travel between home and regular workplace is private",
            "exceptions": "Itinerant workers, carrying bulky tools, no fixed workplace",
        },
        "clothing": {
            "uniforms": "Deductible if compulsory uniform with employer logo, or registered with AusIndustry",
            "protective": "Deductible — steel-capped boots, high-vis, hard hats, gloves, sun protection",
            "conventional": "NOT deductible — plain black pants, white shirts, suits, normal shoes",
            "laundry": "Up to $150 without receipts for eligible work clothing laundry costs",
        },
        "self_education": {
            "deductible_if": "Directly related to current employment, or likely to increase income from current employment",
            "not_deductible_if": "For a new career, general interest, or not sufficiently connected to current work",
            "includes": "Course fees, textbooks, stationery, travel to education, internet for study, student union fees",
            "first_250": "First $250 of self-education expenses is not deductible (but offset against other claims)",
        },
        "phone_internet": {
            "work_use_percentage": "Must calculate actual work-use percentage",
            "records": "Keep a diary for a representative 4-week period, then apply percentage to full year",
            "claim": "Work-use percentage of phone bills and internet plan",
        },
        "tools_equipment": {
            "under_300": "Items costing $300 or less can be claimed immediately in full",
            "over_300": "Items over $300 must be depreciated over effective life",
            "examples": "Laptop, tablet, tools of trade, professional library, software subscriptions",
        },
        "home_office_equipment": {
            "desk": "Depreciate over 10 years (or claim immediately if under $300)",
            "chair": "Depreciate over 10 years (or claim immediately if under $300)",
            "computer": "Depreciate over 4 years (effective life)",
            "printer": "Depreciate over 5 years",
        },
        "bank_fees": {
            "deductible": True,
            "includes": [
                "Account-keeping fees on accounts used for work/business",
                "Interest on money borrowed for income-producing purposes",
                "Bank charges for transferring money for work/business",
                "Merchant fees for business transactions",
                "Foreign currency conversion fees for business transactions",
            ],
            "not_deductible": [
                "Personal banking fees",
                "ATM withdrawal fees for personal use",
                "Credit card annual fees (unless card is exclusively for business)",
                "Interest on personal loans",
            ],
            "apportionment": "If account is mixed use (personal + business), only the business proportion is deductible",
            "records": "Keep bank statements showing the fees charged",
        },
    },

    "superannuation": {
        "rate": 0.115,  # 11.5% from 1 July 2024
        "concessional_cap": 30000,  # per year
        "non_concessional_cap": 120000,  # per year
        "preservation_age": 60,
        "max_contribution_base": 62270,  # quarterly, 2024-25
    },

    "instant_asset_write_off": {
        "threshold": 20000,  # per asset, for small businesses (turnover < $10M)
        "applies_to": "Businesses with aggregated turnover less than $10 million",
        "notes": "Each asset must cost less than the threshold. Multiple assets can be claimed.",
    },

    "important_dates": [
        {"date": "21 Oct", "event": "BAS due (quarterly, Sep quarter)"},
        {"date": "31 Oct", "event": "Individual tax return due (if self-lodging)"},
        {"date": "28 Feb", "event": "BAS due (quarterly, Dec quarter)"},
        {"date": "15 May", "event": "Tax return due (if using tax agent, most cases)"},
        {"date": "28 May", "event": "BAS due (quarterly, Mar quarter)"},
        {"date": "28 Aug", "event": "BAS due (quarterly, Jun quarter)"},
    ],
}


# ═══════════════════════════════════════════════════════════════
# NEW ZEALAND (IRD)
# ═══════════════════════════════════════════════════════════════

NZ_TAX = {
    "jurisdiction": "NZ",
    "authority": "Inland Revenue Department (IRD)",
    "financial_year": "1 April – 31 March",
    "currency": "NZD",

    "income_tax_rates": {
        "individual": [
            {"min": 0, "max": 15600, "rate": 0.105},
            {"min": 15601, "max": 53500, "rate": 0.175},
            {"min": 53501, "max": 78100, "rate": 0.30},
            {"min": 78101, "max": 180000, "rate": 0.33},
            {"min": 180001, "max": None, "rate": 0.39},
        ],
        "company": 0.28,
        "trust": 0.39,
    },

    "gst": {
        "rate": 0.15,
        "threshold": 60000,
        "reporting_periods": ["Monthly", "Two-monthly", "Six-monthly"],
        "zero_rated": [
            "Exports",
            "Financial services (exempt)",
            "Residential rent (exempt)",
            "Sale of a going concern (to registered person)",
        ],
    },

    "claimable_expenses": {
        "home_office": {
            "method": "Proportion of household expenses based on floor area used for business",
            "expenses": "Rent/mortgage interest, rates, insurance, power, phone, internet",
            "records": "Keep receipts and calculate the business-use proportion",
        },
        "vehicle": {
            "ird_rate": 0.99,  # per km for 2024, first 14,000 km
            "tier_2_rate": 0.35,  # per km after 14,000 km
            "alternative": "Actual cost method with logbook (3-month representative period)",
        },
        "bank_fees": {
            "deductible": True,
            "includes": [
                "Business account fees",
                "Merchant/EFTPOS terminal fees",
                "Interest on business loans",
                "Foreign exchange fees for business transactions",
                "Credit card fees if card is for business use",
            ],
            "not_deductible": [
                "Personal banking fees",
                "Interest on personal borrowings",
                "Fees on accounts not used for business",
            ],
            "apportionment": "Mixed-use accounts — claim the business proportion only",
        },
        "entertainment": {
            "50_percent": "Most business entertainment (meals with clients, after-work drinks, corporate events)",
            "100_percent": "Light refreshments at a conference, employee amenities on premises",
            "not_deductible": "Personal entertainment, non-business social events",
        },
    },

    "kiwisaver": {
        "employee_rates": [0.03, 0.04, 0.06, 0.08, 0.10],
        "employer_min": 0.03,
        "government_contribution": "Max $521.43 per year (if contributing $1,042.86+)",
    },
}


# ═══════════════════════════════════════════════════════════════
# UNITED KINGDOM (HMRC)
# ═══════════════════════════════════════════════════════════════

GB_TAX = {
    "jurisdiction": "GB",
    "authority": "HM Revenue & Customs (HMRC)",
    "financial_year": "6 April – 5 April",
    "currency": "GBP",

    "income_tax_rates": {
        "individual": [
            {"min": 0, "max": 12570, "rate": 0, "band": "Personal Allowance"},
            {"min": 12571, "max": 50270, "rate": 0.20, "band": "Basic rate"},
            {"min": 50271, "max": 125140, "rate": 0.40, "band": "Higher rate"},
            {"min": 125141, "max": None, "rate": 0.45, "band": "Additional rate"},
        ],
        "corporation_tax": {
            "small_profits": {"max_profit": 50000, "rate": 0.19},
            "main_rate": {"min_profit": 250000, "rate": 0.25},
            "marginal_relief": "Between £50,000 and £250,000",
        },
        "national_insurance": {
            "employee_rate": 0.08,
            "employer_rate": 0.138,
            "self_employed_class_2": 3.45,  # per week
            "self_employed_class_4": {"rate": 0.06, "threshold": 12570, "upper": 50270},
        },
    },

    "vat": {
        "standard_rate": 0.20,
        "reduced_rate": 0.05,
        "zero_rate": 0.0,
        "threshold": 90000,
        "deregistration_threshold": 88000,
        "zero_rated_items": [
            "Most food (not restaurant meals, hot takeaways, confectionery, alcohol, soft drinks)",
            "Children's clothing and footwear",
            "Books, newspapers, magazines (physical)",
            "Public transport",
            "New-build residential property",
            "Exports",
        ],
        "reduced_rate_items": [
            "Domestic energy (gas, electricity)",
            "Children's car seats",
            "Mobility aids for elderly",
            "Sanitary products",
            "Smoking cessation products",
        ],
        "exempt_items": [
            "Insurance",
            "Financial services",
            "Education (eligible bodies)",
            "Health services (registered practitioners)",
            "Burial/cremation",
            "Subscriptions to professional bodies",
            "Residential rent",
        ],
    },

    "claimable_expenses": {
        "home_office": {
            "flat_rate": {"up_to_25_hours": 0, "25_to_50_hours": 10, "51_to_100_hours": 18, "101_plus_hours": 26},
            "flat_rate_note": "Per month, no receipts needed",
            "actual_cost": "Calculate business proportion of home expenses (rent, mortgage interest, council tax, utilities, internet)",
        },
        "vehicle": {
            "mileage_rates": {
                "car_first_10000": 0.45,
                "car_over_10000": 0.25,
                "motorcycle": 0.24,
                "bicycle": 0.20,
            },
            "note": "Cannot also claim actual running costs if using mileage rates",
            "company_car": "Benefit-in-kind based on list price and CO2 emissions",
        },
        "bank_fees": {
            "deductible": True,
            "includes": [
                "Business bank account charges",
                "Interest on business loans and overdrafts",
                "Credit card charges for business purchases",
                "Bank charges for bounced cheques (business)",
                "Merchant service charges (card payment processing)",
                "Foreign exchange charges for business transactions",
            ],
            "not_deductible": [
                "Personal bank charges",
                "Interest on personal loans",
                "Repayment of capital on loans (only interest is deductible)",
                "Fines and penalties from banks",
            ],
            "records": "Keep bank statements and a record of which fees relate to business",
        },
        "clothing": {
            "deductible": "Only uniforms with business logo, protective clothing, costumes for performers",
            "not_deductible": "Business suits, smart clothing (even if only worn for work)",
        },
        "training": {
            "deductible": "Training to update skills for current trade/profession",
            "not_deductible": "Training for a completely new skill/trade",
        },
        "annual_investment_allowance": {
            "amount": 1000000,
            "note": "100% first-year deduction on qualifying plant and machinery (permanent from April 2023)",
        },
    },

    "important_dates": [
        {"date": "5 Oct", "event": "Register for Self Assessment (new taxpayers)"},
        {"date": "31 Oct", "event": "Paper tax return deadline"},
        {"date": "31 Jan", "event": "Online tax return deadline + payment due"},
        {"date": "31 Jul", "event": "Second payment on account due"},
    ],
}


# ═══════════════════════════════════════════════════════════════
# UNITED STATES (IRS)
# ═══════════════════════════════════════════════════════════════

US_TAX = {
    "jurisdiction": "US",
    "authority": "Internal Revenue Service (IRS)",
    "financial_year": "1 January – 31 December (calendar year, or fiscal year election)",
    "currency": "USD",

    "income_tax_rates": {
        "individual_2025": [
            {"min": 0, "max": 11925, "rate": 0.10},
            {"min": 11926, "max": 48475, "rate": 0.12},
            {"min": 48476, "max": 103350, "rate": 0.22},
            {"min": 103351, "max": 197300, "rate": 0.24},
            {"min": 197301, "max": 250525, "rate": 0.32},
            {"min": 250526, "max": 626350, "rate": 0.35},
            {"min": 626351, "max": None, "rate": 0.37},
        ],
        "corporate": 0.21,
        "self_employment_tax": 0.153,  # 15.3% (12.4% SS + 2.9% Medicare)
        "standard_deduction_2025": {
            "single": 15000,
            "married_filing_jointly": 30000,
            "head_of_household": 22500,
        },
    },

    "sales_tax": {
        "note": "No federal sales tax. State rates vary from 0% to 7.25%",
        "no_sales_tax_states": ["OR", "MT", "NH", "DE", "AK"],
        "nexus": "Must collect sales tax in states where you have economic nexus (typically $100K+ in sales or 200+ transactions)",
    },

    "claimable_expenses": {
        "home_office": {
            "simplified_method": {"rate": 5.00, "max_sqft": 300, "max_deduction": 1500},
            "regular_method": "Calculate actual expenses × business-use percentage of home",
            "qualification": "Must be used regularly and exclusively for business. Must be principal place of business.",
            "employees": "W-2 employees can NO LONGER deduct home office expenses (eliminated by TCJA 2017)",
        },
        "vehicle": {
            "standard_mileage_rate_2025": 0.70,  # per mile
            "alternative": "Actual expenses (gas, insurance, repairs, depreciation) × business-use percentage",
            "parking_tolls": "Always deductible on top of mileage rate",
            "commuting": "NOT deductible — travel between home and regular workplace",
            "note": "Must choose mileage OR actual expenses in the first year; mileage rate includes depreciation",
        },
        "bank_fees": {
            "deductible": True,
            "includes": [
                "Business checking/savings account fees",
                "Merchant processing fees (credit card processing)",
                "Wire transfer fees for business transactions",
                "Business loan interest",
                "Business credit card annual fees and interest",
                "PayPal/Stripe/Square processing fees",
                "Currency conversion fees for business",
                "Check printing costs for business accounts",
                "Safe deposit box rental (if used for business documents)",
            ],
            "not_deductible": [
                "Personal banking fees",
                "Personal credit card fees",
                "Interest on personal debt",
                "Overdraft fees on personal accounts",
                "ATM fees for personal withdrawals",
            ],
            "schedule_c": "Reported on Schedule C, Line 27a (Other expenses) or Line 16b (Interest on business debt)",
            "note": "Must maintain separate business and personal accounts for clean deduction tracking",
        },
        "meals": {
            "deductible_percentage": 0.50,
            "qualification": "Business meal with client/associate where business is discussed",
            "records": "Keep receipt + note: who, where, business purpose, amount",
            "employee_meals": "50% deductible for meals during business travel",
            "note": "The 100% deduction for restaurant meals (2021-2022 COVID provision) has EXPIRED",
        },
        "health_insurance": {
            "self_employed": "100% deductible above the line (Form 1040, line adjustment)",
            "qualification": "Must be self-employed with net profit, and not eligible for employer-sponsored plan",
        },
        "retirement": {
            "401k_limit_2025": 23500,
            "401k_catch_up_50_plus": 7500,
            "sep_ira": "Up to 25% of net self-employment income, max $70,000",
            "solo_401k": "Employee contribution ($23,500) + employer contribution (25% of compensation)",
            "traditional_ira": 7000,
            "ira_catch_up_50_plus": 1000,
        },
        "section_179": {
            "limit_2025": 1250000,
            "phase_out_threshold": 3130000,
            "note": "Immediate expensing of qualifying business equipment (computers, furniture, vehicles, machinery)",
        },
        "bonus_depreciation": {
            "rate_2025": 0.60,
            "note": "60% first-year bonus depreciation on qualifying new and used property. Phasing down 20% per year.",
        },
        "qbi_deduction": {
            "rate": 0.20,
            "qualification": "Qualified Business Income deduction for pass-through entities (sole prop, S-corp, partnership)",
            "income_limit_single": 191950,
            "income_limit_joint": 383900,
            "note": "Above income limits, deduction may be limited for specified service businesses (law, accounting, health, consulting)",
        },
    },

    "estimated_taxes": {
        "due_dates": ["April 15", "June 15", "September 15", "January 15 (following year)"],
        "safe_harbor": "Pay at least 100% of prior year tax (110% if AGI > $150K) to avoid penalty",
        "penalty": "Underpayment penalty if you owe $1,000+ and haven't paid enough through the year",
    },

    "important_dates": [
        {"date": "Jan 15", "event": "Q4 estimated tax payment due"},
        {"date": "Jan 31", "event": "W-2s and 1099s due to recipients"},
        {"date": "Mar 15", "event": "S-Corp and Partnership returns due (Form 1120-S, 1065)"},
        {"date": "Apr 15", "event": "Individual + C-Corp returns due; Q1 estimated tax due"},
        {"date": "Jun 15", "event": "Q2 estimated tax payment due"},
        {"date": "Sep 15", "event": "Q3 estimated tax payment due; Extended S-Corp/Partnership due"},
        {"date": "Oct 15", "event": "Extended individual return due"},
    ],
}


# ═══════════════════════════════════════════════════════════════
# AGGREGATED KNOWLEDGE BASE
# ═══════════════════════════════════════════════════════════════

TAX_KNOWLEDGE = {
    "AU": AU_TAX,
    "NZ": NZ_TAX,
    "GB": GB_TAX,
    "US": US_TAX,
}

# Common questions and their answer paths
FAQ_TOPICS = {
    "claimable_expenses": {
        "keywords": ["claim", "deduct", "deduction", "write off", "expense", "claimable"],
        "path": "claimable_expenses",
    },
    "bank_fees": {
        "keywords": ["bank fee", "bank charge", "account fee", "merchant fee", "processing fee", "banking"],
        "path": "claimable_expenses.bank_fees",
    },
    "vehicle": {
        "keywords": ["car", "vehicle", "mileage", "km", "drive", "fuel", "petrol", "gas"],
        "path": "claimable_expenses.vehicle",
    },
    "home_office": {
        "keywords": ["home office", "work from home", "wfh", "remote work"],
        "path": "claimable_expenses.home_office",
    },
    "gst_vat": {
        "keywords": ["gst", "vat", "sales tax", "value added", "goods and services"],
        "path": "gst",
    },
    "tax_rates": {
        "keywords": ["tax rate", "income tax", "bracket", "marginal rate", "how much tax"],
        "path": "income_tax_rates",
    },
    "dates": {
        "keywords": ["due date", "deadline", "when is", "when do i", "lodge", "file by"],
        "path": "important_dates",
    },
    "superannuation": {
        "keywords": ["super", "superannuation", "kiwisaver", "pension", "401k", "retirement"],
        "path": "superannuation",
    },
}

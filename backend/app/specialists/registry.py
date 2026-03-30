"""Accounting Specialist Registry.

Maps every type of chartered accountant specialization to the
tools AlecRae provides for them. This is the master index.

The key insight: every accountant specialization has 2-3 tasks
that eat 60-80% of their time. Automate those, and AlecRae becomes
indispensable to every type of accountant.
"""

from dataclasses import dataclass, field


@dataclass
class AccountingSpecialization:
    """Definition of an accounting specialization and what AlecRae does for it."""
    id: str
    title: str
    description: str
    certifications: list[str]  # CPA, CA, CMA, etc.
    pain_points: list[str]     # what eats their time
    alecrae_tools: list[str]     # which AlecRae tools solve their problems
    heavy_lifting: list[str]   # specific automations we provide
    jurisdictions: list[str]   # where this specialization is relevant
    status: str = "active"     # active, beta, planned


class SpecialistRegistry:
    """Registry of all accounting specializations and their AlecRae toolkits.

    This is how we serve every type of accountant:
    - Tax accountant? Tax engine + treaty calculator + auto-filing drafts
    - Forensic accountant? Benford's + anomaly + vendor verification
    - Insolvency practitioner? Solvency tests + creditor waterfall + voidable transaction scanner
    - Management accountant? Variance analysis + break-even + cost allocation

    Each specialization gets a purpose-built toolkit.
    """

    def __init__(self):
        self._specs: dict[str, AccountingSpecialization] = {}
        self._load_all()

    def _load_all(self):
        specs = [

            # ── 1. TAX ACCOUNTANT ────────────────────────────────
            AccountingSpecialization(
                id="tax",
                title="Tax Accountant",
                description="Prepares and reviews tax returns, advises on tax planning and compliance",
                certifications=["CPA", "CA", "EA (Enrolled Agent)", "CTA (Chartered Tax Adviser)"],
                pain_points=[
                    "Manually calculating tax across multiple jurisdictions",
                    "Tracking treaty obligations for cross-border clients",
                    "Keeping up with constant legislative changes",
                    "BAS/GST/VAT return preparation is repetitive",
                    "Year-end tax provision calculations",
                ],
                alecrae_tools=["tax_engine", "treaty_engine", "tax_calculator"],
                heavy_lifting=[
                    "Auto-calculate income tax brackets for AU/NZ/US/GB with current legislation",
                    "Apply bilateral tax treaties automatically on cross-border payments",
                    "Draft BAS (AU), GST returns (NZ), 1099s (US) from ledger data",
                    "Flag transactions with missing tax codes or incorrect GST treatment",
                    "Track tax loss carry-forwards and offset eligibility",
                    "Calculate FBT (Fringe Benefits Tax) on employee benefits (AU)",
                    "Provisional tax calculations and due date tracking (NZ)",
                ],
                jurisdictions=["US", "AU", "NZ", "GB"],
            ),

            # ── 2. AUDIT & ASSURANCE ─────────────────────────────
            AccountingSpecialization(
                id="audit",
                title="Audit & Assurance Accountant",
                description="Conducts external or internal audits, provides assurance on financial statements",
                certifications=["CPA", "CA", "CIA (Certified Internal Auditor)", "CISA"],
                pain_points=[
                    "Sampling transactions for testing takes days",
                    "Tracing transactions through the ledger manually",
                    "Recalculating depreciation and amortization schedules",
                    "Verifying account reconciliations",
                    "Testing journal entries for management override",
                    "Confirming receivables/payables balances",
                ],
                alecrae_tools=["audit_engine", "reconciliation_engine", "sampling_engine"],
                heavy_lifting=[
                    "Statistical sampling — auto-select sample based on risk and materiality",
                    "Journal entry testing — flag entries with fraud indicators (weekend, round numbers, just-under-approval)",
                    "Three-way matching verification (PO + invoice + receipt)",
                    "Depreciation recalculation across all asset classes",
                    "Aged receivables/payables analysis with trend comparison",
                    "Completeness testing — match bank deposits to revenue records",
                    "Cut-off testing — flag transactions near period-end for correct allocation",
                    "Related party transaction identification across all entities",
                ],
                jurisdictions=["US", "AU", "NZ", "GB"],
            ),

            # ── 3. MANAGEMENT / COST ACCOUNTANT ──────────────────
            AccountingSpecialization(
                id="management",
                title="Management / Cost Accountant",
                description="Internal reporting, budgeting, variance analysis, cost allocation for decision-making",
                certifications=["CMA (Certified Management Accountant)", "CGMA", "CPA"],
                pain_points=[
                    "Building budgets vs actuals reports every month",
                    "Allocating overhead costs across departments/products",
                    "Break-even analysis when costs change",
                    "Cash flow forecasting is always wrong",
                    "KPI dashboards are manually updated",
                ],
                alecrae_tools=["variance_engine", "cost_allocation_engine", "forecasting_engine"],
                heavy_lifting=[
                    "Auto-generate budget vs actual with variance analysis (price/volume/mix)",
                    "Cost allocation engine — allocate overhead by headcount, revenue, square footage, or custom drivers",
                    "Break-even analysis — calculate break-even point by product/service line",
                    "Rolling 13-week cash flow forecast from bank feed trends",
                    "Contribution margin analysis by product/service/customer",
                    "Standard costing — calculate and track cost variances (material, labor, overhead)",
                    "Working capital cycle calculation (DSO, DPO, DIO)",
                ],
                jurisdictions=["US", "AU", "NZ", "GB"],
            ),

            # ── 4. FORENSIC ACCOUNTANT ───────────────────────────
            AccountingSpecialization(
                id="forensic",
                title="Forensic Accountant",
                description="Investigates fraud, supports litigation, conducts M&A due diligence",
                certifications=["CFF (Certified in Financial Forensics)", "CFE (Certified Fraud Examiner)", "CA"],
                pain_points=[
                    "Weeks of manual data analysis for a single investigation",
                    "Benford's Law analysis done in Excel is error-prone",
                    "Tracing money through complex entity structures",
                    "Producing court-admissible reports under time pressure",
                    "Cross-referencing vendor/employee data manually",
                ],
                alecrae_tools=["benfords_engine", "anomaly_engine", "vendor_verifier", "money_trail", "due_diligence_agent"],
                heavy_lifting=[
                    "Benford's Law analysis with MAD conformity and chi-squared testing",
                    "Statistical anomaly detection (Z-score, IQR, timing patterns)",
                    "Ghost vendor and ghost employee detection via cross-referencing",
                    "Payment splitting / structuring detection",
                    "Circular transaction (round-tripping) identification",
                    "Money trail visualization — full funds flow map",
                    "90-minute M&A due diligence audit replacing weeks of manual work",
                    "AI-generated investigation reports with evidence chain",
                ],
                jurisdictions=["US", "AU", "NZ", "GB"],
            ),

            # ── 5. INSOLVENCY & RESTRUCTURING ────────────────────
            AccountingSpecialization(
                id="insolvency",
                title="Insolvency & Restructuring Accountant",
                description="Manages voluntary administration, liquidation, receivership, and debt restructuring",
                certifications=["RITPA (Registered Insolvency/Trustee Practitioner)", "CIRP", "CPA"],
                pain_points=[
                    "Solvency testing requires complex balance sheet analysis",
                    "Creditor waterfall calculations are error-prone",
                    "Identifying voidable transactions (preferences, uncommercial) is manual",
                    "RATA (Report as to Affairs) preparation takes days",
                    "Dividend calculations to creditors across classes",
                ],
                alecrae_tools=["solvency_engine", "creditor_engine", "voidable_scanner"],
                heavy_lifting=[
                    "Automated solvency tests — balance sheet test and cash flow test",
                    "Creditor waterfall — priority ranking (secured, employee, unsecured, related party)",
                    "Voidable transaction scanner — flag unfair preferences (6mo/2yr lookback)",
                    "Uncommercial transaction identification (undervalue transfers)",
                    "RATA/ROCAP draft generation from ledger data",
                    "Dividend calculation across creditor classes",
                    "Insolvent trading exposure calculation (director liability)",
                    "Related party transaction timeline for relation-back period",
                ],
                jurisdictions=["AU", "NZ", "GB", "US"],
            ),

            # ── 6. ESTATE & TRUST ACCOUNTANT ─────────────────────
            AccountingSpecialization(
                id="trust_estate",
                title="Estate & Trust Accountant",
                description="Manages trust accounting, estate administration, and beneficiary distributions",
                certifications=["TEP (Trust & Estate Practitioner)", "CPA", "CA"],
                pain_points=[
                    "Trust distribution calculations with streaming rules",
                    "Tracking income vs capital for trust accounting",
                    "Estate asset valuations and CGT calculations on death",
                    "Beneficiary reporting across multiple trusts",
                    "Trust deed compliance checking",
                ],
                alecrae_tools=["trust_engine", "distribution_engine", "estate_engine"],
                heavy_lifting=[
                    "Trust distribution calculator — proportional and streaming allocations",
                    "Income vs capital classification for trust accounting",
                    "Section 99/99A (AU) risk analysis on trust distributions",
                    "Beneficiary statement generation with tax component breakdowns",
                    "Estate CGT calculations (death-related transfer rules)",
                    "Trust income tax return data preparation (AU: trust tax return)",
                    "Testamentary trust vs inter-vivos trust tax comparison",
                    "Family trust election and interposed entity election tracking",
                ],
                jurisdictions=["AU", "NZ", "GB", "US"],
            ),

            # ── 7. NFP / CHARITY ACCOUNTANT ──────────────────────
            AccountingSpecialization(
                id="nfp",
                title="Not-for-Profit / Charity Accountant",
                description="Accounting for charities, associations, and not-for-profit entities",
                certifications=["CPA", "CA", "Charity Specialist"],
                pain_points=[
                    "Grant acquittal reporting to different funders with different formats",
                    "Tracking restricted vs unrestricted funds",
                    "DGR (Deductible Gift Recipient) compliance (AU)",
                    "ACNC annual information statement preparation (AU)",
                    "Volunteer hour and in-kind donation valuation",
                ],
                alecrae_tools=["grant_engine", "fund_tracker", "nfp_compliance_engine"],
                heavy_lifting=[
                    "Grant acquittal report generator — auto-match expenses to grant milestones",
                    "Restricted/unrestricted fund tracking with automatic segregation",
                    "DGR compliance checker — verify deductible gift receipts meet requirements",
                    "ACNC annual statement data preparation",
                    "In-kind donation valuation (fair market value estimation)",
                    "Fundraising efficiency ratio calculation",
                    "Program expense ratio analysis for governance",
                    "Charity Commission (UK) annual return preparation",
                ],
                jurisdictions=["AU", "NZ", "GB", "US"],
            ),

            # ── 8. SUPERANNUATION / RETIREMENT FUND ACCOUNTANT ───
            AccountingSpecialization(
                id="superannuation",
                title="Superannuation / Retirement Fund Accountant",
                description="SMSF audits (AU), KiwiSaver (NZ), pension fund accounting (UK/US)",
                certifications=["SMSF Specialist Adviser", "CPA", "CA"],
                pain_points=[
                    "SMSF compliance — investment strategy, sole purpose test",
                    "Member balance tracking across contribution types",
                    "Pension calculations and minimum drawdown requirements",
                    "Related party transaction testing for SMSFs",
                    "Annual return preparation (SAR) is heavily manual",
                ],
                alecrae_tools=["smsf_engine", "pension_engine", "contribution_tracker"],
                heavy_lifting=[
                    "SMSF compliance checklist — sole purpose test, investment strategy review",
                    "Contribution cap tracking (concessional and non-concessional) per member",
                    "Minimum pension drawdown calculation by age bracket",
                    "Related party investment proportion check (in-house asset rules)",
                    "SMSF Annual Return (SAR) data preparation",
                    "Segregated vs proportionate method tax calculation for SMSFs",
                    "KiwiSaver employer contribution compliance (NZ)",
                    "Pension auto-enrollment compliance (UK)",
                ],
                jurisdictions=["AU", "NZ", "GB", "US"],
            ),

            # ── 9. PAYROLL SPECIALIST ────────────────────────────
            AccountingSpecialization(
                id="payroll",
                title="Payroll Specialist",
                description="Payroll processing, STP reporting, employment tax compliance",
                certifications=["CPP (Certified Payroll Professional)", "CPA"],
                pain_points=[
                    "Multi-state/jurisdiction withholding calculations",
                    "Award interpretation and penalty rate calculations (AU)",
                    "Leave accrual tracking across different leave types",
                    "STP (Single Touch Payroll) reporting errors",
                    "Termination pay calculations (notice, redundancy, unused leave)",
                ],
                alecrae_tools=["payroll_engine", "leave_engine", "termination_engine"],
                heavy_lifting=[
                    "Multi-jurisdiction PAYG/PAYE withholding calculations",
                    "Award rate interpreter — calculate base + penalties + loadings (AU)",
                    "Leave accrual calculator (annual, personal, long service, parental)",
                    "Termination pay calculator (notice period, redundancy, leave payout)",
                    "STP Phase 2 data preparation and validation (AU)",
                    "Payday filing preparation (NZ)",
                    "RTI (Real Time Information) submission preparation (UK)",
                    "Multi-state W-2 preparation (US)",
                    "Superannuation guarantee calculation and SG charge exposure",
                    "Workers compensation premium estimation by industry code",
                ],
                jurisdictions=["AU", "NZ", "GB", "US"],
            ),

            # ── 10. GOVERNMENT / PUBLIC SECTOR ACCOUNTANT ────────
            AccountingSpecialization(
                id="government",
                title="Government / Public Sector Accountant",
                description="Public sector financial reporting, fund accounting, budget compliance",
                certifications=["CGFM (Certified Government Financial Manager)", "CPA", "CA"],
                pain_points=[
                    "AASB 1058/1059 revenue recognition for grants (AU)",
                    "Budget compliance reporting with multi-year appropriations",
                    "Fund-based accounting (general, special revenue, capital)",
                    "GASB compliance (US state/local government)",
                    "Performance reporting and KPI tracking",
                ],
                alecrae_tools=["fund_accounting_engine", "budget_engine", "grant_compliance_engine"],
                heavy_lifting=[
                    "Fund-based accounting — automatic fund segregation and inter-fund transfers",
                    "Budget vs actual with encumbrance tracking",
                    "Grant compliance — match expenditure to approved budget lines",
                    "AASB 1058 revenue recognition analysis for income from government grants",
                    "GASB 87 lease accounting compliance (US)",
                    "Whole-of-government consolidation eliminations",
                    "Performance indicator calculation and trend analysis",
                    "Audit committee report generation",
                ],
                jurisdictions=["AU", "NZ", "GB", "US"],
            ),

            # ── 11. ENVIRONMENTAL / ESG ACCOUNTANT ───────────────
            AccountingSpecialization(
                id="esg",
                title="Environmental / ESG Accountant",
                description="Sustainability reporting, carbon accounting, ESG compliance",
                certifications=["CPA", "CA", "Sustainability Reporting Specialist"],
                pain_points=[
                    "Carbon emissions calculation across Scope 1, 2, 3",
                    "ISSB/TCFD/GRI reporting framework compliance",
                    "Mapping financial transactions to emission factors",
                    "ESG metric calculation from accounting data",
                    "Climate risk financial impact assessment",
                ],
                alecrae_tools=["carbon_engine", "esg_engine", "climate_risk_engine"],
                heavy_lifting=[
                    "Scope 1/2/3 carbon emissions calculation from transaction data",
                    "Map expense categories to emission factors (GHG Protocol)",
                    "ISSB S1/S2 disclosure data preparation",
                    "TCFD-aligned climate risk assessment from financial data",
                    "Carbon offset tracking and net-zero progress reporting",
                    "ESG ratio calculations (carbon intensity, energy efficiency, waste diversion)",
                    "Modern slavery risk assessment on supply chain payments",
                    "NGER (National Greenhouse and Energy Reporting) data preparation (AU)",
                ],
                jurisdictions=["AU", "NZ", "GB", "US"],
            ),

            # ── 12. BUSINESS ADVISORY / VIRTUAL CFO ──────────────
            AccountingSpecialization(
                id="advisory",
                title="Business Advisory / Virtual CFO",
                description="Strategic financial advice, business planning, KPI monitoring, cash flow management",
                certifications=["CPA", "CA", "CFA", "MBA"],
                pain_points=[
                    "Building financial models for each client from scratch",
                    "Monthly board reporting packs take hours to compile",
                    "Cash flow forecasting is always inaccurate",
                    "Benchmarking clients against industry standards",
                    "Scenario modelling (what-if analysis) is manual",
                ],
                alecrae_tools=["forecasting_engine", "benchmark_engine", "scenario_engine"],
                heavy_lifting=[
                    "Auto-generate monthly board reporting pack from ledger data",
                    "Rolling cash flow forecast (13-week and 12-month)",
                    "Scenario modelling — what-if analysis on revenue/cost changes",
                    "Industry benchmarking — compare margins, ratios against sector averages",
                    "Break-even and sensitivity analysis",
                    "Customer profitability analysis from transaction data",
                    "Working capital optimization recommendations",
                    "Debt serviceability analysis (DSCR, ICR)",
                    "Business valuation estimate (multiple methods: DCF, comparable, asset-based)",
                ],
                jurisdictions=["US", "AU", "NZ", "GB"],
            ),
        ]

        for spec in specs:
            self._specs[spec.id] = spec

    def get(self, spec_id: str) -> AccountingSpecialization | None:
        return self._specs.get(spec_id)

    def list_all(self) -> list[AccountingSpecialization]:
        return list(self._specs.values())

    def search(self, query: str) -> list[AccountingSpecialization]:
        """Search specializations by keyword."""
        q = query.lower()
        results = []
        for spec in self._specs.values():
            searchable = f"{spec.title} {spec.description} {' '.join(spec.pain_points)} {' '.join(spec.heavy_lifting)}".lower()
            if q in searchable:
                results.append(spec)
        return results

    def get_by_certification(self, cert: str) -> list[AccountingSpecialization]:
        """Find specializations by certification type."""
        return [s for s in self._specs.values() if cert.upper() in [c.upper() for c in s.certifications]]

    def get_total_automations(self) -> int:
        """Count total heavy-lifting automations across all specializations."""
        return sum(len(s.heavy_lifting) for s in self._specs.values())

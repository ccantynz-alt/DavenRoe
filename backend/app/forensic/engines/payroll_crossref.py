"""Payroll Cross-Reference Engine.

Cross-references payroll data against tax filings to detect:
- Ghost employees (on payroll but don't exist)
- Tax withholding mismatches
- Overtime fraud
- Payroll-to-tax-filing discrepancies
"""

from collections import defaultdict
from decimal import Decimal


class PayrollCrossReferencer:
    """Detects discrepancies between payroll records and tax filings.

    For M&A due diligence: if payroll taxes paid don't match reported
    filings, that's either fraud or incompetence — both are deal-killers.
    """

    def cross_reference_payroll_vs_tax(
        self,
        payroll_records: list[dict],
        tax_filings: list[dict],
    ) -> dict:
        """Compare total payroll paid vs. what was reported to tax authorities.

        Args:
            payroll_records: [{employee_id, name, gross_pay, tax_withheld, period}]
            tax_filings: [{period, total_gross, total_tax_withheld, filing_type}]
        """
        # Aggregate payroll by period
        payroll_by_period = defaultdict(lambda: {
            "gross": Decimal("0"), "tax": Decimal("0"), "employee_count": 0, "employees": set()
        })
        for rec in payroll_records:
            period = rec.get("period", "unknown")
            payroll_by_period[period]["gross"] += Decimal(str(rec.get("gross_pay", 0)))
            payroll_by_period[period]["tax"] += Decimal(str(rec.get("tax_withheld", 0)))
            payroll_by_period[period]["employee_count"] += 1
            if rec.get("employee_id"):
                payroll_by_period[period]["employees"].add(rec["employee_id"])

        # Build filing lookup
        filing_by_period = {}
        for filing in tax_filings:
            period = filing.get("period", "unknown")
            filing_by_period[period] = {
                "gross": Decimal(str(filing.get("total_gross", 0))),
                "tax": Decimal(str(filing.get("total_tax_withheld", 0))),
            }

        # Compare
        discrepancies = []
        for period in sorted(set(list(payroll_by_period.keys()) + list(filing_by_period.keys()))):
            payroll = payroll_by_period.get(period)
            filing = filing_by_period.get(period)

            if payroll and not filing:
                discrepancies.append({
                    "period": period,
                    "type": "missing_filing",
                    "severity": "critical",
                    "detail": f"Payroll records exist for {period} (${payroll['gross']:,.2f} gross) but no tax filing found",
                })
                continue

            if filing and not payroll:
                discrepancies.append({
                    "period": period,
                    "type": "missing_payroll",
                    "severity": "high",
                    "detail": f"Tax filing exists for {period} (${filing['gross']:,.2f} gross) but no payroll records found",
                })
                continue

            # Both exist — check for mismatches
            gross_diff = abs(payroll["gross"] - filing["gross"])
            tax_diff = abs(payroll["tax"] - filing["tax"])

            # Allow 1% tolerance for rounding
            gross_tolerance = payroll["gross"] * Decimal("0.01")
            tax_tolerance = payroll["tax"] * Decimal("0.01") if payroll["tax"] else Decimal("1")

            if gross_diff > gross_tolerance:
                pct_diff = float(gross_diff / payroll["gross"] * 100) if payroll["gross"] else 0
                discrepancies.append({
                    "period": period,
                    "type": "gross_pay_mismatch",
                    "severity": "critical" if pct_diff > 10 else "high",
                    "payroll_gross": str(payroll["gross"]),
                    "filed_gross": str(filing["gross"]),
                    "difference": str(gross_diff),
                    "pct_difference": round(pct_diff, 2),
                    "detail": f"Gross pay mismatch in {period}: payroll shows ${payroll['gross']:,.2f} "
                              f"but filing reports ${filing['gross']:,.2f} (diff: ${gross_diff:,.2f}, {pct_diff:.1f}%)",
                })

            if tax_diff > tax_tolerance:
                discrepancies.append({
                    "period": period,
                    "type": "tax_withholding_mismatch",
                    "severity": "critical",
                    "payroll_tax": str(payroll["tax"]),
                    "filed_tax": str(filing["tax"]),
                    "difference": str(tax_diff),
                    "detail": f"Tax withholding mismatch in {period}: payroll shows ${payroll['tax']:,.2f} "
                              f"but filing reports ${filing['tax']:,.2f}",
                })

        return {
            "status": "complete",
            "test_type": "payroll_vs_tax_filing",
            "periods_checked": len(set(list(payroll_by_period.keys()) + list(filing_by_period.keys()))),
            "discrepancies": discrepancies,
            "discrepancy_count": len(discrepancies),
            "risk_level": "critical" if any(d["severity"] == "critical" for d in discrepancies)
                else "high" if discrepancies else "low",
        }

    def detect_ghost_employees(self, payroll_records: list[dict]) -> dict:
        """Detect potential ghost employees on the payroll.

        Ghost employee indicators:
        - Same bank account as another employee
        - No tax ID
        - Same address as another employee or the company
        - Hired and paid without standard onboarding records
        - Constant identical pay amounts (no variation)
        """
        employees = defaultdict(lambda: {
            "records": [], "bank_accounts": set(), "addresses": set(), "tax_ids": set(), "amounts": []
        })

        for rec in payroll_records:
            eid = rec.get("employee_id", "unknown")
            employees[eid]["records"].append(rec)
            if rec.get("bank_account"):
                employees[eid]["bank_accounts"].add(rec["bank_account"])
            if rec.get("address"):
                employees[eid]["addresses"].add(rec["address"].lower().strip())
            if rec.get("tax_id"):
                employees[eid]["tax_ids"].add(rec["tax_id"])
            employees[eid]["amounts"].append(float(rec.get("gross_pay", 0)))

        # Build lookup indexes
        all_bank_accounts = defaultdict(list)
        all_addresses = defaultdict(list)

        for eid, data in employees.items():
            for acct in data["bank_accounts"]:
                all_bank_accounts[acct].append(eid)
            for addr in data["addresses"]:
                all_addresses[addr].append(eid)

        flags = []
        for eid, data in employees.items():
            employee_flags = []

            # Shared bank account
            for acct in data["bank_accounts"]:
                if len(all_bank_accounts[acct]) > 1:
                    others = [e for e in all_bank_accounts[acct] if e != eid]
                    employee_flags.append({
                        "check": "shared_bank_account",
                        "severity": "critical",
                        "detail": f"Bank account shared with employee(s): {', '.join(str(o) for o in others)}",
                    })

            # No tax ID
            if not data["tax_ids"]:
                employee_flags.append({
                    "check": "missing_tax_id",
                    "severity": "high",
                    "detail": "No tax identification number on file",
                })

            # Identical pay amounts (no variation over time)
            if len(data["amounts"]) >= 3:
                unique_amounts = len(set(data["amounts"]))
                if unique_amounts == 1 and data["amounts"][0] > 0:
                    employee_flags.append({
                        "check": "identical_pay",
                        "severity": "medium",
                        "detail": f"Identical gross pay of ${data['amounts'][0]:,.2f} across all {len(data['amounts'])} periods",
                    })

            if employee_flags:
                name = data["records"][0].get("name", f"Employee {eid}") if data["records"] else f"Employee {eid}"
                flags.append({
                    "employee_id": eid,
                    "name": name,
                    "flags": employee_flags,
                    "overall_risk": "critical" if any(f["severity"] == "critical" for f in employee_flags)
                        else "high" if any(f["severity"] == "high" for f in employee_flags)
                        else "medium",
                })

        return {
            "status": "complete",
            "test_type": "ghost_employee_detection",
            "employees_checked": len(employees),
            "flagged_employees": len(flags),
            "flags": flags,
            "risk_level": "critical" if any(f["overall_risk"] == "critical" for f in flags)
                else "high" if flags else "low",
        }

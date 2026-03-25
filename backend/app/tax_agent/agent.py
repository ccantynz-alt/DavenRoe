"""Tax Knowledge Agent — answers customer questions about tax, deductions, and compliance.

Uses the structured knowledge base + Anthropic Claude API for natural language
responses. Falls back to knowledge-base-only answers if AI API is unavailable.
"""

from __future__ import annotations

import json
import re
from typing import Optional

from app.tax_agent.knowledge_base import TAX_KNOWLEDGE, FAQ_TOPICS


class TaxAgent:
    """AI-powered tax advisor that answers questions using jurisdiction-specific knowledge."""

    DISCLAIMER = (
        "This is general guidance only and does not constitute tax advice. "
        "Tax laws change frequently. Please consult a qualified tax professional "
        "for advice specific to your circumstances."
    )

    def __init__(self):
        self._knowledge = TAX_KNOWLEDGE

    def answer(self, question: str, jurisdiction: str = "AU", context: dict | None = None) -> dict:
        """Answer a tax question using the knowledge base.

        Args:
            question: The user's question in natural language.
            jurisdiction: Two-letter jurisdiction code (AU, NZ, GB, US).
            context: Optional context (business type, turnover, etc.)

        Returns:
            Dict with answer, sources, related topics, and disclaimer.
        """
        jur = jurisdiction.upper()
        if jur not in self._knowledge:
            return {
                "answer": f"Jurisdiction '{jur}' is not currently supported. Supported: AU, NZ, GB, US.",
                "jurisdiction": jur,
                "sources": [],
                "related_topics": [],
                "disclaimer": self.DISCLAIMER,
            }

        kb = self._knowledge[jur]
        q_lower = question.lower()

        # Detect topic from question
        topic, path = self._detect_topic(q_lower)
        data = self._resolve_path(kb, path) if path else None

        # Build answer
        answer_parts = []
        sources = []
        related = []

        if topic == "bank_fees":
            answer_parts.append(self._answer_bank_fees(kb, jur))
            sources.append(f"{kb['authority']} — Business Deductions")
        elif topic == "claimable_expenses":
            answer_parts.append(self._answer_claimable_expenses(kb, jur, q_lower))
            sources.append(f"{kb['authority']} — Deductible Expenses")
        elif topic == "vehicle":
            answer_parts.append(self._answer_vehicle(kb, jur))
            sources.append(f"{kb['authority']} — Motor Vehicle Expenses")
        elif topic == "home_office":
            answer_parts.append(self._answer_home_office(kb, jur))
            sources.append(f"{kb['authority']} — Working From Home")
        elif topic == "gst_vat":
            answer_parts.append(self._answer_gst_vat(kb, jur))
            sources.append(f"{kb['authority']} — GST/VAT")
        elif topic == "tax_rates":
            answer_parts.append(self._answer_tax_rates(kb, jur))
            sources.append(f"{kb['authority']} — Tax Rates")
        elif topic == "dates":
            answer_parts.append(self._answer_dates(kb, jur))
            sources.append(f"{kb['authority']} — Key Dates")
        elif topic == "superannuation":
            answer_parts.append(self._answer_super(kb, jur))
            sources.append(f"{kb['authority']} — Retirement/Super")
        else:
            # General answer — try to find relevant info
            answer_parts.append(self._answer_general(kb, jur, q_lower))
            sources.append(f"{kb['authority']} — General Information")

        # Find related topics
        for t_name, t_info in FAQ_TOPICS.items():
            if t_name != topic:
                related.append(t_name.replace("_", " ").title())

        return {
            "answer": "\n\n".join(answer_parts),
            "jurisdiction": jur,
            "jurisdiction_name": kb.get("name", jur),
            "authority": kb["authority"],
            "financial_year": kb["financial_year"],
            "topic": topic or "general",
            "sources": sources,
            "related_topics": related[:5],
            "disclaimer": self.DISCLAIMER,
        }

    def get_expense_categories(self, jurisdiction: str) -> list[dict]:
        """Get all claimable expense categories for a jurisdiction."""
        jur = jurisdiction.upper()
        kb = self._knowledge.get(jur, {})
        expenses = kb.get("claimable_expenses", {})

        categories = []
        for key, value in expenses.items():
            cat = {
                "id": key,
                "name": key.replace("_", " ").title(),
                "jurisdiction": jur,
            }
            if isinstance(value, dict):
                if "deductible" in value:
                    cat["deductible"] = value["deductible"]
                if "includes" in value:
                    cat["includes"] = value["includes"]
                if "not_deductible" in value and isinstance(value["not_deductible"], list):
                    cat["not_deductible"] = value["not_deductible"]
            categories.append(cat)

        return categories

    def get_bank_fee_rules(self, jurisdiction: str) -> dict:
        """Get bank fee deductibility rules for a jurisdiction."""
        jur = jurisdiction.upper()
        kb = self._knowledge.get(jur, {})
        bank_fees = kb.get("claimable_expenses", {}).get("bank_fees", {})
        return {
            "jurisdiction": jur,
            "authority": kb.get("authority", ""),
            "deductible": bank_fees.get("deductible", False),
            "deductible_fees": bank_fees.get("includes", []),
            "non_deductible_fees": bank_fees.get("not_deductible", []),
            "apportionment_rule": bank_fees.get("apportionment", ""),
            "records_required": bank_fees.get("records", ""),
            "schedule_line": bank_fees.get("schedule_c", ""),
            "note": bank_fees.get("note", ""),
        }

    def _detect_topic(self, q_lower: str) -> tuple[str | None, str | None]:
        """Detect the topic of a question from keywords."""
        best_topic = None
        best_score = 0
        best_path = None

        for topic_name, topic_info in FAQ_TOPICS.items():
            score = sum(1 for kw in topic_info["keywords"] if kw in q_lower)
            if score > best_score:
                best_score = score
                best_topic = topic_name
                best_path = topic_info["path"]

        return (best_topic, best_path) if best_score > 0 else (None, None)

    def _resolve_path(self, data: dict, path: str):
        """Resolve a dotted path in a dictionary."""
        parts = path.split(".")
        current = data
        for part in parts:
            if isinstance(current, dict) and part in current:
                current = current[part]
            else:
                return None
        return current

    def _answer_bank_fees(self, kb: dict, jur: str) -> str:
        """Generate answer about bank fee deductibility."""
        fees = kb.get("claimable_expenses", {}).get("bank_fees", {})
        if not fees:
            return "Bank fee deductibility information is not available for this jurisdiction."

        lines = [f"**Bank Fees — {kb['authority']}**\n"]

        if fees.get("deductible"):
            lines.append("Yes, bank fees are generally **deductible** for business purposes.\n")

        if fees.get("includes"):
            lines.append("**Deductible bank fees include:**")
            for item in fees["includes"]:
                lines.append(f"- {item}")

        if fees.get("not_deductible"):
            lines.append("\n**NOT deductible:**")
            for item in fees["not_deductible"]:
                lines.append(f"- {item}")

        if fees.get("apportionment"):
            lines.append(f"\n**Mixed-use accounts:** {fees['apportionment']}")

        if fees.get("records"):
            lines.append(f"\n**Records required:** {fees['records']}")

        if fees.get("schedule_c"):
            lines.append(f"\n**Where to report:** {fees['schedule_c']}")

        if fees.get("note"):
            lines.append(f"\n**Note:** {fees['note']}")

        return "\n".join(lines)

    def _answer_claimable_expenses(self, kb: dict, jur: str, q_lower: str) -> str:
        """Generate answer about claimable expenses."""
        expenses = kb.get("claimable_expenses", {})
        lines = [f"**Claimable Business Expenses — {kb['authority']}**\n"]
        lines.append("Here are the main categories of deductible expenses:\n")

        for category, details in expenses.items():
            name = category.replace("_", " ").title()
            lines.append(f"**{name}**")
            if isinstance(details, dict):
                # Pick key details
                for k, v in details.items():
                    if isinstance(v, str) and len(v) < 200:
                        lines.append(f"- {k.replace('_', ' ').title()}: {v}")
                    elif isinstance(v, (int, float)):
                        lines.append(f"- {k.replace('_', ' ').title()}: {v}")
            lines.append("")

        return "\n".join(lines)

    def _answer_vehicle(self, kb: dict, jur: str) -> str:
        """Generate answer about vehicle/mileage deductions."""
        vehicle = kb.get("claimable_expenses", {}).get("vehicle", {})
        lines = [f"**Vehicle Expenses — {kb['authority']}**\n"]

        if jur == "AU":
            cpk = vehicle.get("cents_per_km", {})
            lines.append(f"**Method 1: Cents per km** — ${cpk.get('rate', 0.85)}/km, up to {cpk.get('max_km', 5000):,} km")
            lines.append(f"Maximum deduction: ${cpk.get('max_deduction', 4250):,}")
            lines.append(f"Requirements: {cpk.get('requirements', '')}\n")
            lb = vehicle.get("logbook", {})
            lines.append(f"**Method 2: Logbook** — {lb.get('method', '')}")
            lines.append(f"Claim: {lb.get('claim', '')}")
            lines.append(f"Car cost limit: ${lb.get('car_limit', 0):,}")
        elif jur == "NZ":
            lines.append(f"**IRD mileage rate:** ${vehicle.get('ird_rate', 0.99)}/km for first 14,000 km")
            lines.append(f"**After 14,000 km:** ${vehicle.get('tier_2_rate', 0.35)}/km")
            lines.append(f"**Alternative:** {vehicle.get('alternative', '')}")
        elif jur == "GB":
            rates = vehicle.get("mileage_rates", {})
            lines.append(f"**Car (first 10,000 miles):** £{rates.get('car_first_10000', 0.45)}/mile")
            lines.append(f"**Car (over 10,000 miles):** £{rates.get('car_over_10000', 0.25)}/mile")
            lines.append(f"**Motorcycle:** £{rates.get('motorcycle', 0.24)}/mile")
            lines.append(f"**Bicycle:** £{rates.get('bicycle', 0.20)}/mile")
        elif jur == "US":
            lines.append(f"**IRS standard mileage rate (2025):** ${vehicle.get('standard_mileage_rate_2025', 0.70)}/mile")
            lines.append(f"**Alternative:** {vehicle.get('alternative', '')}")
            lines.append(f"**Parking/tolls:** {vehicle.get('parking_tolls', '')}")
            lines.append(f"**Commuting:** {vehicle.get('commuting', '')}")

        return "\n".join(lines)

    def _answer_home_office(self, kb: dict, jur: str) -> str:
        """Generate answer about home office deductions."""
        ho = kb.get("claimable_expenses", {}).get("home_office", kb.get("claimable_expenses", {}).get("work_from_home", {}))
        lines = [f"**Home Office / Work From Home — {kb['authority']}**\n"]

        if jur == "AU":
            wfh = kb.get("claimable_expenses", {}).get("work_from_home", {})
            lines.append(f"**Fixed rate method:** ${wfh.get('rate', 0.67)}/hour")
            lines.append(f"Covers: {wfh.get('covers', '')}")
            lines.append(f"Requirements: {wfh.get('requirements', '')}")
            lines.append(f"\n**Alternative:** {wfh.get('alternative', '')}")
        elif jur == "US":
            simp = ho.get("simplified_method", {})
            lines.append(f"**Simplified method:** ${simp.get('rate', 5.00)}/sq ft, max {simp.get('max_sqft', 300)} sq ft = ${simp.get('max_deduction', 1500):,} max")
            lines.append(f"**Regular method:** {ho.get('regular_method', '')}")
            lines.append(f"**Qualification:** {ho.get('qualification', '')}")
            lines.append(f"\n**Important:** {ho.get('employees', '')}")
        else:
            for k, v in ho.items():
                if isinstance(v, str):
                    lines.append(f"**{k.replace('_', ' ').title()}:** {v}")
                elif isinstance(v, dict):
                    lines.append(f"**{k.replace('_', ' ').title()}:**")
                    for sk, sv in v.items():
                        lines.append(f"  - {sk.replace('_', ' ')}: {sv}")

        return "\n".join(lines)

    def _answer_gst_vat(self, kb: dict, jur: str) -> str:
        """Generate answer about GST/VAT."""
        tax_data = kb.get("gst", kb.get("vat", {}))
        lines = []

        if jur in ("AU", "NZ"):
            lines.append(f"**GST — {kb['authority']}**\n")
            lines.append(f"**Rate:** {tax_data.get('rate', 0) * 100}%")
            lines.append(f"**Registration threshold:** ${tax_data.get('threshold', 0):,} annual turnover")
            if tax_data.get("gst_free_items"):
                lines.append("\n**GST-free items:**")
                for item in tax_data["gst_free_items"]:
                    lines.append(f"- {item}")
        elif jur == "GB":
            lines.append(f"**VAT — {kb['authority']}**\n")
            lines.append(f"**Standard rate:** {tax_data.get('standard_rate', 0) * 100}%")
            lines.append(f"**Reduced rate:** {tax_data.get('reduced_rate', 0) * 100}%")
            lines.append(f"**Registration threshold:** £{tax_data.get('threshold', 0):,}")
            if tax_data.get("zero_rated_items"):
                lines.append("\n**Zero-rated items:**")
                for item in tax_data["zero_rated_items"]:
                    lines.append(f"- {item}")
        elif jur == "US":
            st = kb.get("sales_tax", {})
            lines.append("**Sales Tax — United States**\n")
            lines.append("There is no federal sales tax in the US. Sales tax is state-level.\n")
            lines.append(f"**No sales tax states:** {', '.join(st.get('no_sales_tax_states', []))}")
            lines.append(f"\n**Nexus:** {st.get('nexus', '')}")

        return "\n".join(lines)

    def _answer_tax_rates(self, kb: dict, jur: str) -> str:
        """Generate answer about income tax rates."""
        rates_data = kb.get("income_tax_rates", {})
        lines = [f"**Income Tax Rates — {kb['authority']}**\n"]

        # Find the individual rates
        individual = rates_data.get("resident", rates_data.get("individual", rates_data.get("individual_2025", [])))
        if isinstance(individual, list):
            lines.append("**Individual rates:**")
            for bracket in individual:
                max_val = f"${bracket['max']:,}" if bracket.get('max') else "and above"
                rate_pct = f"{bracket['rate'] * 100}%"
                band = f" ({bracket['band']})" if 'band' in bracket else ""
                lines.append(f"- ${bracket['min']:,} – {max_val}: {rate_pct}{band}")

        # Company rate
        company = rates_data.get("company", rates_data.get("corporate"))
        if company:
            if isinstance(company, (int, float)):
                lines.append(f"\n**Company/Corporate rate:** {company * 100}%")

        return "\n".join(lines)

    def _answer_dates(self, kb: dict, jur: str) -> str:
        """Generate answer about important tax dates."""
        dates = kb.get("important_dates", [])
        lines = [f"**Important Tax Dates — {kb['authority']}**\n"]
        lines.append(f"Financial year: {kb.get('financial_year', 'N/A')}\n")

        for d in dates:
            lines.append(f"- **{d['date']}** — {d['event']}")

        return "\n".join(lines)

    def _answer_super(self, kb: dict, jur: str) -> str:
        """Generate answer about superannuation/retirement."""
        lines = [f"**Retirement Contributions — {kb['authority']}**\n"]

        if jur == "AU":
            s = kb.get("superannuation", {})
            lines.append(f"**Super Guarantee rate:** {s.get('rate', 0) * 100}%")
            lines.append(f"**Concessional contributions cap:** ${s.get('concessional_cap', 0):,}/year")
            lines.append(f"**Non-concessional cap:** ${s.get('non_concessional_cap', 0):,}/year")
            lines.append(f"**Preservation age:** {s.get('preservation_age', 60)}")
        elif jur == "NZ":
            ks = kb.get("kiwisaver", {})
            rates = ks.get("employee_rates", [])
            lines.append(f"**KiwiSaver employee rates:** {', '.join(str(int(r*100))+'%' for r in rates)}")
            lines.append(f"**Employer minimum:** {int(ks.get('employer_min', 0.03)*100)}%")
            lines.append(f"**Government contribution:** {ks.get('government_contribution', '')}")
        elif jur == "US":
            ret = kb.get("claimable_expenses", {}).get("retirement", {})
            lines.append(f"**401(k) limit (2025):** ${ret.get('401k_limit_2025', 0):,}")
            lines.append(f"**401(k) catch-up (50+):** ${ret.get('401k_catch_up_50_plus', 0):,} additional")
            lines.append(f"**SEP IRA:** {ret.get('sep_ira', '')}")
            lines.append(f"**Traditional IRA:** ${ret.get('traditional_ira', 0):,}")
        elif jur == "GB":
            lines.append("**Workplace Pension:**")
            lines.append("- Employer minimum: 3% of qualifying earnings")
            lines.append("- Employee minimum: 5% of qualifying earnings")
            lines.append("- Total minimum: 8%")
            lines.append("- Annual allowance: £60,000 (2024-25)")
            lines.append("- Lifetime allowance: Abolished from April 2024")

        return "\n".join(lines)

    def _answer_general(self, kb: dict, jur: str, q_lower: str) -> str:
        """Fallback general answer."""
        lines = [f"**Tax Information — {kb['authority']}**\n"]
        lines.append(f"Financial year: {kb.get('financial_year', 'N/A')}")
        lines.append(f"Currency: {kb.get('currency', 'N/A')}\n")
        lines.append("I can help you with the following topics:\n")

        topics = [
            "Claimable expenses and deductions",
            "Bank fee deductibility",
            "Vehicle/mileage deductions",
            "Home office expenses",
            "GST/VAT/Sales tax",
            "Income tax rates and brackets",
            "Important tax dates and deadlines",
            "Superannuation/KiwiSaver/401(k)/Pension",
        ]
        for t in topics:
            lines.append(f"- {t}")

        lines.append(f"\nTry asking something like: \"Can I claim bank fees in {jur}?\" or \"What are the tax rates?\"")

        return "\n".join(lines)

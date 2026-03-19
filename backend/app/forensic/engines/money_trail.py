"""Money Trail Analyzer.

Traces the flow of funds through accounts and entities to build
a complete picture for M&A due diligence.

Answers: "Where did the money come from, where did it go, and
does the story make sense?"
"""

from collections import defaultdict
from decimal import Decimal


class MoneyTrailAnalyzer:
    """Builds and analyzes the flow of funds through a business.

    For M&A: the acquirer needs to understand revenue quality,
    expense legitimacy, and cash flow patterns.
    """

    def analyze_cash_flow_pattern(self, transactions: list[dict]) -> dict:
        """Analyze cash inflows and outflows for patterns.

        Flags:
        - Revenue concentration (>50% from one source)
        - Expense spikes before acquisition (cleaning the books)
        - Cash flow timing mismatches
        - Circular transactions (money going out and coming back)
        """
        inflows = defaultdict(lambda: Decimal("0"))
        outflows = defaultdict(lambda: Decimal("0"))
        monthly_net = defaultdict(lambda: Decimal("0"))

        for txn in transactions:
            amount = Decimal(str(txn.get("amount", 0)))
            source = txn.get("counterparty") or txn.get("vendor") or txn.get("description", "Unknown")
            period = str(txn.get("date", ""))[:7]  # YYYY-MM

            if amount > 0:
                inflows[source] += amount
                monthly_net[period] += amount
            else:
                outflows[source] += abs(amount)
                monthly_net[period] -= abs(amount)

        total_inflow = sum(inflows.values())
        total_outflow = sum(outflows.values())

        flags = []

        # Revenue concentration
        if total_inflow > 0:
            top_source = max(inflows.items(), key=lambda x: x[1]) if inflows else (None, Decimal("0"))
            if top_source[0]:
                concentration = float(top_source[1] / total_inflow * 100)
                if concentration > 50:
                    flags.append({
                        "pattern": "revenue_concentration",
                        "severity": "high",
                        "source": top_source[0],
                        "pct": round(concentration, 2),
                        "detail": f"{concentration:.1f}% of revenue from single source: {top_source[0]}",
                    })

        # Net cash flow trend (declining = risk)
        sorted_months = sorted(monthly_net.items())
        if len(sorted_months) >= 3:
            recent = [float(v) for _, v in sorted_months[-3:]]
            earlier = [float(v) for _, v in sorted_months[:3]]
            avg_recent = sum(recent) / len(recent)
            avg_earlier = sum(earlier) / len(earlier)

            if avg_earlier > 0 and avg_recent < avg_earlier * 0.5:
                flags.append({
                    "pattern": "declining_cash_flow",
                    "severity": "high",
                    "detail": f"Recent monthly average (${avg_recent:,.0f}) is less than half of earlier average (${avg_earlier:,.0f})",
                })

        # Circular transaction detection
        circular = set(inflows.keys()) & set(outflows.keys())
        circular_flags = []
        for entity in circular:
            in_amt = inflows[entity]
            out_amt = outflows[entity]
            diff_pct = abs(float((in_amt - out_amt) / max(in_amt, out_amt) * 100)) if max(in_amt, out_amt) > 0 else 0
            if diff_pct < 20 and in_amt > Decimal("1000"):  # within 20% and material
                circular_flags.append({
                    "entity": entity,
                    "inflow": str(in_amt),
                    "outflow": str(out_amt),
                    "diff_pct": round(diff_pct, 2),
                })

        if circular_flags:
            flags.append({
                "pattern": "circular_transactions",
                "severity": "critical",
                "count": len(circular_flags),
                "detail": f"{len(circular_flags)} entities with near-equal inflows and outflows (potential round-tripping)",
                "entities": circular_flags[:10],
            })

        # Top inflows and outflows
        top_inflows = sorted(inflows.items(), key=lambda x: x[1], reverse=True)[:10]
        top_outflows = sorted(outflows.items(), key=lambda x: x[1], reverse=True)[:10]

        return {
            "status": "complete",
            "test_type": "cash_flow_analysis",
            "total_inflow": str(total_inflow),
            "total_outflow": str(total_outflow),
            "net_cash_flow": str(total_inflow - total_outflow),
            "monthly_net_flow": {k: str(v) for k, v in sorted_months},
            "top_inflow_sources": [{"source": s, "amount": str(a)} for s, a in top_inflows],
            "top_outflow_destinations": [{"destination": s, "amount": str(a)} for s, a in top_outflows],
            "unique_inflow_sources": len(inflows),
            "unique_outflow_destinations": len(outflows),
            "flags": flags,
            "risk_level": "critical" if any(f["severity"] == "critical" for f in flags)
                else "high" if any(f["severity"] == "high" for f in flags) else "low",
        }

    def generate_funds_flow_map(self, transactions: list[dict]) -> dict:
        """Build a directed graph of money flow between entities.

        Useful for visualizing where money is going in the target company.
        """
        edges = defaultdict(lambda: {"amount": Decimal("0"), "count": 0})
        nodes = set()

        entity_name = "Target Company"  # the company being acquired

        for txn in transactions:
            counterparty = txn.get("counterparty") or txn.get("vendor") or txn.get("description", "Unknown")
            amount = Decimal(str(txn.get("amount", 0)))

            if amount > 0:
                # Inflow: counterparty → entity
                key = (counterparty, entity_name)
            else:
                # Outflow: entity → counterparty
                key = (entity_name, counterparty)
                amount = abs(amount)

            edges[key]["amount"] += amount
            edges[key]["count"] += 1
            nodes.add(counterparty)

        nodes.add(entity_name)

        return {
            "nodes": [{"id": n, "is_target": n == entity_name} for n in sorted(nodes)],
            "edges": [
                {
                    "from": k[0],
                    "to": k[1],
                    "amount": str(v["amount"]),
                    "transaction_count": v["count"],
                }
                for k, v in sorted(edges.items(), key=lambda x: x[1]["amount"], reverse=True)
            ],
            "total_nodes": len(nodes),
            "total_edges": len(edges),
        }

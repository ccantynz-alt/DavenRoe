"""Smart Tools Engine — makes accounting accessible to non-accountants.

Three core tools:
  1. Expense Wizard — "Can I claim this?" with yes/no answers and confidence
  2. Plain English Translator — turns P&L/Balance Sheet into human-readable summaries
  3. Business Health Checklist — "Here's what you should do this month"
"""

from __future__ import annotations
from datetime import datetime, timezone
from decimal import Decimal


# ── Expense Wizard ─────────────────────────────────────────────

EXPENSE_CATEGORIES = {
    "office_supplies": {
        "label": "Office Supplies",
        "emoji": "pencil",
        "examples": "Pens, paper, printer ink, sticky notes, folders",
        "claimable": True,
        "percentage": 100,
        "tip": "Keep receipts for anything over $10. Bulk purchases from Officeworks/Staples are fine.",
        "account_code": "6100",
    },
    "software": {
        "label": "Software & Subscriptions",
        "emoji": "laptop",
        "examples": "Microsoft 365, Adobe, Canva, Zoom, Slack, accounting software",
        "claimable": True,
        "percentage": 100,
        "tip": "Monthly subscriptions are claimed in the month they're paid. Annual subscriptions can be spread across 12 months.",
        "account_code": "6110",
    },
    "phone_internet": {
        "label": "Phone & Internet",
        "emoji": "phone",
        "examples": "Mobile phone bill, home internet, business phone line",
        "claimable": True,
        "percentage": None,  # needs calculation
        "tip": "If you use your phone 60% for work, you can claim 60% of the bill. Keep a log for 4 weeks to establish your ratio.",
        "account_code": "6120",
    },
    "travel": {
        "label": "Business Travel",
        "emoji": "plane",
        "examples": "Flights, hotels, Uber to meetings, parking at client site",
        "claimable": True,
        "percentage": 100,
        "tip": "Travel between home and your regular office is NOT claimable. Travel to client sites, meetings, and conferences IS.",
        "account_code": "6200",
    },
    "meals_entertainment": {
        "label": "Meals & Entertainment",
        "emoji": "fork_and_knife",
        "examples": "Client lunches, team dinners, coffee meetings",
        "claimable": True,
        "percentage": 50,
        "tip": "Most countries only allow 50% of meal costs. Write the client/purpose on the receipt — you'll thank yourself at tax time.",
        "account_code": "6210",
    },
    "car_fuel": {
        "label": "Car & Fuel",
        "emoji": "car",
        "examples": "Fuel, tolls, parking, car insurance, registration",
        "claimable": True,
        "percentage": None,
        "tip": "You can either track actual costs (keep EVERY receipt) or use the per-km/mile rate (much simpler). Most people choose the per-km rate.",
        "account_code": "6220",
    },
    "rent": {
        "label": "Office Rent",
        "emoji": "building",
        "examples": "Office lease, co-working space membership, storage unit for business",
        "claimable": True,
        "percentage": 100,
        "tip": "Co-working day passes count too. If you use a room at home, claim the proportional area.",
        "account_code": "6300",
    },
    "home_office": {
        "label": "Working From Home",
        "emoji": "house",
        "examples": "Portion of rent/mortgage interest, electricity, heating, internet",
        "claimable": True,
        "percentage": None,
        "tip": "Easiest method: claim the fixed rate per hour you work from home (AU: 67c/hr, US: $5/sq ft). No receipts needed for the rate method.",
        "account_code": "6310",
    },
    "insurance": {
        "label": "Business Insurance",
        "emoji": "shield",
        "examples": "Professional indemnity, public liability, business contents, cyber insurance",
        "claimable": True,
        "percentage": 100,
        "tip": "Health insurance is handled differently — in the US it's deductible if self-employed, in AU/NZ/UK it's usually not a business expense.",
        "account_code": "6400",
    },
    "professional_fees": {
        "label": "Professional Services",
        "emoji": "briefcase",
        "examples": "Accountant fees, lawyer fees, bookkeeper, financial advisor",
        "claimable": True,
        "percentage": 100,
        "tip": "Your accountant's fee is tax-deductible. So is this software subscription!",
        "account_code": "6410",
    },
    "training": {
        "label": "Training & Education",
        "emoji": "graduation_cap",
        "examples": "Online courses, conferences, workshops, professional development books",
        "claimable": True,
        "percentage": 100,
        "tip": "Must be related to your CURRENT business/job. A marketing course for your business? Yes. A cooking class for fun? No.",
        "account_code": "6420",
    },
    "equipment": {
        "label": "Tools & Equipment",
        "emoji": "wrench",
        "examples": "Laptop, monitor, desk, chair, tools of trade, camera",
        "claimable": True,
        "percentage": 100,
        "tip": "Items under $300 (AU) or the equivalent can be claimed immediately. Over that, they're depreciated over their useful life (don't worry, we calculate this for you).",
        "account_code": "6500",
    },
    "bank_fees": {
        "label": "Bank Fees & Charges",
        "emoji": "bank",
        "examples": "Account keeping fees, merchant fees, PayPal/Stripe fees, wire transfers",
        "claimable": True,
        "percentage": 100,
        "tip": "Only the business portion. If your account is mixed personal/business, only claim the business transactions' fees.",
        "account_code": "6130",
    },
    "advertising": {
        "label": "Marketing & Advertising",
        "emoji": "megaphone",
        "examples": "Google Ads, Facebook Ads, business cards, website hosting, SEO",
        "claimable": True,
        "percentage": 100,
        "tip": "Website costs, domain names, and hosting are all claimable. Social media advertising counts too.",
        "account_code": "6600",
    },
    "personal": {
        "label": "Personal / Not Claimable",
        "emoji": "x",
        "examples": "Groceries, personal clothing, gym, Netflix, personal travel",
        "claimable": False,
        "percentage": 0,
        "tip": "Even if you paid from your business account, personal expenses can't be claimed. Move them to a 'Drawings' account.",
        "account_code": "9999",
    },
}


class ExpenseWizard:
    """Helps users categorize expenses with plain-English guidance."""

    def categorize(self, description: str, amount: float, vendor: str = "") -> dict:
        """Auto-categorize an expense based on description and vendor."""
        desc_lower = (description + " " + vendor).lower()

        # Simple keyword matching — effective for common expenses
        matches = []

        keyword_map = {
            "office_supplies": ["officeworks", "staples", "paper", "ink", "stationery", "pen", "folder", "printer"],
            "software": ["microsoft", "adobe", "canva", "zoom", "slack", "dropbox", "google workspace", "subscription", "saas", "app store", "software"],
            "phone_internet": ["telstra", "optus", "vodafone", "verizon", "att", "t-mobile", "internet", "mobile", "phone bill", "nbn", "broadband"],
            "travel": ["flight", "airline", "qantas", "virgin", "jetstar", "hotel", "airbnb", "uber", "lyft", "taxi", "parking", "toll"],
            "meals_entertainment": ["restaurant", "cafe", "coffee", "lunch", "dinner", "uber eats", "doordash", "catering", "bar"],
            "car_fuel": ["fuel", "petrol", "gas station", "shell", "bp", "caltex", "7-eleven fuel", "rego", "car wash"],
            "rent": ["rent", "lease", "co-working", "wework", "regus"],
            "insurance": ["insurance", "indemnity", "liability", "allianz", "qbe", "suncorp"],
            "professional_fees": ["accountant", "lawyer", "solicitor", "legal", "bookkeeper", "consultant"],
            "training": ["course", "udemy", "coursera", "conference", "workshop", "seminar", "training", "certification"],
            "equipment": ["laptop", "computer", "monitor", "desk", "chair", "keyboard", "mouse", "ipad", "tablet", "camera"],
            "bank_fees": ["bank fee", "account fee", "merchant fee", "stripe", "paypal", "square", "processing fee", "wire transfer"],
            "advertising": ["google ads", "facebook ads", "instagram", "marketing", "seo", "domain", "hosting", "squarespace", "wix", "shopify"],
            "home_office": ["electricity", "power bill", "gas bill", "home office"],
        }

        for category, keywords in keyword_map.items():
            score = sum(1 for kw in keywords if kw in desc_lower)
            if score > 0:
                matches.append((category, score))

        matches.sort(key=lambda x: x[1], reverse=True)

        if matches:
            best = matches[0][0]
            cat = EXPENSE_CATEGORIES[best]
            confidence = min(0.95, 0.5 + matches[0][1] * 0.15)
        else:
            best = "personal"
            cat = EXPENSE_CATEGORIES["personal"]
            confidence = 0.3

        return {
            "category": best,
            "label": cat["label"],
            "claimable": cat["claimable"],
            "percentage": cat["percentage"],
            "claimable_amount": round(amount * (cat["percentage"] / 100), 2) if cat["percentage"] else amount,
            "tip": cat["tip"],
            "confidence": round(confidence, 2),
            "account_code": cat["account_code"],
            "alternatives": [
                {"category": m[0], "label": EXPENSE_CATEGORIES[m[0]]["label"]}
                for m in matches[1:4]
            ],
        }

    def get_all_categories(self) -> list[dict]:
        """Get all expense categories with tips."""
        return [
            {
                "id": key,
                "label": val["label"],
                "examples": val["examples"],
                "claimable": val["claimable"],
                "percentage": val["percentage"],
                "tip": val["tip"],
            }
            for key, val in EXPENSE_CATEGORIES.items()
        ]


# ── Plain English Translator ──────────────────────────────────

class PlainEnglishTranslator:
    """Translates financial data into plain English summaries."""

    def translate_pnl(self, data: dict) -> dict:
        """Turn P&L numbers into a plain English summary."""
        revenue = data.get("revenue", 0)
        expenses = data.get("expenses", 0)
        net_profit = data.get("net_profit", revenue - expenses)
        prev_revenue = data.get("prev_revenue")
        prev_profit = data.get("prev_net_profit")

        # Build plain English
        lines = []

        if net_profit > 0:
            lines.append(f"Your business made **${net_profit:,.2f} profit** this period.")
            lines.append(f"You earned ${revenue:,.2f} in total and spent ${expenses:,.2f}.")
            margin = (net_profit / revenue * 100) if revenue > 0 else 0
            if margin > 20:
                lines.append(f"That's a **{margin:.0f}% profit margin** — very healthy.")
            elif margin > 10:
                lines.append(f"That's a **{margin:.0f}% profit margin** — decent, but there's room to improve.")
            else:
                lines.append(f"That's only a **{margin:.0f}% profit margin** — you might want to look at reducing costs or increasing prices.")
        elif net_profit == 0:
            lines.append("You broke even this period — revenue exactly matched expenses.")
        else:
            lines.append(f"Your business **lost ${abs(net_profit):,.2f}** this period.")
            lines.append(f"You earned ${revenue:,.2f} but spent ${expenses:,.2f}.")
            lines.append("Don't panic — many businesses have seasonal dips. Check which expenses were highest.")

        # Trend
        if prev_revenue is not None and revenue > 0:
            change = ((revenue - prev_revenue) / prev_revenue * 100) if prev_revenue > 0 else 0
            if change > 0:
                lines.append(f"Revenue is **up {change:.0f}%** compared to last period.")
            elif change < 0:
                lines.append(f"Revenue is **down {abs(change):.0f}%** compared to last period.")

        # Top expense insight
        top_expenses = data.get("top_expenses", [])
        if top_expenses:
            biggest = top_expenses[0]
            pct = (biggest.get("amount", 0) / expenses * 100) if expenses > 0 else 0
            lines.append(f"Your biggest expense category is **{biggest.get('name', 'Unknown')}** at ${biggest['amount']:,.2f} ({pct:.0f}% of all spending).")

        return {
            "summary": "\n\n".join(lines),
            "verdict": "profitable" if net_profit > 0 else "break_even" if net_profit == 0 else "loss",
            "profit_margin": round((net_profit / revenue * 100), 1) if revenue > 0 else 0,
            "actionable_tips": self._get_pnl_tips(net_profit, revenue, expenses),
        }

    def translate_balance_sheet(self, data: dict) -> dict:
        """Turn Balance Sheet into plain English."""
        assets = data.get("total_assets", 0)
        liabilities = data.get("total_liabilities", 0)
        equity = data.get("equity", assets - liabilities)
        cash = data.get("cash", 0)
        receivables = data.get("receivables", 0)
        payables = data.get("payables", 0)

        lines = []

        lines.append(f"Your business owns **${assets:,.2f} in total assets** and owes **${liabilities:,.2f}**.")
        lines.append(f"That means your business is worth **${equity:,.2f}** on paper (assets minus what you owe).")

        if cash > 0:
            lines.append(f"You have **${cash:,.2f} in cash** available right now.")
            months = cash / (data.get("monthly_expenses", 1) or 1)
            if months > 6:
                lines.append(f"That's about **{months:.0f} months of runway** — you're in a strong cash position.")
            elif months > 3:
                lines.append(f"That's about **{months:.0f} months of runway** — comfortable but keep an eye on it.")
            else:
                lines.append(f"That's only about **{months:.0f} months of runway** — consider building up your cash buffer.")

        if receivables > 0:
            lines.append(f"Clients owe you **${receivables:,.2f}** — make sure you're following up on overdue invoices.")

        if payables > 0:
            lines.append(f"You owe **${payables:,.2f}** to suppliers — check when these are due to avoid late fees.")

        return {
            "summary": "\n\n".join(lines),
            "net_worth": equity,
            "cash_runway_months": round(cash / (data.get("monthly_expenses", 1) or 1), 1),
            "actionable_tips": self._get_bs_tips(cash, receivables, payables, equity),
        }

    def translate_cash_flow(self, data: dict) -> dict:
        """Turn cash flow into plain English."""
        inflows = data.get("inflows", 0)
        outflows = data.get("outflows", 0)
        net = inflows - outflows
        opening = data.get("opening_balance", 0)
        closing = opening + net

        lines = []
        if net > 0:
            lines.append(f"**${net:,.2f} more came in than went out** this period.")
            lines.append(f"Money in: ${inflows:,.2f} | Money out: ${outflows:,.2f}")
            lines.append(f"Your bank balance went from ${opening:,.2f} to **${closing:,.2f}**.")
        elif net < 0:
            lines.append(f"You spent **${abs(net):,.2f} more than you earned** this period.")
            lines.append(f"Money in: ${inflows:,.2f} | Money out: ${outflows:,.2f}")
            lines.append(f"Your bank balance dropped from ${opening:,.2f} to **${closing:,.2f}**.")
            if closing < 0:
                lines.append("Your balance is negative — you may need to arrange finance or chase unpaid invoices urgently.")
        else:
            lines.append("Cash in and cash out were exactly equal this period.")

        return {
            "summary": "\n\n".join(lines),
            "net_cash_flow": net,
            "closing_balance": closing,
        }

    def _get_pnl_tips(self, profit, revenue, expenses) -> list[str]:
        tips = []
        if profit < 0:
            tips.append("Review your top 3 expense categories — can any be reduced?")
            tips.append("Check if you have any overdue invoices that could boost revenue")
            tips.append("Consider whether your pricing needs to increase")
        elif profit > 0:
            margin = (profit / revenue * 100) if revenue > 0 else 0
            if margin < 15:
                tips.append("Your margin is thin — a 10% cost reduction would significantly boost profit")
            tips.append("Consider setting aside 25-30% of profit for tax")
            tips.append("Good time to invest in growth while cash flow is positive")
        return tips

    def _get_bs_tips(self, cash, receivables, payables, equity) -> list[str]:
        tips = []
        if receivables > cash:
            tips.append("You have more money owed to you than in the bank — focus on collecting invoices")
        if payables > cash:
            tips.append("You owe more than you have in cash — prioritize which bills to pay first")
        if equity < 0:
            tips.append("Your business has negative equity — this means you owe more than you own. Consider restructuring debt.")
        if cash < 5000:
            tips.append("Your cash balance is low — consider a business line of credit as backup")
        return tips


# ── Business Checklist ─────────────────────────────────────────

class BusinessChecklist:
    """Generates a personalized to-do list based on where the user is in their business journey."""

    def get_setup_checklist(self, jurisdiction: str, has_entity: bool = False, has_bank: bool = False,
                            has_invoice: bool = False, has_employee: bool = False) -> list[dict]:
        """Get a setup checklist for new businesses."""
        items = []

        items.append({
            "id": "entity",
            "title": "Set up your business",
            "description": "Register your company or record your sole trader details",
            "done": has_entity,
            "action": "/incorporate",
            "action_label": "Set Up Business",
            "priority": 1,
            "why": "Everything else depends on having your business registered properly",
        })

        items.append({
            "id": "bank",
            "title": "Connect your bank account",
            "description": "Link your business bank account so transactions flow in automatically",
            "done": has_bank,
            "action": "/banking",
            "action_label": "Connect Bank",
            "priority": 2,
            "why": "This is the single biggest time-saver — no more manual data entry",
        })

        tax_items = {
            "AU": {"title": "Register for GST (if turnover > $75K)", "action": "/tax"},
            "NZ": {"title": "Register for GST (if turnover > $60K)", "action": "/tax"},
            "GB": {"title": "Register for VAT (if turnover > £90K)", "action": "/tax"},
            "US": {"title": "Get your EIN from the IRS", "action": "/tax"},
        }
        jur = jurisdiction.upper()
        tax = tax_items.get(jur, tax_items["AU"])
        items.append({
            "id": "tax_registration",
            "title": tax["title"],
            "description": "Make sure you're registered for the right taxes",
            "done": False,
            "action": tax["action"],
            "action_label": "Check Tax Status",
            "priority": 3,
            "why": "Getting this wrong can mean penalties. Better to check now.",
        })

        items.append({
            "id": "first_invoice",
            "title": "Create your first invoice",
            "description": "Set up your invoice template and send your first invoice",
            "done": has_invoice,
            "action": "/invoicing",
            "action_label": "Create Invoice",
            "priority": 4,
            "why": "Getting paid is the whole point! Set up your template once and reuse it.",
        })

        items.append({
            "id": "expense_categories",
            "title": "Understand what you can claim",
            "description": "Learn which business expenses reduce your tax bill",
            "done": False,
            "action": "/smart-tools",
            "action_label": "Expense Guide",
            "priority": 5,
            "why": "Most small businesses miss out on legitimate deductions because they don't know what's claimable",
        })

        if has_employee:
            items.append({
                "id": "payroll_setup",
                "title": "Set up payroll",
                "description": "Add your employees and run your first pay run",
                "done": False,
                "action": "/payroll",
                "action_label": "Set Up Payroll",
                "priority": 6,
                "why": "Paying employees correctly (with the right tax withheld) is a legal requirement",
            })

        items.append({
            "id": "compliance_calendar",
            "title": "Check your upcoming deadlines",
            "description": "See what tax filings and payments are due in the next 90 days",
            "done": False,
            "action": "/compliance",
            "action_label": "View Deadlines",
            "priority": 7,
            "why": "Missing a deadline can mean fines. Astra tracks them all for you.",
        })

        return sorted(items, key=lambda x: x["priority"])

    def get_monthly_checklist(self, month: int, jurisdiction: str) -> list[dict]:
        """Get monthly tasks a business owner should complete."""
        items = [
            {
                "id": "reconcile",
                "title": "Reconcile your bank feeds",
                "description": "Review and approve the transactions Astra has categorized for you",
                "action": "/review",
                "action_label": "Review Queue",
                "frequency": "weekly",
                "effort": "5-15 minutes",
            },
            {
                "id": "invoices_check",
                "title": "Chase overdue invoices",
                "description": "Check if any clients haven't paid yet and send a reminder",
                "action": "/invoicing",
                "action_label": "View Invoices",
                "frequency": "weekly",
                "effort": "5 minutes",
            },
            {
                "id": "receipts",
                "title": "Upload any paper receipts",
                "description": "Snap photos of receipts before they fade — Astra will OCR and categorize them",
                "action": "/documents",
                "action_label": "Upload Receipts",
                "frequency": "as needed",
                "effort": "2 minutes each",
            },
            {
                "id": "reports",
                "title": "Check your Profit & Loss",
                "description": "See how your business performed this month in plain English",
                "action": "/smart-tools",
                "action_label": "View Summary",
                "frequency": "monthly",
                "effort": "5 minutes",
            },
            {
                "id": "health_score",
                "title": "Check your Financial Health Score",
                "description": "See your overall business health and what to improve",
                "action": "/financial-health",
                "action_label": "Health Score",
                "frequency": "monthly",
                "effort": "2 minutes",
            },
        ]

        # Add tax-specific items based on jurisdiction and month
        if jurisdiction.upper() == "AU" and month in (10, 1, 4, 7):
            items.append({
                "id": "bas",
                "title": "Lodge your BAS (Business Activity Statement)",
                "description": "Your quarterly BAS is due soon. Astra can prepare it for you.",
                "action": "/tax-filing",
                "action_label": "Prepare BAS",
                "frequency": "quarterly",
                "effort": "15-30 minutes with Astra",
            })

        return items

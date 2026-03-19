"""Trust & Estate Accounting Engine.

Trust distribution calculations, income/capital classification,
estate CGT, and beneficiary reporting.
"""

from decimal import Decimal


class TrustDistributionEngine:
    """Calculates trust distributions and tax component streaming.

    Trust accounting is notoriously complex — income must be classified,
    streamed to beneficiaries, and reported with correct tax components.
    """

    def calculate_distribution(
        self,
        trust_income: dict,
        beneficiaries: list[dict],
        distribution_method: str = "proportional",
    ) -> dict:
        """Calculate trust distributions to beneficiaries.

        Args:
            trust_income: {
                "net_income": Decimal, "franked_dividends": Decimal,
                "unfranked_dividends": Decimal, "capital_gains": Decimal,
                "interest": Decimal, "rental": Decimal, "other": Decimal
            }
            beneficiaries: [{name, share_pct, is_minor, is_non_resident}]
            distribution_method: proportional or specific_entitlement
        """
        total_income = Decimal(str(trust_income.get("net_income", 0)))

        components = {
            "franked_dividends": Decimal(str(trust_income.get("franked_dividends", 0))),
            "unfranked_dividends": Decimal(str(trust_income.get("unfranked_dividends", 0))),
            "capital_gains": Decimal(str(trust_income.get("capital_gains", 0))),
            "interest": Decimal(str(trust_income.get("interest", 0))),
            "rental": Decimal(str(trust_income.get("rental", 0))),
            "other": Decimal(str(trust_income.get("other", 0))),
        }

        distributions = []
        for ben in beneficiaries:
            share = Decimal(str(ben.get("share_pct", 0))) / 100
            name = ben.get("name", "Unknown")

            ben_amount = (total_income * share).quantize(Decimal("0.01"))
            ben_components = {k: (v * share).quantize(Decimal("0.01")) for k, v in components.items()}

            # Franking credits (AU specific)
            franking_credits = (ben_components["franked_dividends"] * Decimal("0.4286")).quantize(Decimal("0.01"))

            # 50% CGT discount (if eligible — individuals, trusts)
            cgt_discount = (ben_components["capital_gains"] * Decimal("0.50")).quantize(Decimal("0.01"))

            warnings = []
            if ben.get("is_minor") and ben_amount > Decimal("416"):
                warnings.append("Minor beneficiary — penalty tax rates may apply above $416 (AU)")
            if ben.get("is_non_resident"):
                warnings.append("Non-resident beneficiary — withholding tax obligations apply")

            distributions.append({
                "beneficiary": name,
                "share_pct": float(share * 100),
                "total_distribution": str(ben_amount),
                "components": {k: str(v) for k, v in ben_components.items()},
                "franking_credits": str(franking_credits),
                "cgt_discount_available": str(cgt_discount),
                "taxable_income": str(ben_amount + franking_credits - cgt_discount),
                "warnings": warnings,
            })

        return {
            "status": "complete",
            "trust_net_income": str(total_income),
            "distribution_method": distribution_method,
            "beneficiary_count": len(distributions),
            "distributions": distributions,
        }


class EstateCGTEngine:
    """Estate CGT calculations for death-related asset transfers.

    When someone dies, their assets transfer to beneficiaries.
    The CGT treatment depends on the asset type and when it was acquired.
    """

    def calculate_estate_cgt(
        self,
        assets: list[dict],
        date_of_death: str,
        jurisdiction: str = "AU",
    ) -> dict:
        """Calculate CGT implications of estate asset transfers.

        Args:
            assets: [{name, type, cost_base, market_value_at_death, acquisition_date, is_pre_cgt}]
        """
        results = []
        total_gain = Decimal("0")
        total_exempt = Decimal("0")

        for asset in assets:
            cost = Decimal(str(asset.get("cost_base", 0)))
            market = Decimal(str(asset.get("market_value_at_death", 0)))
            gain = market - cost
            is_pre_cgt = asset.get("is_pre_cgt", False)
            asset_type = asset.get("type", "other")

            # Determine CGT treatment
            if asset_type == "main_residence":
                cgt_event = "exempt"
                taxable_gain = Decimal("0")
                note = "Main residence exemption applies"
                total_exempt += gain
            elif is_pre_cgt:
                cgt_event = "exempt"
                taxable_gain = Decimal("0")
                note = "Pre-CGT asset (acquired before 20 Sep 1985) — exempt"
                total_exempt += gain
            elif asset_type in ("personal_use", "vehicle", "collectible_under_500"):
                cgt_event = "exempt"
                taxable_gain = Decimal("0")
                note = "Personal use asset — exempt from CGT"
                total_exempt += gain
            else:
                cgt_event = "deferred"
                taxable_gain = gain
                note = "CGT deferred — beneficiary inherits cost base"
                total_gain += gain

            results.append({
                "asset": asset.get("name", "Unknown"),
                "type": asset_type,
                "cost_base": str(cost),
                "market_value": str(market),
                "gain_loss": str(gain),
                "cgt_event": cgt_event,
                "taxable_gain": str(taxable_gain),
                "note": note,
            })

        return {
            "status": "complete",
            "jurisdiction": jurisdiction,
            "date_of_death": date_of_death,
            "assets_analyzed": len(results),
            "total_unrealized_gain": str(total_gain + total_exempt),
            "total_taxable_gain": str(total_gain),
            "total_exempt_gain": str(total_exempt),
            "results": results,
        }

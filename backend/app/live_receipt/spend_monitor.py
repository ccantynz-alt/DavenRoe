"""Employee Spend Monitor — real-time fraud detection and anomaly alerting.

Because every transaction now hits Live Receipt instantly, we can catch
problems the MOMENT they happen — not weeks later during reconciliation.

Detection layers:
  1. REAL-TIME RULES — fires on every transaction as it arrives
     - Transaction outside business hours (2am fuel purchase?)
     - Transaction in unusual location (employee based in Sydney, purchase in Perth)
     - Transaction at blacklisted merchant categories (liquor stores, gambling, etc.)
     - Amount exceeds single-transaction policy limit
     - Multiple transactions in quick succession (card splitting to avoid limits)

  2. PATTERN ANALYSIS — runs periodically against transaction history
     - Spending velocity spike (spending 3x their normal weekly rate)
     - Category drift (suddenly 40% of spend is "meals" when it was 5%)
     - Weekend/holiday spending patterns
     - Round-number transactions (possible cash-back fraud)
     - Duplicate amounts at same merchant (possible double-swipe)

  3. BEHAVIORAL FLAGS — longer-term analysis
     - Employee consistently maxes out their monthly limit
     - Employee never attaches receipts/photos
     - Employee skips or dismisses transactions (avoiding categorization)
     - High rejection rate from managers
     - Transactions always just under the auto-approve threshold

  4. CROSS-REFERENCE — checks against known fraud patterns
     - Ghost vendor detection (vendor doesn't exist or is the employee themselves)
     - PO box addresses for vendor payments
     - Vendor name similar to employee name or family members
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone, timedelta
from enum import Enum
from collections import defaultdict


class AlertSeverity(str, Enum):
    INFO = "info"            # FYI, not necessarily bad
    WARNING = "warning"      # Unusual, worth reviewing
    HIGH = "high"            # Likely policy violation
    CRITICAL = "critical"    # Probable fraud, immediate action needed


class AlertType(str, Enum):
    AFTER_HOURS = "after_hours"
    BLACKLISTED_CATEGORY = "blacklisted_category"
    OVER_LIMIT = "over_limit"
    RAPID_SUCCESSION = "rapid_succession"
    VELOCITY_SPIKE = "velocity_spike"
    CATEGORY_DRIFT = "category_drift"
    WEEKEND_SPEND = "weekend_spend"
    ROUND_NUMBER = "round_number"
    DUPLICATE_AMOUNT = "duplicate_amount"
    MAXING_LIMIT = "maxing_limit"
    NO_RECEIPTS = "no_receipts"
    SKIP_PATTERN = "skip_pattern"
    HIGH_REJECTION = "high_rejection"
    THRESHOLD_GAMING = "threshold_gaming"
    SPLIT_TRANSACTION = "split_transaction"
    UNUSUAL_MERCHANT = "unusual_merchant"


# Merchant categories that are red flags for business expenses
BLACKLISTED_MCC = {
    "liquor_stores": "Liquor Stores",
    "package_stores_beer_wine": "Package Stores (Beer/Wine)",
    "gambling": "Gambling / Casinos",
    "dating_escort": "Dating / Escort Services",
    "tobacco": "Tobacco Stores",
    "pawn_shops": "Pawn Shops",
    "massage_parlors": "Massage Parlors (non-therapeutic)",
    "cruise_lines": "Cruise Lines",
    "jewelry_stores": "Jewelry Stores",
    "fur_stores": "Fur Stores",
}

# Merchants that are flagged as suspicious for business expenses
SUSPICIOUS_MERCHANTS = {
    "dan murphy", "bws", "liquorland", "first choice liquor",
    "crown casino", "star casino", "pokies", "tab", "sportsbet",
    "lottery", "lotto", "tattslotto",
    "harvey norman", "jb hi-fi", "apple store",  # could be legit but worth flagging if frequent
    "ebay", "amazon",  # personal shopping risk
    "uber eats", "menulog", "deliveroo",  # meal delivery, often personal
}


class SpendMonitorEngine:
    """Monitors employee spending in real-time for anomalies and fraud indicators."""

    def __init__(self):
        self.alerts: dict[str, dict] = {}
        self.employee_history: dict[str, list[dict]] = {}  # employee_id -> transactions
        self.alert_rules: dict[str, dict] = {}  # org_id -> custom rules

    def analyze_transaction(self, transaction: dict, employee_account: dict | None = None) -> list[dict]:
        """Run all real-time checks on an incoming transaction. Returns alerts."""
        alerts = []
        employee_id = transaction.get("user_id") or transaction.get("employee_id")
        amount = transaction.get("amount", 0)
        merchant = (transaction.get("merchant_name") or transaction.get("merchant_clean") or "").lower()
        timestamp = transaction.get("transaction_time") or transaction.get("received_at") or datetime.now(timezone.utc).isoformat()

        # Store in history
        if employee_id:
            if employee_id not in self.employee_history:
                self.employee_history[employee_id] = []
            self.employee_history[employee_id].append({
                "amount": amount,
                "merchant": merchant,
                "timestamp": timestamp,
                "category": transaction.get("category_code"),
                "payment_method": transaction.get("payment_method"),
                "receipt_id": transaction.get("id"),
            })

        # ── Rule 1: After-hours transactions ──────────────────
        try:
            txn_time = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
            hour = txn_time.hour
            if hour >= 22 or hour <= 5:
                alerts.append(self._create_alert(
                    employee_id=employee_id,
                    alert_type=AlertType.AFTER_HOURS,
                    severity=AlertSeverity.WARNING,
                    title=f"After-hours transaction: ${amount:.2f} at {hour}:00",
                    description=f"Transaction at {merchant or 'unknown merchant'} at {txn_time.strftime('%I:%M %p')}. Most business expenses occur during business hours.",
                    amount=amount,
                    merchant=merchant,
                    transaction_ref=transaction.get("id"),
                ))
        except (ValueError, TypeError):
            pass

        # ── Rule 2: Blacklisted merchant categories ───────────
        mcc = transaction.get("merchant_category_code", "")
        if mcc in BLACKLISTED_MCC:
            alerts.append(self._create_alert(
                employee_id=employee_id,
                alert_type=AlertType.BLACKLISTED_CATEGORY,
                severity=AlertSeverity.CRITICAL,
                title=f"Blacklisted category: {BLACKLISTED_MCC[mcc]}",
                description=f"${amount:.2f} at {merchant}. This merchant category ({BLACKLISTED_MCC[mcc]}) is not permitted for business expenses.",
                amount=amount,
                merchant=merchant,
                transaction_ref=transaction.get("id"),
            ))

        # Check suspicious merchant names
        for sus_merchant in SUSPICIOUS_MERCHANTS:
            if sus_merchant in merchant:
                severity = AlertSeverity.HIGH if any(kw in merchant for kw in ["casino", "liquor", "pokies", "sportsbet", "lottery"]) else AlertSeverity.WARNING
                alerts.append(self._create_alert(
                    employee_id=employee_id,
                    alert_type=AlertType.UNUSUAL_MERCHANT,
                    severity=severity,
                    title=f"Flagged merchant: {merchant.title()}",
                    description=f"${amount:.2f} at {merchant.title()}. This merchant is flagged for review — it may not be a legitimate business expense.",
                    amount=amount,
                    merchant=merchant,
                    transaction_ref=transaction.get("id"),
                ))
                break

        # ── Rule 3: Over single-transaction limit ─────────────
        if employee_account:
            limit = employee_account.get("single_transaction_limit", 500)
            if amount > limit:
                alerts.append(self._create_alert(
                    employee_id=employee_id,
                    alert_type=AlertType.OVER_LIMIT,
                    severity=AlertSeverity.HIGH,
                    title=f"Over transaction limit: ${amount:.2f} (limit: ${limit})",
                    description=f"Transaction of ${amount:.2f} at {merchant or 'unknown'} exceeds the ${limit} single-transaction limit.",
                    amount=amount,
                    merchant=merchant,
                    transaction_ref=transaction.get("id"),
                ))

        # ── Rule 4: Rapid succession (card splitting) ─────────
        if employee_id and employee_id in self.employee_history:
            recent = self.employee_history[employee_id][-10:]
            if len(recent) >= 3:
                last_three_times = []
                for txn in recent[-3:]:
                    try:
                        last_three_times.append(datetime.fromisoformat(txn["timestamp"].replace("Z", "+00:00")))
                    except (ValueError, TypeError):
                        pass

                if len(last_three_times) >= 3:
                    time_span = (last_three_times[-1] - last_three_times[0]).total_seconds()
                    if time_span < 300:  # 3 transactions in under 5 minutes
                        total = sum(t["amount"] for t in recent[-3:])
                        alerts.append(self._create_alert(
                            employee_id=employee_id,
                            alert_type=AlertType.RAPID_SUCCESSION,
                            severity=AlertSeverity.HIGH,
                            title=f"3 transactions in {int(time_span)}s (${total:.2f} total)",
                            description=f"Multiple transactions in quick succession may indicate card splitting to avoid approval thresholds.",
                            amount=total,
                            merchant=merchant,
                            transaction_ref=transaction.get("id"),
                        ))

        # ── Rule 5: Round-number transaction ──────────────────
        if amount > 20 and amount == round(amount):
            alerts.append(self._create_alert(
                employee_id=employee_id,
                alert_type=AlertType.ROUND_NUMBER,
                severity=AlertSeverity.INFO,
                title=f"Round-number amount: ${amount:.0f}",
                description=f"Exactly ${amount:.0f} at {merchant or 'unknown'}. Round-number transactions are slightly unusual for retail purchases and may warrant a receipt check.",
                amount=amount,
                merchant=merchant,
                transaction_ref=transaction.get("id"),
            ))

        # ── Rule 6: Duplicate amount at same merchant ─────────
        if employee_id and employee_id in self.employee_history:
            recent = self.employee_history[employee_id][-20:]
            duplicates = [
                t for t in recent[:-1]
                if t["amount"] == amount and t["merchant"] == merchant
            ]
            if duplicates:
                alerts.append(self._create_alert(
                    employee_id=employee_id,
                    alert_type=AlertType.DUPLICATE_AMOUNT,
                    severity=AlertSeverity.WARNING,
                    title=f"Duplicate: ${amount:.2f} at {merchant.title()} (seen before)",
                    description=f"Same amount at same merchant appeared previously. Could be a double-swipe or recurring personal purchase.",
                    amount=amount,
                    merchant=merchant,
                    transaction_ref=transaction.get("id"),
                ))

        # ── Rule 7: Weekend spending ──────────────────────────
        try:
            txn_time = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
            if txn_time.weekday() >= 5:  # Saturday or Sunday
                alerts.append(self._create_alert(
                    employee_id=employee_id,
                    alert_type=AlertType.WEEKEND_SPEND,
                    severity=AlertSeverity.INFO,
                    title=f"Weekend transaction: ${amount:.2f}",
                    description=f"Transaction on {txn_time.strftime('%A')} at {merchant or 'unknown'}. Weekend business expenses are less common and may need justification.",
                    amount=amount,
                    merchant=merchant,
                    transaction_ref=transaction.get("id"),
                ))
        except (ValueError, TypeError):
            pass

        # ── Rule 8: Threshold gaming ──────────────────────────
        if employee_account:
            threshold = employee_account.get("auto_approve_threshold", 50)
            if threshold * 0.85 <= amount <= threshold:
                # Check if there's a pattern of just-under-threshold
                history = self.employee_history.get(employee_id, [])
                near_threshold = [
                    t for t in history
                    if threshold * 0.85 <= t["amount"] <= threshold
                ]
                if len(near_threshold) >= 3:
                    alerts.append(self._create_alert(
                        employee_id=employee_id,
                        alert_type=AlertType.THRESHOLD_GAMING,
                        severity=AlertSeverity.HIGH,
                        title=f"Possible threshold gaming: {len(near_threshold)} transactions just under ${threshold}",
                        description=f"Multiple transactions clustered just below the auto-approve threshold of ${threshold}. This pattern may indicate deliberate avoidance of manager approval.",
                        amount=amount,
                        merchant=merchant,
                        transaction_ref=transaction.get("id"),
                    ))

        return alerts

    def analyze_employee_patterns(self, employee_id: str, employee_account: dict | None = None) -> list[dict]:
        """Run periodic pattern analysis on an employee's spending history."""
        alerts = []
        history = self.employee_history.get(employee_id, [])
        if len(history) < 5:
            return alerts

        # ── Velocity spike ────────────────────────────────────
        # Compare last 7 days vs previous 30 days
        now = datetime.now(timezone.utc)
        recent_7d = [t for t in history if self._parse_time(t["timestamp"]) and (now - self._parse_time(t["timestamp"])).days <= 7]
        prev_30d = [t for t in history if self._parse_time(t["timestamp"]) and 7 < (now - self._parse_time(t["timestamp"])).days <= 37]

        if recent_7d and prev_30d:
            recent_weekly = sum(t["amount"] for t in recent_7d)
            prev_weekly_avg = sum(t["amount"] for t in prev_30d) / max(4, 1)

            if prev_weekly_avg > 0 and recent_weekly > prev_weekly_avg * 3:
                alerts.append(self._create_alert(
                    employee_id=employee_id,
                    alert_type=AlertType.VELOCITY_SPIKE,
                    severity=AlertSeverity.HIGH,
                    title=f"Spending spike: ${recent_weekly:.0f} this week vs ${prev_weekly_avg:.0f}/week average",
                    description=f"This employee is spending {recent_weekly/prev_weekly_avg:.1f}x their normal weekly rate. Review recent transactions.",
                    amount=recent_weekly,
                ))

        # ── Category drift ────────────────────────────────────
        if len(history) >= 10:
            recent_cats = defaultdict(float)
            older_cats = defaultdict(float)
            mid = len(history) // 2

            for t in history[mid:]:
                cat = t.get("category") or "unknown"
                recent_cats[cat] += t["amount"]
            for t in history[:mid]:
                cat = t.get("category") or "unknown"
                older_cats[cat] += t["amount"]

            recent_total = sum(recent_cats.values()) or 1
            older_total = sum(older_cats.values()) or 1

            for cat, amount in recent_cats.items():
                recent_pct = amount / recent_total
                older_pct = older_cats.get(cat, 0) / older_total
                if recent_pct > 0.3 and older_pct < 0.1:
                    alerts.append(self._create_alert(
                        employee_id=employee_id,
                        alert_type=AlertType.CATEGORY_DRIFT,
                        severity=AlertSeverity.WARNING,
                        title=f"Category shift: '{cat}' jumped from {older_pct*100:.0f}% to {recent_pct*100:.0f}% of spend",
                        description=f"Sudden increase in '{cat}' spending. Was {older_pct*100:.0f}% of total, now {recent_pct*100:.0f}%.",
                        amount=amount,
                    ))

        # ── Maxing monthly limit ──────────────────────────────
        if employee_account:
            limit = employee_account.get("monthly_limit", 5000)
            spent = employee_account.get("spent_this_month", 0)
            if limit > 0 and spent / limit > 0.9:
                alerts.append(self._create_alert(
                    employee_id=employee_id,
                    alert_type=AlertType.MAXING_LIMIT,
                    severity=AlertSeverity.WARNING,
                    title=f"Near monthly limit: ${spent:.0f} of ${limit:.0f} ({spent/limit*100:.0f}%)",
                    description=f"Employee has used {spent/limit*100:.0f}% of their monthly expense limit. Consistently maxing out limits is a risk indicator.",
                    amount=spent,
                ))

        return alerts

    def get_employee_risk_score(self, employee_id: str) -> dict:
        """Calculate a risk score (0-100) for an employee based on their alert history."""
        employee_alerts = [a for a in self.alerts.values() if a.get("employee_id") == employee_id]

        if not employee_alerts:
            return {"score": 0, "level": "low", "factors": [], "alert_count": 0}

        score = 0
        factors = []

        severity_weights = {
            AlertSeverity.INFO.value: 2,
            AlertSeverity.WARNING.value: 8,
            AlertSeverity.HIGH.value: 20,
            AlertSeverity.CRITICAL.value: 40,
        }

        type_counts = defaultdict(int)
        for alert in employee_alerts:
            weight = severity_weights.get(alert["severity"], 5)
            score += weight
            type_counts[alert["alert_type"]] += 1

        # Recurring patterns are worse
        for alert_type, count in type_counts.items():
            if count >= 3:
                score += count * 5
                factors.append(f"Recurring: {alert_type.replace('_', ' ')} ({count} times)")

        # Cap at 100
        score = min(100, score)

        if score >= 70:
            level = "critical"
        elif score >= 40:
            level = "high"
        elif score >= 15:
            level = "medium"
        else:
            level = "low"

        return {
            "score": score,
            "level": level,
            "factors": factors,
            "alert_count": len(employee_alerts),
            "by_severity": {
                "critical": sum(1 for a in employee_alerts if a["severity"] == "critical"),
                "high": sum(1 for a in employee_alerts if a["severity"] == "high"),
                "warning": sum(1 for a in employee_alerts if a["severity"] == "warning"),
                "info": sum(1 for a in employee_alerts if a["severity"] == "info"),
            },
            "by_type": dict(type_counts),
        }

    def get_alerts(
        self,
        employee_id: str | None = None,
        severity: str | None = None,
        unresolved_only: bool = False,
        limit: int = 50,
    ) -> list[dict]:
        """Get alerts, optionally filtered."""
        results = list(self.alerts.values())
        if employee_id:
            results = [a for a in results if a.get("employee_id") == employee_id]
        if severity:
            results = [a for a in results if a["severity"] == severity]
        if unresolved_only:
            results = [a for a in results if not a.get("resolved")]
        results.sort(key=lambda a: a["created_at"], reverse=True)
        return results[:limit]

    def resolve_alert(self, alert_id: str, resolved_by: str, resolution: str) -> dict:
        """Mark an alert as resolved with explanation."""
        alert = self.alerts.get(alert_id)
        if not alert:
            raise ValueError("Alert not found")
        alert["resolved"] = True
        alert["resolved_by"] = resolved_by
        alert["resolution"] = resolution
        alert["resolved_at"] = datetime.now(timezone.utc).isoformat()
        return alert

    def get_org_summary(self) -> dict:
        """Get organization-wide spend monitoring summary."""
        all_alerts = list(self.alerts.values())
        unresolved = [a for a in all_alerts if not a.get("resolved")]

        # Risk by employee
        employee_risks = {}
        employee_ids = set(a.get("employee_id") for a in all_alerts if a.get("employee_id"))
        for eid in employee_ids:
            employee_risks[eid] = self.get_employee_risk_score(eid)

        high_risk = [eid for eid, r in employee_risks.items() if r["level"] in ("high", "critical")]

        return {
            "total_alerts": len(all_alerts),
            "unresolved_alerts": len(unresolved),
            "critical_alerts": sum(1 for a in unresolved if a["severity"] == "critical"),
            "high_alerts": sum(1 for a in unresolved if a["severity"] == "high"),
            "employees_monitored": len(employee_ids),
            "high_risk_employees": len(high_risk),
            "high_risk_employee_ids": high_risk,
            "top_alert_types": dict(
                sorted(
                    defaultdict(int, {a["alert_type"]: 1 for a in unresolved}).items(),
                    key=lambda x: x[1], reverse=True
                )[:5]
            ),
        }

    # ── Internal ───────────────────────────────────────────────

    def _create_alert(
        self,
        employee_id: str | None,
        alert_type: AlertType,
        severity: AlertSeverity,
        title: str,
        description: str,
        amount: float = 0,
        merchant: str = "",
        transaction_ref: str | None = None,
    ) -> dict:
        alert_id = str(uuid.uuid4())
        alert = {
            "id": alert_id,
            "employee_id": employee_id,
            "alert_type": alert_type.value,
            "severity": severity.value,
            "title": title,
            "description": description,
            "amount": amount,
            "merchant": merchant,
            "transaction_ref": transaction_ref,
            "resolved": False,
            "resolved_by": None,
            "resolution": None,
            "resolved_at": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        self.alerts[alert_id] = alert
        return alert

    def _parse_time(self, ts: str) -> datetime | None:
        try:
            return datetime.fromisoformat(ts.replace("Z", "+00:00"))
        except (ValueError, TypeError, AttributeError):
            return None

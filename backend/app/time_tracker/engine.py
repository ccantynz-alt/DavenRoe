"""Time Tracker Engine — simple start/stop timers with invoicing integration.

Designed to be dead simple:
  - One button to start, one to stop
  - Auto-calculates billable amount
  - One click to add time to an invoice
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone, timedelta
from enum import Enum


class TimeEntryStatus(str, Enum):
    RUNNING = "running"
    STOPPED = "stopped"
    INVOICED = "invoiced"


class TimeTrackerEngine:
    """Manages time entries with start/stop timers."""

    def __init__(self):
        self.entries: dict[str, dict] = {}
        self.active_timers: dict[str, str] = {}  # user_id -> entry_id

    def start_timer(
        self,
        user_id: str,
        client_name: str = "",
        project_name: str = "",
        description: str = "",
        hourly_rate: float = 0,
        billable: bool = True,
    ) -> dict:
        """Start a new timer. Stops any existing running timer first."""
        # Auto-stop any running timer
        if user_id in self.active_timers:
            self.stop_timer(user_id)

        entry_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)

        entry = {
            "id": entry_id,
            "user_id": user_id,
            "client_name": client_name,
            "project_name": project_name,
            "description": description,
            "hourly_rate": hourly_rate,
            "billable": billable,
            "status": TimeEntryStatus.RUNNING.value,
            "started_at": now.isoformat(),
            "stopped_at": None,
            "duration_seconds": 0,
            "duration_display": "00:00:00",
            "billable_amount": 0,
            "invoiced": False,
            "invoice_id": None,
        }

        self.entries[entry_id] = entry
        self.active_timers[user_id] = entry_id
        return entry

    def stop_timer(self, user_id: str) -> dict | None:
        """Stop the currently running timer for a user."""
        entry_id = self.active_timers.get(user_id)
        if not entry_id:
            return None

        entry = self.entries.get(entry_id)
        if not entry or entry["status"] != TimeEntryStatus.RUNNING.value:
            return None

        now = datetime.now(timezone.utc)
        started = datetime.fromisoformat(entry["started_at"])
        duration = (now - started).total_seconds()

        entry["status"] = TimeEntryStatus.STOPPED.value
        entry["stopped_at"] = now.isoformat()
        entry["duration_seconds"] = int(duration)
        entry["duration_display"] = self._format_duration(int(duration))
        entry["billable_amount"] = round(duration / 3600 * entry["hourly_rate"], 2) if entry["billable"] else 0

        del self.active_timers[user_id]
        return entry

    def get_active_timer(self, user_id: str) -> dict | None:
        """Get the currently running timer for a user, with live duration."""
        entry_id = self.active_timers.get(user_id)
        if not entry_id:
            return None

        entry = self.entries.get(entry_id)
        if not entry:
            return None

        # Calculate live duration
        now = datetime.now(timezone.utc)
        started = datetime.fromisoformat(entry["started_at"])
        duration = int((now - started).total_seconds())
        entry["duration_seconds"] = duration
        entry["duration_display"] = self._format_duration(duration)
        entry["billable_amount"] = round(duration / 3600 * entry["hourly_rate"], 2) if entry["billable"] else 0

        return entry

    def add_manual_entry(
        self,
        user_id: str,
        date: str,
        hours: float,
        minutes: float = 0,
        client_name: str = "",
        project_name: str = "",
        description: str = "",
        hourly_rate: float = 0,
        billable: bool = True,
    ) -> dict:
        """Add a manual time entry (for time already worked)."""
        entry_id = str(uuid.uuid4())
        total_seconds = int((hours * 3600) + (minutes * 60))

        entry = {
            "id": entry_id,
            "user_id": user_id,
            "client_name": client_name,
            "project_name": project_name,
            "description": description,
            "hourly_rate": hourly_rate,
            "billable": billable,
            "status": TimeEntryStatus.STOPPED.value,
            "started_at": date,
            "stopped_at": date,
            "duration_seconds": total_seconds,
            "duration_display": self._format_duration(total_seconds),
            "billable_amount": round(total_seconds / 3600 * hourly_rate, 2) if billable else 0,
            "invoiced": False,
            "invoice_id": None,
        }

        self.entries[entry_id] = entry
        return entry

    def update_entry(self, entry_id: str, updates: dict) -> dict:
        """Update a time entry."""
        entry = self.entries.get(entry_id)
        if not entry:
            raise ValueError("Time entry not found")

        for key in ["client_name", "project_name", "description", "hourly_rate", "billable"]:
            if key in updates:
                entry[key] = updates[key]

        # Recalculate billable amount if rate changed
        if "hourly_rate" in updates or "billable" in updates:
            if entry["billable"]:
                entry["billable_amount"] = round(entry["duration_seconds"] / 3600 * entry["hourly_rate"], 2)
            else:
                entry["billable_amount"] = 0

        return entry

    def delete_entry(self, entry_id: str) -> bool:
        """Delete a time entry."""
        if entry_id in self.entries:
            entry = self.entries[entry_id]
            # Remove from active timers if running
            if entry["status"] == TimeEntryStatus.RUNNING.value:
                for uid, eid in list(self.active_timers.items()):
                    if eid == entry_id:
                        del self.active_timers[uid]
            del self.entries[entry_id]
            return True
        return False

    def list_entries(
        self,
        user_id: str,
        client_name: str | None = None,
        project_name: str | None = None,
        billable_only: bool = False,
        date_from: str | None = None,
        date_to: str | None = None,
    ) -> list[dict]:
        """List time entries with optional filters."""
        results = [e for e in self.entries.values() if e["user_id"] == user_id]

        if client_name:
            results = [e for e in results if e["client_name"].lower() == client_name.lower()]
        if project_name:
            results = [e for e in results if e["project_name"].lower() == project_name.lower()]
        if billable_only:
            results = [e for e in results if e["billable"]]

        return sorted(results, key=lambda x: x["started_at"], reverse=True)

    def get_summary(self, user_id: str, period: str = "week") -> dict:
        """Get a summary of time tracked."""
        entries = [e for e in self.entries.values() if e["user_id"] == user_id]

        total_seconds = sum(e["duration_seconds"] for e in entries)
        billable_seconds = sum(e["duration_seconds"] for e in entries if e["billable"])
        total_amount = sum(e["billable_amount"] for e in entries)
        uninvoiced_amount = sum(e["billable_amount"] for e in entries if not e["invoiced"] and e["billable"])

        # By client
        by_client = {}
        for e in entries:
            cn = e["client_name"] or "No Client"
            if cn not in by_client:
                by_client[cn] = {"hours": 0, "amount": 0, "entries": 0}
            by_client[cn]["hours"] += e["duration_seconds"] / 3600
            by_client[cn]["amount"] += e["billable_amount"]
            by_client[cn]["entries"] += 1

        # By project
        by_project = {}
        for e in entries:
            pn = e["project_name"] or "No Project"
            if pn not in by_project:
                by_project[pn] = {"hours": 0, "amount": 0}
            by_project[pn]["hours"] += e["duration_seconds"] / 3600
            by_project[pn]["amount"] += e["billable_amount"]

        return {
            "total_hours": round(total_seconds / 3600, 2),
            "billable_hours": round(billable_seconds / 3600, 2),
            "non_billable_hours": round((total_seconds - billable_seconds) / 3600, 2),
            "utilization": round(billable_seconds / total_seconds * 100, 1) if total_seconds > 0 else 0,
            "total_amount": round(total_amount, 2),
            "uninvoiced_amount": round(uninvoiced_amount, 2),
            "total_entries": len(entries),
            "by_client": {k: {kk: round(vv, 2) for kk, vv in v.items()} for k, v in by_client.items()},
            "by_project": {k: {kk: round(vv, 2) for kk, vv in v.items()} for k, v in by_project.items()},
        }

    def mark_invoiced(self, entry_ids: list[str], invoice_id: str) -> int:
        """Mark time entries as invoiced."""
        count = 0
        for eid in entry_ids:
            entry = self.entries.get(eid)
            if entry and not entry["invoiced"]:
                entry["invoiced"] = True
                entry["invoice_id"] = invoice_id
                entry["status"] = TimeEntryStatus.INVOICED.value
                count += 1
        return count

    def _format_duration(self, seconds: int) -> str:
        """Format seconds as HH:MM:SS."""
        h = seconds // 3600
        m = (seconds % 3600) // 60
        s = seconds % 60
        return f"{h:02d}:{m:02d}:{s:02d}"

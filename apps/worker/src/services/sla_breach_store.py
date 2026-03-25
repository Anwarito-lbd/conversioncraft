import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List


class SlaBreachStore:
    def __init__(self, path: str | None = None):
        self.path = Path(path) if path else Path(__file__).resolve().parents[2] / "data" / "sla_breaches.json"
        self.path.parent.mkdir(parents=True, exist_ok=True)
        if not self.path.exists():
            self.path.write_text("{}", encoding="utf-8")

    def _read(self) -> Dict[str, Any]:
        try:
            return json.loads(self.path.read_text(encoding="utf-8") or "{}")
        except Exception:
            return {}

    def _write(self, payload: Dict[str, Any]) -> None:
        self.path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    def list(self, org_id: str, limit: int = 200) -> List[Dict[str, Any]]:
        rows = self._read().get(org_id, [])
        rows = sorted(rows, key=lambda row: str(row.get("opened_at", "")), reverse=True)
        return rows[: max(1, min(limit, 1000))]

    def open_or_get(self, org_id: str, breach_type: str) -> Dict[str, Any]:
        state = self._read()
        rows = state.setdefault(org_id, [])
        now = datetime.now(timezone.utc).isoformat()
        for row in rows:
            if str(row.get("type", "")) == breach_type and str(row.get("status", "")) == "open":
                row["last_seen_at"] = now
                state[org_id] = rows
                self._write(state)
                return row
        row = {
            "breach_id": str(uuid.uuid4()),
            "type": breach_type,
            "status": "open",
            "opened_at": now,
            "last_seen_at": now,
            "resolved_at": None,
            "first_acked_at": None,
        }
        rows.append(row)
        state[org_id] = rows
        self._write(state)
        return row

    def resolve_absent(self, org_id: str, active_types: List[str]) -> List[Dict[str, Any]]:
        state = self._read()
        rows = state.get(org_id, [])
        resolved: List[Dict[str, Any]] = []
        now = datetime.now(timezone.utc).isoformat()
        active_set = set(active_types)
        for row in rows:
            if str(row.get("status", "")) != "open":
                continue
            if str(row.get("type", "")) in active_set:
                continue
            row["status"] = "resolved"
            row["resolved_at"] = now
            resolved.append(row)
        state[org_id] = rows
        self._write(state)
        return resolved

    def set_first_ack(self, org_id: str, breach_id: str, acked_at: str) -> Dict[str, Any]:
        state = self._read()
        rows = state.get(org_id, [])
        for row in rows:
            if str(row.get("breach_id", "")) != breach_id:
                continue
            if not row.get("first_acked_at"):
                row["first_acked_at"] = acked_at
                state[org_id] = rows
                self._write(state)
            return row
        return {}


sla_breach_store = SlaBreachStore()

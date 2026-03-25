import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List


class AlertEventStore:
    def __init__(self, path: str | None = None):
        self.path = Path(path) if path else Path(__file__).resolve().parents[2] / "data" / "alert_events.json"
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

    def list_events(self, org_id: str, limit: int = 100, status: str | None = None) -> List[Dict[str, Any]]:
        rows = self._read().get(org_id, [])
        if status:
            rows = [row for row in rows if str(row.get("status", "")) == status]
        rows = sorted(rows, key=lambda row: str(row.get("created_at", "")), reverse=True)
        return rows[: max(1, min(limit, 500))]

    def append_event(self, org_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        state = self._read()
        rows = state.setdefault(org_id, [])
        event = {
            "event_id": str(uuid.uuid4()),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "status": "dispatched",
            **payload,
        }
        rows.append(event)
        state[org_id] = rows[-5000:]
        self._write(state)
        return event

    def has_recent_signature(self, org_id: str, signature: str, since_iso: str) -> bool:
        for row in self._read().get(org_id, []):
            if str(row.get("signature", "")) != signature:
                continue
            if str(row.get("created_at", "")) >= since_iso:
                return True
        return False

    def count_recent(
        self,
        org_id: str,
        *,
        since_iso: str,
        severity: str | None = None,
        scope: str | None = None,
        status: str | None = None,
    ) -> int:
        count = 0
        for row in self._read().get(org_id, []):
            if str(row.get("created_at", "")) < since_iso:
                continue
            if severity and str(row.get("severity", "")) != severity:
                continue
            if scope and str(row.get("scope", "")) != scope:
                continue
            if status and str(row.get("status", "")) != status:
                continue
            count += 1
        return count

    def ack(self, org_id: str, event_id: str, actor_user_id: str) -> Dict[str, Any]:
        state = self._read()
        rows = state.get(org_id, [])
        for row in rows:
            if str(row.get("event_id", "")) != event_id:
                continue
            row["status"] = "acknowledged"
            row["acked_by"] = actor_user_id
            row["acked_at"] = datetime.now(timezone.utc).isoformat()
            state[org_id] = rows
            self._write(state)
            return row
        return {}


alert_event_store = AlertEventStore()

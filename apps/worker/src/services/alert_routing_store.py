import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List


class AlertRoutingStore:
    def __init__(self, path: str | None = None):
        self.path = Path(path) if path else Path(__file__).resolve().parents[2] / "data" / "alert_routing.json"
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

    def get(self, org_id: str) -> Dict[str, Any]:
        return self._read().get(org_id, {})

    def upsert(self, org_id: str, actor_user_id: str, routes: List[Dict[str, Any]]) -> Dict[str, Any]:
        state = self._read()
        row = {
            "org_id": org_id,
            "routes": routes,
            "updated_by": actor_user_id,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        state[org_id] = row
        self._write(state)
        return row


alert_routing_store = AlertRoutingStore()

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional


DEFAULT_CONTROLS: Dict[str, Any] = {
    "optimizer_execute_enabled": True,
    "copilot_execute_enabled": True,
    "autopilot_launch_enabled": True,
    "max_optimizer_actions_per_run": 50,
    "max_copilot_actions_per_run": 50,
}


class OpsControlStore:
    def __init__(self, path: str | None = None):
        self.path = Path(path) if path else Path(__file__).resolve().parents[2] / "data" / "ops_controls.json"
        self.path.parent.mkdir(parents=True, exist_ok=True)
        if not self.path.exists():
            self.path.write_text(json.dumps({"global": {}, "org_overrides": {}}, indent=2), encoding="utf-8")

    def _read(self) -> Dict[str, Any]:
        try:
            raw = json.loads(self.path.read_text(encoding="utf-8") or "{}")
        except Exception:
            raw = {}
        return {
            "global": raw.get("global", {}) if isinstance(raw.get("global", {}), dict) else {},
            "org_overrides": raw.get("org_overrides", {}) if isinstance(raw.get("org_overrides", {}), dict) else {},
            "updated_at": raw.get("updated_at"),
            "updated_by": raw.get("updated_by"),
        }

    def _write(self, payload: Dict[str, Any]) -> None:
        self.path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    def get(self, org_id: Optional[str] = None) -> Dict[str, Any]:
        state = self._read()
        controls: Dict[str, Any] = {**DEFAULT_CONTROLS}
        controls.update(state.get("global", {}))

        if org_id:
            org_overrides = state.get("org_overrides", {})
            if isinstance(org_overrides, dict):
                controls.update(org_overrides.get(org_id, {}))

        return controls

    def upsert(self, actor_user_id: str, controls: Dict[str, Any], org_id: Optional[str] = None) -> Dict[str, Any]:
        state = self._read()
        target_key = "global"
        if org_id:
            target_key = org_id
            org_overrides = state.setdefault("org_overrides", {})
            if not isinstance(org_overrides, dict):
                org_overrides = {}
                state["org_overrides"] = org_overrides
            org_overrides[target_key] = controls
        else:
            state["global"] = controls

        now = datetime.now(timezone.utc).isoformat()
        state["updated_at"] = now
        state["updated_by"] = actor_user_id
        self._write(state)

        return {
            "scope": "org" if org_id else "global",
            "org_id": org_id,
            "controls": self.get(org_id),
            "updated_at": now,
            "updated_by": actor_user_id,
        }


ops_control_store = OpsControlStore()

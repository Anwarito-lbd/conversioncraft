import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict


class OnboardingStateStore:
    def __init__(self, path: str | None = None):
        self.path = Path(path) if path else Path(__file__).resolve().parents[2] / "data" / "onboarding_state.json"
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

    def get(self, user_id: str) -> Dict[str, Any]:
        return self._read().get(user_id, {})

    def list_by_org(self, org_id: str) -> Dict[str, Any]:
        out: Dict[str, Any] = {}
        for user_id, row in self._read().items():
            if str(row.get("org_id", "")) == org_id:
                out[user_id] = row
        return out

    def upsert(
        self,
        user_id: str,
        state: Dict[str, Any],
        org_id: str | None = None,
        expected_version: int | None = None,
    ) -> Dict[str, Any]:
        all_state = self._read()
        current = all_state.get(user_id, {})
        current_version = int(current.get("version", 0) or 0)
        if expected_version is not None and expected_version != current_version:
            raise ValueError(f"version_conflict:{current_version}")
        row = {
            "user_id": user_id,
            "org_id": org_id or current.get("org_id", ""),
            "state": state,
            "version": current_version + 1,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        all_state[user_id] = row
        self._write(all_state)
        return row


onboarding_state_store = OnboardingStateStore()

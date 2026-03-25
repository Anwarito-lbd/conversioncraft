import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, Optional


class OAuthStateStore:
    def __init__(self, path: str | None = None):
        if path:
            self.path = Path(path)
        else:
            self.path = Path(__file__).resolve().parents[2] / "data" / "oauth_states.json"
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

    def create(
        self,
        user_id: str,
        platform: str,
        state: str,
        nonce: str,
        redirect_uri: str,
        shop: Optional[str],
        ttl_seconds: int = 900,
    ) -> Dict[str, Any]:
        all_states = self._read()
        all_states[state] = {
            "user_id": user_id,
            "platform": platform,
            "nonce": nonce,
            "redirect_uri": redirect_uri,
            "shop": shop,
            "expires_at": (datetime.now(timezone.utc) + timedelta(seconds=ttl_seconds)).isoformat(),
        }
        self._write(all_states)
        return all_states[state]

    def consume(self, state: str, user_id: str, platform: str, nonce: Optional[str] = None) -> Dict[str, Any]:
        all_states = self._read()
        payload = all_states.pop(state, None)
        self._write(all_states)

        if not payload:
            raise ValueError("Invalid or expired OAuth state")

        expires_at = datetime.fromisoformat(payload["expires_at"])
        if datetime.now(timezone.utc) > expires_at:
            raise ValueError("OAuth state expired")

        if payload.get("user_id") != user_id:
            raise ValueError("OAuth state user mismatch")

        if payload.get("platform") != platform:
            raise ValueError("OAuth state platform mismatch")

        if nonce and payload.get("nonce") != nonce:
            raise ValueError("OAuth nonce mismatch")

        return payload


state_store = OAuthStateStore()

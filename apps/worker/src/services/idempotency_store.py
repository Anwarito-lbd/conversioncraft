import hashlib
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, Tuple


class IdempotencyStore:
    def __init__(self, path: str | None = None):
        self.path = Path(path) if path else Path(__file__).resolve().parents[2] / "data" / "idempotency.json"
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

    def _cleanup(self, data: Dict[str, Any]) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        cleaned: Dict[str, Any] = {}
        for key, row in data.items():
            expires_at = row.get("expires_at") if isinstance(row, dict) else None
            if not expires_at:
                continue
            try:
                exp = datetime.fromisoformat(expires_at)
            except Exception:
                continue
            if exp > now:
                cleaned[key] = row
        return cleaned

    def hash_payload(self, payload: Dict[str, Any]) -> str:
        canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"))
        return hashlib.sha256(canonical.encode("utf-8")).hexdigest()

    def get_replay_or_conflict(self, key: str, request_hash: str) -> Tuple[bool, Dict[str, Any] | None]:
        state = self._cleanup(self._read())
        row = state.get(key)
        if not row:
            return False, None

        existing_hash = str(row.get("request_hash", ""))
        if existing_hash and existing_hash != request_hash:
            raise ValueError("Idempotency key reuse with different request payload")

        if row.get("status") == "completed" and isinstance(row.get("response"), dict):
            return True, row.get("response")

        return False, None

    def reserve(self, key: str, request_hash: str, ttl_seconds: int = 86400) -> None:
        state = self._cleanup(self._read())
        now = datetime.now(timezone.utc)
        state[key] = {
            "request_hash": request_hash,
            "status": "processing",
            "created_at": now.isoformat(),
            "expires_at": (now + timedelta(seconds=ttl_seconds)).isoformat(),
        }
        self._write(state)

    def complete(self, key: str, request_hash: str, response: Dict[str, Any], ttl_seconds: int = 86400) -> None:
        state = self._cleanup(self._read())
        now = datetime.now(timezone.utc)
        state[key] = {
            "request_hash": request_hash,
            "status": "completed",
            "response": response,
            "created_at": now.isoformat(),
            "expires_at": (now + timedelta(seconds=ttl_seconds)).isoformat(),
        }
        self._write(state)


idempotency_store = IdempotencyStore()

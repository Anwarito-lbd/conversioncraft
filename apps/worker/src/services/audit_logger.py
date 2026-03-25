import json
import hashlib
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict


class AuditLogger:
    def __init__(self, path: str | None = None):
        if path:
            self.path = Path(path)
        else:
            self.path = Path(__file__).resolve().parents[2] / "data" / "audit.log.jsonl"
        self.path.parent.mkdir(parents=True, exist_ok=True)
        if not self.path.exists():
            self.path.write_text("", encoding="utf-8")

    def log(self, event: str, user_id: str, metadata: Dict[str, Any] | None = None) -> None:
        payload = {
            "ts": datetime.now(timezone.utc).isoformat(),
            "event": event,
            "user_id": user_id,
            "metadata": metadata or {},
        }
        with self.path.open("a", encoding="utf-8") as fp:
            fp.write(json.dumps(payload) + "\n")

    def read_recent(self, limit: int = 100, user_id: str | None = None) -> list[Dict[str, Any]]:
        try:
            lines = self.path.read_text(encoding="utf-8").splitlines()
        except Exception:
            return []

        records: list[Dict[str, Any]] = []
        for line in reversed(lines):
            try:
                row = json.loads(line)
            except json.JSONDecodeError:
                continue
            if user_id and row.get("user_id") != user_id:
                continue
            records.append(row)
            if len(records) >= max(1, min(limit, 1000)):
                break
        return records

    def export_immutable(self, limit: int = 5000, user_id: str | None = None) -> Dict[str, Any]:
        records = self.read_recent(limit=limit, user_id=user_id)
        records = list(reversed(records))

        chain: list[Dict[str, Any]] = []
        previous_hash = "0" * 64
        for row in records:
            canonical = json.dumps(row, sort_keys=True, separators=(",", ":"))
            digest = hashlib.sha256((previous_hash + canonical).encode("utf-8")).hexdigest()
            chain.append(
                {
                    "entry": row,
                    "prev_hash": previous_hash,
                    "hash": digest,
                }
            )
            previous_hash = digest

        export = {
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "count": len(chain),
            "root_hash": previous_hash,
            "chain": chain,
        }
        export_path = self.path.parent / f"audit_export_{int(datetime.now(timezone.utc).timestamp())}.json"
        export_path.write_text(json.dumps(export, indent=2), encoding="utf-8")
        return {
            "path": str(export_path),
            "count": len(chain),
            "root_hash": previous_hash,
        }


audit_logger = AuditLogger()

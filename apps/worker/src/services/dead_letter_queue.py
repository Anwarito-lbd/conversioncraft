import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List


class DeadLetterQueue:
    def __init__(self, path: str | None = None):
        self.path = Path(path) if path else Path(__file__).resolve().parents[2] / "data" / "dead_letter_queue.jsonl"
        self.path.parent.mkdir(parents=True, exist_ok=True)
        if not self.path.exists():
            self.path.write_text("", encoding="utf-8")

    def enqueue(
        self,
        queue: str,
        user_id: str,
        payload: Dict[str, Any],
        error: str,
        context: Dict[str, Any] | None = None,
    ) -> None:
        row = {
            "ts": datetime.now(timezone.utc).isoformat(),
            "queue": queue,
            "user_id": user_id,
            "payload": payload,
            "error": error,
            "context": context or {},
        }
        with self.path.open("a", encoding="utf-8") as fp:
            fp.write(json.dumps(row) + "\n")

    def recent(self, limit: int = 100) -> List[Dict[str, Any]]:
        try:
            lines = self.path.read_text(encoding="utf-8").splitlines()
        except Exception:
            return []

        rows: List[Dict[str, Any]] = []
        for line in reversed(lines):
            try:
                rows.append(json.loads(line))
            except json.JSONDecodeError:
                continue
            if len(rows) >= max(1, min(limit, 1000)):
                break
        return rows


dead_letter_queue = DeadLetterQueue()

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List


class SkuCatalogStore:
    def __init__(self, path: str | None = None):
        self.path = Path(path) if path else Path(__file__).resolve().parents[2] / "data" / "sku_catalog.json"
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

    def upsert_skus(self, user_id: str, skus: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        state = self._read()
        normalized = []
        for item in skus:
            price = float(item.get("price", 0) or 0)
            cost = float(item.get("cost", 0) or 0)
            sku = {
                "sku": str(item.get("sku", "")),
                "name": str(item.get("name", "")),
                "price": price,
                "cost": cost,
                "inventory": int(item.get("inventory", 0) or 0),
                "category": str(item.get("category", "general")),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
            normalized.append(sku)

        state[user_id] = normalized
        self._write(state)
        return normalized

    def list_skus(self, user_id: str) -> List[Dict[str, Any]]:
        return self._read().get(user_id, [])


sku_catalog_store = SkuCatalogStore()

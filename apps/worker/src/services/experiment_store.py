import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List


class ExperimentStore:
    def __init__(self, path: str | None = None):
        self.path = Path(path) if path else Path(__file__).resolve().parents[2] / "data" / "experiments.json"
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

    def list_user_ids(self) -> List[str]:
        return list(self._read().keys())

    def list_experiments(self, user_id: str) -> List[Dict[str, Any]]:
        return self._read().get(user_id, [])

    def create_experiment(
        self,
        user_id: str,
        name: str,
        variants: List[Dict[str, Any]],
        rules: Dict[str, Any],
    ) -> Dict[str, Any]:
        state = self._read()
        rows = state.setdefault(user_id, [])

        now = datetime.now(timezone.utc).isoformat()
        variant_count = max(1, len(variants))
        default_weight = 1.0 / variant_count
        experiment = {
            "experiment_id": str(uuid.uuid4()),
            "name": name,
            "status": "running",
            "winner_variant_id": "",
            "created_at": now,
            "updated_at": now,
            "rules": {
                "metric": str(rules.get("metric", "cvr")),
                "min_impressions": int(rules.get("min_impressions", 500) or 500),
                "min_lift_pct": float(rules.get("min_lift_pct", 10) or 10),
                "max_p_value": float(rules.get("max_p_value", 0.05) or 0.05),
                "auto_promote": bool(rules.get("auto_promote", True)),
                "min_explore_weight": float(rules.get("min_explore_weight", 0.05) or 0.05),
                "rebalance_temperature": float(rules.get("rebalance_temperature", 6.0) or 6.0),
            },
            "variants": [
                {
                    "variant_id": str(v.get("variant_id", "")),
                    "name": str(v.get("name", "")),
                    "offer_type": str(v.get("offer_type", "")),
                    "is_live": bool(v.get("is_live", False)),
                    "traffic_weight": float(v.get("traffic_weight", default_weight) or default_weight),
                    "metrics": {
                        "impressions": 0,
                        "conversions": 0,
                        "revenue": 0.0,
                        "spend": 0.0,
                    },
                }
                for v in variants
            ],
        }
        rows.append(experiment)
        state[user_id] = rows
        self._write(state)
        return experiment

    def get_experiment(self, user_id: str, experiment_id: str) -> Dict[str, Any]:
        rows = self.list_experiments(user_id)
        for row in rows:
            if str(row.get("experiment_id", "")) == experiment_id:
                return row
        return {}

    def upsert_variant_metrics(self, user_id: str, experiment_id: str, metrics: List[Dict[str, Any]]) -> Dict[str, Any]:
        state = self._read()
        rows = state.get(user_id, [])
        metric_map = {str(m.get("variant_id", "")): m for m in metrics}

        target = {}
        for row in rows:
            if str(row.get("experiment_id", "")) != experiment_id:
                continue
            for variant in row.get("variants", []):
                variant_id = str(variant.get("variant_id", ""))
                if variant_id not in metric_map:
                    continue
                m = metric_map[variant_id]
                merged = {
                    "impressions": int(m.get("impressions", variant.get("metrics", {}).get("impressions", 0)) or 0),
                    "conversions": int(m.get("conversions", variant.get("metrics", {}).get("conversions", 0)) or 0),
                    "revenue": float(m.get("revenue", variant.get("metrics", {}).get("revenue", 0)) or 0),
                    "spend": float(m.get("spend", variant.get("metrics", {}).get("spend", 0)) or 0),
                }
                variant["metrics"] = merged
            row["updated_at"] = datetime.now(timezone.utc).isoformat()
            target = row
            break

        state[user_id] = rows
        self._write(state)
        return target

    def increment_variant_metrics(
        self,
        user_id: str,
        experiment_id: str,
        variant_id: str,
        *,
        impressions: int = 0,
        conversions: int = 0,
        revenue: float = 0.0,
        spend: float = 0.0,
    ) -> Dict[str, Any]:
        state = self._read()
        rows = state.get(user_id, [])
        target = {}
        for row in rows:
            if str(row.get("experiment_id", "")) != experiment_id:
                continue
            for variant in row.get("variants", []):
                if str(variant.get("variant_id", "")) != variant_id:
                    continue
                metrics = variant.setdefault(
                    "metrics",
                    {"impressions": 0, "conversions": 0, "revenue": 0.0, "spend": 0.0},
                )
                metrics["impressions"] = int(metrics.get("impressions", 0) or 0) + int(impressions or 0)
                metrics["conversions"] = int(metrics.get("conversions", 0) or 0) + int(conversions or 0)
                metrics["revenue"] = float(metrics.get("revenue", 0) or 0) + float(revenue or 0)
                metrics["spend"] = float(metrics.get("spend", 0) or 0) + float(spend or 0)
            row["updated_at"] = datetime.now(timezone.utc).isoformat()
            target = row
            break

        state[user_id] = rows
        self._write(state)
        return target

    def set_variant_weights(self, user_id: str, experiment_id: str, weights: Dict[str, float]) -> Dict[str, Any]:
        state = self._read()
        rows = state.get(user_id, [])
        target = {}
        for row in rows:
            if str(row.get("experiment_id", "")) != experiment_id:
                continue
            total = 0.0
            for variant in row.get("variants", []):
                weight = float(weights.get(str(variant.get("variant_id", "")), 0.0) or 0.0)
                variant["traffic_weight"] = max(0.0, weight)
                total += variant["traffic_weight"]
            if total > 0:
                for variant in row.get("variants", []):
                    variant["traffic_weight"] = float(variant.get("traffic_weight", 0.0) or 0.0) / total
            row["updated_at"] = datetime.now(timezone.utc).isoformat()
            target = row
            break
        state[user_id] = rows
        self._write(state)
        return target

    def save_experiment(self, user_id: str, experiment: Dict[str, Any]) -> None:
        state = self._read()
        rows = state.get(user_id, [])
        updated = []
        for row in rows:
            if str(row.get("experiment_id", "")) == str(experiment.get("experiment_id", "")):
                updated.append(experiment)
            else:
                updated.append(row)
        state[user_id] = updated
        self._write(state)


experiment_store = ExperimentStore()

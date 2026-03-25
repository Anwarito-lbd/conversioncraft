from datetime import datetime, timezone
import hashlib
from math import erf, exp, sqrt
from typing import Any, Dict, List

from src.services.experiment_store import experiment_store


class ExperimentationEngine:
    def assign_variant(self, experiment: Dict[str, Any], session_id: str) -> Dict[str, Any]:
        variants = experiment.get("variants", [])
        if not variants:
            return {}

        weights = [max(0.0, float(v.get("traffic_weight", 0) or 0)) for v in variants]
        total = sum(weights)
        if total <= 0:
            weights = [1.0 / len(variants)] * len(variants)
        else:
            weights = [w / total for w in weights]

        digest = hashlib.sha256(f"{experiment.get('experiment_id', '')}:{session_id}".encode("utf-8")).hexdigest()
        roll = (int(digest[:8], 16) % 10000) / 10000.0
        cursor = 0.0
        for variant, weight in zip(variants, weights):
            cursor += weight
            if roll <= cursor:
                return variant
        return variants[-1]

    def rebalance_traffic(self, user_id: str, experiment: Dict[str, Any]) -> Dict[str, float]:
        variants = experiment.get("variants", [])
        if not variants:
            return {}

        if experiment.get("status") == "promoted" and experiment.get("winner_variant_id"):
            winner = str(experiment.get("winner_variant_id", ""))
            weights = {
                str(v.get("variant_id", "")): (1.0 if str(v.get("variant_id", "")) == winner else 0.0)
                for v in variants
            }
            experiment_store.set_variant_weights(user_id, str(experiment.get("experiment_id", "")), weights)
            return weights

        scored = []
        for variant in variants:
            metrics = variant.get("metrics", {})
            scored.append(
                (
                    str(variant.get("variant_id", "")),
                    self._score(str(experiment.get("rules", {}).get("metric", "cvr")), metrics),
                    int(metrics.get("impressions", 0) or 0),
                )
            )
        scored.sort(key=lambda x: x[1], reverse=True)
        if len(scored) < 2:
            return {}

        rules = experiment.get("rules", {})
        min_explore = max(0.0, min(0.2, float(rules.get("min_explore_weight", 0.05) or 0.05)))
        temperature = max(0.1, float(rules.get("rebalance_temperature", 6.0) or 6.0))
        total_impressions = sum(x[2] for x in scored)

        # Keep exploration broad while data is still thin.
        if total_impressions < (len(scored) * 25):
            equal = 1.0 / len(scored)
            weights = {variant_id: equal for variant_id, _, _ in scored}
            experiment_store.set_variant_weights(user_id, str(experiment.get("experiment_id", "")), weights)
            return weights

        # Adaptive weighting: minimum exploration floor + score-weighted exploitation.
        softmax_input = [x[1] * temperature for x in scored]
        max_val = max(softmax_input)
        exp_vals = [exp(v - max_val) for v in softmax_input]
        exp_total = sum(exp_vals) or 1.0
        base_total = min_explore * len(scored)
        base_total = min(base_total, 0.8)
        exploit_total = max(0.0, 1.0 - base_total)
        weights = {}
        for (variant_id, _, _), e_val in zip(scored, exp_vals):
            weights[variant_id] = min_explore + exploit_total * (e_val / exp_total)

        experiment_store.set_variant_weights(user_id, str(experiment.get("experiment_id", "")), weights)
        return weights

    def _normal_cdf(self, z: float) -> float:
        return 0.5 * (1 + erf(z / sqrt(2)))

    def _proportion_significance(
        self,
        top_conversions: float,
        top_impressions: float,
        base_conversions: float,
        base_impressions: float,
    ) -> Dict[str, float]:
        if top_impressions <= 0 or base_impressions <= 0:
            return {"z_score": 0.0, "p_value": 1.0}

        p1 = top_conversions / top_impressions
        p2 = base_conversions / base_impressions
        p_pool = (top_conversions + base_conversions) / (top_impressions + base_impressions)
        denom = sqrt(max(1e-12, p_pool * (1 - p_pool) * ((1 / top_impressions) + (1 / base_impressions))))
        z = (p1 - p2) / denom if denom > 0 else 0.0
        # one-tailed test: top > baseline
        p_value = max(0.0, min(1.0, 1 - self._normal_cdf(z)))
        return {"z_score": z, "p_value": p_value}

    def _score(self, metric: str, item: Dict[str, Any]) -> float:
        impressions = float(item.get("impressions", 0) or 0)
        conversions = float(item.get("conversions", 0) or 0)
        revenue = float(item.get("revenue", 0) or 0)
        spend = float(item.get("spend", 0) or 0)

        if metric == "roas":
            return (revenue / spend) if spend > 0 else 0.0
        if metric == "revenue_per_impression":
            return (revenue / impressions) if impressions > 0 else 0.0
        return (conversions / impressions) if impressions > 0 else 0.0

    def evaluate_experiment(self, user_id: str, experiment_id: str) -> Dict[str, Any]:
        experiment = experiment_store.get_experiment(user_id, experiment_id)
        if not experiment:
            raise ValueError("Experiment not found")

        variants = experiment.get("variants", [])
        if len(variants) < 2:
            raise ValueError("At least 2 variants required")

        rules = experiment.get("rules", {})
        metric = str(rules.get("metric", "cvr"))
        min_impressions = int(rules.get("min_impressions", 500) or 500)
        min_lift_pct = float(rules.get("min_lift_pct", 10) or 10)
        max_p_value = float(rules.get("max_p_value", 0.05) or 0.05)
        auto_promote = bool(rules.get("auto_promote", True))

        scored: List[Dict[str, Any]] = []
        for variant in variants:
            metrics = variant.get("metrics", {})
            impressions = int(metrics.get("impressions", 0) or 0)
            score = self._score(metric, metrics)
            scored.append(
                {
                    "variant_id": str(variant.get("variant_id", "")),
                    "name": str(variant.get("name", "")),
                    "impressions": impressions,
                    "score": score,
                }
            )

        scored.sort(key=lambda x: x["score"], reverse=True)
        top = scored[0]
        second = scored[1] if len(scored) > 1 else {"score": 0.0, "impressions": 0}
        top_variant = next((v for v in variants if str(v.get("variant_id", "")) == str(top["variant_id"])), {})
        base_variant = next((v for v in variants if str(v.get("variant_id", "")) == str(second.get("variant_id", ""))), {})

        ready = top["impressions"] >= min_impressions and second["impressions"] >= min_impressions
        baseline = float(second.get("score", 0) or 0)
        lift_pct = ((top["score"] - baseline) / baseline * 100) if baseline > 0 else (100.0 if top["score"] > 0 else 0.0)
        top_metrics = top_variant.get("metrics", {}) if isinstance(top_variant, dict) else {}
        base_metrics = base_variant.get("metrics", {}) if isinstance(base_variant, dict) else {}
        significance = self._proportion_significance(
            float(top_metrics.get("conversions", 0) or 0),
            float(top_metrics.get("impressions", 0) or 0),
            float(base_metrics.get("conversions", 0) or 0),
            float(base_metrics.get("impressions", 0) or 0),
        )
        statistically_significant = significance["p_value"] <= max_p_value

        promoted = False
        if (
            ready
            and lift_pct >= min_lift_pct
            and statistically_significant
            and auto_promote
            and experiment.get("status") == "running"
        ):
            winner_id = str(top["variant_id"])
            for variant in variants:
                variant["is_live"] = str(variant.get("variant_id", "")) == winner_id
            experiment["winner_variant_id"] = winner_id
            experiment["status"] = "promoted"
            experiment["promoted_at"] = datetime.now(timezone.utc).isoformat()
            promoted = True

        experiment["updated_at"] = datetime.now(timezone.utc).isoformat()
        rebalanced = self.rebalance_traffic(user_id, experiment)
        experiment["latest_evaluation"] = {
            "metric": metric,
            "ready": ready,
            "lift_pct": round(lift_pct, 3),
            "max_p_value": max_p_value,
            "p_value": round(significance["p_value"], 6),
            "z_score": round(significance["z_score"], 4),
            "statistically_significant": statistically_significant,
            "top_variant_id": str(top["variant_id"]),
            "scores": scored,
            "traffic_rebalance": rebalanced,
            "promoted": promoted,
        }
        history = experiment.setdefault("evaluation_history", [])
        history.append(
            {
                "at": datetime.now(timezone.utc).isoformat(),
                "top_variant_id": str(top["variant_id"]),
                "lift_pct": round(lift_pct, 3),
                "p_value": round(significance["p_value"], 6),
                "promoted": promoted,
                "traffic_rebalance": rebalanced,
            }
        )
        experiment["evaluation_history"] = history[-50:]
        experiment_store.save_experiment(user_id, experiment)
        return experiment["latest_evaluation"]

    def run_auto_promotions(self) -> Dict[str, Any]:
        summary = {"users_checked": 0, "experiments_evaluated": 0, "promoted": 0, "errors": []}
        for user_id in experiment_store.list_user_ids():
            summary["users_checked"] += 1
            try:
                experiments = experiment_store.list_experiments(user_id)
                for experiment in experiments:
                    if str(experiment.get("status", "")) not in {"running", ""}:
                        continue
                    evaluation = self.evaluate_experiment(user_id, str(experiment.get("experiment_id", "")))
                    summary["experiments_evaluated"] += 1
                    if bool(evaluation.get("promoted", False)):
                        summary["promoted"] += 1
            except Exception as exc:
                summary["errors"].append(f"{user_id}: {exc}")
        return summary


experimentation_engine = ExperimentationEngine()

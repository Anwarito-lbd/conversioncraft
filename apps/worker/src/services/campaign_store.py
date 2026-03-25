import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List


class CampaignStore:
    def __init__(self, base_dir: str | None = None):
        if base_dir:
            root = Path(base_dir)
        else:
            root = Path(__file__).resolve().parents[2] / "data"
        root.mkdir(parents=True, exist_ok=True)

        self.campaigns_path = root / "campaigns.json"
        self.optimizer_path = root / "optimizer_runs.json"
        self.budget_caps_path = root / "budget_caps.json"
        for p in [self.campaigns_path, self.optimizer_path, self.budget_caps_path]:
            if not p.exists():
                p.write_text("{}", encoding="utf-8")

    def _read(self, path: Path) -> Dict[str, Any]:
        try:
            return json.loads(path.read_text(encoding="utf-8") or "{}")
        except Exception:
            return {}

    def _write(self, path: Path, payload: Dict[str, Any]) -> None:
        path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    def save_created_campaigns(self, user_id: str, campaigns: List[Dict[str, Any]], meta: Dict[str, Any]) -> None:
        state = self._read(self.campaigns_path)
        user_campaigns = state.setdefault(user_id, [])
        for campaign in campaigns:
            user_campaigns.append(
                {
                    **campaign,
                    "campaign_name": meta.get("campaign_name", ""),
                    "objective": meta.get("objective", "conversions"),
                    "daily_budget": meta.get("daily_budget", 0),
                    "status": campaign.get("status", "PAUSED"),
                    "last_metrics": {
                        "ctr": 0,
                        "roas": 0,
                        "spend": 0,
                    },
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }
            )
        self._write(self.campaigns_path, state)

    def get_user_campaigns(self, user_id: str) -> List[Dict[str, Any]]:
        return self._read(self.campaigns_path).get(user_id, [])

    def list_user_ids(self) -> List[str]:
        return list(self._read(self.campaigns_path).keys())

    def update_campaign_metrics(self, user_id: str, campaign_metrics: List[Dict[str, Any]]) -> None:
        state = self._read(self.campaigns_path)
        user_campaigns = state.get(user_id, [])
        metric_map = {
            (str(m.get("platform", "")), str(m.get("campaign_id", ""))): m
            for m in campaign_metrics
        }

        for campaign in user_campaigns:
            key = (str(campaign.get("platform", "")), str(campaign.get("campaign_id", "")))
            if key in metric_map:
                metric = metric_map[key]
                campaign["last_metrics"] = {
                    "ctr": float(metric.get("ctr", 0) or 0),
                    "roas": float(metric.get("roas", 0) or 0),
                    "spend": float(metric.get("spend", 0) or 0),
                }
                campaign["metrics_updated_at"] = datetime.now(timezone.utc).isoformat()

        state[user_id] = user_campaigns
        self._write(self.campaigns_path, state)

    def save_optimizer_run(self, user_id: str, result: Dict[str, Any]) -> None:
        state = self._read(self.optimizer_path)
        runs = state.setdefault(user_id, [])
        runs.append(result)
        state[user_id] = runs[-20:]
        self._write(self.optimizer_path, state)

    def get_latest_optimizer_run(self, user_id: str) -> Dict[str, Any]:
        runs = self._read(self.optimizer_path).get(user_id, [])
        return runs[-1] if runs else {}

    def apply_webhook_event(self, user_id: str, platform: str, event: Dict[str, Any]) -> None:
        state = self._read(self.campaigns_path)
        campaigns = state.get(user_id, [])
        campaign_id = str(event.get("campaign_id", ""))
        adset_id = str(event.get("adset_id", ""))

        for campaign in campaigns:
            if campaign_id and str(campaign.get("campaign_id", "")) != campaign_id:
                continue
            if platform and str(campaign.get("platform", "")) != platform:
                continue

            status = event.get("status")
            if status:
                campaign["status"] = str(status)

            last = campaign.get("last_metrics", {}) or {}
            last["spend"] = float(event.get("spend", last.get("spend", 0)) or 0)
            last["ctr"] = float(event.get("ctr", last.get("ctr", 0)) or 0)
            last["roas"] = float(event.get("roas", last.get("roas", 0)) or 0)
            campaign["last_metrics"] = last
            campaign["adset_id"] = adset_id or campaign.get("adset_id", "")
            campaign["synced_at"] = datetime.now(timezone.utc).isoformat()

        state[user_id] = campaigns
        self._write(self.campaigns_path, state)

    def dashboard_snapshot(self, user_id: str) -> Dict[str, Any]:
        campaigns = self.get_user_campaigns(user_id)
        total_spend = 0.0
        avg_ctr = 0.0
        avg_roas = 0.0
        for campaign in campaigns:
            metrics = campaign.get("last_metrics", {}) or {}
            total_spend += float(metrics.get("spend", 0) or 0)
            avg_ctr += float(metrics.get("ctr", 0) or 0)
            avg_roas += float(metrics.get("roas", 0) or 0)

        count = max(1, len(campaigns))
        return {
            "campaign_count": len(campaigns),
            "total_spend": round(total_spend, 2),
            "avg_ctr": round(avg_ctr / count, 3),
            "avg_roas": round(avg_roas / count, 3),
            "campaigns": campaigns,
        }

    def get_campaign_daily_budget(self, user_id: str, platform: str, campaign_id: str) -> float:
        campaigns = self.get_user_campaigns(user_id)
        for campaign in campaigns:
            if str(campaign.get("platform", "")) == platform and str(campaign.get("campaign_id", "")) == campaign_id:
                return float(campaign.get("daily_budget", 0) or 0)
        return 0.0

    def update_campaign_daily_budget(self, user_id: str, platform: str, campaign_id: str, daily_budget: float) -> None:
        state = self._read(self.campaigns_path)
        campaigns = state.get(user_id, [])
        for campaign in campaigns:
            if str(campaign.get("platform", "")) == platform and str(campaign.get("campaign_id", "")) == campaign_id:
                campaign["daily_budget"] = float(daily_budget)
                campaign["budget_updated_at"] = datetime.now(timezone.utc).isoformat()
        state[user_id] = campaigns
        self._write(self.campaigns_path, state)

    def _today_key(self) -> str:
        return datetime.now(timezone.utc).date().isoformat()

    def get_daily_budget_increase_pct(self, user_id: str, platform: str, campaign_id: str) -> float:
        state = self._read(self.budget_caps_path)
        date_key = self._today_key()
        key = f"{platform}:{campaign_id}"
        return float(
            state.get(user_id, {})
            .get(date_key, {})
            .get(key, 0)
            or 0
        )

    def add_daily_budget_increase_pct(self, user_id: str, platform: str, campaign_id: str, delta_pct: float) -> None:
        state = self._read(self.budget_caps_path)
        date_key = self._today_key()
        user = state.setdefault(user_id, {})
        day = user.setdefault(date_key, {})
        key = f"{platform}:{campaign_id}"
        day[key] = float(day.get(key, 0) or 0) + float(delta_pct)

        recent_days = sorted(user.keys())[-7:]
        user_trimmed = {d: user[d] for d in recent_days}
        state[user_id] = user_trimmed
        self._write(self.budget_caps_path, state)


campaign_store = CampaignStore()

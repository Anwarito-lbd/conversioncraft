from datetime import datetime, timezone
from typing import Any, Dict, List

from src.services.dead_letter_queue import dead_letter_queue
from src.services.http_client import http_client


class CampaignService:
    def __init__(self):
        self.meta_api_base = "https://graph.facebook.com/v21.0"
        self.tiktok_api_base = "https://business-api.tiktok.com/open_api/v1.3"

    def create_meta_campaigns(
        self,
        access_token: str,
        ad_account_id: str,
        campaign_name: str,
        objective: str,
        daily_budget: float,
        user_id: str = "unknown",
    ) -> Dict[str, Any]:
        account_ref = ad_account_id if ad_account_id.startswith("act_") else f"act_{ad_account_id}"
        url = f"{self.meta_api_base}/{account_ref}/campaigns"
        payload = {
            "name": campaign_name,
            "objective": "OUTCOME_SALES" if objective == "conversions" else "OUTCOME_TRAFFIC",
            "status": "PAUSED",
            "special_ad_categories": "[]",
            "access_token": access_token,
        }
        try:
            response = http_client.request("POST", url, data=payload, timeout=30, retries=3)
        except Exception as exc:
            dead_letter_queue.enqueue(
                queue="campaign_meta_create",
                user_id=user_id,
                payload={"url": url, "payload": payload, "ad_account_id": ad_account_id},
                error=str(exc),
                context={"provider": "meta"},
            )
            raise
        campaign_id = response.json().get("id", "")

        return {
            "platform": "meta",
            "campaign_id": campaign_id,
            "status": "PAUSED",
            "daily_budget": daily_budget,
        }

    def create_tiktok_campaigns(
        self,
        access_token: str,
        advertiser_id: str,
        campaign_name: str,
        objective: str,
        daily_budget: float,
        user_id: str = "unknown",
    ) -> Dict[str, Any]:
        url = f"{self.tiktok_api_base}/campaign/create/"
        headers = {
            "Access-Token": access_token,
            "Content-Type": "application/json",
        }
        objective_map = {
            "conversions": "CONVERSIONS",
            "traffic": "TRAFFIC",
            "engagement": "VIDEO_VIEWS",
        }
        payload = {
            "advertiser_id": advertiser_id,
            "campaign_name": campaign_name,
            "objective_type": objective_map.get(objective, "CONVERSIONS"),
            "budget_mode": "BUDGET_MODE_DAY",
            "budget": float(daily_budget),
            "operation_status": "DISABLE",
        }
        try:
            response = http_client.request("POST", url, json=payload, headers=headers, timeout=30, retries=3)
        except Exception as exc:
            dead_letter_queue.enqueue(
                queue="campaign_tiktok_create",
                user_id=user_id,
                payload={"url": url, "payload": payload, "advertiser_id": advertiser_id},
                error=str(exc),
                context={"provider": "tiktok"},
            )
            raise
        data = response.json().get("data", {})

        return {
            "platform": "tiktok",
            "campaign_id": str(data.get("campaign_id", "")),
            "status": "DISABLE",
            "daily_budget": daily_budget,
        }

    def build_optimizer_actions(
        self,
        campaign_metrics: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        actions: List[Dict[str, Any]] = []

        for metric in campaign_metrics:
            platform = metric.get("platform", "unknown")
            campaign_id = metric.get("campaign_id", "")
            ctr = float(metric.get("ctr", 0) or 0)
            roas = float(metric.get("roas", 0) or 0)
            spend = float(metric.get("spend", 0) or 0)

            if spend >= 50 and ctr < 1.2:
                actions.append(
                    {
                        "action": "pause",
                        "platform": platform,
                        "campaign_id": campaign_id,
                        "roas": roas,
                        "ctr": ctr,
                        "spend": spend,
                        "reason": "CTR under 1.2% after meaningful spend",
                    }
                )
            elif roas >= 2.2:
                actions.append(
                    {
                        "action": "scale_budget",
                        "platform": platform,
                        "campaign_id": campaign_id,
                        "delta_percent": 20,
                        "roas": roas,
                        "ctr": ctr,
                        "spend": spend,
                        "reason": "ROAS above 2.2",
                    }
                )
            elif roas < 1.2 and spend >= 30:
                actions.append(
                    {
                        "action": "refresh_creative",
                        "platform": platform,
                        "campaign_id": campaign_id,
                        "roas": roas,
                        "ctr": ctr,
                        "spend": spend,
                        "reason": "ROAS below 1.2; rotate hook/visual",
                    }
                )

        return {
            "ran_at": datetime.now(timezone.utc).isoformat(),
            "summary": f"Generated {len(actions)} optimizer actions",
            "actions": actions,
        }

    def execute_meta_action(self, access_token: str, action: Dict[str, Any]) -> Dict[str, Any]:
        campaign_id = str(action.get("campaign_id", ""))
        if not campaign_id:
            return {"status": "skipped", "reason": "missing_campaign_id", "action": action}

        url = f"{self.meta_api_base}/{campaign_id}"
        if action.get("action") == "pause":
            payload = {"status": "PAUSED", "access_token": access_token}
        elif action.get("action") == "scale_budget":
            current_budget = float(action.get("current_daily_budget", 0) or 0)
            delta_percent = float(action.get("delta_percent", 20) or 20)
            next_budget = max(1.0, round(current_budget * (1 + delta_percent / 100), 2))
            payload = {
                "daily_budget": int(round(next_budget * 100)),
                "access_token": access_token,
            }
        else:
            return {"status": "skipped", "reason": "unsupported_meta_action", "action": action}

        response = http_client.request("POST", url, data=payload, timeout=30, retries=3)
        result = {"status": "applied", "platform": "meta", "campaign_id": campaign_id, "response": response.json()}
        if action.get("action") == "scale_budget":
            result["new_daily_budget"] = next_budget
        return result

    def execute_tiktok_action(self, access_token: str, advertiser_id: str, action: Dict[str, Any]) -> Dict[str, Any]:
        campaign_id = str(action.get("campaign_id", ""))
        if not campaign_id:
            return {"status": "skipped", "reason": "missing_campaign_id", "action": action}

        url = f"{self.tiktok_api_base}/campaign/update/"
        headers = {"Access-Token": access_token, "Content-Type": "application/json"}

        if action.get("action") == "pause":
            payload = {"advertiser_id": advertiser_id, "campaign_id": campaign_id, "operation_status": "DISABLE"}
        elif action.get("action") == "scale_budget":
            current_budget = float(action.get("current_daily_budget", 0) or 0)
            delta_percent = float(action.get("delta_percent", 20) or 20)
            next_budget = max(1.0, round(current_budget * (1 + delta_percent / 100), 2))
            payload = {
                "advertiser_id": advertiser_id,
                "campaign_id": campaign_id,
                "budget_mode": "BUDGET_MODE_DAY",
                "budget": float(next_budget),
            }
        else:
            return {"status": "skipped", "reason": "unsupported_tiktok_action", "action": action}

        response = http_client.request("POST", url, json=payload, headers=headers, timeout=30, retries=3)
        result = {"status": "applied", "platform": "tiktok", "campaign_id": campaign_id, "response": response.json()}
        if action.get("action") == "scale_budget":
            result["new_daily_budget"] = next_budget
        return result


campaign_service = CampaignService()

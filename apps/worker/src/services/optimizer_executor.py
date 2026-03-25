import os
from typing import Any, Dict, List

from src.services.campaign_service import campaign_service
from src.services.campaign_store import campaign_store
from src.services.dead_letter_queue import dead_letter_queue
from src.services.token_store import store


class OptimizerExecutor:
    def __init__(self):
        self.max_daily_increase_meta = float(os.getenv("MAX_BUDGET_INCREASE_PCT_DAILY_META", "25"))
        self.max_daily_increase_tiktok = float(os.getenv("MAX_BUDGET_INCREASE_PCT_DAILY_TIKTOK", "25"))
        self.min_roas_meta = float(os.getenv("MIN_ROAS_GUARDRAIL_META", "1.8"))
        self.min_roas_tiktok = float(os.getenv("MIN_ROAS_GUARDRAIL_TIKTOK", "1.8"))

    def _platform_caps(self, platform: str) -> tuple[float, float]:
        if platform == "meta":
            return self.max_daily_increase_meta, self.min_roas_meta
        if platform == "tiktok":
            return self.max_daily_increase_tiktok, self.min_roas_tiktok
        return 0.0, 0.0

    def _guard_and_adjust(
        self,
        user_id: str,
        action: Dict[str, Any],
        current_budget: float,
    ) -> tuple[bool, Dict[str, Any], str]:
        platform = str(action.get("platform", ""))
        campaign_id = str(action.get("campaign_id", ""))

        if action.get("action") != "scale_budget":
            return True, {**action, "current_daily_budget": current_budget}, ""

        cap, min_roas = self._platform_caps(platform)
        roas = float(action.get("roas", 0) or 0)
        if roas < min_roas:
            return False, action, f"roas_below_guardrail_{platform}"

        already_scaled = campaign_store.get_daily_budget_increase_pct(user_id, platform, campaign_id)
        remaining = max(0.0, cap - already_scaled)
        if remaining <= 0:
            return False, action, f"daily_cap_reached_{platform}"

        requested = float(action.get("delta_percent", 20) or 20)
        adjusted = min(requested, remaining)
        if adjusted <= 0:
            return False, action, f"no_remaining_budget_increase_{platform}"

        enriched = {
            **action,
            "delta_percent": adjusted,
            "current_daily_budget": current_budget,
        }
        return True, enriched, ""

    def execute_actions(self, user_id: str, actions: List[Dict[str, Any]]) -> Dict[str, Any]:
        meta_tokens = store.get_platform_tokens(user_id, "meta")
        tiktok_tokens = store.get_platform_tokens(user_id, "tiktok")

        results: List[Dict[str, Any]] = []
        errors: List[str] = []
        skipped: List[Dict[str, Any]] = []

        for action in actions:
            platform = str(action.get("platform", ""))
            campaign_id = str(action.get("campaign_id", ""))
            current_budget = campaign_store.get_campaign_daily_budget(user_id, platform, campaign_id)

            allowed, guarded_action, skip_reason = self._guard_and_adjust(user_id, action, current_budget)
            if not allowed:
                skipped.append({"platform": platform, "campaign_id": campaign_id, "reason": skip_reason})
                continue

            try:
                if platform == "meta":
                    if not meta_tokens.get("access_token"):
                        raise ValueError("Meta token missing")
                    result = campaign_service.execute_meta_action(meta_tokens["access_token"], guarded_action)
                elif platform == "tiktok":
                    if not tiktok_tokens.get("access_token") or not tiktok_tokens.get("open_id"):
                        raise ValueError("TikTok token or advertiser id missing")
                    result = campaign_service.execute_tiktok_action(
                        tiktok_tokens["access_token"],
                        tiktok_tokens["open_id"],
                        guarded_action,
                    )
                else:
                    skipped.append({"platform": platform, "campaign_id": campaign_id, "reason": "unsupported_platform"})
                    continue

                results.append(result)

                new_budget = result.get("new_daily_budget") if isinstance(result, dict) else None
                if isinstance(new_budget, (float, int)) and campaign_id:
                    campaign_store.update_campaign_daily_budget(user_id, platform, campaign_id, float(new_budget))
                    campaign_store.add_daily_budget_increase_pct(
                        user_id,
                        platform,
                        campaign_id,
                        float(guarded_action.get("delta_percent", 0) or 0),
                    )
            except Exception as exc:
                errors.append(f"{platform}: {exc}")
                dead_letter_queue.enqueue(
                    queue="optimizer_execute",
                    user_id=user_id,
                    payload={"action": guarded_action},
                    error=str(exc),
                )

        return {
            "status": "ok" if not errors else "partial_success",
            "results": results,
            "errors": errors,
            "skipped": skipped,
        }


optimizer_executor = OptimizerExecutor()

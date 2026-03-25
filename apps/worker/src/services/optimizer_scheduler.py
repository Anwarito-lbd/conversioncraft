import os
from datetime import datetime, timezone
from typing import Any, Dict, List

try:
    from apscheduler.schedulers.background import BackgroundScheduler
    from apscheduler.triggers.cron import CronTrigger
except Exception:  # pragma: no cover - fallback for minimal local envs
    BackgroundScheduler = None  # type: ignore[assignment]
    CronTrigger = None  # type: ignore[assignment]

from src.services.audit_logger import audit_logger
from src.services.campaign_service import campaign_service
from src.services.campaign_store import campaign_store
from src.services.experimentation_engine import experimentation_engine
from src.services.optimizer_executor import optimizer_executor
from src.services.token_rotation import token_rotation_service


class OptimizerScheduler:
    def __init__(self):
        self.scheduler = BackgroundScheduler(timezone="UTC") if BackgroundScheduler else None
        self.enabled = os.getenv("ENABLE_WEEKLY_OPTIMIZER", "true").lower() == "true"
        self.day_of_week = os.getenv("OPTIMIZER_DAY_OF_WEEK", "mon")
        self.hour = int(os.getenv("OPTIMIZER_HOUR_UTC", "9"))
        self.minute = int(os.getenv("OPTIMIZER_MINUTE_UTC", "0"))
        self.rotation_enabled = os.getenv("ENABLE_DAILY_TOKEN_ROTATION", "true").lower() == "true"
        self.rotation_hour = int(os.getenv("TOKEN_ROTATION_HOUR_UTC", "4"))
        self.rotation_minute = int(os.getenv("TOKEN_ROTATION_MINUTE_UTC", "0"))
        self.auto_execute_enabled = os.getenv("ENABLE_AUTO_OPTIMIZER_EXECUTION", "true").lower() == "true"
        self.experiment_auto_promote_enabled = os.getenv("ENABLE_EXPERIMENT_AUTO_PROMOTION", "true").lower() == "true"
        self.experiment_promotion_hour = int(os.getenv("EXPERIMENT_PROMOTION_HOUR_UTC", "7"))
        self.experiment_promotion_minute = int(os.getenv("EXPERIMENT_PROMOTION_MINUTE_UTC", "0"))
        self._started = False

    def _build_metrics_from_campaigns(self, campaigns: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        metrics = []
        for campaign in campaigns:
            last = campaign.get("last_metrics", {})
            metrics.append(
                {
                    "platform": campaign.get("platform", ""),
                    "campaign_id": campaign.get("campaign_id", ""),
                    "ctr": float(last.get("ctr", 0) or 0),
                    "roas": float(last.get("roas", 0) or 0),
                    "spend": float(last.get("spend", 0) or 0),
                }
            )
        return metrics

    def run_weekly_optimizer_now(self, user_id: str) -> Dict[str, Any]:
        campaigns = campaign_store.get_user_campaigns(user_id)
        metrics = self._build_metrics_from_campaigns(campaigns)
        result = campaign_service.build_optimizer_actions(metrics)
        execution = optimizer_executor.execute_actions(user_id, result.get("actions", [])) if self.auto_execute_enabled else None
        wrapped = {
            "user_id": user_id,
            "result": result,
            "execution": execution,
            "trigger": "manual" if campaigns else "manual_no_campaigns",
        }
        campaign_store.save_optimizer_run(user_id, wrapped)
        return wrapped

    def _scheduled_job(self) -> None:
        for user_id in campaign_store.list_user_ids():
            campaigns = campaign_store.get_user_campaigns(user_id)
            metrics = self._build_metrics_from_campaigns(campaigns)
            result = campaign_service.build_optimizer_actions(metrics)
            wrapped = {
                "user_id": user_id,
                "result": result,
                "execution": optimizer_executor.execute_actions(user_id, result.get("actions", []))
                if self.auto_execute_enabled
                else None,
                "trigger": "scheduled",
                "scheduled_at": datetime.now(timezone.utc).isoformat(),
            }
            campaign_store.save_optimizer_run(user_id, wrapped)
            execution = wrapped.get("execution") or {}
            audit_logger.log(
                "optimizer.run_scheduled",
                user_id,
                {
                    "actions": len(result.get("actions", [])),
                    "campaign_count": len(campaigns),
                    "auto_execution_enabled": self.auto_execute_enabled,
                    "applied": len(execution.get("results", []) if isinstance(execution, dict) else []),
                    "skipped": execution.get("skipped", []) if isinstance(execution, dict) else [],
                    "errors": execution.get("errors", []) if isinstance(execution, dict) else [],
                },
            )

    def _scheduled_rotation_job(self) -> None:
        summary = token_rotation_service.refresh_all_users()
        audit_logger.log("tokens.rotation_scheduled", "system", summary)

    def _scheduled_experiment_promotion_job(self) -> None:
        summary = experimentation_engine.run_auto_promotions()
        audit_logger.log("experiments.auto_promotion_scheduled", "system", summary)

    def start(self) -> None:
        if self._started:
            return
        if not self.scheduler or not CronTrigger:
            return

        if self.enabled:
            trigger = CronTrigger(day_of_week=self.day_of_week, hour=self.hour, minute=self.minute)
            self.scheduler.add_job(self._scheduled_job, trigger=trigger, id="weekly_optimizer", replace_existing=True)
        if self.rotation_enabled:
            rotation_trigger = CronTrigger(hour=self.rotation_hour, minute=self.rotation_minute)
            self.scheduler.add_job(
                self._scheduled_rotation_job,
                trigger=rotation_trigger,
                id="daily_token_rotation",
                replace_existing=True,
            )
        if self.experiment_auto_promote_enabled:
            exp_trigger = CronTrigger(hour=self.experiment_promotion_hour, minute=self.experiment_promotion_minute)
            self.scheduler.add_job(
                self._scheduled_experiment_promotion_job,
                trigger=exp_trigger,
                id="daily_experiment_auto_promotion",
                replace_existing=True,
            )
        if not self.enabled and not self.rotation_enabled and not self.experiment_auto_promote_enabled:
            return
        self.scheduler.start()
        self._started = True

    def shutdown(self) -> None:
        if self._started and self.scheduler:
            self.scheduler.shutdown(wait=False)
            self._started = False


optimizer_scheduler = OptimizerScheduler()

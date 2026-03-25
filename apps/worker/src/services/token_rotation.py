from datetime import datetime, timedelta, timezone
from typing import Any, Dict

from src.services.oauth_service import oauth_service
from src.services.token_store import store


class TokenRotationService:
    def _parse_connected_at(self, token_data: Dict[str, Any]) -> datetime | None:
        raw = token_data.get("connected_at")
        if not raw or not isinstance(raw, str):
            return None
        try:
            return datetime.fromisoformat(raw)
        except Exception:
            return None

    def should_refresh(self, token_data: Dict[str, Any], threshold_seconds: int = 86400) -> bool:
        expires_in = token_data.get("expires_in")
        if not expires_in:
            return False

        connected_at = self._parse_connected_at(token_data)
        if not connected_at:
            return False

        try:
            expiry = connected_at + timedelta(seconds=int(expires_in))
        except Exception:
            return False

        now = datetime.now(timezone.utc)
        return expiry <= (now + timedelta(seconds=threshold_seconds))

    def refresh_meta_if_needed(self, user_id: str) -> Dict[str, Any]:
        token_data = store.get_platform_tokens(user_id, "meta")
        if not token_data.get("access_token"):
            return token_data

        if self.should_refresh(token_data):
            refreshed = oauth_service.refresh_meta_token(token_data["access_token"])
            merged = {
                **token_data,
                **refreshed,
                "connected_at": datetime.now(timezone.utc).isoformat(),
            }
            store.set_platform_tokens(user_id, "meta", merged)
            return merged

        return token_data

    def refresh_tiktok_if_needed(self, user_id: str) -> Dict[str, Any]:
        token_data = store.get_platform_tokens(user_id, "tiktok")
        if not token_data.get("access_token"):
            return token_data

        if self.should_refresh(token_data) and token_data.get("refresh_token"):
            refreshed = oauth_service.refresh_tiktok_token(token_data["refresh_token"])
            merged = {
                **token_data,
                **refreshed,
                "connected_at": datetime.now(timezone.utc).isoformat(),
            }
            store.set_platform_tokens(user_id, "tiktok", merged)
            return merged

        return token_data

    def refresh_all_users(self) -> Dict[str, Any]:
        summary: Dict[str, Any] = {
            "users_checked": 0,
            "meta_refreshed": 0,
            "tiktok_refreshed": 0,
            "errors": [],
        }
        for user_id in store.list_user_ids():
            summary["users_checked"] += 1
            try:
                before_meta = store.get_platform_tokens(user_id, "meta")
                after_meta = self.refresh_meta_if_needed(user_id)
                if before_meta.get("access_token") and after_meta.get("access_token") and (
                    before_meta.get("access_token") != after_meta.get("access_token")
                    or before_meta.get("connected_at") != after_meta.get("connected_at")
                ):
                    summary["meta_refreshed"] += 1

                before_tiktok = store.get_platform_tokens(user_id, "tiktok")
                after_tiktok = self.refresh_tiktok_if_needed(user_id)
                if before_tiktok.get("access_token") and after_tiktok.get("access_token") and (
                    before_tiktok.get("access_token") != after_tiktok.get("access_token")
                    or before_tiktok.get("connected_at") != after_tiktok.get("connected_at")
                ):
                    summary["tiktok_refreshed"] += 1
            except Exception as exc:
                summary["errors"].append(f"{user_id}: {exc}")
        return summary


token_rotation_service = TokenRotationService()

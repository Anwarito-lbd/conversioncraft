"""
Creatify AI video ad generation integration.

Supports URL-to-video, avatar video creation, render polling,
and avatar listing.  Falls back to mock when CREATIFY_API_ID
and CREATIFY_API_KEY are not set.
"""

import os
import hashlib
from typing import Any, Dict, List, Optional

from src.services.http_client import http_client


class CreatifyService:
    BASE_URL = "https://api.creatify.ai/api"

    def __init__(self):
        self.api_id = os.getenv("CREATIFY_API_ID", "")
        self.api_key = os.getenv("CREATIFY_API_KEY", "")

    def is_configured(self) -> bool:
        return bool(self.api_id and self.api_key)

    def _headers(self) -> Dict[str, str]:
        return {
            "X-API-ID": self.api_id,
            "X-API-KEY": self.api_key,
            "Content-Type": "application/json",
        }

    # ── URL-to-Video ─────────────────────────────────────────────

    def create_video_from_url(
        self,
        product_url: str,
        aspect_ratio: str = "9:16",
        style: str = "modern",
    ) -> Dict[str, Any]:
        # COST OPTIMIZATION: Fallback to Higgsfield if Creatify not configured ($6/mo vs $39/mo)
        from src.services.higgsfield_service import higgsfield_service
        if not self.is_configured() and higgsfield_service.is_configured():
            return {
                "id": "crea_higgsfield_fallback",
                "status": "pending",
                "message": "Using Higgsfield for video generation due to cost optimization.",
                "higgsfield_task": higgsfield_service.generate_product_animation(
                    image_url=product_url, # Note: Higgsfield expects image, but we pass URL here for mock fallback logic
                    duration_seconds=30,
                    aspect_ratio=aspect_ratio
                )
            }

        if not self.is_configured():
            return self._mock_render(product_url, "url_to_video")

        payload = {
            "url": product_url,
            "aspect_ratio": aspect_ratio,
            "style": style,
        }
        resp = http_client.request(
            "POST", f"{self.BASE_URL}/url_to_videos/",
            headers=self._headers(), json=payload, timeout=60, retries=2,
        )
        return resp.json()

    # ── Avatar Video ─────────────────────────────────────────────

    def create_avatar_video(
        self,
        script: str,
        avatar_id: Optional[str] = None,
        aspect_ratio: str = "9:16",
    ) -> Dict[str, Any]:
        if not self.is_configured():
            return self._mock_render(script[:50], "avatar_video")

        payload: Dict[str, Any] = {
            "script": script,
            "aspect_ratio": aspect_ratio,
        }
        if avatar_id:
            payload["avatar_id"] = avatar_id

        resp = http_client.request(
            "POST", f"{self.BASE_URL}/lipsyncs/",
            headers=self._headers(), json=payload, timeout=60, retries=2,
        )
        return resp.json()

    # ── Poll Render ──────────────────────────────────────────────

    def get_video_status(self, render_id: str) -> Dict[str, Any]:
        if not self.is_configured():
            return {"id": render_id, "status": "done", "video_url": "https://example.com/mock.mp4", "mock": True}

        resp = http_client.request(
            "GET", f"{self.BASE_URL}/lipsyncs/{render_id}/",
            headers=self._headers(), timeout=30, retries=2,
        )
        return resp.json()

    # ── Avatars ──────────────────────────────────────────────────

    def list_avatars(self) -> List[Dict[str, Any]]:
        if not self.is_configured():
            return [{"id": "avatar_mock_1", "name": "Alex", "style": "professional", "mock": True}]

        resp = http_client.request(
            "GET", f"{self.BASE_URL}/avatars/",
            headers=self._headers(), timeout=30, retries=2,
        )
        data = resp.json()
        return data if isinstance(data, list) else data.get("results", [])

    # ── Mock ─────────────────────────────────────────────────────

    @staticmethod
    def _mock_render(seed: str, kind: str) -> Dict[str, Any]:
        render_id = "render_" + hashlib.md5(seed.encode()).hexdigest()[:12]
        return {
            "id": render_id,
            "status": "pending",
            "type": kind,
            "video_url": None,
            "mock": True,
        }


creatify_service = CreatifyService()

"""
Flair AI product photography integration.

Generates styled product photos, removes backgrounds, and supports
batch generation.  Falls back to mock when FLAIR_API_KEY is not set.
"""

import os
import hashlib
from typing import Any, Dict, List

from src.services.http_client import http_client


class FlairService:
    BASE_URL = "https://api.flair.ai/v1"

    def __init__(self):
        self.api_key = os.getenv("FLAIR_API_KEY", "")

    def is_configured(self) -> bool:
        return bool(self.api_key)

    def _headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    # ── Generate Product Photo ───────────────────────────────────

    def generate_product_photo(
        self,
        image_url: str,
        scene_description: str = "clean white studio background, soft lighting",
    ) -> Dict[str, Any]:
        if not self.is_configured():
            return self._mock_photo(image_url, scene_description)

        payload = {
            "image_url": image_url,
            "prompt": scene_description,
        }
        resp = http_client.request(
            "POST", f"{self.BASE_URL}/generate",
            headers=self._headers(), json=payload, timeout=60, retries=2,
        )
        return resp.json()

    # ── Background Removal ───────────────────────────────────────

    def remove_background(self, image_url: str) -> Dict[str, Any]:
        if not self.is_configured():
            return {"original": image_url, "result_url": image_url, "mock": True}

        payload = {"image_url": image_url}
        resp = http_client.request(
            "POST", f"{self.BASE_URL}/remove-background",
            headers=self._headers(), json=payload, timeout=60, retries=2,
        )
        return resp.json()

    # ── Batch Generation ─────────────────────────────────────────

    def batch_generate(
        self, image_urls: List[str], scene: str = "lifestyle setting",
    ) -> List[Dict[str, Any]]:
        results: List[Dict[str, Any]] = []
        for url in image_urls:
            results.append(self.generate_product_photo(url, scene))
        return results

    # ── Mock ─────────────────────────────────────────────────────

    @staticmethod
    def _mock_photo(image_url: str, scene: str) -> Dict[str, Any]:
        return {
            "id": "flair_" + hashlib.md5(image_url.encode()).hexdigest()[:12],
            "original": image_url,
            "result_url": "https://via.placeholder.com/800x800?text=AI+Product+Photo",
            "scene": scene,
            "mock": True,
        }


flair_service = FlairService()

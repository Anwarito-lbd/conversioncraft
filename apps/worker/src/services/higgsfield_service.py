"""
Higgsfield AI video animation integration.

Generates product animations, hero videos, and text-to-video
content for store pages and social media.
Falls back to mock when HIGGSFIELD_API_KEY is not set.
"""

import os
import hashlib
from typing import Any, Dict, List, Optional

from src.services.http_client import http_client


class HiggsfieldService:
    BASE_URL = "https://api.higgsfield.ai/v1"

    def __init__(self):
        self.api_key = os.getenv("HIGGSFIELD_API_KEY", "")

    def is_configured(self) -> bool:
        return bool(self.api_key)

    def _headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    # ── Product Animation (image-to-video) ───────────────────────

    def generate_product_animation(
        self,
        image_url: str,
        motion_type: str = "orbit",
        camera_effect: str = "dolly_zoom",
        duration_seconds: int = 5,
        aspect_ratio: str = "9:16",
    ) -> Dict[str, Any]:
        """Generate a video animation from a product image."""
        if not self.is_configured():
            return self._mock_video(image_url, "product_animation")

        payload = {
            "image_url": image_url,
            "motion_type": motion_type,
            "camera_effect": camera_effect,
            "duration": duration_seconds,
            "aspect_ratio": aspect_ratio,
        }
        resp = http_client.request(
            "POST", f"{self.BASE_URL}/generations",
            headers=self._headers(), json=payload, timeout=60, retries=2,
        )
        return resp.json()

    # ── Hero Video (multiple images → cinematic) ─────────────────

    def generate_hero_video(
        self,
        product_images: List[str],
        style: str = "modern_cinematic",
        transitions: str = "smooth_fade",
    ) -> Dict[str, Any]:
        """Generate a hero banner video from multiple product images."""
        if not self.is_configured():
            return self._mock_video(str(product_images), "hero_video")

        # Generate first image as base, then composite
        payload = {
            "image_url": product_images[0] if product_images else "",
            "prompt": f"{style} product showcase, professional lighting, {transitions}",
            "camera_effect": "crane_up",
            "duration": 8,
            "aspect_ratio": "16:9",
        }
        resp = http_client.request(
            "POST", f"{self.BASE_URL}/generations",
            headers=self._headers(), json=payload, timeout=60, retries=2,
        )
        return resp.json()

    # ── Text-to-Video ────────────────────────────────────────────

    def text_to_animation(
        self,
        prompt: str,
        aspect_ratio: str = "16:9",
        duration_seconds: int = 6,
    ) -> Dict[str, Any]:
        """Generate a video from text prompt for store sections."""
        if not self.is_configured():
            return self._mock_video(prompt, "text_to_video")

        payload = {
            "prompt": prompt,
            "aspect_ratio": aspect_ratio,
            "duration": duration_seconds,
        }
        resp = http_client.request(
            "POST", f"{self.BASE_URL}/generations",
            headers=self._headers(), json=payload, timeout=60, retries=2,
        )
        return resp.json()

    # ── Poll Status ──────────────────────────────────────────────

    def get_video_status(self, generation_id: str) -> Dict[str, Any]:
        """Check the status of a video generation."""
        if not self.is_configured():
            return {
                "id": generation_id,
                "status": "completed",
                "video_url": "https://example.com/mock-animation.mp4",
                "mock": True,
            }

        resp = http_client.request(
            "GET", f"{self.BASE_URL}/generations/{generation_id}",
            headers=self._headers(), timeout=30, retries=2,
        )
        return resp.json()

    # ── Camera Effects Catalog ───────────────────────────────────

    @staticmethod
    def available_camera_effects() -> List[str]:
        return [
            "dolly_zoom", "crane_up", "crane_down", "orbit_left", "orbit_right",
            "push_in", "pull_out", "truck_left", "truck_right", "pedestal_up",
            "tilt_down", "pan_left", "pan_right", "zoom_in", "zoom_out",
            "handheld_shake", "slow_motion", "timelapse", "rack_focus",
        ]

    # ── Mock ─────────────────────────────────────────────────────

    @staticmethod
    def _mock_video(seed: str, kind: str) -> Dict[str, Any]:
        gen_id = f"hf_{kind}_" + hashlib.md5(seed.encode()).hexdigest()[:10]
        return {
            "id": gen_id,
            "status": "completed",
            "type": kind,
            "video_url": "https://example.com/mock-animation.mp4",
            "duration_seconds": 5,
            "mock": True,
        }


higgsfield_service = HiggsfieldService()

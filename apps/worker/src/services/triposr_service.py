"""
TripoSR 3D model generation integration.

Converts 2D product images into interactive 3D models (.glb)
using TripoSR API via Fal.ai or Tripo direct.
Falls back to mock when TRIPOSR_API_KEY is not set.
"""

import os
import hashlib
from typing import Any, Dict, Optional

from src.services.http_client import http_client


class TripoSRService:
    BASE_URL = "https://api.tripo3d.ai/v2"

    def __init__(self):
        self.api_key = os.getenv("TRIPOSR_API_KEY", "")

    def is_configured(self) -> bool:
        return bool(self.api_key)

    def _headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    # ── Generate 3D Model ────────────────────────────────────────

    def generate_3d_model(
        self,
        image_url: str,
        output_format: str = "glb",
        remove_background: bool = True,
    ) -> Dict[str, Any]:
        """Convert a 2D product image into a 3D model."""
        if not self.is_configured():
            return self._mock_model(image_url, output_format)

        payload = {
            "type": "image_to_model",
            "file": {"type": "image_url", "url": image_url},
            "model_version": "v2.0-20240919",
            "output_format": output_format,
            "remove_background": remove_background,
        }
        resp = http_client.request(
            "POST", f"{self.BASE_URL}/task",
            headers=self._headers(), json=payload, timeout=60, retries=2,
        )
        data = resp.json()
        task_id = data.get("data", {}).get("task_id", "")
        return {
            "task_id": task_id,
            "status": "queued",
            "output_format": output_format,
        }

    # ── Poll Status ──────────────────────────────────────────────

    def get_model_status(self, task_id: str) -> Dict[str, Any]:
        """Check the status of a 3D model generation task."""
        if not self.is_configured():
            return {
                "task_id": task_id,
                "status": "success",
                "model_url": "https://example.com/mock-model.glb",
                "mock": True,
            }

        resp = http_client.request(
            "GET", f"{self.BASE_URL}/task/{task_id}",
            headers=self._headers(), timeout=30, retries=2,
        )
        data = resp.json().get("data", {})
        result = {
            "task_id": task_id,
            "status": data.get("status", "unknown"),
            "progress": data.get("progress", 0),
        }
        output = data.get("output", {})
        if output and output.get("model"):
            result["model_url"] = output["model"]
        if output and output.get("rendered_image"):
            result["preview_url"] = output["rendered_image"]
        return result

    # ── Text to 3D ───────────────────────────────────────────────

    def text_to_3d(self, prompt: str, output_format: str = "glb") -> Dict[str, Any]:
        """Generate a 3D model from text description."""
        if not self.is_configured():
            return self._mock_model(prompt, output_format)

        payload = {
            "type": "text_to_model",
            "prompt": prompt,
            "model_version": "v2.0-20240919",
            "output_format": output_format,
        }
        resp = http_client.request(
            "POST", f"{self.BASE_URL}/task",
            headers=self._headers(), json=payload, timeout=60, retries=2,
        )
        data = resp.json()
        return {
            "task_id": data.get("data", {}).get("task_id", ""),
            "status": "queued",
            "output_format": output_format,
        }

    # ── Mock ─────────────────────────────────────────────────────

    @staticmethod
    def _mock_model(seed: str, output_format: str) -> Dict[str, Any]:
        task_id = "tripo_" + hashlib.md5(seed.encode()).hexdigest()[:12]
        return {
            "task_id": task_id,
            "status": "success",
            "model_url": f"https://example.com/mock-model.{output_format}",
            "preview_url": "https://via.placeholder.com/400x400?text=3D+Model+Preview",
            "output_format": output_format,
            "mock": True,
        }


triposr_service = TripoSRService()

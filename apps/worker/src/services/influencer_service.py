"""
ComfyUI AI influencer generation service.

Creates AI-generated influencer photos and videos promoting products
using ComfyUI workflows running on a remote GPU (RunPod/Modal/etc).
Falls back to mock when COMFYUI_API_URL is not set.
"""

import os
import hashlib
import json
from typing import Any, Dict, List, Optional

from src.services.http_client import http_client


class InfluencerService:
    def __init__(self):
        self.api_url = os.getenv("COMFYUI_API_URL", "")
        self.api_key = os.getenv("COMFYUI_API_KEY", "")

    def is_configured(self) -> bool:
        return bool(self.api_url)

    def _headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    # ── Influencer Photo ─────────────────────────────────────────

    def generate_influencer_photo(
        self,
        product_image_url: str,
        prompt: str = "beautiful young woman model holding the product, professional studio photo, Instagram style",
        style: str = "realistic",
        negative_prompt: str = "blurry, low quality, deformed hands, extra fingers",
    ) -> Dict[str, Any]:
        """Generate an AI influencer photo with the product."""
        if not self.is_configured():
            return self._mock_photo(product_image_url, "photo")

        workflow = self._build_photo_workflow(
            product_image_url, prompt, style, negative_prompt
        )
        return self._submit_workflow(workflow, "influencer_photo")

    # ── Influencer Video ─────────────────────────────────────────

    def generate_influencer_video(
        self,
        product_image_url: str,
        script: str = "Hey guys! Check out this amazing product!",
        avatar_style: str = "casual_female",
        duration_seconds: int = 15,
    ) -> Dict[str, Any]:
        """Generate an AI influencer video reviewing the product."""
        if not self.is_configured():
            return self._mock_photo(product_image_url, "video")

        workflow = self._build_video_workflow(
            product_image_url, script, avatar_style, duration_seconds
        )
        return self._submit_workflow(workflow, "influencer_video")

    # ── UGC Batch Content ────────────────────────────────────────

    def generate_ugc_content(
        self,
        product_name: str,
        product_image_url: str,
        platform: str = "tiktok",
        count: int = 3,
    ) -> List[Dict[str, Any]]:
        """Generate batch UGC-style content for a product."""
        if not self.is_configured():
            return [
                self._mock_photo(product_image_url, f"ugc_{i}")
                for i in range(count)
            ]

        ugc_styles = [
            "selfie style, phone camera, natural lighting, excited expression",
            "unboxing video thumbnail, surprised face, product in frame",
            "lifestyle shot, using the product casually, aesthetic background",
            "before and after comparison, split screen feel",
            "review style, talking to camera, product visible",
        ]

        results = []
        for i in range(min(count, len(ugc_styles))):
            prompt = f"young woman influencer, {ugc_styles[i]}, promoting {product_name}, {platform} style"
            result = self.generate_influencer_photo(
                product_image_url, prompt=prompt, style="ugc"
            )
            results.append(result)
        return results

    # ── Poll Status ──────────────────────────────────────────────

    def get_generation_status(self, prompt_id: str) -> Dict[str, Any]:
        """Check the status of a ComfyUI generation."""
        if not self.is_configured():
            return {
                "prompt_id": prompt_id,
                "status": "complete",
                "output_url": "https://via.placeholder.com/512x512?text=AI+Influencer",
                "mock": True,
            }

        resp = http_client.request(
            "GET", f"{self.api_url}/history/{prompt_id}",
            headers=self._headers(), timeout=30, retries=2,
        )
        data = resp.json()
        history = data.get(prompt_id, {})
        outputs = history.get("outputs", {})

        # Extract the first image output from any node
        output_url = None
        for node_output in outputs.values():
            images = node_output.get("images", [])
            if images:
                output_url = images[0].get("url") or images[0].get("filename")
                break

        return {
            "prompt_id": prompt_id,
            "status": "complete" if outputs else "processing",
            "output_url": output_url,
        }

    # ── Workflow Builders ────────────────────────────────────────

    def _build_photo_workflow(
        self, image_url: str, prompt: str, style: str, negative: str,
    ) -> Dict[str, Any]:
        """Build a ComfyUI workflow for influencer photo generation."""
        return {
            "prompt": {
                "3": {
                    "class_type": "KSampler",
                    "inputs": {
                        "seed": int(hashlib.md5(prompt.encode()).hexdigest()[:8], 16),
                        "steps": 30,
                        "cfg": 7.5,
                        "sampler_name": "euler_ancestral",
                        "scheduler": "normal",
                        "denoise": 0.85,
                    },
                },
                "6": {
                    "class_type": "CLIPTextEncode",
                    "inputs": {"text": prompt},
                },
                "7": {
                    "class_type": "CLIPTextEncode",
                    "inputs": {"text": negative},
                },
                "load_image": {
                    "class_type": "LoadImage",
                    "inputs": {"image": image_url},
                },
            },
        }

    def _build_video_workflow(
        self, image_url: str, script: str, style: str, duration: int,
    ) -> Dict[str, Any]:
        """Build a ComfyUI workflow for influencer video generation."""
        return {
            "prompt": {
                "video_gen": {
                    "class_type": "AnimateDiffSchedule",
                    "inputs": {
                        "prompt": f"young woman talking to camera, {style}, saying: {script}",
                        "frames": duration * 24,
                        "fps": 24,
                    },
                },
                "load_image": {
                    "class_type": "LoadImage",
                    "inputs": {"image": image_url},
                },
            },
        }

    def _submit_workflow(self, workflow: Dict[str, Any], task_type: str) -> Dict[str, Any]:
        """Submit a workflow to ComfyUI and return the prompt ID."""
        try:
            resp = http_client.request(
                "POST", f"{self.api_url}/prompt",
                headers=self._headers(), json=workflow, timeout=60, retries=2,
            )
            data = resp.json()
            return {
                "prompt_id": data.get("prompt_id", ""),
                "status": "queued",
                "type": task_type,
            }
        except Exception as e:
            return {"error": str(e), "status": "failed", "type": task_type}

    # ── Mock ─────────────────────────────────────────────────────

    @staticmethod
    def _mock_photo(seed: str, kind: str) -> Dict[str, Any]:
        prompt_id = f"comfy_{kind}_" + hashlib.md5(seed.encode()).hexdigest()[:10]
        return {
            "prompt_id": prompt_id,
            "status": "complete",
            "type": f"influencer_{kind}",
            "output_url": "https://via.placeholder.com/512x768?text=AI+Influencer+Content",
            "mock": True,
        }


influencer_service = InfluencerService()

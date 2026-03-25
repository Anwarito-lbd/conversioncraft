"""
DeepSeek AI copywriting integration.

Uses the OpenAI-compatible API at api.deepseek.com for generating
product descriptions, ad copy, and SEO content.  Falls back to a
simple template when DEEPSEEK_API_KEY is not set.
"""

import json
import os
from typing import Any, Dict, List, Optional

from src.services.http_client import http_client


class DeepSeekService:
    BASE_URL = "https://api.deepseek.com/v1"

    def __init__(self):
        self.api_key = os.getenv("DEEPSEEK_API_KEY", "")

    def is_configured(self) -> bool:
        return bool(self.api_key)

    def _headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def _chat(self, messages: List[Dict[str, str]], max_tokens: int = 1024) -> str:
        if not self.is_configured():
            return ""
        payload = {
            "model": "deepseek-chat",
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": 0.7,
        }
        resp = http_client.request(
            "POST", f"{self.BASE_URL}/chat/completions",
            headers=self._headers(), json=payload, timeout=60, retries=2,
        )
        data = resp.json()
        choices = data.get("choices", [])
        if choices:
            return choices[0].get("message", {}).get("content", "")
        return ""

    # ── Product Description ──────────────────────────────────────

    def generate_product_description(
        self,
        product_name: str,
        features: List[str],
        tone: str = "professional",
    ) -> Dict[str, Any]:
        if not self.is_configured():
            return self._mock_description(product_name, features, tone)

        messages = [
            {"role": "system", "content": (
                f"You are an expert e-commerce copywriter. "
                f"Write in a {tone} tone. Output JSON with keys: "
                f"title, short_description, long_description, bullet_points."
            )},
            {"role": "user", "content": (
                f"Write a product description for '{product_name}'. "
                f"Key features: {', '.join(features)}"
            )},
        ]
        text = self._chat(messages, max_tokens=1024)
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return {"title": product_name, "long_description": text, "source": "deepseek"}

    # ── Ad Copy ──────────────────────────────────────────────────

    def generate_ad_copy(
        self,
        product_name: str,
        target_audience: str,
        platform: str = "tiktok",
    ) -> Dict[str, Any]:
        if not self.is_configured():
            return self._mock_ad_copy(product_name, target_audience, platform)

        messages = [
            {"role": "system", "content": (
                f"You are an expert {platform} ad copywriter. "
                f"Output JSON with keys: headline, primary_text, cta, hashtags."
            )},
            {"role": "user", "content": (
                f"Write a {platform} ad for '{product_name}' "
                f"targeting {target_audience}."
            )},
        ]
        text = self._chat(messages, max_tokens=512)
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return {"headline": product_name, "primary_text": text, "source": "deepseek"}

    # ── SEO Content ──────────────────────────────────────────────

    def generate_seo_content(
        self,
        product_name: str,
        keywords: List[str],
    ) -> Dict[str, Any]:
        if not self.is_configured():
            return {"title_tag": product_name, "meta_description": f"Buy {product_name}", "mock": True}

        messages = [
            {"role": "system", "content": (
                "You are an SEO specialist. Output JSON with keys: "
                "title_tag, meta_description, h1, alt_text."
            )},
            {"role": "user", "content": (
                f"Generate SEO metadata for '{product_name}'. "
                f"Target keywords: {', '.join(keywords)}"
            )},
        ]
        text = self._chat(messages, max_tokens=512)
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return {"title_tag": product_name, "raw": text, "source": "deepseek"}

    # ── Mocks ────────────────────────────────────────────────────

    @staticmethod
    def _mock_description(name: str, features: List[str], tone: str) -> Dict[str, Any]:
        return {
            "title": name,
            "short_description": f"Premium {name} — {tone} quality.",
            "long_description": f"{name} offers {', '.join(features[:3])}.",
            "bullet_points": features[:5],
            "mock": True,
        }

    @staticmethod
    def _mock_ad_copy(name: str, audience: str, platform: str) -> Dict[str, Any]:
        return {
            "headline": f"🔥 {name} — Must-Have!",
            "primary_text": f"Perfect for {audience}. Order now!",
            "cta": "Shop Now",
            "hashtags": [f"#{name.replace(' ', '')}", f"#{platform}"],
            "mock": True,
        }


deepseek_service = DeepSeekService()

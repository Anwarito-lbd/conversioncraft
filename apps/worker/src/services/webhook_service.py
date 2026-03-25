import base64
import hashlib
import hmac
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional


class WebhookService:
    def __init__(self, path: str | None = None):
        self.path = Path(path) if path else Path(__file__).resolve().parents[2] / "data" / "webhooks.jsonl"
        self.path.parent.mkdir(parents=True, exist_ok=True)
        if not self.path.exists():
            self.path.write_text("", encoding="utf-8")

        self.shopify_secret = os.getenv("SHOPIFY_WEBHOOK_SECRET", "")
        self.meta_webhook_secret = os.getenv("META_WEBHOOK_SECRET", "")
        self.tiktok_webhook_secret = os.getenv("TIKTOK_WEBHOOK_SECRET", "")

    def _verify_shopify(self, body: bytes, header_signature: str) -> bool:
        if not self.shopify_secret or not header_signature:
            return False
        digest = hmac.new(self.shopify_secret.encode("utf-8"), body, hashlib.sha256).digest()
        computed = base64.b64encode(digest).decode("utf-8")
        return hmac.compare_digest(computed, header_signature)

    def _verify_meta(self, body: bytes, header_signature: str) -> bool:
        if not self.meta_webhook_secret or not header_signature.startswith("sha256="):
            return False
        signature = header_signature.split("=", 1)[1]
        digest = hmac.new(self.meta_webhook_secret.encode("utf-8"), body, hashlib.sha256).hexdigest()
        return hmac.compare_digest(digest, signature)

    def _verify_tiktok(self, body: bytes, header_signature: str) -> bool:
        if not self.tiktok_webhook_secret or not header_signature:
            return False
        digest = hmac.new(self.tiktok_webhook_secret.encode("utf-8"), body, hashlib.sha256).hexdigest()
        return hmac.compare_digest(digest, header_signature)

    def verify(self, platform: str, body: bytes, headers: Dict[str, str]) -> bool:
        platform_l = platform.lower()
        if platform_l == "shopify":
            return self._verify_shopify(body, headers.get("x-shopify-hmac-sha256", ""))
        if platform_l == "meta":
            return self._verify_meta(body, headers.get("x-hub-signature-256", ""))
        if platform_l == "tiktok":
            return self._verify_tiktok(body, headers.get("x-tt-signature", ""))
        return False

    def persist_event(self, platform: str, event: Dict[str, Any], user_id: Optional[str] = None) -> None:
        row = {
            "ts": datetime.now(timezone.utc).isoformat(),
            "platform": platform,
            "user_id": user_id or "unknown",
            "event": event,
        }
        with self.path.open("a", encoding="utf-8") as fp:
            fp.write(json.dumps(row) + "\n")


webhook_service = WebhookService()

"""
Stripe payment processing integration.

Handles checkout sessions, Connect accounts, balance queries, and webhook verification.
Falls back to mock responses when STRIPE_SECRET_KEY is not set.
"""

import os
import hashlib
import hmac
import time
from typing import Any, Dict, Optional

from src.services.http_client import http_client


class StripeService:
    BASE_URL = "https://api.stripe.com/v1"

    def __init__(self):
        self.secret_key = os.getenv("STRIPE_SECRET_KEY", "")
        self.webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "")

    def is_configured(self) -> bool:
        return bool(self.secret_key)

    def _headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/x-www-form-urlencoded",
        }

    # ── Checkout ─────────────────────────────────────────────────

    def create_checkout_session(
        self,
        *,
        price_cents: int,
        product_name: str,
        success_url: str,
        cancel_url: str,
        currency: str = "usd",
        quantity: int = 1,
    ) -> Dict[str, Any]:
        if not self.is_configured():
            return self._mock_checkout(product_name, price_cents)

        payload = {
            "mode": "payment",
            "success_url": success_url,
            "cancel_url": cancel_url,
            "line_items[0][price_data][currency]": currency,
            "line_items[0][price_data][product_data][name]": product_name,
            "line_items[0][price_data][unit_amount]": str(price_cents),
            "line_items[0][quantity]": str(quantity),
        }
        resp = http_client.request(
            "POST", f"{self.BASE_URL}/checkout/sessions",
            headers=self._headers(), data=payload, timeout=30, retries=2,
        )
        return resp.json()

    # ── Connect ──────────────────────────────────────────────────

    def create_connect_account(self, email: str, country: str = "US") -> Dict[str, Any]:
        if not self.is_configured():
            return {"id": "acct_mock_123", "email": email, "mock": True}

        payload = {
            "type": "express",
            "email": email,
            "country": country,
        }
        resp = http_client.request(
            "POST", f"{self.BASE_URL}/accounts",
            headers=self._headers(), data=payload, timeout=30, retries=2,
        )
        return resp.json()

    # ── Balance ──────────────────────────────────────────────────

    def get_balance(self, stripe_account_id: Optional[str] = None) -> Dict[str, Any]:
        if not self.is_configured():
            return {"available": [{"amount": 0, "currency": "usd"}], "mock": True}

        headers = self._headers()
        if stripe_account_id:
            headers["Stripe-Account"] = stripe_account_id
        resp = http_client.request(
            "GET", f"{self.BASE_URL}/balance",
            headers=headers, timeout=15, retries=2,
        )
        return resp.json()

    # ── Webhooks ─────────────────────────────────────────────────

    def verify_webhook(self, payload: bytes, sig_header: str) -> bool:
        if not self.webhook_secret:
            return False
        try:
            parts = dict(item.split("=", 1) for item in sig_header.split(","))
            timestamp = parts.get("t", "")
            signature = parts.get("v1", "")
            signed_payload = f"{timestamp}.{payload.decode('utf-8')}"
            expected = hmac.new(
                self.webhook_secret.encode(), signed_payload.encode(), hashlib.sha256
            ).hexdigest()
            return hmac.compare_digest(expected, signature)
        except Exception:
            return False

    # ── Mock helpers ─────────────────────────────────────────────

    @staticmethod
    def _mock_checkout(product_name: str, price_cents: int) -> Dict[str, Any]:
        return {
            "id": "cs_mock_" + hashlib.md5(product_name.encode()).hexdigest()[:12],
            "url": "https://checkout.stripe.com/mock-session",
            "payment_status": "unpaid",
            "amount_total": price_cents,
            "mock": True,
        }


stripe_service = StripeService()

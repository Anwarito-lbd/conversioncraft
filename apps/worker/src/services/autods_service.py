"""
AutoDS order fulfillment automation integration.

Handles product import, order fulfillment, tracking, and
inventory sync via AutoDS REST API.  Falls back to mock
when AUTODS_API_TOKEN is not set.
"""

import os
from typing import Any, Dict, List

from src.services.http_client import http_client


class AutoDSService:
    BASE_URL = "https://api.autods.com/v1"

    def __init__(self):
        self.api_token = os.getenv("AUTODS_API_TOKEN", "")

    def is_configured(self) -> bool:
        return bool(self.api_token)

    def _headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json",
        }

    # ── Import Product ───────────────────────────────────────────

    def import_product(self, product_url: str) -> Dict[str, Any]:
        if not self.is_configured():
            return {"product_id": "autods_mock_p1", "source_url": product_url, "status": "imported", "mock": True}

        payload = {"product_url": product_url}
        resp = http_client.request(
            "POST", f"{self.BASE_URL}/products/import",
            headers=self._headers(), json=payload, timeout=30, retries=2,
        )
        return resp.json()

    # ── Fulfill Order ────────────────────────────────────────────

    def fulfill_order(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        if not self.is_configured():
            return {
                "fulfillment_id": "autods_ful_mock_001",
                "status": "processing",
                "order": order_data,
                "mock": True,
            }

        resp = http_client.request(
            "POST", f"{self.BASE_URL}/orders/fulfill",
            headers=self._headers(), json=order_data, timeout=30, retries=2,
        )
        return resp.json()

    # ── Tracking ─────────────────────────────────────────────────

    def get_order_tracking(self, order_id: str) -> Dict[str, Any]:
        if not self.is_configured():
            return {
                "order_id": order_id,
                "status": "shipped",
                "tracking_number": "MOCK_TRACK_456",
                "carrier": "ePacket",
                "estimated_delivery": "7-15 business days",
                "mock": True,
            }

        resp = http_client.request(
            "GET", f"{self.BASE_URL}/orders/{order_id}/tracking",
            headers=self._headers(), timeout=30, retries=2,
        )
        return resp.json()

    # ── Inventory Sync ───────────────────────────────────────────

    def sync_inventory(self, product_ids: List[str]) -> List[Dict[str, Any]]:
        if not self.is_configured():
            return [
                {"product_id": pid, "in_stock": True, "price": 9.99, "mock": True}
                for pid in product_ids
            ]

        payload = {"product_ids": product_ids}
        resp = http_client.request(
            "POST", f"{self.BASE_URL}/products/sync",
            headers=self._headers(), json=payload, timeout=30, retries=2,
        )
        data = resp.json()
        return data if isinstance(data, list) else data.get("products", [])


autods_service = AutoDSService()

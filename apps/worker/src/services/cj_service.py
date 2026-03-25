"""
CJ Dropshipping API integration.

Provides product search, product details, shipping estimates,
order creation, and order tracking via CJ's REST API.
Falls back to mock data when CJ_API_TOKEN is not set.
"""

import os
from typing import Any, Dict, List, Optional

from src.services.http_client import http_client


class CJService:
    BASE_URL = "https://developers.cjdropshipping.com/api/v2"

    def __init__(self):
        self.api_token = os.getenv("CJ_API_TOKEN", "")

    def is_configured(self) -> bool:
        return bool(self.api_token)

    def _headers(self) -> Dict[str, str]:
        return {
            "CJ-Access-Token": self.api_token,
            "Content-Type": "application/json",
        }

    # ── Product Search ───────────────────────────────────────────

    def search_products(
        self,
        keyword: str,
        page: int = 1,
        page_size: int = 20,
        category_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        if not self.is_configured():
            return self._mock_products(keyword)

        payload: Dict[str, Any] = {
            "productNameEn": keyword,
            "pageNum": page,
            "pageSize": page_size,
        }
        if category_id:
            payload["categoryId"] = category_id

        resp = http_client.request(
            "POST", f"{self.BASE_URL}/product/list",
            headers=self._headers(), json=payload, timeout=30, retries=2,
        )
        data = resp.json()
        return data.get("data", {}).get("list", [])

    # ── Product Detail ───────────────────────────────────────────

    def get_product_details(self, pid: str) -> Dict[str, Any]:
        if not self.is_configured():
            return {"pid": pid, "name": f"CJ Product {pid}", "mock": True}

        resp = http_client.request(
            "GET", f"{self.BASE_URL}/product/query",
            headers=self._headers(), params={"pid": pid}, timeout=30, retries=2,
        )
        return resp.json().get("data", {})

    # ── Shipping ─────────────────────────────────────────────────

    def get_shipping_estimate(
        self, pid: str, country_code: str = "US", quantity: int = 1,
    ) -> Dict[str, Any]:
        if not self.is_configured():
            return {"pid": pid, "country": country_code, "estimated_days": "7-15", "cost": 2.99, "mock": True}

        payload = {
            "startCountryCode": "CN",
            "endCountryCode": country_code,
            "products": [{"quantity": quantity, "vid": pid}],
        }
        resp = http_client.request(
            "POST", f"{self.BASE_URL}/logistics/freight",
            headers=self._headers(), json=payload, timeout=30, retries=2,
        )
        return resp.json().get("data", {})

    # ── Orders ───────────────────────────────────────────────────

    def create_order(
        self,
        product_id: str,
        variant_id: str,
        shipping_info: Dict[str, Any],
        quantity: int = 1,
    ) -> Dict[str, Any]:
        if not self.is_configured():
            return {"order_id": "cj_mock_order_001", "status": "pending", "mock": True}

        payload = {
            "orderNumber": f"CC-{product_id[:8]}",
            "shippingZip": shipping_info.get("zip", ""),
            "shippingCountryCode": shipping_info.get("country", "US"),
            "shippingCountry": shipping_info.get("country_name", "United States"),
            "shippingProvince": shipping_info.get("state", ""),
            "shippingCity": shipping_info.get("city", ""),
            "shippingAddress": shipping_info.get("address", ""),
            "shippingCustomerName": shipping_info.get("name", ""),
            "shippingPhone": shipping_info.get("phone", ""),
            "products": [{"vid": variant_id, "quantity": quantity}],
        }
        resp = http_client.request(
            "POST", f"{self.BASE_URL}/shopping/order/create",
            headers=self._headers(), json=payload, timeout=30, retries=2,
        )
        return resp.json().get("data", {})

    def get_order_status(self, order_id: str) -> Dict[str, Any]:
        if not self.is_configured():
            return {"order_id": order_id, "status": "processing", "tracking": "MOCK123", "mock": True}

        resp = http_client.request(
            "GET", f"{self.BASE_URL}/shopping/order/query",
            headers=self._headers(), params={"orderId": order_id}, timeout=30, retries=2,
        )
        return resp.json().get("data", {})

    # ── Mock ─────────────────────────────────────────────────────

    @staticmethod
    def _mock_products(keyword: str) -> List[Dict[str, Any]]:
        return [
            {
                "pid": f"cj-{i}",
                "name": f"{keyword.title()} Product {i}",
                "sellPrice": round(5.0 + i * 3.5, 2),
                "image": "https://via.placeholder.com/300",
                "category": keyword,
                "source": "CJ Mock",
            }
            for i in range(1, 6)
        ]


cj_service = CJService()

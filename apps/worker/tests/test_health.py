"""
Tests for the ConversionCraft Worker API.
Covers health endpoint, Bearer session auth lifecycle, unauthenticated 401 enforcement,
and authenticated /api/* integration endpoints.
"""

import os
import sys
import uuid

import pytest
from fastapi.testclient import TestClient

# Ensure project root is on path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from main import app

client = TestClient(app)


@pytest.fixture(scope="module")
def auth_headers() -> dict[str, str]:
    """Register a test user via /api/auth/register and return Bearer headers."""
    unique = uuid.uuid4().hex[:10]
    email = f"pytest-{unique}@example.com"
    password = f"TestPass!{unique}"

    reg_resp = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": password,
            "name": "Pytest Runner",
            "org_name": f"Pytest Team {unique}",
        },
    )
    assert reg_resp.status_code == 200, reg_resp.text
    reg_data = reg_resp.json()
    assert reg_data.get("token")
    assert reg_data.get("user", {}).get("email") == email

    return {"Authorization": f"Bearer {reg_data['token']}"}


def test_health():
    response = client.get("/health")
    assert response.status_code == 200


def test_unauthenticated_api_requests_return_401():
    resp_no_header = client.get("/api/integrations/status")
    assert resp_no_header.status_code == 401

    resp_bad_token = client.get(
        "/api/auth/session",
        headers={"Authorization": "Bearer invalid-session-token"},
    )
    assert resp_bad_token.status_code == 401


def test_cors_preflight_options_allowed_without_auth():
    resp = client.options(
        "/api/auth/session",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "authorization",
        },
    )
    assert resp.status_code == 200
    assert resp.headers.get("access-control-allow-origin") == "http://localhost:3000"


def test_auth_session_login_and_logout_lifecycle():
    unique = uuid.uuid4().hex[:10]
    email = f"lifecycle-{unique}@example.com"
    password = f"AuthPass!{unique}"

    reg = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": password,
            "name": "Lifecycle User",
            "org_name": f"Lifecycle Org {unique}",
        },
    )
    assert reg.status_code == 200

    login = client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
    )
    assert login.status_code == 200
    token = login.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    session_resp = client.get("/api/auth/session", headers=headers)
    assert session_resp.status_code == 200
    assert session_resp.json()["user"]["email"] == email

    logout = client.post("/api/auth/logout", headers=headers)
    assert logout.status_code == 200
    assert logout.json()["revoked"] is True

    after_logout = client.get("/api/auth/session", headers=headers)
    assert after_logout.status_code == 401


def test_integrations_status(auth_headers: dict[str, str]):
    response = client.get("/api/integrations/status", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    expected_keys = [
        "shopify", "meta", "tiktok", "stripe", "deepseek",
        "cj_dropshipping", "creatify", "flair", "autods",
    ]
    for key in expected_keys:
        assert key in data


def test_payments_status(auth_headers: dict[str, str]):
    response = client.get("/api/payments/status", headers=auth_headers)
    assert response.status_code == 200


def test_copy_status(auth_headers: dict[str, str]):
    response = client.get("/api/copy/status", headers=auth_headers)
    assert response.status_code == 200


def test_cj_status(auth_headers: dict[str, str]):
    response = client.get("/api/sourcing/cj/status", headers=auth_headers)
    assert response.status_code == 200


def test_creatives_status(auth_headers: dict[str, str]):
    response = client.get("/api/creatives/status", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "video_configured" in data
    assert "photo_configured" in data


def test_fulfillment_status(auth_headers: dict[str, str]):
    response = client.get("/api/fulfillment/status", headers=auth_headers)
    assert response.status_code == 200


def test_mock_checkout(auth_headers: dict[str, str]):
    response = client.post(
        "/api/payments/checkout",
        headers=auth_headers,
        json={
            "product_name": "Test Product",
            "price_cents": 2999,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "id" in data or "mock" in data


def test_mock_description(auth_headers: dict[str, str]):
    response = client.post(
        "/api/copy/description",
        headers=auth_headers,
        json={
            "product_name": "LED Desk Lamp",
            "features": ["adjustable brightness", "USB charging", "touch control"],
        },
    )
    assert response.status_code == 200


def test_mock_ad_copy(auth_headers: dict[str, str]):
    response = client.post(
        "/api/copy/ad",
        headers=auth_headers,
        json={
            "product_name": "LED Desk Lamp",
            "target_audience": "students and remote workers",
        },
    )
    assert response.status_code == 200


def test_cj_search_mock(auth_headers: dict[str, str]):
    response = client.get("/api/sourcing/cj/search?keyword=lamp", headers=auth_headers)
    assert response.status_code == 200


def test_creatives_video_mock(auth_headers: dict[str, str]):
    response = client.post(
        "/api/creatives/video",
        headers=auth_headers,
        json={"product_url": "https://example.com/product"},
    )
    assert response.status_code == 200


def test_creatives_photo_mock(auth_headers: dict[str, str]):
    response = client.post(
        "/api/creatives/photo",
        headers=auth_headers,
        json={"image_url": "https://example.com/image.jpg"},
    )
    assert response.status_code == 200


def test_fulfillment_import_mock(auth_headers: dict[str, str]):
    response = client.post(
        "/api/fulfillment/import",
        headers=auth_headers,
        json={"product_url": "https://aliexpress.com/item/123.html"},
    )
    assert response.status_code == 200


def test_fulfillment_track_mock(auth_headers: dict[str, str]):
    response = client.get("/api/fulfillment/track/order_123", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "order_id" in data or "tracking_number" in data

"""
Basic tests for the ConversionCraft Worker API.
Tests health endpoint and service imports.
"""

import sys
import os

# Ensure project root is on path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200


def test_integrations_status():
    response = client.get("/api/integrations/status")
    assert response.status_code == 200
    data = response.json()
    expected_keys = [
        "shopify", "meta", "tiktok", "stripe", "deepseek",
        "cj_dropshipping", "creatify", "flair", "autods",
    ]
    for key in expected_keys:
        assert key in data


def test_payments_status():
    response = client.get("/api/payments/status")
    assert response.status_code == 200


def test_copy_status():
    response = client.get("/api/copy/status")
    assert response.status_code == 200


def test_cj_status():
    response = client.get("/api/sourcing/cj/status")
    assert response.status_code == 200


def test_creatives_status():
    response = client.get("/api/creatives/status")
    assert response.status_code == 200
    data = response.json()
    assert "video_configured" in data
    assert "photo_configured" in data


def test_fulfillment_status():
    response = client.get("/api/fulfillment/status")
    assert response.status_code == 200


def test_mock_checkout():
    response = client.post("/api/payments/checkout", json={
        "product_name": "Test Product",
        "price_cents": 2999,
    })
    assert response.status_code == 200
    data = response.json()
    assert "id" in data or "mock" in data


def test_mock_description():
    response = client.post("/api/copy/description", json={
        "product_name": "LED Desk Lamp",
        "features": ["adjustable brightness", "USB charging", "touch control"],
    })
    assert response.status_code == 200


def test_mock_ad_copy():
    response = client.post("/api/copy/ad", json={
        "product_name": "LED Desk Lamp",
        "target_audience": "students and remote workers",
    })
    assert response.status_code == 200


def test_cj_search_mock():
    response = client.get("/api/sourcing/cj/search?keyword=lamp")
    assert response.status_code == 200


def test_creatives_video_mock():
    response = client.post("/api/creatives/video", json={
        "product_url": "https://example.com/product",
    })
    assert response.status_code == 200


def test_creatives_photo_mock():
    response = client.post("/api/creatives/photo", json={
        "image_url": "https://example.com/image.jpg",
    })
    assert response.status_code == 200


def test_fulfillment_import_mock():
    response = client.post("/api/fulfillment/import", json={
        "product_url": "https://aliexpress.com/item/123.html",
    })
    assert response.status_code == 200


def test_fulfillment_track_mock():
    response = client.get("/api/fulfillment/track/order_123")
    assert response.status_code == 200
    data = response.json()
    assert "order_id" in data or "tracking_number" in data

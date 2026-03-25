"""
Mailchimp email marketing integration.

Manages audiences, subscribers, campaigns, and automations
for dropshipping email flows (welcome, abandoned cart, post-purchase).
Falls back to mock when MAILCHIMP_API_KEY is not set.
"""

import os
import hashlib
from typing import Any, Dict, List, Optional

from src.services.http_client import http_client


# ── Pre-built email templates ────────────────────────────────────

EMAIL_TEMPLATES = {
    "welcome": {
        "subject": "Welcome to {store_name}! 🎉 Here's 10% Off",
        "preview": "Thanks for joining — grab your exclusive discount inside.",
        "body": """
<h1>Welcome, {name}!</h1>
<p>Thanks for joining {store_name}. We're excited to have you.</p>
<p>As a thank you, here's <strong>10% off</strong> your first order:</p>
<div style="text-align:center;padding:20px;background:#f0fdf4;border-radius:8px;margin:20px 0;">
  <span style="font-size:24px;font-weight:bold;color:#16a34a;">WELCOME10</span>
</div>
<a href="{store_url}" style="display:inline-block;padding:14px 32px;background:#2563eb;color:white;border-radius:6px;text-decoration:none;font-weight:bold;">Shop Now →</a>
""",
    },
    "abandoned_cart": {
        "subject": "You left something behind! 🛒",
        "preview": "Your cart is waiting — complete your order before it's gone.",
        "body": """
<h1>Forgot Something?</h1>
<p>You left items in your cart. Don't worry — we saved them for you.</p>
<p>Complete your order now before they sell out!</p>
<a href="{cart_url}" style="display:inline-block;padding:14px 32px;background:#ef4444;color:white;border-radius:6px;text-decoration:none;font-weight:bold;">Complete My Order →</a>
<p style="margin-top:20px;color:#6b7280;">Free shipping on orders over $50</p>
""",
    },
    "post_purchase": {
        "subject": "Your order is on its way! 📦",
        "preview": "Track your shipment + a special offer just for you.",
        "body": """
<h1>Thank You for Your Order!</h1>
<p>Your {product_name} is on its way. Here's your tracking info:</p>
<p><strong>Tracking: </strong><a href="{tracking_url}">{tracking_number}</a></p>
<p>Estimated delivery: {delivery_estimate}</p>
<hr style="margin:24px 0;" />
<h2>You Might Also Like</h2>
<p>Get <strong>15% off</strong> your next order with code <strong>THANKYOU15</strong></p>
""",
    },
    "review_request": {
        "subject": "How's your {product_name}? ⭐",
        "preview": "We'd love to hear your feedback!",
        "body": """
<h1>Enjoying Your {product_name}?</h1>
<p>We'd love to hear about your experience. Your review helps other shoppers!</p>
<a href="{review_url}" style="display:inline-block;padding:14px 32px;background:#f59e0b;color:white;border-radius:6px;text-decoration:none;font-weight:bold;">Leave a Review ⭐</a>
<p style="margin-top:20px;">As a thank you, you'll receive a <strong>20% off</strong> coupon.</p>
""",
    },
}


class MailchimpService:
    def __init__(self):
        self.api_key = os.getenv("MAILCHIMP_API_KEY", "")
        self.server_prefix = os.getenv("MAILCHIMP_SERVER_PREFIX", "us1")

    @property
    def base_url(self) -> str:
        return f"https://{self.server_prefix}.api.mailchimp.com/3.0"

    def is_configured(self) -> bool:
        return bool(self.api_key)

    def _headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    # ── Audience Management ──────────────────────────────────────

    def create_audience(self, name: str, from_email: str, from_name: str) -> Dict[str, Any]:
        if not self.is_configured():
            return {"id": "aud_mock_1", "name": name, "member_count": 0, "mock": True}

        payload = {
            "name": name,
            "permission_reminder": "You signed up on our website.",
            "email_type_option": True,
            "contact": {"company": name, "address1": "", "city": "", "state": "", "zip": "", "country": "US"},
            "campaign_defaults": {"from_name": from_name, "from_email": from_email, "subject": "", "language": "en"},
        }
        resp = http_client.request(
            "POST", f"{self.base_url}/lists",
            headers=self._headers(), json=payload, timeout=30, retries=2,
        )
        return resp.json()

    def add_subscriber(
        self, audience_id: str, email: str,
        first_name: str = "", tags: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        if not self.is_configured():
            return {"id": "sub_mock_1", "email": email, "status": "subscribed", "mock": True}

        payload = {
            "email_address": email,
            "status": "subscribed",
            "merge_fields": {"FNAME": first_name},
        }
        if tags:
            payload["tags"] = tags

        subscriber_hash = hashlib.md5(email.lower().encode()).hexdigest()
        resp = http_client.request(
            "PUT", f"{self.base_url}/lists/{audience_id}/members/{subscriber_hash}",
            headers=self._headers(), json=payload, timeout=30, retries=2,
        )
        return resp.json()

    # ── Campaign Management ──────────────────────────────────────

    def create_campaign(
        self, audience_id: str, subject: str,
        html_content: str, from_name: str = "Store",
    ) -> Dict[str, Any]:
        if not self.is_configured():
            return {"id": "camp_mock_1", "subject": subject, "status": "draft", "mock": True}

        payload = {
            "type": "regular",
            "recipients": {"list_id": audience_id},
            "settings": {"subject_line": subject, "from_name": from_name, "reply_to": ""},
        }
        resp = http_client.request(
            "POST", f"{self.base_url}/campaigns",
            headers=self._headers(), json=payload, timeout=30, retries=2,
        )
        campaign = resp.json()
        campaign_id = campaign.get("id", "")

        if campaign_id and html_content:
            http_client.request(
                "PUT", f"{self.base_url}/campaigns/{campaign_id}/content",
                headers=self._headers(),
                json={"html": html_content},
                timeout=30, retries=2,
            )

        return campaign

    def send_campaign(self, campaign_id: str) -> Dict[str, Any]:
        if not self.is_configured():
            return {"id": campaign_id, "status": "sent", "mock": True}

        resp = http_client.request(
            "POST", f"{self.base_url}/campaigns/{campaign_id}/actions/send",
            headers=self._headers(), timeout=30, retries=2,
        )
        return {"id": campaign_id, "status": "sent"}

    # ── Automation Flows ─────────────────────────────────────────

    def create_email_flow(
        self, flow_type: str, store_name: str = "My Store",
        store_url: str = "https://mystore.com",
    ) -> Dict[str, Any]:
        """Get a pre-built email flow template ready to use."""
        template = EMAIL_TEMPLATES.get(flow_type)
        if not template:
            return {"error": f"Unknown flow type: {flow_type}", "available": list(EMAIL_TEMPLATES.keys())}

        return {
            "flow_type": flow_type,
            "subject": template["subject"].format(
                store_name=store_name, product_name="Your Product",
            ),
            "preview_text": template["preview"],
            "html": template["body"].format(
                name="Customer",
                store_name=store_name,
                store_url=store_url,
                cart_url=f"{store_url}/cart",
                product_name="Your Product",
                tracking_url="#",
                tracking_number="TRACK123",
                delivery_estimate="7-12 business days",
                review_url=f"{store_url}/review",
            ),
        }

    def get_available_flows(self) -> List[str]:
        return list(EMAIL_TEMPLATES.keys())


mailchimp_service = MailchimpService()

import os
import secrets
from datetime import datetime, timezone
from typing import Any, Dict
from urllib.parse import urlencode

from src.services.http_client import http_client


class OAuthService:
    def __init__(self):
        self.shopify_client_id = os.getenv("SHOPIFY_CLIENT_ID", "")
        self.shopify_client_secret = os.getenv("SHOPIFY_CLIENT_SECRET", "")

        self.meta_client_id = os.getenv("META_APP_ID", "")
        self.meta_client_secret = os.getenv("META_APP_SECRET", "")

        self.tiktok_client_key = os.getenv("TIKTOK_CLIENT_KEY", "")
        self.tiktok_client_secret = os.getenv("TIKTOK_CLIENT_SECRET", "")

    def credentials_status(self) -> Dict[str, bool]:
        return {
            "shopify": bool(self.shopify_client_id and self.shopify_client_secret),
            "meta": bool(self.meta_client_id and self.meta_client_secret),
            "tiktok": bool(self.tiktok_client_key and self.tiktok_client_secret),
        }

    def create_state(self) -> str:
        return secrets.token_urlsafe(24)

    def shopify_connect_url(self, shop: str, redirect_uri: str, scopes: str, state: str) -> str:
        clean_shop = shop.replace("https://", "").replace("http://", "").strip("/")
        query = urlencode(
            {
                "client_id": self.shopify_client_id,
                "scope": scopes,
                "redirect_uri": redirect_uri,
                "state": state,
            }
        )
        return f"https://{clean_shop}/admin/oauth/authorize?{query}"

    def exchange_shopify_code(self, shop: str, code: str) -> Dict[str, Any]:
        clean_shop = shop.replace("https://", "").replace("http://", "").strip("/")
        url = f"https://{clean_shop}/admin/oauth/access_token"
        payload = {
            "client_id": self.shopify_client_id,
            "client_secret": self.shopify_client_secret,
            "code": code,
        }
        response = http_client.request("POST", url, json=payload, timeout=30, retries=3)
        data = response.json()
        return {
            "access_token": data.get("access_token"),
            "scope": data.get("scope", ""),
            "shop": clean_shop,
            "connected_at": datetime.now(timezone.utc).isoformat(),
        }

    def meta_connect_url(self, redirect_uri: str, scopes: str, state: str) -> str:
        query = urlencode(
            {
                "client_id": self.meta_client_id,
                "redirect_uri": redirect_uri,
                "state": state,
                "scope": scopes,
                "response_type": "code",
            }
        )
        return f"https://www.facebook.com/v21.0/dialog/oauth?{query}"

    def exchange_meta_code(self, code: str, redirect_uri: str) -> Dict[str, Any]:
        token_url = "https://graph.facebook.com/v21.0/oauth/access_token"
        params = {
            "client_id": self.meta_client_id,
            "client_secret": self.meta_client_secret,
            "redirect_uri": redirect_uri,
            "code": code,
        }
        response = http_client.request("GET", token_url, params=params, timeout=30, retries=3)
        data = response.json()

        access_token = data.get("access_token", "")
        ad_accounts = []
        if access_token:
            act_resp = http_client.request(
                "GET",
                "https://graph.facebook.com/v21.0/me/adaccounts",
                params={"access_token": access_token, "fields": "id,name,account_id"},
                timeout=30,
                retries=2,
            )
            ad_accounts = act_resp.json().get("data", [])

        return {
            "access_token": access_token,
            "token_type": data.get("token_type", "bearer"),
            "expires_in": data.get("expires_in"),
            "ad_accounts": ad_accounts,
            "connected_at": datetime.now(timezone.utc).isoformat(),
        }

    def refresh_meta_token(self, access_token: str) -> Dict[str, Any]:
        url = "https://graph.facebook.com/v21.0/oauth/access_token"
        params = {
            "grant_type": "fb_exchange_token",
            "client_id": self.meta_client_id,
            "client_secret": self.meta_client_secret,
            "fb_exchange_token": access_token,
        }
        response = http_client.request("GET", url, params=params, timeout=30, retries=3)
        data = response.json()

        new_access_token = data.get("access_token", access_token)
        ad_accounts = []
        act_resp = http_client.request(
            "GET",
            "https://graph.facebook.com/v21.0/me/adaccounts",
            params={"access_token": new_access_token, "fields": "id,name,account_id"},
            timeout=30,
            retries=2,
        )
        ad_accounts = act_resp.json().get("data", [])

        return {
            "access_token": new_access_token,
            "token_type": data.get("token_type", "bearer"),
            "expires_in": data.get("expires_in", 60 * 24 * 60 * 60),
            "ad_accounts": ad_accounts,
        }

    def tiktok_connect_url(self, redirect_uri: str, scopes: str, state: str) -> str:
        query = urlencode(
            {
                "client_key": self.tiktok_client_key,
                "redirect_uri": redirect_uri,
                "state": state,
                "scope": scopes,
                "response_type": "code",
            }
        )
        return f"https://www.tiktok.com/v2/auth/authorize/?{query}"

    def exchange_tiktok_code(self, code: str, redirect_uri: str) -> Dict[str, Any]:
        url = "https://open.tiktokapis.com/v2/oauth/token/"
        payload = {
            "client_key": self.tiktok_client_key,
            "client_secret": self.tiktok_client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": redirect_uri,
        }
        response = http_client.request("POST", url, data=payload, timeout=30, retries=3)
        data = response.json().get("data", {})
        return {
            "access_token": data.get("access_token", ""),
            "refresh_token": data.get("refresh_token", ""),
            "expires_in": data.get("expires_in"),
            "open_id": data.get("open_id", ""),
            "connected_at": datetime.now(timezone.utc).isoformat(),
        }

    def refresh_tiktok_token(self, refresh_token: str) -> Dict[str, Any]:
        url = "https://open.tiktokapis.com/v2/oauth/token/"
        payload = {
            "client_key": self.tiktok_client_key,
            "client_secret": self.tiktok_client_secret,
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
        }
        response = http_client.request("POST", url, data=payload, timeout=30, retries=3)
        data = response.json().get("data", {})
        return {
            "access_token": data.get("access_token", ""),
            "refresh_token": data.get("refresh_token", refresh_token),
            "expires_in": data.get("expires_in"),
            "open_id": data.get("open_id", ""),
        }


oauth_service = OAuthService()

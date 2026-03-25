import base64
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict

from cryptography.fernet import Fernet, InvalidToken


class TokenStore:
    def __init__(self, path: str | None = None):
        if path:
            self.path = Path(path)
        else:
            self.path = Path(__file__).resolve().parents[2] / "data" / "tokens.json"
        self.path.parent.mkdir(parents=True, exist_ok=True)
        if not self.path.exists():
            self.path.write_text("{}", encoding="utf-8")
        self.fernet = Fernet(self._load_or_create_key())

    def _load_or_create_key(self) -> bytes:
        env_key = os.getenv("TOKEN_ENCRYPTION_KEY", "").strip()
        if env_key:
            return env_key.encode("utf-8")

        key_file = self.path.parent / ".token_key"
        if key_file.exists():
            return key_file.read_text(encoding="utf-8").strip().encode("utf-8")

        key = Fernet.generate_key()
        key_file.write_text(key.decode("utf-8"), encoding="utf-8")
        return key

    def _read(self) -> Dict[str, Any]:
        try:
            return json.loads(self.path.read_text(encoding="utf-8") or "{}")
        except Exception:
            return {}

    def _write(self, payload: Dict[str, Any]) -> None:
        self.path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    def _encrypt_payload(self, payload: Dict[str, Any]) -> str:
        raw = json.dumps(payload).encode("utf-8")
        token = self.fernet.encrypt(raw)
        return base64.urlsafe_b64encode(token).decode("utf-8")

    def _decrypt_payload(self, payload: str) -> Dict[str, Any]:
        try:
            token = base64.urlsafe_b64decode(payload.encode("utf-8"))
            decrypted = self.fernet.decrypt(token)
            return json.loads(decrypted.decode("utf-8"))
        except (InvalidToken, ValueError, json.JSONDecodeError):
            return {}

    def set_platform_tokens(self, user_id: str, platform: str, token_data: Dict[str, Any]) -> Dict[str, Any]:
        state = self._read()
        user = state.setdefault(user_id, {})
        encrypted = self._encrypt_payload(token_data)
        user[platform] = {
            "blob": encrypted,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        self._write(state)
        return token_data

    def get_platform_tokens(self, user_id: str, platform: str) -> Dict[str, Any]:
        data = self._read().get(user_id, {}).get(platform, {})
        blob = data.get("blob", "") if isinstance(data, dict) else ""
        if not blob:
            return {}
        return self._decrypt_payload(blob)

    def get_user_status(self, user_id: str) -> Dict[str, Any]:
        shopify = self.get_platform_tokens(user_id, "shopify")
        meta = self.get_platform_tokens(user_id, "meta")
        tiktok = self.get_platform_tokens(user_id, "tiktok")
        return {
            "shopify": bool(shopify.get("access_token")),
            "meta": bool(meta.get("access_token")),
            "tiktok": bool(tiktok.get("access_token")),
            "instagram": bool(meta.get("access_token")),
            "facebook": bool(meta.get("access_token")),
        }

    def list_user_ids(self) -> list[str]:
        return list(self._read().keys())


store = TokenStore()

import json
import os
import sqlite3
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict

from cryptography.fernet import Fernet, InvalidToken


class TokenStore:
    def __init__(self, db_path: str | None = None):
        base = Path(__file__).resolve().parents[2] / "data"
        base.mkdir(parents=True, exist_ok=True)
        self.db_path = Path(
            db_path or os.getenv("SECURE_STORE_DB_PATH", "").strip() or (base / "secure_store.db")
        )
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.legacy_json_path = base / "tokens.json"
        self._lock = threading.RLock()
        self.fernet = Fernet(self._load_or_create_key(base))
        self._init_schema()
        self._migrate_legacy_json()

    @staticmethod
    def _load_or_create_key(base: Path) -> bytes:
        env_key = os.getenv("STORE_ENCRYPTION_KEY", "").strip() or os.getenv("TOKEN_ENCRYPTION_KEY", "").strip()
        if env_key:
            return env_key.encode("utf-8")

        new_key_file = base / ".store_key"
        old_key_file = base / ".token_key"
        if new_key_file.exists():
            return new_key_file.read_text(encoding="utf-8").strip().encode("utf-8")
        if old_key_file.exists():
            return old_key_file.read_text(encoding="utf-8").strip().encode("utf-8")

        key = Fernet.generate_key()
        new_key_file.write_text(key.decode("utf-8"), encoding="utf-8")
        return key

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, timeout=30)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_schema(self) -> None:
        with self._lock, self._connect() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS oauth_tokens (
                    user_id TEXT NOT NULL,
                    platform TEXT NOT NULL,
                    payload_blob TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    PRIMARY KEY(user_id, platform)
                )
                """
            )
            conn.execute("CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user ON oauth_tokens(user_id)")
            conn.commit()

    def _encrypt_payload(self, payload: Dict[str, Any]) -> str:
        raw = json.dumps(payload).encode("utf-8")
        return self.fernet.encrypt(raw).decode("utf-8")

    def _decrypt_payload(self, payload_blob: str) -> Dict[str, Any]:
        try:
            raw = self.fernet.decrypt(payload_blob.encode("utf-8"))
            data = json.loads(raw.decode("utf-8"))
            return data if isinstance(data, dict) else {}
        except (InvalidToken, ValueError, json.JSONDecodeError):
            return {}

    def _migrate_legacy_json(self) -> None:
        if not self.legacy_json_path.exists():
            return
        with self._lock, self._connect() as conn:
            existing = int(conn.execute("SELECT COUNT(*) AS c FROM oauth_tokens").fetchone()["c"])
            if existing > 0:
                return
            try:
                legacy = json.loads(self.legacy_json_path.read_text(encoding="utf-8") or "{}")
            except Exception:
                legacy = {}
            if not isinstance(legacy, dict):
                return
            now = datetime.now(timezone.utc).isoformat()
            for user_id, per_platform in legacy.items():
                if not isinstance(per_platform, dict):
                    continue
                for platform, record in per_platform.items():
                    if not isinstance(record, dict):
                        continue
                    blob = str(record.get("blob", ""))
                    updated_at = str(record.get("updated_at", now))
                    payload = self._decrypt_payload(blob)
                    if not payload:
                        continue
                    conn.execute(
                        """
                        INSERT OR REPLACE INTO oauth_tokens(user_id, platform, payload_blob, updated_at)
                        VALUES (?, ?, ?, ?)
                        """,
                        (str(user_id), str(platform), self._encrypt_payload(payload), updated_at),
                    )
            conn.commit()

    def set_platform_tokens(self, user_id: str, platform: str, token_data: Dict[str, Any]) -> Dict[str, Any]:
        encrypted = self._encrypt_payload(token_data)
        updated_at = datetime.now(timezone.utc).isoformat()
        with self._lock, self._connect() as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO oauth_tokens(user_id, platform, payload_blob, updated_at)
                VALUES (?, ?, ?, ?)
                """,
                (user_id, platform, encrypted, updated_at),
            )
            conn.commit()
        return token_data

    def get_platform_tokens(self, user_id: str, platform: str) -> Dict[str, Any]:
        with self._lock, self._connect() as conn:
            row = conn.execute(
                "SELECT payload_blob FROM oauth_tokens WHERE user_id = ? AND platform = ?",
                (user_id, platform),
            ).fetchone()
        if not row:
            return {}
        return self._decrypt_payload(str(row["payload_blob"]))

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
        with self._lock, self._connect() as conn:
            rows = conn.execute("SELECT DISTINCT user_id FROM oauth_tokens ORDER BY user_id").fetchall()
        return [str(row["user_id"]) for row in rows]


store = TokenStore()

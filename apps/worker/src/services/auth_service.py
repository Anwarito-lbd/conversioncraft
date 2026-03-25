import hashlib
import hmac
import json
import os
import secrets
import sqlite3
import threading
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, Optional

from cryptography.fernet import Fernet, InvalidToken


class AuthService:
    def __init__(self, db_path: str | None = None):
        base = Path(__file__).resolve().parents[2] / "data"
        base.mkdir(parents=True, exist_ok=True)

        self.db_path = Path(
            db_path or os.getenv("SECURE_STORE_DB_PATH", "").strip() or (base / "secure_store.db")
        )
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.RLock()
        self.fernet = Fernet(self._load_or_create_key(base))
        self._init_schema()
        self._migrate_legacy_json(base)

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
                CREATE TABLE IF NOT EXISTS auth_users (
                    user_id TEXT PRIMARY KEY,
                    email TEXT NOT NULL UNIQUE,
                    name TEXT NOT NULL DEFAULT '',
                    password_hash TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    last_login_at TEXT
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS auth_sessions (
                    token_hash TEXT PRIMARY KEY,
                    payload_blob TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    expires_at TEXT NOT NULL
                )
                """
            )
            conn.execute("CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth_users(email)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires ON auth_sessions(expires_at)")
            conn.commit()

    def _migrate_legacy_json(self, base: Path) -> None:
        legacy_users_path = base / "auth_users.json"
        legacy_sessions_path = base / "auth_sessions.json"
        if not legacy_users_path.exists() and not legacy_sessions_path.exists():
            return

        with self._lock, self._connect() as conn:
            users_count = int(conn.execute("SELECT COUNT(*) AS c FROM auth_users").fetchone()["c"])
            sessions_count = int(conn.execute("SELECT COUNT(*) AS c FROM auth_sessions").fetchone()["c"])

            if users_count == 0 and legacy_users_path.exists():
                try:
                    raw = json.loads(legacy_users_path.read_text(encoding="utf-8") or "{}")
                    users = raw.get("users", {}) if isinstance(raw.get("users", {}), dict) else {}
                    for row in users.values():
                        if not isinstance(row, dict):
                            continue
                        user_id = str(row.get("user_id", ""))
                        email = str(row.get("email", "")).strip().lower()
                        if not user_id or not email:
                            continue
                        conn.execute(
                            """
                            INSERT OR IGNORE INTO auth_users(user_id, email, name, password_hash, created_at, last_login_at)
                            VALUES (?, ?, ?, ?, ?, ?)
                            """,
                            (
                                user_id,
                                email,
                                str(row.get("name", "")),
                                str(row.get("password_hash", "")),
                                str(row.get("created_at", datetime.now(timezone.utc).isoformat())),
                                row.get("last_login_at"),
                            ),
                        )
                except Exception:
                    pass

            if sessions_count == 0 and legacy_sessions_path.exists():
                try:
                    raw = json.loads(legacy_sessions_path.read_text(encoding="utf-8") or "{}")
                    sessions = raw.get("sessions", {}) if isinstance(raw.get("sessions", {}), dict) else {}
                    for token_hash, row in sessions.items():
                        if not isinstance(row, dict):
                            continue
                        payload = {
                            "user_id": str(row.get("user_id", "")),
                            "org_id": str(row.get("org_id", "")),
                            "role": str(row.get("role", "viewer")),
                            "created_at": str(row.get("created_at", datetime.now(timezone.utc).isoformat())),
                            "last_seen_at": str(row.get("last_seen_at", datetime.now(timezone.utc).isoformat())),
                            "expires_at": str(row.get("expires_at", datetime.now(timezone.utc).isoformat())),
                        }
                        if not payload["user_id"]:
                            continue
                        conn.execute(
                            """
                            INSERT OR IGNORE INTO auth_sessions(token_hash, payload_blob, created_at, expires_at)
                            VALUES (?, ?, ?, ?)
                            """,
                            (
                                str(token_hash),
                                self._encrypt_payload(payload),
                                payload["created_at"],
                                payload["expires_at"],
                            ),
                        )
                except Exception:
                    pass

            conn.commit()

    @staticmethod
    def _norm_email(email: str) -> str:
        return email.strip().lower()

    @staticmethod
    def _hash_token(token: str) -> str:
        return hashlib.sha256(token.encode("utf-8")).hexdigest()

    @staticmethod
    def _hash_password(password: str, iterations: int = 210000) -> str:
        salt = secrets.token_bytes(16)
        digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
        return f"pbkdf2_sha256${iterations}${salt.hex()}${digest.hex()}"

    @staticmethod
    def _verify_password(password: str, password_hash: str) -> bool:
        try:
            algo, iterations_raw, salt_hex, digest_hex = password_hash.split("$", 3)
            if algo != "pbkdf2_sha256":
                return False
            iterations = int(iterations_raw)
            salt = bytes.fromhex(salt_hex)
            expected = bytes.fromhex(digest_hex)
            computed = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
            return hmac.compare_digest(computed, expected)
        except Exception:
            return False

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

    def create_user(self, email: str, password: str, name: str = "") -> Dict[str, Any]:
        email_n = self._norm_email(email)
        if not email_n or "@" not in email_n:
            raise ValueError("Invalid email")
        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters")

        with self._lock, self._connect() as conn:
            exists = conn.execute("SELECT user_id FROM auth_users WHERE email = ?", (email_n,)).fetchone()
            if exists:
                raise ValueError("Email already registered")

            user_id = f"usr_{secrets.token_hex(8)}"
            created_at = datetime.now(timezone.utc).isoformat()
            conn.execute(
                """
                INSERT INTO auth_users(user_id, email, name, password_hash, created_at, last_login_at)
                VALUES (?, ?, ?, ?, ?, NULL)
                """,
                (user_id, email_n, name.strip(), self._hash_password(password), created_at),
            )
            conn.commit()
        return {"user_id": user_id, "email": email_n, "name": name.strip()}

    def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        with self._lock, self._connect() as conn:
            row = conn.execute(
                "SELECT user_id, email, name FROM auth_users WHERE user_id = ?",
                (user_id,),
            ).fetchone()
        if not row:
            return None
        return {"user_id": str(row["user_id"]), "email": str(row["email"]), "name": str(row["name"] or "")}

    def verify_credentials(self, email: str, password: str) -> Optional[Dict[str, Any]]:
        email_n = self._norm_email(email)
        with self._lock, self._connect() as conn:
            row = conn.execute(
                "SELECT user_id, email, name, password_hash FROM auth_users WHERE email = ?",
                (email_n,),
            ).fetchone()
            if not row:
                return None
            if not self._verify_password(password, str(row["password_hash"])):
                return None

            now_iso = datetime.now(timezone.utc).isoformat()
            conn.execute("UPDATE auth_users SET last_login_at = ? WHERE user_id = ?", (now_iso, str(row["user_id"])))
            conn.commit()
        return {"user_id": str(row["user_id"]), "email": str(row["email"]), "name": str(row["name"] or "")}

    def create_session(self, user_id: str, org_id: str, role: str, ttl_seconds: int = 604800) -> Dict[str, Any]:
        token = secrets.token_urlsafe(32)
        token_hash = self._hash_token(token)
        now = datetime.now(timezone.utc)
        expires = now + timedelta(seconds=ttl_seconds)
        payload = {
            "user_id": user_id,
            "org_id": org_id,
            "role": role,
            "created_at": now.isoformat(),
            "last_seen_at": now.isoformat(),
            "expires_at": expires.isoformat(),
        }

        with self._lock, self._connect() as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO auth_sessions(token_hash, payload_blob, created_at, expires_at)
                VALUES (?, ?, ?, ?)
                """,
                (token_hash, self._encrypt_payload(payload), payload["created_at"], payload["expires_at"]),
            )
            conn.commit()

        return {
            "token": token,
            "session": {
                "user_id": user_id,
                "org_id": org_id,
                "role": role,
                "expires_at": payload["expires_at"],
            },
        }

    def _delete_session_by_hash(self, token_hash: str) -> None:
        with self._lock, self._connect() as conn:
            conn.execute("DELETE FROM auth_sessions WHERE token_hash = ?", (token_hash,))
            conn.commit()

    def get_session(self, token: str, touch: bool = True) -> Optional[Dict[str, Any]]:
        if not token:
            return None
        token_hash = self._hash_token(token)
        with self._lock, self._connect() as conn:
            row = conn.execute(
                "SELECT payload_blob, expires_at FROM auth_sessions WHERE token_hash = ?",
                (token_hash,),
            ).fetchone()
            if not row:
                return None

            payload = self._decrypt_payload(str(row["payload_blob"] or ""))
            if not payload:
                conn.execute("DELETE FROM auth_sessions WHERE token_hash = ?", (token_hash,))
                conn.commit()
                return None

            expires_at = str(payload.get("expires_at", "") or row["expires_at"] or "")
            try:
                exp = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
            except Exception:
                exp = datetime.now(timezone.utc) - timedelta(seconds=1)

            if exp <= datetime.now(timezone.utc):
                conn.execute("DELETE FROM auth_sessions WHERE token_hash = ?", (token_hash,))
                conn.commit()
                return None

            if touch:
                payload["last_seen_at"] = datetime.now(timezone.utc).isoformat()
                conn.execute(
                    "UPDATE auth_sessions SET payload_blob = ? WHERE token_hash = ?",
                    (self._encrypt_payload(payload), token_hash),
                )
                conn.commit()

        return {
            "user_id": str(payload.get("user_id", "")),
            "org_id": str(payload.get("org_id", "")),
            "role": str(payload.get("role", "viewer")),
            "expires_at": str(payload.get("expires_at", "")),
        }

    def revoke_session(self, token: str) -> bool:
        if not token:
            return False
        token_hash = self._hash_token(token)
        with self._lock, self._connect() as conn:
            row = conn.execute("SELECT token_hash FROM auth_sessions WHERE token_hash = ?", (token_hash,)).fetchone()
            if not row:
                return False
            conn.execute("DELETE FROM auth_sessions WHERE token_hash = ?", (token_hash,))
            conn.commit()
            return True


auth_service = AuthService()

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List


ROLE_RANK = {
    "viewer": 10,
    "analyst": 20,
    "marketer": 30,
    "admin": 40,
    "owner": 50,
}


class OrgRbacStore:
    def __init__(self, path: str | None = None):
        self.path = Path(path) if path else Path(__file__).resolve().parents[2] / "data" / "orgs.json"
        self.path.parent.mkdir(parents=True, exist_ok=True)
        if not self.path.exists():
            self.path.write_text("{}", encoding="utf-8")

    def _read(self) -> Dict[str, Any]:
        try:
            return json.loads(self.path.read_text(encoding="utf-8") or "{}")
        except Exception:
            return {}

    def _write(self, data: Dict[str, Any]) -> None:
        self.path.write_text(json.dumps(data, indent=2), encoding="utf-8")

    def create_org(self, org_id: str, name: str, owner_user_id: str) -> Dict[str, Any]:
        state = self._read()
        if org_id in state:
            return state[org_id]

        org = {
            "org_id": org_id,
            "name": name,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "members": [
                {
                    "user_id": owner_user_id,
                    "role": "owner",
                    "joined_at": datetime.now(timezone.utc).isoformat(),
                }
            ],
        }
        state[org_id] = org
        self._write(state)
        return org

    def get_org(self, org_id: str) -> Dict[str, Any]:
        return self._read().get(org_id, {})

    def list_members(self, org_id: str) -> List[Dict[str, Any]]:
        return self.get_org(org_id).get("members", [])

    def list_orgs_for_user(self, user_id: str) -> List[Dict[str, Any]]:
        out: List[Dict[str, Any]] = []
        for org in self._read().values():
            if not isinstance(org, dict):
                continue
            for member in org.get("members", []):
                if str(member.get("user_id", "")) == user_id:
                    out.append(
                        {
                            "org_id": str(org.get("org_id", "")),
                            "name": str(org.get("name", "")),
                            "role": str(member.get("role", "viewer")),
                        }
                    )
                    break
        return out

    def upsert_member(self, org_id: str, actor_user_id: str, user_id: str, role: str) -> Dict[str, Any]:
        if role not in ROLE_RANK:
            raise ValueError("Invalid role")
        self.require_role(org_id, actor_user_id, "admin")

        state = self._read()
        org = state.get(org_id)
        if not org:
            raise ValueError("Organization not found")

        members = org.get("members", [])
        existing = next((m for m in members if m.get("user_id") == user_id), None)
        if existing:
            existing["role"] = role
            existing["updated_at"] = datetime.now(timezone.utc).isoformat()
        else:
            members.append(
                {
                    "user_id": user_id,
                    "role": role,
                    "joined_at": datetime.now(timezone.utc).isoformat(),
                }
            )
        org["members"] = members
        state[org_id] = org
        self._write(state)
        return org

    def role_for(self, org_id: str, user_id: str) -> str:
        members = self.list_members(org_id)
        for member in members:
            if member.get("user_id") == user_id:
                return str(member.get("role", "viewer"))
        return ""

    def require_role(self, org_id: str, user_id: str, minimum_role: str) -> None:
        current = self.role_for(org_id, user_id)
        if not current:
            raise PermissionError("User is not a member of organization")
        if ROLE_RANK.get(current, 0) < ROLE_RANK.get(minimum_role, 0):
            raise PermissionError(f"Requires role {minimum_role} or higher")


org_rbac_store = OrgRbacStore()

import json
import os
import secrets
import hashlib
import contextvars
import re
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional, Tuple

from fastapi import FastAPI, Header, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.routing import APIRoute
from pydantic import BaseModel, Field, ValidationError, model_validator

from src.agents.copywriter import copywriter_agent
from src.agents.director import director_agent
from src.agents.model_generator import model_generator
from src.agents.producer import producer_agent
from src.services.attribution_service import attribution_service
from src.services.audit_logger import audit_logger
from src.services.analytics_preferences_store import analytics_preferences_store
from src.services.alert_event_store import alert_event_store
from src.services.alert_routing_store import alert_routing_store
from src.services.campaign_service import campaign_service
from src.services.campaign_store import campaign_store
from src.services.dead_letter_queue import dead_letter_queue
from src.services.escalation_policy_store import escalation_policy_store
from src.services.experiment_store import experiment_store
from src.services.experimentation_engine import experimentation_engine
from src.services.idempotency_store import idempotency_store
from src.services.marketing_playbook import marketing_playbook_service
from src.services.offer_engine import offer_engine_service
from src.services.oauth_service import oauth_service
from src.services.oauth_state_store import state_store
from src.services.optimizer_executor import optimizer_executor
from src.services.optimizer_scheduler import optimizer_scheduler
from src.services.org_rbac_store import org_rbac_store
from src.services.ops_control_store import ops_control_store
from src.services.publisher import publisher_service
from src.services.rate_limiter import rate_limiter
from src.services.sla_breach_store import sla_breach_store
from src.services.sku_catalog_store import sku_catalog_store
from src.services.studio_state_store import studio_state_store
from src.services.token_rotation import token_rotation_service
from src.services.token_store import store
from src.services.webhook_service import webhook_service
from src.services.onboarding_state_store import onboarding_state_store
from src.sourcing.finder import find_winning_products
from src.services.stripe_service import stripe_service
from src.services.deepseek_service import deepseek_service
from src.services.cj_service import cj_service
from src.services.creatify_service import creatify_service
from src.services.flair_service import flair_service
from src.services.autods_service import autods_service
from src.services.triposr_service import triposr_service
from src.services.influencer_service import influencer_service
from src.services.page_builder_service import page_builder_service
from src.services.higgsfield_service import higgsfield_service
from src.services.mailchimp_service import mailchimp_service
from src.services.manus_service import manus_service
from src.services.upcart_service import upcart_service
from src.services.chatbot_service import chatbot_service
from src.services.auth_service import auth_service


@asynccontextmanager
async def lifespan(_: FastAPI):
    optimizer_scheduler.start()
    try:
        yield
    finally:
        optimizer_scheduler.shutdown()


app = FastAPI(title="ConversionCraft Worker API", version="0.5.0", lifespan=lifespan)

_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
origins = [o.strip() for o in _origins_env.split(",") if o.strip()]
AUTH_SESSION_TTL_SECONDS = int(os.getenv("AUTH_SESSION_TTL_SECONDS", "604800") or "604800")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_request_session: contextvars.ContextVar[Optional[Dict[str, Any]]] = contextvars.ContextVar(
    "request_session",
    default=None,
)

PUBLIC_API_EXACT_PATHS = {
    "/api/auth/register",
    "/api/auth/login",
    "/api/payments/webhook",
}
PUBLIC_API_PREFIXES = ("/api/webhooks/",)


def _is_public_api_path(path: str) -> bool:
    if path in PUBLIC_API_EXACT_PATHS:
        return True
    return any(path.startswith(prefix) for prefix in PUBLIC_API_PREFIXES)


def _requires_session_for_path(path: str) -> bool:
    if not path.startswith("/api"):
        return False
    return not _is_public_api_path(path)


def _extract_bearer_token(authorization: Optional[str]) -> str:
    if not authorization:
        return ""
    raw = authorization.strip()
    if not raw.lower().startswith("bearer "):
        return ""
    return raw.split(" ", 1)[1].strip()


@app.middleware("http")
async def inject_session_context(request: Request, call_next):
    token = _extract_bearer_token(request.headers.get("authorization"))
    session = auth_service.get_session(token) if token else None
    request.state.session = session
    ctx = _request_session.set(session)
    try:
        if _requires_session_for_path(request.url.path) and not session:
            return JSONResponse(status_code=401, content={"detail": "Authentication required"})
        return await call_next(request)
    finally:
        _request_session.reset(ctx)


class AnalyzeRequest(BaseModel):
    niche: str


class GenerateCopyRequest(BaseModel):
    product_name: str
    description: str


class Generate3DRequest(BaseModel):
    image_url: str


class GenerateStoryboardRequest(BaseModel):
    product_name: str
    benefits: List[str]


class RenderSceneRequest(BaseModel):
    visual_prompt: str


class PublishRequest(BaseModel):
    product_data: Dict[str, Any]
    user_tokens: Dict[str, Any]


class OAuthConnectRequest(BaseModel):
    user_id: str
    redirect_uri: str
    scopes: Optional[str] = None
    shop: Optional[str] = None
    org_id: Optional[str] = None


class OAuthCallbackRequest(BaseModel):
    user_id: str
    code: str
    state: str
    nonce: Optional[str] = None
    org_id: Optional[str] = None


class AuthRegisterRequest(BaseModel):
    email: str
    password: str
    name: str = ""
    org_name: str = ""
    org_id: Optional[str] = None


class AuthLoginRequest(BaseModel):
    email: str
    password: str
    org_id: Optional[str] = None


class AuthSwitchOrgRequest(BaseModel):
    org_id: str


class CampaignCreateRequest(BaseModel):
    user_id: str
    campaign_name: str
    objective: str
    daily_budget: float
    product: Dict[str, Any] = {}
    targeting: Dict[str, Any] = {}
    org_id: Optional[str] = None


class CampaignMetricsRequest(BaseModel):
    user_id: str
    campaign_metrics: List[Dict[str, Any]]


class OptimizerRequest(BaseModel):
    user_id: str
    campaign_metrics: List[Dict[str, Any]]


class OrgCreateRequest(BaseModel):
    org_id: str
    name: str
    owner_user_id: str


class OrgMemberUpsertRequest(BaseModel):
    actor_user_id: str
    user_id: str
    role: str


class AttributionEventRequest(BaseModel):
    user_id: str
    event: Dict[str, Any]


class OfferRecommendationRequest(BaseModel):
    user_id: str
    product: Dict[str, Any]
    cart: Dict[str, Any] = {}
    org_id: Optional[str] = None


class SkuCatalogUpsertRequest(BaseModel):
    user_id: str
    org_id: Optional[str] = None
    skus: List[Dict[str, Any]]


class OfferRecommendationV2Request(BaseModel):
    user_id: str
    product: Dict[str, Any]
    constraints: Dict[str, Any] = {}
    experiment: Dict[str, Any] = {}
    org_id: Optional[str] = None


class OptimizerExecuteRequest(BaseModel):
    user_id: str
    org_id: Optional[str] = None
    actions: List[Dict[str, Any]]


class MicroInfluencerPlanRequest(BaseModel):
    user_id: str
    niche: str
    product_name: str
    product_price: float
    product_cost: float
    budget: float
    org_id: Optional[str] = None


class TrustChecklistRequest(BaseModel):
    user_id: str
    paypal_enabled: bool = False
    shipping_policy: bool = False
    terms_policy: bool = False
    sample_quality_checked: bool = False
    related_upsell_enabled: bool = False
    org_id: Optional[str] = None


class ExperimentCreateRequest(BaseModel):
    user_id: str
    name: str
    variants: List[Dict[str, Any]]
    rules: Dict[str, Any] = {}
    org_id: Optional[str] = None


class ExperimentMetricsUpsertRequest(BaseModel):
    user_id: str
    metrics: List[Dict[str, Any]]
    org_id: Optional[str] = None


class ExperimentEventRequest(BaseModel):
    user_id: str
    experiment_id: str
    session_id: str
    variant_id: Optional[str] = None
    event_type: str  # impression | conversion | revenue | spend
    revenue: float = 0.0
    spend: float = 0.0
    org_id: Optional[str] = None


class OnboardingStateModel(BaseModel):
    model_config = {"extra": "forbid"}
    currentStep: Literal["company", "connections", "brand", "governance", "launch"] = "company"
    companyName: str = ""
    industry: str = ""
    monthlyRevenueBand: str = ""
    teamSize: str = ""
    primaryGoal: str = ""
    brandTone: str = ""
    heroPromise: str = ""
    guardrailRoas: float = 1.6
    guardrailMaxBudgetIncrease: float = 20.0
    complianceAccepted: bool = False
    billingEmail: str = ""
    launchMarkets: str = ""
    launchBudget: float = 0.0
    completedAt: Optional[str] = None


class StudioCardModel(BaseModel):
    model_config = {"extra": "forbid"}
    id: str
    title: str
    hook: str
    cta: str
    stage: Literal["concepts", "variants", "scheduled", "posted"]
    platform: Literal["TikTok", "Instagram", "Facebook"]
    scheduledAt: Optional[str] = None


class StudioStateModel(BaseModel):
    model_config = {"extra": "forbid"}
    brief: str = ""
    productName: str = ""
    cards: List[StudioCardModel] = Field(default_factory=list)


class OnboardingStateUpsertRequest(BaseModel):
    user_id: str
    org_id: Optional[str] = None
    expected_version: Optional[int] = None
    state: OnboardingStateModel


class StudioStateUpsertRequest(BaseModel):
    user_id: str
    org_id: Optional[str] = None
    expected_version: Optional[int] = None
    state: StudioStateModel


class CopilotExecuteRequest(BaseModel):
    user_id: str
    org_id: Optional[str] = None
    actions: List[Dict[str, Any]]
    guardrails: Dict[str, Any] = {}


class AnalyticsPreferenceModel(BaseModel):
    model_config = {"extra": "forbid"}
    role_filter: Literal["all", "viewer", "analyst", "marketer", "admin", "owner"] = "all"
    user_filter: str = "all"
    sla_sync_stale_minutes: int = Field(default=30, ge=5, le=240)
    sla_dlq_threshold_15m: int = Field(default=0, ge=0, le=100)
    forecast_horizon_days: int = Field(default=7, ge=1, le=30)


class AnalyticsPreferencesUpsertRequest(BaseModel):
    actor_user_id: str
    settings: AnalyticsPreferenceModel


class AlertRouteModel(BaseModel):
    model_config = {"extra": "forbid"}
    route_id: str
    channel: Literal["email", "slack", "webhook", "inapp"]
    target: str
    severities: List[Literal["warning", "critical"]] = Field(default_factory=lambda: ["critical"])
    event_types: List[str] = Field(default_factory=lambda: ["sla", "anomaly"])
    enabled: bool = True
    cooldown_minutes: int = Field(default=30, ge=0, le=1440)
    retry_attempts: int = Field(default=2, ge=0, le=5)
    retry_backoff_seconds: int = Field(default=15, ge=0, le=600)
    failover_route_id: Optional[str] = None


class AlertRoutingUpsertRequest(BaseModel):
    actor_user_id: str
    routes: List[AlertRouteModel]


class AlertAckRequest(BaseModel):
    actor_user_id: str


class EscalationPolicyModel(BaseModel):
    model_config = {"extra": "forbid"}
    enabled: bool = True
    repeated_critical_threshold: int = Field(default=3, ge=1, le=50)
    window_minutes: int = Field(default=60, ge=5, le=1440)
    page_owner_channel: Literal["email", "slack", "webhook", "inapp"] = "inapp"
    page_owner_target: str = ""
    include_sla: bool = True
    include_anomaly: bool = True
    suppression_windows: List["SuppressionWindowModel"] = Field(default_factory=list)
    on_call_schedule: List["OnCallShiftModel"] = Field(default_factory=list)


class EscalationPolicyUpsertRequest(BaseModel):
    actor_user_id: str
    policy: Dict[str, Any] = Field(default_factory=dict)
    suppression_windows_json: Optional[str] = None
    on_call_schedule_json: Optional[str] = None


WeekdayLiteral = Literal["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]


class SuppressionWindowModel(BaseModel):
    model_config = {"extra": "forbid"}
    days: List[WeekdayLiteral] = Field(default_factory=list)
    start_hour: int = Field(ge=0, le=23)
    end_hour: int = Field(ge=1, le=24)
    tz_offset: str = Field(default="+00:00", pattern=r"^[+-](?:0\d|1[0-4]):[0-5]\d$")
    scopes: List[Literal["sla", "anomaly"]] = Field(default_factory=lambda: ["sla", "anomaly"])
    severities: List[Literal["warning", "critical"]] = Field(default_factory=lambda: ["critical"])
    enabled: bool = True

    @model_validator(mode="after")
    def validate_hour_window(self):
        if self.start_hour == self.end_hour:
            raise ValueError("start_hour and end_hour cannot be equal")
        return self


class OnCallShiftModel(BaseModel):
    model_config = {"extra": "forbid"}
    days: List[WeekdayLiteral] = Field(default_factory=list)
    start_hour: int = Field(ge=0, le=23)
    end_hour: int = Field(ge=1, le=24)
    tz_offset: str = Field(default="+00:00", pattern=r"^[+-](?:0\d|1[0-4]):[0-5]\d$")
    channel: Literal["email", "slack", "webhook", "inapp"] = "inapp"
    target: str = ""
    owner_user_id: str = ""
    enabled: bool = True

    @model_validator(mode="after")
    def validate_target_or_owner_and_window(self):
        if self.start_hour == self.end_hour:
            raise ValueError("start_hour and end_hour cannot be equal")
        if not self.target.strip() and not self.owner_user_id.strip():
            raise ValueError("Either target or owner_user_id is required.")
        return self


class OpsControlsModel(BaseModel):
    model_config = {"extra": "forbid"}
    optimizer_execute_enabled: bool = True
    copilot_execute_enabled: bool = True
    autopilot_launch_enabled: bool = True
    max_optimizer_actions_per_run: int = Field(default=50, ge=1, le=500)
    max_copilot_actions_per_run: int = Field(default=50, ge=1, le=500)


class OpsControlsUpsertRequest(BaseModel):
    actor_user_id: str
    org_id: Optional[str] = None
    controls: OpsControlsModel


EscalationPolicyModel.model_rebuild()


def _ingest_experiment_event(
    *,
    user_id: str,
    experiment_id: str,
    session_id: str,
    event_type: str,
    variant_id: Optional[str] = None,
    revenue: float = 0.0,
    spend: float = 0.0,
) -> Dict[str, Any]:
    experiment = experiment_store.get_experiment(user_id, experiment_id)
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")

    variants = experiment.get("variants", [])
    if not variants:
        raise HTTPException(status_code=400, detail="No variants configured")

    chosen_variant_id = str(variant_id or "")
    if not chosen_variant_id:
        assigned = experimentation_engine.assign_variant(experiment, session_id)
        chosen_variant_id = str(assigned.get("variant_id", ""))

    variant_exists = any(str(v.get("variant_id", "")) == chosen_variant_id for v in variants)
    if not variant_exists:
        raise HTTPException(status_code=400, detail="Invalid variant_id")

    event = event_type.strip().lower()
    increments = {"impressions": 0, "conversions": 0, "revenue": 0.0, "spend": 0.0}
    if event == "impression":
        increments["impressions"] = 1
    elif event == "conversion":
        increments["conversions"] = 1
        increments["revenue"] = float(revenue or 0.0)
    elif event == "revenue":
        increments["revenue"] = float(revenue or 0.0)
    elif event == "spend":
        increments["spend"] = float(spend or 0.0)
    else:
        raise HTTPException(status_code=400, detail="Unsupported event_type")

    updated = experiment_store.increment_variant_metrics(
        user_id,
        experiment_id,
        chosen_variant_id,
        impressions=increments["impressions"],
        conversions=increments["conversions"],
        revenue=increments["revenue"],
        spend=increments["spend"],
    )

    evaluation = None
    total_impressions = 0
    for variant in updated.get("variants", []):
        metrics = variant.get("metrics", {}) if isinstance(variant, dict) else {}
        total_impressions += int(metrics.get("impressions", 0) or 0)

    should_evaluate = (
        event in {"conversion", "revenue"}
        or (event == "impression" and total_impressions > 0 and total_impressions % 25 == 0)
    )
    if should_evaluate and str(updated.get("status", "running")) == "running":
        try:
            evaluation = experimentation_engine.evaluate_experiment(user_id, experiment_id)
        except Exception:
            evaluation = None

    return {
        "status": "ok",
        "experiment_id": experiment_id,
        "session_id": session_id,
        "variant_id": chosen_variant_id,
        "event_type": event,
        "increments": increments,
        "evaluation": evaluation,
    }


def _current_session(required: bool = False) -> Optional[Dict[str, Any]]:
    session = _request_session.get()
    if required and not session:
        raise HTTPException(status_code=401, detail="Authentication required")
    return session


def _slugify_org_id(name: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "-", name.strip().lower())
    normalized = normalized.strip("-")
    return normalized or f"org-{secrets.token_hex(3)}"


def _assert_session_identity(user_id: str, org_id: Optional[str] = None, minimum_role: str = "viewer") -> Dict[str, Any]:
    session = _current_session(required=True) or {}
    session_user_id = str(session.get("user_id", ""))
    session_org_id = str(session.get("org_id", ""))
    if session_user_id != user_id:
        raise HTTPException(status_code=403, detail="Session user mismatch")
    target_org_id = org_id or session_org_id
    if target_org_id:
        _require_org_role(target_org_id, user_id, minimum_role)
    return session


def _enforce_rate_limit(scope: str, user_id: str, limit: int, window_seconds: int) -> None:
    ok, retry_after = rate_limiter.allow(f"{scope}:{user_id}", limit, window_seconds)
    if not ok:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Retry in {retry_after}s",
        )


def _require_org_role(org_id: Optional[str], user_id: str, minimum_role: str) -> None:
    session = _current_session(required=True)
    session_user_id = str(session.get("user_id", ""))
    session_org_id = str(session.get("org_id", ""))
    if session_user_id != user_id:
        raise HTTPException(status_code=403, detail="Session user mismatch")
    effective_org_id = org_id or session_org_id
    if org_id and session_org_id and org_id != session_org_id:
        raise HTTPException(status_code=403, detail="Session org mismatch")
    if not effective_org_id:
        return
    try:
        org_rbac_store.require_role(effective_org_id, user_id, minimum_role)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc


def _ensure_org_access(org_id: Optional[str], user_id: str, minimum_role: str) -> None:
    session = _current_session(required=True)
    session_org_id = str(session.get("org_id", ""))
    effective_org_id = org_id or session_org_id
    if not effective_org_id:
        raise HTTPException(status_code=400, detail="org_id is required for this operation")
    if not org_rbac_store.get_org(effective_org_id):
        org_rbac_store.create_org(effective_org_id, f"Org {effective_org_id}", user_id)
    _require_org_role(effective_org_id, user_id, minimum_role)


def _idempotency_key(
    kind: str, user_id: str, external_key: Optional[str], payload: Dict[str, Any]
) -> Tuple[str, str]:
    request_hash = idempotency_store.hash_payload(payload)
    if external_key:
        return f"{kind}:{user_id}:{external_key.strip()}", request_hash
    return f"{kind}:{user_id}:{request_hash[:32]}", request_hash


def _parse_iso(ts: str) -> Optional[datetime]:
    if not ts:
        return None
    try:
        return datetime.fromisoformat(ts.replace("Z", "+00:00"))
    except Exception:
        return None


def _safe_float(value: Any) -> float:
    try:
        return float(value or 0)
    except Exception:
        return 0.0


def _mean_std(values: List[float]) -> Tuple[float, float]:
    if not values:
        return 0.0, 0.0
    mean = sum(values) / len(values)
    variance = sum((v - mean) ** 2 for v in values) / len(values)
    return mean, variance ** 0.5


def _org_owner_targets(org_id: str) -> List[str]:
    owners = []
    for member in org_rbac_store.list_members(org_id):
        if str(member.get("role", "")) == "owner":
            uid = str(member.get("user_id", ""))
            if uid:
                owners.append(uid)
    return owners


def _simulate_dispatch_attempt(route: Dict[str, Any], item: Dict[str, Any], attempt: int) -> Tuple[bool, str]:
    # Deterministic simulator for reliability behavior until real providers are connected.
    target = str(route.get("target", "")).strip().lower()
    channel = str(route.get("channel", "inapp")).strip().lower()
    if not target:
        return False, "missing_target"
    if "fail" in target:
        return False, "simulated_target_failure"
    if channel == "webhook" and not target.startswith("http"):
        return False, "invalid_webhook_target"
    if attempt == 1 and str(item.get("severity", "")) == "critical" and channel in {"email", "webhook"}:
        return False, "transient_provider_error"
    return True, ""


WEEKDAY_TO_INDEX = {
    "monday": 0,
    "tuesday": 1,
    "wednesday": 2,
    "thursday": 3,
    "friday": 4,
    "saturday": 5,
    "sunday": 6,
}


def _parse_utc_offset(offset: str) -> timezone:
    try:
        sign = 1 if offset.startswith("+") else -1
        hh, mm = offset[1:].split(":")
        delta = timedelta(hours=int(hh), minutes=int(mm))
        return timezone(sign * delta)
    except Exception:
        return timezone.utc


def _json_error_detail(field: str, raw: str, exc: json.JSONDecodeError) -> Dict[str, Any]:
    lines = raw.splitlines()
    line_text = lines[exc.lineno - 1] if 1 <= exc.lineno <= len(lines) else ""
    pointer = (" " * max(exc.colno - 1, 0)) + "^" if line_text else ""
    return {
        "error": "json_parse_error",
        "field": field,
        "message": exc.msg,
        "line": exc.lineno,
        "column": exc.colno,
        "line_text": line_text,
        "pointer": pointer,
        "hint": f"Fix JSON syntax in {field} at line {exc.lineno}, column {exc.colno}.",
    }


def _validation_error_detail(field: str, exc: ValidationError, index: Optional[int] = None) -> Dict[str, Any]:
    first = exc.errors()[0] if exc.errors() else {}
    loc = [str(item) for item in first.get("loc", ())]
    message = str(first.get("msg", "Invalid value"))
    path = ".".join(loc)
    index_prefix = f"[{index}]" if index is not None else ""
    path_suffix = f".{path}" if path else ""
    return {
        "error": "schema_validation_error",
        "field": field,
        "index": index,
        "path": path,
        "message": message,
        "hint": f"Fix `{field}{index_prefix}{path_suffix}`: {message}",
    }


def _parse_json_list_field(field: str, raw: str) -> List[Dict[str, Any]]:
    try:
        value = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=422, detail=_json_error_detail(field, raw, exc)) from exc
    if not isinstance(value, list):
        raise HTTPException(
            status_code=422,
            detail={
                "error": "schema_validation_error",
                "field": field,
                "message": "Expected a JSON array.",
                "hint": f"Wrap {field} in [ ... ] format.",
            },
        )
    return value


def _validate_model_list(field: str, items: List[Dict[str, Any]], model_type: Any) -> List[Dict[str, Any]]:
    validated: List[Dict[str, Any]] = []
    for index, item in enumerate(items):
        try:
            validated.append(model_type.model_validate(item).model_dump())
        except ValidationError as exc:
            raise HTTPException(status_code=422, detail=_validation_error_detail(field, exc, index=index)) from exc
    return validated


def _window_matches_now(
    *,
    now_utc: datetime,
    days: List[int],
    start_hour: int,
    end_hour: int,
    tz_offset: str,
) -> bool:
    tz = _parse_utc_offset(tz_offset)
    local = now_utc.astimezone(tz)
    if days and local.weekday() not in days:
        return False
    hour = local.hour
    if start_hour <= end_hour:
        return start_hour <= hour < end_hour
    return hour >= start_hour or hour < end_hour


def _is_escalation_suppressed(policy: Dict[str, Any], item_scope: str, item_severity: str, now_utc: datetime) -> bool:
    windows = policy.get("suppression_windows", [])
    if not isinstance(windows, list):
        return False
    for raw in windows:
        if not isinstance(raw, dict):
            continue
        scopes = [str(s) for s in raw.get("scopes", ["sla", "anomaly"])]
        severities = [str(s) for s in raw.get("severities", ["critical"])]
        if item_scope not in scopes or item_severity not in severities:
            continue
        days_raw = raw.get("days", [])
        days = []
        for d in days_raw if isinstance(days_raw, list) else []:
            if isinstance(d, int) and 0 <= d <= 6:
                days.append(d)
            elif isinstance(d, str):
                idx = WEEKDAY_TO_INDEX.get(d.strip().lower())
                if idx is not None:
                    days.append(idx)
        if _window_matches_now(
            now_utc=now_utc,
            days=days,
            start_hour=int(raw.get("start_hour", 0) or 0),
            end_hour=int(raw.get("end_hour", 24) or 24),
            tz_offset=str(raw.get("tz_offset", "+00:00")),
        ):
            return True
    return False


def _resolve_on_call_target(org_id: str, policy: Dict[str, Any], now_utc: datetime) -> Tuple[str, str]:
    schedule = policy.get("on_call_schedule", [])
    if isinstance(schedule, list):
        for raw in schedule:
            if not isinstance(raw, dict):
                continue
            days_raw = raw.get("days", [])
            days = []
            for d in days_raw if isinstance(days_raw, list) else []:
                if isinstance(d, int) and 0 <= d <= 6:
                    days.append(d)
                elif isinstance(d, str):
                    idx = WEEKDAY_TO_INDEX.get(d.strip().lower())
                    if idx is not None:
                        days.append(idx)
            if not _window_matches_now(
                now_utc=now_utc,
                days=days,
                start_hour=int(raw.get("start_hour", 0) or 0),
                end_hour=int(raw.get("end_hour", 24) or 24),
                tz_offset=str(raw.get("tz_offset", "+00:00")),
            ):
                continue
            channel = str(raw.get("channel", policy.get("page_owner_channel", "inapp")))
            target = str(raw.get("target", "")).strip()
            if target:
                return channel, target
            owner_user_id = str(raw.get("owner_user_id", "")).strip()
            if owner_user_id:
                return channel, owner_user_id
    owners = _org_owner_targets(org_id)
    fallback_target = str(policy.get("page_owner_target", "")).strip()
    if fallback_target:
        return str(policy.get("page_owner_channel", "inapp")), fallback_target
    if owners:
        return str(policy.get("page_owner_channel", "inapp")), ",".join(owners)
    return str(policy.get("page_owner_channel", "inapp")), "org_owner"


def _collect_org_summary(org_id: str) -> Dict[str, Any]:
    members = org_rbac_store.list_members(org_id)
    user_ids = [str(m.get("user_id", "")) for m in members if m.get("user_id")]
    spend = 0.0
    revenue = 0.0
    campaign_count = 0
    experiments_running = 0
    for uid in user_ids:
        campaign = campaign_store.dashboard_snapshot(uid)
        attr = attribution_service.summary(uid)
        spend += _safe_float(campaign.get("total_spend", 0))
        revenue += _safe_float(attr.get("revenue", 0))
        campaign_count += int(campaign.get("campaign_count", 0) or 0)
        experiments_running += sum(
            1 for exp in experiment_store.list_experiments(uid) if str(exp.get("status", "")) == "running"
        )
    roas = round((revenue / spend), 3) if spend > 0 else None
    return {
        "org_id": org_id,
        "org_name": str(org_rbac_store.get_org(org_id).get("name", org_id)),
        "members": len(user_ids),
        "campaigns": campaign_count,
        "running_experiments": experiments_running,
        "spend": round(spend, 2),
        "revenue": round(revenue, 2),
        "roas": roas,
    }


def _compute_org_anomalies(org_id: str, actor_user_id: str) -> Dict[str, Any]:
    _ensure_org_access(org_id, actor_user_id, "viewer")
    members = org_rbac_store.list_members(org_id)
    rows: List[Dict[str, Any]] = []
    for member in members:
        uid = str(member.get("user_id", ""))
        if not uid:
            continue
        campaign = campaign_store.dashboard_snapshot(uid)
        attr = attribution_service.summary(uid)
        rows.append(
            {
                "user_id": uid,
                "role": str(member.get("role", "viewer")),
                "spend": _safe_float(campaign.get("total_spend", 0)),
                "avg_ctr": _safe_float(campaign.get("avg_ctr", 0)),
                "avg_roas": _safe_float(campaign.get("avg_roas", 0)),
                "cac": _safe_float(attr.get("cac", 0)),
                "ltv": _safe_float(attr.get("ltv", 0)),
                "revenue": _safe_float(attr.get("revenue", 0)),
            }
        )

    keys = ["spend", "avg_ctr", "avg_roas", "cac", "ltv", "revenue"]
    stats: Dict[str, Tuple[float, float]] = {}
    for key in keys:
        stats[key] = _mean_std([_safe_float(r.get(key, 0)) for r in rows])

    anomalies: List[Dict[str, Any]] = []
    for row in rows:
        for key in keys:
            mean, std = stats[key]
            value = _safe_float(row.get(key, 0))
            if std <= 0:
                continue
            z = (value - mean) / std
            if abs(z) >= 2.0:
                severity = "critical" if abs(z) >= 3 else "warning"
                direction = "high" if z > 0 else "low"
                anomalies.append(
                    {
                        "type": "kpi_outlier",
                        "kpi": key,
                        "severity": severity,
                        "direction": direction,
                        "user_id": row.get("user_id"),
                        "value": round(value, 4),
                        "mean": round(mean, 4),
                        "std": round(std, 4),
                        "z_score": round(z, 3),
                    }
                )
        if row["spend"] > 50 and row["avg_roas"] < 1.0:
            anomalies.append(
                {
                    "type": "efficiency_drop",
                    "kpi": "avg_roas",
                    "severity": "critical",
                    "direction": "low",
                    "user_id": row.get("user_id"),
                    "value": row["avg_roas"],
                    "threshold": 1.0,
                }
            )
    return {
        "org_id": org_id,
        "observations": rows,
        "anomalies": anomalies[:50],
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/health")
def health_check():
    return {"status": "ok"}


def _route_module(path: str) -> str:
    if path.startswith("/api/auth"):
        return "Auth + Session"
    if path.startswith("/api/onboarding") or path.startswith("/api/studio") or path.startswith("/api/state"):
        return "State + Onboarding"
    if path.startswith("/api/analytics") or path.startswith("/api/alerts") or path.startswith("/api/sla") or path.startswith("/api/ops"):
        return "Analytics + Alerts"
    if path.startswith("/api/oauth") or path.startswith("/api/tokens") or path.startswith("/api/campaigns") or path.startswith("/api/audit") or path.startswith("/api/dlq"):
        return "OAuth + Campaign Ops"
    if path.startswith("/api/offers") or path.startswith("/api/attribution") or path.startswith("/api/sourcing"):
        return "Growth Intelligence"
    if path.startswith("/api/experiments"):
        return "Experimentation"
    if path.startswith("/api/webhooks"):
        return "Webhooks"
    if path.startswith("/api/payments") or path.startswith("/api/"):
        return "Integrations + AI Services"
    return "Core"


@app.get("/api/status/routes")
def route_status_map():
    _current_session(required=True)
    rows: List[Dict[str, Any]] = []
    for route in app.routes:
        if not isinstance(route, APIRoute):
            continue
        methods = sorted(m for m in route.methods if m not in {"HEAD", "OPTIONS"})
        if not methods:
            continue
        path = route.path
        rows.append(
            {
                "path": path,
                "methods": methods,
                "module": _route_module(path),
                "auth_required": _requires_session_for_path(path),
                "public_api": _is_public_api_path(path),
                "name": route.name,
            }
        )
    rows.sort(key=lambda item: item["path"])
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "total_routes": len(rows),
        "routes": rows,
    }


@app.post("/api/auth/register")
def register_auth_user(request: AuthRegisterRequest):
    try:
        user = auth_service.create_user(request.email, request.password, request.name)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    org_name = request.org_name.strip() or f"{(request.name or request.email).split('@')[0]} Team"
    org_id = (request.org_id or _slugify_org_id(org_name)).strip().lower()
    if org_rbac_store.get_org(org_id):
        org_id = f"{org_id}-{user['user_id'][-4:]}"
    org = org_rbac_store.create_org(org_id, org_name, user["user_id"])
    role = org_rbac_store.role_for(org_id, user["user_id"]) or "owner"
    session = auth_service.create_session(user["user_id"], org_id, role, ttl_seconds=AUTH_SESSION_TTL_SECONDS)
    audit_logger.log("auth.register", user["user_id"], {"org_id": org_id, "email": user["email"]})
    return {
        "token": session["token"],
        "session": session["session"],
        "user": user,
        "org": {"org_id": org_id, "name": org.get("name", org_name), "role": role},
    }


@app.post("/api/auth/login")
def login_auth_user(request: AuthLoginRequest):
    user = auth_service.verify_credentials(request.email, request.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    orgs = org_rbac_store.list_orgs_for_user(user["user_id"])
    if not orgs:
        raise HTTPException(status_code=403, detail="User has no organization membership")

    selected = None
    if request.org_id:
        selected = next((item for item in orgs if item.get("org_id") == request.org_id), None)
        if not selected:
            raise HTTPException(status_code=403, detail="User is not a member of requested org")
    else:
        selected = orgs[0]

    org_id = str(selected.get("org_id", ""))
    role = str(selected.get("role", "viewer"))
    org_meta = org_rbac_store.get_org(org_id)

    session = auth_service.create_session(user["user_id"], org_id, role, ttl_seconds=AUTH_SESSION_TTL_SECONDS)
    audit_logger.log("auth.login", user["user_id"], {"org_id": org_id, "email": user["email"]})
    return {
        "token": session["token"],
        "session": session["session"],
        "user": user,
        "org": {"org_id": org_id, "name": org_meta.get("name", org_id), "role": role},
        "orgs": orgs,
    }


@app.get("/api/auth/session")
def get_auth_session():
    session = _current_session(required=True)
    user_id = str(session.get("user_id", ""))
    org_id = str(session.get("org_id", ""))
    user = auth_service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid session user")
    role = org_rbac_store.role_for(org_id, user_id) or str(session.get("role", "viewer"))
    org = org_rbac_store.get_org(org_id)
    return {
        "session": {"user_id": user_id, "org_id": org_id, "role": role, "expires_at": session.get("expires_at")},
        "user": user,
        "org": {"org_id": org_id, "name": org.get("name", org_id), "role": role},
        "orgs": org_rbac_store.list_orgs_for_user(user_id),
    }


@app.post("/api/auth/switch-org")
def switch_auth_org(request: AuthSwitchOrgRequest):
    session = _current_session(required=True)
    user_id = str(session.get("user_id", ""))
    role = org_rbac_store.role_for(request.org_id, user_id)
    if not role:
        raise HTTPException(status_code=403, detail="User is not a member of requested org")
    next_session = auth_service.create_session(user_id, request.org_id, role, ttl_seconds=AUTH_SESSION_TTL_SECONDS)
    org = org_rbac_store.get_org(request.org_id)
    audit_logger.log("auth.switch_org", user_id, {"org_id": request.org_id})
    return {
        "token": next_session["token"],
        "session": next_session["session"],
        "org": {"org_id": request.org_id, "name": org.get("name", request.org_id), "role": role},
    }


@app.post("/api/auth/logout")
def logout_auth_user(authorization: Optional[str] = Header(default=None)):
    _current_session(required=True)
    token = _extract_bearer_token(authorization)
    if not token:
        raise HTTPException(status_code=400, detail="Missing bearer token")
    revoked = auth_service.revoke_session(token)
    return {"status": "ok", "revoked": revoked}


@app.get("/api/onboarding/{user_id}")
def onboarding_status(user_id: str):
    session = _assert_session_identity(user_id)
    env_status = oauth_service.credentials_status()
    token_status = store.get_user_status(user_id)
    completed = {
        "oauth_app_configured": all(env_status.values()),
        "shopify_connected": token_status.get("shopify", False),
        "meta_connected": token_status.get("meta", False),
        "tiktok_connected": token_status.get("tiktok", False),
    }
    audit_logger.log("onboarding.status_viewed", user_id, {"completed": completed})
    return {
        "user_id": user_id,
        "org_id": session.get("org_id", ""),
        "env": env_status,
        "connections": token_status,
        "completed": completed,
        "ready_for_launch": completed["oauth_app_configured"]
        and completed["shopify_connected"]
        and completed["meta_connected"]
        and completed["tiktok_connected"],
    }


@app.get("/api/onboarding/state/{user_id}")
def get_onboarding_state(user_id: str, org_id: Optional[str] = None):
    _ensure_org_access(org_id, user_id, "viewer")
    row = onboarding_state_store.get(user_id)
    return {
        "user_id": user_id,
        "org_id": org_id or row.get("org_id", ""),
        "state": row.get("state", {}),
        "version": int(row.get("version", 0) or 0),
        "updated_at": row.get("updated_at"),
    }


@app.post("/api/onboarding/state/upsert")
def upsert_onboarding_state(request: OnboardingStateUpsertRequest):
    _ensure_org_access(request.org_id, request.user_id, "marketer")
    try:
        row = onboarding_state_store.upsert(
            request.user_id,
            request.state.model_dump(),
            request.org_id,
            expected_version=request.expected_version,
        )
    except ValueError as exc:
        message = str(exc)
        if message.startswith("version_conflict:"):
            current = int(message.split(":", 1)[1] or 0)
            raise HTTPException(status_code=409, detail={"error": "version_conflict", "current_version": current}) from exc
        raise HTTPException(status_code=400, detail=message) from exc
    audit_logger.log(
        "onboarding.state_upsert",
        request.user_id,
        {"org_id": request.org_id, "keys": sorted(list(request.state.model_dump().keys()))[:20], "version": row.get("version", 0)},
    )
    return {"status": "ok", "row": row}


@app.get("/api/studio/state/{user_id}")
def get_studio_state(user_id: str, org_id: Optional[str] = None):
    _ensure_org_access(org_id, user_id, "viewer")
    row = studio_state_store.get(user_id)
    return {
        "user_id": user_id,
        "org_id": org_id or row.get("org_id", ""),
        "state": row.get("state", {}),
        "version": int(row.get("version", 0) or 0),
        "updated_at": row.get("updated_at"),
    }


@app.post("/api/studio/state/upsert")
def upsert_studio_state(request: StudioStateUpsertRequest):
    _ensure_org_access(request.org_id, request.user_id, "marketer")
    payload = request.state.model_dump()
    try:
        row = studio_state_store.upsert(
            request.user_id,
            payload,
            request.org_id,
            expected_version=request.expected_version,
        )
    except ValueError as exc:
        message = str(exc)
        if message.startswith("version_conflict:"):
            current = int(message.split(":", 1)[1] or 0)
            raise HTTPException(status_code=409, detail={"error": "version_conflict", "current_version": current}) from exc
        raise HTTPException(status_code=400, detail=message) from exc
    audit_logger.log(
        "studio.state_upsert",
        request.user_id,
        {"org_id": request.org_id, "card_count": len(payload.get("cards", [])), "version": row.get("version", 0)},
    )
    return {"status": "ok", "row": row}


@app.get("/api/state/export/{org_id}")
def export_state(org_id: str, actor_user_id: str = Query(...)):
    _ensure_org_access(org_id, actor_user_id, "admin")
    export = {
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "org": org_rbac_store.get_org(org_id),
        "onboarding_state": onboarding_state_store.list_by_org(org_id),
        "studio_state": studio_state_store.list_by_org(org_id),
    }
    return export


@app.post("/api/state/backup/{org_id}")
def backup_state(org_id: str, actor_user_id: str = Query(...)):
    _ensure_org_access(org_id, actor_user_id, "admin")
    export = {
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "org": org_rbac_store.get_org(org_id),
        "onboarding_state": onboarding_state_store.list_by_org(org_id),
        "studio_state": studio_state_store.list_by_org(org_id),
    }
    raw = json.dumps(export, sort_keys=True).encode("utf-8")
    digest = hashlib.sha256(raw).hexdigest()
    backup_dir = Path(__file__).resolve().parents[1] / "data" / "backups"
    backup_dir.mkdir(parents=True, exist_ok=True)
    filename = backup_dir / f"state_backup_{org_id}_{int(datetime.now(timezone.utc).timestamp())}.json"
    filename.write_text(json.dumps({**export, "checksum_sha256": digest}, indent=2), encoding="utf-8")
    audit_logger.log("state.backup_created", actor_user_id, {"org_id": org_id, "path": str(filename), "checksum": digest})
    return {"status": "ok", "path": str(filename), "checksum_sha256": digest}


@app.post("/api/state/audit-export/{org_id}")
def export_org_audit(org_id: str, actor_user_id: str = Query(...), limit: int = Query(5000, ge=1, le=10000)):
    _ensure_org_access(org_id, actor_user_id, "admin")
    export = audit_logger.export_immutable(limit=limit)
    audit_logger.log(
        "state.audit_export_created",
        actor_user_id,
        {"org_id": org_id, "path": export.get("path"), "root_hash": export.get("root_hash"), "count": export.get("count")},
    )
    return {"status": "ok", "org_id": org_id, **export}


@app.get("/api/analytics/preferences/{org_id}")
def get_analytics_preferences(org_id: str, actor_user_id: str = Query(...)):
    _ensure_org_access(org_id, actor_user_id, "viewer")
    row = analytics_preferences_store.get(org_id)
    settings = row.get(
        "settings",
        {
            "role_filter": "all",
            "user_filter": "all",
            "sla_sync_stale_minutes": 30,
            "sla_dlq_threshold_15m": 0,
            "forecast_horizon_days": 7,
        },
    )
    return {"org_id": org_id, "settings": settings, "updated_at": row.get("updated_at"), "updated_by": row.get("updated_by")}


@app.post("/api/analytics/preferences/{org_id}")
def upsert_analytics_preferences(org_id: str, request: AnalyticsPreferencesUpsertRequest):
    _ensure_org_access(org_id, request.actor_user_id, "marketer")
    row = analytics_preferences_store.upsert(org_id, request.actor_user_id, request.settings.model_dump())
    audit_logger.log("analytics.preferences_upsert", request.actor_user_id, {"org_id": org_id, "settings": request.settings.model_dump()})
    return {"status": "ok", "row": row}


@app.get("/api/alerts/routing/{org_id}")
def get_alert_routing(org_id: str, actor_user_id: str = Query(...)):
    _ensure_org_access(org_id, actor_user_id, "viewer")
    row = alert_routing_store.get(org_id)
    routes = row.get("routes", []) if isinstance(row, dict) else []
    return {
        "org_id": org_id,
        "routes": routes,
        "updated_at": row.get("updated_at") if isinstance(row, dict) else None,
        "updated_by": row.get("updated_by") if isinstance(row, dict) else None,
    }


@app.post("/api/alerts/routing/{org_id}")
def upsert_alert_routing(org_id: str, request: AlertRoutingUpsertRequest):
    _ensure_org_access(org_id, request.actor_user_id, "admin")
    row = alert_routing_store.upsert(
        org_id,
        request.actor_user_id,
        [route.model_dump() for route in request.routes],
    )
    audit_logger.log("alerts.routing_upsert", request.actor_user_id, {"org_id": org_id, "route_count": len(request.routes)})
    return {"status": "ok", "row": row}


@app.get("/api/alerts/escalation/{org_id}")
def get_escalation_policy(org_id: str, actor_user_id: str = Query(...)):
    _ensure_org_access(org_id, actor_user_id, "viewer")
    row = escalation_policy_store.get(org_id)
    policy = row.get(
        "policy",
        {
            "enabled": True,
            "repeated_critical_threshold": 3,
            "window_minutes": 60,
            "page_owner_channel": "inapp",
            "page_owner_target": "",
            "include_sla": True,
            "include_anomaly": True,
            "suppression_windows": [],
            "on_call_schedule": [],
        },
    )
    return {"org_id": org_id, "policy": policy, "updated_at": row.get("updated_at"), "updated_by": row.get("updated_by")}


@app.post("/api/alerts/escalation/{org_id}")
def upsert_escalation_policy(org_id: str, request: EscalationPolicyUpsertRequest):
    _ensure_org_access(org_id, request.actor_user_id, "admin")
    policy_payload = dict(request.policy or {})

    if request.suppression_windows_json is not None:
        suppression_raw = _parse_json_list_field("suppression_windows", request.suppression_windows_json)
        policy_payload["suppression_windows"] = _validate_model_list("suppression_windows", suppression_raw, SuppressionWindowModel)

    if request.on_call_schedule_json is not None:
        on_call_raw = _parse_json_list_field("on_call_schedule", request.on_call_schedule_json)
        policy_payload["on_call_schedule"] = _validate_model_list("on_call_schedule", on_call_raw, OnCallShiftModel)

    try:
        validated_policy = EscalationPolicyModel.model_validate(policy_payload).model_dump()
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=_validation_error_detail("policy", exc)) from exc

    row = escalation_policy_store.upsert(org_id, request.actor_user_id, validated_policy)
    audit_logger.log("alerts.escalation_upsert", request.actor_user_id, {"org_id": org_id, "policy": validated_policy})
    return {"status": "ok", "row": row}


@app.get("/api/alerts/oncall/{org_id}/current")
def current_oncall_target(org_id: str, actor_user_id: str = Query(...)):
    _ensure_org_access(org_id, actor_user_id, "viewer")
    policy_row = escalation_policy_store.get(org_id)
    policy = policy_row.get("policy", {}) if isinstance(policy_row, dict) else {}
    channel, target = _resolve_on_call_target(org_id, policy, datetime.now(timezone.utc))
    return {
        "org_id": org_id,
        "channel": channel,
        "target": target,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/api/alerts/events/{org_id}")
def list_alert_events(org_id: str, actor_user_id: str = Query(...), limit: int = Query(100, ge=1, le=500), status: Optional[str] = None):
    _ensure_org_access(org_id, actor_user_id, "viewer")
    return {"org_id": org_id, "items": alert_event_store.list_events(org_id, limit=limit, status=status)}


@app.post("/api/alerts/events/{org_id}/{event_id}/ack")
def acknowledge_alert_event(org_id: str, event_id: str, request: AlertAckRequest):
    _ensure_org_access(org_id, request.actor_user_id, "viewer")
    row = alert_event_store.ack(org_id, event_id, request.actor_user_id)
    if not row:
        raise HTTPException(status_code=404, detail="Alert event not found")
    breach_id = str(row.get("payload", {}).get("breach_id", "") or row.get("breach_id", ""))
    if breach_id:
        sla_breach_store.set_first_ack(org_id, breach_id, str(row.get("acked_at", "")))
    audit_logger.log("alerts.event_ack", request.actor_user_id, {"org_id": org_id, "event_id": event_id})
    return {"status": "ok", "row": row}


@app.get("/api/sla/metrics/{org_id}")
def sla_metrics(org_id: str, actor_user_id: str = Query(...), limit: int = Query(200, ge=1, le=1000)):
    _ensure_org_access(org_id, actor_user_id, "viewer")
    breaches = sla_breach_store.list(org_id, limit=limit)

    mtta_minutes: List[float] = []
    mttr_minutes: List[float] = []
    for breach in breaches:
        opened_at = _parse_iso(str(breach.get("opened_at", "")))
        first_acked_at = _parse_iso(str(breach.get("first_acked_at", "")))
        resolved_at = _parse_iso(str(breach.get("resolved_at", "")))
        if opened_at and first_acked_at and first_acked_at >= opened_at:
            mtta_minutes.append((first_acked_at - opened_at).total_seconds() / 60.0)
        if opened_at and resolved_at and resolved_at >= opened_at:
            mttr_minutes.append((resolved_at - opened_at).total_seconds() / 60.0)

    open_breaches = [row for row in breaches if str(row.get("status", "")) == "open"]
    resolved_breaches = [row for row in breaches if str(row.get("status", "")) == "resolved"]
    mtta = round(sum(mtta_minutes) / len(mtta_minutes), 2) if mtta_minutes else None
    mttr = round(sum(mttr_minutes) / len(mttr_minutes), 2) if mttr_minutes else None
    return {
        "org_id": org_id,
        "open_breaches": len(open_breaches),
        "resolved_breaches": len(resolved_breaches),
        "mtta_minutes": mtta,
        "mttr_minutes": mttr,
        "breaches": breaches,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/api/analytics/anomalies/{org_id}")
def enterprise_kpi_anomalies(org_id: str, actor_user_id: str = Query(...)):
    result = _compute_org_anomalies(org_id, actor_user_id)
    audit_logger.log(
        "analytics.anomalies_view",
        actor_user_id,
        {"org_id": org_id, "count": len(result.get("anomalies", []))},
    )
    return result


@app.get("/api/analytics/org-compare")
def compare_organizations(actor_user_id: str = Query(...), org_ids: str = Query(...)):
    requested = [item.strip() for item in org_ids.split(",") if item.strip()]
    if len(requested) < 2:
        raise HTTPException(status_code=400, detail="Provide at least two org_ids (comma-separated).")

    comparisons: List[Dict[str, Any]] = []
    for org_id in requested[:8]:
        _ensure_org_access(org_id, actor_user_id, "viewer")
        comparisons.append(_collect_org_summary(org_id))

    ranked = sorted(
        comparisons,
        key=lambda row: (
            _safe_float(row.get("roas", 0)),
            _safe_float(row.get("revenue", 0)),
        ),
        reverse=True,
    )
    return {
        "actor_user_id": actor_user_id,
        "org_ids": requested[:8],
        "ranked": ranked,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/api/alerts/dispatch/{org_id}")
def dispatch_alerts(org_id: str, actor_user_id: str = Query(...)):
    _ensure_org_access(org_id, actor_user_id, "marketer")
    analytics = enterprise_analytics(org_id=org_id, actor_user_id=actor_user_id)
    anomaly_pack = _compute_org_anomalies(org_id, actor_user_id)
    routing = alert_routing_store.get(org_id)
    routes = routing.get("routes", []) if isinstance(routing, dict) else []
    route_by_id = {str(route.get("route_id", "")): route for route in routes}
    escalation_row = escalation_policy_store.get(org_id)
    escalation_policy = escalation_row.get(
        "policy",
        {
            "enabled": True,
            "repeated_critical_threshold": 3,
            "window_minutes": 60,
            "page_owner_channel": "inapp",
            "page_owner_target": "",
            "include_sla": True,
            "include_anomaly": True,
            "suppression_windows": [],
            "on_call_schedule": [],
        },
    )
    now_utc = datetime.now(timezone.utc)

    alert_items: List[Dict[str, Any]] = []
    active_sla_types: List[str] = []
    for alert in analytics.get("sla", {}).get("alerts", []):
        if isinstance(alert, dict):
            alert_type = str(alert.get("type", "sla_alert"))
            active_sla_types.append(alert_type)
            breach = sla_breach_store.open_or_get(org_id, alert_type)
            alert_items.append({"scope": "sla", "breach_id": breach.get("breach_id"), **alert})
    sla_breach_store.resolve_absent(org_id, active_sla_types)
    for anomaly in anomaly_pack.get("anomalies", []):
        if isinstance(anomaly, dict):
            alert_items.append({"scope": "anomaly", **anomaly})

    deliveries: List[Dict[str, Any]] = []
    failed_deliveries: List[Dict[str, Any]] = []
    retried_deliveries = 0
    failover_deliveries = 0
    skipped_duplicates = 0

    def dispatch_via_route(route: Dict[str, Any], item: Dict[str, Any], *, is_failover: bool = False) -> Tuple[bool, Dict[str, Any]]:
        nonlocal retried_deliveries
        max_attempts = max(1, int(route.get("retry_attempts", 2) or 0) + 1)
        last_error = ""
        receipts: List[Dict[str, Any]] = []
        for attempt in range(1, max_attempts + 1):
            ok, err = _simulate_dispatch_attempt(route, item, attempt)
            receipts.append(
                {
                    "attempt": attempt,
                    "channel": str(route.get("channel", "inapp")),
                    "target": str(route.get("target", "")),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "status": "sent" if ok else "failed",
                    "error": "" if ok else (err or "dispatch_failed"),
                }
            )
            if ok:
                if attempt > 1:
                    retried_deliveries += (attempt - 1)
                payload = {
                    "route_id": str(route.get("route_id", "")),
                    "channel": str(route.get("channel", "inapp")),
                    "target": str(route.get("target", "")),
                    "scope": str(item.get("scope", "sla")),
                    "severity": str(item.get("severity", "warning")),
                    "is_failover": is_failover,
                    "attempts": attempt,
                    "receipts": receipts,
                    "payload": item,
                }
                return True, payload
            last_error = err or "dispatch_failed"
        payload = {
            "route_id": str(route.get("route_id", "")),
            "channel": str(route.get("channel", "inapp")),
            "target": str(route.get("target", "")),
            "scope": str(item.get("scope", "sla")),
            "severity": str(item.get("severity", "warning")),
            "is_failover": is_failover,
            "attempts": max_attempts,
            "error": last_error,
            "receipts": receipts,
            "payload": item,
        }
        return False, payload

    for route in routes:
        if not bool(route.get("enabled", True)):
            continue
        route_severities = [str(item) for item in route.get("severities", ["critical"])]
        route_events = [str(item) for item in route.get("event_types", ["sla", "anomaly"])]
        for item in alert_items:
            severity = str(item.get("severity", "warning"))
            scope = str(item.get("scope", "sla"))
            if severity not in route_severities:
                continue
            if scope not in route_events:
                continue
            signature_payload = {
                "route_id": str(route.get("route_id", "")),
                "scope": scope,
                "severity": severity,
                "type": str(item.get("type", "")),
                "user_id": str(item.get("user_id", "")),
                "kpi": str(item.get("kpi", "")),
                "campaign_id": str(item.get("campaign_id", "")),
            }
            signature = hashlib.sha256(json.dumps(signature_payload, sort_keys=True).encode("utf-8")).hexdigest()
            cooldown_minutes = int(route.get("cooldown_minutes", 30) or 0)
            since = (datetime.now(timezone.utc) - timedelta(minutes=cooldown_minutes)).isoformat()
            if cooldown_minutes > 0 and alert_event_store.has_recent_signature(org_id, signature, since):
                skipped_duplicates += 1
                continue
            ok, delivery = dispatch_via_route(route, item, is_failover=False)
            delivery["signature"] = signature
            if ok:
                deliveries.append(delivery)
                alert_event_store.append_event(org_id, delivery)
                continue

            failed_deliveries.append(delivery)
            alert_event_store.append_event(org_id, {**delivery, "status": "failed"})
            failover_id = str(route.get("failover_route_id", "") or "")
            failover_route = route_by_id.get(failover_id)
            if failover_route and bool(failover_route.get("enabled", True)):
                ok2, fallback_delivery = dispatch_via_route(failover_route, item, is_failover=True)
                fallback_delivery["signature"] = signature
                if ok2:
                    failover_deliveries += 1
                    deliveries.append(fallback_delivery)
                    alert_event_store.append_event(org_id, fallback_delivery)
                else:
                    failed_deliveries.append(fallback_delivery)
                    alert_event_store.append_event(org_id, {**fallback_delivery, "status": "failed"})

    escalation_triggered = False
    escalation_suppressed = False
    escalation_delivery: Dict[str, Any] | None = None
    if bool(escalation_policy.get("enabled", True)):
        window_minutes = int(escalation_policy.get("window_minutes", 60) or 60)
        threshold = int(escalation_policy.get("repeated_critical_threshold", 3) or 3)
        since = (now_utc - timedelta(minutes=window_minutes)).isoformat()
        critical_recent = alert_event_store.count_recent(
            org_id,
            since_iso=since,
            severity="critical",
            status="dispatched",
        )
        has_critical_sla = any(
            str(item.get("scope", "")) == "sla" and str(item.get("severity", "")) == "critical"
            for item in alert_items
        )
        has_critical_anomaly = any(
            str(item.get("scope", "")) == "anomaly" and str(item.get("severity", "")) == "critical"
            for item in alert_items
        )
        eligible = (
            (bool(escalation_policy.get("include_sla", True)) and has_critical_sla)
            or (bool(escalation_policy.get("include_anomaly", True)) and has_critical_anomaly)
        )
        escalation_scope = "sla" if has_critical_sla else "anomaly"
        suppressed = _is_escalation_suppressed(escalation_policy, escalation_scope, "critical", now_utc)
        if eligible and critical_recent >= threshold and not suppressed:
            oncall_channel, oncall_target = _resolve_on_call_target(org_id, escalation_policy, now_utc)
            escalation_delivery = {
                "route_id": "escalation-owner",
                "channel": oncall_channel,
                "target": oncall_target,
                "scope": "escalation",
                "severity": "critical",
                "attempts": 1,
                "receipts": [
                    {
                        "attempt": 1,
                        "channel": oncall_channel,
                        "target": oncall_target,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "status": "sent",
                        "error": "",
                    }
                ],
                "payload": {
                    "type": "repeated_critical_threshold",
                    "window_minutes": window_minutes,
                    "threshold": threshold,
                    "critical_recent": critical_recent,
                },
            }
            escalation_triggered = True
            deliveries.append(escalation_delivery)
            alert_event_store.append_event(org_id, escalation_delivery)
        elif eligible and critical_recent >= threshold and suppressed:
            escalation_suppressed = True

    delivery_receipts: List[Dict[str, Any]] = []
    receipts_by_channel: Dict[str, Dict[str, int]] = {}
    for delivery in deliveries + failed_deliveries:
        receipts = delivery.get("receipts", [])
        if not isinstance(receipts, list):
            continue
        for receipt in receipts:
            if not isinstance(receipt, dict):
                continue
            delivery_receipts.append(receipt)
            channel = str(receipt.get("channel", "unknown"))
            bucket = receipts_by_channel.setdefault(channel, {"sent": 0, "failed": 0})
            status = str(receipt.get("status", "failed"))
            if status == "sent":
                bucket["sent"] += 1
            else:
                bucket["failed"] += 1

    audit_logger.log(
        "alerts.dispatch",
        actor_user_id,
        {
            "org_id": org_id,
            "alerts_count": len(alert_items),
            "deliveries_count": len(deliveries),
            "skipped_duplicates": skipped_duplicates,
            "failed_deliveries": len(failed_deliveries),
            "retried_deliveries": retried_deliveries,
            "failover_deliveries": failover_deliveries,
            "escalation_triggered": escalation_triggered,
            "escalation_suppressed": escalation_suppressed,
        },
    )
    return {
        "status": "ok",
        "org_id": org_id,
        "alerts_count": len(alert_items),
        "deliveries_count": len(deliveries),
        "skipped_duplicates": skipped_duplicates,
        "failed_deliveries": len(failed_deliveries),
        "retried_deliveries": retried_deliveries,
        "failover_deliveries": failover_deliveries,
        "escalation_triggered": escalation_triggered,
        "escalation_suppressed": escalation_suppressed,
        "escalation_delivery": escalation_delivery,
        "deliveries": deliveries[:100],
        "failed": failed_deliveries[:100],
        "delivery_receipts": delivery_receipts[:500],
        "receipts_by_channel": receipts_by_channel,
    }


@app.get("/api/ops/controls")
def get_ops_controls(actor_user_id: str = Query(...), org_id: Optional[str] = Query(default=None)):
    _ensure_org_access(org_id, actor_user_id, "viewer")
    return {
        "scope": "org" if org_id else "global",
        "org_id": org_id,
        "controls": ops_control_store.get(org_id),
    }


@app.post("/api/ops/controls")
def upsert_ops_controls(request: OpsControlsUpsertRequest):
    _ensure_org_access(request.org_id, request.actor_user_id, "admin")
    row = ops_control_store.upsert(request.actor_user_id, request.controls.model_dump(), request.org_id)
    audit_logger.log(
        "ops.controls_upsert",
        request.actor_user_id,
        {"org_id": request.org_id, "controls": request.controls.model_dump()},
    )
    return {"status": "ok", "row": row}


@app.post("/api/analyze")
def analyze(request: AnalyzeRequest):
    products = find_winning_products(request.niche)
    return {"niche": request.niche, "products": products}


@app.post("/api/generate-copy")
def generate_copy(request: GenerateCopyRequest):
    return copywriter_agent.generate_sales_copy(request.product_name, request.description)


@app.post("/api/generate-3d")
def generate_3d(request: Generate3DRequest):
    glb_url = model_generator.generate_3d_model(request.image_url)
    return {"model_url": glb_url}


@app.post("/api/generate-storyboard")
def generate_storyboard(request: GenerateStoryboardRequest):
    return director_agent.generate_storyboard(request.product_name, request.benefits)


@app.post("/api/render-scene")
def render_scene(request: RenderSceneRequest):
    video_url = producer_agent.render_scene(request.visual_prompt)
    return {"video_url": video_url}


@app.post("/api/publish")
def publish_campaign(request: PublishRequest):
    return publisher_service.push_to_shopify(request.product_data, request.user_tokens)


@app.post("/api/oauth/{platform}/connect")
def oauth_connect(platform: str, request: OAuthConnectRequest):
    _enforce_rate_limit("oauth_connect", request.user_id, limit=30, window_seconds=60)
    _require_org_role(request.org_id, request.user_id, "marketer")

    state = oauth_service.create_state()
    nonce = secrets.token_urlsafe(18)

    if platform == "shopify":
        if not request.shop:
            raise HTTPException(status_code=400, detail="shop is required for shopify OAuth")
        scopes = request.scopes or "read_products,write_products"
        auth_url = oauth_service.shopify_connect_url(request.shop, request.redirect_uri, scopes, state)
    elif platform == "meta":
        scopes = request.scopes or "ads_management,ads_read,business_management,pages_read_engagement"
        auth_url = oauth_service.meta_connect_url(request.redirect_uri, scopes, state)
    elif platform == "tiktok":
        scopes = request.scopes or "ads.management"
        auth_url = oauth_service.tiktok_connect_url(request.redirect_uri, scopes, state)
    else:
        raise HTTPException(status_code=400, detail="Unsupported platform")

    state_store.create(
        user_id=request.user_id,
        platform=platform,
        state=state,
        nonce=nonce,
        redirect_uri=request.redirect_uri,
        shop=request.shop,
    )

    audit_logger.log(
        "oauth.connect_started",
        request.user_id,
        {"platform": platform, "redirect_uri": request.redirect_uri, "org_id": request.org_id},
    )
    return {"platform": platform, "auth_url": auth_url, "state": state, "nonce": nonce}


@app.post("/api/oauth/{platform}/callback")
def oauth_callback(
    platform: str,
    request: OAuthCallbackRequest,
    idempotency_key: Optional[str] = Header(default=None, alias="Idempotency-Key"),
):
    _enforce_rate_limit("oauth_callback", request.user_id, limit=20, window_seconds=60)
    _require_org_role(request.org_id, request.user_id, "marketer")

    payload = request.model_dump()
    record_key, request_hash = _idempotency_key(f"oauth_callback:{platform}", request.user_id, idempotency_key, payload)
    try:
        replay, replay_response = idempotency_store.get_replay_or_conflict(record_key, request_hash)
        if replay and replay_response:
            audit_logger.log("oauth.callback_replay", request.user_id, {"platform": platform, "key": record_key})
            return replay_response
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    idempotency_store.reserve(record_key, request_hash, ttl_seconds=86400)

    try:
        state_payload = state_store.consume(
            state=request.state,
            user_id=request.user_id,
            platform=platform,
            nonce=request.nonce,
        )

        redirect_uri = state_payload.get("redirect_uri", "")
        shop = state_payload.get("shop")

        if platform == "shopify":
            if not shop:
                raise HTTPException(status_code=400, detail="Missing shop context for shopify OAuth")
            token_data = oauth_service.exchange_shopify_code(shop, request.code)
        elif platform == "meta":
            token_data = oauth_service.exchange_meta_code(request.code, redirect_uri)
        elif platform == "tiktok":
            token_data = oauth_service.exchange_tiktok_code(request.code, redirect_uri)
        else:
            raise HTTPException(status_code=400, detail="Unsupported platform")

        saved = store.set_platform_tokens(request.user_id, platform, token_data)
        response = {"platform": platform, "connected": True, "token_data": saved}
        idempotency_store.complete(record_key, request_hash, response, ttl_seconds=86400)
        audit_logger.log("oauth.connected", request.user_id, {"platform": platform})
        return response
    except HTTPException:
        raise
    except Exception as exc:
        dead_letter_queue.enqueue(
            queue="oauth_callback",
            user_id=request.user_id,
            payload={"platform": platform, "state": request.state},
            error=str(exc),
        )
        audit_logger.log("oauth.failed", request.user_id, {"platform": platform, "error": str(exc)})
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/tokens/{user_id}/status")
def token_status(user_id: str):
    _assert_session_identity(user_id)
    return {"user_id": user_id, "status": store.get_user_status(user_id)}


@app.get("/api/audit/logs")
def get_audit_logs(user_id: Optional[str] = None, limit: int = 100):
    return {"items": audit_logger.read_recent(limit=limit, user_id=user_id)}


@app.get("/api/audit/export")
def export_audit_immutable(user_id: Optional[str] = None, limit: int = 2000):
    export = audit_logger.export_immutable(limit=limit, user_id=user_id)
    audit_logger.log("audit.export", user_id or "system", {"count": export["count"], "root_hash": export["root_hash"]})
    return export


@app.get("/api/dlq/recent")
def dlq_recent(limit: int = 100):
    return {"items": dead_letter_queue.recent(limit=limit)}


@app.post("/api/campaigns/create")
def create_campaigns(
    request: CampaignCreateRequest,
    idempotency_key: Optional[str] = Header(default=None, alias="Idempotency-Key"),
):
    _enforce_rate_limit("campaign_create", request.user_id, limit=12, window_seconds=60)
    _require_org_role(request.org_id, request.user_id, "marketer")

    payload = request.model_dump()
    record_key, request_hash = _idempotency_key("campaign_create", request.user_id, idempotency_key, payload)
    try:
        replay, replay_response = idempotency_store.get_replay_or_conflict(record_key, request_hash)
        if replay and replay_response:
            audit_logger.log("campaigns.create_replay", request.user_id, {"key": record_key})
            return replay_response
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    idempotency_store.reserve(record_key, request_hash, ttl_seconds=86400)

    before_meta = store.get_platform_tokens(request.user_id, "meta")
    before_tiktok = store.get_platform_tokens(request.user_id, "tiktok")
    user_meta = token_rotation_service.refresh_meta_if_needed(request.user_id)
    user_tiktok = token_rotation_service.refresh_tiktok_if_needed(request.user_id)
    token_rotation_events = {
        "meta_refreshed": bool(
            before_meta.get("access_token")
            and user_meta.get("access_token")
            and (
                before_meta.get("access_token") != user_meta.get("access_token")
                or before_meta.get("connected_at") != user_meta.get("connected_at")
            )
        ),
        "tiktok_refreshed": bool(
            before_tiktok.get("access_token")
            and user_tiktok.get("access_token")
            and (
                before_tiktok.get("access_token") != user_tiktok.get("access_token")
                or before_tiktok.get("connected_at") != user_tiktok.get("connected_at")
            )
        ),
    }

    created = []
    errors = []

    if user_meta.get("access_token"):
        ad_accounts = user_meta.get("ad_accounts", [])
        account_id = ad_accounts[0].get("id", "") if ad_accounts else ""
        if account_id:
            try:
                created.append(
                    campaign_service.create_meta_campaigns(
                        access_token=user_meta["access_token"],
                        ad_account_id=account_id,
                        campaign_name=request.campaign_name,
                        objective=request.objective,
                        daily_budget=request.daily_budget,
                        user_id=request.user_id,
                    )
                )
            except Exception as exc:
                errors.append(f"meta: {exc}")
        else:
            errors.append("meta: no ad account detected")
    else:
        errors.append("meta: not connected")

    if user_tiktok.get("access_token") and user_tiktok.get("open_id"):
        try:
            created.append(
                campaign_service.create_tiktok_campaigns(
                    access_token=user_tiktok["access_token"],
                    advertiser_id=user_tiktok["open_id"],
                    campaign_name=request.campaign_name,
                    objective=request.objective,
                    daily_budget=request.daily_budget,
                    user_id=request.user_id,
                )
            )
        except Exception as exc:
            errors.append(f"tiktok: {exc}")
    else:
        errors.append("tiktok: not connected")

    if created:
        campaign_store.save_created_campaigns(
            user_id=request.user_id,
            campaigns=created,
            meta={
                "campaign_name": request.campaign_name,
                "objective": request.objective,
                "daily_budget": request.daily_budget,
            },
        )

    response = {
        "status": "partial_success" if created and errors else ("success" if created else "failed"),
        "campaigns": created,
        "errors": errors,
    }
    idempotency_store.complete(record_key, request_hash, response, ttl_seconds=86400)

    audit_logger.log(
        "campaigns.create",
        request.user_id,
        {
            "campaign_name": request.campaign_name,
            "objective": request.objective,
            "created_count": len(created),
            "errors": errors,
            "token_rotation": token_rotation_events,
            "org_id": request.org_id,
        },
    )

    return response


@app.post("/api/tokens/rotate/run")
def run_token_rotation(user_id: str):
    _assert_session_identity(user_id, minimum_role="marketer")
    before_meta = store.get_platform_tokens(user_id, "meta")
    before_tiktok = store.get_platform_tokens(user_id, "tiktok")
    after_meta = token_rotation_service.refresh_meta_if_needed(user_id)
    after_tiktok = token_rotation_service.refresh_tiktok_if_needed(user_id)
    summary = {
        "users_checked": 1,
        "meta_refreshed": int(
            bool(before_meta.get("access_token"))
            and bool(after_meta.get("access_token"))
            and (
                before_meta.get("access_token") != after_meta.get("access_token")
                or before_meta.get("connected_at") != after_meta.get("connected_at")
            )
        ),
        "tiktok_refreshed": int(
            bool(before_tiktok.get("access_token"))
            and bool(after_tiktok.get("access_token"))
            and (
                before_tiktok.get("access_token") != after_tiktok.get("access_token")
                or before_tiktok.get("connected_at") != after_tiktok.get("connected_at")
            )
        ),
        "errors": [],
    }
    audit_logger.log("tokens.rotation_manual", user_id, summary)
    return {"status": "ok", "summary": summary}


@app.post("/api/campaigns/metrics/upsert")
def upsert_campaign_metrics(request: CampaignMetricsRequest):
    _assert_session_identity(request.user_id, minimum_role="marketer")
    campaign_store.update_campaign_metrics(request.user_id, request.campaign_metrics)
    audit_logger.log("campaigns.metrics_upsert", request.user_id, {"count": len(request.campaign_metrics)})
    return {"status": "ok", "count": len(request.campaign_metrics)}


@app.post("/api/campaigns/optimizer/run")
def run_optimizer(request: OptimizerRequest):
    _assert_session_identity(request.user_id, minimum_role="marketer")
    campaign_store.update_campaign_metrics(request.user_id, request.campaign_metrics)
    result = campaign_service.build_optimizer_actions(request.campaign_metrics)
    wrapped = {
        "user_id": request.user_id,
        "result": result,
        "trigger": "manual",
    }
    campaign_store.save_optimizer_run(request.user_id, wrapped)
    audit_logger.log("optimizer.run_manual", request.user_id, {"actions": len(result.get("actions", []))})
    return {
        "user_id": request.user_id,
        "result": result,
        "note": "Apply actions through platform-specific adset/campaign update endpoints.",
    }


@app.post("/api/campaigns/optimizer/execute")
def execute_optimizer_actions(request: OptimizerExecuteRequest):
    _enforce_rate_limit("optimizer_execute", request.user_id, limit=20, window_seconds=60)
    _require_org_role(request.org_id, request.user_id, "marketer")
    controls = ops_control_store.get(request.org_id)
    if not bool(controls.get("optimizer_execute_enabled", True)):
        raise HTTPException(status_code=423, detail="Optimizer execution is disabled by ops controls")
    limited_actions = request.actions[: int(controls.get("max_optimizer_actions_per_run", 50) or 50)]

    execution = optimizer_executor.execute_actions(request.user_id, limited_actions)

    audit_logger.log(
        "optimizer.execute_actions",
        request.user_id,
        {
            "applied": len(execution.get("results", [])),
            "errors": execution.get("errors", []),
            "skipped": execution.get("skipped", []),
            "requested_actions": len(request.actions),
            "executed_actions": len(limited_actions),
            "org_id": request.org_id,
        },
    )
    return execution


@app.post("/api/copilot/execute")
def execute_copilot_actions(request: CopilotExecuteRequest):
    _enforce_rate_limit("copilot_execute", request.user_id, limit=20, window_seconds=60)
    _ensure_org_access(request.org_id, request.user_id, "marketer")
    controls = ops_control_store.get(request.org_id)
    if not bool(controls.get("copilot_execute_enabled", True)):
        raise HTTPException(status_code=423, detail="Copilot execution is disabled by ops controls")
    capped_actions = request.actions[: int(controls.get("max_copilot_actions_per_run", 50) or 50)]

    min_roas = float(request.guardrails.get("min_roas", 1.2) or 1.2)
    max_scale_pct = float(request.guardrails.get("max_scale_pct", 20) or 20)
    min_spend_for_pause = float(request.guardrails.get("min_spend_for_pause", 50) or 50)
    min_ctr_for_pause = float(request.guardrails.get("min_ctr_for_pause", 1.2) or 1.2)
    safe_actions: List[Dict[str, Any]] = []
    skipped_guardrail: List[Dict[str, Any]] = []

    for action in capped_actions:
        action_type = str(action.get("action", ""))
        roas = float(action.get("roas", 0) or 0)
        ctr = float(action.get("ctr", 0) or 0)
        spend = float(action.get("spend", 0) or 0)
        delta = float(action.get("delta_percent", 0) or 0)
        is_safe = False
        if action_type == "pause":
            is_safe = spend >= min_spend_for_pause and ctr < min_ctr_for_pause
        elif action_type == "scale_budget":
            is_safe = roas >= min_roas and delta <= max_scale_pct
        elif action_type == "refresh_creative":
            is_safe = spend >= 30 and roas < min_roas
        if is_safe:
            safe_actions.append(action)
        else:
            skipped_guardrail.append(action)

    execution = optimizer_executor.execute_actions(request.user_id, safe_actions) if safe_actions else {"results": [], "errors": [], "skipped": []}
    response = {
        "status": "ok",
        "applied_count": len(execution.get("results", [])),
        "safe_count": len(safe_actions),
        "skipped_guardrail_count": len(skipped_guardrail),
        "execution": execution,
    }
    audit_logger.log(
        "copilot.execute",
        request.user_id,
        {
            "org_id": request.org_id,
            "guardrails": request.guardrails,
            "safe_count": len(safe_actions),
            "skipped_guardrail_count": len(skipped_guardrail),
            "applied_count": len(execution.get("results", [])),
            "errors": execution.get("errors", []),
        },
    )
    return response


@app.post("/api/campaigns/optimizer/run-weekly")
def run_weekly_optimizer(user_id: str):
    _assert_session_identity(user_id, minimum_role="marketer")
    result = optimizer_scheduler.run_weekly_optimizer_now(user_id)
    action_count = len(result.get("result", {}).get("actions", []))
    audit_logger.log("optimizer.run_weekly", user_id, {"actions": action_count})
    return result


@app.get("/api/campaigns/optimizer/latest/{user_id}")
def latest_optimizer_run(user_id: str):
    _assert_session_identity(user_id)
    latest = campaign_store.get_latest_optimizer_run(user_id)
    return {"user_id": user_id, "latest": latest}


@app.post("/api/sourcing/find")
def sourcing_find(request: AnalyzeRequest):
    return find_winning_products(request.niche)


@app.post("/api/orgs/create")
def create_org(request: OrgCreateRequest):
    _assert_session_identity(request.owner_user_id)
    org = org_rbac_store.create_org(request.org_id, request.name, request.owner_user_id)
    audit_logger.log("org.create", request.owner_user_id, {"org_id": request.org_id, "name": request.name})
    return org


@app.post("/api/orgs/{org_id}/members/upsert")
def upsert_member(org_id: str, request: OrgMemberUpsertRequest):
    _assert_session_identity(request.actor_user_id, org_id, "admin")
    try:
        org = org_rbac_store.upsert_member(org_id, request.actor_user_id, request.user_id, request.role)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    audit_logger.log(
        "org.member_upsert",
        request.actor_user_id,
        {"org_id": org_id, "target_user_id": request.user_id, "role": request.role},
    )
    return org


@app.get("/api/orgs/{org_id}/members")
def list_members(org_id: str, actor_user_id: str = Query(...)):
    _require_org_role(org_id, actor_user_id, "viewer")
    return {"org_id": org_id, "members": org_rbac_store.list_members(org_id)}


@app.post("/api/attribution/events")
def ingest_attribution_event(request: AttributionEventRequest):
    _assert_session_identity(request.user_id, minimum_role="viewer")
    _enforce_rate_limit("attribution_ingest", request.user_id, limit=180, window_seconds=60)
    row = attribution_service.ingest(request.user_id, request.event)
    audit_logger.log("attribution.event_ingested", request.user_id, {"type": row.get("type")})
    return {"status": "ok", "event": row}


@app.get("/api/attribution/summary/{user_id}")
def attribution_summary(user_id: str):
    _assert_session_identity(user_id)
    summary = attribution_service.summary(user_id)
    return summary


@app.post("/api/offers/recommend")
def recommend_offers(request: OfferRecommendationRequest):
    _require_org_role(request.org_id, request.user_id, "marketer")
    result = offer_engine_service.recommend(request.product, request.cart)
    audit_logger.log(
        "offer_engine.recommend",
        request.user_id,
        {
            "org_id": request.org_id,
            "product": request.product.get("name", ""),
            "recommendation_count": len(result.get("recommendations", [])),
        },
    )
    return result


@app.post("/api/offers/catalog/upsert")
def upsert_offer_catalog(request: SkuCatalogUpsertRequest):
    _require_org_role(request.org_id, request.user_id, "marketer")
    saved = sku_catalog_store.upsert_skus(request.user_id, request.skus)
    audit_logger.log(
        "offer_catalog.upsert",
        request.user_id,
        {"count": len(saved), "org_id": request.org_id},
    )
    return {"status": "ok", "count": len(saved), "skus": saved}


@app.get("/api/offers/catalog/{user_id}")
def list_offer_catalog(user_id: str):
    _assert_session_identity(user_id)
    return {"user_id": user_id, "skus": sku_catalog_store.list_skus(user_id)}


@app.post("/api/offers/recommend-v2")
def recommend_offers_v2(request: OfferRecommendationV2Request):
    _require_org_role(request.org_id, request.user_id, "marketer")
    catalog = sku_catalog_store.list_skus(request.user_id)
    result = offer_engine_service.recommend_v2(
        product=request.product,
        catalog=catalog,
        constraints=request.constraints,
        experiment=request.experiment,
    )
    audit_logger.log(
        "offer_engine.recommend_v2",
        request.user_id,
        {
            "org_id": request.org_id,
            "catalog_count": len(catalog),
            "recommendation_count": len(result.get("recommendations", [])),
        },
    )
    return result


@app.get("/api/dashboard/realtime/{user_id}")
def realtime_dashboard_snapshot(user_id: str):
    _assert_session_identity(user_id)
    return {
        "campaigns": campaign_store.dashboard_snapshot(user_id),
        "attribution": attribution_service.summary(user_id),
        "optimizer_latest": campaign_store.get_latest_optimizer_run(user_id),
    }


@app.get("/api/analytics/enterprise/{org_id}")
def enterprise_analytics(
    org_id: str,
    actor_user_id: str = Query(...),
    lookback_days: int = Query(7, ge=1, le=60),
    role_filter: Optional[str] = Query(None),
    user_filter: Optional[str] = Query(None),
    sla_sync_stale_minutes: Optional[int] = Query(None, ge=5, le=240),
    sla_dlq_threshold_15m: Optional[int] = Query(None, ge=0, le=100),
    forecast_horizon_days: Optional[int] = Query(None, ge=1, le=30),
):
    _ensure_org_access(org_id, actor_user_id, "viewer")
    preference_row = analytics_preferences_store.get(org_id)
    saved = preference_row.get("settings", {}) if isinstance(preference_row, dict) else {}
    active_role_filter = str(role_filter if role_filter is not None else saved.get("role_filter", "all"))
    active_user_filter = str(user_filter if user_filter is not None else saved.get("user_filter", "all"))
    active_sla_sync_stale_minutes = int(
        sla_sync_stale_minutes if sla_sync_stale_minutes is not None else saved.get("sla_sync_stale_minutes", 30)
    )
    active_sla_dlq_threshold_15m = int(
        sla_dlq_threshold_15m if sla_dlq_threshold_15m is not None else saved.get("sla_dlq_threshold_15m", 0)
    )
    active_forecast_horizon_days = int(
        forecast_horizon_days if forecast_horizon_days is not None else saved.get("forecast_horizon_days", 7)
    )

    all_members = org_rbac_store.list_members(org_id)
    members = [
        m
        for m in all_members
        if (active_role_filter == "all" or str(m.get("role", "")) == active_role_filter)
        and (active_user_filter == "all" or str(m.get("user_id", "")) == active_user_filter)
    ]
    user_ids = [str(m.get("user_id", "")) for m in members if m.get("user_id")]
    by_user: List[Dict[str, Any]] = []

    org_spend = 0.0
    org_revenue = 0.0
    org_campaigns = 0
    org_experiments = 0
    org_events = 0
    role_rollup: Dict[str, Dict[str, Any]] = {}

    for member in members:
        uid = str(member.get("user_id", ""))
        role = str(member.get("role", "viewer"))
        if not uid:
            continue
        campaign = campaign_store.dashboard_snapshot(uid)
        attr = attribution_service.summary(uid)
        experiments = experiment_store.list_experiments(uid)
        running_experiments = sum(1 for exp in experiments if str(exp.get("status", "")) == "running")
        row = {
            "user_id": uid,
            "role": role,
            "campaigns": int(campaign.get("campaign_count", 0) or 0),
            "spend": float(campaign.get("total_spend", 0) or 0),
            "revenue": float(attr.get("revenue", 0) or 0),
            "roas": attr.get("roas"),
            "events": int(attr.get("events", 0) or 0),
            "running_experiments": running_experiments,
        }
        by_user.append(row)

        org_spend += row["spend"]
        org_revenue += row["revenue"]
        org_campaigns += row["campaigns"]
        org_events += row["events"]
        org_experiments += running_experiments

        rr = role_rollup.setdefault(
            role,
            {"members": 0, "campaigns": 0, "spend": 0.0, "revenue": 0.0, "events": 0},
        )
        rr["members"] = int(rr.get("members", 0) or 0) + 1
        rr["campaigns"] = int(rr.get("campaigns", 0) or 0) + row["campaigns"]
        rr["spend"] = float(rr.get("spend", 0) or 0) + row["spend"]
        rr["revenue"] = float(rr.get("revenue", 0) or 0) + row["revenue"]
        rr["events"] = int(rr.get("events", 0) or 0) + row["events"]

    now = datetime.now(timezone.utc)
    stale_cutoff = now - timedelta(minutes=active_sla_sync_stale_minutes)
    stale_campaigns: List[Dict[str, Any]] = []
    for uid in user_ids:
        for campaign in campaign_store.get_user_campaigns(uid):
            last_sync = str(campaign.get("synced_at", "") or campaign.get("metrics_updated_at", ""))
            parsed = _parse_iso(last_sync)
            if parsed is None or parsed < stale_cutoff:
                stale_campaigns.append(
                    {
                        "user_id": uid,
                        "platform": str(campaign.get("platform", "")),
                        "campaign_id": str(campaign.get("campaign_id", "")),
                        "last_sync": last_sync or None,
                    }
                )

    dlq_recent = dead_letter_queue.recent(limit=250)
    dlq_recent_org = [
        row
        for row in dlq_recent
        if str(row.get("context", {}).get("org_id", "")) == org_id or str(row.get("user_id", "")) in user_ids
    ]
    dlq_15m = []
    threshold = now - timedelta(minutes=15)
    for row in dlq_recent_org:
        parsed = _parse_iso(str(row.get("ts", "")))
        if parsed and parsed >= threshold:
            dlq_15m.append(row)

    total_daily_budget = 0.0
    total_campaign_roas = 0.0
    roas_count = 0
    for uid in user_ids:
        for campaign in campaign_store.get_user_campaigns(uid):
            total_daily_budget += float(campaign.get("daily_budget", 0) or 0)
            metrics = campaign.get("last_metrics", {}) or {}
            roas = metrics.get("roas")
            if roas is not None:
                total_campaign_roas += float(roas or 0)
                roas_count += 1

    avg_roas = (total_campaign_roas / roas_count) if roas_count else 0.0
    forecast_spend_horizon = round(total_daily_budget * active_forecast_horizon_days, 2)
    forecast_revenue_horizon = round(forecast_spend_horizon * avg_roas, 2) if avg_roas > 0 else 0.0
    confidence = "high" if org_events >= 500 else ("medium" if org_events >= 100 else "low")

    sla_alerts: List[Dict[str, Any]] = []
    if stale_campaigns:
        sla_alerts.append(
            {
                "type": "campaign_sync_stale",
                "severity": "warning" if len(stale_campaigns) < 3 else "critical",
                "count": len(stale_campaigns),
                "target_minutes": active_sla_sync_stale_minutes,
            }
        )
    if len(dlq_15m) > active_sla_dlq_threshold_15m:
        sla_alerts.append(
            {
                "type": "integration_failures_15m",
                "severity": "critical",
                "count": len(dlq_15m),
                "target_max": active_sla_dlq_threshold_15m,
            }
        )

    response = {
        "org": {
            "org_id": org_id,
            "name": str(org_rbac_store.get_org(org_id).get("name", org_id)),
            "members": len(members),
            "campaigns": org_campaigns,
            "running_experiments": org_experiments,
            "spend": round(org_spend, 2),
            "revenue": round(org_revenue, 2),
            "roas": round((org_revenue / org_spend), 3) if org_spend > 0 else None,
        },
        "drilldowns": {
            "team_members": by_user,
            "role_rollup": [
                {
                    "role": role,
                    "members": int(vals.get("members", 0) or 0),
                    "campaigns": int(vals.get("campaigns", 0) or 0),
                    "spend": round(float(vals.get("spend", 0) or 0), 2),
                    "revenue": round(float(vals.get("revenue", 0) or 0), 2),
                    "events": int(vals.get("events", 0) or 0),
                }
                for role, vals in sorted(role_rollup.items(), key=lambda kv: kv[0])
            ],
        },
        "sla": {
            "window_minutes": 15,
            "alerts": sla_alerts,
            "stale_campaigns": stale_campaigns[:20],
            "dlq_recent_count": len(dlq_recent_org),
        },
        "forecast": {
            "lookback_days": lookback_days,
            "horizon_days": active_forecast_horizon_days,
            "projected_spend": forecast_spend_horizon,
            "projected_revenue": forecast_revenue_horizon,
            "projected_roas": round(avg_roas, 3) if avg_roas > 0 else None,
            "confidence": confidence,
        },
        "controls": {
            "role_filter": active_role_filter,
            "user_filter": active_user_filter,
            "sla_sync_stale_minutes": active_sla_sync_stale_minutes,
            "sla_dlq_threshold_15m": active_sla_dlq_threshold_15m,
            "forecast_horizon_days": active_forecast_horizon_days,
        },
    }
    audit_logger.log(
        "analytics.enterprise_view",
        actor_user_id,
        {"org_id": org_id, "member_count": len(members), "controls": response.get("controls", {})},
    )
    return response


@app.post("/api/marketing/micro-influencer-plan")
def micro_influencer_plan(request: MicroInfluencerPlanRequest):
    _require_org_role(request.org_id, request.user_id, "marketer")
    plan = marketing_playbook_service.micro_influencer_plan(
        niche=request.niche,
        product_name=request.product_name,
        product_price=request.product_price,
        product_cost=request.product_cost,
        budget=request.budget,
    )
    audit_logger.log(
        "marketing.micro_influencer_plan",
        request.user_id,
        {
            "org_id": request.org_id,
            "niche": request.niche,
            "product_name": request.product_name,
            "budget": request.budget,
        },
    )
    return plan


@app.post("/api/store/trust-checklist")
def trust_checklist(request: TrustChecklistRequest):
    _require_org_role(request.org_id, request.user_id, "marketer")
    result = marketing_playbook_service.trust_checklist(request.model_dump())
    audit_logger.log(
        "store.trust_checklist",
        request.user_id,
        {"org_id": request.org_id, "score": result.get("score", 0)},
    )
    return result


@app.post("/api/experiments/create")
def create_experiment(request: ExperimentCreateRequest):
    _require_org_role(request.org_id, request.user_id, "marketer")
    experiment = experiment_store.create_experiment(
        user_id=request.user_id,
        name=request.name,
        variants=request.variants,
        rules=request.rules,
    )
    audit_logger.log(
        "experiments.create",
        request.user_id,
        {"org_id": request.org_id, "experiment_id": experiment.get("experiment_id", ""), "name": request.name},
    )
    return experiment


@app.post("/api/experiments/{experiment_id}/metrics/upsert")
def upsert_experiment_metrics(experiment_id: str, request: ExperimentMetricsUpsertRequest):
    _require_org_role(request.org_id, request.user_id, "marketer")
    experiment = experiment_store.upsert_variant_metrics(request.user_id, experiment_id, request.metrics)
    audit_logger.log(
        "experiments.metrics_upsert",
        request.user_id,
        {"org_id": request.org_id, "experiment_id": experiment_id, "variant_count": len(request.metrics)},
    )
    return {"status": "ok", "experiment": experiment}


@app.post("/api/experiments/{experiment_id}/evaluate")
def evaluate_experiment(experiment_id: str, user_id: str, org_id: Optional[str] = None):
    _require_org_role(org_id, user_id, "marketer")
    evaluation = experimentation_engine.evaluate_experiment(user_id, experiment_id)
    audit_logger.log(
        "experiments.evaluate",
        user_id,
        {"org_id": org_id, "experiment_id": experiment_id, "promoted": evaluation.get("promoted", False)},
    )
    return {"experiment_id": experiment_id, "evaluation": evaluation}


@app.get("/api/experiments/{user_id}")
def list_experiments(user_id: str):
    _assert_session_identity(user_id)
    return {"user_id": user_id, "items": experiment_store.list_experiments(user_id)}


@app.get("/api/experiments/{experiment_id}/assign")
def assign_experiment_variant(experiment_id: str, user_id: str, session_id: str, org_id: Optional[str] = None):
    _require_org_role(org_id, user_id, "viewer")
    experiment = experiment_store.get_experiment(user_id, experiment_id)
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")

    variants = experiment.get("variants", [])
    if not variants:
        raise HTTPException(status_code=400, detail="No variants configured")

    # Deterministic weighted assignment per session to preserve user experience.
    variant = experimentation_engine.assign_variant(experiment, session_id)
    return {
        "experiment_id": experiment_id,
        "session_id": session_id,
        "variant_id": variant.get("variant_id", ""),
        "variant_name": variant.get("name", ""),
        "status": experiment.get("status", "running"),
    }


@app.post("/api/experiments/events")
def ingest_experiment_event(request: ExperimentEventRequest):
    _require_org_role(request.org_id, request.user_id, "viewer")
    _enforce_rate_limit("experiments.events", request.user_id, 240, 60)
    result = _ingest_experiment_event(
        user_id=request.user_id,
        experiment_id=request.experiment_id,
        session_id=request.session_id,
        event_type=request.event_type,
        variant_id=request.variant_id,
        revenue=request.revenue,
        spend=request.spend,
    )
    audit_logger.log(
        "experiments.event_ingested",
        request.user_id,
        {
            "org_id": request.org_id,
            "experiment_id": request.experiment_id,
            "variant_id": result.get("variant_id"),
            "event_type": request.event_type,
        },
    )
    return result


@app.post("/api/experiments/auto-promote/run")
def run_auto_promotions():
    summary = experimentation_engine.run_auto_promotions()
    audit_logger.log("experiments.auto_promotion_manual", "system", summary)
    return summary


@app.post("/api/webhooks/{platform}")
async def ingest_webhook(platform: str, request: Request):
    raw_body = await request.body()
    headers = {k.lower(): v for k, v in request.headers.items()}

    if not webhook_service.verify(platform, raw_body, headers):
        audit_logger.log("webhook.invalid_signature", "system", {"platform": platform})
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    try:
        payload = json.loads(raw_body.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        payload = {"raw": raw_body.decode("utf-8", errors="ignore")}

    event_id = (
        headers.get("x-shopify-webhook-id")
        or headers.get("x-shopify-event-id")
        or headers.get("x-meta-delivery-id")
        or headers.get("x-tiktok-event-id")
        or str(payload.get("event_id", "") or "")
        or str(payload.get("id", "") or "")
        or str(payload.get("webhook_id", "") or "")
    )
    webhook_key = ""
    webhook_hash = ""
    if event_id:
        webhook_key = f"webhook:{platform}:{event_id}"
        webhook_hash = idempotency_store.hash_payload(payload)
        try:
            replay, _ = idempotency_store.get_replay_or_conflict(webhook_key, webhook_hash)
            if replay:
                audit_logger.log("webhook.duplicate_ignored", "system", {"platform": platform, "event_id": event_id})
                return {"status": "ignored", "reason": "duplicate_event", "event_id": event_id}
        except ValueError as exc:
            audit_logger.log("webhook.idempotency_conflict", "system", {"platform": platform, "event_id": event_id})
            raise HTTPException(status_code=409, detail=str(exc)) from exc
        idempotency_store.reserve(webhook_key, webhook_hash, ttl_seconds=604800)

    user_id = str(payload.get("user_id", "system"))
    webhook_service.persist_event(platform, payload, user_id=user_id)
    if user_id != "system":
        campaign_store.apply_webhook_event(user_id, platform, payload)

    event_type = str(payload.get("type", payload.get("event_type", ""))).lower()
    if user_id != "system" and event_type in {"purchase", "checkout_completed", "ad_spend"}:
        attribution_service.ingest(
            user_id,
            {
                "type": "purchase" if event_type in {"purchase", "checkout_completed"} else "ad_spend",
                "utm_source": payload.get("utm_source", platform),
                "utm_campaign": payload.get("utm_campaign", payload.get("campaign_name", "")),
                "campaign_id": payload.get("campaign_id", ""),
                "adset_id": payload.get("adset_id", ""),
                "session_id": payload.get("session_id", ""),
                "customer_id": payload.get("customer_id", ""),
                "order_id": payload.get("order_id", ""),
                "revenue": payload.get("revenue", 0),
                "ad_spend": payload.get("spend", 0),
                "meta": {"source": "webhook", "platform": platform},
            },
        )

    experiment_update: Dict[str, Any] | None = None
    if user_id != "system" and payload.get("experiment_id") and payload.get("session_id"):
        mapped_event = ""
        if event_type in {"purchase", "checkout_completed", "conversion"}:
            mapped_event = "conversion"
        elif event_type in {"ad_spend", "spend"}:
            mapped_event = "spend"
        elif event_type in {"impression", "view", "ad_impression"}:
            mapped_event = "impression"
        elif event_type in {"revenue"}:
            mapped_event = "revenue"

        if mapped_event:
            try:
                experiment_update = _ingest_experiment_event(
                    user_id=user_id,
                    experiment_id=str(payload.get("experiment_id", "")),
                    session_id=str(payload.get("session_id", "")),
                    event_type=mapped_event,
                    variant_id=str(payload.get("variant_id", "") or ""),
                    revenue=float(payload.get("revenue", 0) or 0),
                    spend=float(payload.get("spend", 0) or 0),
                )
            except HTTPException as exc:
                audit_logger.log(
                    "experiments.webhook_event_failed",
                    user_id,
                    {"platform": platform, "error": exc.detail},
                )

    audit_logger.log("webhook.ingested", user_id, {"platform": platform})
    response = {"status": "ok", "event_id": event_id or None}
    if experiment_update:
        response["experiment_update"] = {
            "experiment_id": experiment_update.get("experiment_id"),
            "variant_id": experiment_update.get("variant_id"),
            "event_type": experiment_update.get("event_type"),
        }
    if webhook_key:
        idempotency_store.complete(webhook_key, webhook_hash, response, ttl_seconds=604800)
    return response


@app.get("/api/webhooks/meta")
def verify_meta_webhook(
    hub_mode: Optional[str] = Query(default=None, alias="hub.mode"),
    hub_challenge: Optional[str] = Query(default=None, alias="hub.challenge"),
    hub_verify_token: Optional[str] = Query(default=None, alias="hub.verify_token"),
):
    expected_token = os.getenv("META_WEBHOOK_VERIFY_TOKEN", "")
    if hub_mode == "subscribe" and hub_verify_token and expected_token and hub_verify_token == expected_token:
        return Response(content=str(hub_challenge or ""), media_type="text/plain")
    raise HTTPException(status_code=403, detail="Webhook verification failed")


# ═══════════════════════════════════════════════════════════════════
# PAYMENTS — Stripe
# ═══════════════════════════════════════════════════════════════════


class CheckoutRequest(BaseModel):
    product_name: str
    price_cents: int
    success_url: str = "http://localhost:3000/success"
    cancel_url: str = "http://localhost:3000/cancel"
    currency: str = "usd"


@app.post("/api/payments/checkout")
def create_checkout(request: CheckoutRequest):
    return stripe_service.create_checkout_session(
        price_cents=request.price_cents,
        product_name=request.product_name,
        success_url=request.success_url,
        cancel_url=request.cancel_url,
        currency=request.currency,
    )


@app.post("/api/payments/webhook")
async def stripe_webhook(request: Request):
    body = await request.body()
    sig = request.headers.get("stripe-signature", "")
    verified = stripe_service.verify_webhook(body, sig)
    if not verified and stripe_service.webhook_secret:
        raise HTTPException(status_code=400, detail="Invalid signature")
    return {"status": "ok", "verified": verified}


@app.get("/api/payments/balance")
def get_balance():
    return stripe_service.get_balance()


@app.get("/api/payments/status")
def payments_status():
    return {"configured": stripe_service.is_configured()}


# ═══════════════════════════════════════════════════════════════════
# COPYWRITING — DeepSeek
# ═══════════════════════════════════════════════════════════════════


class ProductDescriptionRequest(BaseModel):
    product_name: str
    features: List[str]
    tone: str = "professional"


class AdCopyRequest(BaseModel):
    product_name: str
    target_audience: str
    platform: str = "tiktok"


class SEOContentRequest(BaseModel):
    product_name: str
    keywords: List[str]


@app.post("/api/copy/description")
def generate_description(request: ProductDescriptionRequest):
    return deepseek_service.generate_product_description(
        request.product_name, request.features, request.tone
    )


@app.post("/api/copy/ad")
def generate_ad(request: AdCopyRequest):
    return deepseek_service.generate_ad_copy(
        request.product_name, request.target_audience, request.platform
    )


@app.post("/api/copy/seo")
def generate_seo(request: SEOContentRequest):
    return deepseek_service.generate_seo_content(
        request.product_name, request.keywords
    )


@app.get("/api/copy/status")
def copy_status():
    return {"configured": deepseek_service.is_configured()}


# ═══════════════════════════════════════════════════════════════════
# SOURCING — CJ Dropshipping
# ═══════════════════════════════════════════════════════════════════


@app.get("/api/sourcing/cj/search")
def cj_search(
    keyword: str = Query(...),
    page: int = Query(1),
    page_size: int = Query(20),
):
    return cj_service.search_products(keyword, page, page_size)


@app.get("/api/sourcing/cj/product/{pid}")
def cj_product(pid: str):
    return cj_service.get_product_details(pid)


@app.get("/api/sourcing/cj/shipping")
def cj_shipping(
    pid: str = Query(...),
    country: str = Query("US"),
):
    return cj_service.get_shipping_estimate(pid, country)


@app.get("/api/sourcing/cj/status")
def cj_status():
    return {"configured": cj_service.is_configured()}


# ═══════════════════════════════════════════════════════════════════
# CREATIVES — Creatify (Video) + Flair (Photo)
# ═══════════════════════════════════════════════════════════════════


class VideoFromURLRequest(BaseModel):
    product_url: str
    aspect_ratio: str = "9:16"
    style: str = "modern"


class AvatarVideoRequest(BaseModel):
    script: str
    avatar_id: Optional[str] = None
    aspect_ratio: str = "9:16"


class ProductPhotoRequest(BaseModel):
    image_url: str
    scene_description: str = "clean white studio background, soft lighting"


class BatchPhotoRequest(BaseModel):
    image_urls: List[str]
    scene: str = "lifestyle setting"


@app.post("/api/creatives/video")
def create_video(request: VideoFromURLRequest):
    return creatify_service.create_video_from_url(
        request.product_url, request.aspect_ratio, request.style
    )


@app.post("/api/creatives/avatar-video")
def create_avatar_video(request: AvatarVideoRequest):
    return creatify_service.create_avatar_video(
        request.script, request.avatar_id, request.aspect_ratio
    )


@app.get("/api/creatives/video/{render_id}")
def video_status(render_id: str):
    return creatify_service.get_video_status(render_id)


@app.get("/api/creatives/avatars")
def list_avatars():
    return creatify_service.list_avatars()


@app.post("/api/creatives/photo")
def create_photo(request: ProductPhotoRequest):
    return flair_service.generate_product_photo(
        request.image_url, request.scene_description
    )


@app.post("/api/creatives/photo/batch")
def batch_photos(request: BatchPhotoRequest):
    return flair_service.batch_generate(request.image_urls, request.scene)


@app.post("/api/creatives/photo/remove-bg")
def remove_bg(request: ProductPhotoRequest):
    return flair_service.remove_background(request.image_url)


@app.get("/api/creatives/status")
def creatives_status():
    return {
        "video_configured": creatify_service.is_configured(),
        "photo_configured": flair_service.is_configured(),
    }


# ═══════════════════════════════════════════════════════════════════
# FULFILLMENT — AutoDS
# ═══════════════════════════════════════════════════════════════════


class ImportProductRequest(BaseModel):
    product_url: str


class FulfillOrderRequest(BaseModel):
    order_data: Dict[str, Any]


@app.post("/api/fulfillment/import")
def import_product(request: ImportProductRequest):
    return autods_service.import_product(request.product_url)


@app.post("/api/fulfillment/order")
def fulfill_order(request: FulfillOrderRequest):
    return autods_service.fulfill_order(request.order_data)


@app.get("/api/fulfillment/track/{order_id}")
def track_order(order_id: str):
    return autods_service.get_order_tracking(order_id)


@app.post("/api/fulfillment/sync-inventory")
def sync_inventory(product_ids: List[str]):
    return autods_service.sync_inventory(product_ids)


@app.get("/api/fulfillment/status")
def fulfillment_status():
    return {"configured": autods_service.is_configured()}


# ═══════════════════════════════════════════════════════════════════
# INTEGRATION STATUS — all services at a glance
# ═══════════════════════════════════════════════════════════════════


@app.get("/api/integrations/status")
def integrations_status():
    return {
        "shopify": bool(os.getenv("SHOPIFY_CLIENT_ID")),
        "meta": bool(os.getenv("META_APP_ID")),
        "tiktok": bool(os.getenv("TIKTOK_CLIENT_KEY")),
        "stripe": stripe_service.is_configured(),
        "deepseek": deepseek_service.is_configured(),
        "cj_dropshipping": cj_service.is_configured(),
        "creatify": creatify_service.is_configured(),
        "flair": flair_service.is_configured(),
        "autods": autods_service.is_configured(),
        "triposr_3d": triposr_service.is_configured(),
        "comfyui_influencer": influencer_service.is_configured(),
        "page_builder": page_builder_service.is_configured(),
        "higgsfield": higgsfield_service.is_configured(),
        "mailchimp": mailchimp_service.is_configured(),
        "manus_ai": manus_service.is_configured(),
        "upcart": upcart_service.is_configured(),
    }


# ═══════════════════════════════════════════════════════════════════
# CHATBOT — DeepSeek
# ═══════════════════════════════════════════════════════════════════


class ChatMessageRequest(BaseModel):
    message: str
    history: Optional[List[Dict[str, str]]] = None


@app.post("/api/chat")
def chat_with_bot(request: ChatMessageRequest):
    return chatbot_service.chat(request.message, request.history)


# ═══════════════════════════════════════════════════════════════════
# 3D MODELS — TripoSR
# ═══════════════════════════════════════════════════════════════════


class Generate3DModelRequest(BaseModel):
    image_url: str
    output_format: str = "glb"


class TextTo3DRequest(BaseModel):
    prompt: str
    output_format: str = "glb"


@app.post("/api/3d/generate")
def generate_3d(request: Generate3DModelRequest):
    return triposr_service.generate_3d_model(request.image_url, request.output_format)


@app.post("/api/3d/text")
def text_to_3d(request: TextTo3DRequest):
    return triposr_service.text_to_3d(request.prompt, request.output_format)


@app.get("/api/3d/status/{task_id}")
def model_status(task_id: str):
    return triposr_service.get_model_status(task_id)


@app.get("/api/3d/status")
def threeDStatus():
    return {"configured": triposr_service.is_configured()}


# ═══════════════════════════════════════════════════════════════════
# AI INFLUENCER — ComfyUI
# ═══════════════════════════════════════════════════════════════════


class InfluencerPhotoRequest(BaseModel):
    product_image_url: str
    prompt: str = "beautiful young woman model holding the product, professional studio photo, Instagram style"
    style: str = "realistic"


class InfluencerVideoRequest(BaseModel):
    product_image_url: str
    script: str = "Hey guys! Check out this amazing product!"
    avatar_style: str = "casual_female"
    duration_seconds: int = 15


class UGCContentRequest(BaseModel):
    product_name: str
    product_image_url: str
    platform: str = "tiktok"
    count: int = 3


@app.post("/api/influencer/photo")
def influencer_photo(request: InfluencerPhotoRequest):
    return influencer_service.generate_influencer_photo(
        request.product_image_url, request.prompt, request.style
    )


@app.post("/api/influencer/video")
def influencer_video(request: InfluencerVideoRequest):
    return influencer_service.generate_influencer_video(
        request.product_image_url, request.script,
        request.avatar_style, request.duration_seconds
    )


@app.post("/api/influencer/ugc")
def influencer_ugc(request: UGCContentRequest):
    return influencer_service.generate_ugc_content(
        request.product_name, request.product_image_url,
        request.platform, request.count
    )


@app.get("/api/influencer/status/{prompt_id}")
def influencer_gen_status(prompt_id: str):
    return influencer_service.get_generation_status(prompt_id)


@app.get("/api/influencer/status")
def influencerStatus():
    return {"configured": influencer_service.is_configured()}


# ═══════════════════════════════════════════════════════════════════
# PAGE BUILDER — PagePilot-style
# ═══════════════════════════════════════════════════════════════════


class BuildPageRequest(BaseModel):
    product_name: str
    product_image_url: str
    price: float
    compare_price: Optional[float] = None
    features: Optional[List[str]] = None
    template_style: str = "modern_minimal"


class BuildLandingRequest(BaseModel):
    product_name: str
    product_image_url: str
    price: float
    offer_headline: str = "Exclusive Deal"


@app.post("/api/store/build-page")
def build_product_page(request: BuildPageRequest):
    return page_builder_service.generate_product_page(
        request.product_name, request.product_image_url,
        request.price, request.compare_price,
        request.features, request.template_style
    )


@app.post("/api/store/build-landing")
def build_landing_page(request: BuildLandingRequest):
    return page_builder_service.generate_landing_page(
        request.product_name, request.product_image_url,
        request.price, request.offer_headline
    )


# ═══════════════════════════════════════════════════════════════════
# ANIMATIONS — Higgsfield
# ═══════════════════════════════════════════════════════════════════


class ProductAnimationRequest(BaseModel):
    image_url: str
    motion_type: str = "orbit"
    camera_effect: str = "dolly_zoom"
    duration_seconds: int = 5
    aspect_ratio: str = "9:16"


class HeroVideoRequest(BaseModel):
    product_images: List[str]
    style: str = "modern_cinematic"


class TextAnimationRequest(BaseModel):
    prompt: str
    aspect_ratio: str = "16:9"
    duration_seconds: int = 6


@app.post("/api/animations/product")
def animate_product(request: ProductAnimationRequest):
    return higgsfield_service.generate_product_animation(
        request.image_url, request.motion_type,
        request.camera_effect, request.duration_seconds, request.aspect_ratio
    )


@app.post("/api/animations/hero")
def hero_video(request: HeroVideoRequest):
    return higgsfield_service.generate_hero_video(
        request.product_images, request.style
    )


@app.post("/api/animations/text")
def text_animation(request: TextAnimationRequest):
    return higgsfield_service.text_to_animation(
        request.prompt, request.aspect_ratio, request.duration_seconds
    )


@app.get("/api/animations/status/{generation_id}")
def animation_status(generation_id: str):
    return higgsfield_service.get_video_status(generation_id)


@app.get("/api/animations/camera-effects")
def camera_effects():
    return {"effects": higgsfield_service.available_camera_effects()}


@app.get("/api/animations/status")
def animationsStatus():
    return {"configured": higgsfield_service.is_configured()}


# ═══════════════════════════════════════════════════════════════════
# EMAIL MARKETING — Mailchimp
# ═══════════════════════════════════════════════════════════════════


class CreateAudienceRequest(BaseModel):
    name: str
    from_email: str
    from_name: str


class AddSubscriberRequest(BaseModel):
    audience_id: str
    email: str
    first_name: str = ""
    tags: Optional[List[str]] = None


class CreateEmailCampaignRequest(BaseModel):
    audience_id: str
    subject: str
    html_content: str
    from_name: str = "Store"


class EmailFlowRequest(BaseModel):
    flow_type: str
    store_name: str = "My Store"
    store_url: str = "https://mystore.com"


@app.post("/api/email/audience")
def create_audience(request: CreateAudienceRequest):
    return mailchimp_service.create_audience(
        request.name, request.from_email, request.from_name
    )


@app.post("/api/email/subscriber")
def add_subscriber(request: AddSubscriberRequest):
    return mailchimp_service.add_subscriber(
        request.audience_id, request.email,
        request.first_name, request.tags
    )


@app.post("/api/email/campaign")
def create_email_campaign(request: CreateEmailCampaignRequest):
    return mailchimp_service.create_campaign(
        request.audience_id, request.subject,
        request.html_content, request.from_name
    )


@app.post("/api/email/campaign/{campaign_id}/send")
def send_email_campaign(campaign_id: str):
    return mailchimp_service.send_campaign(campaign_id)


@app.post("/api/email/flow")
def create_email_flow(request: EmailFlowRequest):
    return mailchimp_service.create_email_flow(
        request.flow_type, request.store_name, request.store_url
    )


@app.get("/api/email/flows")
def list_email_flows():
    return {"flows": mailchimp_service.get_available_flows()}


@app.get("/api/email/status")
def emailStatus():
    return {"configured": mailchimp_service.is_configured()}


# ═══════════════════════════════════════════════════════════════════
# CAMPAIGN AI AGENT — Manus
# ═══════════════════════════════════════════════════════════════════


class ManusTaskRequest(BaseModel):
    description: str
    attachments: Optional[List[str]] = None


class CampaignAnalysisRequest(BaseModel):
    campaign_data: Dict[str, Any]


class CampaignOptimizeRequest(BaseModel):
    campaign_id: str
    goals: Dict[str, Any]


class AudienceResearchRequest(BaseModel):
    product_name: str
    niche: str
    target_market: str = "US"


class CampaignReportRequest(BaseModel):
    campaign_data: List[Dict[str, Any]]
    period: str = "weekly"


@app.post("/api/agent/task")
def create_agent_task(request: ManusTaskRequest):
    return manus_service.create_task(request.description, request.attachments)


@app.get("/api/agent/task/{task_id}")
def get_agent_task(task_id: str):
    return manus_service.get_task_status(task_id)


@app.post("/api/agent/analyze")
def analyze_campaign_ai(request: CampaignAnalysisRequest):
    return manus_service.analyze_campaign(request.campaign_data)


@app.post("/api/agent/optimize")
def optimize_campaign_ai(request: CampaignOptimizeRequest):
    return manus_service.optimize_campaign(request.campaign_id, request.goals)


@app.post("/api/agent/research-audience")
def research_audience(request: AudienceResearchRequest):
    return manus_service.research_audience(
        request.product_name, request.niche, request.target_market
    )


@app.post("/api/agent/report")
def generate_campaign_report(request: CampaignReportRequest):
    return manus_service.generate_report(request.campaign_data, request.period)


@app.get("/api/agent/status")
def agentStatus():
    return {"configured": manus_service.is_configured()}


# ═══════════════════════════════════════════════════════════════════
# UPSELLS — UpCart Config Generator
# ═══════════════════════════════════════════════════════════════════


class UpsellConfigRequest(BaseModel):
    product_catalog: List[Dict[str, Any]]


class CartRewardsRequest(BaseModel):
    aov_target: float = 50.0
    free_shipping_threshold: Optional[float] = None


class BundleOffersRequest(BaseModel):
    products: List[Dict[str, Any]]
    discount_percent: int = 20


@app.post("/api/upsells/config")
def generate_upsell_config(request: UpsellConfigRequest):
    return upcart_service.generate_upsell_config(request.product_catalog)


@app.post("/api/upsells/cart-rewards")
def generate_cart_rewards(request: CartRewardsRequest):
    return upcart_service.generate_cart_rewards(
        request.aov_target, request.free_shipping_threshold
    )


@app.post("/api/upsells/bundles")
def generate_bundles(request: BundleOffersRequest):
    return upcart_service.generate_bundle_offers(
        request.products, request.discount_percent
    )


# ═══════════════════════════════════════════════════════════════════
# AUTOPILOT — Full 13-Step Dropshipping Pipeline
# ═══════════════════════════════════════════════════════════════════


class AutopilotRequest(BaseModel):
    user_id: str = "system"
    org_id: Optional[str] = None
    niche: str
    store_name: str = "My Store"
    store_url: str = "https://mystore.com"
    budget: float = 50.0
    target_market: str = "US"


@app.post("/api/autopilot/launch")
def autopilot_launch(request: AutopilotRequest):
    """Full 13-step automated dropshipping pipeline."""
    _ensure_org_access(request.org_id, request.user_id, "marketer")
    controls = ops_control_store.get(request.org_id)
    if not bool(controls.get("autopilot_launch_enabled", True)):
        raise HTTPException(status_code=423, detail="Autopilot launch is disabled by ops controls")
    pipeline_steps = []

    # Step 1: Find winning products
    products = find_winning_products(request.niche)
    product = products[0] if products else {"name": f"{request.niche} Product", "price": 19.99}
    pipeline_steps.append({"step": 1, "name": "find_product", "status": "done", "product": product})

    product_name = product.get("name", request.niche)
    product_price = float(product.get("price", 19.99))
    product_image = product.get("image", "https://via.placeholder.com/400")

    # Step 2: Generate copy
    copy = deepseek_service.generate_product_description(
        product_name, ["premium quality", "fast shipping", "best seller"], "persuasive"
    )
    pipeline_steps.append({"step": 2, "name": "generate_copy", "status": "done", "copy": copy})

    # Step 3: Generate product photos
    photos = flair_service.generate_product_photo(product_image)
    pipeline_steps.append({"step": 3, "name": "generate_photos", "status": "done", "photos": photos})

    # Step 4: Generate 3D model
    model_3d = triposr_service.generate_3d_model(product_image)
    pipeline_steps.append({"step": 4, "name": "generate_3d", "status": "done", "model": model_3d})

    # Step 5: Build product page
    page = page_builder_service.generate_product_page(
        product_name, product_image, product_price
    )
    pipeline_steps.append({"step": 5, "name": "build_page", "status": "done", "page_sections": page.get("sections_count", 0)})

    # Step 6: Create animations
    animation = higgsfield_service.generate_product_animation(product_image)
    pipeline_steps.append({"step": 6, "name": "create_animations", "status": "done", "animation": animation})

    # Step 7: Publish to Shopify
    pipeline_steps.append({"step": 7, "name": "publish_store", "status": "ready",
        "note": "Use POST /api/publish with Shopify tokens"})

    # Step 8: Generate AI influencer content
    influencer = influencer_service.generate_influencer_photo(product_image)
    ugc = influencer_service.generate_ugc_content(product_name, product_image, "tiktok", 3)
    pipeline_steps.append({"step": 8, "name": "ai_influencer", "status": "done",
        "photo": influencer, "ugc_count": len(ugc)})

    # Step 9: Create video ads
    video_ad = creatify_service.create_video_from_url(request.store_url)
    pipeline_steps.append({"step": 9, "name": "video_ads", "status": "done", "video": video_ad})

    # Step 10: Campaign planning
    audience = manus_service.research_audience(product_name, request.niche, request.target_market)
    pipeline_steps.append({"step": 10, "name": "campaign_planning", "status": "done", "audience": audience})

    # Step 11: Email setup
    welcome_flow = mailchimp_service.create_email_flow("welcome", request.store_name, request.store_url)
    cart_flow = mailchimp_service.create_email_flow("abandoned_cart", request.store_name, request.store_url)
    pipeline_steps.append({"step": 11, "name": "email_setup", "status": "done",
        "flows": ["welcome", "abandoned_cart"]})

    # Step 12: Generate upsell config
    upsell_config = upcart_service.generate_cart_rewards(product_price * 2)
    pipeline_steps.append({"step": 12, "name": "upsell_setup", "status": "done", "config": upsell_config})

    # Step 13: Ad copy for campaigns
    ad_copy = deepseek_service.generate_ad_copy(product_name, "young adults 18-35", "tiktok")
    pipeline_steps.append({"step": 13, "name": "ad_copy", "status": "done", "ad": ad_copy})

    return {
        "status": "pipeline_complete",
        "niche": request.niche,
        "product": product_name,
        "steps_completed": len(pipeline_steps),
        "steps": pipeline_steps,
        "next_actions": [
            "Connect Shopify store via /api/oauth/shopify/connect",
            "Add API keys for live services in .env",
            "Launch campaigns via /api/campaigns/create",
            "Install UpCart from Shopify App Store and paste upsell config",
        ],
    }

# Conversion Craft Feature Matrix

Updated: 2026-03-25

Status legend:

- `live`: implemented with persisted/business logic and active code path.
- `mock-capable`: real provider path exists, but service falls back to mock output when env/provider is missing.
- `scaffold`: intentionally partial/simulated behavior (not fully production-executed end-to-end).

## Web Route Matrix

| Route | Page | Phase | Status | Backend dependency |
|---|---|---|---|---|
| `/` | Marketing + product narrative homepage | Phase 1 | `live` | None (frontend-only) |
| `/login` | Email/password auth + org session bootstrap | Phase 8 | `live` | `/api/auth/register`, `/api/auth/login`, `/api/auth/session`, `/api/auth/switch-org`, `/api/auth/logout` |
| `/os` | Growth OS guided workflow (connect -> intel -> product -> offer -> creative -> launch) | Phase 1-5 | `live` | Uses `phase1Service` + worker APIs |
| `/finder` | Product/Supplier finder UI | Phase 1-3 | `live` | `/api/analyze` + sourcing wrappers |
| `/onboarding` | Enterprise onboarding wizard with persisted state/versioning | Phase 6.1 | `live` | `/api/onboarding/*`, `/api/onboarding/state/*` |
| `/studio` | Creative Automation Studio pipeline board | Phase 6.2 | `live` | `/api/studio/state/*` |
| `/dashboard` | Revenue ops dashboard, analytics, SLA, anomaly, routing/escalation controls | Phase 6.3-7.3 | `live` | `/api/dashboard/realtime/*`, `/api/analytics/*`, `/api/alerts/*`, `/api/sla/*`, `/api/ops/controls` |
| `/oauth/callback` | OAuth callback handoff screen | Phase 2 | `live` | `/api/oauth/{platform}/callback` |

## Worker Endpoint Matrix

| Method | Endpoint | Module | Status | Notes |
|---|---|---|---|---|
| `GET` | `/health` | Core | `live` | Implemented in worker main + service layer |
| `GET` | `/api/status/routes` | Auth + Session | `live` | Single endpoint route/status/auth map for all worker API routes |
| `POST` | `/api/auth/register` | Auth + Session | `live` | Email/password registration + org bootstrap + session issuance |
| `POST` | `/api/auth/login` | Auth + Session | `live` | Email/password login + org membership selection + session issuance |
| `GET` | `/api/auth/session` | Auth + Session | `live` | Validates bearer token and returns resolved user/org/role context |
| `POST` | `/api/auth/switch-org` | Auth + Session | `live` | Rotates session token to selected org membership |
| `POST` | `/api/auth/logout` | Auth + Session | `live` | Revokes active bearer session |
| `GET` | `/api/onboarding/{user_id}` | State + Onboarding | `live` | Implemented in worker main + service layer |
| `GET` | `/api/onboarding/state/{user_id}` | State + Onboarding | `live` | Implemented in worker main + service layer |
| `POST` | `/api/onboarding/state/upsert` | State + Onboarding | `live` | Implemented in worker main + service layer |
| `GET` | `/api/studio/state/{user_id}` | State + Onboarding | `live` | Implemented in worker main + service layer |
| `POST` | `/api/studio/state/upsert` | State + Onboarding | `live` | Implemented in worker main + service layer |
| `GET` | `/api/state/export/{org_id}` | State + Onboarding | `live` | Implemented in worker main + service layer |
| `POST` | `/api/state/backup/{org_id}` | State + Onboarding | `live` | Backup/export endpoints with checksum + immutable audit export |
| `POST` | `/api/state/audit-export/{org_id}` | State + Onboarding | `live` | Backup/export endpoints with checksum + immutable audit export |
| `GET` | `/api/analytics/preferences/{org_id}` | Analytics + Alerts | `live` | Implemented in worker main + service layer |
| `POST` | `/api/analytics/preferences/{org_id}` | Analytics + Alerts | `live` | Implemented in worker main + service layer |
| `GET` | `/api/alerts/routing/{org_id}` | Analytics + Alerts | `live` | Implemented in worker main + service layer |
| `POST` | `/api/alerts/routing/{org_id}` | Analytics + Alerts | `live` | Implemented in worker main + service layer |
| `GET` | `/api/alerts/escalation/{org_id}` | Analytics + Alerts | `live` | Strict schema validation with line-level JSON error hints |
| `POST` | `/api/alerts/escalation/{org_id}` | Analytics + Alerts | `live` | Strict schema validation with line-level JSON error hints |
| `GET` | `/api/alerts/oncall/{org_id}/current` | Analytics + Alerts | `live` | Implemented in worker main + service layer |
| `GET` | `/api/alerts/events/{org_id}` | Analytics + Alerts | `live` | Implemented in worker main + service layer |
| `POST` | `/api/alerts/events/{org_id}/{event_id}/ack` | Analytics + Alerts | `live` | Implemented in worker main + service layer |
| `GET` | `/api/sla/metrics/{org_id}` | Analytics + Alerts | `live` | Implemented in worker main + service layer |
| `GET` | `/api/analytics/anomalies/{org_id}` | Analytics + Alerts | `live` | Implemented in worker main + service layer |
| `GET` | `/api/analytics/org-compare` | Analytics + Alerts | `live` | Implemented in worker main + service layer |
| `POST` | `/api/alerts/dispatch/{org_id}` | Analytics + Alerts | `scaffold` | Simulated delivery engine with retries/failover and receipts |
| `GET` | `/api/ops/controls` | Analytics + Alerts | `live` | Ops kill-switches for optimizer/copilot/autopilot + action caps |
| `POST` | `/api/ops/controls` | Analytics + Alerts | `live` | Ops kill-switches for optimizer/copilot/autopilot + action caps |
| `POST` | `/api/analyze` | Other | `live` | Implemented in worker main + service layer |
| `POST` | `/api/generate-copy` | Other | `mock-capable` | Implemented in worker main + service layer |
| `POST` | `/api/generate-3d` | Other | `mock-capable` | Implemented in worker main + service layer |
| `POST` | `/api/generate-storyboard` | Other | `mock-capable` | Implemented in worker main + service layer |
| `POST` | `/api/render-scene` | Other | `mock-capable` | Implemented in worker main + service layer |
| `POST` | `/api/publish` | Other | `scaffold` | Shopify publish works; 3D media upload still TODO; dev mock fallback |
| `POST` | `/api/oauth/{platform}/connect` | OAuth + Campaign Ops | `live` | Idempotency + state/nonce + audit logs |
| `POST` | `/api/oauth/{platform}/callback` | OAuth + Campaign Ops | `live` | Idempotency + state/nonce + audit logs |
| `GET` | `/api/tokens/{user_id}/status` | OAuth + Campaign Ops | `live` | Implemented in worker main + service layer |
| `GET` | `/api/audit/logs` | OAuth + Campaign Ops | `live` | Implemented in worker main + service layer |
| `GET` | `/api/audit/export` | OAuth + Campaign Ops | `live` | Implemented in worker main + service layer |
| `GET` | `/api/dlq/recent` | OAuth + Campaign Ops | `live` | Implemented in worker main + service layer |
| `POST` | `/api/campaigns/create` | OAuth + Campaign Ops | `live` | Creates real Meta/TikTok campaigns when tokens/accounts available |
| `POST` | `/api/tokens/rotate/run` | OAuth + Campaign Ops | `live` | Implemented in worker main + service layer |
| `POST` | `/api/campaigns/metrics/upsert` | OAuth + Campaign Ops | `live` | Implemented in worker main + service layer |
| `POST` | `/api/campaigns/optimizer/run` | OAuth + Campaign Ops | `live` | Implemented in worker main + service layer |
| `POST` | `/api/campaigns/optimizer/execute` | OAuth + Campaign Ops | `live` | Executes pause/scale on platform APIs with safety caps |
| `POST` | `/api/copilot/execute` | OAuth + Campaign Ops | `live` | Implemented in worker main + service layer |
| `POST` | `/api/campaigns/optimizer/run-weekly` | OAuth + Campaign Ops | `live` | Implemented in worker main + service layer |
| `GET` | `/api/campaigns/optimizer/latest/{user_id}` | OAuth + Campaign Ops | `live` | Implemented in worker main + service layer |
| `POST` | `/api/sourcing/find` | Growth Intelligence | `live` | Implemented in worker main + service layer |
| `POST` | `/api/orgs/create` | Growth Intelligence | `live` | Implemented in worker main + service layer |
| `POST` | `/api/orgs/{org_id}/members/upsert` | Growth Intelligence | `live` | Implemented in worker main + service layer |
| `GET` | `/api/orgs/{org_id}/members` | Growth Intelligence | `live` | Implemented in worker main + service layer |
| `POST` | `/api/attribution/events` | Growth Intelligence | `live` | Implemented in worker main + service layer |
| `GET` | `/api/attribution/summary/{user_id}` | Growth Intelligence | `live` | Implemented in worker main + service layer |
| `POST` | `/api/offers/recommend` | Growth Intelligence | `live` | Implemented in worker main + service layer |
| `POST` | `/api/offers/catalog/upsert` | Growth Intelligence | `live` | Implemented in worker main + service layer |
| `GET` | `/api/offers/catalog/{user_id}` | Growth Intelligence | `live` | Implemented in worker main + service layer |
| `POST` | `/api/offers/recommend-v2` | Growth Intelligence | `live` | Implemented in worker main + service layer |
| `GET` | `/api/dashboard/realtime/{user_id}` | Growth Intelligence | `live` | Implemented in worker main + service layer |
| `GET` | `/api/analytics/enterprise/{org_id}` | Analytics + Alerts | `live` | Implemented in worker main + service layer |
| `POST` | `/api/marketing/micro-influencer-plan` | Growth Intelligence | `live` | Implemented in worker main + service layer |
| `POST` | `/api/store/trust-checklist` | Growth Intelligence | `live` | Implemented in worker main + service layer |
| `POST` | `/api/experiments/create` | Experimentation | `live` | Implemented in worker main + service layer |
| `POST` | `/api/experiments/{experiment_id}/metrics/upsert` | Experimentation | `live` | Implemented in worker main + service layer |
| `POST` | `/api/experiments/{experiment_id}/evaluate` | Experimentation | `live` | Implemented in worker main + service layer |
| `GET` | `/api/experiments/{user_id}` | Experimentation | `live` | Implemented in worker main + service layer |
| `GET` | `/api/experiments/{experiment_id}/assign` | Experimentation | `live` | Implemented in worker main + service layer |
| `POST` | `/api/experiments/events` | Experimentation | `live` | Implemented in worker main + service layer |
| `POST` | `/api/experiments/auto-promote/run` | Experimentation | `live` | Implemented in worker main + service layer |
| `POST` | `/api/webhooks/{platform}` | Webhooks | `live` | Signed verification + event idempotency + attribution/experiment ingest |
| `GET` | `/api/webhooks/meta` | Webhooks | `live` | Signed verification + event idempotency + attribution/experiment ingest |
| `POST` | `/api/payments/checkout` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `POST` | `/api/payments/webhook` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `GET` | `/api/payments/balance` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `GET` | `/api/payments/status` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `POST` | `/api/copy/description` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `POST` | `/api/copy/ad` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `POST` | `/api/copy/seo` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `GET` | `/api/copy/status` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `GET` | `/api/sourcing/cj/search` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `GET` | `/api/sourcing/cj/product/{pid}` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `GET` | `/api/sourcing/cj/shipping` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `GET` | `/api/sourcing/cj/status` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `POST` | `/api/creatives/video` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `POST` | `/api/creatives/avatar-video` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `GET` | `/api/creatives/video/{render_id}` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `GET` | `/api/creatives/avatars` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `POST` | `/api/creatives/photo` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `POST` | `/api/creatives/photo/batch` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `POST` | `/api/creatives/photo/remove-bg` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `GET` | `/api/creatives/status` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `POST` | `/api/fulfillment/import` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `POST` | `/api/fulfillment/order` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `GET` | `/api/fulfillment/track/{order_id}` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `POST` | `/api/fulfillment/sync-inventory` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `GET` | `/api/fulfillment/status` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `GET` | `/api/integrations/status` | Integrations + AI Services | `live` | Implemented in worker main + service layer |
| `POST` | `/api/chat` | Integrations + AI Services | `live` | Implemented in worker main + service layer |
| `POST` | `/api/3d/generate` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `POST` | `/api/3d/text` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `GET` | `/api/3d/status/{task_id}` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `GET` | `/api/3d/status` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `POST` | `/api/influencer/photo` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `POST` | `/api/influencer/video` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `POST` | `/api/influencer/ugc` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `GET` | `/api/influencer/status/{prompt_id}` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `GET` | `/api/influencer/status` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `POST` | `/api/store/build-page` | Integrations + AI Services | `mock-capable` | Implemented in worker main + service layer |
| `POST` | `/api/store/build-landing` | Integrations + AI Services | `mock-capable` | Implemented in worker main + service layer |
| `POST` | `/api/animations/product` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `POST` | `/api/animations/hero` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `POST` | `/api/animations/text` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `GET` | `/api/animations/status/{generation_id}` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `GET` | `/api/animations/camera-effects` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `GET` | `/api/animations/status` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `POST` | `/api/email/audience` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `POST` | `/api/email/subscriber` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `POST` | `/api/email/campaign` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `POST` | `/api/email/campaign/{campaign_id}/send` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `POST` | `/api/email/flow` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `GET` | `/api/email/flows` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `GET` | `/api/email/status` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `POST` | `/api/agent/task` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `GET` | `/api/agent/task/{task_id}` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `POST` | `/api/agent/analyze` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `POST` | `/api/agent/optimize` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `POST` | `/api/agent/research-audience` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `POST` | `/api/agent/report` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `GET` | `/api/agent/status` | Integrations + AI Services | `mock-capable` | Returns real provider output when configured; mock fallback in local/dev |
| `POST` | `/api/upsells/config` | Integrations + AI Services | `mock-capable` | Implemented in worker main + service layer |
| `POST` | `/api/upsells/cart-rewards` | Integrations + AI Services | `mock-capable` | Implemented in worker main + service layer |
| `POST` | `/api/upsells/bundles` | Integrations + AI Services | `mock-capable` | Implemented in worker main + service layer |
| `POST` | `/api/autopilot/launch` | Integrations + AI Services | `scaffold` | 13-step orchestrator, relies on mixed live/mock provider calls |

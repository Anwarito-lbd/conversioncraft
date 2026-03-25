# Conversion Craft

Conversion Craft is a SaaS **Growth OS for ecommerce**.
It combines product intelligence, supplier discovery, page/offer generation, creative automation, paid-media execution, and revenue optimization in one system.

## Product Goal

Build a platform that helps ecommerce brands increase conversion and revenue by combining:

- Competitor intelligence (Pomelli-style analysis)
- Winning product + supplier discovery (dropship intelligence patterns)
- AI offer and landing page generation (PagePilot-style workflows)
- Creative automation for ad concepts, variants, UGC, and scheduling
- Direct execution to ad/social channels (Meta, TikTok, Instagram/Facebook)
- Always-on optimization loops (pause losers, scale winners, rebalance traffic)

Important: virality is not guaranteed. The platform is designed to maximize probability through strong creative, targeting, and iteration.

## What This Repo Contains

This is the **single canonical repository** for Conversion Craft.

```text
conversioncraft/
├── apps/
│   ├── web/                    # Next.js frontend (Growth OS UI)
│   └── worker/                 # FastAPI backend worker/API + automation engine
├── packages/
│   └── db/                     # Shared database schema (Prisma)
├── docs/                       # Merge, bootstrap, and reference documentation
├── scripts/                    # Operational scripts (bootstrap/import)
├── tools/                      # Optional local staging for source/reference clones
├── legacy/                     # Archived legacy assets (non-primary runtime)
├── docker-compose.yml
├── render.yaml
└── vercel.json
```

## Current Feature Scope

### 1) Channel + Auth Layer

- OAuth/connect scaffolding for Shopify, Meta, TikTok
- Token storage, rotation hooks, audit logging
- Webhook verification and idempotency guards

### 2) Intelligence Layer

- Competitor website analysis pipeline
- Product scoring and winner detection
- Supplier finding and offer feasibility checks

### 3) Conversion Layer

- Offer Engine (bundle, upsell, pricing strategy)
- Product page generation pipeline
- Experimentation engine (variant tests + winner promotion)

### 4) Creative Ops Layer

- Creative Studio pipeline board: concept -> variants -> schedule -> post
- Workflow-ready architecture for Comfy-style automation and UGC generation
- Scheduling and posting state machine

### 5) Revenue Ops Layer

- Campaign state sync + dashboard KPIs
- Optimizer loop with guardrails
- SLA timers (MTTA/MTTR), alert routing, escalation policies, receipts
- Org/team analytics and anomaly detection tracks

## Phase-by-Phase Architecture

| Phase | Frontend surface | Worker/API surface | Persistence |
|---|---|---|---|
| 1 | `/`, `/os`, `/finder` | `/api/analyze`, creative/gen endpoints, sourcing pipeline | JSON stores + in-memory flow state |
| 2 | OAuth onboarding flow in `/os` and `/oauth/callback` | `/api/oauth/*`, `/api/tokens/*`, `/api/campaigns/create` | token store + idempotency + audit logs |
| 3 | Offer/page generation workflow | `/api/offers/*`, `/api/store/build-*`, `/api/sourcing/*` | sku catalog + offer/attribution stores |
| 4 | Launch + optimizer actions | `/api/campaigns/optimizer/*`, `/api/dashboard/realtime/*` | campaign store + optimizer run history |
| 5 | Experiment controls | `/api/experiments/*`, webhook event ingest | experiment store + event metrics |
| 6 | `/onboarding`, `/studio`, copilot UI in `/dashboard` | `/api/onboarding/state/*`, `/api/studio/state/*`, `/api/copilot/execute` | optimistic concurrency versioned state |
| 7 | Enterprise analytics + routing/escalation panels in `/dashboard` | `/api/analytics/*`, `/api/alerts/*`, `/api/sla/*` | org/team RBAC + alert/sla stores |

## API Contracts by Module (Worker)

### Onboarding + Studio State

- `GET /api/onboarding/state/{user_id}`  
  Query: `org_id?`  
  Response: `{ user_id, org_id, state, version, updated_at }`
- `POST /api/onboarding/state/upsert`  
  Body: `{ user_id, org_id?, expected_version?, state: OnboardingStateModel }`  
  Returns `409` on version conflict with `{ detail: { error: "version_conflict", current_version } }`
- `GET /api/studio/state/{user_id}`, `POST /api/studio/state/upsert` follow the same contract pattern with `StudioStateModel`.

### OAuth + Campaign Execution

- `POST /api/oauth/{platform}/connect`  
  Body: `OAuthConnectRequest` (`user_id`, `redirect_uri`, `scopes?`, `shop?`, `org_id?`)  
  Response: `{ platform, auth_url, state, nonce }`
- `POST /api/oauth/{platform}/callback`  
  Headers: optional `Idempotency-Key`  
  Body: `OAuthCallbackRequest` (`user_id`, `code`, `state`, `nonce?`, `org_id?`)  
  Response: `{ platform, connected, token_data }`
- `POST /api/campaigns/create`  
  Headers: optional `Idempotency-Key`  
  Body: `CampaignCreateRequest`  
  Response: `{ status: success|partial_success|failed, campaigns, errors }`
- `POST /api/campaigns/optimizer/execute`  
  Body: `OptimizerExecuteRequest`  
  Response: `{ status, results, errors, skipped }`

### Offer + Experimentation

- `POST /api/offers/recommend-v2`  
  Body: `OfferRecommendationV2Request` (`user_id`, `product`, `constraints?`, `experiment?`, `org_id?`)  
  Response: product economics + UI contract (`pre_checkout_blocks`, `post_purchase_blocks`) + A/B payload.
- `POST /api/experiments/create` / `POST /api/experiments/events` / `POST /api/experiments/{experiment_id}/evaluate`  
  Bodies: `ExperimentCreateRequest`, `ExperimentEventRequest`, query-driven evaluate route.

### Analytics + Alerting + SLA

- `GET /api/analytics/enterprise/{org_id}`  
  Query: `actor_user_id`, filters (`role_filter`, `user_filter`), SLA controls, forecast horizon.  
  Response: `{ org, drilldowns, sla, forecast, controls }`
- `POST /api/alerts/routing/{org_id}`  
  Body: `AlertRoutingUpsertRequest` with strict `AlertRouteModel`.
- `POST /api/alerts/escalation/{org_id}`  
  Body: `EscalationPolicyUpsertRequest` with strict schema + optional JSON fields: `suppression_windows_json`, `on_call_schedule_json`  
  Validation errors include line-level hints (`line`, `column`, `line_text`, `pointer`).
- `GET /api/sla/metrics/{org_id}`  
  Response: open/resolved counts + MTTA/MTTR + breach list.

### New: Ops Kill-Switch Controls

- `GET /api/ops/controls`  
  Query: `actor_user_id`, optional `org_id`  
  Response: `{ scope, org_id, controls }`
- `POST /api/ops/controls`  
  Body: `OpsControlsUpsertRequest` (`actor_user_id`, `org_id?`, `controls`)  
  `controls` schema:
  - `optimizer_execute_enabled: bool`
  - `copilot_execute_enabled: bool`
  - `autopilot_launch_enabled: bool`
  - `max_optimizer_actions_per_run: int (1..500)`
  - `max_copilot_actions_per_run: int (1..500)`

Execution endpoints now enforce these controls:

- `/api/campaigns/optimizer/execute`
- `/api/copilot/execute`
- `/api/autopilot/launch`

## Skills + Agents in This Workspace

The repo/workspace includes skills and agent-oriented tooling to accelerate delivery:

- `.marketingskills/` for reusable marketing/system instructions
- Codex skills available in this environment include practical tracks for:
  - Cloudflare/Vercel deploy
  - Playwright automation/debugging
  - Figma design-to-code
  - security review/threat modeling
  - Linear project management
  - AI media generation helpers

These are used as execution accelerators; core app logic stays in `apps/web` and `apps/worker`.

## Integrations and External References

Conversion Craft design references include:

- Google Labs Pomelli (competitor intelligence direction)
- nas.io patterns (community/creator monetization motions)
- pagepilot.ai patterns (AI page generation and conversion copy)
- Comfy-workflow style creative automation for ad/UGC production

Operational target channels:

- TikTok Ads
- Meta Ads (Instagram/Facebook)
- Shopify ecosystem

## Repo Cleanup Performed

- Consolidated work into one active repo: `Anwarito-lbd/conversioncraft`
- Removed duplicate repositories from GitHub org/user scope (completed earlier)
- Set this repository visibility to **public**
- Removed exact duplicate legacy component files that were mirrored in active web app paths
- Re-ran duplicate-content scan after cleanup (no duplicate tracked content remains)

## Local Development

### Prerequisites

- Node.js 20+
- Python 3.12+
- npm

### Install

```bash
npm install
cd apps/web && npm install
cd ../worker
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Environment

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/worker/.env.example apps/worker/.env
```

### Run

```bash
# terminal 1
cd apps/worker
source venv/bin/activate
uvicorn main:app --reload --port 8000

# terminal 2
cd apps/web
npm run dev
```

## Key Env Groups (Worker)

- OAuth/Ads: `SHOPIFY_CLIENT_ID`, `SHOPIFY_CLIENT_SECRET`, `META_APP_ID`, `META_APP_SECRET`, `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`
- Webhooks: `SHOPIFY_WEBHOOK_SECRET`, `META_WEBHOOK_SECRET`, `META_WEBHOOK_VERIFY_TOKEN`, `TIKTOK_WEBHOOK_SECRET`
- Billing: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- Core app/API: `DATABASE_URL`, `CORS_ORIGINS`
- Optimizer guardrails: `MAX_BUDGET_INCREASE_PCT_DAILY_META`, `MAX_BUDGET_INCREASE_PCT_DAILY_TIKTOK`, `MIN_ROAS_GUARDRAIL_META`, `MIN_ROAS_GUARDRAIL_TIKTOK`

## Product Roadmap Snapshot

- Phase 1-4: core app, OAuth/campaign base, offer engine, optimizer scheduling
- Phase 5: experimentation + real-time metric ingestion + traffic rebalance
- Phase 6: enterprise onboarding + creative studio + revenue ops copilot
- Phase 7: org analytics, alert routing/escalation, SLA metrics, anomaly handling
- Next: deeper execution automation, attribution hardening, and enterprise controls

## Source of Truth

- Active product code: `apps/web` + `apps/worker`
- Legacy artifacts: `legacy` (reference only unless explicitly revived)
- Operational docs: `docs/`
- Full route/endpoint status matrix: `docs/FEATURE_MATRIX.md`

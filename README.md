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


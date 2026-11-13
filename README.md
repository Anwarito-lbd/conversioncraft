# ConversionCraft

Growth platform for ecommerce stores: it analyzes competitors, generates offers and product pages,
and runs campaigns with an optimizer loop.

**Status:** in development. No public demo yet. <!-- add a live URL here once deployed -->

## Overview

ConversionCraft brings work that usually happens across several tools into one app:

- **Intelligence:** competitor website analysis, product scoring, supplier discovery and feasibility checks
- **Conversion:** offer engine (bundles, upsells, pricing), product-page generation, variant experiments with winner promotion
- **Creative ops:** a pipeline board from concept to variants to schedule to post
- **Revenue ops:** campaign sync, dashboard KPIs, an optimizer with guardrails, alert routing and SLA timers
- **Platform:** email/password auth with bearer sessions, org switching, RBAC on protected routes, webhook verification and idempotency guards, encrypted credential storage

## Demo / Screenshots

<!-- Add 2–4 screenshots of /os, /dashboard and /studio under docs/screenshots/ and link them here. -->
_Screenshots coming soon._

## Architecture

```
apps/web (Next.js)  ──HTTP──►  apps/worker (FastAPI)
  /os, /dashboard,                ├─ auth + org/RBAC
  /onboarding, /studio            ├─ intelligence, offers, experiments
                                  ├─ campaign optimizer + alerts/SLA
                                  └─ OAuth connectors (Shopify, Meta, TikTok)
packages/db (Prisma schema)
```

| Path | Purpose |
|---|---|
| `apps/web` | Next.js frontend |
| `apps/worker` | FastAPI API and automation engine |
| `packages/db` | Shared Prisma schema |
| `docs/` | Bootstrap and reference docs, including the full API contracts |
| `render.yaml`, `vercel.json` | Deploy config (worker on Render, web on Vercel) |

## How it works

1. **Sign in.** A user registers or logs in and gets a bearer session tied to an organization. Every protected `/api/*` route checks the session and the user's role in that org (RBAC).
2. **Connect channels.** OAuth connects Shopify, Meta and TikTok. Tokens are encrypted at rest, rotation hooks are in place, and every action is audit-logged.
3. **Analyze.** The worker analyzes a competitor's site and scores products and suppliers for feasibility.
4. **Build the offer.** The offer engine proposes bundles, upsells and pricing, and generates a product page. Variants can be A/B tested, and the winner is promoted.
5. **Launch and optimize.** Campaigns are created through the connected channels. The optimizer loop pauses losers and scales winners within guardrails. A kill switch and alerts with SLA timers keep a person in control.

Incoming webhooks are signature-verified and idempotent, so a retried event is never processed twice.

## Stack

TypeScript · Next.js · Python · FastAPI · Prisma · Docker Compose · Vercel (web) · Render (worker)

## Local Setup

Prerequisites: Node.js 20+, Python 3.12+, npm.

```bash
npm install
cd apps/web && npm install
cd ../worker
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env   # worker settings; the web app reads its API URL from apps/web/.env.local
```

Run the API and the web app in two terminals:

```bash
# terminal 1
cd apps/worker && source venv/bin/activate
uvicorn main:app --reload --port 8000

# terminal 2
cd apps/web && npm run dev
```

The API's interactive docs are at http://localhost:8000/docs (FastAPI's built-in Swagger UI).

## Documentation

| Doc | What it covers |
|---|---|
| [FEATURE_MATRIX.md](docs/FEATURE_MATRIX.md) | Every feature and its status |
| [README_DETAILED.md](docs/README_DETAILED.md) | Full API contracts by module (auth, onboarding, OAuth, offers, analytics, SLA) |
| [REFERENCE_REPOS.md](docs/REFERENCE_REPOS.md) | Open-source projects used as references |
| [MERGE_STATUS.md](docs/MERGE_STATUS.md) | How earlier repos were merged into this one |

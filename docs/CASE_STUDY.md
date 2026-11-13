# Case Study: Conversion Craft — Building an AI-Native Ecommerce Growth OS

**Author:** Anwar  
**Role:** Solo Full-Stack & AI Systems Engineer  
**Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, FastAPI, Python 3.12, Prisma (PostgreSQL), SQLite + Fernet Encryption, APScheduler

---

## The Problem

Launching and scaling an ecommerce or dropshipping product typically requires stitching together half a dozen disconnected tools: one for product research, another for supplier sourcing, a landing page builder, a copywriting tool, a creative/video generator, and separate ad managers for Meta and TikTok. Even after launch, operators have to manually watch ROAS, pause losing ad sets, scale winners within safe budget caps, and manage alerts when attribution or sync pipelines drift.

I built **Conversion Craft** to unify that entire lifecycle—from niche discovery to automated campaign optimization and revenue ops governance—into a single monorepo platform.

## Architecture & Engineering Decisions

### 1. Decoupled Monorepo: Next.js 16 Control Plane + FastAPI Automation Worker
I split the system into two primary runtimes:
- **`apps/web` (Next.js 16 + React 19 + TypeScript):** Handles the marketing landing page (`/`), workspace authentication (`/login`), the 6-step Growth OS flow (`/os`), Product Finder Pro (`/finder`), Enterprise Onboarding (`/onboarding`), Creative Studio Kanban (`/studio`), and the Revenue Ops & SLA Dashboard (`/dashboard`). It also includes interactive 3D product canvas rendering via Three.js (`@react-three/fiber` / `@react-three/drei`) and charts via `recharts`.
- **`apps/worker` (FastAPI + APScheduler):** Exposes **131 OpenAPI-documented paths** across auth/sessions, OAuth token management, sourcing, offer optimization, A/B experimentation, campaign execution, webhook ingestion, enterprise analytics, SLA tracking, and ops kill-switches.

### 2. Fail-Safe, Mock-Capable Provider Integrations
An ecommerce automation platform touches a lot of external APIs: Shopify, Meta Ads, TikTok Ads, Stripe, CJ Dropshipping, Apify, DeepSeek, Google Gemini, Replicate/TripoSR, Creatify, Flair, Higgsfield, Mailchimp, and Manus. Rather than letting missing API keys crash local development or demos, I designed the worker services so integrations are **mock-capable**: when provider credentials are configured they call the real APIs; when absent in local/dev, they return deterministic mock payloads so every workflow remains testable.

### 3. Security, RBAC, and Encrypted Session/Token Storage
In commit `7b86c8f`, I replaced placeholder auth with a real session and RBAC layer:
- **Middleware enforcement (`inject_session_context`):** Every `/api/*` route (outside explicit public auth/webhook endpoints) requires a valid `Authorization: Bearer <token>` session.
- **Encrypted local store (`secure_store.db`):** `AuthService` and `TokenStore` use SQLite paired with `cryptography.fernet.Fernet` encryption (keyed via `STORE_ENCRYPTION_KEY` or a local key file) to store users, hashed session tokens, and OAuth tokens.
- **Multi-org RBAC:** Users can belong to multiple organizations with roles (`owner`, `admin`, `marketer`, `analyst`, `viewer`) and switch active org context via `/api/auth/switch-org`.

### 4. Guardrails & Ops Kill-Switches
Autonomous ad spend optimization is dangerous without hard limits. I built two layers of protection:
- **Optimizer Executor Guardrails (`OptimizerExecutor`):** Enforces per-platform minimum ROAS thresholds (`MIN_ROAS_GUARDRAIL_META`, `MIN_ROAS_GUARDRAIL_TIKTOK`) and daily budget increase caps (`MAX_BUDGET_INCREASE_PCT_DAILY_*`) before executing scale/pause actions.
- **Ops Kill-Switches (`OpsControlStore`):** Global and per-org runtime switches (`optimizer_execute_enabled`, `copilot_execute_enabled`, `autopilot_launch_enabled`, plus `max_optimizer_actions_per_run` and `max_copilot_actions_per_run`) enforced directly on `/api/campaigns/optimizer/execute`, `/api/copilot/execute`, and `/api/autopilot/launch`.

### 5. Optimistic Concurrency & Strict Validation
For collaborative state (`/onboarding` and `/studio`), state upserts support `expected_version` checks and return `409 version_conflict` on stale writes. For enterprise alert escalation policies, JSON fields (`suppression_windows_json`, `on_call_schedule_json`) return line- and column-level error hints so operators can jump straight to syntax issues in the UI.

## Verification & Honest Gaps

During portfolio verification on this branch:
- **TypeScript (`npx tsc --noEmit`)** passed with **0 errors**.
- **FastAPI Worker** imported cleanly and exported **131 OpenAPI paths** (`docs/openapi.json`).
- **Next.js Dev Server** rendered `/`, `/login`, and `/finder` cleanly (screenshots captured in `docs/screenshots/`).
- **Known Gaps Found:**
  1. **Worker `pytest` suite (`tests/test_health.py`):** `/health` passes (`200`), but the 14 `/api/*` tests currently fail with `401 Unauthorized` because the test suite was written prior to the `7b86c8f` session auth middleware and needs a test fixture that registers/logs in first.
  2. **ESLint (`npm run lint`):** Reports 11 errors (unescaped quotes in two finder components and `no-explicit-any` in `geminiService.ts` / `types/index.ts`) and 12 warnings.
  3. **Next.js Turbopack Build on Windows:** `next build` compiled successfully in `14.3s`, then hit an `ENOENT` on `.next/server/pages-manifest.json` during page data collection due to the monorepo workspace root lockfile detection.
  4. **Local Persistence vs. Prisma:** `packages/db/schema.prisma` defines the target PostgreSQL schema, while the current worker runtime persists state in SQLite (`secure_store.db`) and JSON files under `apps/worker/data/` for zero-dependency local execution.

## Key Takeaways

Consolidating multiple prototype repos into `conversioncraft` taught me the value of strict API contracts (`/api/status/routes` + OpenAPI), fail-safe provider wrappers, and building operational safety (RBAC, kill-switches, optimistic concurrency, DLQ/audit logs) early—even in an AI-first product.

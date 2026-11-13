# Case Study: Building ConversionCraft — An End-to-End Ecommerce Growth OS

**Author:** Anwar  
**Repository:** `Anwarito-lbd/conversioncraft`  
**Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, Three.js (`@react-three/fiber`), FastAPI (`0.5.0`), Prisma (PostgreSQL), SQLite + Fernet Encryption, APScheduler

---

## 1. The Problem

Launching and scaling an ecommerce or dropshipping product typically requires stitching together half a dozen disconnected tools: a product research database, a supplier portal, a copywriter, a 3D/UGC creative pipeline, a landing-page builder, ad-platform dashboards (Meta and TikTok), and spreadsheets to track ROAS and kill losing ad sets.

I built **ConversionCraft** to consolidate that entire lifecycle into one **Growth OS**—moving from niche discovery and supplier sourcing to offer generation, 3D/UGC creative production, campaign execution, and guardrail-enforced revenue operations.

---

## 2. Architecture & Key Engineering Decisions

### Monorepo Split: Next.js 16 Frontend + FastAPI Worker (`apps/web` & `apps/worker`)
I separated the interactive UI (`apps/web`) from the orchestration and integration engine (`apps/worker`):
- **Frontend (`apps/web`)**: Built with Next.js 16 (App Router + Turbopack), React 19, Framer Motion, Recharts, and `@react-three/fiber` / `@react-three/drei` (`ProductCanvas`) for interactive 3D product previews. Protected routes (`/os`, `/onboarding`, `/studio`, `/dashboard`) share a `SessionControls` header for organization switching and logout.
- **Backend Worker (`apps/worker`)**: A FastAPI service (`ConversionCraft Worker API v0.5.0`) exposing **131 OpenAPI paths (135 operations)** alongside an `APScheduler` lifespan loop for background optimization and token rotation.

### Dual Persistence: Prisma PostgreSQL + Encrypted Local `secure_store.db`
- `packages/db/schema.prisma` defines **12 relational models** (`User`, `Organization`, `OrgMember`, `OAuthToken`, `Campaign`, `Experiment`, `AttributionEvent`, `OnboardingState`, `StudioState`, `AuditLog`, `AlertRoute`, `AnalyticsPreferences`).
- For auth sessions, user credentials, and sensitive OAuth token blobs, `AuthService` (`apps/worker/src/services/auth_service.py`) uses a thread-safe SQLite store (`secure_store.db`) encrypted at rest with `cryptography.fernet.Fernet`, automatically migrating legacy JSON stores on startup.

### Optimistic Concurrency & Ops Guardrails
- **Versioned State**: `/api/onboarding/state/upsert` and `/api/studio/state/upsert` enforce `expected_version` checks and return `409` (`version_conflict`) if two tabs or collaborators overwrite each other's state.
- **Safety Kill-Switches**: Because automated ad-budget scaling can burn spend quickly if misconfigured, `/api/ops/controls` exposes per-org and global toggles (`optimizer_execute_enabled`, `copilot_execute_enabled`, `autopilot_launch_enabled`) plus hard action caps (`1..500`), enforced directly in `/api/campaigns/optimizer/execute`, `/api/copilot/execute`, and `/api/autopilot/launch`.
- **Line-Level Policy Validation**: Escalation policies (`/api/alerts/escalation/{org_id}`) validate `suppression_windows_json` and `on_call_schedule_json` and return `line`, `column`, `line_text`, and `pointer` hints so operators can jump straight to syntax errors in the dashboard UI.

### Mock-Capable Integration Adapters
Every external integration (Stripe, DeepSeek, CJ Dropshipping, AutoDS, Creatify, Flair, TripoSR, Higgsfield, Mailchimp, Manus) is wrapped in a dedicated service module under `apps/worker/src/services/` that executes live API calls when credentials are configured and falls back cleanly to deterministic mock responses in local/dev environments.

---

## 3. Verification & Honest Engineering Gaps

When preparing this repository for portfolio review (without private production API keys), I ran the full local verification suite and recorded exact outcomes:

- **TypeScript (`cd apps/web && npx tsc --noEmit`)**: Passed with `0` errors.
- **Next.js Production Build (`cd apps/web && npm run build`)**: Passed in `12.5s`, generating `11/11` static pages across `/`, `/login`, `/finder`, `/os`, `/onboarding`, `/studio`, `/dashboard`, and `/oauth/callback`.
- **Worker Import & OpenAPI Generation**: `from main import app` succeeded cleanly, confirming `131` OpenAPI paths and `135` operations.
- **ESLint (`cd apps/web && npm run lint`)**: Reported `23` problems (`11` errors, `12` warnings)—specifically `react/no-unescaped-entities`, `@typescript-eslint/no-explicit-any`, and unused imports in `apps/web/src/app/finder/components/*`, `apps/web/src/services/geminiService.ts`, and `apps/web/src/types/index.ts`.
- **Worker Pytest (`pytest tests/ -v --tb=short`)**: `1 passed, 14 failed`. `GET /health` returned `200`, while the 14 `/api/*` tests in `apps/worker/tests/test_health.py` returned `401 Unauthorized` because Phase 8 added global Bearer-token middleware (`inject_session_context`) to `/api/*` routes without updating the earlier unauthenticated test client calls.
- **Scaffolds vs. Live Endpoints**: As documented in `docs/FEATURE_MATRIX.md`, `/api/autopilot/launch`, `/api/publish`, and `/api/alerts/dispatch/{org_id}` remain `scaffold` endpoints pending full end-to-end provider orchestration.

---

## 4. Next Steps

1. Update `apps/worker/tests/test_health.py` to register/login a test user and pass `Authorization: Bearer <token>` headers so the full pytest suite passes in CI without `|| true`.
2. Resolve the 11 ESLint errors (`no-explicit-any` and `react/no-unescaped-entities`) in `apps/web/src/app/finder/` and `geminiService.ts`.
3. Migrate `apps/worker/src/agents/copywriter.py` from deprecated `google-generativeai` to `google-genai`.

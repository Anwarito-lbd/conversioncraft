# Case Study: Building ConversionCraft — An End-to-End Ecommerce Growth OS

**Author:** Anwar  
**Repository:** `Anwarito-lbd/conversioncraft`  
**Stack:** Next.js 16 (Turbopack), React 19, TypeScript, Tailwind CSS v4, Three.js (`@react-three/fiber`), `@google/genai`, FastAPI (`0.5.0`), Prisma (PostgreSQL), SQLite + Fernet Encryption, APScheduler

---

## 1. The Problem

Launching and scaling an ecommerce or dropshipping product typically requires stitching together half a dozen disconnected tools: a product research database, a supplier portal, a copywriter, a 3D/UGC creative pipeline, a landing-page builder, ad-platform dashboards (Meta and TikTok), and spreadsheets to track ROAS and kill losing ad sets.

I built **ConversionCraft** to consolidate that entire lifecycle into one **Growth OS**—moving from niche discovery and supplier sourcing to offer generation, 3D/UGC creative production, campaign execution, and guardrail-enforced revenue operations.

---

## 2. Architecture & Key Engineering Decisions

### Monorepo Split: Next.js 16 Frontend + FastAPI Worker (`apps/web` & `apps/worker`)
I separated the interactive UI (`apps/web`) from the orchestration and integration engine (`apps/worker`):
- **Frontend (`apps/web`)**: Built with Next.js 16 (App Router + Turbopack, scoped cleanly via `turbopack.root`), React 19, Framer Motion, Recharts, and `@react-three/fiber` / `@react-three/drei` (`ProductCanvas`) for interactive 3D product previews. Client-side intelligence flows use `@google/genai` (`gemini-3-pro-preview`, `gemini-2.5-flash`, `gemini-2.5-flash-image`, `imagen-4.0-generate-001`, `veo-3.1-fast-generate-preview`). Protected routes (`/os`, `/onboarding`, `/studio`, `/dashboard`) share a `SessionControls` header for organization switching and logout.
- **Backend Worker (`apps/worker`)**: A FastAPI service (`ConversionCraft Worker API v0.5.0`) exposing **131 OpenAPI paths (135 operations)** synced to `docs/openapi.json`, alongside an `APScheduler` lifespan loop for background optimization and token rotation.

### Dual Persistence: Prisma PostgreSQL + Encrypted Local `secure_store.db`
- `packages/db/schema.prisma` defines **12 relational models** (`User`, `Organization`, `OrgMember`, `OAuthToken`, `Campaign`, `Experiment`, `AttributionEvent`, `OnboardingState`, `StudioState`, `AuditLog`, `AlertRoute`, `AnalyticsPreferences`).
- For auth sessions, user credentials, and sensitive OAuth token blobs, `AuthService` (`apps/worker/src/services/auth_service.py`) uses a thread-safe SQLite store (`secure_store.db`) encrypted at rest with `cryptography.fernet.Fernet` and `PBKDF2-SHA256` (210,000 iterations), automatically migrating legacy JSON stores on startup.

### Session Auth Middleware, CORS Preflight & Optimistic Concurrency
- **Bearer Auth & Preflight Handling**: `inject_session_context` in `apps/worker/main.py` enforces Bearer session tokens on `/api/*` (returning `401` when missing/invalid) while explicitly allowing public auth/webhook endpoints and browser `OPTIONS` CORS preflight requests to reach `CORSMiddleware` so cross-origin Next.js client requests succeed cleanly.
- **Versioned State**: `/api/onboarding/state/upsert` and `/api/studio/state/upsert` enforce `expected_version` checks and return `409` (`version_conflict`) if two tabs or collaborators overwrite each other's state.
- **Safety Kill-Switches**: Because automated ad-budget scaling can burn spend quickly if misconfigured, `/api/ops/controls` exposes per-org and global toggles (`optimizer_execute_enabled`, `copilot_execute_enabled`, `autopilot_launch_enabled`) plus hard action caps (`1..500`), enforced directly in `/api/campaigns/optimizer/execute`, `/api/copilot/execute`, and `/api/autopilot/launch`.
- **Line-Level Policy Validation**: Escalation policies (`/api/alerts/escalation/{org_id}`) validate `suppression_windows_json` and `on_call_schedule_json` and return `line`, `column`, `line_text`, and `pointer` hints so operators can jump straight to syntax errors in the dashboard UI.

### Mock-Capable Integration Adapters
Every external integration (Stripe, DeepSeek, CJ Dropshipping, AutoDS, Creatify, Flair, TripoSR, Higgsfield, Mailchimp, Manus) is wrapped in a dedicated service module under `apps/worker/src/services/` that executes live API calls when credentials are configured and falls back cleanly to deterministic mock responses in local/dev environments.

---

## 3. Verification & Quality Hardening

After fixing frontend lint/type hygiene, Next.js Turbopack root configuration, CORS `OPTIONS` preflight handling, and authenticated pytest coverage on branch `docs/portfolio-demo` (without private production API keys):

- **TypeScript (`cd apps/web && npx tsc --noEmit`)**: Passed with `0` errors.
- **ESLint (`cd apps/web && npm run lint`)**: Passed with `0` errors (`3` `@next/next/no-img-element` warnings retained intentionally for arbitrary external supplier image URLs).
- **Next.js Production Build (`cd apps/web && npm run build`)**: Passed cleanly, generating `11/11` static pages across `/`, `/login`, `/finder`, `/os`, `/onboarding`, `/studio`, `/dashboard`, and `/oauth/callback`.
- **Worker Import & OpenAPI Generation**: `from main import app` succeeded cleanly, confirming `131` OpenAPI paths and `135` operations (`docs/openapi.json` synced).
- **Worker Pytest (`pytest tests/ -v --tb=short`)**: **18 passed, 0 failed**, covering `/health`, unauthenticated `401` enforcement, CORS `OPTIONS` preflight, `/api/auth/register` -> `login` -> `session` -> `logout` -> revoked `401` lifecycle, and all 14 authenticated `/api/*` endpoint checks. CI (`.github/workflows/ci.yml`) now enforces `npm run lint` and `pytest` strictly without `|| true`.
- **Live Browser & Video Verification**: Verified `/` (landing), `/login`, `/finder`, `/os`, `/studio`, and `/dashboard` against the running Next.js + FastAPI worker in headless Chromium/Edge across desktop (`1440x900`) and mobile (`390x844`), capturing screenshots and an MP4/WebM/GIF walkthrough in `docs/screenshots/` and `docs/images/`.

---

## 4. Honest Engineering Gaps & Next Steps

1. **Worker Gemini SDK Migration**: `apps/worker/src/agents/copywriter.py` and `director.py` still import the deprecated `google-generativeai` package (`FutureWarning` during import); migrating them to `google-genai` (matching `apps/web`) will clear that warning.
2. **Scaffold Endpoints**: As documented in `docs/FEATURE_MATRIX.md`, `/api/autopilot/launch`, `/api/publish`, and `/api/alerts/dispatch/{org_id}` remain `scaffold` endpoints pending full end-to-end provider orchestration.
3. **Live Provider E2E Tests**: Current tests validate auth/session, CORS, and deterministic mock adapters without external paid API keys; staging E2E smoke tests with sandbox Shopify/Meta/Stripe credentials are the next production step.

# Proof of Work — `docs/portfolio-demo`

This document records the exact engineering changes, post-edit verification runs, and visual evidence produced on branch `docs/portfolio-demo` (PR #2).

---

## 1. Engineering & CI Fixes Completed

1. **Frontend ESLint & Type Hygiene (`apps/web`)**:
   - Eliminated all **11 ESLint errors** and **9 unused-import/unused-variable warnings**:
     - Escaped unescaped JSX quotes in `apps/web/src/app/finder/components/ComparisonModal.tsx` and `WhyItWinsCard.tsx`.
     - Replaced `any` with explicit interfaces (`ComfyUIWorkflow`, `ComfyUIWorkflowNode`, `Supplier[]`, `WinningProduct | Record<string, unknown>`) in `apps/web/src/types/index.ts` and `apps/web/src/services/geminiService.ts`.
     - Removed unused imports across `ComparisonModal.tsx`, `MarketPotentialCard.tsx`, `SignalsCard.tsx`, `src/app/page.tsx`, and `geminiService.ts`.
   - Left 3 `@next/next/no-img-element` warnings on dynamic external supplier image URLs with `onError` fallback handlers.
2. **Next.js 16 Turbopack Build Configuration (`apps/web/next.config.ts`)**:
   - Configured `turbopack: { root: path.resolve(__dirname) }` so Next.js 16 resolves `apps/web` cleanly instead of inferring the monorepo root from multiple lockfiles.
   - Verified clean `.next` removal + `npm run build` completes cleanly with `0` errors across `11/11` static pages.
3. **Auth Middleware CORS Preflight Fix (`apps/worker/main.py`)**:
   - During live browser verification against `/login` -> `/os`, discovered that `inject_session_context` intercepted browser `OPTIONS` CORS preflight requests on Bearer-protected routes (e.g. `OPTIONS /api/auth/session`) with `401 Unauthorized` before `CORSMiddleware` could respond.
   - Updated `inject_session_context` to allow `request.method == "OPTIONS"` through to `CORSMiddleware`, restoring full cross-origin authenticated browser flows (`/os`, `/studio`, `/dashboard`, `/onboarding`).
4. **Authenticated Worker Test Suite & Strict CI (`apps/worker/tests/test_health.py`, `.github/workflows/ci.yml`)**:
   - Rewrote `apps/worker/tests/test_health.py` to test:
     - Public `GET /health` (`200`)
     - Unauthenticated & invalid-token rejection (`401`)
     - `OPTIONS` CORS preflight (`200` + `Access-Control-Allow-Origin`)
     - Full auth lifecycle (`POST /api/auth/register` -> `POST /api/auth/login` -> `GET /api/auth/session` -> `POST /api/auth/logout` -> revoked token `401`)
     - All 14 `/api/*` endpoints using a real registered Bearer session token
   - Removed `|| true` from `.github/workflows/ci.yml` and added `npm run lint` to the frontend CI job.
5. **Public Showcase Hygiene**:
   - Removed `MONEY_KPI.md`, `.claude/`, and `.marketingskills/` from `docs/portfolio-demo` without modifying `main`.

---

## 2. Exact Post-Edit Verification Outputs

| Check | Command | Exit | Exact Result |
|---|---|---|---|
| Frontend TypeScript | `cd apps/web && npx tsc --noEmit` | `0` | `0` errors |
| Frontend ESLint | `cd apps/web && npm run lint` | `0` | `0` errors, `3` warnings (`@next/next/no-img-element`) |
| Frontend Clean Build | `cd apps/web && npm run build` | `0` | Compiled in `10.6s`; `11/11` static pages in `2.7s` |
| Worker App & OpenAPI | `apps/worker\.venv\Scripts\python.exe -c "..."` | `0` | `Import OK`, `ConversionCraft Worker API v0.5.0`, `131` paths, `135` ops, `OpenAPI Synced: True` |
| Worker Pytest | `apps/worker\.venv\Scripts\python.exe -m pytest tests/ -v --tb=short` | `0` | `18 passed, 2 warnings in 6.34s` |

---

## 3. Visual & Walkthrough Artifacts Committed

| Artifact | Purpose | Size |
|---|---|---|
| `docs/images/architecture-pipeline.svg` & `.png` | System architecture & verified pipeline diagram | `11.7 KB` / `692 KB` |
| `docs/images/walkthrough-preview.gif` | Animated walkthrough preview (`/`, `/login` live register, `/os`, `/studio`, `/dashboard`, `/finder`) | `1.11 MB` |
| `docs/images/walkthrough.mp4` | H.264 walkthrough recording (`1280×720`, 8 fps) | `484 KB` |
| `docs/images/walkthrough.webm` | VP9 walkthrough recording (`1280×720`, 8 fps) | `1.03 MB` |
| `docs/screenshots/home.png`, `login.png`, `finder.png` | Desktop (`1440×900`) production renders | `391 KB`, `23.9 KB`, `33.2 KB` |
| `docs/screenshots/os.png`, `dashboard.png` | Authenticated Growth OS & Command Center renders (with live FastAPI worker) | `292 KB`, `118 KB` |
| `docs/screenshots/home-mobile.png`, `login-mobile.png`, `finder-mobile.png` | Mobile (`390×844`) responsive renders | `514 KB`, `57.9 KB`, `78.6 KB` |

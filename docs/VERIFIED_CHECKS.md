# Verified Checks & Observed Outputs

All checks below were executed locally on branch `docs/portfolio-demo` without private production credentials.

## Summary

| Component | Command | Result | Notes |
|---|---|---|---|
| Frontend Typecheck | `npx tsc --noEmit` (`apps/web`) | **PASS** (0 errors) | Strict TypeScript check passed across all `.ts`/`.tsx` files. |
| Frontend Lint | `npm run lint` (`apps/web`) | **FAIL** (11 errors, 12 warnings) | 23 total problems (`react/no-unescaped-entities`, `@typescript-eslint/no-explicit-any`, unused vars, `<img>` warnings). |
| Frontend Build | `npm run build` (`apps/web`) | **PARTIAL / FAIL** | `next build` (Turbopack) compiled in `14.3s`, then failed during page data collection: `ENOENT: no such file or directory, open '...\.next\server\pages-manifest.json'`. |
| Frontend Dev Render | `npx next dev -p 3100` (`apps/web`) | **PASS** | Served HTTP 200; headless Edge captured `/`, `/login`, and `/finder` in `docs/screenshots/`. |
| Worker App Import | `python -c "from main import app; print('Import OK')"` (`apps/worker`) | **PASS** | Printed `Import OK`; `app.openapi()` generated `131` API paths (`docs/openapi.json`). |
| Worker Pytest | `python -m pytest tests/ -v --tb=short` (`apps/worker`) | **1 passed, 14 failed** | `test_health` passed (`200 OK`). All 14 `/api/*` tests returned `401 Unauthorized` because `tests/test_health.py` predates commit `7b86c8f`, which enforced Bearer session auth middleware on `/api/*`. |

---

## Observed Command Details

### 1. Frontend TypeScript Check (`apps/web`)
```text
> npx tsc --noEmit
(exited with code 0, 0 errors)
```

### 2. Frontend ESLint (`apps/web`)
```text
> npm run lint
✖ 23 problems (11 errors, 12 warnings)
```
Affected files:
- `src/app/finder/components/ComparisonModal.tsx`: 4 `react/no-unescaped-entities` errors, 2 unused var warnings, 1 `@next/next/no-img-element` warning
- `src/app/finder/components/WhyItWinsCard.tsx`: 2 `react/no-unescaped-entities` errors
- `src/services/geminiService.ts`: 2 `@typescript-eslint/no-explicit-any` errors, 3 unused var warnings
- `src/types/index.ts`: 3 `@typescript-eslint/no-explicit-any` errors
- `src/app/finder/components/ImageGallery.tsx`, `MarketPotentialCard.tsx`, `ProductRow.tsx`, `SignalsCard.tsx`, `src/app/page.tsx`: warnings only

### 3. Frontend Production Build (`apps/web`)
```text
▲ Next.js 16.0.4 (Turbopack)
✓ Compiled successfully in 14.3s
  Running TypeScript ...
  Collecting page data using 19 workers ...
Error: ENOENT: no such file or directory, open '...\apps\web\.next\server\pages-manifest.json'
```

### 4. Worker OpenAPI Schema & Pytest (`apps/worker`)
```text
Title: ConversionCraft Worker API Version: 0.5.0 Paths: 131
```
```text
tests/test_health.py::test_health PASSED                                 [  6%]
tests/test_health.py::test_integrations_status FAILED (401 == 200)       [ 13%]
...
tests/test_health.py::test_fulfillment_track_mock FAILED (401 == 200)    [100%]
================== 14 failed, 1 passed, 2 warnings in 7.75s ===================
```
Note: In `.github/workflows/ci.yml`, `pytest` is currently configured with `|| true` pending test updates for session authentication.

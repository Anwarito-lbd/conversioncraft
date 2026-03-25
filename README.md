# ConversionCraft Unified Repository

ConversionCraft is a full-stack Growth OS for ecommerce teams: product/supplier discovery, offer/page generation, creative automation, campaign launch, optimizer execution, attribution, experimentation, onboarding, and revenue ops control.

This repository is now the **single working codebase** and includes current production-oriented work across web, worker, legacy UI assets, integrations, and operational tooling.

## Consolidation Status

Source repositories provided:

- `https://github.com/Anwarito-lbd/conversion.craft-.git`
- `https://github.com/Anwarito-lbd/conversioncraft.git`
- `https://github.com/Anwarito-lbd/conversion-craft-.git`
- `https://github.com/Anwarito-lbd/conversion.craft-.git` (duplicate)

Current status:

- `conversion.craft-`: cloned and compared; this repo is already a superset of its useful content.
- `conversioncraft`: blocked by GitHub auth (private/credentialed access required).
- `conversion-craft-`: blocked by GitHub auth (private/credentialed access required).

See:

- `/Users/anwarito/Desktop/conversioncraft5/docs/MERGE_STATUS.md`
- `/Users/anwarito/Desktop/conversioncraft5/docs/BOOTSTRAP_REFERENCES_STATUS.md`
- `/Users/anwarito/Desktop/conversioncraft5/scripts/import_sources.sh`
- `/Users/anwarito/Desktop/conversioncraft5/scripts/bootstrap_reference_repos.sh`

## Monorepo Layout

```text
conversioncraft5/
├── apps/
│   ├── web/                  # Next.js app (Growth OS UI)
│   └── worker/               # FastAPI worker (APIs, orchestration, automation)
├── packages/
│   └── db/                   # Prisma schema
├── legacy/                   # Legacy UI and feature artifacts
├── docs/                     # Consolidation + references + operations docs
├── scripts/                  # Utility scripts (repo import/bootstrap)
├── tools/
│   ├── sources/              # Optional staging folder for source imports
│   ├── references/           # Optional staging folder for reference repo clones
│   └── merge/                # Merge notes/artifacts
└── docker-compose.yml
```

## Product Surface

### Web app pages

- `/` Home / Growth OS shell
- `/finder` Product + supplier discovery
- `/dashboard` Live growth intelligence (campaigns, attribution, experiments, SLA, routing)
- `/onboarding` Enterprise setup wizard (persistent)
- `/studio` Creative automation pipeline board
- `/os` Operational control view
- `/oauth/callback` OAuth callback flow

### Worker capabilities

- OAuth + secure token handling scaffolding (Shopify/Meta/TikTok)
- Campaign creation + metrics ingest + optimizer execution loop
- Offer Engine (upsell/bundle recommendations)
- Experimentation engine (variant metrics, evaluation, winner logic)
- Webhook/event ingest + idempotency + DLQ support
- Alert routing + escalation policy + on-call schedule + delivery receipts
- SLA breach tracking + MTTA/MTTR metrics
- Org/team RBAC + audit logging + state backup/export
- Onboarding and studio persistent state with optimistic concurrency controls

## Phase Coverage

Implemented across current codebase:

- Phase 1: Core app + worker baseline
- Phase 2: OAuth/campaign/api hardening foundations
- Phase 3: Product/supplier/offer pipeline and ops primitives
- Phase 4: Optimizer scheduling + platform safety rails + dashboard sync
- Phase 5: Experimentation + event ingestion + rebalance flow
- Phase 6: Enterprise onboarding + creative studio + revenue ops copilot
- Phase 7: Analytics controls, org comparison, alert routing/escalation, SLA metrics

## Local Development

### Prerequisites

- Node.js 20+
- Python 3.12+
- npm

### Install

```bash
# root
npm install

# web
cd apps/web && npm install

# worker
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
# Option A: root combined dev
npm run dev

# Option B: split terminals
cd apps/worker && source venv/bin/activate && uvicorn main:app --reload --port 8000
cd apps/web && npm run dev
```

## Verification Commands

```bash
# web
npm run build --prefix apps/web -- --webpack

# worker syntax check
python3 -m py_compile apps/worker/main.py

# worker tests
cd apps/worker && source venv/bin/activate && pytest -q
```

## Key Environment Variables

From `/Users/anwarito/Desktop/conversioncraft5/apps/worker/.env.example`:

- Core: `DATABASE_URL`, `CORS_ORIGINS`
- AI: `GOOGLE_API_KEY`, `REPLICATE_API_TOKEN`, `DEEPSEEK_API_KEY`
- OAuth/Ads: `SHOPIFY_CLIENT_ID`, `SHOPIFY_CLIENT_SECRET`, `META_APP_ID`, `META_APP_SECRET`, `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`
- Webhook/auth hardening: `SHOPIFY_WEBHOOK_SECRET`
- Billing: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- External ops: `CJ_API_TOKEN`, `CREATIFY_API_ID`, `CREATIFY_API_KEY`, `FLAIR_API_KEY`, `AUTODS_API_TOKEN`, `APIFY_TOKEN`

From `/Users/anwarito/Desktop/conversioncraft5/apps/web/.env.example`:

- `NEXT_PUBLIC_API_URL`

## Merge + Provenance Artifacts

- `/Users/anwarito/Desktop/conversioncraft5/docs/MERGE_STATUS.md` – source repo merge status and blockers
- `/Users/anwarito/Desktop/conversioncraft5/docs/BOOTSTRAP_REFERENCES_STATUS.md` – verified tool/repo bootstrap status
- `/Users/anwarito/Desktop/conversioncraft5/scripts/import_sources.sh` – pull remaining repos after auth
- `/Users/anwarito/Desktop/conversioncraft5/scripts/bootstrap_reference_repos.sh` – clone/verify full reference stack
- `/Users/anwarito/Desktop/conversioncraft5/tools/references/` – local staging folder (kept clean; repopulate via script when needed)

## Tools and Repos Explained (What They Do + How They Help)

Full index: `/Users/anwarito/Desktop/conversioncraft5/docs/REFERENCE_REPOS.md`  
Live clone/verification status: `/Users/anwarito/Desktop/conversioncraft5/docs/BOOTSTRAP_REFERENCES_STATUS.md`

### Ecommerce / Dropshipping / Sourcing

- `Automated-Dropshipping-Tool`: price/sentiment pattern ideas; useful for product scoring signals.
- `HasData auto-ecommerce-scraper`: scraper design patterns for product intelligence ingestion.
- `scrapfly-scrapers`: anti-blocking scraper examples; improves resilient extraction strategies.
- `ecommercetools`: Python ecommerce utilities; useful for analytics and catalog transforms.
- `MedusaJS`: commerce backend architecture reference (catalog/orders/admin patterns).
- `ali-grabber`: supplier scraping ideas for procurement/sourcing enrichment.
- `TikTok Creative Center` (URL): ad inspiration and format benchmarking source.

### Community / Creator Monetization (Nas.io-style)

- `Pensil`, `Forem`, `Discourse`: community platform patterns for engagement and retention loops.
- `Standard Notes`, `Ghost`: paid subscriptions/content monetization architecture references.
- `n8n`: workflow automation model for internal ops and event-driven orchestration.
- `Chatwoot`: support inbox/CRM patterns for merchant success workflows.
- `LangChain`: LLM tool-routing and chain orchestration reference.

### AI Landing/Page Builder References

- `302_coder_generator`, `aipage.dev`, `Ai-Website-Builder`: programmatic page generation concepts.
- `nextjs-shopify`: storefront + commerce integration patterns in Next.js.
- `Shopify-Product-Generator`: product copy/content generation workflows.
- `Firecrawl`: website extraction pipeline for competitor/product intelligence.

### Agent / Skills / MCP Stack

- `awesome-claude-code-subagents`: subagent strategy catalog for scoped execution.
- `claude-mem`: persistent memory model for cross-session continuity.
- `vercel-labs/skills`, `skills-cli`: reusable skill packaging and invocation patterns.
- `ccpm`, `get-shit-done`, `spec-kit`: planning/execution discipline for large phased delivery.
- `mcp-servers`: production MCP server references for tool extensibility.
- `claude-code-hooks`, `claude-code-best-practice`, `everything-claude-code`, `superpowers`, `claude-ads`: operations playbooks and productivity patterns.

### Developer Toolchain References

- `go-task`: standardized task runner patterns.
- `mise`: runtime/version management strategy.
- `lefthook`: pre-commit/push quality gate pattern.
- `uv`, `ruff`: Python environment + lint/format baseline.
- `biome`, `nx`: JS/TS quality and monorepo orchestration references.
- `supabase-cli`, `stripe-cli`, `googleworkspace-cli`, `CLI-Anything`: platform/infra automation references.
- `playwright-cli`, `notebooklm-py`: browser automation + research pipeline references.
- `setup-uv`, `ruff-action`, `setup-task`, `mise-action`: CI standardization references.

## Deployment Targets

- Frontend: Vercel (`vercel.json`)
- Worker/API: Render (`render.yaml`) or local Uvicorn

## Notes

- This repo keeps backward-compatible legacy assets in `/legacy` while maintaining active work in `/apps/web` and `/apps/worker`.
- Private source repos can be imported once GitHub credentials are fixed (commands in merge docs/scripts).
- Duplicate source staging clones were removed after validation to keep one clean working repo.

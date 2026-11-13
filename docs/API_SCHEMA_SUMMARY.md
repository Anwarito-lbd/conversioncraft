# ConversionCraft Worker API — Verified OpenAPI Summary

- **Title**: ConversionCraft Worker API
- **Version**: 0.5.0
- **Total Paths**: 131
- **Total Operations**: 135

Generated directly from `apps/worker/main.py` via `app.openapi()`.

| Method(s) | Path | Summary |
|---|---|---|
| `POST` | `/api/3d/generate` | Generate 3D |
| `GET` | `/api/3d/status` | Threedstatus |
| `GET` | `/api/3d/status/{task_id}` | Model Status |
| `POST` | `/api/3d/text` | Text To 3D |
| `POST` | `/api/agent/analyze` | Analyze Campaign Ai |
| `POST` | `/api/agent/optimize` | Optimize Campaign Ai |
| `POST` | `/api/agent/report` | Generate Campaign Report |
| `POST` | `/api/agent/research-audience` | Research Audience |
| `GET` | `/api/agent/status` | Agentstatus |
| `POST` | `/api/agent/task` | Create Agent Task |
| `GET` | `/api/agent/task/{task_id}` | Get Agent Task |
| `POST` | `/api/alerts/dispatch/{org_id}` | Dispatch Alerts |
| `GET, POST` | `/api/alerts/escalation/{org_id}` | Get Escalation Policy |
| `GET` | `/api/alerts/events/{org_id}` | List Alert Events |
| `POST` | `/api/alerts/events/{org_id}/{event_id}/ack` | Acknowledge Alert Event |
| `GET` | `/api/alerts/oncall/{org_id}/current` | Current Oncall Target |
| `GET, POST` | `/api/alerts/routing/{org_id}` | Get Alert Routing |
| `GET` | `/api/analytics/anomalies/{org_id}` | Enterprise Kpi Anomalies |
| `GET` | `/api/analytics/enterprise/{org_id}` | Enterprise Analytics |
| `GET` | `/api/analytics/org-compare` | Compare Organizations |
| `GET, POST` | `/api/analytics/preferences/{org_id}` | Get Analytics Preferences |
| `POST` | `/api/analyze` | Analyze |
| `GET` | `/api/animations/camera-effects` | Camera Effects |
| `POST` | `/api/animations/hero` | Hero Video |
| `POST` | `/api/animations/product` | Animate Product |
| `GET` | `/api/animations/status` | Animationsstatus |
| `GET` | `/api/animations/status/{generation_id}` | Animation Status |
| `POST` | `/api/animations/text` | Text Animation |
| `POST` | `/api/attribution/events` | Ingest Attribution Event |
| `GET` | `/api/attribution/summary/{user_id}` | Attribution Summary |
| `GET` | `/api/audit/export` | Export Audit Immutable |
| `GET` | `/api/audit/logs` | Get Audit Logs |
| `POST` | `/api/auth/login` | Login Auth User |
| `POST` | `/api/auth/logout` | Logout Auth User |
| `POST` | `/api/auth/register` | Register Auth User |
| `GET` | `/api/auth/session` | Get Auth Session |
| `POST` | `/api/auth/switch-org` | Switch Auth Org |
| `POST` | `/api/autopilot/launch` | Autopilot Launch |
| `POST` | `/api/campaigns/create` | Create Campaigns |
| `POST` | `/api/campaigns/metrics/upsert` | Upsert Campaign Metrics |
| `POST` | `/api/campaigns/optimizer/execute` | Execute Optimizer Actions |
| `GET` | `/api/campaigns/optimizer/latest/{user_id}` | Latest Optimizer Run |
| `POST` | `/api/campaigns/optimizer/run` | Run Optimizer |
| `POST` | `/api/campaigns/optimizer/run-weekly` | Run Weekly Optimizer |
| `POST` | `/api/chat` | Chat With Bot |
| `POST` | `/api/copilot/execute` | Execute Copilot Actions |
| `POST` | `/api/copy/ad` | Generate Ad |
| `POST` | `/api/copy/description` | Generate Description |
| `POST` | `/api/copy/seo` | Generate Seo |
| `GET` | `/api/copy/status` | Copy Status |
| `POST` | `/api/creatives/avatar-video` | Create Avatar Video |
| `GET` | `/api/creatives/avatars` | List Avatars |
| `POST` | `/api/creatives/photo` | Create Photo |
| `POST` | `/api/creatives/photo/batch` | Batch Photos |
| `POST` | `/api/creatives/photo/remove-bg` | Remove Bg |
| `GET` | `/api/creatives/status` | Creatives Status |
| `POST` | `/api/creatives/video` | Create Video |
| `GET` | `/api/creatives/video/{render_id}` | Video Status |
| `GET` | `/api/dashboard/realtime/{user_id}` | Realtime Dashboard Snapshot |
| `GET` | `/api/dlq/recent` | Dlq Recent |
| `POST` | `/api/email/audience` | Create Audience |
| `POST` | `/api/email/campaign` | Create Email Campaign |
| `POST` | `/api/email/campaign/{campaign_id}/send` | Send Email Campaign |
| `POST` | `/api/email/flow` | Create Email Flow |
| `GET` | `/api/email/flows` | List Email Flows |
| `GET` | `/api/email/status` | Emailstatus |
| `POST` | `/api/email/subscriber` | Add Subscriber |
| `POST` | `/api/experiments/auto-promote/run` | Run Auto Promotions |
| `POST` | `/api/experiments/create` | Create Experiment |
| `POST` | `/api/experiments/events` | Ingest Experiment Event |
| `GET` | `/api/experiments/{experiment_id}/assign` | Assign Experiment Variant |
| `POST` | `/api/experiments/{experiment_id}/evaluate` | Evaluate Experiment |
| `POST` | `/api/experiments/{experiment_id}/metrics/upsert` | Upsert Experiment Metrics |
| `GET` | `/api/experiments/{user_id}` | List Experiments |
| `POST` | `/api/fulfillment/import` | Import Product |
| `POST` | `/api/fulfillment/order` | Fulfill Order |
| `GET` | `/api/fulfillment/status` | Fulfillment Status |
| `POST` | `/api/fulfillment/sync-inventory` | Sync Inventory |
| `GET` | `/api/fulfillment/track/{order_id}` | Track Order |
| `POST` | `/api/generate-3d` | Generate 3D |
| `POST` | `/api/generate-copy` | Generate Copy |
| `POST` | `/api/generate-storyboard` | Generate Storyboard |
| `POST` | `/api/influencer/photo` | Influencer Photo |
| `GET` | `/api/influencer/status` | Influencerstatus |
| `GET` | `/api/influencer/status/{prompt_id}` | Influencer Gen Status |
| `POST` | `/api/influencer/ugc` | Influencer Ugc |
| `POST` | `/api/influencer/video` | Influencer Video |
| `GET` | `/api/integrations/status` | Integrations Status |
| `POST` | `/api/marketing/micro-influencer-plan` | Micro Influencer Plan |
| `POST` | `/api/oauth/{platform}/callback` | Oauth Callback |
| `POST` | `/api/oauth/{platform}/connect` | Oauth Connect |
| `POST` | `/api/offers/catalog/upsert` | Upsert Offer Catalog |
| `GET` | `/api/offers/catalog/{user_id}` | List Offer Catalog |
| `POST` | `/api/offers/recommend` | Recommend Offers |
| `POST` | `/api/offers/recommend-v2` | Recommend Offers V2 |
| `POST` | `/api/onboarding/state/upsert` | Upsert Onboarding State |
| `GET` | `/api/onboarding/state/{user_id}` | Get Onboarding State |
| `GET` | `/api/onboarding/{user_id}` | Onboarding Status |
| `GET, POST` | `/api/ops/controls` | Get Ops Controls |
| `POST` | `/api/orgs/create` | Create Org |
| `GET` | `/api/orgs/{org_id}/members` | List Members |
| `POST` | `/api/orgs/{org_id}/members/upsert` | Upsert Member |
| `GET` | `/api/payments/balance` | Get Balance |
| `POST` | `/api/payments/checkout` | Create Checkout |
| `GET` | `/api/payments/status` | Payments Status |
| `POST` | `/api/payments/webhook` | Stripe Webhook |
| `POST` | `/api/publish` | Publish Campaign |
| `POST` | `/api/render-scene` | Render Scene |
| `GET` | `/api/sla/metrics/{org_id}` | Sla Metrics |
| `GET` | `/api/sourcing/cj/product/{pid}` | Cj Product |
| `GET` | `/api/sourcing/cj/search` | Cj Search |
| `GET` | `/api/sourcing/cj/shipping` | Cj Shipping |
| `GET` | `/api/sourcing/cj/status` | Cj Status |
| `POST` | `/api/sourcing/find` | Sourcing Find |
| `POST` | `/api/state/audit-export/{org_id}` | Export Org Audit |
| `POST` | `/api/state/backup/{org_id}` | Backup State |
| `GET` | `/api/state/export/{org_id}` | Export State |
| `GET` | `/api/status/routes` | Route Status Map |
| `POST` | `/api/store/build-landing` | Build Landing Page |
| `POST` | `/api/store/build-page` | Build Product Page |
| `POST` | `/api/store/trust-checklist` | Trust Checklist |
| `POST` | `/api/studio/state/upsert` | Upsert Studio State |
| `GET` | `/api/studio/state/{user_id}` | Get Studio State |
| `POST` | `/api/tokens/rotate/run` | Run Token Rotation |
| `GET` | `/api/tokens/{user_id}/status` | Token Status |
| `POST` | `/api/upsells/bundles` | Generate Bundles |
| `POST` | `/api/upsells/cart-rewards` | Generate Cart Rewards |
| `POST` | `/api/upsells/config` | Generate Upsell Config |
| `GET` | `/api/webhooks/meta` | Verify Meta Webhook |
| `POST` | `/api/webhooks/{platform}` | Ingest Webhook |
| `GET` | `/health` | Health Check |

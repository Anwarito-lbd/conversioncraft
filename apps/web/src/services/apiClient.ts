import { WorkerAnalyzeResponse } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const checkWorkerHealth = async (): Promise<{ status: string }> => {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) throw new Error(`Worker health check failed: ${response.statusText}`);
  return await response.json();
};

export interface OAuthConnectResponse {
  platform: string;
  auth_url: string;
  state: string;
  nonce: string;
}

export interface TokenStatusResponse {
  user_id: string;
  status: Record<string, boolean>;
}

export interface CampaignCreateResponse {
  status: 'success' | 'partial_success' | 'failed';
  campaigns: Array<Record<string, unknown>>;
  errors: string[];
}

export interface OptimizerResponse {
  user_id: string;
  result: {
    ran_at: string;
    summary: string;
    actions: Array<Record<string, unknown>>;
  };
  note?: string;
  trigger?: string;
}

export interface OnboardingStatusResponse {
  user_id: string;
  env: Record<string, boolean>;
  connections: Record<string, boolean>;
  completed: Record<string, boolean>;
  ready_for_launch: boolean;
}

export interface PersistedStateResponse {
  user_id: string;
  org_id: string;
  state: Record<string, unknown>;
  version: number;
  updated_at?: string;
}

export interface EnterpriseAnalyticsResponse {
  org: Record<string, unknown>;
  drilldowns: {
    team_members: Array<Record<string, unknown>>;
    role_rollup: Array<Record<string, unknown>>;
  };
  sla: {
    window_minutes: number;
    alerts: Array<Record<string, unknown>>;
    stale_campaigns: Array<Record<string, unknown>>;
    dlq_recent_count: number;
  };
  forecast: Record<string, unknown>;
  controls?: Record<string, unknown>;
}

export interface AnalyticsPreferences {
  role_filter: 'all' | 'viewer' | 'analyst' | 'marketer' | 'admin' | 'owner';
  user_filter: string;
  sla_sync_stale_minutes: number;
  sla_dlq_threshold_15m: number;
  forecast_horizon_days: number;
}

export interface AlertRoute {
  route_id: string;
  channel: 'email' | 'slack' | 'webhook' | 'inapp';
  target: string;
  severities: Array<'warning' | 'critical'>;
  event_types: string[];
  enabled: boolean;
  cooldown_minutes: number;
  retry_attempts?: number;
  retry_backoff_seconds?: number;
  failover_route_id?: string | null;
}

export interface EscalationPolicy {
  enabled: boolean;
  repeated_critical_threshold: number;
  window_minutes: number;
  page_owner_channel: 'email' | 'slack' | 'webhook' | 'inapp';
  page_owner_target: string;
  include_sla: boolean;
  include_anomaly: boolean;
  suppression_windows: SuppressionWindow[];
  on_call_schedule: OnCallShift[];
}

export interface SuppressionWindow {
  days: Array<'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'>;
  start_hour: number;
  end_hour: number;
  tz_offset: string;
  scopes: Array<'sla' | 'anomaly'>;
  severities: Array<'warning' | 'critical'>;
  enabled: boolean;
}

export interface OnCallShift {
  days: Array<'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'>;
  start_hour: number;
  end_hour: number;
  tz_offset: string;
  channel: 'email' | 'slack' | 'webhook' | 'inapp';
  target: string;
  owner_user_id: string;
  enabled: boolean;
}

export interface OfferRecommendationV2Response {
  product: { name: string; price: number; cost: number; margin: number };
  constraints_applied: { min_margin: number; max_discount_percent: number; min_inventory: number };
  recommendations: Array<Record<string, unknown>>;
  ui_contract: {
    pre_checkout_blocks: Array<Record<string, unknown>>;
    post_purchase_blocks: Array<Record<string, unknown>>;
  };
  ab_test: {
    variant_a: Record<string, unknown>;
    variant_b: Record<string, unknown>;
  };
}

export interface MicroInfluencerPlanResponse {
  recommended_follower_range: string;
  channel: string;
  estimated_creator_count: number;
  story_budget_per_creator: number;
  allocated_budget: number;
  target_cpa: number;
  target_roas: number;
  outreach_template: string;
  brief: string[];
}

export interface TrustChecklistResponse {
  score: number;
  checks: Array<{ id: string; label: string; ok: boolean }>;
  missing: string[];
  status: 'ready' | 'needs_work';
}

export interface ExperimentResponse {
  experiment_id: string;
  name: string;
  status: string;
  winner_variant_id: string;
  variants: Array<Record<string, unknown>>;
  rules: Record<string, unknown>;
  latest_evaluation?: Record<string, unknown>;
}

export interface ApiValidationDetail {
  error?: string;
  field?: string;
  message?: string;
  hint?: string;
  path?: string;
  index?: number;
  line?: number;
  column?: number;
  line_text?: string;
  pointer?: string;
}

export class ApiRequestError extends Error {
  detail?: ApiValidationDetail;
}

const parseApiError = async (response: Response, fallback: string): Promise<ApiRequestError> => {
  const err = new ApiRequestError(`${fallback}: ${response.statusText}`);
  const body = await response.json().catch(() => null);
  const detail = body && typeof body === 'object' ? (body as Record<string, unknown>).detail : null;
  if (detail && typeof detail === 'object') {
    err.detail = detail as ApiValidationDetail;
    const message = String((detail as Record<string, unknown>).message || '');
    const hint = String((detail as Record<string, unknown>).hint || '');
    const line = (detail as Record<string, unknown>).line;
    const column = (detail as Record<string, unknown>).column;
    const lineHint = typeof line === 'number' && typeof column === 'number' ? ` (line ${line}, col ${column})` : '';
    if (message || hint) {
      err.message = `${message || fallback}${lineHint}${hint ? ` - ${hint}` : ''}`;
    }
  }
  return err;
};

export const analyzeNiche = async (niche: string): Promise<WorkerAnalyzeResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ niche }),
  });

  if (!response.ok) throw new Error(`API call failed: ${response.statusText}`);
  return await response.json();
};

export const generateStoryboard = async (
  productName: string,
  benefits: string[],
): Promise<Record<string, unknown>> => {
  const response = await fetch(`${API_BASE_URL}/api/generate-storyboard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product_name: productName, benefits }),
  });

  if (!response.ok) throw new Error(`API call failed: ${response.statusText}`);
  return await response.json();
};

export const generate3DModel = async (imageUrl: string): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/api/generate-3d`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: imageUrl }),
  });

  if (!response.ok) throw new Error(`API call failed: ${response.statusText}`);
  const data = await response.json();
  return data.model_url;
};

export const publishCampaign = async (
  productData: Record<string, unknown>,
  userTokens: Record<string, unknown>,
): Promise<Record<string, unknown>> => {
  const response = await fetch(`${API_BASE_URL}/api/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product_data: productData, user_tokens: userTokens }),
  });

  if (!response.ok) throw new Error(`API call failed: ${response.statusText}`);
  return await response.json();
};

export const getOnboardingStatus = async (userId: string): Promise<OnboardingStatusResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/onboarding/${userId}`);
  if (!response.ok) throw new Error(`Onboarding status failed: ${response.statusText}`);
  return await response.json();
};

export const getOnboardingState = async (params: {
  userId: string;
  orgId?: string;
}): Promise<PersistedStateResponse> => {
  const query = params.orgId ? `?org_id=${encodeURIComponent(params.orgId)}` : '';
  const response = await fetch(`${API_BASE_URL}/api/onboarding/state/${encodeURIComponent(params.userId)}${query}`);
  if (!response.ok) throw new Error(`Onboarding state fetch failed: ${response.statusText}`);
  return await response.json();
};

export const upsertOnboardingState = async (params: {
  userId: string;
  orgId?: string;
  expectedVersion?: number;
  state: Record<string, unknown>;
}): Promise<{ status: string; row: Record<string, unknown> }> => {
  const response = await fetch(`${API_BASE_URL}/api/onboarding/state/upsert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: params.userId,
      org_id: params.orgId,
      expected_version: params.expectedVersion,
      state: params.state,
    }),
  });
  if (!response.ok) {
    if (response.status === 409) {
      const body = await response.json().catch(() => ({}));
      const currentVersion = Number(body?.detail?.current_version ?? 0);
      throw new Error(`Onboarding version conflict:${currentVersion}`);
    }
    throw new Error(`Onboarding state upsert failed: ${response.statusText}`);
  }
  return await response.json();
};

export const getStudioState = async (params: {
  userId: string;
  orgId?: string;
}): Promise<PersistedStateResponse> => {
  const query = params.orgId ? `?org_id=${encodeURIComponent(params.orgId)}` : '';
  const response = await fetch(`${API_BASE_URL}/api/studio/state/${encodeURIComponent(params.userId)}${query}`);
  if (!response.ok) throw new Error(`Studio state fetch failed: ${response.statusText}`);
  return await response.json();
};

export const upsertStudioState = async (params: {
  userId: string;
  orgId?: string;
  expectedVersion?: number;
  state: Record<string, unknown>;
}): Promise<{ status: string; row: Record<string, unknown> }> => {
  const response = await fetch(`${API_BASE_URL}/api/studio/state/upsert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: params.userId,
      org_id: params.orgId,
      expected_version: params.expectedVersion,
      state: params.state,
    }),
  });
  if (!response.ok) {
    if (response.status === 409) {
      const body = await response.json().catch(() => ({}));
      const currentVersion = Number(body?.detail?.current_version ?? 0);
      throw new Error(`Studio version conflict:${currentVersion}`);
    }
    throw new Error(`Studio state upsert failed: ${response.statusText}`);
  }
  return await response.json();
};

export const getEnterpriseAnalytics = async (params: {
  orgId: string;
  actorUserId: string;
  lookbackDays?: number;
  roleFilter?: string;
  userFilter?: string;
  slaSyncStaleMinutes?: number;
  slaDlqThreshold15m?: number;
  forecastHorizonDays?: number;
}): Promise<EnterpriseAnalyticsResponse> => {
  const query = new URLSearchParams();
  query.set('actor_user_id', params.actorUserId);
  query.set('lookback_days', String(params.lookbackDays || 7));
  if (params.roleFilter) query.set('role_filter', params.roleFilter);
  if (params.userFilter) query.set('user_filter', params.userFilter);
  if (typeof params.slaSyncStaleMinutes === 'number') query.set('sla_sync_stale_minutes', String(params.slaSyncStaleMinutes));
  if (typeof params.slaDlqThreshold15m === 'number') query.set('sla_dlq_threshold_15m', String(params.slaDlqThreshold15m));
  if (typeof params.forecastHorizonDays === 'number') query.set('forecast_horizon_days', String(params.forecastHorizonDays));
  const response = await fetch(`${API_BASE_URL}/api/analytics/enterprise/${encodeURIComponent(params.orgId)}?${query.toString()}`);
  if (!response.ok) throw new Error(`Enterprise analytics failed: ${response.statusText}`);
  return await response.json();
};

export const getAnalyticsPreferences = async (params: {
  orgId: string;
  actorUserId: string;
}): Promise<{ org_id: string; settings: AnalyticsPreferences; updated_at?: string; updated_by?: string }> => {
  const response = await fetch(
    `${API_BASE_URL}/api/analytics/preferences/${encodeURIComponent(params.orgId)}?actor_user_id=${encodeURIComponent(params.actorUserId)}`,
  );
  if (!response.ok) throw new Error(`Analytics preferences fetch failed: ${response.statusText}`);
  return await response.json();
};

export const upsertAnalyticsPreferences = async (params: {
  orgId: string;
  actorUserId: string;
  settings: AnalyticsPreferences;
}): Promise<{ status: string; row: Record<string, unknown> }> => {
  const response = await fetch(`${API_BASE_URL}/api/analytics/preferences/${encodeURIComponent(params.orgId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      actor_user_id: params.actorUserId,
      settings: params.settings,
    }),
  });
  if (!response.ok) throw new Error(`Analytics preferences upsert failed: ${response.statusText}`);
  return await response.json();
};

export const getAlertRouting = async (params: {
  orgId: string;
  actorUserId: string;
}): Promise<{ org_id: string; routes: AlertRoute[]; updated_at?: string; updated_by?: string }> => {
  const response = await fetch(
    `${API_BASE_URL}/api/alerts/routing/${encodeURIComponent(params.orgId)}?actor_user_id=${encodeURIComponent(params.actorUserId)}`,
  );
  if (!response.ok) throw new Error(`Alert routing fetch failed: ${response.statusText}`);
  return await response.json();
};

export const upsertAlertRouting = async (params: {
  orgId: string;
  actorUserId: string;
  routes: AlertRoute[];
}): Promise<{ status: string; row: Record<string, unknown> }> => {
  const response = await fetch(`${API_BASE_URL}/api/alerts/routing/${encodeURIComponent(params.orgId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      actor_user_id: params.actorUserId,
      routes: params.routes,
    }),
  });
  if (!response.ok) throw new Error(`Alert routing upsert failed: ${response.statusText}`);
  return await response.json();
};

export const getEscalationPolicy = async (params: {
  orgId: string;
  actorUserId: string;
}): Promise<{ org_id: string; policy: EscalationPolicy; updated_at?: string; updated_by?: string }> => {
  const response = await fetch(
    `${API_BASE_URL}/api/alerts/escalation/${encodeURIComponent(params.orgId)}?actor_user_id=${encodeURIComponent(params.actorUserId)}`,
  );
  if (!response.ok) throw new Error(`Escalation policy fetch failed: ${response.statusText}`);
  return await response.json();
};

export const upsertEscalationPolicy = async (params: {
  orgId: string;
  actorUserId: string;
  policy: EscalationPolicy;
  suppressionWindowsJson?: string;
  onCallScheduleJson?: string;
}): Promise<{ status: string; row: Record<string, unknown> }> => {
  const response = await fetch(`${API_BASE_URL}/api/alerts/escalation/${encodeURIComponent(params.orgId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      actor_user_id: params.actorUserId,
      policy: params.policy,
      suppression_windows_json: params.suppressionWindowsJson,
      on_call_schedule_json: params.onCallScheduleJson,
    }),
  });
  if (!response.ok) throw await parseApiError(response, 'Escalation policy upsert failed');
  return await response.json();
};

export const getOrgAnomalies = async (params: {
  orgId: string;
  actorUserId: string;
}): Promise<{ org_id: string; observations: Array<Record<string, unknown>>; anomalies: Array<Record<string, unknown>>; generated_at: string }> => {
  const response = await fetch(
    `${API_BASE_URL}/api/analytics/anomalies/${encodeURIComponent(params.orgId)}?actor_user_id=${encodeURIComponent(params.actorUserId)}`,
  );
  if (!response.ok) throw new Error(`Anomaly fetch failed: ${response.statusText}`);
  return await response.json();
};

export const compareOrganizations = async (params: {
  actorUserId: string;
  orgIds: string[];
}): Promise<{ actor_user_id: string; org_ids: string[]; ranked: Array<Record<string, unknown>>; generated_at: string }> => {
  const response = await fetch(
    `${API_BASE_URL}/api/analytics/org-compare?actor_user_id=${encodeURIComponent(params.actorUserId)}&org_ids=${encodeURIComponent(params.orgIds.join(','))}`,
  );
  if (!response.ok) throw new Error(`Org comparison failed: ${response.statusText}`);
  return await response.json();
};

export const dispatchAlerts = async (params: {
  orgId: string;
  actorUserId: string;
}): Promise<{
  status: string;
  org_id: string;
  alerts_count: number;
  deliveries_count: number;
  skipped_duplicates: number;
  failed_deliveries: number;
  retried_deliveries: number;
  failover_deliveries: number;
  escalation_triggered: boolean;
  escalation_suppressed: boolean;
  deliveries: Array<Record<string, unknown>>;
  failed: Array<Record<string, unknown>>;
  delivery_receipts: Array<Record<string, unknown>>;
  receipts_by_channel: Record<string, { sent: number; failed: number }>;
}> => {
  const response = await fetch(
    `${API_BASE_URL}/api/alerts/dispatch/${encodeURIComponent(params.orgId)}?actor_user_id=${encodeURIComponent(params.actorUserId)}`,
    { method: 'POST' },
  );
  if (!response.ok) throw new Error(`Alert dispatch failed: ${response.statusText}`);
  return await response.json();
};

export const getCurrentOnCall = async (params: {
  orgId: string;
  actorUserId: string;
}): Promise<{ org_id: string; channel: string; target: string; generated_at: string }> => {
  const response = await fetch(
    `${API_BASE_URL}/api/alerts/oncall/${encodeURIComponent(params.orgId)}/current?actor_user_id=${encodeURIComponent(params.actorUserId)}`,
  );
  if (!response.ok) throw new Error(`On-call fetch failed: ${response.statusText}`);
  return await response.json();
};

export const listAlertEvents = async (params: {
  orgId: string;
  actorUserId: string;
  limit?: number;
  status?: 'dispatched' | 'acknowledged';
}): Promise<{ org_id: string; items: Array<Record<string, unknown>> }> => {
  const query = new URLSearchParams();
  query.set('actor_user_id', params.actorUserId);
  if (typeof params.limit === 'number') query.set('limit', String(params.limit));
  if (params.status) query.set('status', params.status);
  const response = await fetch(
    `${API_BASE_URL}/api/alerts/events/${encodeURIComponent(params.orgId)}?${query.toString()}`,
  );
  if (!response.ok) throw new Error(`Alert events fetch failed: ${response.statusText}`);
  return await response.json();
};

export const ackAlertEvent = async (params: {
  orgId: string;
  actorUserId: string;
  eventId: string;
}): Promise<{ status: string; row: Record<string, unknown> }> => {
  const response = await fetch(
    `${API_BASE_URL}/api/alerts/events/${encodeURIComponent(params.orgId)}/${encodeURIComponent(params.eventId)}/ack`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actor_user_id: params.actorUserId }),
    },
  );
  if (!response.ok) throw new Error(`Alert ack failed: ${response.statusText}`);
  return await response.json();
};

export const getSlaMetrics = async (params: {
  orgId: string;
  actorUserId: string;
  limit?: number;
}): Promise<{
  org_id: string;
  open_breaches: number;
  resolved_breaches: number;
  mtta_minutes: number | null;
  mttr_minutes: number | null;
  breaches: Array<Record<string, unknown>>;
  generated_at: string;
}> => {
  const query = new URLSearchParams();
  query.set('actor_user_id', params.actorUserId);
  if (typeof params.limit === 'number') query.set('limit', String(params.limit));
  const response = await fetch(
    `${API_BASE_URL}/api/sla/metrics/${encodeURIComponent(params.orgId)}?${query.toString()}`,
  );
  if (!response.ok) throw new Error(`SLA metrics fetch failed: ${response.statusText}`);
  return await response.json();
};

export const exportOrgState = async (params: {
  orgId: string;
  actorUserId: string;
}): Promise<Record<string, unknown>> => {
  const response = await fetch(
    `${API_BASE_URL}/api/state/export/${encodeURIComponent(params.orgId)}?actor_user_id=${encodeURIComponent(params.actorUserId)}`,
  );
  if (!response.ok) throw new Error(`State export failed: ${response.statusText}`);
  return await response.json();
};

export const backupOrgState = async (params: {
  orgId: string;
  actorUserId: string;
}): Promise<{ status: string; path: string; checksum_sha256: string }> => {
  const response = await fetch(
    `${API_BASE_URL}/api/state/backup/${encodeURIComponent(params.orgId)}?actor_user_id=${encodeURIComponent(params.actorUserId)}`,
    { method: 'POST' },
  );
  if (!response.ok) throw new Error(`State backup failed: ${response.statusText}`);
  return await response.json();
};

export const startOAuthConnect = async (params: {
  platform: 'shopify' | 'meta' | 'tiktok';
  userId: string;
  redirectUri: string;
  scopes?: string;
  shop?: string;
}): Promise<OAuthConnectResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/oauth/${params.platform}/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: params.userId,
      redirect_uri: params.redirectUri,
      scopes: params.scopes,
      shop: params.shop,
    }),
  });

  if (!response.ok) throw new Error(`OAuth connect failed: ${response.statusText}`);
  return await response.json();
};

export const completeOAuthConnect = async (params: {
  platform: 'shopify' | 'meta' | 'tiktok';
  userId: string;
  code: string;
  state: string;
  nonce?: string;
}): Promise<{ connected: boolean }> => {
  const response = await fetch(`${API_BASE_URL}/api/oauth/${params.platform}/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: params.userId,
      code: params.code,
      state: params.state,
      nonce: params.nonce,
    }),
  });

  if (!response.ok) throw new Error(`OAuth callback failed: ${response.statusText}`);
  return await response.json();
};

export const getTokenStatus = async (userId: string): Promise<TokenStatusResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/tokens/${userId}/status`);
  if (!response.ok) throw new Error(`Token status failed: ${response.statusText}`);
  return await response.json();
};

export const createCampaigns = async (params: {
  userId: string;
  campaignName: string;
  objective: 'conversions' | 'traffic' | 'engagement';
  dailyBudget: number;
  product?: Record<string, unknown>;
  targeting?: Record<string, unknown>;
}): Promise<CampaignCreateResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/campaigns/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: params.userId,
      campaign_name: params.campaignName,
      objective: params.objective,
      daily_budget: params.dailyBudget,
      product: params.product || {},
      targeting: params.targeting || {},
    }),
  });

  if (!response.ok) throw new Error(`Campaign creation failed: ${response.statusText}`);
  return await response.json();
};

export const executeOptimizerActions = async (params: {
  userId: string;
  actions: Array<Record<string, unknown>>;
}): Promise<{ status: string; results: Array<Record<string, unknown>>; errors: string[] }> => {
  const response = await fetch(`${API_BASE_URL}/api/campaigns/optimizer/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: params.userId,
      actions: params.actions,
    }),
  });

  if (!response.ok) throw new Error(`Optimizer execute failed: ${response.statusText}`);
  return await response.json();
};

export const executeCopilotActions = async (params: {
  userId: string;
  orgId?: string;
  actions: Array<Record<string, unknown>>;
  guardrails: Record<string, unknown>;
}): Promise<{
  status: string;
  applied_count: number;
  safe_count: number;
  skipped_guardrail_count: number;
  execution: { results: Array<Record<string, unknown>>; errors: string[]; skipped: Array<Record<string, unknown>> };
}> => {
  const response = await fetch(`${API_BASE_URL}/api/copilot/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: params.userId,
      org_id: params.orgId,
      actions: params.actions,
      guardrails: params.guardrails,
    }),
  });
  if (!response.ok) throw new Error(`Copilot execute failed: ${response.statusText}`);
  return await response.json();
};

export const runOptimizer = async (params: {
  userId: string;
  campaignMetrics: Array<Record<string, unknown>>;
}): Promise<OptimizerResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/campaigns/optimizer/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: params.userId, campaign_metrics: params.campaignMetrics }),
  });

  if (!response.ok) throw new Error(`Optimizer run failed: ${response.statusText}`);
  return await response.json();
};

export const runWeeklyOptimizer = async (userId: string): Promise<OptimizerResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/campaigns/optimizer/run-weekly?user_id=${encodeURIComponent(userId)}`, {
    method: 'POST',
  });

  if (!response.ok) throw new Error(`Weekly optimizer failed: ${response.statusText}`);
  return await response.json();
};

export const getLatestOptimizer = async (userId: string): Promise<{ user_id: string; latest: Record<string, unknown> }> => {
  const response = await fetch(`${API_BASE_URL}/api/campaigns/optimizer/latest/${encodeURIComponent(userId)}`);
  if (!response.ok) throw new Error(`Latest optimizer fetch failed: ${response.statusText}`);
  return await response.json();
};

export const upsertSkuCatalog = async (params: {
  userId: string;
  skus: Array<Record<string, unknown>>;
}): Promise<{ status: string; count: number; skus: Array<Record<string, unknown>> }> => {
  const response = await fetch(`${API_BASE_URL}/api/offers/catalog/upsert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: params.userId, skus: params.skus }),
  });
  if (!response.ok) throw new Error(`Catalog upsert failed: ${response.statusText}`);
  return await response.json();
};

export const recommendOffersV2 = async (params: {
  userId: string;
  product: Record<string, unknown>;
  constraints?: Record<string, unknown>;
  experiment?: Record<string, unknown>;
}): Promise<OfferRecommendationV2Response> => {
  const response = await fetch(`${API_BASE_URL}/api/offers/recommend-v2`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: params.userId,
      product: params.product,
      constraints: params.constraints || {},
      experiment: params.experiment || {},
    }),
  });
  if (!response.ok) throw new Error(`Offer recommendation failed: ${response.statusText}`);
  return await response.json();
};

export const getRealtimeDashboard = async (userId: string): Promise<Record<string, unknown>> => {
  const response = await fetch(`${API_BASE_URL}/api/dashboard/realtime/${encodeURIComponent(userId)}`);
  if (!response.ok) throw new Error(`Realtime dashboard failed: ${response.statusText}`);
  return await response.json();
};

export const getMicroInfluencerPlan = async (params: {
  userId: string;
  niche: string;
  productName: string;
  productPrice: number;
  productCost: number;
  budget: number;
}): Promise<MicroInfluencerPlanResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/marketing/micro-influencer-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: params.userId,
      niche: params.niche,
      product_name: params.productName,
      product_price: params.productPrice,
      product_cost: params.productCost,
      budget: params.budget,
    }),
  });
  if (!response.ok) throw new Error(`Micro-influencer plan failed: ${response.statusText}`);
  return await response.json();
};

export const getTrustChecklist = async (params: {
  userId: string;
  paypalEnabled: boolean;
  shippingPolicy: boolean;
  termsPolicy: boolean;
  sampleQualityChecked: boolean;
  relatedUpsellEnabled: boolean;
}): Promise<TrustChecklistResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/store/trust-checklist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: params.userId,
      paypal_enabled: params.paypalEnabled,
      shipping_policy: params.shippingPolicy,
      terms_policy: params.termsPolicy,
      sample_quality_checked: params.sampleQualityChecked,
      related_upsell_enabled: params.relatedUpsellEnabled,
    }),
  });
  if (!response.ok) throw new Error(`Trust checklist failed: ${response.statusText}`);
  return await response.json();
};

export const createExperiment = async (params: {
  userId: string;
  name: string;
  variants: Array<Record<string, unknown>>;
  rules?: Record<string, unknown>;
}): Promise<ExperimentResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/experiments/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: params.userId,
      name: params.name,
      variants: params.variants,
      rules: params.rules || {},
    }),
  });
  if (!response.ok) throw new Error(`Experiment create failed: ${response.statusText}`);
  return await response.json();
};

export const upsertExperimentMetrics = async (params: {
  userId: string;
  experimentId: string;
  metrics: Array<Record<string, unknown>>;
}): Promise<{ status: string; experiment: ExperimentResponse }> => {
  const response = await fetch(`${API_BASE_URL}/api/experiments/${encodeURIComponent(params.experimentId)}/metrics/upsert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: params.userId,
      metrics: params.metrics,
    }),
  });
  if (!response.ok) throw new Error(`Experiment metrics upsert failed: ${response.statusText}`);
  return await response.json();
};

export const evaluateExperiment = async (params: {
  userId: string;
  experimentId: string;
}): Promise<{ experiment_id: string; evaluation: Record<string, unknown> }> => {
  const response = await fetch(
    `${API_BASE_URL}/api/experiments/${encodeURIComponent(params.experimentId)}/evaluate?user_id=${encodeURIComponent(params.userId)}`,
    { method: 'POST' },
  );
  if (!response.ok) throw new Error(`Experiment evaluation failed: ${response.statusText}`);
  return await response.json();
};

export const listExperiments = async (userId: string): Promise<{ user_id: string; items: ExperimentResponse[] }> => {
  const response = await fetch(`${API_BASE_URL}/api/experiments/${encodeURIComponent(userId)}`);
  if (!response.ok) throw new Error(`List experiments failed: ${response.statusText}`);
  return await response.json();
};

export const assignExperimentVariant = async (params: {
  userId: string;
  experimentId: string;
  sessionId: string;
}): Promise<{
  experiment_id: string;
  session_id: string;
  variant_id: string;
  variant_name: string;
  status: string;
}> => {
  const response = await fetch(
    `${API_BASE_URL}/api/experiments/${encodeURIComponent(params.experimentId)}/assign?user_id=${encodeURIComponent(params.userId)}&session_id=${encodeURIComponent(params.sessionId)}`,
  );
  if (!response.ok) throw new Error(`Assign experiment variant failed: ${response.statusText}`);
  return await response.json();
};

export const ingestExperimentEvent = async (params: {
  userId: string;
  experimentId: string;
  sessionId: string;
  eventType: 'impression' | 'conversion' | 'revenue' | 'spend';
  variantId?: string;
  revenue?: number;
  spend?: number;
}): Promise<{
  status: string;
  experiment_id: string;
  session_id: string;
  variant_id: string;
  event_type: string;
  increments: Record<string, number>;
  evaluation?: Record<string, unknown> | null;
}> => {
  const response = await fetch(`${API_BASE_URL}/api/experiments/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: params.userId,
      experiment_id: params.experimentId,
      session_id: params.sessionId,
      event_type: params.eventType,
      variant_id: params.variantId,
      revenue: params.revenue || 0,
      spend: params.spend || 0,
    }),
  });
  if (!response.ok) throw new Error(`Ingest experiment event failed: ${response.statusText}`);
  return await response.json();
};

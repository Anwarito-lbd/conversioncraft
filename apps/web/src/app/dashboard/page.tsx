'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertTriangle, BarChart3, BellRing, RefreshCw, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import { getRealtimeSnapshotPhase1, listExperimentsPhase1 } from '@/services/phase1Service';
import {
  ApiRequestError,
  AlertRoute,
  AnalyticsPreferences,
  EscalationPolicy,
  checkWorkerHealth,
  compareOrganizations,
  dispatchAlerts,
  ackAlertEvent,
  executeCopilotActions,
  getAlertRouting,
  getAnalyticsPreferences,
  getEscalationPolicy,
  getEnterpriseAnalytics,
  getOrgAnomalies,
  getSlaMetrics,
  listAlertEvents,
  upsertAlertRouting,
  upsertEscalationPolicy,
  upsertAnalyticsPreferences,
} from '@/services/apiClient';
import { AuthSessionState, resolveActiveSession } from '@/services/authClient';
import SpotlightCard from '@/components/ui/SpotlightCard';
import SessionControls from '@/components/SessionControls';

export default function DashboardPage() {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthSessionState | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snapshot, setSnapshot] = useState<Record<string, unknown> | null>(null);
  const [experiments, setExperiments] = useState<Array<Record<string, unknown>>>([]);
  const [enterprise, setEnterprise] = useState<Record<string, unknown> | null>(null);
  const [guardrailsAccepted, setGuardrailsAccepted] = useState(false);
  const [copilotStatus, setCopilotStatus] = useState('');
  const [copilotRunning, setCopilotRunning] = useState(false);
  const [workerStatus, setWorkerStatus] = useState<'online' | 'offline'>('offline');
  const [roleFilter, setRoleFilter] = useState<AnalyticsPreferences['role_filter']>('all');
  const [userFilter, setUserFilter] = useState('all');
  const [slaSyncStaleMinutes, setSlaSyncStaleMinutes] = useState(30);
  const [slaDlqThreshold15m, setSlaDlqThreshold15m] = useState(0);
  const [forecastHorizonDays, setForecastHorizonDays] = useState(7);
  const [preferencesStatus, setPreferencesStatus] = useState('');
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [anomalyPack, setAnomalyPack] = useState<Record<string, unknown> | null>(null);
  const [orgComparison, setOrgComparison] = useState<Record<string, unknown> | null>(null);
  const [orgCompareInput, setOrgCompareInput] = useState('');
  const [routingRoutes, setRoutingRoutes] = useState<AlertRoute[]>([]);
  const [alertEvents, setAlertEvents] = useState<Array<Record<string, unknown>>>([]);
  const [slaMetrics, setSlaMetrics] = useState<Record<string, unknown> | null>(null);
  const [escalationPolicy, setEscalationPolicy] = useState<EscalationPolicy>({
    enabled: true,
    repeated_critical_threshold: 3,
    window_minutes: 60,
    page_owner_channel: 'inapp',
    page_owner_target: '',
    include_sla: true,
    include_anomaly: true,
    suppression_windows: [],
    on_call_schedule: [],
  });
  const [routingStatus, setRoutingStatus] = useState('');
  const [dispatchStatus, setDispatchStatus] = useState('');
  const [escalationStatus, setEscalationStatus] = useState('');
  const [dispatchSummary, setDispatchSummary] = useState<Record<string, unknown> | null>(null);
  const [suppressionJson, setSuppressionJson] = useState('[]');
  const [onCallJson, setOnCallJson] = useState('[]');
  const [suppressionValidation, setSuppressionValidation] = useState<{ message: string; line?: number; lineText?: string; pointer?: string } | null>(null);
  const [onCallValidation, setOnCallValidation] = useState<{ message: string; line?: number; lineText?: string; pointer?: string } | null>(null);
  const [activeJumpTarget, setActiveJumpTarget] = useState<'suppression' | 'oncall' | null>(null);
  const suppressionTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const onCallTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const userId = auth?.session.user_id || '';
  const orgId = auth?.session.org_id || '';

  useEffect(() => {
    void (async () => {
      const session = await resolveActiveSession();
      if (!session) {
        router.replace('/login');
        return;
      }
      setAuth(session);
      setOrgCompareInput(session.session.org_id);
      setAuthLoading(false);
    })();
  }, [router]);

  const load = useCallback(async () => {
    if (!userId || !orgId) return;
    setError('');
    try {
      await checkWorkerHealth();
      setWorkerStatus('online');
      const compareOrgIds = orgCompareInput
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 8);
      const [data, exp, ent] = await Promise.all([
        getRealtimeSnapshotPhase1(userId),
        listExperimentsPhase1(userId),
        getEnterpriseAnalytics({
          orgId: orgId,
          actorUserId: userId,
          lookbackDays: 7,
          roleFilter,
          userFilter,
          slaSyncStaleMinutes,
          slaDlqThreshold15m,
          forecastHorizonDays,
        }),
      ]);
      const [anomalyResult, compareResult, eventResult, slaResult] = await Promise.all([
        getOrgAnomalies({ orgId: orgId, actorUserId: userId }),
        compareOrgIds.length >= 2
          ? compareOrganizations({ actorUserId: userId, orgIds: compareOrgIds })
          : Promise.resolve({ actor_user_id: userId, org_ids: [orgId], ranked: [], generated_at: new Date().toISOString() }),
        listAlertEvents({ orgId: orgId, actorUserId: userId, limit: 20 }),
        getSlaMetrics({ orgId: orgId, actorUserId: userId, limit: 100 }),
      ]);
      setSnapshot(data);
      setExperiments(exp);
      setEnterprise(ent as unknown as Record<string, unknown>);
      setAnomalyPack(anomalyResult as unknown as Record<string, unknown>);
      setOrgComparison(compareResult as unknown as Record<string, unknown>);
      setAlertEvents(eventResult.items || []);
      setSlaMetrics(slaResult as unknown as Record<string, unknown>);
    } catch (err) {
      setWorkerStatus('offline');
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [
    forecastHorizonDays,
    orgCompareInput,
    orgId,
    roleFilter,
    slaDlqThreshold15m,
    slaSyncStaleMinutes,
    userFilter,
    userId,
  ]);

  useEffect(() => {
    if (!userId || !orgId) return;
    void (async () => {
      try {
        const prefs = await getAnalyticsPreferences({ orgId: orgId, actorUserId: userId });
        setRoleFilter(prefs.settings.role_filter || 'all');
        setUserFilter(prefs.settings.user_filter || 'all');
        setSlaSyncStaleMinutes(Number(prefs.settings.sla_sync_stale_minutes || 30));
        setSlaDlqThreshold15m(Number(prefs.settings.sla_dlq_threshold_15m || 0));
        setForecastHorizonDays(Number(prefs.settings.forecast_horizon_days || 7));
        const routing = await getAlertRouting({ orgId: orgId, actorUserId: userId });
        const escalation = await getEscalationPolicy({ orgId: orgId, actorUserId: userId });
        setEscalationPolicy({
          enabled: Boolean(escalation.policy.enabled),
          repeated_critical_threshold: Number(escalation.policy.repeated_critical_threshold || 3),
          window_minutes: Number(escalation.policy.window_minutes || 60),
          page_owner_channel: escalation.policy.page_owner_channel || 'inapp',
          page_owner_target: escalation.policy.page_owner_target || '',
          include_sla: Boolean(escalation.policy.include_sla),
          include_anomaly: Boolean(escalation.policy.include_anomaly),
          suppression_windows: Array.isArray(escalation.policy.suppression_windows) ? escalation.policy.suppression_windows : [],
          on_call_schedule: Array.isArray(escalation.policy.on_call_schedule) ? escalation.policy.on_call_schedule : [],
        });
        setSuppressionJson(JSON.stringify(Array.isArray(escalation.policy.suppression_windows) ? escalation.policy.suppression_windows : [], null, 2));
        setOnCallJson(JSON.stringify(Array.isArray(escalation.policy.on_call_schedule) ? escalation.policy.on_call_schedule : [], null, 2));
        if (routing.routes.length) {
          setRoutingRoutes(
            routing.routes.map((route) => ({
              ...route,
              cooldown_minutes: typeof route.cooldown_minutes === 'number' ? route.cooldown_minutes : 30,
              retry_attempts: typeof route.retry_attempts === 'number' ? route.retry_attempts : 2,
              retry_backoff_seconds: typeof route.retry_backoff_seconds === 'number' ? route.retry_backoff_seconds : 15,
              failover_route_id: route.failover_route_id || '',
            })),
          );
        } else {
          setRoutingRoutes([
            {
              route_id: crypto.randomUUID(),
              channel: 'email',
              target: 'ops@conversioncraft.ai',
              severities: ['critical'],
              event_types: ['sla', 'anomaly'],
              enabled: true,
              cooldown_minutes: 30,
              retry_attempts: 2,
              retry_backoff_seconds: 15,
              failover_route_id: '',
            },
          ]);
        }
      } catch {
        setPreferencesStatus('Using default analytics controls.');
      }
      setPreferencesLoaded(true);
    })();
  }, [userId, orgId]);

  useEffect(() => {
    if (!preferencesLoaded || !userId || !orgId) return;
    void load();
    const timer = window.setInterval(() => {
      void load();
    }, 15000);
    return () => window.clearInterval(timer);
  }, [preferencesLoaded, load, userId, orgId]);

  const campaignSummary = useMemo(() => {
    const campaigns = (snapshot?.campaigns as Record<string, unknown> | undefined) || {};
    return {
      count: Number(campaigns.campaign_count || 0),
      spend: Number(campaigns.total_spend || 0),
      ctr: Number(campaigns.avg_ctr || 0),
      roas: Number(campaigns.avg_roas || 0),
      rows: Array.isArray(campaigns.campaigns) ? (campaigns.campaigns as Array<Record<string, unknown>>) : [],
    };
  }, [snapshot]);

  const attribution = useMemo(() => {
    const data = (snapshot?.attribution as Record<string, unknown> | undefined) || {};
    return {
      revenue: Number(data.revenue || 0),
      spend: Number(data.spend || 0),
      roas: data.roas,
      cac: Number(data.cac || 0),
      ltv: Number(data.ltv || 0),
      cohorts: Array.isArray(data.cohorts) ? (data.cohorts as Array<Record<string, unknown>>) : [],
    };
  }, [snapshot]);

  const stats = [
    { label: 'Campaigns', value: String(campaignSummary.count) },
    { label: 'Spend', value: `$${campaignSummary.spend.toFixed(2)}` },
    { label: 'Avg CTR', value: String(campaignSummary.ctr) },
    { label: 'CAC', value: `$${attribution.cac.toFixed(2)}` },
    { label: 'LTV', value: `$${attribution.ltv.toFixed(2)}` },
  ];
  const attributionRoasLabel = attribution.roas == null ? '-' : String(attribution.roas);
  const enterpriseOrg = (enterprise?.org as Record<string, unknown> | undefined) || {};
  const enterpriseDrilldowns = (enterprise?.drilldowns as Record<string, unknown> | undefined) || {};
  const teamRows = Array.isArray(enterpriseDrilldowns.team_members) ? (enterpriseDrilldowns.team_members as Array<Record<string, unknown>>) : [];
  const roleRows = Array.isArray(enterpriseDrilldowns.role_rollup) ? (enterpriseDrilldowns.role_rollup as Array<Record<string, unknown>>) : [];
  const enterpriseSla = (enterprise?.sla as Record<string, unknown> | undefined) || {};
  const slaAlerts = Array.isArray(enterpriseSla.alerts) ? (enterpriseSla.alerts as Array<Record<string, unknown>>) : [];
  const slaBreaches = Array.isArray(slaMetrics?.breaches) ? (slaMetrics?.breaches as Array<Record<string, unknown>>) : [];
  const enterpriseForecast = (enterprise?.forecast as Record<string, unknown> | undefined) || {};
  const anomalies = Array.isArray(anomalyPack?.anomalies) ? (anomalyPack?.anomalies as Array<Record<string, unknown>>) : [];
  const comparisonRows = Array.isArray(orgComparison?.ranked) ? (orgComparison?.ranked as Array<Record<string, unknown>>) : [];
  const optimizerLatest = (snapshot?.optimizer_latest as Record<string, unknown> | undefined) || {};
  const optimizerResult = (optimizerLatest.result as Record<string, unknown> | undefined) || {};
  const optimizerActions = (optimizerResult.actions as Array<Record<string, unknown>> | undefined) || [];

  const alerts = useMemo(() => {
    const rows = campaignSummary.rows;
    const next: Array<{ level: 'critical' | 'warning' | 'opportunity'; message: string }> = [];
    for (const row of rows) {
      const metrics = (row.last_metrics as Record<string, unknown> | undefined) || {};
      const spend = Number(metrics.spend || 0);
      const ctr = Number(metrics.ctr || 0);
      const roas = Number(metrics.roas || 0);
      const cid = String(row.campaign_id || '-');
      if (spend >= 50 && roas < 1.2) next.push({ level: 'critical', message: `${cid}: ROAS ${roas.toFixed(2)} below 1.2 at $${spend.toFixed(0)} spend.` });
      else if (spend >= 30 && ctr < 1.0) next.push({ level: 'warning', message: `${cid}: CTR ${ctr.toFixed(2)} under 1.0 with spend accumulation.` });
      else if (spend >= 100 && roas >= 2.5) next.push({ level: 'opportunity', message: `${cid}: strong ROAS ${roas.toFixed(2)} with scale potential.` });
    }
    for (const exp of experiments) {
      const ev = (exp.latest_evaluation as Record<string, unknown> | undefined) || {};
      if (String(exp.status || '') === 'running' && Number(ev.lift_pct || 0) > 10 && Number(ev.p_value || 1) < 0.1) {
        next.push({
          level: 'opportunity',
          message: `${String(exp.name || 'Experiment')}: statistically promising lift detected (${Number(ev.lift_pct || 0).toFixed(2)}%).`,
        });
      }
    }
    return next.slice(0, 6);
  }, [campaignSummary.rows, experiments]);

  const playbooks = useMemo(() => [
    {
      title: 'Loss Cutter',
      rule: 'Pause if spend >= $50 and CTR < 1.2%',
      action: 'pause',
    },
    {
      title: 'Scale Winner',
      rule: 'Scale if ROAS >= 2.2 and daily increase cap <= 20%',
      action: 'scale_budget',
    },
    {
      title: 'Creative Refresh',
      rule: 'Refresh if ROAS < 1.2 after $30 spend',
      action: 'refresh_creative',
    },
  ], []);

  const applyGuardrailedActions = async () => {
    if (!guardrailsAccepted) {
      setCopilotStatus('Accept guardrails before execution.');
      return;
    }

    const safeActions = optimizerActions.filter((action) => {
      const type = String(action.action || '');
      const roas = Number(action.roas || 0);
      const ctr = Number(action.ctr || 0);
      const spend = Number(action.spend || 0);
      const delta = Number(action.delta_percent || 0);
      if (type === 'pause') return spend >= 50 && ctr < 1.2;
      if (type === 'scale_budget') return roas >= 2.2 && delta <= 20;
      if (type === 'refresh_creative') return spend >= 30 && roas < 1.2;
      return false;
    });

    if (!safeActions.length) {
      setCopilotStatus('No guardrail-compliant actions available.');
      return;
    }

    setCopilotRunning(true);
    setCopilotStatus('Executing safe actions...');
    try {
      const result = await executeCopilotActions({
        userId: userId,
        orgId: orgId,
        actions: safeActions,
        guardrails: {
          min_roas: 1.2,
          max_scale_pct: 20,
          min_spend_for_pause: 50,
          min_ctr_for_pause: 1.2,
        },
      });
      setCopilotStatus(`Execution complete: applied ${result.applied_count}, skipped by guardrail ${result.skipped_guardrail_count}.`);
      await load();
    } catch (err) {
      setCopilotStatus(err instanceof Error ? err.message : 'Execution failed.');
    } finally {
      setCopilotRunning(false);
    }
  };

  const persistAnalyticsControls = async () => {
    try {
      await upsertAnalyticsPreferences({
        orgId: orgId,
        actorUserId: userId,
        settings: {
          role_filter: roleFilter,
          user_filter: userFilter,
          sla_sync_stale_minutes: slaSyncStaleMinutes,
          sla_dlq_threshold_15m: slaDlqThreshold15m,
          forecast_horizon_days: forecastHorizonDays,
        },
      });
      setPreferencesStatus('Analytics controls saved for org.');
      await load();
    } catch (err) {
      setPreferencesStatus(err instanceof Error ? err.message : 'Failed to save analytics controls.');
    }
  };

  const addRoutingRule = () => {
    setRoutingRoutes((prev) => [
      ...prev,
      {
        route_id: crypto.randomUUID(),
        channel: 'inapp',
        target: 'growth-ops',
        severities: ['warning', 'critical'],
        event_types: ['sla', 'anomaly'],
        enabled: true,
        cooldown_minutes: 30,
        retry_attempts: 2,
        retry_backoff_seconds: 15,
        failover_route_id: '',
      },
    ]);
  };

  const updateRoutingRule = (routeId: string, patch: Partial<AlertRoute>) => {
    setRoutingRoutes((prev) => prev.map((route) => (route.route_id === routeId ? { ...route, ...patch } : route)));
  };

  const toggleRuleValue = (routeId: string, field: 'severities' | 'event_types', value: string) => {
    setRoutingRoutes((prev) =>
      prev.map((route) => {
        if (route.route_id !== routeId) return route;
        const arr = Array.isArray(route[field]) ? [...route[field]] : [];
        const next = arr.includes(value) ? arr.filter((item) => item !== value) : [...arr, value];
        return { ...route, [field]: next };
      }),
    );
  };

  const saveRoutingRules = async () => {
    try {
      await upsertAlertRouting({ orgId: orgId, actorUserId: userId, routes: routingRoutes });
      setRoutingStatus('Alert routing saved.');
    } catch (err) {
      setRoutingStatus(err instanceof Error ? err.message : 'Failed to save routing.');
    }
  };

  const runDispatch = async () => {
    try {
      const result = await dispatchAlerts({ orgId: orgId, actorUserId: userId });
      setDispatchStatus(`Dispatched ${result.deliveries_count} deliveries from ${result.alerts_count} alerts. Skipped duplicates: ${result.skipped_duplicates}.`);
      setDispatchSummary(result as unknown as Record<string, unknown>);
      await load();
    } catch (err) {
      setDispatchStatus(err instanceof Error ? err.message : 'Dispatch failed.');
    }
  };

  const saveEscalation = async () => {
    try {
      setSuppressionValidation(null);
      setOnCallValidation(null);
      await upsertEscalationPolicy({
        orgId: orgId,
        actorUserId: userId,
        policy: escalationPolicy,
        suppressionWindowsJson: suppressionJson,
        onCallScheduleJson: onCallJson,
      });
      setEscalationStatus('Escalation policy saved.');
      await load();
    } catch (err) {
      if (err instanceof ApiRequestError && err.detail) {
        const field = String(err.detail.field || '');
        const payload = {
          message: err.message,
          line: typeof err.detail.line === 'number' ? err.detail.line : undefined,
          lineText: typeof err.detail.line_text === 'string' ? err.detail.line_text : undefined,
          pointer: typeof err.detail.pointer === 'string' ? err.detail.pointer : undefined,
        };
        if (field === 'suppression_windows') {
          setSuppressionValidation(payload);
        } else if (field === 'on_call_schedule') {
          setOnCallValidation(payload);
        }
      }
      setEscalationStatus(err instanceof Error ? err.message : 'Failed to save escalation policy.');
    }
  };

  const jumpToErrorLine = (field: 'suppression' | 'oncall') => {
    const targetValidation = field === 'suppression' ? suppressionValidation : onCallValidation;
    const textarea = field === 'suppression' ? suppressionTextareaRef.current : onCallTextareaRef.current;
    if (!textarea || !targetValidation?.line || targetValidation.line < 1) return;

    const text = textarea.value || '';
    const lines = text.split('\n');
    const targetLineIndex = Math.min(targetValidation.line - 1, Math.max(lines.length - 1, 0));

    let start = 0;
    for (let i = 0; i < targetLineIndex; i += 1) {
      start += lines[i].length + 1;
    }
    const end = start + (lines[targetLineIndex]?.length ?? 0);

    textarea.focus();
    textarea.setSelectionRange(start, end);
    const lineHeight = Number.parseFloat(getComputedStyle(textarea).lineHeight || '16');
    textarea.scrollTop = Math.max(0, targetLineIndex * (Number.isFinite(lineHeight) ? lineHeight : 16) - 24);
    setActiveJumpTarget(field);
    window.setTimeout(() => setActiveJumpTarget((prev) => (prev === field ? null : prev)), 1200);
  };

  const acknowledgeEvent = async (eventId: string) => {
    try {
      await ackAlertEvent({ orgId: orgId, actorUserId: userId, eventId });
      await load();
    } catch (err) {
      setDispatchStatus(err instanceof Error ? err.message : 'Acknowledge failed.');
    }
  };

  if (authLoading) {
    return <main className="min-h-screen bg-[#020612]" />;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020612] text-slate-100">
      <div className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-40 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-slate-700/60 bg-slate-900/40 p-5 backdrop-blur-xl"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" /> ConversionCraft Command Center
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Live Growth Intelligence</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Revenue, spend, optimization actions, and experimentation state refreshed every 15 seconds.
              </p>
              <p className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[11px] ${workerStatus === 'online' ? 'border-emerald-300/40 bg-emerald-500/10 text-emerald-200' : 'border-rose-300/40 bg-rose-500/10 text-rose-200'}`}>
                Worker API: {workerStatus === 'online' ? 'fetch successful' : 'offline'}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <SessionControls auth={auth} onSessionChanged={setAuth} compact />
              <div className="flex gap-2">
                <button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs hover:bg-slate-800">
                  <RefreshCw className="h-3.5 w-3.5" /> Refresh
                </button>
                <Link href="/os" className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs hover:bg-slate-800">Back to OS</Link>
              </div>
            </div>
          </div>
        </motion.section>

        {error && <p className="mt-4 rounded-xl border border-rose-400/40 bg-rose-500/10 p-3 text-xs text-rose-200">{error}</p>}

        <section className="mt-4 grid gap-3 md:grid-cols-5">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
            >
              <SpotlightCard className="p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">{stat.label}</p>
                <p className="mt-1 text-3xl font-semibold text-slate-50">{stat.value}</p>
              </SpotlightCard>
            </motion.div>
          ))}
        </section>

        <section className="mt-4 rounded-2xl border border-slate-700/70 bg-slate-900/45 p-4 backdrop-blur">
          <h2 className="inline-flex items-center gap-2 text-sm font-semibold"><TrendingUp className="h-4 w-4 text-cyan-300" /> Campaign State Sync</h2>
          {loading ? (
            <p className="mt-2 text-xs text-slate-400">Loading...</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400">
                  <tr>
                    <th className="py-2">Platform</th>
                    <th className="py-2">Campaign</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Budget</th>
                    <th className="py-2">Spend</th>
                    <th className="py-2">ROAS</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignSummary.rows.map((row, i) => {
                    const metrics = (row.last_metrics as Record<string, unknown> | undefined) || {};
                    return (
                      <tr key={`${String(row.campaign_id || i)}-${String(row.platform || '')}`} className="border-t border-slate-800/80">
                        <td className="py-2">{String(row.platform || '-')}</td>
                        <td className="py-2">{String(row.campaign_id || '-')}</td>
                        <td className="py-2">{String(row.status || '-')}</td>
                        <td className="py-2">${Number(row.daily_budget || 0).toFixed(2)}</td>
                        <td className="py-2">${Number(metrics.spend || 0).toFixed(2)}</td>
                        <td className="py-2">{String(metrics.roas || '-')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-700/70 bg-slate-900/45 p-4 backdrop-blur">
            <h2 className="text-sm font-semibold">Cohort LTV</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400">
                  <tr>
                    <th className="py-2">Cohort</th>
                    <th className="py-2">Customers</th>
                    <th className="py-2">Revenue</th>
                    <th className="py-2">LTV</th>
                  </tr>
                </thead>
                <tbody>
                  {attribution.cohorts.map((row, i) => (
                    <tr key={`${String(row.cohort_month || i)}`} className="border-t border-slate-800/80">
                      <td className="py-2">{String(row.cohort_month || '-')}</td>
                      <td className="py-2">{String(row.customers || '0')}</td>
                      <td className="py-2">${Number(row.revenue || 0).toFixed(2)}</td>
                      <td className="py-2">${Number(row.ltv || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700/70 bg-slate-900/45 p-4 backdrop-blur">
            <h2 className="text-sm font-semibold">Phase 5 Experiments</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400">
                  <tr>
                    <th className="py-2">Name</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Winner</th>
                    <th className="py-2">Lift %</th>
                    <th className="py-2">P-value</th>
                  </tr>
                </thead>
                <tbody>
                  {experiments.map((exp, i) => {
                    const ev = (exp.latest_evaluation as Record<string, unknown> | undefined) || {};
                    return (
                      <tr key={`${String(exp.experiment_id || i)}`} className="border-t border-slate-800/80">
                        <td className="py-2">{String(exp.name || '-')}</td>
                        <td className="py-2">{String(exp.status || '-')}</td>
                        <td className="py-2">{String(exp.winner_variant_id || ev.top_variant_id || '-')}</td>
                        <td className="py-2">{Number(ev.lift_pct || 0).toFixed(2)}</td>
                        <td className="py-2">{String(ev.p_value ?? '-')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_1fr]">
          <div className="rounded-2xl border border-slate-700/70 bg-slate-900/45 p-4 backdrop-blur">
            <h2 className="inline-flex items-center gap-2 text-sm font-semibold"><AlertTriangle className="h-4 w-4 text-amber-300" /> Revenue Ops Copilot Alerts</h2>
            <div className="mt-3 space-y-2">
              {alerts.length ? alerts.map((alert, idx) => (
                <p key={`${alert.level}-${idx}`} className={`rounded-lg border px-3 py-2 text-xs ${
                  alert.level === 'critical'
                    ? 'border-rose-400/40 bg-rose-500/10 text-rose-200'
                    : alert.level === 'warning'
                      ? 'border-amber-400/40 bg-amber-500/10 text-amber-100'
                      : 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100'
                }`}
                >
                  {alert.message}
                </p>
              )) : <p className="text-xs text-slate-400">No high-risk alerts right now.</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700/70 bg-slate-900/45 p-4 backdrop-blur">
            <h2 className="inline-flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4 text-cyan-300" /> Playbooks + One-Click Execution</h2>
            <div className="mt-3 space-y-2">
              {playbooks.map((playbook) => (
                <div key={playbook.title} className="rounded-lg border border-slate-700 bg-slate-950/60 p-2">
                  <p className="text-xs font-semibold">{playbook.title}</p>
                  <p className="text-[11px] text-slate-400">{playbook.rule}</p>
                </div>
              ))}
            </div>
            <label className="mt-3 flex items-center gap-2 text-xs text-slate-300">
              <input type="checkbox" checked={guardrailsAccepted} onChange={(e) => setGuardrailsAccepted(e.target.checked)} />
              Enforce ROAS/CTR/spend caps before executing actions.
            </label>
            <button
              type="button"
              disabled={copilotRunning}
              onClick={() => void applyGuardrailedActions()}
              className="mt-3 rounded-xl bg-emerald-400 px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-60"
            >
              {copilotRunning ? 'Applying...' : 'Apply Guardrailed Actions'}
            </button>
            {copilotStatus && <p className="mt-2 text-xs text-cyan-200">{copilotStatus}</p>}
          </div>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl border border-slate-700/70 bg-slate-900/45 p-4 backdrop-blur">
            <h2 className="inline-flex items-center gap-2 text-sm font-semibold"><BarChart3 className="h-4 w-4 text-cyan-300" /> Phase 7 Team + Org Drilldowns</h2>
            <p className="mt-2 text-xs text-slate-400">
              Org {String(enterpriseOrg.name || orgId)} • Members {String(enterpriseOrg.members || 0)} • Campaigns {String(enterpriseOrg.campaigns || 0)}
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400">
                  <tr>
                    <th className="py-2">User</th>
                    <th className="py-2">Role</th>
                    <th className="py-2">Spend</th>
                    <th className="py-2">Revenue</th>
                    <th className="py-2">ROAS</th>
                  </tr>
                </thead>
                <tbody>
                  {teamRows.map((row, idx) => (
                    <tr key={`${String(row.user_id || idx)}`} className="border-t border-slate-800/80">
                      <td className="py-2">{String(row.user_id || '-')}</td>
                      <td className="py-2">{String(row.role || '-')}</td>
                      <td className="py-2">${Number(row.spend || 0).toFixed(2)}</td>
                      <td className="py-2">${Number(row.revenue || 0).toFixed(2)}</td>
                      <td className="py-2">{row.roas == null ? '-' : String(row.roas)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700/70 bg-slate-900/45 p-4 backdrop-blur">
            <h2 className="text-sm font-semibold">Role Rollup</h2>
            <div className="mt-3 space-y-2">
              {roleRows.map((row, idx) => (
                <div key={`${String(row.role || idx)}`} className="rounded-lg border border-slate-700 bg-slate-950/60 p-2 text-xs">
                  <p className="font-semibold">{String(row.role || '-')}</p>
                  <p className="text-slate-400">Members {String(row.members || 0)} • Spend ${Number(row.spend || 0).toFixed(2)} • Revenue ${Number(row.revenue || 0).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-2xl border border-slate-700/70 bg-slate-900/45 p-4 backdrop-blur">
          <h2 className="inline-flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4 text-cyan-300" /> Phase 7.1 Analytics Controls</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-5">
            <label className="text-xs">
              Role Filter
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as AnalyticsPreferences['role_filter'])} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-2 py-1.5">
                <option value="all">all</option>
                <option value="viewer">viewer</option>
                <option value="analyst">analyst</option>
                <option value="marketer">marketer</option>
                <option value="admin">admin</option>
                <option value="owner">owner</option>
              </select>
            </label>
            <label className="text-xs">
              User Filter
              <select value={userFilter} onChange={(e) => setUserFilter(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-2 py-1.5">
                <option value="all">all</option>
                {teamRows.map((row) => (
                  <option key={String(row.user_id)} value={String(row.user_id)}>{String(row.user_id)}</option>
                ))}
              </select>
            </label>
            <label className="text-xs">
              Stale Sync Min
              <input type="number" min={5} max={240} value={slaSyncStaleMinutes} onChange={(e) => setSlaSyncStaleMinutes(Number(e.target.value || 30))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-2 py-1.5" />
            </label>
            <label className="text-xs">
              DLQ Threshold (15m)
              <input type="number" min={0} max={100} value={slaDlqThreshold15m} onChange={(e) => setSlaDlqThreshold15m(Number(e.target.value || 0))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-2 py-1.5" />
            </label>
            <label className="text-xs">
              Forecast Horizon (days)
              <input type="number" min={1} max={30} value={forecastHorizonDays} onChange={(e) => setForecastHorizonDays(Number(e.target.value || 7))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-2 py-1.5" />
            </label>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button type="button" onClick={() => void persistAnalyticsControls()} className="rounded-xl bg-cyan-400 px-3 py-2 text-xs font-semibold text-slate-950">Save Controls</button>
            {preferencesStatus && <p className="text-xs text-cyan-200">{preferencesStatus}</p>}
          </div>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[1.05fr_1fr]">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-slate-700/70 bg-gradient-to-br from-slate-900/60 via-slate-900/45 to-cyan-900/20 p-4 backdrop-blur"
          >
            <h2 className="inline-flex items-center gap-2 text-sm font-semibold"><BarChart3 className="h-4 w-4 text-cyan-300" /> Phase 7.2 Org Comparison Views</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                value={orgCompareInput}
                onChange={(e) => setOrgCompareInput(e.target.value)}
                placeholder="org-1,org-2"
                className="min-w-[260px] flex-1 rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-1.5 text-xs"
              />
              <button type="button" onClick={() => void load()} className="rounded-lg border border-cyan-300/40 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-200">
                Re-Compare
              </button>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400">
                  <tr>
                    <th className="py-2">Org</th>
                    <th className="py-2">Members</th>
                    <th className="py-2">Revenue</th>
                    <th className="py-2">Spend</th>
                    <th className="py-2">ROAS</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, idx) => (
                    <tr key={`${String(row.org_id || idx)}`} className="border-t border-slate-800/80">
                      <td className="py-2">{String(row.org_name || row.org_id || '-')}</td>
                      <td className="py-2">{String(row.members || 0)}</td>
                      <td className="py-2">${Number(row.revenue || 0).toFixed(2)}</td>
                      <td className="py-2">${Number(row.spend || 0).toFixed(2)}</td>
                      <td className="py-2">{row.roas == null ? '-' : String(row.roas)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl border border-slate-700/70 bg-gradient-to-br from-slate-900/60 via-slate-900/45 to-emerald-900/20 p-4 backdrop-blur"
          >
            <h2 className="inline-flex items-center gap-2 text-sm font-semibold"><AlertTriangle className="h-4 w-4 text-amber-300" /> KPI Anomaly Detection</h2>
            <div className="mt-3 space-y-2">
              {anomalies.length ? anomalies.slice(0, 8).map((item, idx) => (
                <p
                  key={`${String(item.type || idx)}-${idx}`}
                  className={`rounded-lg border px-3 py-2 text-xs ${String(item.severity) === 'critical' ? 'border-rose-400/40 bg-rose-500/10 text-rose-200' : 'border-amber-400/40 bg-amber-500/10 text-amber-100'}`}
                >
                  {String(item.type || 'anomaly')} • user {String(item.user_id || '-')} • {String(item.kpi || '-')}={String(item.value ?? '-')}
                </p>
              )) : <p className="text-xs text-slate-400">No KPI anomalies detected.</p>}
            </div>
          </motion.div>
        </section>

        <section className="mt-4 rounded-2xl border border-slate-700/70 bg-gradient-to-r from-slate-900/50 via-slate-900/45 to-indigo-900/20 p-4 backdrop-blur">
          <h2 className="inline-flex items-center gap-2 text-sm font-semibold"><BellRing className="h-4 w-4 text-cyan-300" /> Alert Routing + Dispatch</h2>
          <div className="mt-3 space-y-3">
            {routingRoutes.map((route) => (
              <div key={route.route_id} className="rounded-xl border border-slate-700 bg-slate-950/60 p-3">
                <div className="grid gap-3 md:grid-cols-[160px_minmax(0,1fr)_120px]">
                  <select
                    value={route.channel}
                    onChange={(e) => updateRoutingRule(route.route_id, { channel: e.target.value as AlertRoute['channel'] })}
                    className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs"
                  >
                    <option value="email">email</option>
                    <option value="slack">slack</option>
                    <option value="webhook">webhook</option>
                    <option value="inapp">inapp</option>
                  </select>
                  <input
                    value={route.target}
                    onChange={(e) => updateRoutingRule(route.route_id, { target: e.target.value })}
                    className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs"
                    placeholder="target destination"
                  />
                  <label className="inline-flex items-center gap-2 text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={route.enabled}
                      onChange={(e) => updateRoutingRule(route.route_id, { enabled: e.target.checked })}
                    />
                    Enabled
                  </label>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                  <input
                    type="number"
                    min={0}
                    max={1440}
                    value={route.cooldown_minutes}
                    onChange={(e) => updateRoutingRule(route.route_id, { cooldown_minutes: Number(e.target.value || 0) })}
                    className="w-28 rounded-full border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-slate-200"
                    title="Cooldown minutes"
                  />
                  <button type="button" onClick={() => toggleRuleValue(route.route_id, 'severities', 'warning')} className={`rounded-full border px-2 py-1 ${route.severities.includes('warning') ? 'border-amber-300/50 bg-amber-500/15 text-amber-200' : 'border-slate-700 text-slate-400'}`}>warning</button>
                  <button type="button" onClick={() => toggleRuleValue(route.route_id, 'severities', 'critical')} className={`rounded-full border px-2 py-1 ${route.severities.includes('critical') ? 'border-rose-300/50 bg-rose-500/15 text-rose-200' : 'border-slate-700 text-slate-400'}`}>critical</button>
                  <button type="button" onClick={() => toggleRuleValue(route.route_id, 'event_types', 'sla')} className={`rounded-full border px-2 py-1 ${route.event_types.includes('sla') ? 'border-cyan-300/50 bg-cyan-500/15 text-cyan-200' : 'border-slate-700 text-slate-400'}`}>sla</button>
                  <button type="button" onClick={() => toggleRuleValue(route.route_id, 'event_types', 'anomaly')} className={`rounded-full border px-2 py-1 ${route.event_types.includes('anomaly') ? 'border-cyan-300/50 bg-cyan-500/15 text-cyan-200' : 'border-slate-700 text-slate-400'}`}>anomaly</button>
                  <input
                    type="number"
                    min={0}
                    max={5}
                    value={route.retry_attempts || 2}
                    onChange={(e) => updateRoutingRule(route.route_id, { retry_attempts: Number(e.target.value || 0) })}
                    className="w-20 rounded-full border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-slate-200"
                    title="Retry attempts"
                  />
                  <input
                    type="number"
                    min={0}
                    max={600}
                    value={route.retry_backoff_seconds || 15}
                    onChange={(e) => updateRoutingRule(route.route_id, { retry_backoff_seconds: Number(e.target.value || 0) })}
                    className="w-24 rounded-full border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-slate-200"
                    title="Retry backoff seconds"
                  />
                  <select
                    value={route.failover_route_id || ''}
                    onChange={(e) => updateRoutingRule(route.route_id, { failover_route_id: e.target.value })}
                    className="rounded-full border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-slate-200"
                    title="Failover route"
                  >
                    <option value="">no-failover</option>
                    {routingRoutes
                      .filter((candidate) => candidate.route_id !== route.route_id)
                      .map((candidate) => (
                        <option key={`${route.route_id}-${candidate.route_id}`} value={candidate.route_id}>
                          {candidate.channel}:{candidate.target || candidate.route_id.slice(0, 6)}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={addRoutingRule} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs">Add Rule</button>
            <button type="button" onClick={() => void saveRoutingRules()} className="rounded-lg border border-cyan-300/40 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-200">Save Routing</button>
            <button type="button" onClick={() => void runDispatch()} className="rounded-lg bg-emerald-400 px-3 py-1.5 text-xs font-semibold text-slate-950">Dispatch Alerts</button>
          </div>
          {(routingStatus || dispatchStatus) && (
            <p className="mt-2 text-xs text-cyan-200">{routingStatus || dispatchStatus}</p>
          )}
          {dispatchSummary && (
            <div className="mt-2 text-[11px] text-slate-300">
              <p>Retries: {String(dispatchSummary.retried_deliveries || 0)} • Failover: {String(dispatchSummary.failover_deliveries || 0)} • Failed: {String(dispatchSummary.failed_deliveries || 0)}</p>
              <p>Escalation: {Boolean(dispatchSummary.escalation_triggered) ? 'triggered' : Boolean(dispatchSummary.escalation_suppressed) ? 'suppressed' : 'not triggered'}</p>
            </div>
          )}
          <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/50 p-3">
            <p className="text-xs font-semibold text-slate-200">Alert Event Inbox</p>
            <div className="mt-2 space-y-2">
              {alertEvents.length ? alertEvents.slice(0, 10).map((event) => (
                <div key={String(event.event_id)} className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/70 px-2 py-2 text-[11px]">
                  <span className="text-slate-300">
                    {String(event.scope || '-')} • {String(event.severity || '-')} • {String(event.channel || '-')} • {String(event.target || '-')}
                  </span>
                  {String(event.status || 'dispatched') === 'acknowledged' ? (
                    <span className="rounded-full border border-emerald-300/40 bg-emerald-500/10 px-2 py-0.5 text-emerald-200">acked</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void acknowledgeEvent(String(event.event_id))}
                      className="rounded-lg border border-slate-600 bg-slate-900 px-2 py-1 text-[11px]"
                    >
                      Ack
                    </button>
                  )}
                </div>
              )) : <p className="text-xs text-slate-500">No dispatched alerts yet.</p>}
            </div>
          </div>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-700/70 bg-slate-900/45 p-4 backdrop-blur">
            <h2 className="inline-flex items-center gap-2 text-sm font-semibold"><BellRing className="h-4 w-4 text-cyan-300" /> Escalation Policy</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2 text-xs">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={escalationPolicy.enabled}
                  onChange={(e) => setEscalationPolicy((prev) => ({ ...prev, enabled: e.target.checked }))}
                />
                Enabled
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={escalationPolicy.include_sla}
                  onChange={(e) => setEscalationPolicy((prev) => ({ ...prev, include_sla: e.target.checked }))}
                />
                Include SLA
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={escalationPolicy.include_anomaly}
                  onChange={(e) => setEscalationPolicy((prev) => ({ ...prev, include_anomaly: e.target.checked }))}
                />
                Include Anomaly
              </label>
              <label>
                Critical Threshold
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={escalationPolicy.repeated_critical_threshold}
                  onChange={(e) => setEscalationPolicy((prev) => ({ ...prev, repeated_critical_threshold: Number(e.target.value || 1) }))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-2 py-1.5"
                />
              </label>
              <label>
                Window Minutes
                <input
                  type="number"
                  min={5}
                  max={1440}
                  value={escalationPolicy.window_minutes}
                  onChange={(e) => setEscalationPolicy((prev) => ({ ...prev, window_minutes: Number(e.target.value || 60) }))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-2 py-1.5"
                />
              </label>
              <label>
                Owner Channel
                <select
                  value={escalationPolicy.page_owner_channel}
                  onChange={(e) => setEscalationPolicy((prev) => ({ ...prev, page_owner_channel: e.target.value as EscalationPolicy['page_owner_channel'] }))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-2 py-1.5"
                >
                  <option value="inapp">inapp</option>
                  <option value="email">email</option>
                  <option value="slack">slack</option>
                  <option value="webhook">webhook</option>
                </select>
              </label>
              <label className="md:col-span-2">
                Owner Target
                <input
                  value={escalationPolicy.page_owner_target}
                  onChange={(e) => setEscalationPolicy((prev) => ({ ...prev, page_owner_target: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-2 py-1.5"
                  placeholder="owner@example.com or #ops-critical"
                />
              </label>
              <label className="md:col-span-2">
                Suppression Windows (JSON)
                <textarea
                  ref={suppressionTextareaRef}
                  value={suppressionJson}
                  onChange={(e) => {
                    setSuppressionJson(e.target.value);
                    setSuppressionValidation(null);
                  }}
                  rows={4}
                  className={`mt-1 w-full rounded-lg border bg-slate-950/70 px-2 py-1.5 font-mono text-[11px] ${activeJumpTarget === 'suppression' ? 'border-cyan-300/70 ring-1 ring-cyan-300/40' : 'border-slate-700'}`}
                  placeholder='[{"days":["saturday","sunday"],"start_hour":0,"end_hour":24,"tz_offset":"+00:00","scopes":["sla"],"severities":["critical"]}]'
                />
                {suppressionValidation && (
                  <div className="mt-2 rounded-lg border border-rose-400/40 bg-rose-500/10 p-2 text-[11px] text-rose-200">
                    <p>{suppressionValidation.message}</p>
                    {suppressionValidation.line && (
                      <button
                        type="button"
                        onClick={() => jumpToErrorLine('suppression')}
                        className="mt-1 rounded border border-rose-300/40 bg-rose-950/30 px-2 py-0.5 text-[11px] text-rose-100 hover:bg-rose-950/50"
                      >
                        Jump to line {suppressionValidation.line}
                      </button>
                    )}
                    {suppressionValidation.lineText && <pre className="mt-1 overflow-auto whitespace-pre-wrap font-mono">{suppressionValidation.lineText}</pre>}
                    {suppressionValidation.pointer && <pre className="overflow-auto whitespace-pre-wrap font-mono">{suppressionValidation.pointer}</pre>}
                  </div>
                )}
              </label>
              <label className="md:col-span-2">
                On-Call Schedule (JSON)
                <textarea
                  ref={onCallTextareaRef}
                  value={onCallJson}
                  onChange={(e) => {
                    setOnCallJson(e.target.value);
                    setOnCallValidation(null);
                  }}
                  rows={4}
                  className={`mt-1 w-full rounded-lg border bg-slate-950/70 px-2 py-1.5 font-mono text-[11px] ${activeJumpTarget === 'oncall' ? 'border-cyan-300/70 ring-1 ring-cyan-300/40' : 'border-slate-700'}`}
                  placeholder='[{"days":["monday","tuesday"],"start_hour":9,"end_hour":18,"tz_offset":"+00:00","channel":"slack","target":"#oncall-growth"}]'
                />
                {onCallValidation && (
                  <div className="mt-2 rounded-lg border border-rose-400/40 bg-rose-500/10 p-2 text-[11px] text-rose-200">
                    <p>{onCallValidation.message}</p>
                    {onCallValidation.line && (
                      <button
                        type="button"
                        onClick={() => jumpToErrorLine('oncall')}
                        className="mt-1 rounded border border-rose-300/40 bg-rose-950/30 px-2 py-0.5 text-[11px] text-rose-100 hover:bg-rose-950/50"
                      >
                        Jump to line {onCallValidation.line}
                      </button>
                    )}
                    {onCallValidation.lineText && <pre className="mt-1 overflow-auto whitespace-pre-wrap font-mono">{onCallValidation.lineText}</pre>}
                    {onCallValidation.pointer && <pre className="overflow-auto whitespace-pre-wrap font-mono">{onCallValidation.pointer}</pre>}
                  </div>
                )}
              </label>
            </div>
            <div className="mt-3">
              <button type="button" onClick={() => void saveEscalation()} className="rounded-lg border border-cyan-300/40 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-200">Save Escalation Policy</button>
              {escalationStatus && <p className="mt-2 text-xs text-cyan-200">{escalationStatus}</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700/70 bg-slate-900/45 p-4 backdrop-blur">
            <h2 className="inline-flex items-center gap-2 text-sm font-semibold"><AlertTriangle className="h-4 w-4 text-amber-300" /> SLA MTTA / MTTR</h2>
            <div className="mt-3 grid gap-2 text-xs">
              <p className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2">Open Breaches: {String(slaMetrics?.open_breaches ?? 0)}</p>
              <p className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2">Resolved Breaches: {String(slaMetrics?.resolved_breaches ?? 0)}</p>
              <p className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2">MTTA (min): {slaMetrics?.mtta_minutes == null ? '-' : String(slaMetrics?.mtta_minutes)}</p>
              <p className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2">MTTR (min): {slaMetrics?.mttr_minutes == null ? '-' : String(slaMetrics?.mttr_minutes)}</p>
            </div>
            <div className="mt-3 max-h-40 overflow-auto space-y-2">
              {slaBreaches.slice(0, 8).map((breach) => (
                <p key={String(breach.breach_id)} className="rounded-lg border border-slate-800 bg-slate-950/60 px-2 py-1 text-[11px] text-slate-300">
                  {String(breach.type)} • {String(breach.status)} • opened {String(breach.opened_at || '-')}
                </p>
              ))}
              {!slaBreaches.length && <p className="text-xs text-slate-500">No breach history yet.</p>}
            </div>
          </div>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-700/70 bg-slate-900/45 p-4 backdrop-blur">
            <h2 className="inline-flex items-center gap-2 text-sm font-semibold"><AlertTriangle className="h-4 w-4 text-amber-300" /> SLA Alerts</h2>
            <div className="mt-3 space-y-2">
              {slaAlerts.length ? slaAlerts.map((alert, idx) => (
                <p key={`${String(alert.type || idx)}`} className={`rounded-lg border px-3 py-2 text-xs ${String(alert.severity) === 'critical' ? 'border-rose-400/40 bg-rose-500/10 text-rose-200' : 'border-amber-400/40 bg-amber-500/10 text-amber-100'}`}>
                  {String(alert.type || 'alert')} • Count {String(alert.count || 0)}
                </p>
              )) : <p className="text-xs text-slate-400">All SLAs healthy.</p>}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-700/70 bg-slate-900/45 p-4 backdrop-blur">
            <h2 className="inline-flex items-center gap-2 text-sm font-semibold"><TrendingUp className="h-4 w-4 text-emerald-300" /> Forecast Blocks</h2>
            <div className="mt-3 grid gap-2 text-xs">
              <p className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2">Projected Spend ({String(enterpriseForecast.horizon_days || forecastHorizonDays)}d): ${Number(enterpriseForecast.projected_spend || 0).toFixed(2)}</p>
              <p className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2">Projected Revenue ({String(enterpriseForecast.horizon_days || forecastHorizonDays)}d): ${Number(enterpriseForecast.projected_revenue || 0).toFixed(2)}</p>
              <p className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2">Projected ROAS: {enterpriseForecast.projected_roas == null ? '-' : String(enterpriseForecast.projected_roas)}</p>
              <p className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2">Confidence: {String(enterpriseForecast.confidence || 'low')}</p>
            </div>
          </div>
        </section>

        <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-gradient-to-r from-cyan-500/10 to-emerald-400/10 p-3 text-xs text-slate-300">
          Realtime ROAS: <span className="font-semibold text-cyan-200">{attributionRoasLabel}</span> • Avg Campaign ROAS:{' '}
          <span className="font-semibold text-emerald-200">{campaignSummary.roas}</span>
        </div>
      </div>
    </main>
  );
}

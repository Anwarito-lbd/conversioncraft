'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Building2, CheckCircle2, ChevronLeft, ChevronRight, ShieldCheck, Sparkles, Users2 } from 'lucide-react';
import { getOnboardingState, getOnboardingStatus, upsertOnboardingState } from '@/services/apiClient';
import { AuthSessionState, resolveActiveSession } from '@/services/authClient';
import SessionControls from '@/components/SessionControls';

type StepId = 'company' | 'connections' | 'brand' | 'governance' | 'launch';

interface OnboardingState {
  currentStep: StepId;
  companyName: string;
  industry: string;
  monthlyRevenueBand: string;
  teamSize: string;
  primaryGoal: string;
  brandTone: string;
  heroPromise: string;
  guardrailRoas: number;
  guardrailMaxBudgetIncrease: number;
  complianceAccepted: boolean;
  billingEmail: string;
  launchMarkets: string;
  launchBudget: number;
}

const defaultState: OnboardingState = {
  currentStep: 'company',
  companyName: '',
  industry: 'DTC Ecommerce',
  monthlyRevenueBand: '$10k-$50k',
  teamSize: '1-5',
  primaryGoal: 'Increase conversion rate',
  brandTone: 'Premium, confident, direct',
  heroPromise: 'Raise conversion while reducing waste spend.',
  guardrailRoas: 1.6,
  guardrailMaxBudgetIncrease: 20,
  complianceAccepted: false,
  billingEmail: '',
  launchMarkets: 'United States, Canada',
  launchBudget: 150,
};

const steps: Array<{ id: StepId; title: string; subtitle: string }> = [
  { id: 'company', title: 'Company Setup', subtitle: 'Business profile and goals' },
  { id: 'connections', title: 'Channel Connections', subtitle: 'OAuth and platform readiness' },
  { id: 'brand', title: 'Brand + Creative DNA', subtitle: 'Voice, message, and conversion promise' },
  { id: 'governance', title: 'Governance', subtitle: 'Guardrails, billing, and compliance' },
  { id: 'launch', title: 'Launch Blueprint', subtitle: 'Markets, budget, and rollout plan' },
];

export default function EnterpriseOnboardingPage() {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthSessionState | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [state, setState] = useState<OnboardingState>(defaultState);
  const [stateVersion, setStateVersion] = useState(0);
  const [status, setStatus] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [persistStatus, setPersistStatus] = useState('Loading saved setup...');
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
      setAuthLoading(false);
    })();
  }, [router]);

  useEffect(() => {
    if (!userId) return;
    void (async () => {
      try {
        const persisted = await getOnboardingState({ userId, orgId });
        if (persisted.state && Object.keys(persisted.state).length) {
          setState({ ...defaultState, ...(persisted.state as unknown as OnboardingState) });
          setStateVersion(Number(persisted.version || 0));
          setPersistStatus('Loaded saved setup.');
        } else {
          setStateVersion(Number(persisted.version || 0));
          setPersistStatus('No previous setup found. Start onboarding.');
        }
        const data = await getOnboardingStatus(userId);
        setStatus(data as unknown as Record<string, unknown>);
      } catch {
        setStatus(null);
        setPersistStatus('Worker API fetch failed. Start worker on :8000.');
      }
    })();
  }, [userId, orgId]);

  useEffect(() => {
    if (!userId) return;
    const timer = window.setTimeout(() => {
      void upsertOnboardingState({
        userId,
        orgId,
        expectedVersion: stateVersion,
        state: state as unknown as Record<string, unknown>,
      }).then((res) => {
        setStateVersion(Number((res.row as Record<string, unknown>).version || stateVersion));
        setPersistStatus('Saved to backend.');
      }).catch(async (err) => {
        if (err instanceof Error && err.message.startsWith('Onboarding version conflict:')) {
          const latest = await getOnboardingState({ userId, orgId });
          setState({ ...defaultState, ...(latest.state as unknown as OnboardingState) });
          setStateVersion(Number(latest.version || 0));
          setPersistStatus('A newer onboarding draft existed. Synced latest.');
          return;
        }
        setPersistStatus('Autosave failed.');
      });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [state, userId, orgId, stateVersion]);

  const stepIndex = useMemo(() => steps.findIndex((s) => s.id === state.currentStep), [state.currentStep]);
  const progressPct = useMemo(() => Math.round(((stepIndex + 1) / steps.length) * 100), [stepIndex]);
  const env = (status?.env as Record<string, boolean> | undefined) || {};
  const connections = (status?.connections as Record<string, boolean> | undefined) || {};

  const goTo = (id: StepId) => setState((prev) => ({ ...prev, currentStep: id }));
  const prevStep = () => {
    if (stepIndex <= 0) return;
    goTo(steps[stepIndex - 1].id);
  };
  const nextStep = () => {
    if (stepIndex >= steps.length - 1) return;
    goTo(steps[stepIndex + 1].id);
  };

  const markComplete = async () => {
    setSaving(true);
    try {
      const saved = await upsertOnboardingState({
        userId,
        orgId,
        expectedVersion: stateVersion,
        state: { ...(state as unknown as Record<string, unknown>), completedAt: new Date().toISOString() },
      });
      setStateVersion(Number((saved.row as Record<string, unknown>).version || stateVersion));
      setPersistStatus('Enterprise onboarding completed and saved.');
    } catch {
      setPersistStatus('Complete action failed to persist.');
    }
    setSaving(false);
  };

  if (authLoading) {
    return <main className="min-h-screen bg-[#020612]" />;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020612] text-slate-100">
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-36 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        <section className="rounded-3xl border border-slate-700/70 bg-slate-900/45 p-5 backdrop-blur-xl md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" /> Phase 6.1 Enterprise Onboarding
              </p>
              <h1 className="text-2xl font-semibold tracking-tight md:text-4xl">Guided Setup Wizard</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-300">
                Structured onboarding with persistent progress across team, channels, governance, and launch controls.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <SessionControls auth={auth} onSessionChanged={setAuth} />
              <div className="rounded-2xl border border-emerald-300/25 bg-slate-900/70 p-4 text-right">
                <p className="text-xs uppercase text-slate-400">Progress</p>
                <p className="text-3xl font-bold text-emerald-300">{progressPct}%</p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/" className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs hover:bg-slate-800">Home</Link>
            <Link href="/os" className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs hover:bg-slate-800">Growth OS</Link>
            <Link href="/dashboard" className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs hover:bg-slate-800">Dashboard</Link>
            <Link href="/studio" className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs hover:bg-slate-800">Studio</Link>
          </div>
        </section>

        <div className="mt-6 grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-slate-700/70 bg-slate-900/45 p-3 backdrop-blur">
            <div className="space-y-2">
              {steps.map((step, idx) => {
                const active = step.id === state.currentStep;
                const done = idx < stepIndex;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => goTo(step.id)}
                    className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                      active ? 'border-cyan-300 bg-cyan-500/10' : 'border-slate-700 bg-slate-900 hover:bg-slate-800'
                    }`}
                  >
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      {done ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <span className="h-2 w-2 rounded-full bg-slate-500" />}
                      {step.title}
                    </p>
                    <p className="text-xs text-slate-400">{step.subtitle}</p>
                  </button>
                );
              })}
            </div>
          </aside>

          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-700/70 bg-slate-900/45 p-5 backdrop-blur">
            <p className="mb-3 text-xs text-slate-400">{persistStatus}</p>
            <AnimatePresence mode="wait">
            {state.currentStep === 'company' && (
              <motion.div key="company" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} className="space-y-4">
                <h2 className="flex items-center gap-2 text-xl font-semibold"><Building2 className="h-5 w-5 text-cyan-300" /> Company Setup</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  <input value={state.companyName} onChange={(e) => setState((p) => ({ ...p, companyName: e.target.value }))} placeholder="Company name" className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2" />
                  <input value={state.industry} onChange={(e) => setState((p) => ({ ...p, industry: e.target.value }))} placeholder="Industry" className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2" />
                  <input value={state.monthlyRevenueBand} onChange={(e) => setState((p) => ({ ...p, monthlyRevenueBand: e.target.value }))} placeholder="Monthly revenue band" className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2" />
                  <input value={state.teamSize} onChange={(e) => setState((p) => ({ ...p, teamSize: e.target.value }))} placeholder="Team size" className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2" />
                </div>
              </motion.div>
            )}

            {state.currentStep === 'connections' && (
              <motion.div key="connections" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} className="space-y-4">
                <h2 className="flex items-center gap-2 text-xl font-semibold"><Users2 className="h-5 w-5 text-cyan-300" /> Channel Connections</h2>
                <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3 text-sm">
                  <p>App Env: Shopify {env.shopify ? 'OK' : 'Missing'} | Meta {env.meta ? 'OK' : 'Missing'} | TikTok {env.tiktok ? 'OK' : 'Missing'}</p>
                  <p className="mt-1">Connections: Shopify {connections.shopify ? 'Connected' : 'Not connected'} | Meta {connections.meta ? 'Connected' : 'Not connected'} | TikTok {connections.tiktok ? 'Connected' : 'Not connected'}</p>
                </div>
                <p className="text-xs text-slate-400">Use Growth OS to complete OAuth and return here; wizard progress is persisted on backend.</p>
              </motion.div>
            )}

            {state.currentStep === 'brand' && (
              <motion.div key="brand" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} className="space-y-4">
                <h2 className="flex items-center gap-2 text-xl font-semibold"><Sparkles className="h-5 w-5 text-cyan-300" /> Brand + Creative DNA</h2>
                <input value={state.primaryGoal} onChange={(e) => setState((p) => ({ ...p, primaryGoal: e.target.value }))} placeholder="Primary goal" className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2" />
                <input value={state.brandTone} onChange={(e) => setState((p) => ({ ...p, brandTone: e.target.value }))} placeholder="Brand tone" className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2" />
                <textarea value={state.heroPromise} onChange={(e) => setState((p) => ({ ...p, heroPromise: e.target.value }))} rows={4} placeholder="Core customer promise" className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2" />
              </motion.div>
            )}

            {state.currentStep === 'governance' && (
              <motion.div key="governance" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} className="space-y-4">
                <h2 className="flex items-center gap-2 text-xl font-semibold"><ShieldCheck className="h-5 w-5 text-cyan-300" /> Governance</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="rounded-xl border border-slate-700 bg-slate-950/60 p-3 text-sm">
                    Min ROAS guardrail
                    <input type="number" step="0.1" value={state.guardrailRoas} onChange={(e) => setState((p) => ({ ...p, guardrailRoas: Number(e.target.value || 0) }))} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5" />
                  </label>
                  <label className="rounded-xl border border-slate-700 bg-slate-950/60 p-3 text-sm">
                    Max budget increase/day (%)
                    <input type="number" value={state.guardrailMaxBudgetIncrease} onChange={(e) => setState((p) => ({ ...p, guardrailMaxBudgetIncrease: Number(e.target.value || 0) }))} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5" />
                  </label>
                </div>
                <input value={state.billingEmail} onChange={(e) => setState((p) => ({ ...p, billingEmail: e.target.value }))} placeholder="Billing email" className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2" />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={state.complianceAccepted} onChange={(e) => setState((p) => ({ ...p, complianceAccepted: e.target.checked }))} />
                  I accept data retention, webhook verification, and immutable audit policy.
                </label>
              </motion.div>
            )}

            {state.currentStep === 'launch' && (
              <motion.div key="launch" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} className="space-y-4">
                <h2 className="flex items-center gap-2 text-xl font-semibold"><CheckCircle2 className="h-5 w-5 text-cyan-300" /> Launch Blueprint</h2>
                <input value={state.launchMarkets} onChange={(e) => setState((p) => ({ ...p, launchMarkets: e.target.value }))} placeholder="Launch markets" className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2" />
                <label className="block text-sm">
                  Initial daily budget
                  <input type="number" value={state.launchBudget} onChange={(e) => setState((p) => ({ ...p, launchBudget: Number(e.target.value || 0) }))} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2" />
                </label>
                <button disabled={saving || !state.complianceAccepted} onClick={() => void markComplete()} className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60">
                  {saving ? 'Saving...' : 'Complete Enterprise Onboarding'}
                </button>
              </motion.div>
            )}
            </AnimatePresence>

            <div className="mt-6 flex items-center justify-between">
              <button onClick={prevStep} disabled={stepIndex === 0} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs disabled:opacity-50">
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <button onClick={nextStep} disabled={stepIndex === steps.length - 1} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs disabled:opacity-50">
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </motion.section>
        </div>
      </div>
    </main>
  );
}

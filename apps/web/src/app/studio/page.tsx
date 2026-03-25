'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Clock3, Lightbulb, Rocket, Sparkles, Wand2 } from 'lucide-react';
import { generateCreativeDraftPhase1 } from '@/services/phase1Service';
import { getStudioState, upsertStudioState } from '@/services/apiClient';
import { AuthSessionState, resolveActiveSession } from '@/services/authClient';
import SessionControls from '@/components/SessionControls';

type Stage = 'concepts' | 'variants' | 'scheduled' | 'posted';

interface PipelineCard {
  id: string;
  title: string;
  hook: string;
  cta: string;
  stage: Stage;
  platform: 'TikTok' | 'Instagram' | 'Facebook';
  scheduledAt?: string;
}

interface StudioState {
  brief: string;
  productName: string;
  cards: PipelineCard[];
}

const defaultState: StudioState = {
  brief: 'Find a high-contrast angle for problem-solution UGC clips with strong urgency CTA.',
  productName: 'Smart posture brace',
  cards: [],
};

const columns: Array<{ id: Stage; title: string; icon: typeof Lightbulb }> = [
  { id: 'concepts', title: 'Concepts', icon: Lightbulb },
  { id: 'variants', title: 'Variants', icon: Wand2 },
  { id: 'scheduled', title: 'Scheduled', icon: Clock3 },
  { id: 'posted', title: 'Posted', icon: CheckCircle2 },
];

const nextStage = (stage: Stage): Stage => {
  if (stage === 'concepts') return 'variants';
  if (stage === 'variants') return 'scheduled';
  if (stage === 'scheduled') return 'posted';
  return 'posted';
};

export default function StudioPage() {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthSessionState | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [state, setState] = useState<StudioState>(defaultState);
  const [stateVersion, setStateVersion] = useState(0);
  const [loading, setLoading] = useState(false);
  const [platform, setPlatform] = useState<'TikTok' | 'Instagram' | 'Facebook'>('TikTok');
  const [persistStatus, setPersistStatus] = useState('Loading pipeline...');
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
        const persisted = await getStudioState({ userId, orgId });
        if (persisted.state && Object.keys(persisted.state).length) {
          setState({ ...defaultState, ...(persisted.state as unknown as StudioState) });
          setStateVersion(Number(persisted.version || 0));
          setPersistStatus('Loaded pipeline from backend.');
        } else {
          setStateVersion(Number(persisted.version || 0));
          setPersistStatus('No saved board. Create your first concept.');
        }
      } catch {
        setPersistStatus('Worker API fetch failed. Start worker on :8000.');
      }
    })();
  }, [userId, orgId]);

  useEffect(() => {
    if (!userId) return;
    const timer = window.setTimeout(() => {
      void upsertStudioState({
        userId,
        orgId,
        expectedVersion: stateVersion,
        state: state as unknown as Record<string, unknown>,
      }).then((res) => {
        setStateVersion(Number((res.row as Record<string, unknown>).version || stateVersion));
        setPersistStatus('Board saved to backend.');
      }).catch(async (err) => {
        if (err instanceof Error && err.message.startsWith('Studio version conflict:')) {
          const latest = await getStudioState({ userId, orgId });
          setState({ ...defaultState, ...(latest.state as unknown as StudioState) });
          setStateVersion(Number(latest.version || 0));
          setPersistStatus('A newer studio board existed. Synced latest.');
          return;
        }
        setPersistStatus('Board autosave failed.');
      });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [state, userId, orgId, stateVersion]);

  const grouped = useMemo(() => {
    const byStage: Record<Stage, PipelineCard[]> = {
      concepts: [],
      variants: [],
      scheduled: [],
      posted: [],
    };
    for (const card of state.cards) byStage[card.stage].push(card);
    return byStage;
  }, [state.cards]);

  const createCard = async () => {
    setLoading(true);
    try {
      const creative = await generateCreativeDraftPhase1(state.productName);
      const card: PipelineCard = {
        id: crypto.randomUUID(),
        title: `${state.productName} Concept`,
        hook: creative.hook,
        cta: creative.cta,
        stage: 'concepts',
        platform,
      };
      setState((prev) => ({ ...prev, cards: [card, ...prev.cards] }));
    } catch {
      const fallback: PipelineCard = {
        id: crypto.randomUUID(),
        title: `${state.productName} Concept`,
        hook: 'Problem-solution hook with 2-second visual proof.',
        cta: 'Tap to claim your launch discount today.',
        stage: 'concepts',
        platform,
      };
      setState((prev) => ({ ...prev, cards: [fallback, ...prev.cards] }));
    } finally {
      setLoading(false);
    }
  };

  const moveCard = (cardId: string) => {
    setState((prev) => ({
      ...prev,
      cards: prev.cards.map((card) => {
        if (card.id !== cardId) return card;
        const target = nextStage(card.stage);
        return {
          ...card,
          stage: target,
          scheduledAt: target === 'scheduled' ? new Date(Date.now() + 60 * 60 * 1000).toISOString() : card.scheduledAt,
        };
      }),
    }));
  };

  if (authLoading) {
    return <main className="min-h-screen bg-[#020612]" />;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020612] text-slate-100">
      <div className="pointer-events-none absolute -left-20 top-16 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-48 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        <section className="rounded-3xl border border-slate-700/70 bg-slate-900/45 p-5 backdrop-blur-xl md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" /> Phase 6.2 Creative Automation Studio
              </p>
              <h1 className="text-2xl font-semibold tracking-tight md:text-4xl">Pipeline Board: Concept → Variant → Schedule → Post</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-300">
                Manage creative ops as a production board with staged promotion and scheduled posting state.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <SessionControls auth={auth} onSessionChanged={setAuth} compact />
              <div className="flex gap-2">
                <Link href="/onboarding" className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs">Onboarding</Link>
                <Link href="/dashboard" className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs">Dashboard</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-slate-700/70 bg-slate-900/45 p-4 backdrop-blur">
          <p className="mb-3 text-xs text-slate-400">{persistStatus}</p>
          <div className="grid gap-3 md:grid-cols-[1.2fr_1fr_180px_180px]">
            <input value={state.productName} onChange={(e) => setState((p) => ({ ...p, productName: e.target.value }))} placeholder="Product name" className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2" />
            <select value={platform} onChange={(e) => setPlatform(e.target.value as 'TikTok' | 'Instagram' | 'Facebook')} className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2">
              <option>TikTok</option>
              <option>Instagram</option>
              <option>Facebook</option>
            </select>
            <button type="button" disabled={loading} onClick={() => void createCard()} className="rounded-xl bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60">
              {loading ? 'Generating...' : 'Create Concept'}
            </button>
            <button type="button" onClick={() => setState(defaultState)} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm">Reset Board</button>
          </div>
          <textarea value={state.brief} onChange={(e) => setState((p) => ({ ...p, brief: e.target.value }))} rows={3} className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm" />
        </section>

        <section className="mt-5 grid gap-4 lg:grid-cols-4">
          {columns.map((column, idx) => (
            <motion.div
              layout
              key={column.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="rounded-2xl border border-slate-700/70 bg-slate-900/45 p-3 backdrop-blur"
            >
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <column.icon className="h-4 w-4 text-cyan-300" /> {column.title}
                <span className="ml-auto rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">{grouped[column.id].length}</span>
              </h2>
              <motion.div layout className="space-y-2">
                <AnimatePresence>
                {grouped[column.id].map((card) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.97, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97, y: -8 }}
                    transition={{ duration: 0.2 }}
                    key={card.id}
                    className="rounded-xl border border-slate-700 bg-slate-950/70 p-3"
                  >
                    <p className="text-sm font-semibold">{card.title}</p>
                    <p className="mt-1 text-xs text-slate-300">{card.hook}</p>
                    <p className="mt-2 text-[11px] text-slate-400">{card.platform}{card.scheduledAt ? ` • ${new Date(card.scheduledAt).toLocaleString()}` : ''}</p>
                    {card.stage !== 'posted' && (
                      <button type="button" onClick={() => moveCard(card.id)} className="mt-2 inline-flex items-center gap-1 rounded-lg bg-emerald-400 px-2 py-1 text-[11px] font-semibold text-slate-950">
                        Promote <Rocket className="h-3 w-3" />
                      </button>
                    )}
                  </motion.div>
                ))}
                </AnimatePresence>
                {!grouped[column.id].length && (
                  <p className="rounded-xl border border-dashed border-slate-700 bg-slate-950/50 p-3 text-xs text-slate-500">No cards</p>
                )}
              </motion.div>
            </motion.div>
          ))}
        </section>
      </div>
    </main>
  );
}

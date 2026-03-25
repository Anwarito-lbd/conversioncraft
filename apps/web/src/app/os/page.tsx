'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Boxes,
  CheckCircle2,
  Compass,
  Link2,
  Loader2,
  PackageSearch,
  Rocket,
  Sparkles,
  Target,
  Video,
} from 'lucide-react';
import ProductCanvas from '@/components/dora/ProductCanvas';
import {
  analyzeCompetitorSite,
  buildCampaignPlan,
  buildOfferStack,
  createOfferExperimentPhase1,
  completePlatformOAuth,
  evaluateOfferExperimentPhase1,
  findSuppliersPhase1,
  findWinningProductsPhase1,
  generateOfferEngineV2Phase1,
  generateCreativeDraftPhase1,
  generateProductModelPhase1,
  getMicroInfluencerPlanPhase1,
  getOnboardingStatusPhase1,
  getRealtimeSnapshotPhase1,
  getTrustChecklistPhase1,
  generateProductPageDraftPhase1,
  publishCampaignDraftPhase1,
  refreshIntegrationStatus,
  runExperimentTrafficSamplePhase1,
  seedSkuCatalogPhase1,
  startPlatformOAuth,
} from '@/services/phase1Service';
import type {
  CampaignObjective,
  CampaignPlan,
  CompetitorInsight,
  CreativeDraft,
  IntegrationAccount,
  IntegrationPlatform,
  OfferStack,
  OfferRecommendationV2,
  MicroInfluencerPlan,
  ProductOpportunity,
  ProductPageDraft,
  PublishResult,
  SupplierCandidate,
  TrustChecklist,
} from '@/types/phase1';
import { AuthSessionState, resolveActiveSession } from '@/services/authClient';
import SessionControls from '@/components/SessionControls';

type StepId = 'connect' | 'intel' | 'product' | 'offer' | 'creative' | 'launch';

const STORAGE_KEY = 'conversioncraft_growth_os_v2';
const PLATFORMS: IntegrationPlatform[] = ['shopify', 'meta', 'tiktok', 'instagram', 'facebook'];

const platformLabel = (platform: IntegrationPlatform) => {
  const map: Record<IntegrationPlatform, string> = {
    shopify: 'Shopify',
    meta: 'Meta Ads',
    tiktok: 'TikTok Ads',
    instagram: 'Instagram',
    facebook: 'Facebook',
  };
  return map[platform];
};

const stepLabels: Array<{ id: StepId; title: string; subtitle: string }> = [
  { id: 'connect', title: 'Connect Channels', subtitle: 'OAuth + token storage' },
  { id: 'intel', title: 'Competitor Intel', subtitle: 'Understand the battlefield' },
  { id: 'product', title: 'Product + Supplier', subtitle: 'Pick winner + source' },
  { id: 'offer', title: 'Offer + Page', subtitle: 'Bundle and page draft' },
  { id: 'creative', title: 'Creative + 3D', subtitle: 'UGC + model preview' },
  { id: 'launch', title: 'Launch + Optimizer', subtitle: 'Campaigns and weekly actions' },
];

function createDefaultIntegrations(): IntegrationAccount[] {
  return PLATFORMS.map((platform) => ({
    platform,
    connected: false,
    accountName: `${platformLabel(platform)} not connected`,
  }));
}

export default function GrowthOsPage() {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthSessionState | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<StepId>('connect');
  const [redirectUri, setRedirectUri] = useState('http://localhost:3000/oauth/callback');
  const userId = auth?.session.user_id || '';

  const [integrations, setIntegrations] = useState<IntegrationAccount[]>(createDefaultIntegrations());
  const [connecting, setConnecting] = useState<Record<string, boolean>>({});
  const [oauthCodes, setOauthCodes] = useState<Record<string, string>>({});
  const [oauthStates, setOauthStates] = useState<Record<string, string>>({});
  const [oauthNonces, setOauthNonces] = useState<Record<string, string>>({});
  const [shopDomain, setShopDomain] = useState('your-shop.myshopify.com');
  const [onboardingEnv, setOnboardingEnv] = useState<Record<string, boolean>>({});
  const [onboardingReady, setOnboardingReady] = useState(false);

  const [competitorUrl, setCompetitorUrl] = useState('');
  const [competitor, setCompetitor] = useState<CompetitorInsight | null>(null);
  const [competitorLoading, setCompetitorLoading] = useState(false);

  const [niche, setNiche] = useState('home gadgets');
  const [products, setProducts] = useState<ProductOpportunity[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductOpportunity | null>(null);

  const [suppliers, setSuppliers] = useState<SupplierCandidate[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierCandidate | null>(null);

  const [supplierUrl, setSupplierUrl] = useState('https://www.aliexpress.com/');
  const [offerStack, setOfferStack] = useState<OfferStack | null>(null);
  const [offerV2, setOfferV2] = useState<OfferRecommendationV2 | null>(null);
  const [pageDraft, setPageDraft] = useState<ProductPageDraft | null>(null);
  const [pageLoading, setPageLoading] = useState(false);

  const [creativeDraft, setCreativeDraft] = useState<CreativeDraft | null>(null);
  const [creativeLoading, setCreativeLoading] = useState(false);

  const [modelUrl, setModelUrl] = useState('https://modelviewer.dev/shared-assets/models/Astronaut.glb');
  const [modelLoading, setModelLoading] = useState(false);

  const [dailyBudget, setDailyBudget] = useState(120);
  const [objective, setObjective] = useState<CampaignObjective>('conversions');
  const [markets, setMarkets] = useState('United States, Canada');
  const [interests, setInterests] = useState('Online shopping, Problem-solving products, UGC videos');
  const [plan, setPlan] = useState<CampaignPlan | null>(null);
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null);
  const [publishLoading, setPublishLoading] = useState(false);
  const [optimizerSummary, setOptimizerSummary] = useState('');
  const [optimizerActions, setOptimizerActions] = useState<Array<Record<string, unknown>>>([]);
  const [optimizerExecutionSummary, setOptimizerExecutionSummary] = useState('');
  const [experimentId, setExperimentId] = useState('');
  const [experimentResult, setExperimentResult] = useState('');
  const [realtimeSnapshot, setRealtimeSnapshot] = useState<Record<string, unknown> | null>(null);
  const [microPlan, setMicroPlan] = useState<MicroInfluencerPlan | null>(null);
  const [trustChecklist, setTrustChecklist] = useState<TrustChecklist | null>(null);

  const [events, setEvents] = useState<string[]>(['Workspace ready.']);

  const addEvent = (value: string) => {
    setEvents((prev) => [`${new Date().toLocaleTimeString()} - ${value}`, ...prev].slice(0, 8));
  };

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
    if (typeof window !== 'undefined') {
      setRedirectUri(`${window.location.origin}/oauth/callback`);
    }
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const data = JSON.parse(raw) as {
        currentStep?: StepId;
        integrations?: IntegrationAccount[];
        competitorUrl?: string;
        niche?: string;
        supplierUrl?: string;
        dailyBudget?: number;
        objective?: CampaignObjective;
        markets?: string;
        interests?: string;
        shopDomain?: string;
      };
      if (data.currentStep) setCurrentStep(data.currentStep);
      if (data.integrations?.length) setIntegrations(data.integrations);
      if (data.competitorUrl) setCompetitorUrl(data.competitorUrl);
      if (data.niche) setNiche(data.niche);
      if (data.supplierUrl) setSupplierUrl(data.supplierUrl);
      if (data.dailyBudget) setDailyBudget(data.dailyBudget);
      if (data.objective) setObjective(data.objective);
      if (data.markets) setMarkets(data.markets);
      if (data.interests) setInterests(data.interests);
      if (data.shopDomain) setShopDomain(data.shopDomain);
    } catch {
      // ignore invalid cache
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        currentStep,
        integrations,
        competitorUrl,
        niche,
        supplierUrl,
        dailyBudget,
        objective,
        markets,
        interests,
        shopDomain,
      }),
    );
  }, [currentStep, integrations, competitorUrl, niche, supplierUrl, dailyBudget, objective, markets, interests, shopDomain]);

  useEffect(() => {
    if (!userId) return;
    void (async () => {
      try {
        const next = await refreshIntegrationStatus(userId, integrations);
        setIntegrations(next);
        const onboarding = await getOnboardingStatusPhase1(userId);
        setOnboardingEnv(onboarding.env);
        setOnboardingReady(onboarding.readyForLaunch);
      } catch (error) {
        console.error(error);
        addEvent('Backend offline. Start worker API on :8000 for live status.');
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const connectedCount = integrations.filter((i) => i.connected).length;

  const readiness = useMemo(() => {
    let score = 0;
    if (connectedCount >= 3) score += 20;
    if (competitor) score += 15;
    if (selectedProduct) score += 15;
    if (selectedSupplier) score += 15;
    if (offerStack && pageDraft) score += 15;
    if (creativeDraft && modelUrl) score += 10;
    if (plan) score += 10;
    return score;
  }, [connectedCount, competitor, selectedProduct, selectedSupplier, offerStack, pageDraft, creativeDraft, modelUrl, plan]);

  const completedSteps = useMemo(() => {
    return new Set<StepId>([
      ...(connectedCount >= 3 ? (['connect'] as StepId[]) : []),
      ...(competitor ? (['intel'] as StepId[]) : []),
      ...(selectedProduct && selectedSupplier ? (['product'] as StepId[]) : []),
      ...(offerStack && pageDraft ? (['offer'] as StepId[]) : []),
      ...(creativeDraft ? (['creative'] as StepId[]) : []),
      ...(plan && publishResult?.status === 'drafted' ? (['launch'] as StepId[]) : []),
    ]);
  }, [connectedCount, competitor, selectedProduct, selectedSupplier, offerStack, pageDraft, creativeDraft, plan, publishResult]);

  const onSyncConnections = async () => {
    if (!userId) return;
    try {
      const next = await refreshIntegrationStatus(userId, integrations);
      setIntegrations(next);
      const onboarding = await getOnboardingStatusPhase1(userId);
      setOnboardingEnv(onboarding.env);
      setOnboardingReady(onboarding.readyForLaunch);
      addEvent('Connection status synced from token store.');
    } catch (error) {
      console.error(error);
      addEvent('Sync failed. Worker API is not reachable on :8000.');
    }
  };

  const onStartOAuth = async (platform: IntegrationPlatform) => {
    if (!userId) return;
    setConnecting((prev) => ({ ...prev, [`start-${platform}`]: true }));
    try {
      const account = await startPlatformOAuth(platform, userId, redirectUri, shopDomain);
      setIntegrations((prev) => prev.map((item) => (item.platform === platform ? { ...item, ...account } : item)));
      setOauthStates((prev) => ({ ...prev, [platform]: account.oauthState || '' }));
      setOauthNonces((prev) => ({ ...prev, [platform]: account.oauthNonce || '' }));
      addEvent(`${platformLabel(platform)} OAuth started.`);
    } catch (error) {
      addEvent(`${platformLabel(platform)} OAuth start failed.`);
      console.error(error);
    } finally {
      setConnecting((prev) => ({ ...prev, [`start-${platform}`]: false }));
    }
  };

  const onCompleteOAuth = async (platform: IntegrationPlatform) => {
    if (!userId) return;
    const code = oauthCodes[platform] || '';
    const state = oauthStates[platform] || '';
    const nonce = oauthNonces[platform] || '';
    if (!code.trim() || !state.trim()) return;
    setConnecting((prev) => ({ ...prev, [`complete-${platform}`]: true }));
    try {
      const account = await completePlatformOAuth(platform, userId, code, state, nonce || undefined);
      setIntegrations((prev) => prev.map((item) => (item.platform === platform ? { ...item, ...account } : item)));
      setOauthCodes((prev) => ({ ...prev, [platform]: '' }));
      setOauthStates((prev) => ({ ...prev, [platform]: '' }));
      setOauthNonces((prev) => ({ ...prev, [platform]: '' }));
      addEvent(`${platformLabel(platform)} OAuth completed.`);
    } catch (error) {
      addEvent(`${platformLabel(platform)} OAuth completion failed.`);
      console.error(error);
    } finally {
      setConnecting((prev) => ({ ...prev, [`complete-${platform}`]: false }));
    }
  };

  const onAnalyzeCompetitor = async () => {
    if (!competitorUrl.trim()) return;
    setCompetitorLoading(true);
    try {
      const data = await analyzeCompetitorSite(competitorUrl);
      setCompetitor(data);
      addEvent(`Competitor scored ${data.viralScore}/100.`);
      setCurrentStep('product');
    } finally {
      setCompetitorLoading(false);
    }
  };

  const onFindProducts = async () => {
    setProductsLoading(true);
    try {
      const list = await findWinningProductsPhase1(niche);
      setProducts(list);
      setSelectedProduct(list[0] ?? null);
      setSuppliers([]);
      setSelectedSupplier(null);
      setOfferStack(null);
      setPageDraft(null);
      addEvent(`${list.length} opportunities found.`);
    } finally {
      setProductsLoading(false);
    }
  };

  const onFindSuppliers = async () => {
    if (!selectedProduct) return;
    setSuppliersLoading(true);
    try {
      const list = await findSuppliersPhase1(selectedProduct);
      setSuppliers(list);
      setSelectedSupplier(list[0] ?? null);
      if (list[0]) setSupplierUrl(list[0].url);
      addEvent(`${list.length} supplier options generated.`);
      setCurrentStep('offer');
    } finally {
      setSuppliersLoading(false);
    }
  };

  const onGenerateOfferAndPage = async () => {
    if (!selectedProduct || !userId) return;
    setPageLoading(true);
    try {
      const nextOffer = buildOfferStack(selectedProduct, selectedSupplier);
      const nextPage = await generateProductPageDraftPhase1(supplierUrl, selectedProduct.name);
      setOfferStack(nextOffer);
      await seedSkuCatalogPhase1(userId, selectedProduct, selectedSupplier);
      const nextOfferV2 = await generateOfferEngineV2Phase1(userId, selectedProduct, selectedSupplier);
      setOfferV2(nextOfferV2);
      setPageDraft(nextPage);
      addEvent('Offer Engine v2 + page draft created.');
      setCurrentStep('creative');
    } finally {
      setPageLoading(false);
    }
  };

  const onGenerateCreative = async () => {
    if (!selectedProduct) return;
    setCreativeLoading(true);
    try {
      const [draft, nextModel] = await Promise.all([
        generateCreativeDraftPhase1(selectedProduct.name),
        generateProductModelPhase1(selectedProduct.imageUrl),
      ]);
      setCreativeDraft(draft);
      setModelUrl(nextModel);
      addEvent('Creative pack and 3D model generated.');
      setCurrentStep('launch');
    } finally {
      setCreativeLoading(false);
    }
  };

  const onRefreshModel = async () => {
    setModelLoading(true);
    try {
      const nextModel = await generateProductModelPhase1(selectedProduct?.imageUrl);
      setModelUrl(nextModel);
      addEvent('3D model refreshed.');
    } finally {
      setModelLoading(false);
    }
  };

  const onBuildPlan = () => {
    const nextPlan = buildCampaignPlan({
      dailyBudget,
      objective,
      markets: markets.split(',').map((x) => x.trim()).filter(Boolean),
      interests: interests.split(',').map((x) => x.trim()).filter(Boolean),
    });
    setPlan(nextPlan);
    setPublishResult(null);
    addEvent(`Plan built at $${nextPlan.dailyBudget}/day.`);
  };

  const onPublishDrafts = async () => {
    if (!plan || !selectedProduct || !userId) return;
    setPublishLoading(true);
    try {
      const [planData, trustData] = await Promise.all([
        getMicroInfluencerPlanPhase1(userId, niche, selectedProduct, selectedSupplier, plan.dailyBudget),
        getTrustChecklistPhase1(userId, Boolean(offerV2)),
      ]);
      setMicroPlan(planData);
      setTrustChecklist(trustData);
      const result = await publishCampaignDraftPhase1(userId, plan, selectedProduct.name);
      setPublishResult(result);
      if (offerV2 && !experimentId) {
        const created = await createOfferExperimentPhase1(userId, selectedProduct.name, offerV2);
        setExperimentId(created.experimentId);
        await runExperimentTrafficSamplePhase1(userId, created.experimentId);
        const evalResult = await evaluateOfferExperimentPhase1(userId, created.experimentId);
        setExperimentResult(
          `Experiment ${created.experimentId.slice(0, 8)}: top ${evalResult.topVariantId}, lift ${evalResult.liftPct.toFixed(2)}%, promoted ${evalResult.promoted ? 'yes' : 'no'}.`,
        );
      }
      const realtime = await getRealtimeSnapshotPhase1(userId);
      setRealtimeSnapshot(realtime);
      const latest = (realtime.optimizer_latest as { result?: { summary?: string; actions?: Array<Record<string, unknown>> }; execution?: { results?: Array<Record<string, unknown>>; errors?: string[]; skipped?: Array<Record<string, unknown>> } } | undefined) || {};
      setOptimizerSummary(String(latest.result?.summary || 'Auto-optimizer runs on schedule.'));
      setOptimizerActions(Array.isArray(latest.result?.actions) ? latest.result.actions : []);
      const applied = latest.execution?.results?.length || 0;
      const skipped = latest.execution?.skipped?.length || 0;
      const errors = latest.execution?.errors?.length || 0;
      setOptimizerExecutionSummary(`Auto execution: applied ${applied}, skipped ${skipped}, errors ${errors}.`);
      addEvent(result.message);
    } finally {
      setPublishLoading(false);
    }
  };

  if (authLoading) {
    return <main className="min-h-screen bg-[#020612]" />;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020612] text-slate-100">
      <div className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl luxury-float" />
      <div className="pointer-events-none absolute -right-24 top-40 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        <section className="rounded-3xl border border-slate-700/70 bg-gradient-to-r from-slate-900/80 via-slate-900/60 to-slate-900/40 p-5 backdrop-blur-xl md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" /> ConversionCraft Growth OS
              </p>
              <h1 className="text-2xl font-semibold tracking-tight md:text-4xl">Luxury Growth OS for Ecommerce Conversion</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-300">
                One guided flow: connect channels, discover winning products + suppliers, generate premium offers/creatives, launch campaigns, and auto-optimize revenue.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <SessionControls auth={auth} onSessionChanged={setAuth} />
              <div className="rounded-2xl border border-emerald-300/25 bg-slate-900/70 p-4 text-right shadow-[0_0_40px_rgba(16,185,129,0.15)]">
                <p className="text-xs uppercase text-slate-400">Readiness</p>
                <p className="text-3xl font-bold text-emerald-300">{readiness}%</p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/" className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800">Home</Link>
            <Link href="/finder" className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800">Finder</Link>
            <Link href="/dashboard" className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800">Dashboard</Link>
            <Link href="/onboarding" className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800">Onboarding</Link>
            <Link href="/studio" className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800">Studio</Link>
          </div>
        </section>

        <div className="mt-6 grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-slate-700/70 bg-slate-900/50 p-3 backdrop-blur">
            <div className="space-y-2">
              {stepLabels.map((step) => {
                const isActive = currentStep === step.id;
                const done = completedSteps.has(step.id);
                return (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStep(step.id)}
                    className={`w-full rounded-xl border px-3 py-2 text-left transition ${isActive ? 'border-cyan-300 bg-cyan-500/10' : 'border-slate-700 bg-slate-900 hover:bg-slate-800'}`}
                    type="button"
                  >
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      {done ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <span className="h-2 w-2 rounded-full bg-slate-500" />}
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">{step.subtitle}</p>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 rounded-xl border border-slate-700/80 bg-slate-900/70 p-3">
              <p className="text-xs font-semibold uppercase text-slate-400">Activity</p>
              <div className="mt-2 space-y-2">
                {events.map((entry) => (
                  <p key={entry} className="text-[11px] text-slate-300">{entry}</p>
                ))}
              </div>
            </div>
          </aside>

          <section className="rounded-2xl border border-slate-700/70 bg-slate-900/45 p-4 backdrop-blur md:p-5">
            {currentStep === 'connect' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <header className="mb-4 flex items-center gap-2 text-lg font-semibold"><Link2 className="h-5 w-5 text-cyan-300" /> Connect Channels (OAuth)</header>
                <div className="mb-3 rounded-lg border border-slate-700 bg-slate-950/40 p-3 text-xs text-slate-300">
                  <p>Redirect URI used for OAuth:</p>
                  <p className="mt-1 font-mono text-cyan-200">{redirectUri}</p>
                  <label className="mt-2 block">Shopify domain</label>
                  <input value={shopDomain} onChange={(e) => setShopDomain(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
                  <div className="mt-3 rounded-lg border border-slate-700 bg-slate-900/60 p-2">
                    <p className="font-semibold text-slate-200">Onboarding readiness</p>
                    <p className="mt-1">App env: Shopify {onboardingEnv.shopify ? 'OK' : 'Missing'} | Meta {onboardingEnv.meta ? 'OK' : 'Missing'} | TikTok {onboardingEnv.tiktok ? 'OK' : 'Missing'}</p>
                    <p className="mt-1 text-cyan-200">Launch readiness: {onboardingReady ? 'Ready' : 'Not ready yet'}</p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {integrations.map((item) => (
                    <div key={item.platform} className="rounded-xl border border-slate-700 bg-slate-950/60 p-3">
                      <p className="text-sm font-semibold">{platformLabel(item.platform)}</p>
                      <p className="mt-1 text-xs text-slate-400">{item.accountName}</p>
                      {['shopify', 'meta', 'tiktok'].includes(item.platform) ? (
                        <>
                          <button
                            type="button"
                            disabled={Boolean(connecting[`start-${item.platform}`])}
                            onClick={() => onStartOAuth(item.platform)}
                            className="mt-2 rounded-lg bg-cyan-400 px-3 py-1.5 text-xs font-semibold text-slate-950 disabled:opacity-50"
                          >
                            {connecting[`start-${item.platform}`] ? 'Starting...' : 'Start OAuth'}
                          </button>
                          {item.authUrl && (
                            <a href={item.authUrl} target="_blank" rel="noreferrer" className="mt-2 block text-xs text-cyan-300 underline">
                              Open OAuth consent
                            </a>
                          )}
                          <input
                            placeholder="Paste returned code"
                            value={oauthCodes[item.platform] || ''}
                            onChange={(e) => setOauthCodes((prev) => ({ ...prev, [item.platform]: e.target.value }))}
                            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs"
                          />
                          <input
                            placeholder="Paste returned state"
                            value={oauthStates[item.platform] || ''}
                            onChange={(e) => setOauthStates((prev) => ({ ...prev, [item.platform]: e.target.value }))}
                            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs"
                          />
                          <input
                            placeholder="Paste returned nonce (optional)"
                            value={oauthNonces[item.platform] || ''}
                            onChange={(e) => setOauthNonces((prev) => ({ ...prev, [item.platform]: e.target.value }))}
                            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs"
                          />
                          <button
                            type="button"
                            disabled={
                              Boolean(connecting[`complete-${item.platform}`]) ||
                              !(oauthCodes[item.platform] || '').trim() ||
                              !(oauthStates[item.platform] || '').trim()
                            }
                            onClick={() => onCompleteOAuth(item.platform)}
                            className="mt-2 rounded-lg bg-emerald-400 px-3 py-1.5 text-xs font-semibold text-slate-950 disabled:opacity-50"
                          >
                            {connecting[`complete-${item.platform}`] ? 'Connecting...' : 'Complete OAuth'}
                          </button>
                        </>
                      ) : (
                        <p className="mt-2 text-xs text-slate-500">Uses Meta connection context.</p>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={onSyncConnections} className="rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-xs text-slate-200">Sync Status</button>
                  <button type="button" onClick={() => setCurrentStep('intel')} className="rounded-lg bg-cyan-400 px-4 py-2 text-xs font-semibold text-slate-950">Continue</button>
                </div>
              </motion.div>
            )}

            {currentStep === 'intel' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <header className="mb-4 flex items-center gap-2 text-lg font-semibold"><Target className="h-5 w-5 text-amber-300" /> Competitor Intel</header>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input value={competitorUrl} onChange={(e) => setCompetitorUrl(e.target.value)} placeholder="https://competitor.com" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm outline-none focus:border-cyan-300" />
                  <button type="button" onClick={onAnalyzeCompetitor} disabled={competitorLoading || !competitorUrl.trim()} className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-60">
                    {competitorLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Compass className="h-4 w-4" />} Analyze
                  </button>
                </div>
                {competitor && (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3">
                      <p className="text-xs text-slate-400">Viral score</p>
                      <p className="text-2xl font-bold text-amber-200">{competitor.viralScore}/100</p>
                      <p className="mt-2 text-xs text-slate-300">{competitor.topChannels.join(' • ')}</p>
                    </div>
                    <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3">
                      <p className="text-xs text-slate-400">Top counter moves</p>
                      <ul className="mt-2 space-y-1 text-xs text-slate-300">
                        {competitor.recommendedCounters.map((item) => <li key={item}>• {item}</li>)}
                      </ul>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {currentStep === 'product' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <header className="mb-4 flex items-center gap-2 text-lg font-semibold"><PackageSearch className="h-5 w-5 text-violet-300" /> Product + Supplier</header>
                <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
                  <input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="home gadgets" className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm" />
                  <button type="button" onClick={onFindProducts} disabled={productsLoading} className="rounded-xl bg-violet-400 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-60">
                    {productsLoading ? <Loader2 className="h-4 w-4 animate-spin inline" /> : 'Find Products'}
                  </button>
                  <button type="button" onClick={onFindSuppliers} disabled={!selectedProduct || suppliersLoading} className="rounded-xl bg-lime-400 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-60">
                    {suppliersLoading ? <Loader2 className="h-4 w-4 animate-spin inline" /> : 'Find Suppliers'}
                  </button>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    {products.map((p) => (
                      <button key={p.id} type="button" onClick={() => setSelectedProduct(p)} className={`w-full rounded-lg border px-3 py-2 text-left text-xs ${selectedProduct?.id === p.id ? 'border-violet-300 bg-violet-500/10' : 'border-slate-700 bg-slate-950/50'}`}>
                        <p className="font-semibold">{p.name} ({p.score})</p>
                        <p className="text-slate-400">${p.unitCost} to ${p.targetPrice}</p>
                      </button>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {suppliers.map((s) => (
                      <button key={s.id} type="button" onClick={() => { setSelectedSupplier(s); setSupplierUrl(s.url); }} className={`w-full rounded-lg border px-3 py-2 text-left text-xs ${selectedSupplier?.id === s.id ? 'border-lime-300 bg-lime-500/10' : 'border-slate-700 bg-slate-950/50'}`}>
                        <p className="font-semibold">{s.name}</p>
                        <p className="text-slate-400">${s.price} • {s.shippingTime} • {s.location}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 'offer' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <header className="mb-4 flex items-center gap-2 text-lg font-semibold"><Boxes className="h-5 w-5 text-orange-300" /> Offer + Page Draft</header>
                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                  <input value={supplierUrl} onChange={(e) => setSupplierUrl(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm" />
                  <button type="button" onClick={onGenerateOfferAndPage} disabled={!selectedProduct || pageLoading} className="rounded-xl bg-orange-400 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-60">
                    {pageLoading ? <Loader2 className="h-4 w-4 animate-spin inline" /> : 'Generate'}
                  </button>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3 text-xs">
                    <p className="font-semibold text-orange-200">Offer Stack</p>
                    {offerStack ? (
                      <div className="mt-2 space-y-1 text-slate-300">
                        <p>{offerStack.headline}</p>
                        <p>{offerStack.bundleName} - ${offerStack.bundlePrice}</p>
                        <p>Upsell: {offerStack.oneClickUpsell}</p>
                        <p>Post purchase: {offerStack.postPurchaseUpsell}</p>
                      </div>
                    ) : <p className="mt-2 text-slate-400">No offer generated yet.</p>}
                  </div>
                  <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3 text-xs">
                    <p className="font-semibold text-amber-200">Pre-checkout blocks (v2)</p>
                    {offerV2?.preCheckoutBlocks?.length ? (
                      <div className="mt-2 space-y-2 text-slate-300">
                        {offerV2.preCheckoutBlocks.map((block) => (
                          <div key={`${block.placement}-${block.title}`} className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-2">
                            <p className="font-semibold">{block.title}</p>
                            <p>{block.subtitle}</p>
                            <p className="text-cyan-200">{block.cta}</p>
                          </div>
                        ))}
                      </div>
                    ) : <p className="mt-2 text-slate-400">No pre-checkout blocks yet.</p>}
                  </div>
                  <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3 text-xs">
                    <p className="font-semibold text-cyan-200">Page Draft</p>
                    {pageDraft ? (
                      <div className="mt-2 space-y-1 text-slate-300">
                        <p className="font-semibold text-slate-100">{pageDraft.headline}</p>
                        <p>{pageDraft.subheadline}</p>
                        <p>CTA: {pageDraft.cta}</p>
                      </div>
                    ) : <p className="mt-2 text-slate-400">No page generated yet.</p>}
                  </div>
                  <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3 text-xs">
                    <p className="font-semibold text-fuchsia-200">Post-purchase upsell flow (v2)</p>
                    {offerV2?.postPurchaseBlocks?.length ? (
                      <div className="mt-2 space-y-2 text-slate-300">
                        {offerV2.postPurchaseBlocks.map((block) => (
                          <div key={`${block.placement}-${block.title}`} className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-2">
                            <p className="font-semibold">{block.title}</p>
                            <p>{block.subtitle}</p>
                            <p className="text-cyan-200">{block.cta}</p>
                          </div>
                        ))}
                        <p className="text-[11px] text-slate-400">
                          A/B traffic: A {Math.round(Number(offerV2.abTest.variantA.traffic || 0) * 100)}% / B {Math.round(Number(offerV2.abTest.variantB.traffic || 0) * 100)}%
                        </p>
                      </div>
                    ) : <p className="mt-2 text-slate-400">No post-purchase flow yet.</p>}
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 'creative' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <header className="mb-4 flex items-center gap-2 text-lg font-semibold"><Video className="h-5 w-5 text-pink-300" /> Creative + 3D</header>
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={onGenerateCreative} disabled={!selectedProduct || creativeLoading} className="rounded-xl bg-pink-400 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-60">
                    {creativeLoading ? <Loader2 className="h-4 w-4 animate-spin inline" /> : 'Generate Creative Pack'}
                  </button>
                  <button type="button" onClick={onRefreshModel} disabled={modelLoading} className="rounded-xl bg-fuchsia-400 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-60">
                    {modelLoading ? <Loader2 className="h-4 w-4 animate-spin inline" /> : 'Refresh 3D Model'}
                  </button>
                </div>
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3 text-xs">
                    <p className="font-semibold text-pink-200">Creative Draft</p>
                    {creativeDraft ? (
                      <div className="mt-2 space-y-1 text-slate-300">
                        <p className="font-semibold text-slate-100">Hook: {creativeDraft.hook}</p>
                        <p>{creativeDraft.body}</p>
                        <p>Workflow nodes: {creativeDraft.workflowNodes}</p>
                      </div>
                    ) : <p className="mt-2 text-slate-400">No creative generated yet.</p>}
                  </div>
                  <div className="h-[320px] rounded-xl border border-slate-700 bg-slate-950/60 p-2">
                    <ProductCanvas modelUrl={modelUrl} />
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 'launch' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <header className="mb-4 flex items-center gap-2 text-lg font-semibold"><Rocket className="h-5 w-5 text-emerald-300" /> Launch + Auto Optimizer</header>
                <div className="grid gap-3 md:grid-cols-4">
                  <label className="text-xs text-slate-300">Budget ($)
                    <input type="number" min={30} value={dailyBudget} onChange={(e) => setDailyBudget(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
                  </label>
                  <label className="text-xs text-slate-300">Objective
                    <select value={objective} onChange={(e) => setObjective(e.target.value as CampaignObjective)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2">
                      <option value="conversions">Conversions</option>
                      <option value="traffic">Traffic</option>
                      <option value="engagement">Engagement</option>
                    </select>
                  </label>
                  <label className="text-xs text-slate-300 md:col-span-2">Markets
                    <input value={markets} onChange={(e) => setMarkets(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
                  </label>
                  <label className="text-xs text-slate-300 md:col-span-3">Interests
                    <input value={interests} onChange={(e) => setInterests(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
                  </label>
                  <div className="flex items-end gap-2">
                    <button type="button" onClick={onBuildPlan} className="w-full rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950">Build Plan</button>
                  </div>
                </div>

                {plan && (
                  <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/60 p-3 text-xs">
                    <p className="font-semibold text-emerald-200">Split: ${plan.dailyBudget}/day</p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2 md:grid-cols-4">
                      {plan.split.map((item) => (
                        <div key={item.platform} className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
                          <p className="font-semibold">{platformLabel(item.platform)}</p>
                          <p>${item.amount}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" onClick={onPublishDrafts} disabled={publishLoading || !selectedProduct} className="rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-60">
                        {publishLoading ? <Loader2 className="h-4 w-4 animate-spin inline" /> : 'Create Campaign Drafts'}
                      </button>
                      <p className="rounded-xl border border-violet-300/30 bg-violet-500/10 px-3 py-2 text-xs text-violet-200">
                        Auto optimizer runs on schedule with ROAS guardrails and daily budget safety caps.
                      </p>
                    </div>
                  </div>
                )}

                {publishResult && (
                  <div className={`mt-3 rounded-xl border p-3 text-xs ${publishResult.status === 'drafted' ? 'border-emerald-400/40 bg-emerald-500/10' : 'border-rose-400/40 bg-rose-500/10'}`}>
                    <p className="font-semibold">{publishResult.message}</p>
                    {publishResult.references.length > 0 && <p className="mt-1">{publishResult.references.join(', ')}</p>}
                  </div>
                )}
                {microPlan && (
                  <div className="mt-3 rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-xs">
                    <p className="font-semibold text-amber-200">Micro-influencer plan</p>
                    <p className="mt-1">
                      {microPlan.channel} | {microPlan.recommendedFollowerRange} | {microPlan.estimatedCreatorCount} creators @ ${microPlan.storyBudgetPerCreator}
                    </p>
                    <p className="mt-1">Target CPA: ${microPlan.targetCpa} | Target ROAS: {microPlan.targetRoas}</p>
                    <p className="mt-2 text-slate-200">{microPlan.outreachTemplate}</p>
                  </div>
                )}
                {trustChecklist && (
                  <div className="mt-3 rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-3 text-xs">
                    <p className="font-semibold text-cyan-100">Trust readiness: {trustChecklist.score}% ({trustChecklist.status})</p>
                    {trustChecklist.missing.length > 0 && (
                      <p className="mt-1 text-slate-200">Missing: {trustChecklist.missing.join(' | ')}</p>
                    )}
                  </div>
                )}
                {experimentResult && (
                  <div className="mt-3 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-xs">
                    <p className="font-semibold text-emerald-100">Phase 5 Experiment Engine</p>
                    <p className="mt-1 text-slate-100">{experimentResult}</p>
                  </div>
                )}

                {optimizerSummary && (
                  <div className="mt-3 rounded-xl border border-violet-400/40 bg-violet-500/10 p-3 text-xs">
                    <p className="font-semibold text-violet-200">{optimizerSummary}</p>
                    <div className="mt-2 space-y-1 text-slate-200">
                      {optimizerActions.map((action, idx) => (
                        <p key={idx}>• {String(action.action)} on {String(action.platform)} ({String(action.campaign_id)}) - {String(action.reason || '')}</p>
                      ))}
                    </div>
                    {optimizerExecutionSummary && <p className="mt-2 text-emerald-200">{optimizerExecutionSummary}</p>}
                  </div>
                )}
                {realtimeSnapshot && (
                  <div className="mt-3 rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-3 text-xs">
                    <p className="font-semibold text-cyan-100">Realtime sync snapshot</p>
                    <div className="mt-2 grid gap-2 md:grid-cols-3">
                      <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-2">
                        <p className="text-slate-400">Campaigns</p>
                        <p className="font-semibold text-cyan-100">{String((realtimeSnapshot.campaigns as { campaign_count?: number })?.campaign_count ?? 0)}</p>
                      </div>
                      <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-2">
                        <p className="text-slate-400">Spend</p>
                        <p className="font-semibold text-cyan-100">${String((realtimeSnapshot.campaigns as { total_spend?: number })?.total_spend ?? 0)}</p>
                      </div>
                      <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-2">
                        <p className="text-slate-400">ROAS</p>
                        <p className="font-semibold text-cyan-100">{String((realtimeSnapshot.attribution as { roas?: number })?.roas ?? '-')}</p>
                      </div>
                    </div>
                    <Link href="/dashboard" className="mt-2 inline-flex items-center gap-1 text-cyan-200 underline">
                      <BarChart3 className="h-3.5 w-3.5" /> Open full dashboard
                    </Link>
                  </div>
                )}
              </motion.div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

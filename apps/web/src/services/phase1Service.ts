import {
  analyzeNiche,
  completeOAuthConnect,
  assignExperimentVariant,
  createExperiment,
  createCampaigns,
  evaluateExperiment,
  executeOptimizerActions,
  generate3DModel,
  getMicroInfluencerPlan,
  getRealtimeDashboard,
  getTrustChecklist,
  getOnboardingStatus,
  getTokenStatus,
  recommendOffersV2,
  runWeeklyOptimizer,
  listExperiments,
  startOAuthConnect,
  ingestExperimentEvent,
  upsertSkuCatalog,
} from '@/services/apiClient';
import {
  analyzeCompetitor,
  findSuppliersV2,
  generateAdScript,
  generateComfyUIWorkflow,
  generateProductPage,
  generateSocialPost,
} from '@/services/geminiService';
import type { CompetitorAnalysis, WorkerAnalyzeResponse } from '@/types';
import type {
  CampaignPlan,
  CampaignPlanInput,
  CreativeDraft,
  IntegrationAccount,
  IntegrationPlatform,
  OfferStack,
  OfferRecommendationV2,
  MicroInfluencerPlan,
  TrustChecklist,
  ProductOpportunity,
  ProductPageDraft,
  PublishResult,
  CompetitorInsight,
  SupplierCandidate,
} from '@/types/phase1';

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const safeJsonParse = <T>(raw: string, fallback: T): T => {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const FALLBACK_CONNECTION_NAMES: Record<IntegrationPlatform, string> = {
  shopify: 'Shopify Store',
  meta: 'Meta Ads Account',
  tiktok: 'TikTok Ads Account',
  instagram: 'Instagram Business',
  facebook: 'Facebook Page',
};

type OAuthPlatform = 'shopify' | 'meta' | 'tiktok';

const isOAuthPlatform = (platform: IntegrationPlatform): platform is OAuthPlatform => {
  return platform === 'shopify' || platform === 'meta' || platform === 'tiktok';
};

export const startPlatformOAuth = async (
  platform: IntegrationPlatform,
  userId: string,
  redirectUri: string,
  shopDomain?: string,
): Promise<IntegrationAccount> => {
  if (!isOAuthPlatform(platform)) {
    await pause(300);
    return {
      platform,
      connected: false,
      accountName: `${FALLBACK_CONNECTION_NAMES[platform]} uses Meta/TikTok connection`,
    };
  }

  const response = await startOAuthConnect({
    platform,
    userId,
    redirectUri,
    shop: platform === 'shopify' ? shopDomain : undefined,
  });

  return {
    platform,
    connected: false,
    accountName: `${FALLBACK_CONNECTION_NAMES[platform]} (OAuth started)`,
    authUrl: response.auth_url,
    oauthState: response.state,
    oauthNonce: response.nonce,
  };
};

export const completePlatformOAuth = async (
  platform: IntegrationPlatform,
  userId: string,
  code: string,
  state: string,
  nonce?: string,
): Promise<IntegrationAccount> => {
  if (!isOAuthPlatform(platform)) {
    return {
      platform,
      connected: true,
      accountName: `${FALLBACK_CONNECTION_NAMES[platform]} (Shared token)`,
      connectedAt: new Date().toISOString(),
    };
  }

  await completeOAuthConnect({
    platform,
    userId,
    code,
    state,
    nonce,
  });

  return {
    platform,
    connected: true,
    accountName: `${FALLBACK_CONNECTION_NAMES[platform]} (Connected)`,
    connectedAt: new Date().toISOString(),
  };
};

export const refreshIntegrationStatus = async (
  userId: string,
  current: IntegrationAccount[],
): Promise<IntegrationAccount[]> => {
  try {
    const status = await getTokenStatus(userId);
    return current.map((item) => {
      const isConnected = Boolean(status.status[item.platform]);
      return {
        ...item,
        connected: isConnected,
        accountName: isConnected
          ? `${FALLBACK_CONNECTION_NAMES[item.platform]} (Connected)`
          : `${FALLBACK_CONNECTION_NAMES[item.platform]} not connected`,
      };
    });
  } catch {
    return current;
  }
};

export const getOnboardingStatusPhase1 = async (userId: string): Promise<{
  env: Record<string, boolean>;
  connections: Record<string, boolean>;
  readyForLaunch: boolean;
}> => {
  const data = await getOnboardingStatus(userId);
  return {
    env: data.env,
    connections: data.connections,
    readyForLaunch: data.ready_for_launch,
  };
};

export const analyzeCompetitorSite = async (url: string): Promise<CompetitorInsight> => {
  try {
    const result = await analyzeCompetitor(url);
    const data = result.data as CompetitorAnalysis;
    const channelItems = (
      (data as unknown as { priorityChannels?: Array<{ channel: string }> }).priorityChannels ?? []
    ).map((item) => item.channel);

    return {
      url,
      viralScore: data.viralScore ?? 55,
      strengths: data.swot?.strengths?.slice(0, 3) ?? ['Strong social reach', 'Consistent creative testing'],
      weaknesses: data.swot?.weaknesses?.slice(0, 3) ?? ['Offer framing can be stronger', 'Checkout friction on mobile'],
      recommendedCounters: data.attackPlan?.slice(0, 3).map((t) => `${t.tactic}: ${t.action}`) ?? [
        'Value stack + bundle offer',
        'UGC-first creative refresh every 5 days',
        'Faster shipping badge and guarantee',
      ],
      topChannels: channelItems.length ? channelItems.slice(0, 3) : ['TikTok', 'Instagram', 'Facebook'],
    };
  } catch {
    return {
      url,
      viralScore: 58,
      strengths: ['Good visual brand consistency', 'Clear benefit messaging', 'Active short-form content'],
      weaknesses: ['Weak upsell ladder', 'Limited social proof density', 'Inconsistent headline clarity'],
      recommendedCounters: [
        'Launch 3-offer ladder (starter, bundle, premium)',
        'Use stronger before/after proof block',
        'Split-test hook variants every 72 hours',
      ],
      topChannels: ['TikTok', 'Instagram', 'Meta'],
    };
  }
};

const mapWorkerProducts = (data: WorkerAnalyzeResponse): ProductOpportunity[] => {
  return data.products.slice(0, 6).map((item) => ({
    id: item.id,
    name: item.name,
    reason: `Margin approx ${Math.round(item.margin_percent)}% with ${item.supplier_rating.toFixed(1)} supplier rating.`,
    source: item.source,
    score: Math.max(50, Math.min(98, Math.round(item.margin_percent + item.supplier_rating * 6))),
    supplierHint: `${item.niche_tag} supplier, est. ${item.shipping}d shipping`,
    unitCost: Number(item.total_cost.toFixed(2)),
    targetPrice: Number(item.target_selling_price.toFixed(2)),
    imageUrl: item.image,
  }));
};

export const findWinningProductsPhase1 = async (niche: string): Promise<ProductOpportunity[]> => {
  try {
    const data = await analyzeNiche(niche);
    return mapWorkerProducts(data);
  } catch {
    return [
      {
        id: 'fallback-1',
        name: 'Portable Blender Bottle',
        reason: 'High repeat use product with clear UGC demo potential.',
        source: 'fallback',
        score: 78,
        supplierHint: 'Kitchen accessories supplier, est. 7-12d shipping',
        unitCost: 11.2,
        targetPrice: 34.0,
        imageUrl: 'https://images.unsplash.com/photo-1574989582551-52ca4e3474f4?auto=format&fit=crop&w=800&q=60',
      },
      {
        id: 'fallback-2',
        name: 'Posture Corrector 2.0',
        reason: 'Strong pain-point messaging and broad demographic demand.',
        source: 'fallback',
        score: 82,
        supplierHint: 'Health accessories supplier, est. 6-10d shipping',
        unitCost: 9.5,
        targetPrice: 29.0,
        imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=60',
      },
    ];
  }
};

const normalizeSupplier = (item: Record<string, unknown>, index: number, fallbackPrice: number): SupplierCandidate => {
  const rawPrice = String(item.price ?? fallbackPrice);
  const numericPrice = Number(rawPrice.replace(/[^0-9.]/g, ''));

  return {
    id: String(item.id ?? `supplier-${index + 1}`),
    name: String(item.name ?? `Supplier ${index + 1}`),
    url: String(item.url ?? '#'),
    price: Number.isFinite(numericPrice) && numericPrice > 0 ? numericPrice : fallbackPrice,
    shippingTime: String(item.shippingTimeEstimated ?? item.shippingTime ?? '7-12 days'),
    moq: String(item.moq ?? '1'),
    rating: Number(item.rating ?? 4.5),
    location: Array.isArray(item.warehouseLocations) ? String(item.warehouseLocations[0] ?? 'Global') : String(item.location ?? 'Global'),
    verified: Boolean(item.verifiedSeller ?? item.isVerified ?? true),
  };
};

export const findSuppliersPhase1 = async (product: ProductOpportunity): Promise<SupplierCandidate[]> => {
  try {
    const raw = await findSuppliersV2(product.name);
    const parsed = safeJsonParse<Record<string, unknown>[]>(raw, []);
    if (!parsed.length) throw new Error('No suppliers parsed');
    return parsed.slice(0, 6).map((item, index) => normalizeSupplier(item, index, product.unitCost));
  } catch {
    return [
      {
        id: 'sup-1',
        name: `${product.name} Direct Supplier`,
        url: 'https://www.aliexpress.com/',
        price: Number((product.unitCost * 0.95).toFixed(2)),
        shippingTime: '6-10 days',
        moq: '1',
        rating: 4.7,
        location: 'CN / US warehouse',
        verified: true,
      },
      {
        id: 'sup-2',
        name: `${product.name} Fast-Ship Supplier`,
        url: 'https://www.alibaba.com/',
        price: Number((product.unitCost * 1.05).toFixed(2)),
        shippingTime: '3-7 days',
        moq: '10',
        rating: 4.5,
        location: 'US warehouse',
        verified: true,
      },
    ];
  }
};

export const generateProductPageDraftPhase1 = async (supplierUrl: string, productName: string): Promise<ProductPageDraft> => {
  try {
    const page = await generateProductPage(supplierUrl, productName);
    return {
      productName: page.productName,
      headline: page.headline,
      subheadline: page.subheadline,
      features: page.features,
      cta: page.callToAction,
      seoTitle: page.seoTitle,
      seoMeta: page.seoMeta,
    };
  } catch {
    return {
      productName,
      headline: `${productName} built for conversion-first stores`,
      subheadline: 'Fast shipping promise, stronger social proof, and clear offer stack to improve ROAS.',
      features: [
        'Problem-solution framing above the fold',
        'Benefit-led feature bullets',
        'Trust + guarantee block',
        'Single-minded CTA hierarchy',
      ],
      cta: 'Get Mine Today',
      seoTitle: `${productName} | ConversionCraft optimized product page`,
      seoMeta: `Conversion-optimized ${productName} page with persuasive hooks and trust triggers.`,
    };
  }
};

export const buildOfferStack = (product: ProductOpportunity, supplier: SupplierCandidate | null): OfferStack => {
  const basePrice = product.targetPrice;
  const supplierCost = supplier?.price ?? product.unitCost;
  const bundlePrice = Number((basePrice * 1.7).toFixed(2));
  const savingsPercent = 15;

  const upsellCandidate = product.name.toLowerCase().includes('bottle')
    ? 'Insulated carry pouch + cleaning brush'
    : product.name.toLowerCase().includes('posture')
      ? 'Premium resistance band set'
      : 'Extended protection pack + accessories';

  const postPurchase = product.name.toLowerCase().includes('lamp')
    ? 'Ambient mood-light bundle add-on'
    : 'Priority shipping + replacement guarantee';

  const marginPerUnit = Math.max(0, basePrice - supplierCost);
  const highlightedGuarantee = marginPerUnit > 15 ? '30-day money-back + free shipping over 2 units' : '14-day no-risk trial';

  return {
    headline: `Most buyers pick the 2-pack to save ${savingsPercent}%`,
    bundleName: `${product.name} Duo Bundle`,
    bundlePrice,
    savingsPercent,
    oneClickUpsell: upsellCandidate,
    postPurchaseUpsell: postPurchase,
    urgencyCopy: 'Limited launch pricing for the next 48 hours',
    guarantee: highlightedGuarantee,
  };
};

export const generateCreativeDraftPhase1 = async (productName: string): Promise<CreativeDraft> => {
  try {
    const scriptRaw = await generateAdScript(productName, 'TikTok');
    const script = safeJsonParse<{ hook: string; body: string; visualCue: string; cta: string }>(scriptRaw, {
      hook: `POV: You just found the easiest way to use ${productName}`,
      body: `${productName} solves the daily frustration in less than 30 seconds.`,
      visualCue: 'Close-up demo, problem-solution transition, before/after cut',
      cta: 'Tap to shop now',
    });

    const [tiktokCaption, instagramCaption] = await Promise.all([
      generateSocialPost(productName, 'TikTok'),
      generateSocialPost(productName, 'Instagram'),
    ]);

    const workflow = await generateComfyUIWorkflow(script);
    const workflowNodes = Array.isArray((workflow as { nodes?: unknown[] }).nodes)
      ? ((workflow as { nodes?: unknown[] }).nodes?.length ?? 0)
      : 0;

    return {
      hook: script.hook,
      body: script.body,
      visualCue: script.visualCue,
      cta: script.cta,
      captions: [
        { platform: 'TikTok', text: tiktokCaption.caption, hashtags: tiktokCaption.hashtags },
        { platform: 'Instagram', text: instagramCaption.caption, hashtags: instagramCaption.hashtags },
      ],
      workflowNodes,
    };
  } catch {
    return {
      hook: `This ${productName} is what your routine was missing.`,
      body: 'Show the pain point in 2 seconds, reveal the transformation, then demonstrate outcome clearly.',
      visualCue: 'UGC selfie intro + clean product demo + testimonial overlay',
      cta: 'Shop now before this offer ends',
      captions: [
        {
          platform: 'TikTok',
          text: `You asked for real results. ${productName} delivers every day.`,
          hashtags: ['#tiktokmademebuyit', '#ecom', '#productfind'],
        },
        {
          platform: 'Instagram',
          text: `${productName} in 15 seconds: problem solved.`,
          hashtags: ['#instagramreels', '#shopnow', '#winningproduct'],
        },
      ],
      workflowNodes: 3,
    };
  }
};

export const generateProductModelPhase1 = async (imageUrl?: string): Promise<string> => {
  if (!imageUrl) return 'https://modelviewer.dev/shared-assets/models/Astronaut.glb';
  try {
    return await generate3DModel(imageUrl);
  } catch {
    return 'https://modelviewer.dev/shared-assets/models/Astronaut.glb';
  }
};

export const buildCampaignPlan = (input: CampaignPlanInput): CampaignPlan => {
  const normalizedBudget = Math.max(30, Number(input.dailyBudget || 0));
  const ratio =
    input.objective === 'conversions'
      ? { meta: 0.5, tiktok: 0.35, instagram: 0.1, facebook: 0.05 }
      : input.objective === 'traffic'
        ? { meta: 0.4, tiktok: 0.4, instagram: 0.15, facebook: 0.05 }
        : { meta: 0.25, tiktok: 0.4, instagram: 0.25, facebook: 0.1 };

  const split = (Object.keys(ratio) as Array<keyof typeof ratio>).map((platform) => ({
    platform,
    amount: Number((normalizedBudget * ratio[platform]).toFixed(2)),
  }));

  return {
    objective: input.objective,
    dailyBudget: normalizedBudget,
    split,
    recommendedAudience: {
      markets: input.markets.length ? input.markets : ['United States'],
      interests: input.interests.length ? input.interests : ['Online shopping', 'Impulse buying', 'Lifestyle products'],
      ageRange: input.objective === 'engagement' ? '18-34' : '21-44',
    },
    creativeChecklist: [
      'Launch with 3 hooks x 2 visual styles',
      'Pause ad sets with CTR < 1.2% after 1,500 impressions',
      'Scale winners by 20% budget every 48h',
      'Refresh UGC intro every 5-7 days',
    ],
  };
};

export const publishCampaignDraftPhase1 = async (
  userId: string,
  plan: CampaignPlan,
  productName: string,
): Promise<PublishResult> => {
  try {
    const result = await createCampaigns({
      userId,
      campaignName: `${productName} - CC Launch`,
      objective: plan.objective,
      dailyBudget: plan.dailyBudget,
      targeting: {
        markets: plan.recommendedAudience.markets,
        interests: plan.recommendedAudience.interests,
        age_range: plan.recommendedAudience.ageRange,
      },
      product: { name: productName },
    });

    return {
      status: result.campaigns.length ? 'drafted' : 'failed',
      message: result.campaigns.length
        ? `Created ${result.campaigns.length} campaign draft(s).`
        : `Campaign creation failed: ${result.errors.join(' | ')}`,
      references: result.campaigns.map((x) => `${String(x.platform || '')}:${String(x.campaign_id || '')}`),
    };
  } catch (error) {
    return {
      status: 'failed',
      message: `Campaign creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      references: [],
    };
  }
};

export const runWeeklyOptimizerPhase1 = async (
  userId: string,
): Promise<{ summary: string; actions: Array<Record<string, unknown>> }> => {
  const result = await runWeeklyOptimizer(userId);
  return {
    summary: result.result.summary,
    actions: result.result.actions,
  };
};

export const seedSkuCatalogPhase1 = async (
  userId: string,
  product: ProductOpportunity,
  supplier: SupplierCandidate | null,
): Promise<void> => {
  const baseCost = supplier?.price ?? product.unitCost;
  await upsertSkuCatalog({
    userId,
    skus: [
      {
        sku: `${product.id}-core`,
        name: product.name,
        price: product.targetPrice,
        cost: baseCost,
        inventory: 250,
        category: 'core',
      },
      {
        sku: `${product.id}-acc-1`,
        name: `${product.name} Accessory Pack`,
        price: Number((product.targetPrice * 0.55).toFixed(2)),
        cost: Number((baseCost * 0.28).toFixed(2)),
        inventory: 320,
        category: 'addon',
      },
      {
        sku: `${product.id}-acc-2`,
        name: `${product.name} Premium Kit`,
        price: Number((product.targetPrice * 0.75).toFixed(2)),
        cost: Number((baseCost * 0.34).toFixed(2)),
        inventory: 180,
        category: 'addon',
      },
    ],
  });
};

export const generateOfferEngineV2Phase1 = async (
  userId: string,
  product: ProductOpportunity,
  supplier: SupplierCandidate | null,
): Promise<OfferRecommendationV2> => {
  const response = await recommendOffersV2({
    userId,
    product: {
      name: product.name,
      price: product.targetPrice,
      cost: supplier?.price ?? product.unitCost,
    },
    constraints: {
      min_margin: 0.25,
      max_discount_percent: 20,
      min_inventory: 20,
    },
    experiment: {
      variant_a_name: 'Bundle First',
      variant_b_name: 'Upsell First',
      split_a: 0.5,
      split_b: 0.5,
    },
  });

  return {
    product: response.product,
    constraintsApplied: {
      minMargin: response.constraints_applied.min_margin,
      maxDiscountPercent: response.constraints_applied.max_discount_percent,
      minInventory: response.constraints_applied.min_inventory,
    },
    recommendations: response.recommendations,
    preCheckoutBlocks: (response.ui_contract.pre_checkout_blocks || []) as Array<{
      placement: string;
      title: string;
      subtitle: string;
      cta: string;
    }>,
    postPurchaseBlocks: (response.ui_contract.post_purchase_blocks || []) as Array<{
      placement: string;
      title: string;
      subtitle: string;
      cta: string;
    }>,
    abTest: {
      variantA: response.ab_test.variant_a,
      variantB: response.ab_test.variant_b,
    },
  };
};

export const executeOptimizerActionsPhase1 = async (
  userId: string,
  actions: Array<Record<string, unknown>>,
): Promise<{ status: string; applied: number; errors: string[] }> => {
  const result = await executeOptimizerActions({ userId, actions });
  return { status: result.status, applied: result.results.length, errors: result.errors };
};

export const getRealtimeSnapshotPhase1 = async (userId: string): Promise<Record<string, unknown>> => {
  return await getRealtimeDashboard(userId);
};

export const getMicroInfluencerPlanPhase1 = async (
  userId: string,
  niche: string,
  product: ProductOpportunity,
  supplier: SupplierCandidate | null,
  budget: number,
): Promise<MicroInfluencerPlan> => {
  const data = await getMicroInfluencerPlan({
    userId,
    niche,
    productName: product.name,
    productPrice: product.targetPrice,
    productCost: supplier?.price ?? product.unitCost,
    budget,
  });

  return {
    recommendedFollowerRange: data.recommended_follower_range,
    channel: data.channel,
    estimatedCreatorCount: data.estimated_creator_count,
    storyBudgetPerCreator: data.story_budget_per_creator,
    allocatedBudget: data.allocated_budget,
    targetCpa: data.target_cpa,
    targetRoas: data.target_roas,
    outreachTemplate: data.outreach_template,
    brief: data.brief,
  };
};

export const getTrustChecklistPhase1 = async (
  userId: string,
  hasOfferV2: boolean,
): Promise<TrustChecklist> => {
  return await getTrustChecklist({
    userId,
    paypalEnabled: true,
    shippingPolicy: true,
    termsPolicy: true,
    sampleQualityChecked: false,
    relatedUpsellEnabled: hasOfferV2,
  });
};

export const createOfferExperimentPhase1 = async (
  userId: string,
  productName: string,
  offerV2: OfferRecommendationV2,
): Promise<{ experimentId: string }> => {
  const variantAName = String(offerV2.abTest.variantA.name || 'Variant A');
  const variantBName = String(offerV2.abTest.variantB.name || 'Variant B');

  const response = await createExperiment({
    userId,
    name: `${productName} Offer Test`,
    variants: [
      { variant_id: 'A', name: variantAName, offer_type: 'bundle', is_live: true },
      { variant_id: 'B', name: variantBName, offer_type: 'upsell', is_live: false },
    ],
    rules: {
      metric: 'cvr',
      min_impressions: 500,
      min_lift_pct: 10,
      max_p_value: 0.05,
      auto_promote: true,
    },
  });

  return { experimentId: response.experiment_id };
};

export const runExperimentTrafficSamplePhase1 = async (
  userId: string,
  experimentId: string,
): Promise<void> => {
  const sessions = 120;
  for (let i = 0; i < sessions; i += 1) {
    const sessionId = `sess-${Date.now()}-${i}`;
    const assigned = await assignExperimentVariant({
      userId,
      experimentId,
      sessionId,
    });
    const variantId = assigned.variant_id;
    await ingestExperimentEvent({
      userId,
      experimentId,
      sessionId,
      variantId,
      eventType: 'impression',
    });
    if (i % 11 === 0) {
      await ingestExperimentEvent({
        userId,
        experimentId,
        sessionId,
        variantId,
        eventType: 'conversion',
        revenue: i % 22 === 0 ? 89 : 62,
      });
    }
    if (i % 5 === 0) {
      await ingestExperimentEvent({
        userId,
        experimentId,
        sessionId,
        variantId,
        eventType: 'spend',
        spend: 4.5,
      });
    }
  }
};

export const evaluateOfferExperimentPhase1 = async (
  userId: string,
  experimentId: string,
): Promise<{ promoted: boolean; topVariantId: string; liftPct: number }> => {
  const result = await evaluateExperiment({
    userId,
    experimentId,
  });
  const evaluation = result.evaluation || {};
  return {
    promoted: Boolean(evaluation.promoted),
    topVariantId: String(evaluation.top_variant_id || ''),
    liftPct: Number(evaluation.lift_pct || 0),
  };
};

export const listExperimentsPhase1 = async (userId: string): Promise<Array<Record<string, unknown>>> => {
  const result = await listExperiments(userId);
  return result.items as unknown as Array<Record<string, unknown>>;
};

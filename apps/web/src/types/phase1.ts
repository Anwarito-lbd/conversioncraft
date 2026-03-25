export type IntegrationPlatform = 'shopify' | 'meta' | 'tiktok' | 'instagram' | 'facebook';

export interface IntegrationAccount {
  platform: IntegrationPlatform;
  connected: boolean;
  accountName: string;
  connectedAt?: string;
  authUrl?: string;
  oauthState?: string;
  oauthNonce?: string;
}

export interface CompetitorInsight {
  url: string;
  viralScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendedCounters: string[];
  topChannels: string[];
}

export interface ProductOpportunity {
  id: string;
  name: string;
  reason: string;
  source: string;
  score: number;
  supplierHint: string;
  unitCost: number;
  targetPrice: number;
  imageUrl?: string;
}

export interface SupplierCandidate {
  id: string;
  name: string;
  url: string;
  price: number;
  shippingTime: string;
  moq: string;
  rating: number;
  location: string;
  verified: boolean;
}

export interface ProductPageDraft {
  productName: string;
  headline: string;
  subheadline: string;
  features: string[];
  cta: string;
  seoTitle: string;
  seoMeta: string;
}

export interface OfferStack {
  headline: string;
  bundleName: string;
  bundlePrice: number;
  savingsPercent: number;
  oneClickUpsell: string;
  postPurchaseUpsell: string;
  urgencyCopy: string;
  guarantee: string;
}

export interface OfferUiBlock {
  placement: string;
  title: string;
  subtitle: string;
  cta: string;
}

export interface OfferRecommendationV2 {
  product: { name: string; price: number; cost: number; margin: number };
  constraintsApplied: { minMargin: number; maxDiscountPercent: number; minInventory: number };
  recommendations: Array<Record<string, unknown>>;
  preCheckoutBlocks: OfferUiBlock[];
  postPurchaseBlocks: OfferUiBlock[];
  abTest: {
    variantA: Record<string, unknown>;
    variantB: Record<string, unknown>;
  };
}

export interface MicroInfluencerPlan {
  recommendedFollowerRange: string;
  channel: string;
  estimatedCreatorCount: number;
  storyBudgetPerCreator: number;
  allocatedBudget: number;
  targetCpa: number;
  targetRoas: number;
  outreachTemplate: string;
  brief: string[];
}

export interface TrustChecklist {
  score: number;
  checks: Array<{ id: string; label: string; ok: boolean }>;
  missing: string[];
  status: 'ready' | 'needs_work';
}

export interface CreativeDraft {
  hook: string;
  body: string;
  visualCue: string;
  cta: string;
  captions: {
    platform: 'TikTok' | 'Instagram';
    text: string;
    hashtags: string[];
  }[];
  workflowNodes: number;
}

export type CampaignObjective = 'conversions' | 'traffic' | 'engagement';

export interface CampaignPlanInput {
  dailyBudget: number;
  objective: CampaignObjective;
  markets: string[];
  interests: string[];
}

export interface CampaignPlan {
  objective: CampaignObjective;
  dailyBudget: number;
  split: { platform: IntegrationPlatform; amount: number }[];
  recommendedAudience: {
    markets: string[];
    interests: string[];
    ageRange: string;
  };
  creativeChecklist: string[];
}

export interface PublishResult {
  status: 'drafted' | 'failed';
  message: string;
  references: string[];
}

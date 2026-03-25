

export enum BusinessModel {
  DROPSHIPPING = 'DROPSHIPPING',
  DROPSERVICING = 'DROPSERVICING'
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  WAR_ROOM = 'WAR_ROOM', // Legacy map to Competitor Intel
  COMPETITOR_INTEL = 'COMPETITOR_INTEL',
  PRODUCT_RESEARCH = 'PRODUCT_RESEARCH', // Merged View
  PAGE_BUILDER = 'PAGE_BUILDER',
  CREATIVE_STUDIO = 'CREATIVE_STUDIO',
  AUTO_PILOT = 'AUTO_PILOT',
  SETTINGS = 'SETTINGS'
}

export enum ProjectPhase {
  IDEATION = 'IDEATION',
  MARKET_INTEL = 'MARKET_INTEL',
  SOURCING = 'SOURCING',
  CREATION = 'CREATION',
  LAUNCH = 'LAUNCH'
}

export interface ProjectState {
  isInitialized: boolean;
  model: BusinessModel | null;
  hasProduct: boolean;
  productName?: string;
  niche?: string;
  competitorsIdentified: boolean;
  competitorUrls: string[];
  currentMissionPhase: 'INTEL' | 'SUPPLY' | 'ASSAULT';
}

export interface WinningProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  productImages: string[];
  price: number;
  cost: number;
  profit: number;
  roi: number;
  saturation: number;
  competition: number;
  viralScore: number;
  shopifyStoreCount: number;
  salesData: { day: string; value: number }[];
  winningReason: string;
  marketPotential: string;
  benefits: string[];
  angles: string[];
  aliExpressSignals: string[];
  amazonSignals: string[];
  tiktokSignals: string[];
  suppliers: {
    name: string;
    link: string;
    price: number;
    shipping: string;
    moq: string;
    rating: number;
  }[];
}

export interface SupplierV2 {
  id: string;
  name: string;
  url: string;
  price: string;
  rating: number;
  moq: string;
  productImages: string[];
  verifiedSeller: boolean;
  warehouseLocations: string[];
  shippingTimeEstimated: string;
  orderVolumeHistory: number[];
  priceStability: "High" | "Medium" | "Low";
  negotiationTips: string[];
  privateLabelPotential: string;
  supplyChainRiskScore: number;
  reliabilityScore: number;
  returnPolicy: string;
  productMatchConfidence: number;
}

export interface ArbitrageOpportunity {
  id: string;
  productName: string;
  sourcePrice: number;
  targetPrice: number;
  margin: number;
  platform: "Amazon" | "TikTok Shop" | "Walmart";
  confidenceScore: number;
  sourceUrl: string;
}

export interface CompetitorAnalysis {
  viralScore: number;
  viralReasoning: string;
  trafficIntel: {
     monthlyVisits: string;
     bounceRate: string;
     avgDuration: string;
     topCountry: string;
     estAdSpend: string;
     trafficSources: { source: string; percent: number }[];
  };
  socialLinks: { platform: string; url: string; followers: string }[];
  directCompetitors: { name: string; url: string; threatLevel: "High" | "Medium" | "Low"; primaryAdvantage: string }[];
  attackPlan: { tactic: string; action: string; difficulty: "Easy"|"Medium"|"Hard"; impact: "High"|"Critical" }[];
  recentActivity: { date: string; type: "AD_LAUNCH"|"PRICE_CHANGE"|"VIRAL_SPIKE"|"SOCIAL_POST"; description: string; impactLevel: "LOW"|"MEDIUM"|"HIGH" }[];
  seoStrategy: {
    topKeywords: string[];
    paidSearchTerms: string[];
    keywordStrategySummary: string;
  };
  videoAds: { 
    thumbnail: string; 
    hook: string; 
    strategy: string;
    counterHook: string; 
  }[];
  brandIdentity: {
      voice: string;
      visualStyle: string;
      keyThemes: string[];
      brandColors: string[];
  };
  swot?: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  adHooks?: string[];
}

export interface AdScript {
  hook: string;
  body: string;
  visualCue: string;
  cta: string;
}

export interface AdMutation {
  id: string;
  variantName: string;
  hook: string;
  visualStyle: string;
  predictedCTR: number;
  status: string;
}

export interface SocialPost {
  platform: string;
  caption: string;
  hashtags: string[];
}

export interface CustomerReview {
  id: string;
  author: string;
  rating: number;
  content: string;
  date: string;
  verified: boolean;
}

export interface LandingPageData {
  productName: string;
  headline: string;
  subheadline: string;
  features: string[];
  description: string;
  callToAction: string;
  seoTitle: string;
  seoMeta: string;
  visualDescription: string;
  price?: string;
  currency?: string;
  reviews: CustomerReview[];
  mockupImages: string[];
  professionalImages: string[];
  templateName: string;
  is360Available?: boolean;
  rotationImages?: string[];
}

export interface AutoPilotResult {
  product: WinningProduct;
  suppliers: any[]; // Simplified for brevity in this context
  landingPage: LandingPageData;
  adScript: AdScript;
  marketingImage: string;
  comfyUiWorkflow: any;
  optimizationPlan: string;
}

export type VideoArchetype = 'AI_INFLUENCER' | 'ASMR_UNBOXING' | 'GREEN_SCREEN' | 'CINEMATIC_DEMO';

export enum MarketingStrategy {
  ORGANIC_VIRAL = 'ORGANIC_VIRAL',
  PAID_SCALING = 'PAID_SCALING'
}

export interface ConnectedAccount {
  platform: string;
  username: string;
  isConnected: boolean;
  followers: string;
}

export interface UserState {
  onboardingComplete: boolean;
  businessModel: BusinessModel | null;
  hasItem: boolean;
  currentItemName: string;
  currentReferenceUrl: string;
  currentPhase: ProjectPhase;
  completedSteps: string[];
}

export interface IdeaItem {
  id: string;
  title: string;
  snippet: string;
  module: string;
  link?: string;
  data?: any;
  date: string;
  isPinned?: boolean;
}

export interface Supplier {
  name: string;
  url: string;
  price: string | number;
  notes?: string;
  shippingTime?: string;
  moq?: string;
  rating?: number;
  isVerified?: boolean;
  location?: string;
}

export interface BillingPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  isPopular?: boolean;
}

export interface MarketSimulationResult {
  productName: string;
  pricePoint: number;
  agentsSimulated: number;
  predictedCVR: number;
  predictedROAS: number;
  audienceBreakdown: { segment: string; conversionRate: number; objection: string }[];
  salesHeatmap: { hour: number; sales: number }[];
  verdict: string;
}

export interface TrendGenesisResult {
  trendName: string;
  predictionDate: string;
  confidenceScore: number;
  aestheticKeywords: string[];
  originSignal: string;
  growthTrajectory: { week: string; score: number }[];
  description: string;
}

export interface CompetitorReport {
  url: string;
  viralScore: number;
  adFatigue: string;
  shippingModel: string;
  estimatedRevenue: string;
  weaknesses: string[];
  counterHooks: string[];
}
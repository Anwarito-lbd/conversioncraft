

import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AutoPilotResult, WinningProduct, Supplier, LandingPageData, AdScript, SocialPost, SupplierV2, CustomerReview, MarketSimulationResult, TrendGenesisResult, ArbitrageOpportunity, AdMutation, BusinessModel, VideoArchetype } from "../types";

// Initialize with environment variable
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Helper to get a fresh client for Veo which might require re-selecting keys
 */
const getVeoClient = async () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Helper to robustly extract JSON from text
 */
const cleanJson = (text: string) => {
  if (!text) return "{}";
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (match) {
    return match[1];
  }
  const firstOpenBrace = text.indexOf('{');
  const firstOpenBracket = text.indexOf('[');
  
  let start = -1;
  let end = -1;

  if (firstOpenBrace !== -1 && (firstOpenBracket === -1 || firstOpenBrace < firstOpenBracket)) {
    start = firstOpenBrace;
    end = text.lastIndexOf('}');
  } else if (firstOpenBracket !== -1) {
    start = firstOpenBracket;
    end = text.lastIndexOf(']');
  }

  if (start !== -1 && end !== -1 && end > start) {
    return text.substring(start, end + 1);
  }
  return text.trim();
};

// --- NUE CUP VIRAL THEME CONTEXT (DEFAULT BASE) ---
const NUE_CUP_THEME_CONTEXT = `
THEME STRUCTURE REFERENCE (Viral PagePilot Style):
**HIGH-CONVERSION LANDING PAGE ARCHETYPE**

1. **Headline**: Short, punchy, benefit-driven. (e.g. "The Last Neck Fan You'll Ever Need")
2. **Hero**: Immersive product shot.
3. **Benefit Bullets**: 3 key selling points with checkmarks.
4. **Social Proof**: "Rated 4.9/5 by 10,000+ Customers".
5. **The Problem vs Solution**: Emotional hook.
6. **Features Grid**: Visual icons + short text.
7. **CTA**: "Add to Cart - 50% OFF Today Only".

VISUAL STYLE:
- Minimalist, Apple-like aesthetic.
- Large typography.
- High contrast CTA buttons.
`;

/**
 * Competitor Intelligence - Forensic Update
 */
export const analyzeCompetitor = async (url: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Analyze the e-commerce brand or service at this URL (or brand name): ${url}. 
      
      Act as a "Forensic E-commerce Analyst" using the methodologies from the "Strategic Market Intelligence 2025" report.
      
      1. **Forensic Search**:
         - Identify the "Seller of Record" or official business entity if possible.
         - Estimate Monthly Traffic & Ad Spend using search grounding (SimilarWeb/Semrush proxies).
         - Find their official social media profiles (TikTok, Instagram, FB) and follower counts.
         - Detect "Recent Activities" (Price changes, new ads, viral spikes).
      
      2. **Threat Identification (The "Other Threats")**:
         - Find 3-5 DIRECT competitors selling similar products in this niche.
         - Analyze *why* they are threats (e.g., Lower Price, Better Branding, Fast Shipping).
      
      3. **Creative & Brand DNA**:
         - Extract precise Brand Colors (Hex Codes) and visual style description.
         - Analyze their "Ad Hooks" and generate specific "Counter-Hooks" to beat them.
      
      CRITICAL: Return ONLY valid JSON. Do not include any conversational text.
      
      Strict JSON Schema:
      {
        "viralScore": number, // 0-100 based on traffic/social signals
        "viralReasoning": string,
        "trafficIntel": {
           "monthlyVisits": string, // e.g. "150k"
           "bounceRate": string, // e.g. "45%"
           "avgDuration": string, // e.g. "2m 30s"
           "topCountry": string, // e.g. "USA"
           "estAdSpend": string, // e.g. "$15k/mo" - MUST be realistic based on search
           "trafficSources": [ { "source": string, "percent": number } ]
        },
        "socialLinks": [
           { "platform": "TikTok" | "Instagram" | "Facebook" | "YouTube" | "Twitter", "url": string, "followers": string }
        ],
        "directCompetitors": [
           { "name": string, "url": string, "threatLevel": "High" | "Medium" | "Low", "primaryAdvantage": string }
        ],
        "attackPlan": [
           { "tactic": string, "action": string, "difficulty": "Easy"|"Medium"|"Hard", "impact": "High"|"Critical" }
        ],
        "swot": {
          "strengths": string[],
          "weaknesses": string[],
          "opportunities": string[],
          "threats": string[] // Macro threats (e.g., Supply Chain, Saturation)
        },
        "recentActivity": [
            { "date": string, "type": "AD_LAUNCH"|"PRICE_CHANGE"|"VIRAL_SPIKE"|"SOCIAL_POST", "description": string, "impactLevel": "LOW"|"MEDIUM"|"HIGH" }
        ],
        "adHooks": string[],
        "marketingChannels": [
           { "channel": string, "percentage": number, "insight": string } 
        ],
        "priorityChannels": [
           { "channel": string, "rationale": string }
        ],
        "demographics": {
          "ageRange": string,
          "gender": string,
          "topInterests": string[],
          "locations": string[]
        },
        "seoStrategy": {
          "topKeywords": [string, string, string, string, string],
          "paidSearchTerms": [string, string, string, string, string],
          "keywordStrategySummary": string
        },
        "categoryTrends": [
           { "keyword": string, "growth": number, "volume": number }
        ],
        "keyInfluencers": [
            { "name": string, "platform": string, "reach": string, "engagement": string }
        ],
        "influencerSummary": [ string, string, string ],
        "videoAds": [
            { 
              "thumbnail": string, 
              "hook": string, 
              "strategy": string,
              "counterHook": string 
            } 
        ],
        "adStrategySummary": [ string, string ], 
        "funnelAnalysis": [
            { "step": "Landing Page" | "Product Page" | "Cart" | "Checkout", "frictionPoints": string[], "conversionRateEst": string }
        ],
        "croRecommendations": string[], 
        "offerAnalysis": {
            "pricingModel": string,
            "bundles": string[],
            "guarantees": string,
            "strategyInsight": string
        },
        "sentimentAnalysis": {
            "sentimentScore": number, 
            "positiveHighlights": [string, string, string, string, string],
            "negativeHighlights": [string, string, string],
            "commonPhrases": [string, string, string]
        },
        "brandIdentity": {
            "voice": string, 
            "visualStyle": string, 
            "keyThemes": [string, string],
            "brandColors": [string, string, string] 
        }
      }`,
      config: {
        thinkingConfig: { thinkingBudget: 4096 }, 
        tools: [{ googleSearch: {} }], 
      }
    });

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const jsonText = cleanJson(response.text || "{}");

    return {
      data: JSON.parse(jsonText),
      sources: chunks.map((c: any) => c.web?.uri).filter(Boolean)
    };
  } catch (error) {
    console.error("Analysis failed", error);
    throw error;
  }
};

export const searchAdLibrary = async (brandName: string) => {
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Search specifically for "${brandName}" active ads in the TikTok Creative Center and Meta Ad Library.
        Analyze their recent video creatives. Focus on visual hooks, psychology, and creative strategy.
        
        CRITICAL: Return ONLY valid JSON.
        
        Schema:
        {
           "videoAds": [
                { "thumbnail": string, "hook": string, "strategy": string }
            ],
            "adStrategySummary": [ string, string ]
        }`,
        config: {
            tools: [{ googleSearch: {} }],
            thinkingConfig: { thinkingBudget: 2048 }
        }
    });
    const jsonText = cleanJson(response.text || "{}");
    return JSON.parse(jsonText);
  } catch (e) {
      console.error(e);
      return { videoAds: [], adStrategySummary: [] };
  }
};

export const findWinningProducts = async (niche: string): Promise<string> => {
  const isGeneric = !niche || niche.includes('Viral Trends');
  const promptContext = isGeneric 
    ? "Proactively suggest 10 distinct, high-potential winning products across different trending categories (Tech, Beauty, Home, Gadgets). Focus on 'Breakout' trends that are just starting to go viral." 
    : `Find 10 highly trending, viral winning products in the '${niche}' niche.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `${promptContext}
    Act like Dropship.io or SaturationInspector.
    
    IMPORTANT IMAGE INSTRUCTION:
    For "productImages", use Google Search to find REAL, direct image URLs (JPG/PNG/WEBP) from major e-commerce CDNs like AliExpress, Amazon, or Shopify. 
    Do NOT use placeholder images. Do NOT use generic stock photos.
    If a real URL cannot be found, leave the array empty.
    
    CRITICAL: Return ONLY a valid JSON Array matching strict schema.
    
    Schema:
    [
      {
        "id": string, // unique id
        "name": string,
        "description": string,
        "category": string,
        "productImages": [string, string], // Real URLs found via search
        "price": number,
        "cost": number,
        "profit": number,
        "roi": number, // e.g. 2.5
        "saturation": number, // 0-100
        "competition": number, // 0-100
        "viralScore": number, // 0-100
        "shopifyStoreCount": number,
        "salesData": [ 
           { "day": "1", "value": number }, 
           { "day": "2", "value": number },
           ... (7 days)
        ],
        "winningReason": string,
        "marketPotential": string,
        "benefits": [string, string, string],
        "angles": [string, string, string],
        "aliExpressSignals": [string], 
        "amazonSignals": [string], 
        "tiktokSignals": [string], 
        "suppliers": [
           { "name": string, "link": string, "price": number, "shipping": string, "moq": string, "rating": number }
        ]
      }
    ]`,
    config: {
      tools: [{ googleSearch: {} }],
      thinkingConfig: { thinkingBudget: 4096 }
    }
  });
  
  const jsonText = cleanJson(response.text || "[]");
  return jsonText;
};

export const findWinningServices = async (niche: string): Promise<string> => {
  const isGeneric = !niche || niche.includes('Viral Trends');
  const promptContext = isGeneric 
    ? "Proactively suggest 10 high-demand 'Dropservicing' ideas (e.g. AI Automation, Short-Form Editing, SEO Audits, UGC Agency). Focus on services with high ticket value and viral demand." 
    : `Find 10 high-potential Dropservicing ideas in the '${niche}' industry.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `${promptContext}
    Act like a Service Business Analyst.
    
    IMPORTANT: Map service concepts to the Product Schema.
    - "price" = Service Retainer / Package Price
    - "cost" = Cost to outsource to freelancer/software
    - "suppliers" = Platforms or Tools to fulfill the service (e.g. Upwork, Midjourney)
    - "productImages" = Find representative icons or visuals for the service.
    
    CRITICAL: Return ONLY a valid JSON Array matching strict schema.
    
    Schema:
    [
      {
        "id": string,
        "name": string, // e.g. "AI Chatbot Agency"
        "description": string,
        "category": string,
        "productImages": [string], 
        "price": number,
        "cost": number,
        "profit": number,
        "roi": number,
        "saturation": number,
        "competition": number,
        "viralScore": number,
        "shopifyStoreCount": number, // Interpret as "Active Agencies"
        "salesData": [ 
           { "day": "1", "value": number }, 
           ...
        ],
        "winningReason": string,
        "marketPotential": string,
        "benefits": [string, string, string],
        "angles": [string, string, string],
        "aliExpressSignals": [string], 
        "amazonSignals": [string], 
        "tiktokSignals": [string], 
        "suppliers": [
           { "name": string, "link": string, "price": number, "shipping": string, "moq": string, "rating": number }
        ]
      }
    ]`,
    config: {
      tools: [{ googleSearch: {} }],
      thinkingConfig: { thinkingBudget: 4096 }
    }
  });
  
  const jsonText = cleanJson(response.text || "[]");
  return jsonText;
};

export const findSuppliers = async (productName: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Find 5 distinct suppliers for: ${productName}.
    Return JSON array of objects: name, url, price, notes, shippingTime, moq, rating, isVerified, location.`,
    config: {
      tools: [{ googleSearch: {} }],
    }
  });
  const jsonText = cleanJson(response.text || "[]");
  return jsonText;
};

export const findSuppliersV2 = async (productName: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Find 6 verified, high-quality suppliers for: "${productName}".
    Perform a deep supply chain analysis.
    
    CRITICAL: Return ONLY a valid JSON Array matching strict schema.
    
    Schema:
    [
      {
        "id": string,
        "name": string,
        "url": string,
        "price": string,
        "rating": number,
        "moq": string,
        "productImages": [string],
        "verifiedSeller": boolean,
        "warehouseLocations": [string],
        "shippingTimeEstimated": string,
        "orderVolumeHistory": [number],
        "priceStability": "High" | "Medium" | "Low",
        "negotiationTips": [string, string],
        "privateLabelPotential": string,
        "supplyChainRiskScore": number,
        "reliabilityScore": number,
        "returnPolicy": string,
        "productMatchConfidence": number
      }
    ]`,
    config: {
      tools: [{ googleSearch: {} }],
      thinkingConfig: { thinkingBudget: 4096 }
    }
  });
  
  const jsonText = cleanJson(response.text || "[]");
  return jsonText;
};

export const generateAdScript = async (productName: string, platform: 'TikTok' | 'Instagram', archetype?: VideoArchetype) => {
    const archetypeContext = archetype ? `
    ARCHETYPE INSTRUCTION: This script must fit the "${archetype}" style.
    - AI_INFLUENCER: POV style, talking head, Gen Z slang, authentic recommendation.
    - ASMR_UNBOXING: Minimal speaking, focus on satisfying sounds (clicks, rustles), visual texture triggers.
    - GREEN_SCREEN: "React" style video with the product/website in background.
    - CINEMATIC_DEMO: High-end commercial vibe, focus on luxury and slow-motion.
    ` : "";

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Write a viral ${platform} video ad script for "${productName}".
        ${archetypeContext}
        Return purely JSON with keys: hook, body, visualCue, cta.`,
        config: {
            responseMimeType: "application/json",
            thinkingConfig: { thinkingBudget: 2048 }
        }
    });
    return response.text;
}

export const generateAdMutations = async (seedScript: AdScript): Promise<AdMutation[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Act as an "Ad Mutation Engine".
    Take this Seed Script: ${JSON.stringify(seedScript)}
    
    Generate 5 "Mutated" variations designed to beat the control.
    - Mutation A: Aggressive Hook
    - Mutation B: Storytelling Approach
    - Mutation C: ASMR/Sensory Focus
    - Mutation D: Controversy/Debate
    - Mutation E: Value/Logic Stack
    
    CRITICAL: Return strictly JSON Array.
    Schema:
    [
      {
        "id": string,
        "variantName": string,
        "hook": string,
        "visualStyle": string,
        "predictedCTR": number, // e.g. 2.4
        "status": "Active"
      }
    ]`,
    config: {
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 2048 }
    }
  });
  return JSON.parse(cleanJson(response.text || "[]"));
};

export const findArbitrageOpportunities = async (niche: string): Promise<ArbitrageOpportunity[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Act as an "Omni-Channel Arbitrage Scanner".
    Scan the "${niche}" category for products with massive price discrepancies between suppliers (AliExpress/Temu) and marketplaces (Amazon/Walmart).
    
    Find 5 opportunities where margin > 60%.
    
    CRITICAL: Return strictly JSON Array.
    Schema:
    [
      {
        "id": string,
        "productName": string,
        "sourcePrice": number, // e.g. 5.00
        "targetPrice": number, // e.g. 25.00
        "margin": number, // e.g. 20.00
        "platform": "Amazon" | "TikTok Shop" | "Walmart",
        "confidenceScore": number, // 0-100
        "sourceUrl": string
      }
    ]`,
    config: {
       tools: [{ googleSearch: {} }],
       thinkingConfig: { thinkingBudget: 4096 }
    }
  });
  return JSON.parse(cleanJson(response.text || "[]"));
};

export const generateComfyUIWorkflow = async (adScript: any) => {
    return {
        "nodes": [
            { "id": 1, "type": "CheckpointLoaderSimple", "widgets_values": ["v1-5-pruned-emaonly.ckpt"] },
            { "id": 2, "type": "CLIPTextEncode", "widgets_values": [adScript.visualCue] },
            { "id": 6, "type": "SaveImage" }
        ],
        "meta": {
            "script_hook": adScript.hook,
            "generated_by": "ConversionCraft AI"
        }
    };
};

export const generateSocialPost = async (productName: string, platform: 'TikTok' | 'Instagram'): Promise<SocialPost> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Create a viral caption for a ${platform} post about ${productName}.
        Return strictly valid JSON: { "platform": "${platform}", "caption": "string", "hashtags": ["string"] }`,
        config: {
             responseMimeType: "application/json"
        }
    });
    const jsonText = cleanJson(response.text || "{}");
    return JSON.parse(jsonText);
}

export const uploadToSocials = async (post: SocialPost, mediaUrl: string) => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { success: true, platform: post.platform, postId: `mock_id_${Date.now()}` };
}

export const generateReviews = async (productName: string, supplierUrl?: string): Promise<CustomerReview[]> => {
  const context = supplierUrl 
    ? `based on real feedback found at this URL: ${supplierUrl}` 
    : "based on typical customer sentiment for this product type";

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Generate 5 realistic, high-quality customer reviews for "${productName}" ${context}.
    If the URL is provided, use Google Search to find actual reviews and summarize them into these 5 entries.
    Mix of 5-star and 4-star reviews.
    Include specific details about the product benefits mentioned in the link.
    
    Return JSON Array:
    [
      { "id": "string", "author": "string", "rating": number, "content": "string", "date": "string", "verified": boolean }
    ]`,
    config: {
      tools: supplierUrl ? [{ googleSearch: {} }] : undefined
    }
  });
  const jsonText = cleanJson(response.text || "[]");
  return JSON.parse(jsonText);
};

export const generate3DMockup = async (productName: string, visualDescription: string = "") => {
  const desc = visualDescription ? `matching this description: ${visualDescription}` : "";
  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt: `Commercial product photography of ${productName} ${desc}. 
    CRITICAL: Centered composition, studio lighting, soft shadows, pure white background #FFFFFF, 
    8k resolution, highly detailed texture, unreal engine 5 render style, minimalist advertising aesthetic. 
    No text overlays. No props. Just the isolated product.`,
    config: { numberOfImages: 1, aspectRatio: '1:1', outputMimeType: 'image/jpeg' }
  });
  const base64 = response.generatedImages[0].image.imageBytes;
  return `data:image/jpeg;base64,${base64}`;
};

export const generate360Sprite = async (productName: string, visualDescription: string) => {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `A grid of 4 images showing the same ${productName} from different angles (Front, Left Side, Back, Right Side) for a 360 degree product view. 
        ${visualDescription}.
        White background, consistent lighting, photorealistic, studio quality.
        Ensure the product size and position is identical in all 4 angles to allow for smooth rotation animation.`,
        config: { numberOfImages: 1, aspectRatio: '16:9', outputMimeType: 'image/jpeg' }
    });
    const base64 = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64}`;
}

export const generateProductPage = async (supplierUrl: string, productName?: string, businessModel: BusinessModel = BusinessModel.DROPSHIPPING) => {
  const isService = businessModel === BusinessModel.DROPSERVICING;
  
  const activeThemeContext = isService ? `
  THEME STRUCTURE REFERENCE (Service Agency / B2B):
  1. **Sticky Header**: "Book A Call" CTA.
  2. **Hero**: Video background of service delivery/dashboard. Headline: "We Scale Your X to Y".
  3. **Social Proof**: "Trusted by [Logo] [Logo]".
  4. **The Offer**: 3-Tier Pricing Cards (Starter, Growth, Enterprise).
  5. **Case Studies**: Before/After metrics.
  6. **FAQ**: "How does the onboarding work?".
  ` : NUE_CUP_THEME_CONTEXT;

  const themeName = isService ? 'Agency High-Ticket Funnel' : 'Viral PagePilot Store';

  const prompt = `
  You are an expert e-commerce/agency developer building a page using the '${themeName}'.
  
  Context: ${isService ? 'DROPSERVICING (Service Business)' : 'DROPSHIPPING (Physical Product)'}
  Reference URL: ${supplierUrl}
  ${productName ? `Name: ${productName}` : 'Task: Extract the Name from the URL analysis.'}
  
  Reference the following MANDATORY THEME STRUCTURE:
  ${activeThemeContext}
  
  1. Analyze the URL (if provided) to understand the offering.
  2. Generate high-converting, punchy copy. Short headlines. Benefit-driven bullets.
  3. Create a "visualDescription" string describing the key visual element (Product or Dashboard/Service Rep) for 3D generation.
  4. **IMPORTANT**: If a URL is provided, do your best to extract the **Price** and **Currency** of the offer.
  
  Return a JSON object with the following structure.
  Strict JSON Schema:
  {
     "productName": string, // Extracted or confirmed name
     "headline": string,
     "subheadline": string,
     "features": [string, string, string, string],
     "description": string,
     "callToAction": string,
     "seoTitle": string,
     "seoMeta": string,
     "visualDescription": string, // Description of physical appearance or service visual for image generation
     "price": string, // e.g. "49.99"
     "currency": string // e.g. "$"
  }
  `;

  const copyResponse = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      thinkingConfig: { thinkingBudget: 2048 }
    }
  });
  const copyText = cleanJson(copyResponse.text || "{}");
  const copyData = JSON.parse(copyText);
  
  const finalProductName = productName || copyData.productName || "Unknown Offer";
  const reviews = await generateReviews(finalProductName, supplierUrl);

  return {
    ...copyData,
    productName: finalProductName,
    reviews,
    mockupImages: [],
    professionalImages: [],
    templateName: themeName
  };
};

export const generateMarketingImage = async (prompt: string) => {
  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt: prompt,
    config: { numberOfImages: 1, aspectRatio: '1:1', outputMimeType: 'image/jpeg' }
  });
  const base64 = response.generatedImages[0].image.imageBytes;
  return `data:image/jpeg;base64,${base64}`;
};

export const editProductImage = async (imageBase64: string, mimeType: string, prompt: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: imageBase64, mimeType: mimeType } },
        { text: prompt }
      ]
    },
    config: { responseModalities: [Modality.IMAGE] }
  });
  const part = response.candidates?.[0]?.content?.parts?.[0];
  if (part && part.inlineData) {
    return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("No image returned from edit");
};

// --- VEO 3.1 VIDEO GENERATION (UPDATED FOR ARCHETYPES) ---
export const generateVideoAd = async (prompt: string, aspectRatio: '16:9' | '9:16' = '9:16', archetype?: VideoArchetype) => {
  const veoAi = await getVeoClient();
  
  // Enhance prompt based on Archetype for Veo
  let enhancedPrompt = prompt;
  if (archetype === 'AI_INFLUENCER') {
      enhancedPrompt = `Photorealistic UGC-style video shot on iPhone. A friendly, energetic Gen Z creator (face visible) talking directly to camera, holding and demonstrating ${prompt}. Natural bedroom lighting. TikTok aesthetic.`;
  } else if (archetype === 'ASMR_UNBOXING') {
      enhancedPrompt = `First-person POV shot of hands unboxing and using ${prompt}. Satisfying movements, crisp focus on textures. No face visible. Clean, bright studio surface. ASMR visual style.`;
  } else if (archetype === 'GREEN_SCREEN') {
      enhancedPrompt = `TikTok "Green Screen" effect video. A creator in the foreground pointing at a screenshot of ${prompt} in the background. Excited expression. Text overlays popping up.`;
  } else if (archetype === 'CINEMATIC_DEMO') {
      enhancedPrompt = `High-end commercial cinematography of ${prompt}. Slow motion product shots, dramatic lighting, 4k resolution, depth of field. Luxury advertisement style.`;
  }

  let operation = await veoAi.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: enhancedPrompt,
    config: { numberOfVideos: 1, resolution: '720p', aspectRatio: aspectRatio }
  });
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await veoAi.operations.getVideosOperation({ operation: operation });
  }
  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("Video generation failed");
  const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

export const animateImageToVideo = async (imageBase64: string, mimeType: string, prompt: string) => {
   const veoAi = await getVeoClient();
   let operation = await veoAi.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    image: { imageBytes: imageBase64, mimeType: mimeType },
    config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '9:16' }
   });
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await veoAi.operations.getVideosOperation({ operation: operation });
    }
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video animation failed");
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
}

export const runAutoPilot = async (
  niche: string, 
  onProgress: (log: string, step: 'ANALYZE' | 'PLAN' | 'CREATE' | 'PUBLISH' | 'OPTIMIZE') => void
): Promise<AutoPilotResult> => {
  onProgress(`Scanning global trends for niche: "${niche}"...`, 'ANALYZE');
  const productsJson = await findWinningProducts(niche);
  const products: WinningProduct[] = JSON.parse(productsJson);
  if (!products.length) throw new Error("No products found.");
  
  const bestProduct = products[0];
  onProgress(`Winner identified: ${bestProduct.name}`, 'ANALYZE');

  let competitorInsights = null;
  try {
      const compAnalysis = await analyzeCompetitor(bestProduct.name); 
      competitorInsights = compAnalysis.data;
      onProgress(`Analyzed competitor. Viral Score: ${compAnalysis.data.viralScore}`, 'ANALYZE');
  } catch (e) {
      console.warn("Competitor analysis skipped for auto-pilot.", e);
  }

  onProgress(`Locating verified suppliers...`, 'PLAN');
  const suppliersJson = await findSuppliers(bestProduct.name);
  const suppliers: Supplier[] = JSON.parse(suppliersJson);
  
  onProgress(`Architecting landing page...`, 'CREATE');
  const sourceUrl = suppliers.length > 0 ? suppliers[0].url : `https://aliexpress.com/item/autopilot_${bestProduct.id}`;
  const pageData = await generateProductPage(sourceUrl, bestProduct.name);
  const landingPage: LandingPageData = pageData;
  
  onProgress(`Scripting viral hook...`, 'CREATE');
  const scriptJson = await generateAdScript(bestProduct.name, 'TikTok');
  const adScript: AdScript = JSON.parse(scriptJson);

  onProgress(`Generating ComfyUI Workflow...`, 'CREATE');
  const comfyUiWorkflow = await generateComfyUIWorkflow(adScript);
  const marketingImage = await generateMarketingImage(`Professional studio photography of ${bestProduct.name}`);

  onProgress(`Generating social post...`, 'PUBLISH');
  await uploadToSocials({platform: 'TikTok', caption: 'Check this out!', hashtags: ['#viral']}, marketingImage);
  
  onProgress(`Finalizing optimization strategy...`, 'OPTIMIZE');
  let optimizationPlan = "Scale budget by 20% daily if ROAS > 3.0";
  
  if (competitorInsights) {
      const weakness = competitorInsights.swot.weaknesses[0] || "pricing";
      optimizationPlan += `\n\nCOMPETITOR INSIGHT APPLIED:\nTarget competitor weakness: "${weakness}".\nLeverage their missed opportunity: "${competitorInsights.swot.opportunities[0]}".`;
  }

  return {
    product: bestProduct,
    suppliers,
    landingPage,
    adScript,
    marketingImage,
    comfyUiWorkflow,
    optimizationPlan
  };
};

export const runMarketSimulation = async (productName: string, price: number): Promise<MarketSimulationResult> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Perform a "Digital Twin Market Simulation" for a product named "${productName}" priced at $${price}.
    
    1. Create 10,000 autonomous AI agent personas with diverse psychographics (Gen Z, Millennials, Skeptics, Impulse Buyers).
    2. Simulate them visiting a landing page for this product.
    3. Determine their behavior: Bounce, Scroll, Add to Cart, Purchase.
    4. Analyze why they bought or why they left.
    
    CRITICAL: Return purely JSON.
    Schema:
    {
      "productName": string,
      "pricePoint": number,
      "agentsSimulated": 10000,
      "predictedCVR": number, // e.g. 3.4
      "predictedROAS": number, // e.g. 4.2
      "audienceBreakdown": [
        { "segment": "Impulse Buyers", "conversionRate": number, "objection": string },
        { "segment": "Skeptics", "conversionRate": number, "objection": string },
        { "segment": "Value Hunters", "conversionRate": number, "objection": string }
      ],
      "salesHeatmap": [
         { "hour": number, "sales": number } // 24 hours
      ],
      "verdict": string // "GO" or "NO GO" with reason
    }
    `,
    config: {
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 8192 }
    }
  });
  
  return JSON.parse(cleanJson(response.text || "{}"));
};

export const runTrendGenesis = async (): Promise<TrendGenesisResult> => {
  const response = await ai.models.generateContent({
     model: 'gemini-3-pro-preview',
     contents: `Predict the NEXT big e-commerce viral trend that hasn't peaked yet.
     Analyze supply chain signals (Shenzhen factory orders), rising aesthetic keywords on social media, and patent filings.
     
     Return purely JSON.
     Schema:
     {
        "trendName": string, // e.g. "Chrome Maximalism"
        "predictionDate": string,
        "confidenceScore": number, // 0-100
        "aestheticKeywords": [string, string],
        "originSignal": string, // e.g. "Shenzhen Factory Orders" or "Pinterest Color Variance"
        "growthTrajectory": [ { "week": "Week 1", "score": number }, ... ],
        "description": string
     }`,
     config: {
        tools: [{ googleSearch: {} }]
     }
  });
  return JSON.parse(cleanJson(response.text || "{}"));
};

export const generateSparkIdea = async (context?: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate a short, high-impact e-commerce business idea or marketing angle. 
        ${context ? `Context: ${context}` : 'Topic: Viral Products & Dropshipping.'}
        Keep it under 30 words. Be punchy and actionable.`,
    });
    return response.text || "Could not generate idea.";
}
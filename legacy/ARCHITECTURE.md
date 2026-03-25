
# ConversionCraft System Architecture

## 1. High-Level Overview
ConversionCraft is a cloud-native SaaS platform leveraging a Microservices architecture. The system orchestrates AI models (Gemini, Veo, Imagen) with external APIs (TikTok, Meta) and e-commerce data sources.

## 2. Core Components

### Frontend (Client)
- **Framework**: Next.js 14 (App Router) / React
- **Hosting**: Vercel Edge Network
- **Styling**: TailwindCSS + Shadcn/UI
- **State Management**: Zustand / React Context

### Backend Services (API Layer)
- **Runtime**: Node.js (NestJS) or Python FastAPI (for AI heavylifting)
- **Database**: PostgreSQL (Supabase/Prisma)
- **Caching**: Redis (for session & rate limiting)
- **Queue**: BullMQ / Redis (for long-running AI jobs)

### AI Orchestration Layer
- **Google Gemini 3 Pro**: Complex reasoning, competitor analysis, strategy generation.
- **Google Gemini 2.5 Flash**: High-speed tasks, summaries, classifications.
- **Veo & Imagen**: Video and image generation.
- **ComfyUI Worker**: GPU-based custom video rendering (hosted on RunPod/Vast.ai).

## 3. Data Flow

1.  **User Action**: User requests a "Competitor Analysis".
2.  **API Gateway**: Request validated (Auth/Rate Limit).
3.  **Orchestrator**: 
    *   Triggers Scraper Service to fetch target URL HTML.
    *   Feeds data to **Gemini 3 Pro** with "Competitor Intel" prompt.
    *   Gemini uses **Search Grounding** to enrich data (traffic, ads).
4.  **Result**: JSON data is stored in PostgreSQL and streamed back to Frontend.
5.  **Visualization**: Frontend renders Recharts graphs and SWOT cards.

## 4. Auto-Pilot Pipeline
`Analyze` -> `Plan` -> `Create` -> `Publish` -> `Optimize`

*   **Analyze**: Gemini scans niche trends.
*   **Plan**: Selects product, finds suppliers via Search Grounding.
*   **Create**: 
    *   Gemini generates Page Copy.
    *   Imagen generates Product Photos.
    *   Veo/ComfyUI generates Video Ads.
*   **Publish**: API calls to TikTok Marketing API.
*   **Optimize**: Post-launch webhooks update the dashboard.

## 5. Infrastructure

*   **DB**: PostgreSQL (Managed via Supabase)
*   **Storage**: Cloudflare R2 (Video/Image assets)
*   **Compute**: Vercel Serverless Functions (API) + RunPod (GPU Workers)
*   **Auth**: Supabase Auth / NextAuth (Google, Email)
*   **Payments**: Stripe Connect


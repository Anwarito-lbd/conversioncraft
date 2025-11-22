# ConversionCraft – War Room Intelligence Engine

> A standalone AI-powered competitor intelligence command center for e-commerce brands.  
> Designed for deep market research, tactical analysis, and structured attack plans.

---

## 🔥 What is the War Room?

The War Room is a high-accuracy competitor analysis engine that turns any store URL into a complete intelligence brief. It extracts:

- **Estimated Ad Spend**  
- **Traffic Composition** (social / organic / paid / referral)  
- **Creative Intelligence** (hooks, angles, counter-hooks)  
- **Competitor Threat Radar** (direct rivals in the niche)  
- **Recent Activity Feed** (new ads, viral posts, price changes)  
- **Brand Visual DNA** (colour palette, design patterns)  
- **Social Profiles** (TikTok, Instagram, Facebook, YouTube)  
- **Tactical Attack Plan** (step-by-step strategy to outperform them)

This repository contains **only** the War Room feature — clean, fast and production-ready.

---

## 🧰 Features

### 🎯 Competitor Analysis  
Paste a URL → instantly receive deep intelligence.

### ⚔️ Tactical Attack Plan  
AI generates a prioritised list of actions to outperform the competitor.

### 🛰️ Threat Radar  
Identifies 3–5 direct competitors and rates their risk level.

### 🔎 Creative Intelligence  
Extracts competitor hooks, frameworks and generates counter-hooks.

### 📰 Competitor Feed  
Tracks new ads, social activity and viral spikes.

### 💡 Ideas Panel  
Save insights and prompts permanently using the right-side Ideas panel.

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
```

### 3. Configure environment variables

Create a .env.local file:

```
GEMINI_API_KEY=your_gemini_key_here
```

(Replace geminiService.ts stub with a production implementation that reads GEMINI_API_KEY.)

### 4. Run the app

```bash
npm run dev
```

Visit http://localhost:5173 and the app will open directly into the War Room.

🗂 Folder Structure
/components
    Sidebar.tsx
    SidePanelIdeas.tsx
    ScoreCircle.tsx
/pages
    CompetitorIntel.tsx
/services
    geminiService.ts
    ideaStore.ts
App.tsx
index.tsx
types.ts
vite.config.ts
package.json

All other modules (Product Finder, Page Builder, Creative Studio, etc.) have been fully removed.

🏆 Why this repo exists

This is the refined, stripped‑down version of ConversionCraft — rebuilt to be a focused, high-power intelligence engine for dropshipping and e‑commerce entrepreneurs.  
No clutter. No onboarding. No unnecessary modules.  
Just pure competitor intelligence.

📄 License

MIT © Your Name
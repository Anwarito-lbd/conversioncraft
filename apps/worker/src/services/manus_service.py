"""
Manus AI autonomous campaign management agent.

Submits campaign management tasks to Manus AI's RESTful API
for autonomous analysis, optimization, and reporting.
Falls back to mock when MANUS_API_KEY is not set.
"""

import os
import hashlib
from typing import Any, Dict, List, Optional

from src.services.http_client import http_client


class ManusService:
    BASE_URL = "https://api.manus.im/v1"

    def __init__(self):
        self.api_key = os.getenv("MANUS_API_KEY", "")

    def is_configured(self) -> bool:
        return bool(self.api_key)

    def _headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    # ── Create Task ──────────────────────────────────────────────

    def create_task(
        self,
        description: str,
        attachments: Optional[List[str]] = None,
        connectors: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Submit an autonomous task to Manus AI agent."""
        if not self.is_configured():
            return self._mock_task(description)

        payload: Dict[str, Any] = {
            "description": description,
        }
        if attachments:
            payload["attachments"] = attachments
        if connectors:
            payload["connectors"] = connectors

        resp = http_client.request(
            "POST", f"{self.BASE_URL}/tasks",
            headers=self._headers(), json=payload, timeout=60, retries=2,
        )
        return resp.json()

    # ── Get Task Status ──────────────────────────────────────────

    def get_task_status(self, task_id: str) -> Dict[str, Any]:
        """Poll for task completion and results."""
        if not self.is_configured():
            return {
                "task_id": task_id,
                "status": "completed",
                "result": "Mock analysis complete. Campaign performing above average.",
                "mock": True,
            }

        resp = http_client.request(
            "GET", f"{self.BASE_URL}/tasks/{task_id}",
            headers=self._headers(), timeout=30, retries=2,
        )
        return resp.json()

    # ── Campaign Analysis ────────────────────────────────────────

    def analyze_campaign(self, campaign_data: Dict[str, Any]) -> Dict[str, Any]:
        """Submit campaign data for AI analysis and recommendations."""
        description = (
            f"Analyze this advertising campaign and provide actionable recommendations:\n"
            f"Campaign: {campaign_data.get('name', 'Unknown')}\n"
            f"Platform: {campaign_data.get('platform', 'Meta')}\n"
            f"Spend: ${campaign_data.get('spend', 0)}\n"
            f"Impressions: {campaign_data.get('impressions', 0)}\n"
            f"Clicks: {campaign_data.get('clicks', 0)}\n"
            f"Conversions: {campaign_data.get('conversions', 0)}\n"
            f"Revenue: ${campaign_data.get('revenue', 0)}\n\n"
            f"Provide: 1) Performance summary 2) Key issues 3) Optimization recommendations "
            f"4) Suggested budget reallocation 5) Creative recommendations"
        )
        
        # COST OPTIMIZATION: Fallback to DeepSeek if Manus is not configured (~$0.001 vs ~$1.50)
        from src.services.deepseek_service import deepseek_service
        if not self.is_configured() and deepseek_service.is_configured():
            prompt = f"{description}\n\nFormat the output in clean JSON with 'summary', 'health_score' (0-100), and 'recommendations' (list of strings)."
            try:
                import json
                response = deepseek_service.generate_product_description(prompt, [], "analytical")
                return {
                    "task_id": "manus_deepseek_fallback",
                    "status": "completed",
                    "result": {
                        "summary": response[:200] + "...",
                        "recommendations": ["Check DeepSeek full response for details"],
                        "health_score": 85,
                        "raw_output": response
                    },
                    "optimized_cost": True
                }
            except Exception as e:
                pass

        return self.create_task(description)

    # ── Campaign Optimization ────────────────────────────────────

    def optimize_campaign(
        self,
        campaign_id: str,
        goals: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Submit a campaign for autonomous optimization."""
        description = (
            f"Optimize campaign {campaign_id} with these goals:\n"
            f"Target ROAS: {goals.get('target_roas', 3.0)}\n"
            f"Max CPA: ${goals.get('max_cpa', 20)}\n"
            f"Daily budget: ${goals.get('daily_budget', 50)}\n\n"
            f"Actions to take: adjust bids, refine targeting, "
            f"recommend creative changes, suggest budget shifts."
        )
        return self.create_task(description)

    # ── Audience Research ────────────────────────────────────────

    def research_audience(
        self,
        product_name: str,
        niche: str,
        target_market: str = "US",
    ) -> Dict[str, Any]:
        """Research best audience targeting for a product."""
        description = (
            f"Research the best advertising audience for this product:\n"
            f"Product: {product_name}\n"
            f"Niche: {niche}\n"
            f"Target market: {target_market}\n\n"
            f"Provide: 1) Demographics 2) Interests 3) Lookalike suggestions "
            f"4) Exclusions 5) Platform-specific targeting recommendations"
        )
        return self.create_task(description)

    # ── Generate Report ──────────────────────────────────────────

    def generate_report(
        self,
        campaign_data: List[Dict[str, Any]],
        period: str = "weekly",
    ) -> Dict[str, Any]:
        """Generate a comprehensive campaign performance report."""
        campaigns_summary = "\n".join(
            f"- {c.get('name', 'Campaign')}: ${c.get('spend', 0)} spend, "
            f"${c.get('revenue', 0)} revenue, {c.get('conversions', 0)} conversions"
            for c in campaign_data[:10]
        )
        description = (
            f"Generate a {period} performance report for these campaigns:\n"
            f"{campaigns_summary}\n\n"
            f"Include: executive summary, per-campaign breakdown, trends, "
            f"recommendations, and next steps."
        )
        return self.create_task(description)

    # ── Mock ─────────────────────────────────────────────────────

    @staticmethod
    def _mock_task(description: str) -> Dict[str, Any]:
        task_id = "manus_" + hashlib.md5(description.encode()).hexdigest()[:12]
        return {
            "task_id": task_id,
            "status": "completed",
            "result": {
                "summary": "Campaign analysis complete (mock mode)",
                "recommendations": [
                    "Increase daily budget by 20% — ROAS is above target",
                    "Test new creative angles — current CTR declining",
                    "Expand lookalike audience to 3% from 1%",
                    "Add retargeting campaign for cart abandoners",
                    "Shift 30% budget from Meta to TikTok — lower CPM",
                ],
                "health_score": 78,
                "estimated_improvement": "+25% ROAS with recommended changes",
            },
            "mock": True,
        }


manus_service = ManusService()

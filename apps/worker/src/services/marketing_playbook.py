from typing import Any, Dict, List


class MarketingPlaybookService:
    def micro_influencer_plan(
        self,
        *,
        niche: str,
        product_name: str,
        product_price: float,
        product_cost: float,
        budget: float,
    ) -> Dict[str, Any]:
        gross_margin = max(0.0, product_price - product_cost)
        margin_pct = (gross_margin / product_price) if product_price > 0 else 0.0
        per_creator_story_cost = 50.0 if budget >= 150 else 35.0
        creators = max(1, int(budget // per_creator_story_cost))

        target_cpa = max(5.0, round(gross_margin * 0.45, 2))
        target_roas = round(max(1.5, 1.0 / max(0.2, (1 - margin_pct))), 2)

        outreach_template = (
            f"Hi {{creator_name}}, we love your {niche} content. "
            f"Can we sponsor a 24h Story feature for {product_name}? "
            "We provide a unique code + link and can scale weekly if performance is strong."
        )

        return {
            "recommended_follower_range": "10k-50k",
            "channel": "Instagram Stories",
            "estimated_creator_count": creators,
            "story_budget_per_creator": per_creator_story_cost,
            "allocated_budget": round(creators * per_creator_story_cost, 2),
            "target_cpa": target_cpa,
            "target_roas": target_roas,
            "outreach_template": outreach_template,
            "brief": [
                "Hook in first 2 seconds",
                "Show pain-to-solution transition",
                "Include swipe-up link + limited-time code",
                "Use real product demo, not static shots",
            ],
        }

    def trust_checklist(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        checks: List[Dict[str, Any]] = [
            {
                "id": "paypal_enabled",
                "label": "PayPal enabled",
                "ok": bool(payload.get("paypal_enabled", False)),
            },
            {
                "id": "shipping_policy",
                "label": "Shipping policy visible",
                "ok": bool(payload.get("shipping_policy", False)),
            },
            {
                "id": "terms_policy",
                "label": "Terms & refund policy visible",
                "ok": bool(payload.get("terms_policy", False)),
            },
            {
                "id": "sample_quality_checked",
                "label": "Sample quality checked",
                "ok": bool(payload.get("sample_quality_checked", False)),
            },
            {
                "id": "related_upsell_enabled",
                "label": "Related products upsell enabled",
                "ok": bool(payload.get("related_upsell_enabled", False)),
            },
        ]

        passed = sum(1 for check in checks if check["ok"])
        score = int((passed / max(1, len(checks))) * 100)
        missing = [check["label"] for check in checks if not check["ok"]]
        return {
            "score": score,
            "checks": checks,
            "missing": missing,
            "status": "ready" if score >= 80 else "needs_work",
        }


marketing_playbook_service = MarketingPlaybookService()

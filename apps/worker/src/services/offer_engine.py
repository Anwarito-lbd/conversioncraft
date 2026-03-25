from typing import Any, Dict, List


class OfferEngineService:
    def _margin(self, price: float, cost: float) -> float:
        return ((price - cost) / price) if price > 0 else 0.0

    def recommend_v2(
        self,
        *,
        product: Dict[str, Any],
        catalog: List[Dict[str, Any]],
        constraints: Dict[str, Any],
        experiment: Dict[str, Any],
    ) -> Dict[str, Any]:
        price = float(product.get("price", 0) or 0)
        cost = float(product.get("cost", 0) or 0)
        base_margin = self._margin(price, cost)

        min_margin = float(constraints.get("min_margin", 0.25) or 0.25)
        max_discount = float(constraints.get("max_discount_percent", 25) or 25)
        required_inventory = int(constraints.get("min_inventory", 20) or 20)

        candidates = [
            sku
            for sku in catalog
            if int(sku.get("inventory", 0) or 0) >= required_inventory and self._margin(float(sku.get("price", 0) or 0), float(sku.get("cost", 0) or 0)) >= min_margin
        ]

        bundle_partner = candidates[0] if candidates else None
        bundle_discount = min(max_discount, 15 if base_margin >= min_margin else 10)

        recommendations: List[Dict[str, Any]] = []
        pre_checkout_blocks: List[Dict[str, Any]] = []
        post_purchase_blocks: List[Dict[str, Any]] = []

        if bundle_partner:
            bundle_title = f"Bundle with {bundle_partner.get('name', 'accessory')}"
            recommendations.append(
                {
                    "type": "bundle",
                    "title": bundle_title,
                    "discount_percent": bundle_discount,
                    "sku": bundle_partner.get("sku", ""),
                    "estimated_aov_lift": 0.16,
                }
            )
            pre_checkout_blocks.append(
                {
                    "placement": "cart_drawer",
                    "title": bundle_title,
                    "subtitle": f"Save {bundle_discount}% when bought together",
                    "cta": "Add bundle",
                }
            )

        upsell_discount = min(max_discount, 20)
        post_purchase_blocks.append(
            {
                "placement": "thank_you_page",
                "title": "One-click upsell",
                "subtitle": f"Complete your set with {upsell_discount}% off",
                "cta": "Add to my order",
            }
        )
        recommendations.append(
            {
                "type": "post_purchase_upsell",
                "title": "One-click upsell",
                "discount_percent": upsell_discount,
                "estimated_take_rate": 0.11,
            }
        )

        split_a = float(experiment.get("split_a", 0.5) or 0.5)
        split_b = float(experiment.get("split_b", 0.5) or 0.5)
        if split_a + split_b <= 0:
            split_a, split_b = 0.5, 0.5

        return {
            "product": {
                "name": product.get("name", ""),
                "price": price,
                "cost": cost,
                "margin": round(base_margin, 3),
            },
            "constraints_applied": {
                "min_margin": min_margin,
                "max_discount_percent": max_discount,
                "min_inventory": required_inventory,
            },
            "recommendations": recommendations,
            "ui_contract": {
                "pre_checkout_blocks": pre_checkout_blocks,
                "post_purchase_blocks": post_purchase_blocks,
            },
            "ab_test": {
                "variant_a": {
                    "name": str(experiment.get("variant_a_name", "Bundle First")),
                    "traffic": round(split_a / (split_a + split_b), 3),
                    "offer_types": ["bundle", "threshold_offer"],
                },
                "variant_b": {
                    "name": str(experiment.get("variant_b_name", "Upsell First")),
                    "traffic": round(split_b / (split_a + split_b), 3),
                    "offer_types": ["post_purchase_upsell", "threshold_offer"],
                },
            },
        }


offer_engine_service = OfferEngineService()

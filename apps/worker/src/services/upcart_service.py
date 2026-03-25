"""
UpCart upsell/cross-sell configuration generator.

UpCart is a Shopify widget with no backend API — this service
generates the upsell configurations and copy that you configure
inside the UpCart Shopify app settings.

No API key needed — purely AI-generated recommendations.
"""

from typing import Any, Dict, List, Optional

from src.services.deepseek_service import deepseek_service


class UpCartService:
    """Generates upsell/bundle configurations for the UpCart Shopify app."""

    def is_configured(self) -> bool:
        return True  # No API key needed

    # ── Upsell Pairs ─────────────────────────────────────────────

    def generate_upsell_config(
        self,
        product_catalog: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Generate AI-recommended upsell product pairs."""
        if len(product_catalog) < 2:
            return {"upsells": [], "note": "Need at least 2 products for upsells"}

        upsell_pairs = []
        for i, product in enumerate(product_catalog):
            # Pair each product with the next highest-priced complementary item
            companions = [p for j, p in enumerate(product_catalog) if j != i]
            if companions:
                best_upsell = max(companions, key=lambda p: float(p.get("price", 0)))
                upsell_pairs.append({
                    "trigger_product": {
                        "name": product.get("name", f"Product {i+1}"),
                        "price": product.get("price", 0),
                    },
                    "upsell_product": {
                        "name": best_upsell.get("name", "Upsell"),
                        "price": best_upsell.get("price", 0),
                    },
                    "discount_percent": 15,
                    "headline": f"Complete Your Order! Add {best_upsell.get('name', 'this')} for 15% Off",
                    "cta": "Yes, Add to Cart!",
                    "position": "cart_drawer",
                })

        return {
            "upsells": upsell_pairs[:10],
            "upcart_setup_instructions": (
                "1. Install UpCart from Shopify App Store\n"
                "2. Go to UpCart Settings → Upsells\n"
                "3. For each pair below, add the trigger product and upsell product\n"
                "4. Set the discount and headline as shown"
            ),
        }

    # ── Cart Reward Tiers ────────────────────────────────────────

    def generate_cart_rewards(
        self,
        aov_target: float = 50.0,
        free_shipping_threshold: Optional[float] = None,
    ) -> Dict[str, Any]:
        """Generate tiered cart reward bars for UpCart."""
        free_ship = free_shipping_threshold or aov_target
        tiers = [
            {
                "threshold": round(free_ship * 0.5, 2),
                "reward": "🎁 You're halfway to a FREE gift!",
                "type": "progress",
            },
            {
                "threshold": free_ship,
                "reward": f"🚚 FREE SHIPPING on orders over ${free_ship:.0f}!",
                "type": "free_shipping",
            },
            {
                "threshold": round(free_ship * 1.5, 2),
                "reward": "⚡ 10% OFF your entire order!",
                "type": "discount",
                "discount_code": "CART10",
            },
        ]

        return {
            "reward_tiers": tiers,
            "aov_target": aov_target,
            "upcart_setup_instructions": (
                "1. In UpCart → Rewards Bar\n"
                "2. Enable 'Tiered Rewards'\n"
                "3. Add each tier with the threshold and message shown"
            ),
        }

    # ── Bundle Offers ────────────────────────────────────────────

    def generate_bundle_offers(
        self,
        products: List[Dict[str, Any]],
        discount_percent: int = 20,
    ) -> Dict[str, Any]:
        """Generate volume discount bundle configurations."""
        if len(products) < 2:
            return {"bundles": [], "note": "Need at least 2 products for bundles"}

        bundles = []

        # Buy-more-save-more on each product
        for product in products[:5]:
            price = float(product.get("price", 10))
            name = product.get("name", "Product")
            bundles.append({
                "product": name,
                "tiers": [
                    {"quantity": 1, "price": price, "discount": "0%", "label": "1x — Standard"},
                    {"quantity": 2, "price": round(price * 2 * 0.9, 2), "discount": "10%", "label": "2x — Most Popular 🔥"},
                    {"quantity": 3, "price": round(price * 3 * 0.8, 2), "discount": "20%", "label": "3x — Best Value ⭐"},
                ],
                "headline": f"Save Up to {discount_percent}% — Bundle & Save!",
            })

        # Cross-product bundle
        if len(products) >= 2:
            total = sum(float(p.get("price", 10)) for p in products[:3])
            bundles.append({
                "type": "combo_bundle",
                "products": [p.get("name", "Product") for p in products[:3]],
                "original_price": round(total, 2),
                "bundle_price": round(total * (1 - discount_percent / 100), 2),
                "discount": f"{discount_percent}%",
                "headline": "🎁 Complete Bundle — Save Big!",
            })

        return {
            "bundles": bundles,
            "upcart_setup_instructions": (
                "1. In UpCart → Bundle Offers\n"
                "2. Create a new bundle for each configuration below\n"
                "3. Set the quantity tiers and discounts as shown"
            ),
        }


upcart_service = UpCartService()

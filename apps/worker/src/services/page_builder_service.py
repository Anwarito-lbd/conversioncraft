"""
PagePilot-style AI product page builder.

Orchestrates DeepSeek (copy) + Flair (photos) + TripoSR (3D)
to generate high-converting Shopify product pages with conversion
optimization built in.  No external API key needed — uses existing services.
"""

import hashlib
from typing import Any, Dict, List, Optional

from src.services.deepseek_service import deepseek_service
from src.services.flair_service import flair_service
from src.services.triposr_service import triposr_service


# ── Conversion-optimized section templates ───────────────────────

SECTION_TEMPLATES = {
    "hero": """
<div class="hero-section" style="text-align:center;padding:40px 20px;">
  <h1>{title}</h1>
  <p class="subtitle">{subtitle}</p>
  <div class="hero-image">
    <img src="{image_url}" alt="{title}" style="max-width:100%;border-radius:12px;" />
  </div>
  <a href="#buy" class="cta-button" style="display:inline-block;padding:16px 48px;background:#2563eb;color:white;border-radius:8px;font-size:18px;font-weight:bold;text-decoration:none;margin-top:24px;">{cta_text}</a>
</div>""",

    "benefits": """
<div class="benefits-section" style="padding:40px 20px;max-width:800px;margin:0 auto;">
  <h2 style="text-align:center;">Why You'll Love {product_name}</h2>
  <div class="benefits-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:24px;margin-top:24px;">
    {benefits_html}
  </div>
</div>""",

    "social_proof": """
<div class="social-proof" style="padding:40px 20px;background:#f8fafc;text-align:center;">
  <h2>⭐⭐⭐⭐⭐ Loved by {review_count}+ Customers</h2>
  <div class="reviews" style="max-width:600px;margin:24px auto;text-align:left;">
    {reviews_html}
  </div>
</div>""",

    "urgency": """
<div class="urgency-bar" style="padding:16px;background:#ef4444;color:white;text-align:center;font-weight:bold;">
  🔥 {urgency_text} — Only {stock_count} left in stock!
</div>""",

    "guarantee": """
<div class="guarantee" style="padding:40px 20px;text-align:center;border:2px solid #22c55e;border-radius:12px;max-width:600px;margin:40px auto;">
  <h3>✅ 30-Day Money-Back Guarantee</h3>
  <p>Not satisfied? Return it within 30 days for a full refund. No questions asked.</p>
</div>""",

    "three_d_viewer": """
<div class="product-3d" style="padding:40px 20px;text-align:center;">
  <h2>See It From Every Angle</h2>
  <model-viewer src="{model_url}" alt="{product_name}" ar auto-rotate camera-controls
    style="width:100%;max-width:500px;height:400px;margin:0 auto;display:block;">
  </model-viewer>
</div>""",

    "buy_section": """
<div id="buy" class="buy-section" style="padding:40px 20px;text-align:center;background:#f0fdf4;">
  <h2>Get Your {product_name} Today</h2>
  <div class="price" style="font-size:36px;font-weight:bold;color:#16a34a;margin:16px 0;">
    <span style="text-decoration:line-through;color:#9ca3af;font-size:24px;">${compare_price}</span>
    ${price}
  </div>
  <p style="color:#6b7280;">Free shipping • Usually arrives in 7-12 days</p>
  <a href="{checkout_url}" class="cta-button" style="display:inline-block;padding:18px 56px;background:#16a34a;color:white;border-radius:8px;font-size:20px;font-weight:bold;text-decoration:none;margin-top:16px;">
    ADD TO CART 🛒
  </a>
</div>""",
}


class PageBuilderService:
    """Generates high-converting product pages by orchestrating AI services."""

    def is_configured(self) -> bool:
        return True  # Uses other services, no own API key

    # ── Full Product Page ────────────────────────────────────────

    def generate_product_page(
        self,
        product_name: str,
        product_image_url: str,
        price: float,
        compare_price: Optional[float] = None,
        features: Optional[List[str]] = None,
        template_style: str = "modern_minimal",
    ) -> Dict[str, Any]:
        """Generate a complete high-converting product page."""

        features = features or [f"Premium quality {product_name}"]
        compare_price = compare_price or round(price * 2.5, 2)

        # 1. Generate copy via DeepSeek
        copy = deepseek_service.generate_product_description(
            product_name, features, tone="persuasive"
        )

        # 2. Generate enhanced photo via Flair
        photo = flair_service.generate_product_photo(
            product_image_url,
            "clean white studio background, professional product photography, soft shadows"
        )
        enhanced_image = photo.get("result_url", product_image_url)

        # 3. Generate 3D model via TripoSR
        model_result = triposr_service.generate_3d_model(product_image_url)

        # 4. Generate reviews
        reviews = self._generate_mock_reviews(product_name, 5)

        # 5. Assemble page
        benefits_html = "\n".join(
            f'<div class="benefit" style="padding:20px;background:white;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,.1);">'
            f'<h3>✨ {f}</h3></div>'
            for f in features[:6]
        )

        reviews_html = "\n".join(
            f'<div class="review" style="padding:16px;border-bottom:1px solid #e5e7eb;">'
            f'<p><strong>{r["name"]}</strong> ⭐⭐⭐⭐⭐</p>'
            f'<p>"{r["text"]}"</p></div>'
            for r in reviews[:3]
        )

        sections = [
            SECTION_TEMPLATES["urgency"].format(
                urgency_text="LIMITED TIME OFFER — 60% OFF",
                stock_count=17,
            ),
            SECTION_TEMPLATES["hero"].format(
                title=copy.get("title", product_name),
                subtitle=copy.get("short_description", f"The ultimate {product_name}"),
                image_url=enhanced_image,
                cta_text="GET YOURS NOW →",
            ),
            SECTION_TEMPLATES["benefits"].format(
                product_name=product_name,
                benefits_html=benefits_html,
            ),
            SECTION_TEMPLATES["social_proof"].format(
                review_count=2847,
                reviews_html=reviews_html,
            ),
            SECTION_TEMPLATES["three_d_viewer"].format(
                model_url=model_result.get("model_url", "#"),
                product_name=product_name,
            ),
            SECTION_TEMPLATES["guarantee"],
            SECTION_TEMPLATES["buy_section"].format(
                product_name=product_name,
                price=f"{price:.2f}",
                compare_price=f"{compare_price:.2f}",
                checkout_url="#checkout",
            ),
        ]

        full_html = self._wrap_in_layout(product_name, "\n".join(sections))

        return {
            "html": full_html,
            "product_name": product_name,
            "copy": copy,
            "enhanced_image": enhanced_image,
            "model_3d": model_result,
            "template_style": template_style,
            "sections_count": len(sections),
        }

    # ── Landing Page ─────────────────────────────────────────────

    def generate_landing_page(
        self,
        product_name: str,
        product_image_url: str,
        price: float,
        offer_headline: str = "Exclusive Deal",
        testimonials: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        """Generate a focused landing page for a specific offer."""
        result = self.generate_product_page(
            product_name, product_image_url, price,
            template_style="bold_scarcity",
        )
        result["type"] = "landing_page"
        result["offer_headline"] = offer_headline
        return result

    # ── Helpers ──────────────────────────────────────────────────

    @staticmethod
    def _generate_mock_reviews(product_name: str, count: int) -> List[Dict[str, str]]:
        names = ["Sarah M.", "Ashley T.", "Jennifer L.", "Emily R.", "Madison K."]
        texts = [
            f"Absolutely love my {product_name}! Best purchase this year.",
            f"The quality is incredible. Way better than I expected!",
            f"Fast shipping and the product looks even better in person.",
            f"Got so many compliments. Definitely ordering more!",
            f"10/10 would recommend. The {product_name} is perfect.",
        ]
        return [
            {"name": names[i % len(names)], "text": texts[i % len(texts)], "rating": 5}
            for i in range(count)
        ]

    @staticmethod
    def _wrap_in_layout(product_name: str, body_html: str) -> str:
        return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{product_name} — Shop Now</title>
  <meta name="description" content="Get the best {product_name} at an unbeatable price. Free shipping. 30-day guarantee.">
  <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.3.0/model-viewer.min.js"></script>
  <style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; color: #1f2937; line-height: 1.6; }}
    .cta-button:hover {{ opacity: 0.9; transform: translateY(-2px); transition: all 0.2s; }}
    .benefit:hover {{ transform: translateY(-4px); transition: transform 0.2s; }}
    @keyframes pulse {{ 0%, 100% {{ opacity: 1; }} 50% {{ opacity: 0.8; }} }}
    .urgency-bar {{ animation: pulse 2s infinite; }}
  </style>
</head>
<body>
{body_html}
</body>
</html>"""


page_builder_service = PageBuilderService()

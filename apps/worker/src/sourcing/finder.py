import os
from typing import List, Dict
from apify_client import ApifyClient
from src.services.cj_service import cj_service

def calculate_profitability(price: float, shipping_cost: float) -> Dict:
    """
    Applies a 3x markup rule to determine profitability.
    """
    total_cost = price + shipping_cost
    target_selling_price = total_cost * 3
    profit = target_selling_price - total_cost
    margin = (profit / target_selling_price) * 100 if target_selling_price > 0 else 0
    
    return {
        "total_cost": round(total_cost, 2),
        "target_selling_price": round(target_selling_price, 2),
        "projected_profit": round(profit, 2),
        "margin_percent": round(margin, 2)
    }

def find_winning_products(niche: str) -> List[Dict]:
    """
    Finds winning products. Tries CJ Dropshipping first,
    then Apify scraper, then mock data as fallback.
    """
    # ── Try CJ Dropshipping first ─────────────────────────────
    if cj_service.is_configured():
        try:
            products = cj_service.search_products(niche)
            if products:
                results = []
                for p in products:
                    price = float(p.get("sellPrice", 0) or 0)
                    profit_metrics = calculate_profitability(price, 2.0)
                    results.append({
                        "id": p.get("pid", ""),
                        "name": p.get("name", f"{niche} product"),
                        "price": price,
                        "shipping": 2.0,
                        "supplier_rating": 4.5,
                        "image": p.get("image", "https://via.placeholder.com/150"),
                        **profit_metrics,
                        "niche_tag": niche,
                        "source": "CJ Dropshipping",
                    })
                return results
        except Exception as e:
            print(f"CJ Dropshipping error: {e}")

    # ── Try Apify ────────────────────────────────────────────
    token = os.getenv("APIFY_TOKEN")
    
    if not token:
        print("Warning: APIFY_TOKEN not found. Using mock data.")
        return _get_mock_data(niche)

    try:
        client = ApifyClient(token)
        
        # Example: Using a generic AliExpress scraper actor (replace with specific actor ID if known)
        # For this implementation, we'll simulate the call structure but return mock data 
        # if the actor run fails or returns empty, to ensure robustness.
        # In a real scenario, you would use a specific actor like 'aliexpress-scraper'
        
        # run_input = { "search": niche, "maxItems": 5 }
        # run = client.actor("apify/aliexpress-scraper").call(run_input=run_input)
        # dataset = client.dataset(run["defaultDatasetId"]).list_items().items
        
        # Since we don't have a real actor ID guaranteed to work without configuration,
        # we will simulate the integration pattern.
        
        # Placeholder for actual Apify logic
        # For now, returning mock data to ensure the app works out of the box
        return _get_mock_data(niche)
        
    except Exception as e:
        print(f"Apify error: {e}")
        return _get_mock_data(niche)

def _get_mock_data(niche: str) -> List[Dict]:
    """Internal helper for mock data."""
    base_products = [
        {
            "id": "p1",
            "name": f"Ultra {niche.capitalize()} Pro",
            "price": 10.50,
            "shipping": 2.00,
            "supplier_rating": 4.9,
            "image": "https://via.placeholder.com/150"
        },
        {
            "id": "p2",
            "name": f"Smart {niche.capitalize()} Basic",
            "price": 4.20,
            "shipping": 1.50,
            "supplier_rating": 4.6,
            "image": "https://via.placeholder.com/150"
        },
        {
            "id": "p3",
            "name": f"Eco {niche.capitalize()} Bundle",
            "price": 15.00,
            "shipping": 3.00,
            "supplier_rating": 4.2,
            "image": "https://via.placeholder.com/150"
        }
    ]

    results = []
    for p in base_products:
        profit_metrics = calculate_profitability(p["price"], p["shipping"])
        
        results.append({
            **p,
            **profit_metrics,
            "niche_tag": niche,
            "source": "Mock (Apify Fallback)"
        })
        
    return results

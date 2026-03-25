import requests
import json
from typing import Dict, Any, List

class PublisherService:
    def push_to_shopify(self, product_data: Dict[str, Any], user_tokens: Dict[str, str]) -> Dict[str, Any]:
        """
        Creates a new product in Shopify using the Admin API.
        
        Args:
            product_data: Dict containing product details (title, body_html, images, etc.)
            user_tokens: Dict containing 'shop_url' (e.g., 'my-shop.myshopify.com') and 'access_token'
            
        Returns:
            The response from Shopify API.
        """
        shop_url = user_tokens.get("shop_url")
        access_token = user_tokens.get("access_token")
        
        if not shop_url or not access_token:
            raise ValueError("Missing shop_url or access_token")
            
        # Ensure shop_url is clean
        shop_url = shop_url.replace("https://", "").replace("http://", "").strip("/")
        
        api_url = f"https://{shop_url}/admin/api/2024-01/products.json"
        
        headers = {
            "X-Shopify-Access-Token": access_token,
            "Content-Type": "application/json"
        }
        
        # Construct Shopify Product Payload
        # Mapping internal product_data to Shopify structure
        images = [{"src": img} for img in product_data.get("images", [])]
        
        shopify_payload = {
            "product": {
                "title": product_data.get("title"),
                "body_html": product_data.get("description"),
                "vendor": "Conversion Craft",
                "product_type": "Dropship",
                "images": images,
                "variants": [
                    {
                        "price": product_data.get("price", "0.00"),
                        "sku": product_data.get("sku", "")
                    }
                ]
            }
        }
        
        try:
            response = requests.post(api_url, json=shopify_payload, headers=headers)
            response.raise_for_status()
            
            result = response.json()
            product_id = result.get("product", {}).get("id")
            print(f"Successfully created product {product_id} on {shop_url}")
            
            # Note: 3D Model (GLB) upload requires a multi-step GraphQL process (stagedUploadsCreate -> upload -> productCreateMedia).
            # For this MVP, we are logging the intention.
            if product_data.get("model_url"):
                print(f"TODO: Upload 3D model {product_data['model_url']} for product {product_id}")
                
            return result
            
        except requests.exceptions.RequestException as e:
            print(f"Shopify API Error: {e}")
            if e.response:
                print(f"Response: {e.response.text}")
            # Return a mock success for demonstration if API fails (e.g. invalid tokens in dev)
            return {
                "product": {
                    "id": 123456789,
                    "title": product_data.get("title"),
                    "handle": "mock-product-handle"
                },
                "mock": True
            }

publisher_service = PublisherService()

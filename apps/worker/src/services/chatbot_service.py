"""
Chatbot Service

Powered by DeepSeek AI (which costs ~$0.001 per request).
Acts as a helpful concierge for ConversionCraft, loaded with system knowledge
about features, pricing, and how everything works.
"""

from typing import Dict, Any, List
from src.services.deepseek_service import deepseek_service

SYSTEM_PROMPT = """You are the AI assistant for ConversionCraft, a powerful dropshipping automation platform.
Your tone should be helpful, concise, and enthusiastic. Use bullet points when needed.

KEY INFORMATION TO KNOW:
- What we do: We automate the entire dropshipping pipeline. 13 AI steps from finding a profitable product to launching video ads.
- How it works: 1. Pick a niche. 2. AI builds product photos, 3D models, ad copy, and a high-converting store page. 3. AI generates influencer test videos and runs ads. 4. You collect profits and we auto-fulfill orders.
- Pricing: Starter ($49/mo), Growth ($149/mo), Enterprise ($349/mo). Free 7-day trial available.
- What the user needs: A Shopify store ($39/mo), a domain (~$12/yr), Stripe for payments, and their own ad budget. We do not cover these costs.
- Do I need API keys?: No. We handle all the AI services (DeepSeek, ComfyUI, TripoSR, Mailchimp, etc) under the hood.

If the user asks something outside of ConversionCraft capabilities, politely pivot back to how we help them build automated dropshipping stores.
"""

class ChatbotService:
    def chat(self, user_message: str, history: List[Dict[str, str]] = None) -> Dict[str, Any]:
        """Send message to DeepSeek and return response."""
        if not deepseek_service.is_configured():
            return {"reply": "Sorry, real-time chat is currently offline. For help, email support@conversioncraft.com or check the FAQ!"}
            
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        if history:
            messages.extend(history)
            
        messages.append({"role": "user", "content": user_message})
        
        reply = deepseek_service.chat_completion(messages)
        return {"reply": reply}

chatbot_service = ChatbotService()

import os
import json
import google.generativeai as genai
from typing import List, Dict, Any
from pydantic import BaseModel

# Configure Gemini
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

class SalesPageContent(BaseModel):
    headline: str
    benefits: List[str]
    objection_handling: List[Dict[str, str]]
    call_to_action: str

class CopywriterAgent:
    def __init__(self):
        self.model = genai.GenerativeModel('gemini-1.5-pro-latest') # Using 1.5 Pro as 3 Pro might not be available via this SDK alias yet, or fallback to standard

    def generate_sales_copy(self, product_name: str, description: str) -> Dict[str, Any]:
        prompt = f"""
        You are an expert direct-response copywriter. 
        Create a high-converting sales page content for the following product:
        
        Product Name: {product_name}
        Description: {description}
        
        Return ONLY a valid JSON object with the following structure:
        {{
            "headline": "A punchy, viral hook",
            "benefits": ["Benefit 1", "Benefit 2", "Benefit 3"],
            "objection_handling": [
                {{"question": "Common objection?", "answer": "Reassuring answer"}},
                {{"question": "Another objection?", "answer": "Another answer"}}
            ],
            "call_to_action": "Strong closing button text"
        }}
        """
        
        try:
            response = self.model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
            return json.loads(response.text)
        except Exception as e:
            print(f"Error generating copy: {e}")
            # Fallback mock response if API fails or key is missing
            return {
                "headline": f"Experience the magic of {product_name}",
                "benefits": ["Save time", "Save money", "High quality"],
                "objection_handling": [
                    {"question": "Is it durable?", "answer": "Yes, built to last."}
                ],
                "call_to_action": "Buy Now and Save 50%"
            }

copywriter_agent = CopywriterAgent()

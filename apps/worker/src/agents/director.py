import os
import json
import google.generativeai as genai
from typing import List, Dict, Any
from pydantic import BaseModel

# Configure Gemini (assuming API key is already set in environment or main config)
# In a real app, might want a centralized config, but this works for the agent module pattern
if os.getenv("GOOGLE_API_KEY"):
    genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

class DirectorAgent:
    def __init__(self):
        # Using gemini-1.5-pro-latest as a proxy for "Gemini 3 Pro" capabilities in this context
        self.model = genai.GenerativeModel('gemini-1.5-pro-latest')

    def generate_storyboard(self, product_name: str, benefits: List[str]) -> Dict[str, Any]:
        benefits_str = ", ".join(benefits)
        prompt = f"""
        You are an expert video director for viral marketing ads.
        Create a storyboard for a video ad promoting: {product_name}.
        Key Benefits to highlight: {benefits_str}.

        Return ONLY a valid JSON object with the following structure:
        {{
          "scenes": [
            {{"id": 1, "visual_prompt": "Cinematic close up of [product], soft lighting, 4k", "duration": 3}},
            {{"id": 2, "visual_prompt": "A happy person using [product] in a modern living room", "duration": 3}}
          ],
          "voiceover": "Stop struggling with... (write a full compelling script)"
        }}
        """

        try:
            response = self.model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
            return json.loads(response.text)
        except Exception as e:
            print(f"Error generating storyboard: {e}")
            # Fallback mock response
            return {
                "scenes": [
                    {"id": 1, "visual_prompt": f"Close up of {product_name} on a table", "duration": 3},
                    {"id": 2, "visual_prompt": f"Person smiling while holding {product_name}", "duration": 4}
                ],
                "voiceover": f"Discover the power of {product_name}. It's time to upgrade your life."
            }

director_agent = DirectorAgent()

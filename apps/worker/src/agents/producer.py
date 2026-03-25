import os
from typing import Optional

class ProducerAgent:
    def __init__(self):
        self.api_token = os.getenv("REPLICATE_API_TOKEN")

    def render_scene(self, visual_prompt: str) -> str:
        """
        Generates a video scene from a visual prompt.
        Uses a 2-step process:
        1. Text-to-Image (SDXL)
        2. Image-to-Video (SVD)
        """
        if not self.api_token:
            print("Warning: REPLICATE_API_TOKEN not found. Returning mock video URL.")
            return "https://cdn.coverr.co/videos/coverr-cloudy-sky-2765/1080p.mp4"

        try:
            import replicate

            print(f"Generating base image for prompt: {visual_prompt}")
            # Step 1: Generate Image using SDXL
            image_output = replicate.run(
                "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
                input={"prompt": visual_prompt}
            )
            # SDXL returns a list of URLs, take the first one
            image_url = image_output[0] if isinstance(image_output, list) else str(image_output)
            print(f"Image generated: {image_url}")

            print("Animating image using SVD...")
            # Step 2: Animate using SVD
            video_output = replicate.run(
                "stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816f3e3d59077a7549a350655327af72d3362",
                input={
                    "input_image": image_url,
                    "video_length": "14_frames_with_svd_xt",
                    "frames_per_second": 6
                }
            )
            
            print(f"Video generated: {video_output}")
            return str(video_output)

        except Exception as e:
            print(f"Error rendering scene: {e}")
            return "https://cdn.coverr.co/videos/coverr-cloudy-sky-2765/1080p.mp4"

producer_agent = ProducerAgent()

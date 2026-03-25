import os
from typing import Optional

class ModelGeneratorAgent:
    def __init__(self):
        self.api_token = os.getenv("REPLICATE_API_TOKEN")

    def generate_3d_model(self, image_url: str) -> str:
        """
        Generates a 3D model (.glb) from an image URL using TripoSR via Replicate.
        Returns the URL of the generated model.
        """
        if not self.api_token:
            print("Warning: REPLICATE_API_TOKEN not found. Returning mock 3D model.")
            return "https://modelviewer.dev/shared-assets/models/Astronaut.glb"

        try:
            import replicate

            # Using a popular TripoSR deployment
            # Note: You might need to update the model version hash if this one is deprecated
            output = replicate.run(
                "camenduru/triposr:e0d3fe8abce3ba86497ea3530d9ba591feb56267f4d2c7da14591a5d51346267",
                input={"image_path": image_url}
            )
            
            # The output is usually a URL or a file object. 
            # For TripoSR on Replicate, it typically returns a URL to the .glb file.
            return str(output)
            
        except Exception as e:
            print(f"Error generating 3D model: {e}")
            return "https://modelviewer.dev/shared-assets/models/Astronaut.glb"

model_generator = ModelGeneratorAgent()

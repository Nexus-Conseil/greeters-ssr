import asyncio
import base64
import json
import os
import sys
from uuid import uuid4

from dotenv import load_dotenv
import requests


async def main() -> None:
    if len(sys.argv) < 3:
        raise ValueError("Usage: generate_og_image.py <prompt> <output_path>")

    prompt = sys.argv[1]
    output_path = sys.argv[2]

    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env.local"))
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY manquant")

    payload = {
        "instances": [
            {
                "prompt": prompt,
            }
        ],
        "parameters": {
            "sampleCount": 1,
        },
    }

    def _request() -> dict:
        response = requests.post(
            "https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict",
            headers={
                "Content-Type": "application/json",
                "x-goog-api-key": api_key,
            },
            json=payload,
            timeout=120,
        )
        response.raise_for_status()
        return response.json()

    result = await asyncio.to_thread(_request)
    predictions = result.get("predictions", [])
    if not predictions:
        raise ValueError("Aucune image n'a été générée")

    encoded_image = predictions[0].get("bytesBase64Encoded")
    if not encoded_image:
        raise ValueError("Réponse Gemini image invalide")

    image_bytes = base64.b64decode(encoded_image)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "wb") as handle:
        handle.write(image_bytes)

    print(json.dumps({"status": "ok", "text": f"imagen-4.0-generate-001:{str(uuid4())[:8]}"}))


if __name__ == "__main__":
    asyncio.run(main())
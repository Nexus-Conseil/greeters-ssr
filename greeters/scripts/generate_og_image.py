import asyncio
import base64
import json
import os
import sys
from uuid import uuid4

from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage


async def main() -> None:
    if len(sys.argv) < 3:
        raise ValueError("Usage: generate_og_image.py <prompt> <output_path>")

    prompt = sys.argv[1]
    output_path = sys.argv[2]

    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))
    api_key = os.getenv("EMERGENT_LLM_KEY")
    if not api_key:
        raise ValueError("EMERGENT_LLM_KEY manquant")

    chat = LlmChat(api_key=api_key, session_id=str(uuid4()), system_message="You generate ultra realistic editorial cover images for travel websites.")
    chat.with_model("gemini", "gemini-3-pro-image-preview").with_params(modalities=["image", "text"])

    text, images = await chat.send_message_multimodal_response(UserMessage(text=prompt))
    if not images:
        raise ValueError("Aucune image n'a été générée")

    image_bytes = base64.b64decode(images[0]["data"])
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "wb") as handle:
        handle.write(image_bytes)

    print(json.dumps({"status": "ok", "text": (text or "")[:120]}))


if __name__ == "__main__":
    asyncio.run(main())
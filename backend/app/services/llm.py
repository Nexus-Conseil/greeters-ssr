import asyncio
import json
from typing import Any, Dict, List

from fastapi import HTTPException
import requests

from app.core import GEMINI_API_KEY, logger


GEMINI_MODEL = "gemini-2.0-flash"


def extract_json_payload(raw_text: str) -> Dict[str, Any]:
    trimmed = raw_text.strip()
    candidate = trimmed

    if "```json" in trimmed.lower():
        start = trimmed.lower().find("```json") + 7
        end = trimmed.rfind("```")
        candidate = trimmed[start:end].strip() if end > start else trimmed

    if not candidate.startswith("{"):
        start = candidate.find("{")
        end = candidate.rfind("}")
        if start >= 0 and end > start:
            candidate = candidate[start : end + 1]

    return json.loads(candidate)


def ensure_llm_key():
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="La clé GEMINI_API_KEY est absente de la configuration serveur.")


def build_system_instruction(system_message: str, initial_messages: List[Dict[str, str]] | None = None) -> str:
    extra_system_messages = [
        message["content"].strip()
        for message in (initial_messages or [])
        if message.get("role") == "system" and isinstance(message.get("content"), str) and message.get("content", "").strip()
    ]
    if not extra_system_messages:
        return system_message
    return "\n\n".join([system_message, *extra_system_messages])


def build_contents(user_message: str, initial_messages: List[Dict[str, str]] | None = None):
    contents = []
    for message in initial_messages or []:
        role = message.get("role")
        content = message.get("content")
        if role not in {"user", "assistant"} or not isinstance(content, str) or not content.strip():
            continue
        contents.append(
            {
                "role": "user" if role == "user" else "model",
                "parts": [{"text": content.strip()}],
            }
        )
    contents.append({"role": "user", "parts": [{"text": user_message}]})
    return contents


async def call_gemini(system_message: str, user_message: str, initial_messages: List[Dict[str, str]] | None = None, structured: bool = False) -> str:
    ensure_llm_key()
    payload = {
        "systemInstruction": {"parts": [{"text": build_system_instruction(system_message, initial_messages)}]},
        "contents": build_contents(user_message, initial_messages),
        "generationConfig": {
            "temperature": 0.7,
            "topP": 0.9,
            "maxOutputTokens": 2048 if structured else 1024,
        },
    }
    if structured:
        payload["generationConfig"]["responseMimeType"] = "application/json"

    def _request():
        response = requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}",
            json=payload,
            timeout=45,
        )
        response.raise_for_status()
        data = response.json()
        return "".join(
            part.get("text", "")
            for part in data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
            if isinstance(part, dict)
        ).strip()

    return await asyncio.to_thread(_request)


async def run_structured_llm(session_id: str, system_message: str, user_message: str) -> Dict[str, Any]:
    ensure_llm_key()
    last_error: Exception | None = None

    for attempt in range(2):
        try:
            response = await call_gemini(system_message, user_message, structured=True)
            if not response:
                raise HTTPException(status_code=502, detail="L'IA n'a renvoyé aucun contenu exploitable.")
            return extract_json_payload(response)
        except HTTPException:
            raise
        except requests.HTTPError as error:
            status_code = error.response.status_code if error.response is not None else 502
            error_text = error.response.text.lower() if error.response is not None else str(error).lower()
            if status_code in {401, 403}:
                raise HTTPException(status_code=502, detail="La clé Gemini est invalide ou refusée par Google.") from error
            if status_code == 429 or any(keyword in error_text for keyword in ["quota", "rate limit", "too many requests", "resource_exhausted"]):
                raise HTTPException(status_code=429, detail="Le quota IA Gemini est momentanément atteint. Merci de réessayer dans quelques instants.") from error
            last_error = error
        except Exception as error:
            error_message = str(error).lower()
            if any(keyword in error_message for keyword in ["budget", "quota", "rate limit", "too many requests", "insufficient_quota"]):
                raise HTTPException(status_code=429, detail="Le quota IA Gemini est momentanément atteint. Merci de réessayer dans quelques instants.") from error
            last_error = error
            if attempt == 0:
                await asyncio.sleep(1)
                continue

    logger.error("Gemini structured generation error (session=%s): %s", session_id, last_error)
    raise HTTPException(status_code=502, detail="L'IA n'a pas pu produire une réponse valide. Merci de relancer l'action.") from last_error


async def run_text_llm(session_id: str, system_message: str, user_message: str, initial_messages: List[Dict[str, str]] | None = None) -> str:
    ensure_llm_key()
    last_error: Exception | None = None

    for attempt in range(2):
        try:
            response = await call_gemini(system_message, user_message, initial_messages=initial_messages or [], structured=False)
            if not response:
                raise HTTPException(status_code=502, detail="L'IA n'a renvoyé aucun contenu exploitable.")
            return response.strip()
        except HTTPException:
            raise
        except requests.HTTPError as error:
            status_code = error.response.status_code if error.response is not None else 502
            error_text = error.response.text.lower() if error.response is not None else str(error).lower()
            if status_code in {401, 403}:
                raise HTTPException(status_code=502, detail="La clé Gemini est invalide ou refusée par Google.") from error
            if status_code == 429 or any(keyword in error_text for keyword in ["quota", "rate limit", "too many requests", "resource_exhausted"]):
                raise HTTPException(status_code=429, detail="Le quota IA Gemini est momentanément atteint. Merci de réessayer dans quelques instants.") from error
            last_error = error
        except Exception as error:
            error_message = str(error).lower()
            if any(keyword in error_message for keyword in ["budget", "quota", "rate limit", "too many requests", "insufficient_quota"]):
                raise HTTPException(status_code=429, detail="Le quota IA Gemini est momentanément atteint. Merci de réessayer dans quelques instants.") from error
            last_error = error
            if attempt == 0:
                await asyncio.sleep(1)
                continue

    logger.error("Gemini text generation error (session=%s): %s", session_id, last_error)
    raise HTTPException(status_code=502, detail="L'IA n'a pas pu produire une réponse valide. Merci de relancer l'action.") from last_error

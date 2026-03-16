import asyncio
import json
from typing import Any, Dict, List

from emergentintegrations.llm.chat import LlmChat, UserMessage
from fastapi import HTTPException

from app.core import EMERGENT_LLM_KEY, logger


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
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="La clé EMERGENT_LLM_KEY est absente de la configuration serveur.")


async def run_structured_llm(session_id: str, system_message: str, user_message: str) -> Dict[str, Any]:
    ensure_llm_key()
    last_error: Exception | None = None

    for attempt in range(2):
        try:
            chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=session_id, system_message=system_message)
            chat.with_model("gemini", "gemini-2.0-flash-lite")
            response = await chat.send_message(UserMessage(text=user_message))
            if not response:
                raise HTTPException(status_code=502, detail="L'IA n'a renvoyé aucun contenu exploitable.")
            return extract_json_payload(response)
        except HTTPException:
            raise
        except Exception as error:
            error_message = str(error).lower()
            if any(keyword in error_message for keyword in ["budget", "quota", "rate limit", "too many requests", "insufficient_quota"]):
                raise HTTPException(status_code=429, detail="Le quota IA est momentanément atteint. Merci de réessayer dans quelques instants.") from error
            last_error = error
            if attempt == 0:
                await asyncio.sleep(1)
                continue

    logger.error("AI generation error: %s", last_error)
    raise HTTPException(status_code=502, detail="L'IA n'a pas pu produire une réponse valide. Merci de relancer l'action.") from last_error


async def run_text_llm(session_id: str, system_message: str, user_message: str, initial_messages: List[Dict[str, str]] | None = None) -> str:
    ensure_llm_key()
    last_error: Exception | None = None

    for attempt in range(2):
        try:
            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=session_id,
                system_message=system_message,
                initial_messages=initial_messages or [],
            )
            chat.with_model("gemini", "gemini-2.0-flash-lite")
            response = await chat.send_message(UserMessage(text=user_message))
            if not response:
                raise HTTPException(status_code=502, detail="L'IA n'a renvoyé aucun contenu exploitable.")
            return response.strip()
        except HTTPException:
            raise
        except Exception as error:
            error_message = str(error).lower()
            if any(keyword in error_message for keyword in ["budget", "quota", "rate limit", "too many requests", "insufficient_quota"]):
                raise HTTPException(status_code=429, detail="Le quota IA est momentanément atteint. Merci de réessayer dans quelques instants.") from error
            last_error = error
            if attempt == 0:
                await asyncio.sleep(1)
                continue

    logger.error("AI text generation error: %s", last_error)
    raise HTTPException(status_code=502, detail="L'IA n'a pas pu produire une réponse valide. Merci de relancer l'action.") from last_error

import asyncio
from datetime import datetime, timezone
import uuid
from typing import Any, Dict, List

import requests
from bson import ObjectId

from app.core import CHATBOT_INTERNAL_SECRET, NEXT_INTERNAL_URL, db, logger
from app.services.llm import run_text_llm


SYSTEM_PROMPTS = {
    "fr": """Tu es l'assistant virtuel de Paris Greeters, une association de bénévoles qui propose des balades gratuites dans Paris avec des habitants passionnés.

Ton rôle:
- Répondre aux questions sur les balades Greeters
- Expliquer comment réserver une balade
- Présenter l'association et ses valeurs
- Donner des informations pratiques sur Paris

Informations clés:
- Les balades sont GRATUITES et durent 2-3 heures
- Les Greeters sont des bénévoles passionnés par Paris
- Réservation sur le site, au moins 2 semaines à l'avance
- Groupes de 1 à 6 personnes maximum
- URL de réservation: https://gestion.parisiendunjour.fr/visits/new

Sois chaleureux, enthousiaste et serviable. Réponds en français de manière concise. Quand tu parles de toi ou que tu accueilles l'utilisateur en français, utilise le masculin grammatical (exemples: 'je suis enchanté', 'heureux de vous aider').""",
    "en": """You are the virtual assistant for Paris Greeters, an association of volunteers offering free walks in Paris with passionate locals.

Your role:
- Answer questions about Greeter walks
- Explain how to book a walk
- Present the association and its values
- Give practical information about Paris

Key information:
- Walks are FREE and last 2-3 hours
- Greeters are volunteers passionate about Paris
- Book on the website, at least 2 weeks in advance
- Groups of 1 to 6 people maximum
- Booking URL: https://gestion.parisiendunjour.fr/visits/new

Be warm, enthusiastic and helpful. Respond in English concisely.""",
    "de": "Du bist der virtuelle Assistent von Paris Greeters. Beantworte Fragen zu kostenlosen Spaziergängen mit lokalen Freiwilligen in Paris. Antworte warm, hilfreich und kurz auf Deutsch.",
    "es": "Eres el asistente virtual de Paris Greeters. Responde preguntas sobre paseos gratuitos con habitantes voluntarios de París. Responde de forma cálida, útil y breve en español.",
    "it": "Sei l'assistente virtuale di Paris Greeters. Rispondi alle domande sulle passeggiate gratuite con volontari locali a Parigi. Rispondi in modo caloroso, utile e conciso in italiano.",
    "pt": "Você é o assistente virtual do Paris Greeters. Responda perguntas sobre passeios gratuitos com voluntários locais em Paris. Responda de forma calorosa, útil e concisa em português.",
}


async def fetch_chatbot_runtime_payload(locale: str, mode: str = "published") -> Dict[str, Any] | None:
    if not CHATBOT_INTERNAL_SECRET:
        return None

    def _request():
        response = requests.get(
            f"{NEXT_INTERNAL_URL}/api/admin/chatbot/runtime-config",
            params={"locale": locale, "mode": mode},
            headers={"x-greeters-internal-secret": CHATBOT_INTERNAL_SECRET},
            timeout=30,
        )
        if response.status_code == 404:
            return None
        response.raise_for_status()
        return response.json()

    try:
        return await asyncio.to_thread(_request)
    except requests.RequestException as error:
        logger.error("Chatbot runtime config error: %s", error)
        return None


def sanitize_mongo_payload(value: Any):
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, dict):
        return {key: sanitize_mongo_payload(item) for key, item in value.items() if key != "_id"}
    if isinstance(value, list):
        return [sanitize_mongo_payload(item) for item in value]
    return value


async def load_chat_message_records(session_id: str) -> List[Dict[str, str]]:
    return await db.chat_messages.find({"session_id": session_id}, {"_id": 0, "id": 1, "role": 1, "content": 1, "timestamp": 1, "language": 1, "visitor_id": 1}).sort("timestamp", 1).to_list(200)


async def load_chat_history(session_id: str) -> List[Dict[str, str]]:
    records = await load_chat_message_records(session_id)
    return [{"role": record["role"], "content": record["content"]} for record in records]


async def save_chat_message(session_id: str, visitor_id: str | None, role: str, content: str, language: str):
    record = {"id": str(uuid.uuid4()), "session_id": session_id, "visitor_id": visitor_id, "role": role, "content": content, "language": language, "timestamp": datetime.now(timezone.utc).isoformat()}
    await db.chat_messages.insert_one(record)
    return record


async def update_chat_session(session_id: str, visitor_id: str | None, language: str):
    latest_message = await db.chat_messages.find_one({"session_id": session_id}, {"_id": 0, "content": 1, "timestamp": 1}, sort=[("timestamp", -1)])
    existing = await db.chat_sessions.find_one({"session_id": session_id}, {"_id": 0, "created_at": 1, "summary": 1})
    message_count = await db.chat_messages.count_documents({"session_id": session_id})
    now = datetime.now(timezone.utc).isoformat()
    await db.chat_sessions.update_one({"session_id": session_id}, {"$set": {"visitor_id": visitor_id, "language": language, "message_count": message_count, "last_message": latest_message.get("content", "") if latest_message else "", "updated_at": now, "summary": existing.get("summary") if existing else None}, "$setOnInsert": {"created_at": now}}, upsert=True)


async def update_chat_visitor(visitor_id: str | None, language: str, session_id: str):
    if not visitor_id:
        return
    now = datetime.now(timezone.utc).isoformat()
    await db.chat_visitors.update_one({"visitor_id": visitor_id}, {"$set": {"preferred_locale": language, "last_seen_at": now, "last_session_id": session_id}, "$setOnInsert": {"created_at": now}}, upsert=True)


async def build_visitor_memory(visitor_id: str | None, current_session_id: str) -> str:
    if not visitor_id:
        return ""
    records = await db.chat_messages.find({"visitor_id": visitor_id, "session_id": {"$ne": current_session_id}}, {"_id": 0, "role": 1, "content": 1, "timestamp": 1}).sort("timestamp", -1).to_list(6)
    if not records:
        return ""
    snippets = []
    for record in reversed(records):
        role_label = "Visiteur" if record.get("role") == "user" else "Assistant"
        snippets.append(f"- {role_label}: {record.get('content', '')[:280]}")
    return "Contexte utile issu des échanges précédents avec ce visiteur:\n" + "\n".join(snippets)


async def get_chatbot_system_prompt(language: str, mode: str = "published") -> str:
    runtime_payload = await fetch_chatbot_runtime_payload(language, mode)
    if runtime_payload and runtime_payload.get("compiledPrompt"):
        return str(runtime_payload["compiledPrompt"])
    return SYSTEM_PROMPTS.get(language, SYSTEM_PROMPTS["fr"])


async def generate_chatbot_reply(session_id: str, visitor_id: str | None, language: str, user_message: str, history_messages: List[Dict[str, str]], mode: str = "published") -> str:
    system_prompt = await get_chatbot_system_prompt(language, mode)
    visitor_memory = await build_visitor_memory(visitor_id, session_id)
    initial_messages: List[Dict[str, str]] = []
    if visitor_memory:
        initial_messages.append({"role": "system", "content": visitor_memory})
    initial_messages.extend(history_messages[-12:])
    return await run_text_llm(session_id=f"chatbot-{mode}-{session_id}", system_message=system_prompt, user_message=user_message, initial_messages=initial_messages)


async def map_feedbacks_by_message(session_id: str) -> Dict[str, List[Dict[str, str]]]:
    feedbacks = await db.chat_feedbacks.find({"session_id": session_id}, {"_id": 0}).sort("created_at", -1).to_list(200)
    grouped: Dict[str, List[Dict[str, str]]] = {}
    for feedback in feedbacks:
        grouped.setdefault(feedback["message_id"], []).append(feedback)
    return grouped

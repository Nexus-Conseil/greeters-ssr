from fastapi import APIRouter, HTTPException

from app.core import GEMINI_API_KEY
from app.schemas import ChatMessage
from app.services.chatbot import (
    SYSTEM_PROMPTS,
    generate_chatbot_reply,
    load_chat_history,
    load_chat_message_records,
    save_chat_message,
    update_chat_session,
    update_chat_visitor,
)



router = APIRouter()


@router.get("/chat/session/{session_id}")
async def get_chat_session(session_id: str):
    messages = await load_chat_message_records(session_id)
    return {"session_id": session_id, "messages": messages}


@router.post("/chat/message")
async def chat_message(payload: ChatMessage):
    if not GEMINI_API_KEY:
        return {"content": "Désolé, le service de chat n'est pas configuré."}
    language = payload.language if payload.language in SYSTEM_PROMPTS else "fr"
    visitor_id = payload.visitor_id or payload.session_id
    history = await load_chat_history(payload.session_id)
    try:
        assistant_text = await generate_chatbot_reply(payload.session_id, visitor_id, language, payload.message, history[-12:], "published")
    except HTTPException as error:
        return {"content": error.detail}
    except Exception:
        return {"content": "Désolé, une erreur s'est produite. Veuillez réessayer."}
    if not assistant_text:
        return {"content": "Désolé, je n'ai pas pu générer de réponse."}
    await save_chat_message(payload.session_id, visitor_id, "user", payload.message, language)
    await save_chat_message(payload.session_id, visitor_id, "assistant", assistant_text, language)
    await update_chat_session(payload.session_id, visitor_id, language)
    await update_chat_visitor(visitor_id, language, payload.session_id)
    return {"content": assistant_text, "visitor_id": visitor_id, "session_id": payload.session_id}
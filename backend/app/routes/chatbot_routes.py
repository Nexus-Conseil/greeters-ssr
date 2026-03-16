from datetime import datetime, timezone
import uuid

from fastapi import APIRouter, HTTPException, Request

from app.core import ADMIN_ROLES, EDITOR_ROLES, EMERGENT_LLM_KEY, db
from app.schemas import ChatMessage, ChatbotFeedbackRequest, ChatbotGenerateReplyRequest
from app.services.chatbot import (
    SYSTEM_PROMPTS,
    generate_chatbot_reply,
    load_chat_history,
    load_chat_message_records,
    map_feedbacks_by_message,
    sanitize_mongo_payload,
    save_chat_message,
    update_chat_session,
    update_chat_visitor,
)
from app.services.llm import run_text_llm
from app.services.next_proxy import get_authenticated_next_user


router = APIRouter()


@router.get("/chat/session/{session_id}")
async def get_chat_session(session_id: str):
    messages = await load_chat_message_records(session_id)
    return sanitize_mongo_payload({"session_id": session_id, "messages": messages})


@router.post("/chat/message")
async def chat_message(payload: ChatMessage):
    if not EMERGENT_LLM_KEY:
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


@router.get("/admin/chatbot/conversations")
async def admin_chatbot_conversations(request: Request):
    await get_authenticated_next_user(request, EDITOR_ROLES)
    return sanitize_mongo_payload(await db.chat_sessions.find({}, {"_id": 0}).sort("updated_at", -1).to_list(200))


@router.get("/admin/chatbot/conversation/{session_id}")
async def admin_chatbot_conversation(session_id: str, request: Request):
    await get_authenticated_next_user(request, EDITOR_ROLES)
    session = await db.chat_sessions.find_one({"session_id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Conversation introuvable.")
    messages = await load_chat_message_records(session_id)
    feedbacks = await map_feedbacks_by_message(session_id)
    return sanitize_mongo_payload({**session, "messages": messages, "feedbacks": feedbacks})


@router.post("/admin/chatbot/conversation/{session_id}/generate-reply")
async def admin_chatbot_generate_reply(session_id: str, payload: ChatbotGenerateReplyRequest, request: Request):
    await get_authenticated_next_user(request, EDITOR_ROLES)
    records = await load_chat_message_records(session_id)
    target_index = next((index for index, item in enumerate(records) if item["id"] == payload.messageId), -1)
    if target_index < 0:
        raise HTTPException(status_code=404, detail="Message introuvable dans cette conversation.")
    target = records[target_index]
    if target.get("role") != "user":
        raise HTTPException(status_code=400, detail="La génération de réponse s’effectue uniquement à partir d’un message visiteur.")
    history = [{"role": item["role"], "content": item["content"]} for item in records[:target_index]]
    language = target.get("language") if target.get("language") in SYSTEM_PROMPTS else "fr"
    mode = payload.mode if payload.mode in {"draft", "published"} else "draft"
    content = await generate_chatbot_reply(session_id, target.get("visitor_id"), language, target["content"], history, mode)
    return {"content": content, "mode": mode, "messageId": payload.messageId}


@router.get("/admin/chatbot/feedbacks")
async def admin_chatbot_feedbacks(request: Request):
    await get_authenticated_next_user(request, EDITOR_ROLES)
    return sanitize_mongo_payload(await db.chat_feedbacks.find({}, {"_id": 0}).sort("created_at", -1).to_list(300))


@router.post("/admin/chatbot/feedback")
async def admin_chatbot_feedback(payload: ChatbotFeedbackRequest, request: Request):
    user = await get_authenticated_next_user(request, EDITOR_ROLES)
    message = await db.chat_messages.find_one({"id": payload.messageId, "session_id": payload.sessionId}, {"_id": 0, "content": 1})
    if not message:
        raise HTTPException(status_code=404, detail="Message introuvable pour ce feedback.")
    record = {"id": str(uuid.uuid4()), "session_id": payload.sessionId, "message_id": payload.messageId, "feedback": payload.feedback.strip(), "admin_id": user.get("email", user.get("id", "admin")), "message_content": message.get("content"), "created_at": datetime.now(timezone.utc).isoformat()}
    await db.chat_feedbacks.insert_one(dict(record))
    return sanitize_mongo_payload({"success": True, "feedback": record})


@router.delete("/admin/chatbot/feedback/{feedback_id}")
async def admin_chatbot_feedback_delete(feedback_id: str, request: Request):
    await get_authenticated_next_user(request, EDITOR_ROLES)
    result = await db.chat_feedbacks.delete_one({"id": feedback_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Feedback introuvable.")
    return {"success": True}


@router.get("/admin/chatbot/improvements")
async def admin_chatbot_improvements(request: Request):
    await get_authenticated_next_user(request, EDITOR_ROLES)
    return sanitize_mongo_payload(await db.chat_improvements.find({}, {"_id": 0}).sort("created_at", -1).to_list(100))


@router.post("/admin/chatbot/synthesize-improvements")
async def admin_chatbot_synthesize_improvements(request: Request):
    await get_authenticated_next_user(request, ADMIN_ROLES)
    feedbacks = await db.chat_feedbacks.find({"improvement_id": {"$exists": False}}, {"_id": 0}).sort("created_at", -1).to_list(30)
    if not feedbacks:
        return {"success": True, "created": False}
    feedback_lines = "\n".join(f"- {feedback.get('feedback', '')}" for feedback in feedbacks)
    summary = await run_text_llm(session_id=f"chatbot-improvements-{uuid.uuid4().hex}", system_message="Tu es responsable qualité du chatbot Paris Greeters. Produis une synthèse courte et exploitable en français, sous forme de consignes concrètes pour améliorer les réponses de l'assistant.", user_message=feedback_lines)
    improvement_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    improvement = {"id": improvement_id, "feedback_summary": summary, "active": True, "created_at": created_at, "source_feedback_ids": [feedback["id"] for feedback in feedbacks]}
    await db.chat_improvements.insert_one(dict(improvement))
    await db.chat_feedbacks.update_many({"id": {"$in": improvement["source_feedback_ids"]}}, {"$set": {"improvement_id": improvement_id}})
    return sanitize_mongo_payload({"success": True, "created": True, "improvement": improvement})


@router.delete("/admin/chatbot/improvement/{improvement_id}")
async def admin_chatbot_delete_improvement(improvement_id: str, request: Request):
    await get_authenticated_next_user(request, ADMIN_ROLES)
    result = await db.chat_improvements.update_one({"id": improvement_id}, {"$set": {"active": False}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Amélioration introuvable.")
    return {"success": True}
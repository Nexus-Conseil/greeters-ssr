from datetime import datetime, timezone
import uuid

from fastapi import APIRouter, HTTPException, Request

from app.core import ADMIN_ROLES, DEFAULT_LOCALE, EDITOR_ROLES, db
from app.schemas import AiPageGeneratorRequest
from app.services.ai_content import generate_ai_page, normalize_locale
from app.services.next_proxy import get_authenticated_next_user


router = APIRouter()


@router.post("/ai/page-generator")
async def ai_page_generator(payload: AiPageGeneratorRequest, request: Request):
    user = await get_authenticated_next_user(request, EDITOR_ROLES)
    prompt = payload.prompt.strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Le prompt IA est obligatoire.")

    locale = normalize_locale(payload.locale)
    session = None
    if payload.sessionId:
        session = await db.ai_page_sessions.find_one({"id": payload.sessionId}, {"_id": 0})
        if not session:
            raise HTTPException(status_code=404, detail="Session IA introuvable.")
        if session.get("createdBy") != user.get("id") and user.get("role") not in ADMIN_ROLES:
            raise HTTPException(status_code=403, detail="Accès à la session IA refusé.")

    session_id = payload.sessionId or str(uuid.uuid4())
    generated_page = await generate_ai_page(prompt, locale)
    now = datetime.now(timezone.utc).isoformat()
    messages = list(session.get("messages", [])) if session else []
    messages.extend([
        {"id": str(uuid.uuid4()), "role": "user", "content": prompt, "createdAt": now},
        {"id": str(uuid.uuid4()), "role": "assistant", "content": f"Proposition générée : {generated_page['title']} ({len(generated_page['sections'])} section(s)).", "createdAt": now, "generatedPage": generated_page},
    ])
    session_doc = {"id": session_id, "createdBy": user.get("id"), "locale": locale, "title": generated_page["title"], "latestDraft": generated_page, "messages": messages, "createdAt": session.get("createdAt", now) if session else now, "updatedAt": now}
    await db.ai_page_sessions.update_one({"id": session_id}, {"$set": session_doc}, upsert=True)
    return {"sessionId": session_id, "generatedPage": generated_page, "messages": [{"id": message["id"], "role": message["role"], "content": message["content"], "createdAt": message["createdAt"]} for message in messages]}


@router.get("/ai/page-generator/{session_id}")
async def ai_page_generator_session(session_id: str, request: Request):
    user = await get_authenticated_next_user(request, EDITOR_ROLES)
    session = await db.ai_page_sessions.find_one({"id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session IA introuvable.")
    if session.get("createdBy") != user.get("id") and user.get("role") not in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Accès à la session IA refusé.")
    return {"id": session["id"], "locale": session.get("locale", DEFAULT_LOCALE), "latestDraft": session.get("latestDraft"), "messages": session.get("messages", [])}



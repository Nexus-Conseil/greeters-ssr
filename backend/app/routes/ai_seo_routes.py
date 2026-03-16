from fastapi import APIRouter, HTTPException, Request

from app.core import ADMIN_ROLES
from app.services.ai_content import as_string, generate_ai_seo, normalize_locale
from app.services.next_proxy import get_authenticated_next_user


router = APIRouter()


@router.post("/ai/seo-optimizer")
async def ai_seo_optimizer(request: Request):
    await get_authenticated_next_user(request, ADMIN_ROLES)
    body = await request.json()
    page = body.get("page") if isinstance(body, dict) and isinstance(body.get("page"), dict) else (body if isinstance(body, dict) else None)
    if not isinstance(page, dict):
        raise HTTPException(status_code=400, detail="La page à optimiser est invalide.")
    locale = normalize_locale(as_string(body.get("locale")) if isinstance(body, dict) else None or as_string(page.get("locale")))
    instructions = as_string(body.get("instructions")) if isinstance(body, dict) else ""
    optimization = await generate_ai_seo(page, locale, instructions or None)
    return {"optimization": optimization}

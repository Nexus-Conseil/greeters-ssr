from fastapi import FastAPI, APIRouter, HTTPException, Request, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from emergentintegrations.llm.chat import LlmChat, UserMessage
import asyncio
import json
import os
import logging
import re
import requests
import unicodedata
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import Any, Dict, List
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')
NEXT_INTERNAL_URL = os.environ['NEXT_INTERNAL_URL'].rstrip('/')

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str


class ChatMessage(BaseModel):
    session_id: str
    message: str
    language: str = "fr"


class AiPageGeneratorRequest(BaseModel):
    prompt: str
    locale: str | None = "fr"
    sessionId: str | None = None


SUPPORTED_LOCALES = {"fr", "en", "de", "es", "it", "ja", "nl", "pt-pt", "zh-hans"}
DEFAULT_LOCALE = "fr"
ADMIN_ROLES = {"SUPER_ADMIN", "ADMIN"}
EDITOR_ROLES = {"SUPER_ADMIN", "ADMIN", "EDITOR"}

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}


async def fetch_next_json(path: str):
    def _request():
        response = requests.get(f"{NEXT_INTERNAL_URL}{path}", timeout=30)
        response.raise_for_status()
        return response.json()

    try:
        return await asyncio.to_thread(_request)
    except requests.RequestException as error:
        logger.error("Next proxy error on %s: %s", path, error)
        raise HTTPException(status_code=502, detail=f"Next route indisponible: {path}") from error


async def proxy_next_request(method: str, path: str, request: Request | None = None):
    def _request(headers: Dict[str, str], body: bytes | None, query_string: str):
        suffix = f"?{query_string}" if query_string else ""
        response = requests.request(
            method,
            f"{NEXT_INTERNAL_URL}{path}{suffix}",
            headers=headers,
            data=body,
            allow_redirects=False,
            timeout=30,
        )
        return response

    headers: Dict[str, str] = {}
    body: bytes | None = None
    query_string = ""

    if request is not None:
        headers = {
            key: value
            for key, value in request.headers.items()
            if key.lower() not in {"host", "content-length", "connection"}
        }
        query_string = request.url.query

        if method in {"POST", "PUT", "PATCH", "DELETE"}:
            body = await request.body()

    try:
        next_response = await asyncio.to_thread(_request, headers, body, query_string)
    except requests.RequestException as error:
        logger.error("Next proxy error on %s: %s", path, error)
        raise HTTPException(status_code=502, detail=f"Next route indisponible: {path}") from error

    proxied_response = Response(
        content=next_response.content,
        status_code=next_response.status_code,
        media_type=next_response.headers.get("content-type", "application/json"),
    )

    for header_name in ("set-cookie", "location"):
        header_value = next_response.headers.get(header_name)
        if header_value:
            proxied_response.headers[header_name] = header_value

    return proxied_response


@api_router.get("/health")
async def health_check():
    payload = await fetch_next_json("/api/health")
    return payload


@api_router.get("/pages/public")
async def public_pages():
    payload = await fetch_next_json("/api/pages/public")
    return payload


@api_router.post("/auth/login")
async def auth_login(request: Request):
    return await proxy_next_request("POST", "/api/auth/login", request)


@api_router.get("/auth/me")
async def auth_me(request: Request):
    return await proxy_next_request("GET", "/api/auth/me", request)


@api_router.post("/auth/logout")
async def auth_logout(request: Request):
    return await proxy_next_request("POST", "/api/auth/logout", request)


@api_router.post("/contact/send")
async def contact_send(request: Request):
    return await proxy_next_request("POST", "/api/contact/send", request)


@api_router.api_route("/pages", methods=["GET", "POST"])
async def pages_root(request: Request):
    return await proxy_next_request(request.method, "/api/pages", request)


@api_router.api_route("/pages/{full_path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def pages_nested(full_path: str, request: Request):
    return await proxy_next_request(request.method, f"/api/pages/{full_path}", request)


@api_router.api_route("/menu", methods=["GET", "PUT"])
async def menu_root(request: Request):
    return await proxy_next_request(request.method, "/api/menu", request)


@api_router.api_route("/menu/{full_path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def menu_nested(full_path: str, request: Request):
    return await proxy_next_request(request.method, f"/api/menu/{full_path}", request)


def normalize_locale(locale: str | None) -> str:
    if not locale:
        return DEFAULT_LOCALE
    normalized = locale.strip().lower()
    return normalized if normalized in SUPPORTED_LOCALES else DEFAULT_LOCALE


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFD", value.lower())
    ascii_only = "".join(char for char in normalized if unicodedata.category(char) != "Mn")
    return re.sub(r"^-+|-+$", "", re.sub(r"[^a-z0-9]+", "-", ascii_only)).strip("-") or f"page-{uuid.uuid4().hex[:8]}"


def build_locale_url(locale: str, slug: str) -> str:
    host = "greeters.paris" if locale == DEFAULT_LOCALE else f"{locale}.greeters.paris"
    path = "/" if slug == "/" else f"/{slug.lstrip('/')}"
    return f"https://{host}{path}"


def extract_json_payload(raw_text: str) -> Dict[str, Any]:
    trimmed = raw_text.strip()
    fence_match = re.search(r"```json\s*([\s\S]*?)```", trimmed, re.IGNORECASE)
    candidate = fence_match.group(1).strip() if fence_match else trimmed

    if not candidate.startswith("{"):
        start = candidate.find("{")
        end = candidate.rfind("}")
        if start >= 0 and end > start:
            candidate = candidate[start : end + 1]

    return json.loads(candidate)


def ensure_llm_key():
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="La clé EMERGENT_LLM_KEY est absente de la configuration serveur.")


async def get_authenticated_next_user(request: Request, allowed_roles: set[str]):
    def _request():
        headers = {}
        cookie_header = request.headers.get("cookie")
        if cookie_header:
            headers["cookie"] = cookie_header
        return requests.get(f"{NEXT_INTERNAL_URL}/api/auth/me", headers=headers, timeout=30)

    try:
        response = await asyncio.to_thread(_request)
    except requests.RequestException as error:
        logger.error("Next auth proxy error: %s", error)
        raise HTTPException(status_code=502, detail="Impossible de valider la session administrateur.") from error

    if response.status_code == 401:
        raise HTTPException(status_code=401, detail="Authentification requise.")

    if not response.ok:
        raise HTTPException(status_code=502, detail="La session administrateur n'a pas pu être validée.")

    user = response.json()
    role = str(user.get("role", ""))
    if role not in allowed_roles:
        raise HTTPException(status_code=403, detail="Droits insuffisants pour cette action.")
    return user


async def run_structured_llm(session_id: str, system_message: str, user_message: str) -> Dict[str, Any]:
    ensure_llm_key()
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=system_message,
        )
        chat.with_model("gemini", "gemini-2.0-flash")
        response = await chat.send_message(UserMessage(text=user_message))
        if not response:
            raise HTTPException(status_code=502, detail="L'IA n'a renvoyé aucun contenu exploitable.")
        return extract_json_payload(response)
    except HTTPException:
        raise
    except Exception as error:
        logger.error("AI generation error: %s", error)
        raise HTTPException(status_code=502, detail="L'IA n'a pas pu produire une réponse valide.") from error


def as_string(value: Any, fallback: str = "") -> str:
    return value.strip() if isinstance(value, str) else fallback


def as_string_list(value: Any) -> List[str]:
    if not isinstance(value, list):
        return []
    return [entry.strip() for entry in value if isinstance(entry, str) and entry.strip()]


def extract_image_recommendations(page: Dict[str, Any]) -> List[Dict[str, Any]]:
    recommendations: List[Dict[str, Any]] = []
    slug = as_string(page.get("slug"), f"page-{uuid.uuid4().hex[:8]}")
    for section in page.get("sections", []):
        if not isinstance(section, dict):
            continue
        for block in section.get("blocks", []):
            if not isinstance(block, dict) or block.get("type") != "image":
                continue
            content = block.get("content") if isinstance(block.get("content"), dict) else {}
            current_src = as_string(content.get("src"))
            alt = as_string(content.get("alt"))
            if not current_src:
                continue
            block_id = as_string(block.get("id"), f"block-{uuid.uuid4().hex}")
            recommendations.append(
                {
                    "blockId": block_id,
                    "currentSrc": current_src,
                    "suggestedFileName": f"{slugify(slug)}-{block_id[-6:]}.webp",
                    "suggestedAlt": alt or f"{as_string(page.get('title'), 'Paris Greeters')} — visuel {len(recommendations) + 1}",
                    "suggestedTitle": as_string(page.get("title"), "Paris Greeters"),
                    "reason": "Image utilisée dans la page, à optimiser pour le référencement.",
                }
            )
    return recommendations


def sanitize_generated_page(plan: Dict[str, Any], locale: str) -> Dict[str, Any]:
    title = as_string(plan.get("title"), "Nouvelle page touristique")
    slug = slugify(as_string(plan.get("slug"), title))
    sections_input = plan.get("sections") if isinstance(plan.get("sections"), list) else []
    sections = []

    for section_index, section in enumerate(sections_input[:6]):
        if not isinstance(section, dict):
            continue
        layout = as_string(section.get("layout"), "default")
        if layout not in {"default", "hero", "two-column", "cards", "centered"}:
            layout = "default"
        background = as_string(section.get("background"), "white")
        if background not in {"white", "gray", "green", "image"}:
            background = "white"
        heading = as_string(section.get("heading"), as_string(section.get("name"), f"Section {section_index + 1}"))
        body = as_string(section.get("body"))
        bullet_points = as_string_list(section.get("bulletPoints"))[:4]
        image_url = as_string(section.get("imageUrl"))
        image_alt = as_string(section.get("imageAlt"), heading)
        cta_label = as_string(section.get("ctaLabel"))
        cta_href = as_string(section.get("ctaHref"), "/")
        blocks: List[Dict[str, Any]] = [
            {
                "id": f"block-{uuid.uuid4().hex}",
                "type": "heading",
                "order": 0,
                "content": {
                    "text": heading,
                    "level": "h1" if section_index == 0 and layout == "hero" else "h2",
                },
            }
        ]

        text_parts = [body.strip(), *[f"• {entry}" for entry in bullet_points if entry.strip()]]
        text_content = "\n\n".join(part for part in text_parts if part)
        if text_content:
            blocks.append(
                {
                    "id": f"block-{uuid.uuid4().hex}",
                    "type": "text",
                    "order": len(blocks),
                    "content": {"text": text_content},
                }
            )

        if image_url:
            blocks.append(
                {
                    "id": f"block-{uuid.uuid4().hex}",
                    "type": "image",
                    "order": len(blocks),
                    "content": {"src": image_url, "alt": image_alt, "caption": as_string(section.get("name"), heading)},
                }
            )

        if cta_label:
            blocks.append(
                {
                    "id": f"block-{uuid.uuid4().hex}",
                    "type": "button",
                    "order": len(blocks),
                    "content": {"text": cta_label, "href": cta_href or "/", "style": "primary" if section_index == 0 else "secondary"},
                }
            )

        sections.append(
            {
                "id": f"section-{uuid.uuid4().hex}",
                "name": as_string(section.get("name"), f"Section {section_index + 1}"),
                "layout": layout,
                "background": background,
                "backgroundImage": as_string(section.get("backgroundImage")) or (image_url if background == "image" else None),
                "blocks": blocks,
                "order": section_index,
            }
        )

    page = {
        "locale": locale,
        "title": title,
        "slug": slug,
        "metaTitle": as_string(plan.get("metaTitle"), title),
        "metaDescription": as_string(plan.get("metaDescription"), f"Découvrez {title} avec Paris Greeters."),
        "metaKeywords": as_string(plan.get("metaKeywords"), "paris, greeters, visite, tourisme"),
        "canonicalUrl": None,
        "robotsDirective": "index,follow",
        "ogTitle": as_string(plan.get("ogTitle"), title),
        "ogDescription": as_string(plan.get("ogDescription"), as_string(plan.get("metaDescription"), f"Découvrez {title} avec Paris Greeters.")),
        "ogImageUrl": next((block["content"]["src"] for section in sections for block in section["blocks"] if block["type"] == "image"), None),
        "ogImageAlt": next((block["content"].get("alt") for section in sections for block in section["blocks"] if block["type"] == "image"), None),
        "twitterTitle": as_string(plan.get("twitterTitle"), title),
        "twitterDescription": as_string(plan.get("twitterDescription"), as_string(plan.get("metaDescription"), f"Découvrez {title} avec Paris Greeters.")),
        "twitterImageUrl": next((block["content"]["src"] for section in sections for block in section["blocks"] if block["type"] == "image"), None),
        "focusKeyword": as_string(plan.get("focusKeyword")) or None,
        "secondaryKeywords": as_string(plan.get("secondaryKeywords")) or None,
        "schemaOrgJson": None,
        "imageRecommendations": [],
        "sitemapPriority": 0.7,
        "sitemapChangeFreq": "monthly",
        "isInMenu": bool(plan.get("isInMenu", False)),
        "menuOrder": int(plan.get("menuOrder", 0) or 0),
        "menuLabel": as_string(plan.get("menuLabel"), title),
        "sections": sections,
    }
    page["imageRecommendations"] = extract_image_recommendations(page)
    return page


def sanitize_seo_optimization(result: Dict[str, Any], page: Dict[str, Any], locale: str) -> Dict[str, Any]:
    title = as_string(page.get("title"), "Paris Greeters")
    slug = as_string(page.get("slug"), slugify(title))
    image_recommendations = result.get("imageRecommendations") if isinstance(result.get("imageRecommendations"), list) else extract_image_recommendations(page)
    canonical_url = as_string(result.get("canonicalUrl"))
    if "greeters.paris" not in canonical_url:
        canonical_url = as_string(page.get("canonicalUrl")) or build_locale_url(locale, slug)

    return {
        "metaTitle": as_string(result.get("metaTitle"), as_string(page.get("metaTitle"), title)),
        "metaDescription": as_string(result.get("metaDescription"), as_string(page.get("metaDescription"), f"Découvrez {title} avec Paris Greeters.")),
        "focusKeyword": as_string(result.get("focusKeyword"), as_string(page.get("focusKeyword"), title)),
        "secondaryKeywords": as_string(result.get("secondaryKeywords"), as_string(page.get("secondaryKeywords"), "paris greeters, balade paris, visite locale")),
        "canonicalUrl": canonical_url,
        "robotsDirective": as_string(result.get("robotsDirective"), as_string(page.get("robotsDirective"), "index,follow")),
        "ogTitle": as_string(result.get("ogTitle"), as_string(page.get("ogTitle"), as_string(result.get("metaTitle"), title))),
        "ogDescription": as_string(result.get("ogDescription"), as_string(page.get("ogDescription"), as_string(result.get("metaDescription"), f"Découvrez {title} avec Paris Greeters."))),
        "ogImageUrl": as_string(result.get("ogImageUrl")) or page.get("ogImageUrl") or (image_recommendations[0].get("currentSrc") if image_recommendations else None),
        "ogImageAlt": as_string(result.get("ogImageAlt")) or page.get("ogImageAlt") or (image_recommendations[0].get("suggestedAlt") if image_recommendations else None),
        "twitterTitle": as_string(result.get("twitterTitle"), as_string(page.get("twitterTitle"), as_string(result.get("ogTitle"), title))),
        "twitterDescription": as_string(result.get("twitterDescription"), as_string(page.get("twitterDescription"), as_string(result.get("ogDescription"), f"Découvrez {title} avec Paris Greeters."))),
        "twitterImageUrl": as_string(result.get("twitterImageUrl")) or page.get("twitterImageUrl") or (image_recommendations[0].get("currentSrc") if image_recommendations else None),
        "schemaOrgJson": as_string(result.get("schemaOrgJson"), json.dumps({"@context": "https://schema.org", "@type": "WebPage", "name": title}, ensure_ascii=False, indent=2)),
        "sitemapPriority": min(max(float(result.get("sitemapPriority", page.get("sitemapPriority", 0.7)) or 0.7), 0.0), 1.0),
        "sitemapChangeFreq": as_string(result.get("sitemapChangeFreq"), as_string(page.get("sitemapChangeFreq"), "monthly")),
        "imageRecommendations": image_recommendations,
        "optimizationSummary": as_string(result.get("optimizationSummary"), "Optimisation SEO générée automatiquement via IA."),
    }


async def generate_ai_page(prompt: str, locale: str) -> Dict[str, Any]:
    payload = await run_structured_llm(
        session_id=f"ai-page-{uuid.uuid4().hex}",
        system_message=(
            "Tu es le directeur artistique et éditorial de Paris Greeters. "
            "Retourne uniquement un JSON valide décrivant une page CMS touristique. "
            "Champs obligatoires: title, slug, metaDescription, metaKeywords, isInMenu, menuOrder, menuLabel, sections. "
            "Chaque section doit contenir name, layout, background, heading, body, bulletPoints, imageUrl, imageAlt, ctaLabel, ctaHref. "
            "Layouts autorisés: default, hero, two-column, cards, centered. Backgrounds autorisés: white, gray, green, image. "
            f"Langue cible: {locale}. Produis 3 à 6 sections maximum, ton chaleureux, informations concrètes, aucune explication hors JSON."
        ),
        user_message=prompt,
    )
    return sanitize_generated_page(payload, locale)


async def generate_ai_seo(page: Dict[str, Any], locale: str, instructions: str | None) -> Dict[str, Any]:
    payload = await run_structured_llm(
        session_id=f"ai-seo-{uuid.uuid4().hex}",
        system_message=(
            "Tu es un expert SEO senior pour Paris Greeters. Retourne uniquement un JSON valide. "
            "Champs obligatoires: metaTitle, metaDescription, focusKeyword, secondaryKeywords, canonicalUrl, robotsDirective, "
            "ogTitle, ogDescription, ogImageUrl, ogImageAlt, twitterTitle, twitterDescription, twitterImageUrl, schemaOrgJson, "
            "sitemapPriority, sitemapChangeFreq, imageRecommendations, optimizationSummary. "
            f"Langue cible: {locale}. Utilise greeters.paris comme domaine canonique et un ton naturel, orienté visiteurs."
        ),
        user_message=json.dumps({"page": page, "instructions": instructions}, ensure_ascii=False),
    )
    return sanitize_seo_optimization(payload, page, locale)


@api_router.post("/ai/page-generator")
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
    messages.extend(
        [
            {
                "id": str(uuid.uuid4()),
                "role": "user",
                "content": prompt,
                "createdAt": now,
            },
            {
                "id": str(uuid.uuid4()),
                "role": "assistant",
                "content": f"Proposition générée : {generated_page['title']} ({len(generated_page['sections'])} section(s)).",
                "createdAt": now,
                "generatedPage": generated_page,
            },
        ]
    )

    session_doc = {
        "id": session_id,
        "createdBy": user.get("id"),
        "locale": locale,
        "title": generated_page["title"],
        "latestDraft": generated_page,
        "messages": messages,
        "createdAt": session.get("createdAt", now) if session else now,
        "updatedAt": now,
    }
    await db.ai_page_sessions.update_one({"id": session_id}, {"$set": session_doc}, upsert=True)

    return {
        "sessionId": session_id,
        "generatedPage": generated_page,
        "messages": [
            {
                "id": message["id"],
                "role": message["role"],
                "content": message["content"],
                "createdAt": message["createdAt"],
            }
            for message in messages
        ],
    }


@api_router.get("/ai/page-generator/{session_id}")
async def ai_page_generator_session(session_id: str, request: Request):
    user = await get_authenticated_next_user(request, EDITOR_ROLES)
    session = await db.ai_page_sessions.find_one({"id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session IA introuvable.")
    if session.get("createdBy") != user.get("id") and user.get("role") not in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Accès à la session IA refusé.")
    return {
        "id": session["id"],
        "locale": session.get("locale", DEFAULT_LOCALE),
        "latestDraft": session.get("latestDraft"),
        "messages": session.get("messages", []),
    }


@api_router.post("/ai/seo-optimizer")
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


@api_router.api_route("/admin/{full_path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def admin_nested(full_path: str, request: Request):
    return await proxy_next_request(request.method, f"/api/admin/{full_path}", request)

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks


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

chat_sessions: Dict[str, List[Dict[str, str]]] = {}


async def load_chat_history(session_id: str) -> List[Dict[str, str]]:
    records = await db.chat_messages.find(
        {"session_id": session_id},
        {"_id": 0, "role": 1, "content": 1},
    ).sort("timestamp", 1).to_list(20)
    return [{"role": record["role"], "content": record["content"]} for record in records]


async def save_chat_message(session_id: str, role: str, content: str):
    await db.chat_messages.insert_one(
        {
            "id": str(uuid.uuid4()),
            "session_id": session_id,
            "role": role,
            "content": content,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    )


@api_router.post("/chat/message")
async def chat_message(payload: ChatMessage):
    if not EMERGENT_LLM_KEY:
        return {"content": "Désolé, le service de chat n'est pas configuré."}

    language = payload.language if payload.language in SYSTEM_PROMPTS else "fr"
    history = await load_chat_history(payload.session_id)
    session_history = history[-10:]
    chat_sessions[payload.session_id] = session_history

    try:
        initial_messages = [{"role": "system", "content": SYSTEM_PROMPTS[language]}]
        initial_messages.extend(session_history)

        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=payload.session_id,
            system_message=SYSTEM_PROMPTS[language],
            initial_messages=initial_messages,
        )
        chat.with_model("gemini", "gemini-2.0-flash")
        assistant_text = await chat.send_message(UserMessage(text=payload.message))
    except Exception as error:
        logger.error("Chat request error: %s", error)
        return {"content": "Désolé, une erreur s'est produite. Veuillez réessayer."}

    if not assistant_text:
        return {"content": "Désolé, je n'ai pas pu générer de réponse."}

    await save_chat_message(payload.session_id, "user", payload.message)
    await save_chat_message(payload.session_id, "assistant", assistant_text)
    chat_sessions[payload.session_id] = [
        *session_history,
        {"role": "user", "content": payload.message},
        {"role": "assistant", "content": assistant_text},
    ][-10:]
    return {"content": assistant_text}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
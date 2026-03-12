from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import httpx
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'greeters-secret-key-2024')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 168  # 7 days

# Gemini API
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')

# Create the main app
app = FastAPI(title="Greeters CMS API")

# Create routers
api_router = APIRouter(prefix="/api")
auth_router = APIRouter(prefix="/auth", tags=["Authentication"])
pages_router = APIRouter(prefix="/pages", tags=["Pages"])
ai_router = APIRouter(prefix="/ai", tags=["AI"])
menu_router = APIRouter(prefix="/menu", tags=["Menu"])
admin_router = APIRouter(prefix="/admin", tags=["Admin"])

security = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============ MODELS ============

class UserCreate(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    created_at: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class PageSection(BaseModel):
    id: str
    name: str
    order: int
    layout: str
    background: str
    backgroundImage: Optional[str] = None
    blocks: List[Dict[str, Any]]

class PageCreate(BaseModel):
    locale: str = "fr"
    title: str
    slug: str
    metaDescription: Optional[str] = None
    metaKeywords: Optional[str] = None
    isInMenu: bool = False
    menuOrder: float = 0
    menuLabel: Optional[str] = None
    sections: List[Dict[str, Any]] = []
    status: str = "draft"

class PageUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    metaDescription: Optional[str] = None
    metaKeywords: Optional[str] = None
    isInMenu: Optional[bool] = None
    menuOrder: Optional[float] = None
    menuLabel: Optional[str] = None
    sections: Optional[List[Dict[str, Any]]] = None
    status: Optional[str] = None

class PageResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    locale: str
    title: str
    slug: str
    metaDescription: Optional[str] = None
    metaKeywords: Optional[str] = None
    isInMenu: bool = False
    menuOrder: float = 0
    menuLabel: Optional[str] = None
    sections: List[Dict[str, Any]] = []
    status: str = "draft"
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class AiGenerateRequest(BaseModel):
    prompt: str
    locale: str = "fr"
    sessionId: Optional[str] = None

class AiChatMessage(BaseModel):
    id: str
    role: str
    content: str
    generated_page: Optional[Dict[str, Any]] = None
    created_at: str

class AiSessionResponse(BaseModel):
    sessionId: str
    generatedPage: Optional[Dict[str, Any]] = None
    messages: List[AiChatMessage] = []

class MenuItem(BaseModel):
    id: str
    label: str
    href: str
    order: int

class MenuResponse(BaseModel):
    items: List[MenuItem]

# ============ AUTH HELPERS ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    payload = {
        'sub': user_id,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
        'iat': datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Optional[dict]:
    if not credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get('sub')
        if not user_id:
            return None
        user = await db.users.find_one({'id': user_id}, {'_id': 0})
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_auth(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    user = await get_current_user(credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user

async def require_admin(user: dict = Depends(require_auth)) -> dict:
    if user.get('role') not in ['super_admin', 'admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ============ AUTH ROUTES ============

@auth_router.post("/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({'email': user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        'id': user_id,
        'email': user_data.email,
        'name': user_data.name,
        'password_hash': hash_password(user_data.password),
        'role': 'editor',
        'created_at': datetime.now(timezone.utc).isoformat(),
        'created_by': None
    }
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id)
    
    # Create session
    session_doc = {
        'id': str(uuid.uuid4()),
        'user_id': user_id,
        'token_hash': bcrypt.hashpw(token.encode(), bcrypt.gensalt()).decode(),
        'expires_at': (datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)).isoformat(),
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    await db.sessions.insert_one(session_doc)
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            email=user_data.email,
            name=user_data.name,
            role='editor',
            created_at=user_doc['created_at']
        )
    )

@auth_router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({'email': credentials.email}, {'_id': 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user['id'])
    
    # Create session
    session_doc = {
        'id': str(uuid.uuid4()),
        'user_id': user['id'],
        'token_hash': bcrypt.hashpw(token.encode(), bcrypt.gensalt()).decode(),
        'expires_at': (datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)).isoformat(),
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    await db.sessions.insert_one(session_doc)
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user['id'],
            email=user['email'],
            name=user['name'],
            role=user['role'],
            created_at=user.get('created_at')
        )
    )

@auth_router.get("/me", response_model=UserResponse)
async def get_me(user: dict = Depends(require_auth)):
    return UserResponse(
        id=user['id'],
        email=user['email'],
        name=user['name'],
        role=user['role'],
        created_at=user.get('created_at')
    )

@auth_router.post("/logout")
async def logout(user: dict = Depends(require_auth)):
    await db.sessions.delete_many({'user_id': user['id']})
    return {"message": "Logged out successfully"}

# ============ PAGES ROUTES ============

@pages_router.get("", response_model=List[PageResponse])
async def list_pages(locale: str = "fr", status: Optional[str] = None):
    query = {'locale': locale}
    if status:
        query['status'] = status
    
    pages = await db.pages.find(query, {'_id': 0}).sort('menuOrder', 1).to_list(1000)
    return pages

@pages_router.get("/public", response_model=List[PageResponse])
async def list_public_pages(locale: str = "fr"):
    pages = await db.pages.find(
        {'locale': locale, 'status': 'published'},
        {'_id': 0}
    ).sort('menuOrder', 1).to_list(1000)
    return pages

@pages_router.get("/slug/{slug:path}", response_model=PageResponse)
async def get_page_by_slug(slug: str, locale: str = "fr"):
    # Clean slug
    if not slug.startswith('/'):
        slug = '/' + slug
    if slug != '/' and slug.endswith('/'):
        slug = slug.rstrip('/')
    
    page = await db.pages.find_one(
        {'slug': slug, 'locale': locale},
        {'_id': 0}
    )
    if not page:
        # Try without leading slash
        page = await db.pages.find_one(
            {'slug': slug.lstrip('/'), 'locale': locale},
            {'_id': 0}
        )
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page

@pages_router.get("/{page_id}", response_model=PageResponse)
async def get_page(page_id: str):
    page = await db.pages.find_one({'id': page_id}, {'_id': 0})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page

@pages_router.post("", response_model=PageResponse)
async def create_page(page_data: PageCreate, user: dict = Depends(require_auth)):
    page_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    page_doc = {
        'id': page_id,
        'locale': page_data.locale,
        'title': page_data.title,
        'slug': page_data.slug,
        'metaDescription': page_data.metaDescription,
        'metaKeywords': page_data.metaKeywords,
        'isInMenu': page_data.isInMenu,
        'menuOrder': page_data.menuOrder,
        'menuLabel': page_data.menuLabel or page_data.title,
        'sections': page_data.sections,
        'status': page_data.status,
        'created_by': user['id'],
        'created_at': now,
        'updated_at': now
    }
    
    await db.pages.insert_one(page_doc)
    page_doc.pop('_id', None)
    return page_doc

@pages_router.put("/{page_id}", response_model=PageResponse)
async def update_page(page_id: str, page_data: PageUpdate, user: dict = Depends(require_auth)):
    page = await db.pages.find_one({'id': page_id})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    update_data = {k: v for k, v in page_data.model_dump().items() if v is not None}
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    update_data['updated_by'] = user['id']
    
    await db.pages.update_one({'id': page_id}, {'$set': update_data})
    
    updated = await db.pages.find_one({'id': page_id}, {'_id': 0})
    return updated

@pages_router.delete("/{page_id}")
async def delete_page(page_id: str, user: dict = Depends(require_admin)):
    result = await db.pages.delete_one({'id': page_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Page not found")
    return {"message": "Page deleted successfully"}

@pages_router.post("/{page_id}/publish", response_model=PageResponse)
async def publish_page(page_id: str, user: dict = Depends(require_admin)):
    page = await db.pages.find_one({'id': page_id})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    await db.pages.update_one(
        {'id': page_id},
        {'$set': {'status': 'published', 'updated_at': datetime.now(timezone.utc).isoformat()}}
    )
    
    updated = await db.pages.find_one({'id': page_id}, {'_id': 0})
    return updated

# ============ AI ROUTES ============

def create_json_schema():
    return {
        "type": "object",
        "required": ["locale", "title", "slug", "metaDescription", "metaKeywords", "isInMenu", "menuOrder", "menuLabel", "sections"],
        "properties": {
            "locale": {"type": "string"},
            "title": {"type": "string"},
            "slug": {"type": "string"},
            "metaDescription": {"type": "string"},
            "metaKeywords": {"type": "string"},
            "isInMenu": {"type": "boolean"},
            "menuOrder": {"type": "number"},
            "menuLabel": {"type": "string"},
            "sections": {
                "type": "array",
                "items": {
                    "type": "object",
                    "required": ["name", "layout", "background", "heading", "body"],
                    "properties": {
                        "name": {"type": "string"},
                        "layout": {"type": "string", "enum": ["default", "hero", "two-column", "cards", "centered"]},
                        "background": {"type": "string", "enum": ["white", "gray", "green", "image"]},
                        "backgroundImage": {"type": "string"},
                        "heading": {"type": "string"},
                        "body": {"type": "string"},
                        "bulletPoints": {"type": "array", "items": {"type": "string"}},
                        "imageUrl": {"type": "string"},
                        "imageAlt": {"type": "string"},
                        "ctaLabel": {"type": "string"},
                        "ctaHref": {"type": "string"}
                    }
                }
            }
        }
    }

def convert_ai_plan_to_page(plan: dict, locale: str) -> dict:
    sections = []
    for idx, section in enumerate(plan.get('sections', [])[:6]):
        blocks = []
        
        # Heading block
        heading = section.get('heading', section.get('name', f'Section {idx + 1}'))
        blocks.append({
            'id': f'block-{uuid.uuid4()}',
            'type': 'heading',
            'order': len(blocks),
            'content': {
                'text': heading,
                'level': 'h1' if idx == 0 and section.get('layout') == 'hero' else 'h2'
            }
        })
        
        # Text block
        body = section.get('body', '')
        bullet_points = section.get('bulletPoints', [])
        if body or bullet_points:
            text_parts = [body] if body else []
            text_parts.extend([f"• {bp}" for bp in bullet_points[:4]])
            blocks.append({
                'id': f'block-{uuid.uuid4()}',
                'type': 'text',
                'order': len(blocks),
                'content': {'text': '\n\n'.join(text_parts)}
            })
        
        # Image block
        image_url = section.get('imageUrl', '')
        if image_url:
            blocks.append({
                'id': f'block-{uuid.uuid4()}',
                'type': 'image',
                'order': len(blocks),
                'content': {
                    'src': image_url,
                    'alt': section.get('imageAlt', heading),
                    'caption': section.get('name', '')
                }
            })
        
        # Button block
        cta_label = section.get('ctaLabel', '')
        if cta_label:
            blocks.append({
                'id': f'block-{uuid.uuid4()}',
                'type': 'button',
                'order': len(blocks),
                'content': {
                    'text': cta_label,
                    'href': section.get('ctaHref', '/'),
                    'style': 'primary' if idx == 0 else 'secondary'
                }
            })
        
        sections.append({
            'id': f'section-{uuid.uuid4()}',
            'name': section.get('name', f'Section {idx + 1}'),
            'order': idx,
            'layout': section.get('layout', 'default'),
            'background': section.get('background', 'white'),
            'backgroundImage': section.get('backgroundImage') if section.get('background') == 'image' else None,
            'blocks': blocks
        })
    
    return {
        'locale': locale,
        'title': plan.get('title', 'Nouvelle page touristique'),
        'slug': plan.get('slug', f'page-{uuid.uuid4().hex[:8]}'),
        'metaDescription': plan.get('metaDescription', ''),
        'metaKeywords': plan.get('metaKeywords', ''),
        'isInMenu': plan.get('isInMenu', True),
        'menuOrder': plan.get('menuOrder', 0),
        'menuLabel': plan.get('menuLabel', plan.get('title', 'Nouvelle page')),
        'sections': sections
    }

@ai_router.post("/generate", response_model=AiSessionResponse)
async def generate_page_with_ai(request: AiGenerateRequest, user: dict = Depends(require_auth)):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")
    
    prompt = request.prompt.strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt is required")
    
    locale = request.locale or "fr"
    
    # Create or get session
    session_id = request.sessionId
    if not session_id:
        session_id = str(uuid.uuid4())
        session_doc = {
            'id': session_id,
            'created_by': user['id'],
            'locale': locale,
            'title': prompt[:120],
            'latest_draft': None,
            'created_at': datetime.now(timezone.utc).isoformat(),
            'updated_at': datetime.now(timezone.utc).isoformat()
        }
        await db.ai_chat_sessions.insert_one(session_doc)
    
    # Save user message
    user_msg_id = str(uuid.uuid4())
    user_msg = {
        'id': user_msg_id,
        'session_id': session_id,
        'role': 'user',
        'content': prompt,
        'generated_page': None,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    await db.ai_chat_messages.insert_one(user_msg)
    
    # Call Gemini API
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}",
                json={
                    "systemInstruction": {
                        "parts": [{
                            "text": f"""Tu es le directeur artistique du CMS Greeters Paris. Tu crées des pages touristiques élégantes, utiles aux visiteurs, cohérentes avec le site mais avec des structures variées d'une page à l'autre. Réponds uniquement avec un JSON valide. Langue cible: {locale}. Exclure mentions légales, cookies, presse, contact institutionnel. N'utiliser que les layouts default, hero, two-column, cards, centered et les backgrounds white, gray, green, image. Toujours prévoir entre 3 et 6 sections, au moins un call-to-action, des contenus concrets, un ton chaleureux et des informations pratiques. Les URLs d'image doivent être de vraies URLs https://images.unsplash.com/... ou rester vides."""
                        }]
                    },
                    "contents": [{
                        "role": "user",
                        "parts": [{"text": f"Crée une page CMS complète à partir de cette demande : {prompt}"}]
                    }],
                    "generationConfig": {
                        "temperature": 1,
                        "topP": 0.95,
                        "responseMimeType": "application/json",
                        "responseSchema": create_json_schema()
                    }
                }
            )
        
        if response.status_code != 200:
            error_data = response.json()
            error_msg = error_data.get('error', {}).get('message', 'Unknown error')
            raise HTTPException(status_code=response.status_code, detail=f"Gemini API error: {error_msg}")
        
        data = response.json()
        text = data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
        
        # Parse JSON response
        if text.startswith('{') or text.startswith('['):
            ai_plan = json.loads(text)
        else:
            start = text.find('{')
            end = text.rfind('}')
            if start >= 0 and end > start:
                ai_plan = json.loads(text[start:end+1])
            else:
                raise HTTPException(status_code=502, detail="Invalid AI response format")
        
        generated_page = convert_ai_plan_to_page(ai_plan, locale)
        
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="AI request timed out")
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=502, detail=f"Failed to parse AI response: {str(e)}")
    
    # Save assistant message
    assistant_msg_id = str(uuid.uuid4())
    assistant_msg = {
        'id': assistant_msg_id,
        'session_id': session_id,
        'role': 'assistant',
        'content': f"Page générée automatiquement pour {locale}.",
        'generated_page': generated_page,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    await db.ai_chat_messages.insert_one(assistant_msg)
    
    # Update session
    await db.ai_chat_sessions.update_one(
        {'id': session_id},
        {'$set': {
            'latest_draft': generated_page,
            'title': generated_page['title'],
            'updated_at': datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Get all messages
    messages = await db.ai_chat_messages.find(
        {'session_id': session_id},
        {'_id': 0}
    ).sort('created_at', 1).to_list(100)
    
    return AiSessionResponse(
        sessionId=session_id,
        generatedPage=generated_page,
        messages=[AiChatMessage(**m) for m in messages]
    )

@ai_router.get("/sessions/{session_id}", response_model=AiSessionResponse)
async def get_ai_session(session_id: str, user: dict = Depends(require_auth)):
    session = await db.ai_chat_sessions.find_one({'id': session_id}, {'_id': 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    messages = await db.ai_chat_messages.find(
        {'session_id': session_id},
        {'_id': 0}
    ).sort('created_at', 1).to_list(100)
    
    return AiSessionResponse(
        sessionId=session_id,
        generatedPage=session.get('latest_draft'),
        messages=[AiChatMessage(**m) for m in messages]
    )

@ai_router.post("/sessions/{session_id}/create-page", response_model=PageResponse)
async def create_page_from_ai_draft(session_id: str, user: dict = Depends(require_auth)):
    session = await db.ai_chat_sessions.find_one({'id': session_id}, {'_id': 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    draft = session.get('latest_draft')
    if not draft:
        raise HTTPException(status_code=400, detail="No draft available")
    
    page_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    page_doc = {
        'id': page_id,
        'locale': draft.get('locale', 'fr'),
        'title': draft.get('title'),
        'slug': draft.get('slug'),
        'metaDescription': draft.get('metaDescription'),
        'metaKeywords': draft.get('metaKeywords'),
        'isInMenu': draft.get('isInMenu', False),
        'menuOrder': draft.get('menuOrder', 0),
        'menuLabel': draft.get('menuLabel'),
        'sections': draft.get('sections', []),
        'status': 'draft',
        'created_by': user['id'],
        'created_at': now,
        'updated_at': now
    }
    
    await db.pages.insert_one(page_doc)
    page_doc.pop('_id', None)
    return page_doc

# ============ MENU ROUTES ============

@menu_router.get("", response_model=MenuResponse)
async def get_menu(locale: str = "fr"):
    # Get published pages that are in menu
    pages = await db.pages.find(
        {'locale': locale, 'isInMenu': True, 'status': 'published'},
        {'_id': 0}
    ).sort('menuOrder', 1).to_list(100)
    
    items = [
        MenuItem(
            id=p['id'],
            label=p.get('menuLabel') or p['title'],
            href=f"/{p['slug']}" if not p['slug'].startswith('/') else p['slug'],
            order=int(p.get('menuOrder', 0))
        )
        for p in pages
    ]
    
    return MenuResponse(items=items)

@menu_router.put("")
async def update_menu(items: List[MenuItem], user: dict = Depends(require_admin)):
    for item in items:
        await db.pages.update_one(
            {'id': item.id},
            {'$set': {'menuOrder': item.order, 'menuLabel': item.label}}
        )
    return {"message": "Menu updated successfully"}

# ============ ADMIN ROUTES ============

@admin_router.get("/users", response_model=List[UserResponse])
async def list_users(user: dict = Depends(require_admin)):
    users = await db.users.find({}, {'_id': 0, 'password_hash': 0}).to_list(1000)
    return [UserResponse(**u) for u in users]

@admin_router.get("/stats")
async def get_stats(user: dict = Depends(require_admin)):
    pages_count = await db.pages.count_documents({})
    published_count = await db.pages.count_documents({'status': 'published'})
    draft_count = await db.pages.count_documents({'status': 'draft'})
    users_count = await db.users.count_documents({})
    ai_sessions_count = await db.ai_chat_sessions.count_documents({})
    
    return {
        'pages': {
            'total': pages_count,
            'published': published_count,
            'draft': draft_count
        },
        'users': users_count,
        'ai_sessions': ai_sessions_count
    }

# ============ ROOT ROUTES ============

@api_router.get("/")
async def root():
    return {"message": "Greeters CMS API", "version": "1.0.0"}

@api_router.get("/health")
async def health():
    try:
        await db.command('ping')
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": str(e)}

# Include all routers
api_router.include_router(auth_router)
api_router.include_router(pages_router)
api_router.include_router(ai_router)
api_router.include_router(menu_router)
api_router.include_router(admin_router)
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

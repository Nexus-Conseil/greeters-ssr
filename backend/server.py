from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import httpx
import json
import psycopg2
from psycopg2.extras import RealDictCursor
import hashlib
import hmac
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# PostgreSQL connection string
DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://greeters:greeters123@localhost:5432/greeters_db')
AUTH_SECRET = os.environ.get('AUTH_SECRET', 'greeters-secret-key-2024-super-secure')
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')

# Session settings
SESSION_COOKIE_NAME = "greeters_session"
SESSION_DURATION_DAYS = 7
SESSION_DURATION_MS = SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000

def get_db_connection():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

# Create the main app
app = FastAPI(title="Greeters CMS API")

# Create routers
api_router = APIRouter(prefix="/api")
auth_router = APIRouter(prefix="/auth", tags=["Authentication"])
pages_router = APIRouter(prefix="/pages", tags=["Pages"])
menu_router = APIRouter(prefix="/menu", tags=["Menu"])
chat_router = APIRouter(prefix="/chat", tags=["Chat"])

security = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============ MODELS ============

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    created_at: Optional[str] = None

class MenuItem(BaseModel):
    id: str
    label: str
    href: str
    order: int

class ChatMessage(BaseModel):
    session_id: str
    message: str
    language: str = "fr"

# Chat sessions storage (in-memory for simplicity)
chat_sessions: Dict[str, List[Dict[str, str]]] = {}

# ============ SESSION HELPERS ============

def bytes_to_base64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')

def base64url_to_bytes(data: str) -> bytes:
    padding = 4 - len(data) % 4
    if padding != 4:
        data += '=' * padding
    return base64.urlsafe_b64decode(data)

def sha256_hex(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()

def create_session_token() -> str:
    return f"{uuid.uuid4()}{str(uuid.uuid4()).replace('-', '')}"

def sign_session_payload(payload: dict) -> str:
    # Use compact JSON format (no spaces) to match JavaScript JSON.stringify
    body = bytes_to_base64url(json.dumps(payload, separators=(',', ':')).encode())
    signature = hmac.new(AUTH_SECRET.encode(), body.encode(), hashlib.sha256).digest()
    return f"{body}.{bytes_to_base64url(signature)}"

def verify_session_payload(value: str) -> Optional[dict]:
    try:
        parts = value.split('.')
        if len(parts) != 2:
            return None
        body, signature = parts
        expected_sig = hmac.new(AUTH_SECRET.encode(), body.encode(), hashlib.sha256).digest()
        if not hmac.compare_digest(base64url_to_bytes(signature), expected_sig):
            return None
        payload = json.loads(base64url_to_bytes(body).decode())
        if payload.get('exp', 0) * 1000 <= datetime.now(timezone.utc).timestamp() * 1000:
            return None
        return payload
    except Exception:
        return None

async def get_current_user_from_cookie(request: Request) -> Optional[dict]:
    cookie_value = request.cookies.get(SESSION_COOKIE_NAME)
    if not cookie_value:
        return None
    
    payload = verify_session_payload(cookie_value)
    if not payload:
        return None
    
    token_hash = sha256_hex(payload['sessionToken'])
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT s.*, u.id as user_id, u.email, u.name, u.role, u.created_at as user_created_at
                FROM sessions s
                JOIN users u ON s.user_id = u.id
                WHERE s.token_hash = %s AND s.expires_at > NOW()
            """, (token_hash,))
            result = cur.fetchone()
            if not result:
                return None
            return {
                'id': result['user_id'],
                'email': result['email'],
                'name': result['name'],
                'role': result['role'],
                'created_at': result['user_created_at'].isoformat() if result['user_created_at'] else None
            }
    finally:
        conn.close()

# ============ AUTH ROUTES ============

@auth_router.post("/login")
async def login(credentials: UserLogin, response: Response):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM users WHERE email = %s", (credentials.email,))
            user = cur.fetchone()
            
            if not user:
                raise HTTPException(status_code=401, detail="Identifiants invalides.")
            
            # Verify password
            if not bcrypt.checkpw(credentials.password.encode('utf-8'), user['password_hash'].encode('utf-8')):
                raise HTTPException(status_code=401, detail="Identifiants invalides.")
            
            # Create session
            session_token = create_session_token()
            token_hash = sha256_hex(session_token)
            expires_at = datetime.now(timezone.utc) + timedelta(days=SESSION_DURATION_DAYS)
            
            cur.execute("""
                INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at)
                VALUES (%s, %s, %s, %s, %s)
            """, (str(uuid.uuid4()), user['id'], token_hash, expires_at, datetime.now(timezone.utc)))
            conn.commit()
            
            # Create cookie value
            cookie_value = sign_session_payload({
                'sessionToken': session_token,
                'userId': user['id'],
                'exp': int(expires_at.timestamp())
            })
            
            # Set cookie
            response.set_cookie(
                key=SESSION_COOKIE_NAME,
                value=cookie_value,
                httponly=True,
                samesite="lax",
                secure=False,  # Set to True in production with HTTPS
                path="/",
                expires=expires_at.strftime("%a, %d %b %Y %H:%M:%S GMT")
            )
            
            return {
                "user": {
                    "id": user['id'],
                    "email": user['email'],
                    "name": user['name'],
                    "role": user['role'],
                    "created_at": user['created_at'].isoformat() if user['created_at'] else None
                },
                "expiresAt": expires_at.isoformat(),
                "sessionDurationDays": SESSION_DURATION_DAYS
            }
    finally:
        conn.close()

@auth_router.get("/me")
async def get_me(request: Request):
    user = await get_current_user_from_cookie(request)
    if not user:
        raise HTTPException(status_code=401, detail="Non authentifié")
    return user

@auth_router.post("/logout")
async def logout(request: Request, response: Response):
    cookie_value = request.cookies.get(SESSION_COOKIE_NAME)
    if cookie_value:
        payload = verify_session_payload(cookie_value)
        if payload:
            token_hash = sha256_hex(payload['sessionToken'])
            conn = get_db_connection()
            try:
                with conn.cursor() as cur:
                    cur.execute("DELETE FROM sessions WHERE token_hash = %s", (token_hash,))
                    conn.commit()
            finally:
                conn.close()
    
    response.delete_cookie(SESSION_COOKIE_NAME, path="/")
    return {"message": "Déconnexion réussie"}

# ============ PAGES ROUTES ============

@pages_router.get("/public")
async def get_public_pages(locale: str = "fr"):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, locale, title, slug, meta_description as "metaDescription",
                       meta_keywords as "metaKeywords", is_in_menu as "isInMenu",
                       menu_order as "menuOrder", menu_label as "menuLabel",
                       sections, status, created_at, updated_at
                FROM pages
                WHERE locale = %s AND status = 'PUBLISHED'
                ORDER BY menu_order
            """, (locale,))
            pages = cur.fetchall()
            return [dict(p) for p in pages]
    finally:
        conn.close()

@pages_router.get("/slug/{slug:path}")
async def get_page_by_slug(slug: str, locale: str = "fr"):
    # Clean slug
    if slug.startswith('/'):
        slug = slug[1:]
    if slug.endswith('/'):
        slug = slug[:-1]
    if not slug:
        slug = "/"
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, locale, title, slug, meta_description as "metaDescription",
                       meta_keywords as "metaKeywords", is_in_menu as "isInMenu",
                       menu_order as "menuOrder", menu_label as "menuLabel",
                       sections, status, created_at, updated_at
                FROM pages
                WHERE (slug = %s OR slug = %s) AND locale = %s
                LIMIT 1
            """, (slug, f"/{slug}" if not slug.startswith('/') else slug, locale))
            page = cur.fetchone()
            if not page:
                raise HTTPException(status_code=404, detail="Page non trouvée")
            return dict(page)
    finally:
        conn.close()

# ============ MENU ROUTES ============

@menu_router.get("")
async def get_menu(locale: str = "fr"):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, title, slug, menu_label, menu_order
                FROM pages
                WHERE locale = %s AND status = 'PUBLISHED' AND is_in_menu = true
                ORDER BY menu_order
            """, (locale,))
            pages = cur.fetchall()
            items = [
                MenuItem(
                    id=p['id'],
                    label=p['menu_label'] or p['title'],
                    href=f"/{p['slug']}" if not p['slug'].startswith('/') else p['slug'],
                    order=int(p['menu_order'] or 0)
                )
                for p in pages
            ]
            return {"items": [item.model_dump() for item in items]}
    finally:
        conn.close()

# ============ CHAT ROUTES ============

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

Sois chaleureux, enthousiaste et serviable. Réponds en français de manière concise.""",
    
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
}

@chat_router.post("/message")
async def chat_message(msg: ChatMessage):
    if not GEMINI_API_KEY:
        return {"content": "Désolé, le service de chat n'est pas configuré."}
    
    session_id = msg.session_id
    language = msg.language if msg.language in SYSTEM_PROMPTS else "fr"
    
    # Initialize session if needed
    if session_id not in chat_sessions:
        chat_sessions[session_id] = []
    
    # Add user message to history
    chat_sessions[session_id].append({"role": "user", "content": msg.message})
    
    # Build conversation for Gemini
    system_prompt = SYSTEM_PROMPTS.get(language, SYSTEM_PROMPTS["fr"])
    
    contents = []
    for m in chat_sessions[session_id][-10:]:  # Last 10 messages
        contents.append({
            "role": "user" if m["role"] == "user" else "model",
            "parts": [{"text": m["content"]}]
        })
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}",
                json={
                    "systemInstruction": {"parts": [{"text": system_prompt}]},
                    "contents": contents,
                    "generationConfig": {
                        "temperature": 0.7,
                        "topP": 0.9,
                        "maxOutputTokens": 500
                    }
                }
            )
        
        if response.status_code != 200:
            logger.error(f"Gemini API error: {response.text}")
            return {"content": "Désolé, une erreur s'est produite. Veuillez réessayer."}
        
        data = response.json()
        assistant_text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        
        if not assistant_text:
            return {"content": "Désolé, je n'ai pas pu générer de réponse."}
        
        # Add assistant response to history
        chat_sessions[session_id].append({"role": "assistant", "content": assistant_text})
        
        return {"content": assistant_text}
        
    except httpx.TimeoutException:
        return {"content": "Désolé, la requête a expiré. Veuillez réessayer."}
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return {"content": "Désolé, une erreur s'est produite."}

# ============ ROOT ROUTES ============

@api_router.get("/")
async def root():
    return {"message": "Greeters CMS API", "version": "1.0.0"}

@api_router.get("/health")
async def health():
    try:
        conn = get_db_connection()
        conn.close()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": str(e)}

# Include all routers
api_router.include_router(auth_router)
api_router.include_router(pages_router)
api_router.include_router(menu_router)
api_router.include_router(chat_router)
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

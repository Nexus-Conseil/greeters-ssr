from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from emergentintegrations.llm.chat import LlmChat, UserMessage


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

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

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

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

# ---------- Chatbot ----------

KNOWLEDGE_BASE = """À PROPOS DES GREETERS DE PARIS

Les greeters de Paris sont des bénévoles passionnés qui partagent leur amour de Paris avec des visiteurs du monde entier. Ils ne reçoivent aucune rémunération – seulement le plaisir d'échanger amicalement avec les visiteurs, si possible dans leur langue.

LES BALADES AVEC UN GREETER :
- durée : 2 à 3 heures (parfois plus, selon l'envie mutuelle)
- entièrement gratuites
- maximum 6 personnes par balade
- disponibles dans 15 langues

COMMENT RÉSERVER :
- via le formulaire sur le site
- il suffit de remplir quelques informations
- idéalement entre 1 mois et 10 jours avant la visite

L'ASSOCIATION :
- nom complet : « Parisien d'un Jour, Parisien toujours »
- environ 300 greeters bénévoles
- 4 000 à 5 000 demandes par an, dont 75 % honorées
- association loi 1901
- membre de l'office de tourisme de Paris

LA PHILOSOPHIE :
- « Venez en visiteurs, repartez en amis »
- des balades amicales et interactives, adaptées à chaque visiteur
- pas de visites de musées, pas de visites guidées professionnelles
- des échanges authentiques avec des Parisien·ne·s

ACCESSIBILITÉ :
- aucune discrimination
- visiteurs en situation de handicap bienvenus (balades adaptées)
- familles avec enfants bienvenues

LE RÉSEAU :
- fédération française : environ 60 destinations en France
- fédération internationale (IGA) : environ 170 villes dans le monde

CE QUE LES GREETERS NE FONT PAS :
- groupes de plus de 6 personnes
- visites guidées professionnelles
"""

LANGUAGE_INSTRUCTIONS = {
    'fr': "Tu dois TOUJOURS vouvoyer l'internaute. Réponds en français de manière chaleureuse, enjouée et enthousiaste.",
    'en': "You must respond in English in a warm, cheerful and enthusiastic manner.",
    'de': "Du musst auf Deutsch auf warme, fröhliche und begeisterte Weise antworten. Verwenden Sie immer die höfliche Form 'Sie'.",
    'es': "Debes responder en español de manera cálida, alegre y entusiasta. Utiliza siempre el 'usted' formal.",
    'it': "Devi rispondere in italiano in modo caloroso, allegro e entusiasta. Usa sempre il 'Lei' formale.",
    'pt': "Você deve responder em português de maneira calorosa, alegre e entusiasta.",
}

def build_system_message(language: str) -> str:
    lang_instr = LANGUAGE_INSTRUCTIONS.get(language, LANGUAGE_INSTRUCTIONS['fr'])
    return f"""Tu es l'assistant virtuel des Greeters de Paris – des bénévoles passionnés qui partagent leur amour de Paris avec les visiteurs du monde entier.

LIMITATION STRICTE DES SUJETS:
Tu ne dois répondre QU'AUX QUESTIONS concernant :
1. Les Greeters de Paris (l'association, les bénévoles, les balades, les réservations)
2. Les balades à Paris (quartiers, durée, organisation, langues disponibles)
3. Les curiosités touristiques à Paris (monuments, musées, quartiers, histoire de Paris)

Pour TOUT AUTRE SUJET, décline poliment en orientant vers les Greeters et Paris.

TON ET IDENTITÉ:
- Tu incarnes un Parisien chaleureux, enjoué et passionné.
- Tu parles au nom des greeters bénévoles, pas d'une entreprise.
- JAMAIS de ton commercial. Tu es un ami qui partage sa passion.
- Ne te présente JAMAIS par un prénom.

RÈGLES:
1. VOUVOIEMENT OBLIGATOIRE en français.
2. Sois enjoué et expressif, mais authentique.
3. Fais des paragraphes courts et bien séparés.
4. NE PAS commencer par "Bonjour".
5. RÈGLE ABSOLUE : NE POSE AUCUNE QUESTION sauf pour confirmer une réservation.

RÉSERVATION EN DEUX ÉTAPES :
Étape 1 : Quand l'internaute veut réserver, demande "Souhaitez-vous vous rendre sur le formulaire de réservation ?"
Étape 2 : Après réponse affirmative, inclus "cliquez sur le bouton" dans ta réponse.

{lang_instr}

BASE DE CONNAISSANCE :
{KNOWLEDGE_BASE}"""


class ChatMessageCreate(BaseModel):
    session_id: str
    message: str
    language: str = 'fr'

class ChatMessageResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    session_id: str
    role: str
    content: str
    language: str
    timestamp: str


@api_router.post("/chat/message", response_model=ChatMessageResponse)
async def send_chat_message(input: ChatMessageCreate):
    try:
        api_key = os.environ.get('EMERGENT_LLM_KEY', '')
        if not api_key:
            raise Exception("LLM API key not configured")

        # Store user message
        user_msg = {
            "id": str(uuid.uuid4()),
            "session_id": input.session_id,
            "role": "user",
            "content": input.message,
            "language": input.language,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await db.chat_messages.insert_one(user_msg.copy())

        # Get recent conversation history
        one_hour_ago = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
        history = await db.chat_messages.find(
            {"session_id": input.session_id, "timestamp": {"$gte": one_hour_ago}},
            {"_id": 0}
        ).sort("timestamp", 1).limit(50).to_list(50)

        # Build system message
        system_message = build_system_message(input.language)

        # Use emergentintegrations for Claude
        chat = LlmChat(
            api_key=api_key,
            session_id=f"greeters-chat-{input.session_id}",
            system_message=system_message
        ).with_model("anthropic", "claude-4-sonnet-20250514")

        # Send conversation as a single prompt with context
        context_parts = []
        for msg in history:
            prefix = "Visiteur" if msg["role"] == "user" else "Assistant"
            context_parts.append(f"{prefix}: {msg['content']}")

        full_prompt = "\n".join(context_parts) if len(context_parts) > 1 else input.message

        user_message = UserMessage(text=full_prompt)
        ai_response = await chat.send_message(user_message)

        # Store AI response
        ai_msg = {
            "id": str(uuid.uuid4()),
            "session_id": input.session_id,
            "role": "assistant",
            "content": ai_response,
            "language": input.language,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await db.chat_messages.insert_one(ai_msg.copy())

        return ChatMessageResponse(**ai_msg)

    except Exception as e:
        logger.error(f"Chat error: {e}")
        # Return a friendly error message
        error_msg = {
            "id": str(uuid.uuid4()),
            "session_id": input.session_id,
            "role": "assistant",
            "content": "Désolé, une erreur s'est produite. Veuillez réessayer.",
            "language": input.language,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        return ChatMessageResponse(**error_msg)


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
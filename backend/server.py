from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from emergentintegrations.llm.chat import LlmChat, UserMessage
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import Dict, List
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

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
import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient


ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")
load_dotenv(ROOT_DIR / ".env.local")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
NEXT_INTERNAL_URL = os.environ["NEXT_INTERNAL_URL"].rstrip("/")
CANONICAL_ROOT_DOMAIN = os.environ["CANONICAL_ROOT_DOMAIN"]
CHATBOT_INTERNAL_SECRET = os.environ.get("CHATBOT_INTERNAL_SECRET", "")

SUPPORTED_LOCALES = {"fr", "en", "de", "es", "it", "ja", "nl", "pt-pt", "zh-hans"}
DEFAULT_LOCALE = "fr"
ADMIN_ROLES = {"SUPER_ADMIN", "ADMIN"}
EDITOR_ROLES = {"SUPER_ADMIN", "ADMIN", "EDITOR"}


async def close_db_client():
    client.close()

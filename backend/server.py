from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware
import os
from app.core import close_db_client
from app.routes.ai_routes import router as ai_router
from app.routes.ai_seo_routes import router as ai_seo_router
from app.routes.admin_chatbot_routes import router as admin_chatbot_router
from app.routes.chatbot_routes import router as chatbot_router
from app.routes.proxy_routes import router as proxy_router
from app.routes.status_routes import router as status_router


app = FastAPI()
api_router = APIRouter(prefix="/api")
for router in (proxy_router, ai_router, ai_seo_router, status_router, chatbot_router, admin_chatbot_router):
    api_router.include_router(router)

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
    await close_db_client()
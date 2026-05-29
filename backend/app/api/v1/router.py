from fastapi import APIRouter

from app.api.v1 import ai_agents, campaigns, conversations, dashboard, me, students, whatsapp
from app.api.v1.webhooks import whatsapp as whatsapp_webhooks

api_router = APIRouter()
api_router.include_router(me.router, tags=["auth"])
api_router.include_router(dashboard.router, tags=["dashboard"])
api_router.include_router(campaigns.router)
api_router.include_router(whatsapp.router)
api_router.include_router(conversations.router)
api_router.include_router(ai_agents.router)
api_router.include_router(students.router)
api_router.include_router(whatsapp_webhooks.router, prefix="/webhooks", tags=["webhooks"])

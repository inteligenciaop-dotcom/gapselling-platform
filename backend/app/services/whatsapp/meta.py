from typing import Any
from fastapi import HTTPException, status
from app.services.whatsapp.provider import WebhookEvent

class MetaProvider:
    name = "meta"
    def build_instance_name(self, academy_id: str) -> str:
        return f"meta-{academy_id.replace('-', '')[:12]}"
    async def create_instance(self, instance_name: str) -> dict[str, Any]:
        raise HTTPException(status_code=501, detail="Provedor Meta ainda nao implementado.")
    async def connect_instance(self, instance_name: str) -> dict[str, Any]:
        raise HTTPException(status_code=501, detail="Provedor Meta ainda nao implementado.")
    async def fetch_connection_state(self, instance_name: str) -> str:
        return "close"
    async def fetch_profile_phone(self, instance_name: str) -> str | None:
        return None
    async def logout_instance(self, instance_name: str) -> None:
        return None
    async def delete_instance(self, instance_name: str) -> None:
        return None
    async def set_instance_webhook(self, instance_name: str, webhook_url: str) -> None:
        return None
    async def send_text(self, instance_name: str, phone: str, text: str) -> dict[str, Any]:
        raise HTTPException(status_code=501, detail="Provedor Meta ainda nao implementado.")
    def parse_webhook_event(self, payload: dict[str, Any]) -> WebhookEvent:
        return None
    def map_connection_state(self, state: str) -> tuple[str, bool]:
        return "desconectado", False
    def extract_qr_base64(self, payload: dict[str, Any]) -> str | None:
        return None

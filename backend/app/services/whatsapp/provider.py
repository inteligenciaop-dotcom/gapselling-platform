from __future__ import annotations
from dataclasses import dataclass
from typing import Any, Protocol, runtime_checkable

@dataclass
class InboundMessage:
    instance_name: str
    remote_jid: str
    phone: str
    text: str
    message_id: str | None = None
    push_name: str | None = None

@dataclass
class ConnectionUpdate:
    instance_name: str
    state: str

@dataclass
class QrCodeUpdate:
    instance_name: str
    qr_base64: str | None

WebhookEvent = InboundMessage | ConnectionUpdate | QrCodeUpdate | None

@runtime_checkable
class WhatsAppProvider(Protocol):
    name: str
    async def create_instance(self, instance_name: str) -> dict[str, Any]: ...
    async def connect_instance(self, instance_name: str) -> dict[str, Any]: ...
    async def fetch_connection_state(self, instance_name: str) -> str: ...
    async def fetch_profile_phone(self, instance_name: str) -> str | None: ...
    async def logout_instance(self, instance_name: str) -> None: ...
    async def delete_instance(self, instance_name: str) -> None: ...
    async def set_instance_webhook(self, instance_name: str, webhook_url: str) -> None: ...
    async def send_text(self, instance_name: str, phone: str, text: str) -> dict[str, Any]: ...
    def parse_webhook_event(self, payload: dict[str, Any]) -> WebhookEvent: ...
    def map_connection_state(self, state: str) -> tuple[str, bool]: ...
    def extract_qr_base64(self, payload: dict[str, Any]) -> str | None: ...
    def build_instance_name(self, academy_id: str) -> str: ...

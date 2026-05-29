from typing import Any

import base64
import io

import httpx
from fastapi import HTTPException, status

from app.core.config import get_settings
from app.services.whatsapp.provider import (
    ConnectionUpdate,
    InboundMessage,
    QrCodeUpdate,
    WebhookEvent,
)


class EvolutionApiError(Exception):
    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(message)
        self.status_code = status_code


class EvolutionProvider:
    name = "evolution"

    def build_instance_name(self, academy_id: str) -> str:
        compact = academy_id.replace("-", "")[:12]
        return f"gap-{compact}"

    def _headers(self) -> dict[str, str]:
        settings = get_settings()
        return {
            "apikey": settings.evolution_api_key,
            "Content-Type": "application/json",
        }

    def _base_url(self) -> str:
        settings = get_settings()
        if not settings.evolution_configured:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Evolution API nao configurada. Defina EVOLUTION_API_URL e EVOLUTION_API_KEY.",
            )
        return settings.evolution_api_url.rstrip("/")

    async def _request(self, method: str, path: str, json: dict[str, Any] | None = None) -> Any:
        url = f"{self._base_url()}{path}"
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.request(method, url, headers=self._headers(), json=json)
        if response.status_code >= 400:
            detail = response.text
            try:
                payload = response.json()
                detail = payload.get("message") or payload.get("error") or detail
            except ValueError:
                pass
            raise EvolutionApiError(str(detail), response.status_code)
        if not response.content:
            return {}
        try:
            return response.json()
        except ValueError:
            return {}

    async def create_instance(self, instance_name: str) -> dict[str, Any]:
        return await self._request(
            "POST",
            "/instance/create",
            {
                "instanceName": instance_name,
                "integration": "WHATSAPP-BAILEYS",
                "qrcode": True,
            },
        )

    async def connect_instance(self, instance_name: str) -> dict[str, Any]:
        return await self._request("GET", f"/instance/connect/{instance_name}")

    async def fetch_connection_state(self, instance_name: str) -> str:
        payload = await self._request("GET", f"/instance/connectionState/{instance_name}")
        instance = payload.get("instance") if isinstance(payload, dict) else None
        if isinstance(instance, dict):
            return str(instance.get("state") or "close").lower()
        return str(payload.get("state") or "close").lower()

    async def fetch_profile_phone(self, instance_name: str) -> str | None:
        try:
            payload = await self._request(
                "GET",
                f"/instance/fetchInstances?instanceName={instance_name}",
            )
        except EvolutionApiError:
            payload = None

        phone = self._phone_from_instance_payload(payload)
        if phone:
            return phone

        try:
            profile = await self._request("GET", f"/instance/fetchProfile/{instance_name}")
        except EvolutionApiError:
            return None
        wuid = profile.get("wuid") or profile.get("id") or ""
        if not wuid:
            return None
        digits = str(wuid).split("@")[0]
        return digits or None

    def _phone_from_instance_payload(self, payload: Any) -> str | None:
        rows: list[dict[str, Any]] = []
        if isinstance(payload, list):
            rows = [row for row in payload if isinstance(row, dict)]
        elif isinstance(payload, dict):
            rows = [payload]

        for row in rows:
            owner_jid = row.get("ownerJid") or row.get("owner") or row.get("wuid")
            if not owner_jid:
                continue
            digits = str(owner_jid).split("@")[0]
            if digits.isdigit():
                return digits
        return None

    async def logout_instance(self, instance_name: str) -> None:
        await self._request("DELETE", f"/instance/logout/{instance_name}")

    async def delete_instance(self, instance_name: str) -> None:
        await self._request("DELETE", f"/instance/delete/{instance_name}")

    async def set_instance_webhook(self, instance_name: str, webhook_url: str) -> None:
        await self._request(
            "POST",
            f"/webhook/set/{instance_name}",
            {
                "webhook": {
                    "enabled": True,
                    "url": webhook_url,
                    "webhookByEvents": False,
                    "webhookBase64": True,
                    "events": [
                        "CONNECTION_UPDATE",
                        "QRCODE_UPDATED",
                        "MESSAGES_UPSERT",
                    ],
                }
            },
        )

    async def send_text(
        self,
        instance_name: str,
        phone: str,
        text: str,
        *,
        whatsapp_jid: str | None = None,
    ) -> dict[str, Any]:
        from app.services.phone_utils import format_whatsapp_jid

        number = format_whatsapp_jid(phone, whatsapp_jid)
        if not number:
            raise EvolutionApiError(
                f"Numero WhatsApp invalido para envio: {phone or whatsapp_jid}",
                400,
            )
        return await self._request(
            "POST",
            f"/message/sendText/{instance_name}",
            {"number": number, "text": text},
        )

    def extract_qr_base64(self, connect_payload: dict[str, Any]) -> str | None:
        if not isinstance(connect_payload, dict):
            return None

        direct = connect_payload.get("base64")
        if isinstance(direct, str) and direct.strip():
            return self._normalize_qr_base64(direct.strip())

        qrcode = connect_payload.get("qrcode")
        if isinstance(qrcode, dict):
            nested = qrcode.get("base64")
            if isinstance(nested, str) and nested.strip():
                return self._normalize_qr_base64(nested.strip())

        # Evolution v2 /instance/connect retorna `code` (string do QR), nao base64
        code = connect_payload.get("code")
        if isinstance(code, str) and code.strip():
            generated = self._qr_png_base64_from_text(code.strip())
            if generated:
                return generated

        return None

    def extract_pairing_code(self, connect_payload: dict[str, Any]) -> str | None:
        if not isinstance(connect_payload, dict):
            return None
        pairing_code = connect_payload.get("pairingCode")
        if isinstance(pairing_code, str) and pairing_code.strip():
            return pairing_code.strip()
        return None

    def _normalize_qr_base64(self, value: str) -> str:
        if value.startswith("data:image") and "," in value:
            return value.split(",", 1)[1]
        return value

    def _qr_png_base64_from_text(self, text: str) -> str | None:
        try:
            import qrcode

            img = qrcode.make(text)
            buffer = io.BytesIO()
            img.save(buffer, format="PNG")
            return base64.b64encode(buffer.getvalue()).decode("ascii")
        except Exception:
            return None

    def map_connection_state(self, state: str) -> tuple[str, bool]:
        normalized = (state or "close").lower()
        if normalized in {"open", "connected"}:
            return "conectado", True
        if normalized in {"connecting", "qrcode", "pairing"}:
            return "aguardando QR", False
        return "desconectado", False

    def _normalize_event(self, payload: dict[str, Any]) -> str:
        return str(payload.get("event") or payload.get("type") or "").upper().replace(".", "_")

    def _instance_name_from_payload(self, payload: dict[str, Any]) -> str | None:
        raw = (
            payload.get("instance")
            or payload.get("instanceName")
            or (payload.get("data") or {}).get("instance")
        )
        if isinstance(raw, dict):
            raw = raw.get("instanceName") or raw.get("name")
        return str(raw) if raw else None

    def parse_webhook_event(self, payload: dict[str, Any]) -> WebhookEvent:
        instance_name = self._instance_name_from_payload(payload)
        if not instance_name:
            return None
        event = self._normalize_event(payload)
        if event == "CONNECTION_UPDATE":
            data = payload.get("data") or {}
            state = str(data.get("state") or data.get("status") or "close")
            return ConnectionUpdate(instance_name=instance_name, state=state)
        if event == "QRCODE_UPDATED":
            data = payload.get("data") or {}
            qr = self.extract_qr_base64(data if isinstance(data, dict) else {})
            return QrCodeUpdate(instance_name=instance_name, qr_base64=qr)
        if event in {"MESSAGES_UPSERT", "MESSAGES_UPSERT"}:
            data = payload.get("data") or {}
            messages: list[Any] | None = None
            if isinstance(data, dict):
                messages = data.get("messages")
                if not messages and data.get("key"):
                    messages = [data]
            elif isinstance(data, list):
                messages = data
            if not messages:
                return None
            for msg in messages:
                if not isinstance(msg, dict):
                    continue
                key = msg.get("key") or {}
                if key.get("fromMe"):
                    continue
                remote_jid, phone = self._resolve_inbound_contact(key, msg)
                if not remote_jid or not phone:
                    continue
                text = self._extract_message_text(msg)
                if not text:
                    continue
                return InboundMessage(
                    instance_name=instance_name,
                    remote_jid=remote_jid,
                    phone=phone,
                    text=text,
                    message_id=str(key.get("id") or "") or None,
                    push_name=msg.get("pushName"),
                )
        return None

    def _resolve_inbound_contact(self, key: dict[str, Any], msg: dict[str, Any]) -> tuple[str | None, str | None]:
        from app.services.phone_utils import (
            is_valid_whatsapp_phone,
            lid_phone_key,
            normalize_phone,
        )

        remote_jid = str(key.get("remoteJid") or "")
        remote_jid_alt = str(key.get("remoteJidAlt") or "")
        sender_pn = str(key.get("senderPn") or "")
        participant = str(key.get("participant") or "")
        previous_remote_jid = str(key.get("previousRemoteJid") or "")

        if remote_jid.endswith("@g.us"):
            return None, None

        for candidate in (remote_jid_alt, sender_pn, previous_remote_jid):
            if candidate.endswith("@s.whatsapp.net"):
                phone = normalize_phone(candidate.split("@", 1)[0])
                if is_valid_whatsapp_phone(phone):
                    return f"{phone}@s.whatsapp.net", phone

        if remote_jid.endswith("@lid"):
            lid_local = remote_jid.split("@", 1)[0]
            return remote_jid, lid_phone_key(lid_local)

        if remote_jid.endswith("@s.whatsapp.net"):
            phone = normalize_phone(remote_jid.split("@", 1)[0])
            if is_valid_whatsapp_phone(phone):
                return f"{phone}@s.whatsapp.net", phone

        if participant.endswith("@s.whatsapp.net"):
            phone = normalize_phone(participant.split("@", 1)[0])
            if is_valid_whatsapp_phone(phone):
                return f"{phone}@s.whatsapp.net", phone

        if participant.endswith("@lid"):
            return participant, lid_phone_key(participant.split("@", 1)[0])

        return None, None

    def _extract_message_text(self, msg: dict[str, Any]) -> str:
        message = msg.get("message") or {}
        if not isinstance(message, dict):
            return ""
        for key in ("conversation", "extendedTextMessage"):
            block = message.get(key)
            if isinstance(block, str) and block.strip():
                return block.strip()
            if isinstance(block, dict):
                text = block.get("text")
                if isinstance(text, str) and text.strip():
                    return text.strip()
        return ""


_provider: EvolutionProvider | None = None


def get_evolution_provider() -> EvolutionProvider:
    global _provider
    if _provider is None:
        _provider = EvolutionProvider()
    return _provider

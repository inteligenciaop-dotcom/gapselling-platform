from typing import Any

from fastapi import HTTPException, status

from app.core.config import get_settings
from app.services.inbound_handler import handle_inbound_message
from app.services.supabase_rest import (
    fetch_whatsapp_instance_by_academy,
    fetch_whatsapp_instance_by_name,
    insert_whatsapp_instance,
    update_whatsapp_instance,
)
from app.services.whatsapp.evolution import EvolutionApiError
from app.services.whatsapp.factory import get_whatsapp_provider
from app.services.whatsapp.provider import ConnectionUpdate, InboundMessage, QrCodeUpdate

STATUS_DISCONNECTED = "desconectado"
STATUS_WAITING_QR = "aguardando QR"
STATUS_CONNECTED = "conectado"


def _serialize_instance(row: dict[str, Any] | None) -> dict[str, Any]:
    settings = get_settings()
    provider = get_whatsapp_provider()
    configured = settings.evolution_configured if provider.name == "evolution" else False
    if not row:
        return {
            "configured": configured,
            "connected": False,
            "status": STATUS_DISCONNECTED,
            "phone": None,
            "instance_name": None,
            "instance_id": None,
            "qr_code": None,
            "pairing_code": None,
            "provider": provider.name,
        }
    status_value = row.get("status") or STATUS_DISCONNECTED
    return {
        "configured": configured,
        "connected": status_value == STATUS_CONNECTED,
        "status": status_value,
        "phone": row.get("phone"),
        "instance_name": row.get("instance_name"),
        "instance_id": row.get("id"),
        "qr_code": row.get("qr_code"),
        "pairing_code": None,
        "provider": provider.name,
    }


async def _sync_from_provider(academy_id: str, row: dict[str, Any]) -> dict[str, Any]:
    provider = get_whatsapp_provider()
    instance_name = row["instance_name"]
    try:
        state = await provider.fetch_connection_state(instance_name)
    except EvolutionApiError:
        return row
    mapped_status, connected = provider.map_connection_state(state)
    updates: dict[str, Any] = {"status": mapped_status}
    if connected:
        updates["qr_code"] = None
        phone = await provider.fetch_profile_phone(instance_name)
        if phone:
            updates["phone"] = phone
    elif mapped_status == STATUS_DISCONNECTED:
        updates["qr_code"] = None
    updated = await update_whatsapp_instance(academy_id, row["id"], updates)
    return updated or row


async def _ensure_webhook_registered(instance_name: str) -> None:
    settings = get_settings()
    provider = get_whatsapp_provider()
    try:
        await provider.set_instance_webhook(instance_name, settings.whatsapp_webhook_url)
    except EvolutionApiError:
        pass


async def get_whatsapp_status(academy_id: str) -> dict[str, Any]:
    settings = get_settings()
    row = await fetch_whatsapp_instance_by_academy(academy_id)
    if not row:
        return _serialize_instance(None)
    if settings.evolution_configured:
        await _ensure_webhook_registered(row["instance_name"])
        row = await _sync_from_provider(academy_id, row)
    return _serialize_instance(row)


async def connect_whatsapp(academy_id: str) -> dict[str, Any]:
    settings = get_settings()
    provider = get_whatsapp_provider()
    if provider.name == "evolution" and not settings.evolution_configured:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Evolution API nao configurada no servidor.")
    instance_name = provider.build_instance_name(academy_id)
    row = await fetch_whatsapp_instance_by_academy(academy_id)
    if not row:
        try:
            await provider.create_instance(instance_name)
        except EvolutionApiError as exc:
            if exc.status_code not in {400, 409}:
                raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Erro ao criar instancia WhatsApp: {exc}") from exc
        row = await insert_whatsapp_instance(
            academy_id,
            {"instance_name": instance_name, "status": STATUS_WAITING_QR, "phone": None, "qr_code": None},
        )
    try:
        await provider.set_instance_webhook(instance_name, settings.whatsapp_webhook_url)
    except EvolutionApiError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Erro ao configurar webhook WhatsApp: {exc}",
        ) from exc
    try:
        connect_payload = await provider.connect_instance(instance_name)
    except EvolutionApiError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Erro ao gerar QR Code: {exc}") from exc
    qr_code = provider.extract_qr_base64(connect_payload)
    pairing_code = provider.extract_pairing_code(connect_payload) if hasattr(provider, "extract_pairing_code") else None
    row = await update_whatsapp_instance(
        academy_id,
        row["id"],
        {"instance_name": instance_name, "status": STATUS_WAITING_QR, "qr_code": qr_code},
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Falha ao salvar instancia.")
    result = _serialize_instance(row)
    if pairing_code:
        result["pairing_code"] = pairing_code
    return result


async def refresh_whatsapp_qr(academy_id: str) -> dict[str, Any]:
    provider = get_whatsapp_provider()
    row = await fetch_whatsapp_instance_by_academy(academy_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nenhuma instancia WhatsApp encontrada.")
    if row.get("status") == STATUS_CONNECTED:
        return _serialize_instance(row)
    try:
        connect_payload = await provider.connect_instance(row["instance_name"])
    except EvolutionApiError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Erro ao atualizar QR Code: {exc}") from exc
    qr_code = provider.extract_qr_base64(connect_payload)
    pairing_code = provider.extract_pairing_code(connect_payload) if hasattr(provider, "extract_pairing_code") else None
    row = await update_whatsapp_instance(academy_id, row["id"], {"status": STATUS_WAITING_QR, "qr_code": qr_code})
    result = _serialize_instance(row)
    if pairing_code:
        result["pairing_code"] = pairing_code
    return result


async def disconnect_whatsapp(academy_id: str) -> dict[str, Any]:
    provider = get_whatsapp_provider()
    row = await fetch_whatsapp_instance_by_academy(academy_id)
    if not row:
        return _serialize_instance(None)
    if get_settings().evolution_configured:
        try:
            await provider.logout_instance(row["instance_name"])
        except EvolutionApiError:
            pass
    row = await update_whatsapp_instance(
        academy_id,
        row["id"],
        {"status": STATUS_DISCONNECTED, "qr_code": None, "phone": None},
    )
    return _serialize_instance(row)


async def handle_whatsapp_webhook(payload: dict[str, Any]) -> None:
    provider = get_whatsapp_provider()
    event = provider.parse_webhook_event(payload)
    if event is None:
        return
    instance_name = getattr(event, "instance_name", None)
    if not instance_name:
        return
    row = await fetch_whatsapp_instance_by_name(str(instance_name))
    if not row:
        return
    academy_id = row["academy_id"]
    if isinstance(event, ConnectionUpdate):
        mapped_status, connected = provider.map_connection_state(event.state)
        updates: dict[str, Any] = {"status": mapped_status}
        if connected:
            updates["qr_code"] = None
            phone = await provider.fetch_profile_phone(str(instance_name))
            if phone:
                updates["phone"] = phone
        elif mapped_status == STATUS_DISCONNECTED:
            updates["qr_code"] = None
            updates["phone"] = None
        await update_whatsapp_instance(academy_id, row["id"], updates)
        return
    if isinstance(event, QrCodeUpdate) and event.qr_base64:
        await update_whatsapp_instance(
            academy_id,
            row["id"],
            {"status": STATUS_WAITING_QR, "qr_code": event.qr_base64},
        )
        return
    if isinstance(event, InboundMessage):
        await handle_inbound_message(academy_id, event)

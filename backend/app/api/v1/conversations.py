from typing import Annotated, Any

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status

from app.core.tenant import TenantContext, get_tenant
from app.models.schemas import ConversationOut, MessageOut, SendConversationMessage
from app.services.phone_utils import normalize_phone
from app.services.supabase_rest import (
    fetch_conversation,
    fetch_whatsapp_instance_by_academy,
    insert_message,
    list_conversations,
    list_messages,
    update_conversation,
)
from app.services.whatsapp.factory import get_whatsapp_provider

router = APIRouter(prefix="/conversations", tags=["conversations"])


async def _dispatch_whatsapp_text(
    *,
    instance_name: str,
    phone: str,
    text: str,
    whatsapp_jid: str | None,
) -> None:
    provider = get_whatsapp_provider()
    try:
        await provider.send_text(instance_name, phone, text, whatsapp_jid=whatsapp_jid)
    except Exception:
        pass


async def _dispatch_agent_whatsapp(
    academy_id: str,
    conversation: dict[str, Any],
    text: str,
) -> None:
    instance = await fetch_whatsapp_instance_by_academy(academy_id)
    if not instance or instance.get("status") != "conectado":
        return
    phone = normalize_phone(conversation.get("phone"))
    await _dispatch_whatsapp_text(
        instance_name=instance["instance_name"],
        phone=phone,
        text=text,
        whatsapp_jid=conversation.get("whatsapp_jid"),
    )


async def _touch_conversation(academy_id: str, conversation_id: str) -> None:
    await update_conversation(academy_id, conversation_id, {"last_message_at": "now()"})


@router.get("", response_model=list[ConversationOut])
async def list_conversations_route(tenant: Annotated[TenantContext, Depends(get_tenant)]) -> list[ConversationOut]:
    rows = await list_conversations(tenant.academy_id)
    return [ConversationOut(**row) for row in rows]


@router.get("/{conversation_id}", response_model=ConversationOut)
async def get_conversation_route(
    conversation_id: str,
    tenant: Annotated[TenantContext, Depends(get_tenant)],
) -> ConversationOut:
    row = await fetch_conversation(tenant.academy_id, conversation_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversa nao encontrada.")
    return ConversationOut(**row)


@router.get("/{conversation_id}/messages", response_model=list[MessageOut])
async def list_messages_route(
    conversation_id: str,
    tenant: Annotated[TenantContext, Depends(get_tenant)],
) -> list[MessageOut]:
    messages = await list_messages(tenant.academy_id, conversation_id)
    return [MessageOut(**m) for m in messages]


@router.post("/{conversation_id}/takeover", response_model=ConversationOut)
async def takeover_route(
    conversation_id: str,
    tenant: Annotated[TenantContext, Depends(get_tenant)],
) -> ConversationOut:
    row = await update_conversation(tenant.academy_id, conversation_id, {"mode": "human"})
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversa nao encontrada.")
    return ConversationOut(**row)


@router.post("/{conversation_id}/release", response_model=ConversationOut)
async def release_route(
    conversation_id: str,
    tenant: Annotated[TenantContext, Depends(get_tenant)],
) -> ConversationOut:
    row = await update_conversation(tenant.academy_id, conversation_id, {"mode": "ai"})
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversa nao encontrada.")
    return ConversationOut(**row)


@router.post("/{conversation_id}/messages", response_model=MessageOut)
async def send_message_route(
    conversation_id: str,
    body: SendConversationMessage,
    background_tasks: BackgroundTasks,
    tenant: Annotated[TenantContext, Depends(get_tenant)],
) -> MessageOut:
    conversation = await fetch_conversation(tenant.academy_id, conversation_id)
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversa nao encontrada.")
    text = body.body.strip()
    if not text:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Mensagem vazia.")
    message = await insert_message(
        tenant.academy_id,
        conversation_id=conversation_id,
        direction="outbound",
        sender_type="agent",
        body=text,
    )
    background_tasks.add_task(_touch_conversation, tenant.academy_id, conversation_id)
    background_tasks.add_task(_dispatch_agent_whatsapp, tenant.academy_id, conversation, text)
    return MessageOut(**message)

from __future__ import annotations

from app.services.ai_agent_router import route_agent_type
from app.services.ai_service import get_llm_provider
from app.services.phone_utils import normalize_phone
from app.services.supabase_rest import (
    fetch_academy_profile,
    fetch_ai_agent_profile,
    fetch_lead_by_phone,
    fetch_student_by_phone,
    find_open_campaign_send_for_lead,
    get_or_create_conversation,
    inbound_message_exists,
    insert_message,
    list_ai_agent_profiles,
    mark_campaign_send_replied,
    seed_ai_agent_profiles,
    should_send_session_auto_reply,
    update_conversation,
    update_lead_fields,
)
from app.services.whatsapp.factory import get_whatsapp_provider
from app.services.whatsapp.provider import InboundMessage

WELCOME_REPLY = 'Recebemos sua mensagem. Em breve um consultor respondera.'
AUTO_REPLY_INACTIVITY_HOURS = 1


async def handle_inbound_message(academy_id: str, inbound: InboundMessage) -> None:
    if inbound.message_id and await inbound_message_exists(academy_id, inbound.message_id):
        return

    phone = normalize_phone(inbound.phone)
    lead = await fetch_lead_by_phone(academy_id, phone)
    student = await fetch_student_by_phone(academy_id, phone)

    if lead and await find_open_campaign_send_for_lead(academy_id, lead['id']):
        await mark_campaign_send_replied(academy_id, lead['id'])

    agent_type = route_agent_type(lead_stage=lead.get('stage') if lead else None, is_student=bool(student))
    conversation = await get_or_create_conversation(
        academy_id,
        phone=phone,
        lead_id=lead['id'] if lead else None,
        agent_type=agent_type,
        whatsapp_jid=inbound.remote_jid,
        contact_name=inbound.push_name,
    )

    await insert_message(
        academy_id,
        conversation_id=conversation['id'],
        direction='inbound',
        sender_type='lead',
        body=inbound.text,
        metadata={'message_id': inbound.message_id, 'push_name': inbound.push_name},
    )

    if conversation.get('mode') == 'human':
        await update_conversation(academy_id, conversation['id'], {'last_message_at': 'now()'})
        return

    if not await should_send_session_auto_reply(
        academy_id,
        conversation['id'],
        inactivity_hours=AUTO_REPLY_INACTIVITY_HOURS,
    ):
        await update_conversation(academy_id, conversation['id'], {'last_message_at': 'now()'})
        return

    profiles = await list_ai_agent_profiles(academy_id)
    if not profiles:
        profiles = await seed_ai_agent_profiles(academy_id)

    profile = next((p for p in profiles if p.get('agent_type') == agent_type and p.get('enabled')), None)
    if not profile:
        profile = await fetch_ai_agent_profile(academy_id, agent_type)

    llm = get_llm_provider()
    ai_enabled = bool(llm and profile and profile.get('enabled'))
    reply = WELCOME_REPLY

    if ai_enabled:
        academy_ctx = await fetch_academy_profile(academy_id)
        context_bits = []
        if academy_ctx:
            for key in ('description', 'modalities', 'plans', 'communication_tone'):
                val = academy_ctx.get(key)
                if val:
                    context_bits.append(f'{key}: {val}')
        system_prompt = profile.get('system_prompt') or ''
        if context_bits:
            system_prompt += '\n\nContexto da academia:\n' + '\n'.join(context_bits)
        try:
            reply = await llm.complete(system_prompt=system_prompt, user_message=inbound.text)
        except Exception:
            reply = WELCOME_REPLY

    if not reply.strip():
        await update_conversation(academy_id, conversation['id'], {'last_message_at': 'now()'})
        return

    await insert_message(
        academy_id,
        conversation_id=conversation['id'],
        direction='outbound',
        sender_type='ai',
        body=reply,
        metadata={'auto_reply': True},
    )
    await update_conversation(academy_id, conversation['id'], {'last_message_at': 'now()', 'agent_type': agent_type})

    provider = get_whatsapp_provider()
    try:
        await provider.send_text(
            inbound.instance_name,
            phone,
            reply,
            whatsapp_jid=inbound.remote_jid,
        )
    except Exception:
        pass

    if lead:
        await update_lead_fields(academy_id, lead['id'], {'stage': 'Contato Iniciado'})

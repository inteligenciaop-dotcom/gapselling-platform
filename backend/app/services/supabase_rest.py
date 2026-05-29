from typing import Any

import httpx

from app.core.config import get_settings


def _rest_headers() -> dict[str, str]:
    settings = get_settings()
    key = settings.supabase_service_role_key
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }


async def fetch_profile_by_user_id(user_id: str) -> dict[str, Any] | None:
    settings = get_settings()
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/profiles"
    params = {
        "user_id": f"eq.{user_id}",
        "select": "id,user_id,login_name,email,academy_id,created_at",
        "limit": "1",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, headers=_rest_headers(), params=params)
        response.raise_for_status()
        rows = response.json()

    if not rows:
        return None
    return rows[0]


async def fetch_academy_by_id(academy_id: str) -> dict[str, Any] | None:
    settings = get_settings()
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/academies"
    params = {
        "id": f"eq.{academy_id}",
        "select": "id,name,slug,logo_url,phone,address,website,instagram_url",
        "limit": "1",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, headers=_rest_headers(), params=params)
        response.raise_for_status()
        rows = response.json()

    if not rows:
        return None
    return rows[0]


def _parse_content_range_total(content_range: str | None) -> int:
    if not content_range or "/" not in content_range:
        return 0

    total = content_range.split("/", 1)[1]
    if total == "*":
        return 0

    try:
        return int(total)
    except ValueError:
        return 0


async def count_rows(table: str, filters: dict[str, str]) -> int:
    settings = get_settings()
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/{table}"
    params = {
        "select": "id",
        **filters,
    }
    headers = {
        **_rest_headers(),
        "Prefer": "count=exact",
        "Range": "0-0",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, headers=headers, params=params)
        response.raise_for_status()

    return _parse_content_range_total(response.headers.get("content-range"))


async def fetch_recent_leads(academy_id: str, limit: int = 8) -> list[dict[str, Any]]:
    settings = get_settings()
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/leads"
    params = {
        "academy_id": f"eq.{academy_id}",
        "select": "id,name,stage,tag,created_at",
        "order": "created_at.desc",
        "limit": str(limit),
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, headers=_rest_headers(), params=params)
        response.raise_for_status()
        rows = response.json()

    if not isinstance(rows, list):
        return []
    return rows


CAMPAIGN_COLUMNS = "id,academy_id,name,description,tag,ai_prompt,active,mode,opening_message,follow_up_interval_hours,max_attempts,created_at"


def _representation_headers() -> dict[str, str]:
    return {
        **_rest_headers(),
        "Prefer": "return=representation",
    }


async def list_campaigns(academy_id: str) -> list[dict[str, Any]]:
    settings = get_settings()
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/campaigns"
    params = {
        "academy_id": f"eq.{academy_id}",
        "select": CAMPAIGN_COLUMNS,
        "order": "created_at.desc",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, headers=_rest_headers(), params=params)
        response.raise_for_status()
        rows = response.json()

    if not isinstance(rows, list):
        return []
    return rows


async def fetch_campaign(academy_id: str, campaign_id: str) -> dict[str, Any] | None:
    settings = get_settings()
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/campaigns"
    params = {
        "id": f"eq.{campaign_id}",
        "academy_id": f"eq.{academy_id}",
        "select": CAMPAIGN_COLUMNS,
        "limit": "1",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, headers=_rest_headers(), params=params)
        response.raise_for_status()
        rows = response.json()

    if not rows:
        return None
    return rows[0]


async def insert_campaign(academy_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    settings = get_settings()
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/campaigns"
    body = {
        "academy_id": academy_id,
        **payload,
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(url, headers=_representation_headers(), json=body)
        response.raise_for_status()
        rows = response.json()

    if not rows:
        raise ValueError("Campanha não retornada após insert")
    return rows[0]


async def update_campaign(
    academy_id: str,
    campaign_id: str,
    payload: dict[str, Any],
) -> dict[str, Any] | None:
    settings = get_settings()
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/campaigns"
    params = {
        "id": f"eq.{campaign_id}",
        "academy_id": f"eq.{academy_id}",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.patch(
            url,
            headers=_representation_headers(),
            params=params,
            json=payload,
        )
        response.raise_for_status()
        rows = response.json()

    if not rows:
        return None
    return rows[0]


async def fetch_lead_tags(academy_id: str) -> list[str]:
    settings = get_settings()
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/leads"
    params = {
        "academy_id": f"eq.{academy_id}",
        "select": "tag",
        "tag": "not.is.null",
        "limit": "1000",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, headers=_rest_headers(), params=params)
        response.raise_for_status()
        rows = response.json()

    if not isinstance(rows, list):
        return []

    tags: set[str] = set()
    for row in rows:
        tag = (row.get("tag") or "").strip()
        if tag:
            tags.add(tag)

    return sorted(tags, key=str.casefold)


WHATSAPP_COLUMNS = "id,academy_id,instance_name,phone,status,qr_code,created_at"


async def fetch_whatsapp_instance_by_academy(academy_id: str) -> dict[str, Any] | None:
    settings = get_settings()
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/whatsapp_instances"
    params = {
        "academy_id": f"eq.{academy_id}",
        "select": WHATSAPP_COLUMNS,
        "order": "created_at.desc",
        "limit": "1",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, headers=_rest_headers(), params=params)
        response.raise_for_status()
        rows = response.json()

    if not rows:
        return None
    return rows[0]


async def fetch_whatsapp_instance_by_name(instance_name: str) -> dict[str, Any] | None:
    settings = get_settings()
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/whatsapp_instances"
    params = {
        "instance_name": f"eq.{instance_name}",
        "select": WHATSAPP_COLUMNS,
        "limit": "1",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, headers=_rest_headers(), params=params)
        response.raise_for_status()
        rows = response.json()

    if not rows:
        return None
    return rows[0]


async def insert_whatsapp_instance(academy_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    settings = get_settings()
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/whatsapp_instances"
    body = {
        "academy_id": academy_id,
        **payload,
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(url, headers=_representation_headers(), json=body)
        response.raise_for_status()
        rows = response.json()

    if not rows:
        raise ValueError("Instância WhatsApp não retornada após insert")
    return rows[0]


async def update_whatsapp_instance(
    academy_id: str,
    instance_id: str,
    payload: dict[str, Any],
) -> dict[str, Any] | None:
    settings = get_settings()
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/whatsapp_instances"
    params = {
        "id": f"eq.{instance_id}",
        "academy_id": f"eq.{academy_id}",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.patch(
            url,
            headers=_representation_headers(),
            params=params,
            json=payload,
        )
        response.raise_for_status()
        rows = response.json()

    if not rows:
        return None
    return rows[0]


async def delete_whatsapp_instance(academy_id: str, instance_id: str) -> None:
    settings = get_settings()
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/whatsapp_instances"
    params = {
        "id": f"eq.{instance_id}",
        "academy_id": f"eq.{academy_id}",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.delete(url, headers=_rest_headers(), params=params)
        response.raise_for_status()

LEAD_DETAIL_COLUMNS = "id,academy_id,name,phone,email,status,stage,source,tag,campaign_id,whatsapp_opt_in,whatsapp_opt_in_at,created_at"
CONVERSATION_COLUMNS = "id,academy_id,lead_id,phone,whatsapp_jid,contact_name,agent_type,mode,campaign_id,last_message_at,created_at,updated_at"
MESSAGE_COLUMNS = "id,academy_id,conversation_id,direction,sender_type,body,metadata,created_at"
STUDENT_COLUMNS = "id,academy_id,lead_id,name,phone,plan,modalities,enrolled_at,created_at"
AI_AGENT_COLUMNS = "id,academy_id,agent_type,display_name,system_prompt,enabled,created_at,updated_at"
CAMPAIGN_SEND_COLUMNS = "id,academy_id,campaign_id,lead_id,status,attempt,scheduled_at,sent_at,last_error,created_at"


async def fetch_lead_by_phone(academy_id: str, phone: str) -> dict[str, Any] | None:
    normalized = phone.strip()
    if not normalized:
        return None
    settings = get_settings()
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/leads"
    params = {
        "academy_id": f"eq.{academy_id}",
        "phone": f"eq.{normalized}",
        "select": LEAD_DETAIL_COLUMNS,
        "limit": "1",
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, headers=_rest_headers(), params=params)
        response.raise_for_status()
        rows = response.json()
    if rows:
        return rows[0]
    suffix = normalized[-8:] if len(normalized) >= 8 else normalized
    params = {
        "academy_id": f"eq.{academy_id}",
        "phone": f"like.*{suffix}",
        "select": LEAD_DETAIL_COLUMNS,
        "limit": "1",
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, headers=_rest_headers(), params=params)
        response.raise_for_status()
        rows = response.json()
    return rows[0] if rows else None


async def fetch_leads_by_tag(academy_id: str, tag: str, *, opt_in_only: bool = False) -> list[dict[str, Any]]:
    settings = get_settings()
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/leads"
    params: dict[str, str] = {
        "academy_id": f"eq.{academy_id}",
        "tag": f"eq.{tag}",
        "select": LEAD_DETAIL_COLUMNS,
        "limit": "5000",
    }
    if opt_in_only:
        params["whatsapp_opt_in"] = "eq.true"
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(url, headers=_rest_headers(), params=params)
        response.raise_for_status()
        rows = response.json()
    return rows if isinstance(rows, list) else []


async def update_lead_fields(academy_id: str, lead_id: str, payload: dict[str, Any]) -> dict[str, Any] | None:
    settings = get_settings()
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/leads"
    params = {"id": f"eq.{lead_id}", "academy_id": f"eq.{academy_id}"}
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.patch(url, headers=_representation_headers(), params=params, json=payload)
        response.raise_for_status()
        rows = response.json()
    return rows[0] if rows else None


async def fetch_academy_profile(academy_id: str) -> dict[str, Any] | None:
    settings = get_settings()
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/academy_profiles"
    params = {"academy_id": f"eq.{academy_id}", "select": "*", "limit": "1"}
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, headers=_rest_headers(), params=params)
        response.raise_for_status()
        rows = response.json()
    return rows[0] if rows else None


async def list_ai_agent_profiles(academy_id: str) -> list[dict[str, Any]]:
    settings = get_settings()
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/ai_agent_profiles"
    params = {"academy_id": f"eq.{academy_id}", "select": AI_AGENT_COLUMNS, "order": "agent_type.asc"}
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, headers=_rest_headers(), params=params)
        response.raise_for_status()
        rows = response.json()
    return rows if isinstance(rows, list) else []


async def fetch_ai_agent_profile(academy_id: str, agent_type: str) -> dict[str, Any] | None:
    settings = get_settings()
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/ai_agent_profiles"
    params = {
        "academy_id": f"eq.{academy_id}",
        "agent_type": f"eq.{agent_type}",
        "select": AI_AGENT_COLUMNS,
        "limit": "1",
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, headers=_rest_headers(), params=params)
        response.raise_for_status()
        rows = response.json()
    return rows[0] if rows else None


async def seed_ai_agent_profiles(academy_id: str) -> list[dict[str, Any]]:
    from app.services.ai_agent_router import DEFAULT_PROFILES

    rows = []
    for item in DEFAULT_PROFILES:
        row = await upsert_ai_agent_profile(academy_id, item["agent_type"], item)
        if row:
            rows.append(row)
    return rows


async def upsert_ai_agent_profile(academy_id: str, agent_type: str, payload: dict[str, Any]) -> dict[str, Any] | None:
    existing = await fetch_ai_agent_profile(academy_id, agent_type)
    body = {
        "display_name": payload.get("display_name"),
        "system_prompt": payload.get("system_prompt"),
        "enabled": payload.get("enabled", True),
    }
    if existing:
        return await update_ai_agent_profile(academy_id, existing["id"], body)
    settings = get_settings()
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/ai_agent_profiles"
    insert_body = {"academy_id": academy_id, "agent_type": agent_type, **body}
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(url, headers=_representation_headers(), json=insert_body)
        response.raise_for_status()
        rows = response.json()
    return rows[0] if rows else None


async def update_ai_agent_profile(academy_id: str, profile_id: str, payload: dict[str, Any]) -> dict[str, Any] | None:
    settings = get_settings()
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/ai_agent_profiles"
    params = {"id": f"eq.{profile_id}", "academy_id": f"eq.{academy_id}"}
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.patch(url, headers=_representation_headers(), params=params, json=payload)
        response.raise_for_status()
        rows = response.json()
    return rows[0] if rows else None


async def list_students(academy_id: str) -> list[dict[str, Any]]:
    settings = get_settings()
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/students"
    params = {"academy_id": f"eq.{academy_id}", "select": STUDENT_COLUMNS, "order": "enrolled_at.desc"}
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, headers=_rest_headers(), params=params)
        response.raise_for_status()
        rows = response.json()
    return rows if isinstance(rows, list) else []


async def insert_student(academy_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    settings = get_settings()
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/students"
    body = {"academy_id": academy_id, **payload}
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(url, headers=_representation_headers(), json=body)
        response.raise_for_status()
        rows = response.json()
    return rows[0]


async def fetch_student_by_phone(academy_id: str, phone: str) -> dict[str, Any] | None:
    settings = get_settings()
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/students"
    params = {"academy_id": f"eq.{academy_id}", "phone": f"eq.{phone}", "select": STUDENT_COLUMNS, "limit": "1"}
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, headers=_rest_headers(), params=params)
        response.raise_for_status()
        rows = response.json()
    return rows[0] if rows else None


async def list_conversations(academy_id: str, limit: int = 50) -> list[dict[str, Any]]:
    settings = get_settings()
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/conversations"
    params = {
        "academy_id": f"eq.{academy_id}",
        "select": CONVERSATION_COLUMNS,
        "order": "last_message_at.desc.nullslast,created_at.desc",
        "limit": str(limit),
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, headers=_rest_headers(), params=params)
        response.raise_for_status()
        rows = response.json()
    return rows if isinstance(rows, list) else []


async def fetch_conversation(academy_id: str, conversation_id: str) -> dict[str, Any] | None:
    settings = get_settings()
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/conversations"
    params = {
        "id": f"eq.{conversation_id}",
        "academy_id": f"eq.{academy_id}",
        "select": CONVERSATION_COLUMNS,
        "limit": "1",
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, headers=_rest_headers(), params=params)
        response.raise_for_status()
        rows = response.json()
    return rows[0] if rows else None


def _conversation_sync_updates(
    row: dict[str, Any],
    *,
    phone: str,
    whatsapp_jid: str | None,
    contact_name: str | None,
    lead_id: str | None,
) -> dict[str, Any]:
    from app.services.phone_utils import is_lid_phone, is_valid_whatsapp_phone

    updates: dict[str, Any] = {}
    row_phone = row.get("phone") or ""
    if is_valid_whatsapp_phone(phone) and row_phone != phone:
        updates["phone"] = phone
    elif phone and row_phone != phone and not is_valid_whatsapp_phone(row_phone):
        updates["phone"] = phone
    if whatsapp_jid and row.get("whatsapp_jid") != whatsapp_jid:
        if is_valid_whatsapp_phone(phone) or is_lid_phone(phone) or not row.get("whatsapp_jid"):
            updates["whatsapp_jid"] = whatsapp_jid
    if contact_name and row.get("contact_name") != contact_name:
        updates["contact_name"] = contact_name
    if lead_id and not row.get("lead_id"):
        updates["lead_id"] = lead_id
    return updates


async def get_or_create_conversation(
    academy_id: str,
    *,
    phone: str,
    lead_id: str | None,
    agent_type: str,
    whatsapp_jid: str | None = None,
    contact_name: str | None = None,
) -> dict[str, Any]:
    from app.services.phone_utils import is_valid_whatsapp_phone

    settings = get_settings()
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/conversations"

    async def _fetch(params: dict[str, str]) -> list[dict[str, Any]]:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, headers=_rest_headers(), params=params)
            response.raise_for_status()
            return response.json()

    base_params = {
        "academy_id": f"eq.{academy_id}",
        "select": CONVERSATION_COLUMNS,
        "limit": "1",
        "order": "created_at.desc",
    }

    if is_valid_whatsapp_phone(phone):
        rows = await _fetch({**base_params, "phone": f"eq.{phone}"})
        if rows:
            row = rows[0]
            updates = _conversation_sync_updates(
                row, phone=phone, whatsapp_jid=whatsapp_jid, contact_name=contact_name, lead_id=lead_id
            )
            if updates:
                updated = await update_conversation(academy_id, row["id"], updates)
                return updated or row
            return row

    if whatsapp_jid:
        rows = await _fetch({**base_params, "whatsapp_jid": f"eq.{whatsapp_jid}"})
        if rows:
            row = rows[0]
            updates = _conversation_sync_updates(
                row, phone=phone, whatsapp_jid=whatsapp_jid, contact_name=contact_name, lead_id=lead_id
            )
            if updates:
                updated = await update_conversation(academy_id, row["id"], updates)
                return updated or row
            return row

    if is_valid_whatsapp_phone(phone) and contact_name:
        rows = await _fetch(
            {
                **base_params,
                "contact_name": f"eq.{contact_name}",
                "phone": "like.lid:*",
            }
        )
        if rows:
            row = rows[0]
            updates = _conversation_sync_updates(
                row, phone=phone, whatsapp_jid=whatsapp_jid, contact_name=contact_name, lead_id=lead_id
            )
            if updates:
                updated = await update_conversation(academy_id, row["id"], updates)
                return updated or row
            return row

    rows = await _fetch({**base_params, "phone": f"eq.{phone}"})
    if rows:
        row = rows[0]
        updates = _conversation_sync_updates(
            row, phone=phone, whatsapp_jid=whatsapp_jid, contact_name=contact_name, lead_id=lead_id
        )
        if updates:
            updated = await update_conversation(academy_id, row["id"], updates)
            return updated or row
        return row

    body = {
        "academy_id": academy_id,
        "phone": phone,
        "whatsapp_jid": whatsapp_jid,
        "contact_name": contact_name,
        "lead_id": lead_id,
        "agent_type": agent_type,
        "mode": "ai",
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(url, headers=_representation_headers(), json=body)
        response.raise_for_status()
        rows = response.json()
    return rows[0]


async def update_conversation(academy_id: str, conversation_id: str, payload: dict[str, Any]) -> dict[str, Any] | None:
    from datetime import datetime, timezone

    body = dict(payload)
    if body.get("last_message_at") == "now()":
        body["last_message_at"] = datetime.now(timezone.utc).isoformat()
    settings = get_settings()
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/conversations"
    params = {"id": f"eq.{conversation_id}", "academy_id": f"eq.{academy_id}"}
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.patch(url, headers=_representation_headers(), params=params, json=body)
        response.raise_for_status()
        rows = response.json()
    return rows[0] if rows else None


async def list_messages(academy_id: str, conversation_id: str, limit: int = 100) -> list[dict[str, Any]]:
    settings = get_settings()
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/messages"
    params = {
        "academy_id": f"eq.{academy_id}",
        "conversation_id": f"eq.{conversation_id}",
        "select": MESSAGE_COLUMNS,
        "order": "created_at.asc",
        "limit": str(limit),
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, headers=_rest_headers(), params=params)
        response.raise_for_status()
        rows = response.json()
    return rows if isinstance(rows, list) else []


async def inbound_message_exists(academy_id: str, whatsapp_message_id: str) -> bool:
    if not whatsapp_message_id:
        return False
    settings = get_settings()
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/messages"
    params = {
        "academy_id": f"eq.{academy_id}",
        "direction": "eq.inbound",
        "metadata->>message_id": f"eq.{whatsapp_message_id}",
        "select": "id",
        "limit": "1",
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, headers=_rest_headers(), params=params)
        response.raise_for_status()
        rows = response.json()
    return bool(rows)


async def should_send_session_auto_reply(
    academy_id: str,
    conversation_id: str,
    *,
    inactivity_hours: int = 1,
) -> bool:
    from datetime import datetime, timedelta, timezone

    settings = get_settings()
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/messages"
    params = {
        "academy_id": f"eq.{academy_id}",
        "conversation_id": f"eq.{conversation_id}",
        "direction": f"eq.outbound",
        "sender_type": f"eq.ai",
        "select": "created_at",
        "order": "created_at.desc",
        "limit": "1",
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, headers=_rest_headers(), params=params)
        response.raise_for_status()
        rows = response.json()
    if not rows:
        return True
    created_at = rows[0].get("created_at")
    if not created_at:
        return False
    try:
        last_sent = datetime.fromisoformat(str(created_at).replace("Z", "+00:00"))
    except ValueError:
        return False
    if last_sent.tzinfo is None:
        last_sent = last_sent.replace(tzinfo=timezone.utc)
    return datetime.now(timezone.utc) - last_sent >= timedelta(hours=inactivity_hours)


async def conversation_has_outbound_body(
    academy_id: str,
    conversation_id: str,
    body: str,
) -> bool:
    settings = get_settings()
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/messages"
    params = {
        "academy_id": f"eq.{academy_id}",
        "conversation_id": f"eq.{conversation_id}",
        "direction": "eq.outbound",
        "body": f"eq.{body}",
        "select": "id",
        "limit": "1",
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, headers=_rest_headers(), params=params)
        response.raise_for_status()
        rows = response.json()
    return bool(rows)


async def insert_message(
    academy_id: str,
    *,
    conversation_id: str,
    direction: str,
    sender_type: str,
    body: str,
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    settings = get_settings()
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/messages"
    payload = {
        "academy_id": academy_id,
        "conversation_id": conversation_id,
        "direction": direction,
        "sender_type": sender_type,
        "body": body,
        "metadata": metadata or {},
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(url, headers=_representation_headers(), json=payload)
        response.raise_for_status()
        rows = response.json()
    return rows[0]


async def bulk_insert_campaign_sends(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if not rows:
        return []
    settings = get_settings()
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/campaign_sends"
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(url, headers=_representation_headers(), json=rows)
        if response.status_code >= 400:
            return []
        data = response.json()
    return data if isinstance(data, list) else []


async def count_campaign_sends_by_status(academy_id: str, campaign_id: str, status: str) -> int:
    return await count_rows(
        "campaign_sends",
        {
            "academy_id": f"eq.{academy_id}",
            "campaign_id": f"eq.{campaign_id}",
            "status": f"eq.{status}",
        },
    )


async def fetch_pending_campaign_sends(limit: int = 30) -> list[dict[str, Any]]:
    settings = get_settings()
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/campaign_sends"
    params = {
        "status": "eq.pending",
        "scheduled_at": "lte.now()",
        "select": f"{CAMPAIGN_SEND_COLUMNS},leads(phone)",
        "order": "scheduled_at.asc",
        "limit": str(limit),
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(url, headers=_rest_headers(), params=params)
        response.raise_for_status()
        rows = response.json()
    result: list[dict[str, Any]] = []
    for row in rows if isinstance(rows, list) else []:
        lead = row.pop("leads", None) or {}
        phone = lead.get("phone") if isinstance(lead, dict) else None
        row["lead_phone"] = phone
        result.append(row)
    return result


async def update_campaign_send(send_id: str, payload: dict[str, Any]) -> None:
    settings = get_settings()
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/campaign_sends"
    params = {"id": f"eq.{send_id}"}
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.patch(url, headers=_rest_headers(), params=params, json=payload)
        response.raise_for_status()


async def find_open_campaign_send_for_lead(academy_id: str, lead_id: str) -> dict[str, Any] | None:
    settings = get_settings()
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/campaign_sends"
    params = {
        "academy_id": f"eq.{academy_id}",
        "lead_id": f"eq.{lead_id}",
        "status": "in.(pending,sent)",
        "select": CAMPAIGN_SEND_COLUMNS,
        "order": "created_at.desc",
        "limit": "1",
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, headers=_rest_headers(), params=params)
        response.raise_for_status()
        rows = response.json()
    return rows[0] if rows else None


async def mark_campaign_send_replied(academy_id: str, lead_id: str) -> None:
    settings = get_settings()
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/campaign_sends"
    params = {
        "academy_id": f"eq.{academy_id}",
        "lead_id": f"eq.{lead_id}",
        "status": "in.(pending,sent)",
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.patch(url, headers=_rest_headers(), params=params, json={"status": "replied"})
        response.raise_for_status()

async def fetch_lead(academy_id: str, lead_id: str) -> dict[str, Any] | None:
    settings = get_settings()
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/leads"
    params = {
        "id": f"eq.{lead_id}",
        "academy_id": f"eq.{academy_id}",
        "select": LEAD_DETAIL_COLUMNS,
        "limit": "1",
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, headers=_rest_headers(), params=params)
        response.raise_for_status()
        rows = response.json()
    return rows[0] if rows else None

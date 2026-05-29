from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import HTTPException, status

from app.core.config import get_settings
from app.services.phone_utils import normalize_phone
from app.services.supabase_rest import (
    bulk_insert_campaign_sends,
    count_campaign_sends_by_status,
    fetch_campaign,
    fetch_leads_by_tag,
    fetch_pending_campaign_sends,
    fetch_whatsapp_instance_by_academy,
    find_open_campaign_send_for_lead,
    update_campaign_send,
    update_lead_fields,
)
from app.services.whatsapp.factory import get_whatsapp_provider


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


async def activate_campaign(academy_id: str, campaign_id: str) -> dict[str, Any]:
    campaign = await fetch_campaign(academy_id, campaign_id)
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campanha nao encontrada.")
    if not campaign.get("opening_message"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Defina a mensagem de abertura antes de ativar.",
        )
    tag = (campaign.get("tag") or "").strip()
    if not tag:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Campanha sem tag de leads.")

    settings = get_settings()
    require_opt_in = settings.whatsapp_provider.lower().strip() == "meta"
    leads = await fetch_leads_by_tag(academy_id, tag, opt_in_only=require_opt_in)
    if not leads:
        detail = "Nenhum lead com opt-in WhatsApp para esta tag." if require_opt_in else "Nenhum lead encontrado para esta tag."
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)

    scheduled = _utcnow()
    rows = []
    skipped_no_phone = 0
    skipped_no_opt_in = 0
    for lead in leads:
        if not normalize_phone(lead.get("phone")):
            skipped_no_phone += 1
            continue
        if require_opt_in and not lead.get("whatsapp_opt_in"):
            skipped_no_opt_in += 1
            continue
        rows.append(
            {
                "academy_id": academy_id,
                "campaign_id": campaign_id,
                "lead_id": lead["id"],
                "status": "pending",
                "attempt": 1,
                "scheduled_at": scheduled.isoformat(),
            }
        )

    if not rows:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nenhum lead elegivel com telefone valido.",
        )

    inserted = await bulk_insert_campaign_sends(rows)
    return {
        "queued": len(inserted),
        "campaign_id": campaign_id,
        "skipped_no_phone": skipped_no_phone,
        "skipped_no_opt_in": skipped_no_opt_in,
    }


async def get_dispatch_status(academy_id: str, campaign_id: str) -> dict[str, Any]:
    campaign = await fetch_campaign(academy_id, campaign_id)
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campanha nao encontrada.")
    pending = await count_campaign_sends_by_status(academy_id, campaign_id, "pending")
    sent = await count_campaign_sends_by_status(academy_id, campaign_id, "sent")
    failed = await count_campaign_sends_by_status(academy_id, campaign_id, "failed")
    replied = await count_campaign_sends_by_status(academy_id, campaign_id, "replied")
    cancelled = await count_campaign_sends_by_status(academy_id, campaign_id, "cancelled")
    return {
        "campaign_id": campaign_id,
        "pending": pending,
        "sent": sent,
        "failed": failed,
        "replied": replied,
        "cancelled": cancelled,
        "lost": cancelled,
        "total": pending + sent + failed + replied + cancelled,
    }


async def _schedule_next_attempt(
    academy_id: str,
    campaign: dict[str, Any],
    lead_id: str,
    current_attempt: int,
) -> None:
    max_attempts = int(campaign.get("max_attempts") or 3)
    if current_attempt >= max_attempts:
        return
    interval_hours = int(campaign.get("follow_up_interval_hours") or 24)
    next_at = _utcnow() + timedelta(hours=interval_hours)
    await bulk_insert_campaign_sends(
        [
            {
                "academy_id": academy_id,
                "campaign_id": campaign["id"],
                "lead_id": lead_id,
                "status": "pending",
                "attempt": current_attempt + 1,
                "scheduled_at": next_at.isoformat(),
            }
        ]
    )


async def _mark_leads_lost_after_max_attempts() -> None:
    settings = get_settings()
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/campaign_sends"
    # handled via REST in process - keep lightweight: Perdido set when max attempt sent and interval elapsed
    from app.services.supabase_rest import _rest_headers
    import httpx

    params = {
        "status": "eq.sent",
        "select": "id,academy_id,campaign_id,lead_id,attempt,sent_at",
        "order": "sent_at.asc",
        "limit": "200",
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(url, headers=_rest_headers(), params=params)
        response.raise_for_status()
        rows = response.json()

    for row in rows if isinstance(rows, list) else []:
        campaign = await fetch_campaign(row["academy_id"], row["campaign_id"])
        if not campaign:
            continue
        max_attempts = int(campaign.get("max_attempts") or 3)
        if int(row.get("attempt") or 0) < max_attempts:
            continue
        sent_at_raw = row.get("sent_at")
        if not sent_at_raw:
            continue
        sent_at = datetime.fromisoformat(str(sent_at_raw).replace("Z", "+00:00"))
        interval_hours = int(campaign.get("follow_up_interval_hours") or 24)
        if _utcnow() < sent_at + timedelta(hours=interval_hours):
            continue
        open_send = await find_open_campaign_send_for_lead(row["academy_id"], row["lead_id"])
        if open_send and open_send.get("status") == "replied":
            continue
        await update_lead_fields(row["academy_id"], row["lead_id"], {"stage": "Perdido"})
        await update_campaign_send(row["id"], {"status": "cancelled"})


async def process_pending_sends() -> None:
    settings = get_settings()
    rate = max(1, settings.campaign_send_rate_per_minute)
    pending_rows = await fetch_pending_campaign_sends(limit=rate)
    provider = get_whatsapp_provider()

    for row in pending_rows:
        academy_id = row["academy_id"]
        campaign = await fetch_campaign(academy_id, row["campaign_id"])
        instance = await fetch_whatsapp_instance_by_academy(academy_id)
        if not campaign or not instance or instance.get("status") != "conectado":
            await update_campaign_send(
                row["id"],
                {"status": "failed", "last_error": "WhatsApp desconectado ou campanha invalida."},
            )
            continue

        lead_phone = normalize_phone(row.get("lead_phone"))
        opening = (campaign.get("opening_message") or "").strip()
        if not lead_phone or not opening:
            await update_campaign_send(row["id"], {"status": "failed", "last_error": "Telefone ou mensagem invalidos."})
            continue

        try:
            await provider.send_text(instance["instance_name"], lead_phone, opening)
            await update_campaign_send(
                row["id"],
                {"status": "sent", "sent_at": _utcnow().isoformat(), "last_error": None},
            )
            await _schedule_next_attempt(academy_id, campaign, row["lead_id"], int(row.get("attempt") or 1))
        except Exception as exc:
            await update_campaign_send(row["id"], {"status": "failed", "last_error": str(exc)[:500]})

    await _mark_leads_lost_after_max_attempts()

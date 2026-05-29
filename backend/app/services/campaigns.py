from typing import Any

from fastapi import HTTPException, status

from app.services.supabase_rest import (
    count_rows,
    fetch_campaign,
    fetch_lead_tags,
    insert_campaign,
    list_campaigns,
    update_campaign,
)


def _normalize_text(value: str | None) -> str | None:
    if value is None:
        return None
    trimmed = value.strip()
    return trimmed or None


def _validate_campaign_fields(name: str | None, tag: str | None) -> None:
    if name is not None and not name.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="O nome da campanha é obrigatório.",
        )

    if tag is not None and not tag.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A tag alvo é obrigatória.",
        )


async def _lead_count_for_tag(academy_id: str, tag: str | None) -> int:
    normalized = _normalize_text(tag)
    if not normalized:
        return 0

    return await count_rows(
        "leads",
        {
            "academy_id": f"eq.{academy_id}",
            "tag": f"eq.{normalized}",
        },
    )


async def _serialize_campaign(academy_id: str, row: dict[str, Any]) -> dict[str, Any]:
    tag = row.get("tag")
    lead_count = await _lead_count_for_tag(academy_id, tag)

    return {
        "id": row["id"],
        "academy_id": row["academy_id"],
        "name": row.get("name") or "",
        "description": row.get("description"),
        "tag": tag,
        "ai_prompt": row.get("ai_prompt"),
        "active": bool(row.get("active")),
        "mode": row.get("mode") or "broadcast",
        "opening_message": row.get("opening_message"),
        "follow_up_interval_hours": row.get("follow_up_interval_hours") or 24,
        "max_attempts": row.get("max_attempts") or 3,
        "created_at": row.get("created_at"),
        "lead_count": lead_count,
    }


async def get_campaigns(academy_id: str) -> list[dict[str, Any]]:
    rows = await list_campaigns(academy_id)
    return [await _serialize_campaign(academy_id, row) for row in rows]


async def get_campaign(academy_id: str, campaign_id: str) -> dict[str, Any]:
    row = await fetch_campaign(academy_id, campaign_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campanha não encontrada.")
    return await _serialize_campaign(academy_id, row)


async def get_lead_tags(academy_id: str) -> list[str]:
    return await fetch_lead_tags(academy_id)


async def create_campaign(
    academy_id: str,
    *,
    name: str,
    tag: str,
    description: str | None = None,
    ai_prompt: str | None = None,
    active: bool = False,
    mode: str | None = "broadcast",
    opening_message: str | None = None,
    follow_up_interval_hours: int | None = 24,
    max_attempts: int | None = 3,
) -> dict[str, Any]:
    normalized_name = _normalize_text(name)
    normalized_tag = _normalize_text(tag)
    _validate_campaign_fields(normalized_name, normalized_tag)

    row = await insert_campaign(
        academy_id,
        {
            "name": normalized_name,
            "tag": normalized_tag,
            "description": _normalize_text(description),
            "ai_prompt": _normalize_text(ai_prompt),
            "active": active,
            "mode": mode or "broadcast",
            "opening_message": _normalize_text(opening_message),
            "follow_up_interval_hours": follow_up_interval_hours or 24,
            "max_attempts": max_attempts or 3,
        },
    )
    return await _serialize_campaign(academy_id, row)


async def patch_campaign(
    academy_id: str,
    campaign_id: str,
    *,
    name: str | None = None,
    description: str | None = None,
    tag: str | None = None,
    ai_prompt: str | None = None,
    mode: str | None = None,
    opening_message: str | None = None,
    follow_up_interval_hours: int | None = None,
    max_attempts: int | None = None,
) -> dict[str, Any]:
    payload: dict[str, Any] = {}

    if name is not None:
        normalized_name = _normalize_text(name)
        _validate_campaign_fields(normalized_name, None)
        payload["name"] = normalized_name

    if description is not None:
        payload["description"] = _normalize_text(description)

    if tag is not None:
        normalized_tag = _normalize_text(tag)
        _validate_campaign_fields(None, normalized_tag)
        payload["tag"] = normalized_tag

    if ai_prompt is not None:
        payload["ai_prompt"] = _normalize_text(ai_prompt)

    if mode is not None:
        payload["mode"] = _normalize_text(mode) or "broadcast"

    if opening_message is not None:
        payload["opening_message"] = _normalize_text(opening_message)

    if follow_up_interval_hours is not None:
        payload["follow_up_interval_hours"] = follow_up_interval_hours

    if max_attempts is not None:
        payload["max_attempts"] = max_attempts

    if not payload:
        return await get_campaign(academy_id, campaign_id)

    row = await update_campaign(academy_id, campaign_id, payload)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campanha não encontrada.")

    return await _serialize_campaign(academy_id, row)


async def set_campaign_active(
    academy_id: str,
    campaign_id: str,
    *,
    active: bool,
) -> dict[str, Any]:
    row = await update_campaign(academy_id, campaign_id, {"active": active})
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campanha não encontrada.")

    return await _serialize_campaign(academy_id, row)

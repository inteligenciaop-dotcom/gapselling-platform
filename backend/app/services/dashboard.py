from datetime import UTC, datetime
from typing import Any

from app.services.supabase_rest import count_rows, fetch_recent_leads
from app.services.whatsapp_instances import get_whatsapp_status


def _start_of_today_utc_iso() -> str:
    now = datetime.now(UTC)
    start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    return start.isoformat()


def _format_lead_date(iso_date: str | None) -> str:
    if not iso_date:
        return "—"

    try:
        normalized = iso_date.replace("Z", "+00:00")
        if "T" in normalized and "+" not in normalized and not normalized.endswith("Z"):
            normalized = f"{normalized}+00:00"

        parsed = datetime.fromisoformat(normalized)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=UTC)
        else:
            parsed = parsed.astimezone(UTC)
    except ValueError:
        return "—"

    return parsed.astimezone(UTC).strftime("%d/%m, %H:%M")


async def fetch_dashboard_summary(academy_id: str) -> dict[str, Any]:
    today_start = _start_of_today_utc_iso()

    leads_today, conversions, active_campaigns, total_leads, recent_rows = await _gather_metrics(
        academy_id,
        today_start,
    )

    recent_leads = [
        {
            "id": row["id"],
            "name": row.get("name") or "",
            "stage": row.get("stage"),
            "tag": row.get("tag"),
            "created_at": row.get("created_at"),
            "created_at_label": _format_lead_date(row.get("created_at")),
        }
        for row in recent_rows
    ]

    whatsapp = await get_whatsapp_status(academy_id)

    return {
        "leads_today": leads_today,
        "conversions": conversions,
        "active_campaigns": active_campaigns,
        "total_leads": total_leads,
        "recent_leads": recent_leads,
        "ai_active": False,
        "whatsapp_connected": whatsapp.get("connected", False),
        "whatsapp_status": whatsapp.get("status", "desconectado"),
        "whatsapp_phone": whatsapp.get("phone"),
    }


async def _gather_metrics(academy_id: str, today_start: str) -> tuple[int, int, int, int, list[dict[str, Any]]]:
    leads_today = await count_rows(
        "leads",
        {
            "academy_id": f"eq.{academy_id}",
            "created_at": f"gte.{today_start}",
        },
    )
    conversions = await count_rows(
        "leads",
        {
            "academy_id": f"eq.{academy_id}",
            "stage": "eq.Fechado",
        },
    )
    active_campaigns = await count_rows(
        "campaigns",
        {
            "academy_id": f"eq.{academy_id}",
            "active": "eq.true",
        },
    )
    total_leads = await count_rows(
        "leads",
        {"academy_id": f"eq.{academy_id}"},
    )
    recent_rows = await fetch_recent_leads(academy_id, limit=8)

    return leads_today, conversions, active_campaigns, total_leads, recent_rows

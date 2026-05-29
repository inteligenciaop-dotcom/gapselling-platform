from typing import Annotated, Any

from fastapi import APIRouter, Header, HTTPException, Request, status

from app.core.config import get_settings
from app.services.whatsapp_instances import handle_whatsapp_webhook

router = APIRouter()


@router.post("/whatsapp/inbound")
async def whatsapp_inbound_webhook(
    request: Request,
    x_webhook_secret: Annotated[str | None, Header(alias="X-Webhook-Secret")] = None,
) -> dict[str, str]:
    settings = get_settings()

    if settings.whatsapp_webhook_secret:
        if x_webhook_secret != settings.whatsapp_webhook_secret:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Webhook não autorizado")

    try:
        payload: dict[str, Any] = await request.json()
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="JSON inválido") from exc

    await handle_whatsapp_webhook(payload)
    return {"status": "ok"}

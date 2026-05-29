from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.tenant import TenantContext, get_tenant
from app.models.schemas import WhatsAppStatusResponse
from app.services.whatsapp_instances import (
    connect_whatsapp,
    disconnect_whatsapp,
    get_whatsapp_status,
    refresh_whatsapp_qr,
)

router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])


@router.get("/status", response_model=WhatsAppStatusResponse)
async def whatsapp_status(
    tenant: Annotated[TenantContext, Depends(get_tenant)],
) -> WhatsAppStatusResponse:
    data = await get_whatsapp_status(tenant.academy_id)
    return WhatsAppStatusResponse(**data)


@router.post("/connect", response_model=WhatsAppStatusResponse)
async def whatsapp_connect(
    tenant: Annotated[TenantContext, Depends(get_tenant)],
) -> WhatsAppStatusResponse:
    data = await connect_whatsapp(tenant.academy_id)
    return WhatsAppStatusResponse(**data)


@router.post("/qr/refresh", response_model=WhatsAppStatusResponse)
async def whatsapp_refresh_qr(
    tenant: Annotated[TenantContext, Depends(get_tenant)],
) -> WhatsAppStatusResponse:
    data = await refresh_whatsapp_qr(tenant.academy_id)
    return WhatsAppStatusResponse(**data)


@router.post("/disconnect", response_model=WhatsAppStatusResponse)
async def whatsapp_disconnect(
    tenant: Annotated[TenantContext, Depends(get_tenant)],
) -> WhatsAppStatusResponse:
    data = await disconnect_whatsapp(tenant.academy_id)
    return WhatsAppStatusResponse(**data)

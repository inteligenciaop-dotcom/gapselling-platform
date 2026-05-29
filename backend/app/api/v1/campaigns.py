from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.tenant import TenantContext, get_tenant
from app.models.schemas import (
    CampaignActivateResponse,
    CampaignCreate,
    CampaignDispatchStatus,
    CampaignOut,
    CampaignStatusUpdate,
    CampaignUpdate,
    LeadTagsResponse,
)
from app.services.campaign_dispatch import activate_campaign, get_dispatch_status
from app.services.campaigns import (
    create_campaign,
    get_campaign,
    get_campaigns,
    get_lead_tags,
    patch_campaign,
    set_campaign_active,
)

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


@router.get("", response_model=list[CampaignOut])
async def list_campaigns(
    tenant: Annotated[TenantContext, Depends(get_tenant)],
) -> list[CampaignOut]:
    rows = await get_campaigns(tenant.academy_id)
    return [CampaignOut(**row) for row in rows]


@router.get("/meta/lead-tags", response_model=LeadTagsResponse)
async def list_lead_tags(
    tenant: Annotated[TenantContext, Depends(get_tenant)],
) -> LeadTagsResponse:
    tags = await get_lead_tags(tenant.academy_id)
    return LeadTagsResponse(tags=tags)


@router.get("/{campaign_id}", response_model=CampaignOut)
async def get_campaign_by_id(
    campaign_id: str,
    tenant: Annotated[TenantContext, Depends(get_tenant)],
) -> CampaignOut:
    row = await get_campaign(tenant.academy_id, campaign_id)
    return CampaignOut(**row)


@router.post("", response_model=CampaignOut, status_code=201)
async def create_campaign_route(
    body: CampaignCreate,
    tenant: Annotated[TenantContext, Depends(get_tenant)],
) -> CampaignOut:
    row = await create_campaign(
        tenant.academy_id,
        name=body.name,
        tag=body.tag,
        description=body.description,
        ai_prompt=body.ai_prompt,
        active=body.active,
        mode=body.mode,
        opening_message=body.opening_message,
        follow_up_interval_hours=body.follow_up_interval_hours,
        max_attempts=body.max_attempts,
    )
    return CampaignOut(**row)


@router.patch("/{campaign_id}", response_model=CampaignOut)
async def update_campaign_route(
    campaign_id: str,
    body: CampaignUpdate,
    tenant: Annotated[TenantContext, Depends(get_tenant)],
) -> CampaignOut:
    row = await patch_campaign(
        tenant.academy_id,
        campaign_id,
        name=body.name,
        description=body.description,
        tag=body.tag,
        ai_prompt=body.ai_prompt,
        mode=body.mode,
        opening_message=body.opening_message,
        follow_up_interval_hours=body.follow_up_interval_hours,
        max_attempts=body.max_attempts,
    )
    return CampaignOut(**row)


@router.patch("/{campaign_id}/status", response_model=CampaignOut)
async def update_campaign_status(
    campaign_id: str,
    body: CampaignStatusUpdate,
    tenant: Annotated[TenantContext, Depends(get_tenant)],
) -> CampaignOut:
    row = await set_campaign_active(
        tenant.academy_id,
        campaign_id,
        active=body.active,
    )
    return CampaignOut(**row)


@router.post("/{campaign_id}/activate", response_model=CampaignActivateResponse)
async def activate_campaign_route(
    campaign_id: str,
    tenant: Annotated[TenantContext, Depends(get_tenant)],
) -> CampaignActivateResponse:
    result = await activate_campaign(tenant.academy_id, campaign_id)
    return CampaignActivateResponse(**result)


@router.get("/{campaign_id}/dispatch-status", response_model=CampaignDispatchStatus)
async def dispatch_status_route(
    campaign_id: str,
    tenant: Annotated[TenantContext, Depends(get_tenant)],
) -> CampaignDispatchStatus:
    result = await get_dispatch_status(tenant.academy_id, campaign_id)
    return CampaignDispatchStatus(**result)

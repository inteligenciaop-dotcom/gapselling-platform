from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.tenant import TenantContext, get_tenant
from app.models.schemas import DashboardSummaryResponse
from app.services.dashboard import fetch_dashboard_summary

router = APIRouter()


@router.get("/dashboard/summary", response_model=DashboardSummaryResponse)
async def get_dashboard_summary(
    tenant: Annotated[TenantContext, Depends(get_tenant)],
) -> DashboardSummaryResponse:
    data = await fetch_dashboard_summary(tenant.academy_id)
    return DashboardSummaryResponse(**data)

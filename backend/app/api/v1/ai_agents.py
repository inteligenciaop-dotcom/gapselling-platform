from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.tenant import TenantContext, get_tenant
from app.models.schemas import AIAgentProfileOut, AIAgentProfileUpdate
from app.services.supabase_rest import list_ai_agent_profiles, seed_ai_agent_profiles, update_ai_agent_profile

router = APIRouter(prefix="/ai-agents", tags=["ai-agents"])


@router.get("", response_model=list[AIAgentProfileOut])
async def list_profiles(tenant: Annotated[TenantContext, Depends(get_tenant)]) -> list[AIAgentProfileOut]:
    rows = await list_ai_agent_profiles(tenant.academy_id)
    if not rows:
        rows = await seed_ai_agent_profiles(tenant.academy_id)
    return [AIAgentProfileOut(**row) for row in rows]


@router.post("/seed", response_model=list[AIAgentProfileOut])
async def seed_profiles(tenant: Annotated[TenantContext, Depends(get_tenant)]) -> list[AIAgentProfileOut]:
    rows = await seed_ai_agent_profiles(tenant.academy_id)
    return [AIAgentProfileOut(**row) for row in rows]


@router.patch("/{profile_id}", response_model=AIAgentProfileOut)
async def patch_profile(
    profile_id: str,
    body: AIAgentProfileUpdate,
    tenant: Annotated[TenantContext, Depends(get_tenant)],
) -> AIAgentProfileOut:
    payload = body.model_dump(exclude_unset=True)
    row = await update_ai_agent_profile(tenant.academy_id, profile_id, payload)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Perfil de agente nao encontrado.")
    return AIAgentProfileOut(**row)

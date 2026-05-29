from dataclasses import dataclass
from typing import Annotated, Any

from fastapi import Depends, HTTPException, status

from app.core.security import AuthUser, get_current_user
from app.services.supabase_rest import fetch_profile_by_user_id


@dataclass(frozen=True)
class TenantContext:
    user: AuthUser
    profile: dict[str, Any]
    academy_id: str


async def get_tenant(
    current_user: Annotated[AuthUser, Depends(get_current_user)],
) -> TenantContext:
    profile = await fetch_profile_by_user_id(current_user.id)

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Perfil não encontrado.",
        )

    academy_id = profile.get("academy_id")
    if not academy_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Academia não vinculada ao perfil.",
        )

    return TenantContext(
        user=current_user,
        profile=profile,
        academy_id=str(academy_id),
    )

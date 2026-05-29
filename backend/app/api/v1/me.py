from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.security import AuthUser, get_current_user
from app.models.schemas import MeResponse, UserOut
from app.services.supabase_rest import fetch_academy_by_id, fetch_profile_by_user_id

router = APIRouter()


@router.get("/me", response_model=MeResponse)
async def get_me(current_user: Annotated[AuthUser, Depends(get_current_user)]) -> MeResponse:
    profile = await fetch_profile_by_user_id(current_user.id)
    academy = None

    if profile and profile.get("academy_id"):
        academy = await fetch_academy_by_id(profile["academy_id"])

    return MeResponse(
        user=UserOut(
            id=current_user.id,
            email=current_user.email,
            role=current_user.role,
        ),
        profile=profile,
        academy=academy,
        tenant_ready=bool(profile and profile.get("academy_id")),
    )

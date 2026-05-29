from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.tenant import TenantContext, get_tenant
from app.models.schemas import StudentCreate, StudentOut
from app.services.phone_utils import normalize_phone
from app.services.supabase_rest import fetch_lead, insert_student, list_students, update_lead_fields

router = APIRouter(prefix="/students", tags=["students"])


@router.get("", response_model=list[StudentOut])
async def list_students_route(tenant: Annotated[TenantContext, Depends(get_tenant)]) -> list[StudentOut]:
    rows = await list_students(tenant.academy_id)
    return [StudentOut(**row) for row in rows]


@router.post("", response_model=StudentOut, status_code=201)
async def create_student_route(
    body: StudentCreate,
    tenant: Annotated[TenantContext, Depends(get_tenant)],
) -> StudentOut:
    name = body.name.strip()
    if not name:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Nome obrigatorio.")
    phone = normalize_phone(body.phone) if body.phone else None
    row = await insert_student(
        tenant.academy_id,
        {
            "name": name,
            "phone": phone or None,
            "plan": body.plan,
            "lead_id": body.lead_id,
            "modalities": body.modalities or [],
        },
    )
    if body.lead_id:
        await update_lead_fields(tenant.academy_id, body.lead_id, {"stage": "Matriculado"})
    return StudentOut(**row)


@router.post("/from-lead/{lead_id}", response_model=StudentOut, status_code=201)
async def create_from_lead(
    lead_id: str,
    tenant: Annotated[TenantContext, Depends(get_tenant)],
) -> StudentOut:
    lead = await fetch_lead(tenant.academy_id, lead_id)
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead nao encontrado.")
    row = await insert_student(
        tenant.academy_id,
        {
            "name": lead.get("name") or "Aluno",
            "phone": normalize_phone(lead.get("phone")) or None,
            "lead_id": lead_id,
            "plan": None,
            "modalities": [],
        },
    )
    await update_lead_fields(tenant.academy_id, lead_id, {"stage": "Matriculado"})
    return StudentOut(**row)

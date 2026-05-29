from typing import Any
from app.services.whatsapp.evolution import EvolutionApiError, get_evolution_provider

def build_instance_name(academy_id: str) -> str:
    return get_evolution_provider().build_instance_name(academy_id)

async def create_instance(instance_name: str) -> dict[str, Any]:
    return await get_evolution_provider().create_instance(instance_name)

async def connect_instance(instance_name: str) -> dict[str, Any]:
    return await get_evolution_provider().connect_instance(instance_name)

async def fetch_connection_state(instance_name: str) -> str:
    return await get_evolution_provider().fetch_connection_state(instance_name)

async def fetch_profile_phone(instance_name: str) -> str | None:
    return await get_evolution_provider().fetch_profile_phone(instance_name)

async def logout_instance(instance_name: str) -> None:
    await get_evolution_provider().logout_instance(instance_name)

async def delete_instance(instance_name: str) -> None:
    await get_evolution_provider().delete_instance(instance_name)

async def set_instance_webhook(instance_name: str, webhook_url: str) -> None:
    await get_evolution_provider().set_instance_webhook(instance_name, webhook_url)

def extract_qr_base64(connect_payload: dict[str, Any]) -> str | None:
    return get_evolution_provider().extract_qr_base64(connect_payload)

def map_evolution_state(state: str) -> tuple[str, bool]:
    return get_evolution_provider().map_connection_state(state)

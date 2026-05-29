from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    supabase_url: str
    supabase_service_role_key: str
    supabase_jwt_secret: str

    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: str = (
        "http://localhost:5173,http://localhost:5174,https://gapselling-platform.vercel.app"
    )

    # URL pública do backend (webhooks Evolution / n8n)
    api_public_url: str = "http://localhost:8000"

    # Evolution API (WhatsApp multi-tenant)
    evolution_api_url: str = ""
    evolution_api_key: str = ""

    # Segredo opcional para validar webhooks inbound
    whatsapp_webhook_secret: str = ""

    whatsapp_provider: str = "evolution"
    openai_api_key: str = ""
    campaign_send_rate_per_minute: int = 30

    @property
    def evolution_configured(self) -> bool:
        return bool(self.evolution_api_url.strip() and self.evolution_api_key.strip())

    @property
    def whatsapp_webhook_url(self) -> str:
        return f"{self.api_public_url.rstrip('/')}/api/v1/webhooks/whatsapp/inbound"

    @property
    def cors_origin_list(self) -> list[str]:
        return [
            o.strip().strip("\r")
            for o in self.cors_origins.split(",")
            if o.strip().strip("\r")
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()

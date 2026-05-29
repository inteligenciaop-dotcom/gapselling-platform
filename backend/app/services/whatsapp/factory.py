from functools import lru_cache
from app.core.config import get_settings
from app.services.whatsapp.evolution import EvolutionProvider
from app.services.whatsapp.meta import MetaProvider
from app.services.whatsapp.provider import WhatsAppProvider

@lru_cache
def get_whatsapp_provider() -> WhatsAppProvider:
    provider = (get_settings().whatsapp_provider or "evolution").strip().lower()
    if provider == "meta":
        return MetaProvider()
    return EvolutionProvider()

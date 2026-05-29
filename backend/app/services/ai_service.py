from typing import Protocol, runtime_checkable

import httpx

from app.core.config import get_settings


@runtime_checkable
class LLMProvider(Protocol):
    async def complete(self, *, system_prompt: str, user_message: str) -> str: ...


class OpenAIProvider:
    def __init__(self, api_key: str) -> None:
        self._api_key = api_key

    async def complete(self, *, system_prompt: str, user_message: str) -> str:
        url = 'https://api.openai.com/v1/chat/completions'
        headers = {
            'Authorization': f'Bearer {self._api_key}',
            'Content-Type': 'application/json',
        }
        body = {
            'model': 'gpt-4o-mini',
            'messages': [
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': user_message},
            ],
            'temperature': 0.6,
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, headers=headers, json=body)
        if response.status_code >= 400:
            raise RuntimeError(f'Erro OpenAI: {response.text}')
        data = response.json()
        choices = data.get('choices') or []
        if not choices:
            return ''
        message = choices[0].get('message') or {}
        return str(message.get('content') or '').strip()


def get_llm_provider() -> LLMProvider | None:
    key = get_settings().openai_api_key.strip()
    if not key:
        return None
    return OpenAIProvider(key)

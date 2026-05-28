# GapSelling — Backend (FastAPI)

API REST multi-tenant prevista no roadmap MVP (Fase F0).

## Status

**Não implementado.** O frontend consome Supabase diretamente. Esta pasta reserva a estrutura para a migração gradual.

## Estrutura planejada

```
backend/
├── app/
│   ├── main.py              # Entry point FastAPI
│   ├── core/                # Config, security, deps (JWT, tenant)
│   ├── api/v1/              # Rotas versionadas
│   ├── services/            # Lógica de negócio
│   └── models/              # Schemas Pydantic
├── requirements.txt
├── Dockerfile
└── .env.example
```

## Endpoints previstos (MVP)

- `GET /api/v1/me` — usuário + contexto da academia
- `CRUD /api/v1/leads`, `/api/v1/campaigns`, `/api/v1/academy`
- `POST /api/v1/webhooks/whatsapp/inbound`
- `POST /api/v1/webhooks/n8n/campaign-trigger`

## Quando implementar

Seguir [ROADMAP_MVP.md](../ROADMAP_MVP.md) — Fase F0 (Fundação).

# GapSelling — Backend (FastAPI)

API REST multi-tenant do GapSelling (MVP F0).

## Status

**F0 — Fundação:** scaffold FastAPI, validação JWT Supabase, `GET /api/v1/me`.

**F1 — Dashboard:** `GET /api/v1/dashboard/summary` com resolução de tenant (`get_tenant`).

O frontend usa `frontend/src/services/api.js` para auth e dashboard. Leads/CRM ainda usam Supabase direto (migração F2).

## Estrutura

```
backend/
├── app/
│   ├── main.py
│   ├── core/          # config, security (JWT), tenant
│   ├── api/v1/        # rotas versionadas
│   ├── services/      # Supabase REST (service role)
│   └── models/        # schemas Pydantic
├── requirements.txt
└── .env.example
```

## Setup local

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
cp .env.example .env            # preencher variáveis
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API em http://localhost:8000 — docs em http://localhost:8000/docs

## Variáveis (.env)

| Variável | Descrição |
|----------|-----------|
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (somente backend) |
| `SUPABASE_JWT_SECRET` | JWT Secret legado (HS256). Projetos com **JWT Signing Keys** usam JWKS automaticamente |
| `CORS_ORIGINS` | Origens permitidas (ex. `http://localhost:5173`) |

## Endpoints

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/health` | Não | Health check |
| GET | `/api/v1/me` | Bearer JWT | User + profile + academy |
| GET | `/api/v1/dashboard/summary` | Bearer JWT | Métricas operacionais (scoped por `academy_id`) |
| GET | `/api/v1/campaigns` | Bearer JWT | Lista campanhas da academia |
| GET | `/api/v1/campaigns/meta/lead-tags` | Bearer JWT | Tags distintas dos leads (segmentação) |
| GET | `/api/v1/campaigns/{id}` | Bearer JWT | Detalhe de campanha |
| POST | `/api/v1/campaigns` | Bearer JWT | Criar campanha |
| PATCH | `/api/v1/campaigns/{id}` | Bearer JWT | Atualizar campanha |
| PATCH | `/api/v1/campaigns/{id}/status` | Bearer JWT | Ativar/pausar campanha |
| GET | `/api/v1/whatsapp/status` | Bearer JWT | Status conexão WhatsApp |
| POST | `/api/v1/whatsapp/connect` | Bearer JWT | Criar instância + QR Code |
| POST | `/api/v1/whatsapp/qr/refresh` | Bearer JWT | Atualizar QR Code |
| POST | `/api/v1/whatsapp/disconnect` | Bearer JWT | Desconectar sessão |
| POST | `/api/v1/webhooks/whatsapp/inbound` | Secret header | Webhook Evolution API |

### Tenant (`get_tenant`)

Rotas de negócio resolvem `academy_id` via `profiles.user_id = auth.uid()`. Nunca confiar em `academy_id` enviado pelo cliente.

## Próximos (roadmap)

- Webhook n8n + disparo de campanhas (F3)
- CRUD leads via API (F2)
- Webhooks WhatsApp e n8n
- `whatsapp_service.py`, `ai_service.py`

Ver [ROADMAP_MVP.md](../ROADMAP_MVP.md).

## Evolution API (local)

Stack Docker em `infra/evolution/`. Runbook: [Docs/EVOLUTION_LOCAL.md](../Docs/EVOLUTION_LOCAL.md).

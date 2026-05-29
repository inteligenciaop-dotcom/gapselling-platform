# GapSelling Platform

Monorepo da plataforma SaaS multi-tenant para academias — captação de leads, CRM, campanhas com IA e WhatsApp.

**Produção:** https://gapselling-platform.vercel.app

## Estrutura do repositório

```
gapselling-platform/
├── frontend/          # SPA React + Vite + Tailwind (interface do usuário)
├── backend/           # API FastAPI (em construção — ver roadmap F0)
├── supabase/          # Banco PostgreSQL, migrations, RLS e Edge Functions
├── Docs/              # Roadmap, schema e documentação de produto
├── PROJECT_CONTEXT.md # Visão geral do produto e regras de negócio
├── DATABASE_SCHEMA.md # Referência das tabelas
├── ROADMAP_MVP.md     # Plano de entregas do MVP
└── vercel.json        # Deploy do frontend na Vercel
```

### Separação front / back

| Camada | Pasta | Responsabilidade |
|--------|-------|------------------|
| **Frontend** | `frontend/` | UI, rotas, estado local, chamadas à API |
| **Backend** | `backend/` | Regras de negócio, JWT, webhooks, integrações (WhatsApp, n8n, OpenAI) |
| **Dados** | `supabase/` | Schema versionado, RLS multi-tenant, auth Supabase |

**F0 concluída:** o `AuthContext` usa `GET /api/v1/me` via `services/api.js` (com fallback Supabase se a API estiver offline). Demais módulos ainda usam Supabase direto até migrarem fase a fase.

Checklist F0: [Docs/F0_CHECKLIST.md](Docs/F0_CHECKLIST.md)

## Desenvolvimento local

### Frontend

```bash
cd frontend
cp .env.example .env   # preencher VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

App em http://localhost:5173

### Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Execute as migrations em ordem em `supabase/migrations/`
3. Veja detalhes em [supabase/README.md](supabase/README.md)

### Backend (F0)

```bash
cd backend
cp .env.example .env   # SUPABASE_URL, SERVICE_ROLE_KEY, JWT_SECRET
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

No frontend, defina `VITE_API_URL=http://localhost:8000` no `.env`.

### Evolution API (WhatsApp — F3, local)

```bash
cd infra/evolution
cp .env.example .env   # definir AUTHENTICATION_API_KEY
docker compose up -d
```

Runbook completo: [Docs/EVOLUTION_LOCAL.md](Docs/EVOLUTION_LOCAL.md)

## Deploy

| Serviço | Onde | Config |
|---------|------|--------|
| Frontend | Vercel | `vercel.json` na raiz — build em `frontend/` |
| Backend | DigitalOcean (planejado) | Docker / App Platform |
| Banco | Supabase Cloud | Migrations via SQL Editor ou CLI |

Variáveis Vercel: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_URL`

## Documentação

- [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) — produto e módulos
- [ROADMAP_MVP.md](ROADMAP_MVP.md) — fases e entregas
- [Docs/F0_CHECKLIST.md](Docs/F0_CHECKLIST.md) — checklist e teste manual F0
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) — tabelas e relacionamentos
- [Docs/Roadmap/](Docs/Roadmap/) — backlog detalhado (CSV)

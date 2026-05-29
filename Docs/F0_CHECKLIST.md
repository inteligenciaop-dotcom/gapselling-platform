# F0 — Fundação — Checklist de conclusão

**Critério:** usuário cadastra → academia criada (onboarding) → login → backend retorna tenant (`GET /api/v1/me`) → RLS impede cross-tenant.

## Variáveis de ambiente

### Frontend (`frontend/.env`)

```env
VITE_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key
VITE_API_URL=http://localhost:8001
```

### Backend (`backend/.env`)

```env
SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
SUPABASE_JWT_SECRET=seu_jwt_secret
CORS_ORIGINS=http://localhost:5173,https://gapselling-platform.vercel.app
```

O **JWT Secret** está em: Supabase Dashboard → Project Settings → API → **JWT Secret**.

## Subir localmente

Terminal 1 — API:

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

Terminal 2 — Frontend:

```bash
cd frontend
npm run dev
```

## Teste manual F0

1. **Health:** abrir http://localhost:8000/health → `{"status":"ok"}`
2. **Cadastro:** `/register` → criar conta
3. **Onboarding:** `/onboarding/academy` → criar academia (RPC)
4. **Login:** sair e entrar de novo
5. **Tenant via API:** no DevTools → Network, após login deve existir chamada `GET /api/v1/me` com `tenant_ready: true`
6. **AuthContext:** `authSource` deve ser `"api"` quando o backend está no ar
7. **RLS:** com dois usuários de academias diferentes, cada um só vê seus leads (teste manual no Supabase ou na UI)

## Fallback

Se o backend estiver offline, o `AuthContext` usa Supabase direto (`authSource: "supabase"`) — o app continua utilizável em dev.

## Entregas F0 (todas concluídas)

- [x] Migrations Supabase versionadas + RLS
- [x] Scaffold FastAPI + JWT middleware
- [x] `GET /api/v1/me`
- [x] `frontend/src/services/api.js`
- [x] `AuthContext` integrado à API com fallback
- [x] Onboarding academia (RPC `create_academy_for_user`)
- [x] Logo em `src/assets/logo.svg`
- [x] `.env.example` + README

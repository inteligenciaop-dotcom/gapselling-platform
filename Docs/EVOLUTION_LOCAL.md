# Evolution API — desenvolvimento local (F3 WhatsApp)

Stack Docker para testar integração WhatsApp com o backend GapSelling **antes** de hospedar Evolution + API na nuvem.

## Arquitetura local

```
Frontend (localhost:5173)
    └── Backend FastAPI (localhost:8000)
            ├── Supabase Cloud
            └── Evolution API (Docker localhost:8080)
                    └── webhook → http://host.docker.internal:8000/api/v1/webhooks/whatsapp/inbound
```

O backend cria instâncias `gap-{academy_id}` na Evolution e registra o webhook automaticamente em `connect_whatsapp`.

## Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/Mac)
- Backend e frontend configurados (ver [F0_CHECKLIST.md](F0_CHECKLIST.md))
- Migrations Supabase aplicadas (inclui `whatsapp_instances`, `conversations`, `messages`)

## 1. Subir Evolution API

```powershell
cd infra/evolution
copy .env.example .env
# Edite .env: defina POSTGRES_PASSWORD e AUTHENTICATION_API_KEY (mesmo valor nos dois lugares se quiser)
docker compose up -d
```

Aguarde ~30s e verifique:

```powershell
docker compose ps
docker logs gapselling_evolution_api --tail 30
```

Abra http://localhost:8080 — a Evolution deve responder (manager ou JSON de status).

Parar stack:

```powershell
docker compose down
```

Manter dados (sessões WhatsApp) entre restarts: use `docker compose down` **sem** `-v`. Para reset completo: `docker compose down -v`.

## 2. Configurar backend

Em `backend/.env`, além das variáveis Supabase:

```env
WHATSAPP_PROVIDER=evolution
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=change-me-gap-evolution-local
API_PUBLIC_URL=http://host.docker.internal:8000
CAMPAIGN_SEND_RATE_PER_MINUTE=30
```

| Variável | Valor local | Motivo |
|----------|-------------|--------|
| `EVOLUTION_API_KEY` | Igual a `AUTHENTICATION_API_KEY` do `infra/evolution/.env` | Header `apikey` nas chamadas REST |
| `API_PUBLIC_URL` | `http://host.docker.internal:8000` | Container Evolution alcança o backend no host (Windows/Mac Docker Desktop) |
| `WHATSAPP_WEBHOOK_SECRET` | Deixe **vazio** no teste local | Evolution não envia `X-Webhook-Secret` por padrão |

Se o backend rodar em outra porta (ex.: `8001`), ajuste `API_PUBLIC_URL` para `http://host.docker.internal:8001`.

Subir API:

```powershell
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Teste rápido:

```powershell
curl http://localhost:8000/health
curl http://localhost:8080 -UseBasicParsing
```

## 3. Configurar frontend

Em `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
```

```powershell
cd frontend
npm run dev
```

## 4. Teste manual — fluxo WhatsApp

1. Login → onboarding concluído (`tenant_ready: true`).
2. Menu **Integrações** (`/integrations`).
3. **Conectar WhatsApp** — deve aparecer QR Code.
4. No celular: WhatsApp → Aparelhos conectados → Conectar aparelho → escanear QR.
5. Status muda para **Conectado** (poll a cada 4s na UI).
6. Envie uma mensagem de texto **para o número conectado** a partir de outro celular.
7. Verifique:
   - Logs do backend (webhook recebido)
   - Tabela `messages` / `conversations` no Supabase
   - Página **Chat IA** (se agentes IA configurados)

### Troubleshooting

| Sintoma | Causa provável | Ação |
|---------|----------------|------|
| `Evolution API nao configurada` | `EVOLUTION_API_*` vazias | Preencher `backend/.env` e reiniciar uvicorn |
| QR não aparece | Evolution offline ou API key errada | `docker logs gapselling_evolution_api` |
| Conecta mas mensagens não chegam | `API_PUBLIC_URL` errada | Deve ser `host.docker.internal`, não `localhost` |
| Webhook 401 | `WHATSAPP_WEBHOOK_SECRET` definido | Remover secret no teste local |
| Instância já existe | Teste anterior | Desconectar na UI ou apagar instância na Evolution |
| Número estranho (ex. `552376...`) / erro ao responder | WhatsApp iOS envia `@lid` sem telefone; Evolution anterior a 2.3.7 falha no `sendText` | Stack local usa **v2.3.7** + `WPP_LID_MODE=false`. Peça nova mensagem de teste; no Chat IA aparece o **nome** do contato (`pushName`). Aplique migrations `whatsapp_jid` e `contact_name` no Supabase. |

Testar webhook manualmente (backend rodando):

```powershell
curl -X POST http://localhost:8000/api/v1/webhooks/whatsapp/inbound `
  -H "Content-Type: application/json" `
  -d '{"event":"CONNECTION_UPDATE","instance":"gap-SEU_INSTANCE","data":{"state":"open"}}'
```

## 5. Próximo passo — testes externos (Vercel)

Quando o fluxo local estiver estável:

1. Hospedar **backend** com URL pública (`API_PUBLIC_URL=https://api-staging...`).
2. Hospedar **Evolution** acessível pela nuvem (ou túnel temporário).
3. Na Vercel: `VITE_API_URL=https://api-staging...`
4. No backend: `CORS_ORIGINS` incluindo `https://gapselling-platform.vercel.app`

Ver [ADR 001](ADR/001-whatsapp-evolution-api.md) e seção Deploy no [README](../README.md).

## Referências

- [Evolution API v2 — Docker](https://doc.evolution-api.com/v2/en/install/docker)
- `backend/app/services/whatsapp/evolution.py` — create/connect/webhook/send
- `backend/app/services/whatsapp_instances.py` — fluxo conectar/desconectar

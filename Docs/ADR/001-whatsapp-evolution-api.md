# ADR 001 — Provedor WhatsApp: Evolution API

**Status:** Aceito  
**Data:** 2026-05-28  
**Fase:** F3 — WhatsApp & Campanhas

## Contexto

Cada academia (tenant) precisa conectar **seu próprio número WhatsApp**, com QR code, status de sessão e isolamento multi-tenant. O schema já prevê `whatsapp_instances` com `instance_name`, `qr_code`, `status` e `phone`.

Alternativas consideradas:

| Opção | Prós | Contras |
|-------|------|---------|
| **Evolution API** | QR por instância, multi-tenant natural, comum no BR, integra com n8n | Self-hosted; não é API oficial Meta |
| **Meta Cloud API** | Oficial, escalável | Verificação business por cliente, onboarding pesado no MVP |

## Decisão

Usar **Evolution API v2** como provedor primário no MVP.

- Uma instância Evolution por academia: `gap-{academy_id_curto}`
- Backend FastAPI orquestra create/connect/status/logout
- Webhook Evolution → `POST /api/v1/webhooks/whatsapp/inbound`
- n8n consome backend para disparo (próximo passo F3)

## Consequências

- Infra: servidor Evolution (DigitalOcean ou Evolution Cloud) com URL + API key globais
- Variáveis: `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `API_PUBLIC_URL`, `WHATSAPP_WEBHOOK_SECRET`
- Meta Cloud API permanece fallback pós-MVP se exigido por compliance

## Referências

- [Evolution API v2 docs](https://doc.evolution-api.com/)
- `PROJECT_CONTEXT.md` — Estrutura WhatsApp Multi-Tenant
- `DATABASE_SCHEMA.md` — `whatsapp_instances`

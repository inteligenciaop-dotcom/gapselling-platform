# 🗺️ Roadmap MVP GapSelling

> **Período:** 27/05/2026 → 17/07/2026 (~7 semanas)
> **Objetivo:** SaaS multi-tenant operacional — academia configura perfil, conecta WhatsApp, gerencia leads, dispara campanhas IA e converte matrículas.
> **Estado atual:** Frontend auth + dashboard stub. Backend inexistente. Schema com 6 tabelas (`academies`, `profiles`, `leads`, `campaigns`, `whatsapp_instances`).

---

## 📊 Visão geral das fases

| Fase | Período | Foco | Prioridade | Status |
|------|---------|------|------------|--------|
| **F0 — Fundação** | 27/05 – 02/06 | Backend, multi-tenant, RLS, auth | 🔴 Crítica | ⬜ Não iniciada |
| **F1 — Academia & Dashboard** | 03/06 – 09/06 | Configuração da academia + dashboard real | 🔴 Crítica | ⬜ Não iniciada |
| **F2 — Leads & CRM** | 10/06 – 16/06 | Central de leads + Kanban comercial | 🔴 Crítica | ⬜ Não iniciada |
| **F3 — WhatsApp & Campanhas** | 17/06 – 30/06 | Integração WhatsApp + campanhas + n8n | 🔴 Crítica | ⬜ Não iniciada |
| **F4 — Chat IA & Conversão** | 01/07 – 07/07 | Supervisão humana + IA contextualizada | 🟠 Alta | ⬜ Não iniciada |
| **F5 — Alunos, Relatórios & Go-Live** | 08/07 – 17/07 | Fechamento MVP + estabilização + deploy | 🟠 Alta | ⬜ Não iniciada |

---

## 🎯 Objetivo do MVP (17/07/2026)

Ao final do roadmap, o sistema deve permitir o **fluxo completo**:

```
Academia cria conta
  → Configura perfil comercial
  → Conecta WhatsApp
  → Importa/cadastra leads
  → Cria e ativa campanha IA
  → IA conversa via WhatsApp
  → CRM acompanha negociação
  → Operador supervisiona no Chat IA
  → Lead converte em aluno
  → Relatórios básicos exportáveis
```

---

## 🧩 Módulos do MVP — mapa de entrega

| # | Módulo | Fase | Schema atual | Entrega principal |
|---|--------|------|--------------|-------------------|
| 1 | Auth | F0 | `profiles` | Login, cadastro, reset senha, tenant bootstrap |
| 2 | Multi-tenant | F0 | `academies`, `profiles.academy_id` | RLS + middleware FastAPI |
| 3 | Configuração da Academia | F1 | `academies` (+ `academy_profiles` nova) | CRUD perfil comercial + tom IA |
| 4 | Dashboard | F1 | agregações sobre tabelas existentes | Cards e listas com dados reais |
| 5 | Central de Leads | F2 | `leads` | CRUD, tags, filtros, import XLSX |
| 6 | CRM | F2 | `leads.stage` | Kanban com 8 etapas padrão |
| 7 | WhatsApp | F3 | `whatsapp_instances` | Conexão, QR, status, envio/recebimento |
| 8 | Campanhas | F3 | `campaigns` | Scripts IA, ativação, webhook n8n |
| 9 | Chat IA | F4 | `conversations`, `messages` (novas) | Histórico, supervisão, takeover humano |
| 10 | Alunos | F5 | `students` (nova) | Conversão lead → aluno |
| 11 | Relatórios | F5 | views/queries | Export CSV/XLSX operacional |

---

# FASE 0 — Fundação
**📅 27/05/2026 – 02/06/2026 | Prioridade: 🔴 Crítica**

## Objetivo
Estabelecer a base técnica multi-tenant: backend FastAPI, schema versionado, RLS e fluxo de cadastro que cria academia + perfil corretamente.

## Entregas

- [ ] Repositório com pasta `backend/` estruturada (FastAPI modular)
- [ ] Migrations Supabase versionadas em `supabase/migrations/`
- [ ] Tabelas existentes com FKs e índices (`academy_id` NOT NULL)
- [ ] RLS ativo em todas as tabelas tenant-scoped
- [ ] Middleware JWT Supabase → resolução de `academy_id`
- [ ] Endpoint `GET /api/v1/me` (user + academy context)
- [ ] Fluxo register refatorado: criar `academies` + `profiles.academy_id`
- [ ] `.env.example` (frontend + backend)
- [ ] Cliente API no frontend (`lib/api.js`) — início da migração off direct Supabase

## Módulos

| Módulo | Escopo desta fase |
|--------|-------------------|
| **Auth** | Validar JWT no backend; manter Supabase Auth no frontend |
| **Multi-tenant** | `academies` como tenant raiz; `profiles.academy_id` obrigatório |

## Tarefas técnicas

- [ ] Scaffold FastAPI: `core/`, `api/v1/`, `services/`, `models/`
- [ ] Migration: constraints FK `profiles.academy_id → academies.id`
- [ ] Migration: constraints FK em `leads`, `campaigns`, `whatsapp_instances`
- [ ] RLS policy helper: `get_user_academy_id()` via `auth.uid()`
- [ ] Políticas RLS: SELECT/INSERT/UPDATE scoped por `academy_id`
- [ ] Refatorar `Register.jsx`: POST backend cria academy + profile atomicamente
- [ ] Hook `useAuth` + listener `onAuthStateChange`
- [ ] Corrigir asset `logo.png` ou placeholder
- [ ] README raiz com setup local

## Critério de conclusão
✅ Usuário se cadastra → academia criada → login → backend retorna contexto tenant → RLS impede acesso cross-tenant.

---

# FASE 1 — Configuração da Academia & Dashboard
**📅 03/06/2026 – 09/06/2026 | Prioridade: 🔴 Crítica**

## Objetivo
Permitir que cada academia configure seu perfil comercial (base da IA) e visualizar operação real no dashboard.

## Entregas

- [ ] Migration: tabela `academy_profiles` (modalidades, planos, preços, diferenciais, tom_comunicacao)
- [ ] API CRUD `/api/v1/academy` e `/api/v1/academy/profile`
- [ ] Página **Configuração da Academia** no frontend
- [ ] Layout app reutilizável (`AppLayout` com sidebar funcional)
- [ ] Dashboard com métricas reais (leads hoje, conversões, campanhas ativas, status IA)
- [ ] Listas: leads recentes, últimas interações (placeholder até F4 se necessário)

## Módulos

| Módulo | Escopo desta fase |
|--------|-------------------|
| **Configuração da Academia** | Dados institucionais + perfil comercial para IA |
| **Dashboard** | Cards resumo + pipeline resumido + listas operacionais |

## Tarefas técnicas

- [ ] Schema `academy_profiles`: `academy_id`, `modalities` (jsonb), `plans` (jsonb), `pricing`, `differentials`, `communication_tone`, `ai_context` (text)
- [ ] Formulário manual de perfil comercial
- [ ] (Opcional MVP) Stub endpoint IA para gerar perfil a partir de website/descrição — pode ser F4 se atrasar
- [ ] Endpoints agregação dashboard: `/api/v1/dashboard/summary`
- [ ] Substituir métricas hardcoded no Dashboard
- [ ] Rotas: `/dashboard`, `/academy/settings`
- [ ] Sidebar com navegação funcional

## Critério de conclusão
✅ Academia edita perfil comercial → dados persistidos com `academy_id` → dashboard exibe números reais (mesmo que zero).

---

# FASE 2 — Central de Leads & CRM
**📅 10/06/2026 – 16/06/2026 | Prioridade: 🔴 Crítica**

## Objetivo
Operação comercial manual: cadastrar, importar, organizar leads e acompanhar pipeline em Kanban simples.

## Entregas

- [ ] API CRUD leads: `/api/v1/leads`
- [ ] Página **Central de Leads** (lista, filtros, tags, status)
- [ ] Importação XLSX básica (upload → parse → bulk insert)
- [ ] Página **CRM Kanban** com 8 etapas padrão
- [ ] Drag-and-drop ou select para mover `stage`
- [ ] Filtros por tag, stage, source, campanha

## Módulos

| Módulo | Escopo desta fase |
|--------|-------------------|
| **Central de Leads** | CRUD, tags, filtros, import XLSX |
| **CRM** | Kanban visual com `leads.stage` |

## Etapas CRM (fixas no MVP)

```
Novo Lead → Contato Iniciado → Conversando → Interesse
  → Agendado → Negociação → Fechado | Perdido
```

## Tarefas técnicas

- [ ] Enum/constraint para `stage` (ou validação backend)
- [ ] Endpoint bulk import: `POST /api/v1/leads/import`
- [ ] Componente tabela leads com paginação
- [ ] Componente Kanban (colunas = stages)
- [ ] Atualização stage: `PATCH /api/v1/leads/{id}/stage`
- [ ] Google Sheets: **backlog pós-MVP** se XLSX consumir tempo (priorizar XLSX)

## Critério de conclusão
✅ Operador importa 50 leads → filtra por tag → move lead no Kanban → dashboard reflete contagem atualizada.

---

# FASE 3 — WhatsApp & Campanhas
**📅 17/06/2026 – 30/06/2026 | Prioridade: 🔴 Crítica**

## Objetivo
Conectar WhatsApp por academia, criar campanhas IA e disparar automação via n8n — **diferencial core do produto**.

## Entregas

- [ ] Integração WhatsApp (Evolution API ou Meta Cloud API — decisão na S1 desta fase)
- [ ] API `/api/v1/whatsapp`: connect, status, QR, disconnect
- [ ] UI conexão WhatsApp em Configuração da Academia
- [ ] API CRUD campanhas: `/api/v1/campaigns`
- [ ] Página **Campanhas** (criar, editar, ativar/pausar, escolher tag alvo)
- [ ] Scripts IA pré-definidos + prompt customizado (`ai_prompt`)
- [ ] Webhook n8n: ativação campanha → dispara conversa WhatsApp
- [ ] Webhook inbound WhatsApp → backend (registrar mensagem, rotear para IA em F4)

## Módulos

| Módulo | Escopo desta fase |
|--------|-------------------|
| **WhatsApp** | `whatsapp_instances` — conexão multi-tenant |
| **Campanhas** | `campaigns` — segmentação + prompt + ativação n8n |

## Tarefas técnicas

- [ ] Decisão provedor WhatsApp (documentar em ADR curto)
- [ ] Service `whatsapp_service.py`: criar instância, poll status, enviar mensagem
- [ ] Endpoint webhook: `POST /api/v1/webhooks/whatsapp/inbound`
- [ ] Endpoint webhook: `POST /api/v1/webhooks/n8n/campaign-trigger`
- [ ] Payload n8n sempre inclui: `academy_id`, `whatsapp_instance_id`, `campaign_id`, `lead_id`
- [ ] Workflow n8n v1 exportado em `n8n/workflows/campaign-start.json`
- [ ] Ao ativar campanha: selecionar leads por `tag` → enfileirar disparos
- [ ] Status conexão WhatsApp visível no dashboard

## Critério de conclusão
✅ Academia conecta WhatsApp → cria campanha com tag → ativa → n8n dispara → lead recebe mensagem WhatsApp da academia correta.

---

# FASE 4 — Chat IA & Supervisão Humana
**📅 01/07/2026 – 07/07/2026 | Prioridade: 🟠 Alta**

## Objetivo
IA responde leads contextualizada pelo perfil comercial; operador supervisiona e pode assumir conversa.

## Entregas

- [ ] Migrations: `conversations`, `messages` (com `academy_id`, `lead_id`, `whatsapp_instance_id`)
- [ ] Service OpenAI: `ai_service.py` — prompt com contexto `academy_profiles` + `campaigns.ai_prompt`
- [ ] Fluxo inbound: mensagem WhatsApp → IA gera resposta → envia via WhatsApp
- [ ] Página **Chat IA** — lista conversas + thread de mensagens
- [ ] Modo supervisão: operador responde manualmente (takeover)
- [ ] IA atualiza `leads.stage` automaticamente (regras simples: ex. "agendado" → stage Agendado)
- [ ] (Se tempo) Geração automática de perfil comercial via IA (website/descrição)

## Módulos

| Módulo | Escopo desta fase |
|--------|-------------------|
| **Chat IA** | Histórico, supervisão, intervenção manual |
| **IA contextualizada** | OpenAI + perfil academia + campanha |

## Tarefas técnicas

- [ ] Schema `conversations`: `id`, `academy_id`, `lead_id`, `campaign_id`, `status`, `assigned_to` (user_id nullable)
- [ ] Schema `messages`: `id`, `conversation_id`, `direction` (in/out), `content`, `sender_type` (ai/human/lead), `created_at`
- [ ] Prompt template: identidade academia + modalidades + planos + tom + objetivo campanha
- [ ] Endpoint: `GET /api/v1/conversations`, `GET /api/v1/conversations/{id}/messages`
- [ ] Endpoint: `POST /api/v1/conversations/{id}/reply` (humano)
- [ ] Endpoint: `POST /api/v1/conversations/{id}/takeover`
- [ ] Supabase Realtime ou polling para atualização chat (preferir polling no MVP)
- [ ] Guardrails básicos: não expor preços não cadastrados, fallback humano

## Critério de conclusão
✅ Lead responde no WhatsApp → IA responde com contexto da academia → operador vê thread → assume e responde manualmente → CRM reflete nova stage.

---

# FASE 5 — Alunos, Relatórios & Go-Live
**📅 08/07/2026 – 17/07/2026 | Prioridade: 🟠 Alta**

## Objetivo
Fechar fluxo lead→aluno, entregar relatórios básicos, estabilizar e publicar MVP em produção.

## Entregas

- [ ] Migration: tabela `students` (conversão de `leads`)
- [ ] Fluxo conversão: lead stage "Fechado" → criar `student` → lead arquivado/inativo
- [ ] Página **Alunos** (lista, histórico básico)
- [ ] Relatórios: leads, campanhas, conversões, alunos, conversas
- [ ] Export CSV/XLSX por relatório
- [ ] Testes E2E do fluxo principal (smoke test)
- [ ] Deploy backend DigitalOcean + frontend Vercel
- [ ] Documentação operacional mínima (runbook deploy, env vars)
- [ ] Bug bash + correções críticas

## Módulos

| Módulo | Escopo desta fase |
|--------|-------------------|
| **Alunos** | Conversão e listagem pós-matrícula |
| **Relatórios** | Visão operacional + exportação |
| **Go-Live** | Deploy, monitoramento, estabilização |

## Tarefas técnicas

- [ ] Schema `students`: `id`, `academy_id`, `lead_id`, `name`, `phone`, `email`, `enrolled_at`, `plan` (text)
- [ ] Endpoint: `POST /api/v1/leads/{id}/convert`
- [ ] Endpoints relatório: `/api/v1/reports/{type}?format=csv|xlsx`
- [ ] Queries agregação: conversões por período, campanhas ativas, conversas/dia
- [ ] Dockerfile backend + deploy DO App Platform ou Droplet
- [ ] CORS, rate limiting básico, logs estruturados
- [ ] Checklist go-live (abaixo)

## Critério de conclusão
✅ Fluxo completo demonstrável em produção → 1 academia piloto operando → relatório exportável → zero vazamento cross-tenant.

---

## 🏁 Milestones

| Data | Milestone | Entregável chave |
|------|-----------|------------------|
| **02/06** | M0 — Fundação | Backend + RLS + tenant bootstrap |
| **09/06** | M1 — Academia viva | Perfil comercial + dashboard real |
| **16/06** | M2 — Operação manual | Leads + CRM Kanban |
| **30/06** | M3 — Automação core | WhatsApp + campanha n8n funcionando |
| **07/07** | M4 — IA operacional | Chat IA + supervisão humana |
| **17/07** | **M5 — MVP Launch** | Fluxo completo + alunos + relatórios + produção |

---

## 📋 Checklist Go-Live (17/07/2026)

### Funcional
- [ ] Cadastro cria academia + usuário corretamente
- [ ] Perfil comercial editável e usado pela IA
- [ ] WhatsApp conecta por academia (isolado)
- [ ] Campanha dispara para leads da tag correta
- [ ] IA responde com contexto da academia
- [ ] Operador supervisiona e assume conversa
- [ ] CRM reflete stages
- [ ] Lead converte em aluno
- [ ] Relatórios exportam CSV/XLSX

### Técnico
- [ ] RLS testado (tenant A não vê dados tenant B)
- [ ] Variáveis de ambiente documentadas
- [ ] Backend em produção (DigitalOcean)
- [ ] Frontend em produção (Vercel)
- [ ] Webhooks n8n/WhatsApp com autenticação
- [ ] Logs de erro monitorados

### Produto
- [ ] 1 academia piloto onboarded
- [ ] Fluxo demo gravado ou documentado
- [ ] Feedback piloto coletado

---

## ⚠️ Riscos e mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Integração WhatsApp complexa | Atraso F3 | Decidir provedor na semana 1 de F3; fallback Meta Cloud API |
| n8n instável | Campanhas quebram | Workflow mínimo v1; retry + logs; manual trigger backup |
| Schema incompleto | Retrabalho | Migrations incrementais; novas tabelas sempre com `academy_id` |
| Frontend direct Supabase | Segurança | Migrar operações sensíveis para FastAPI desde F0 |
| Escopo IA cresce | Atraso F4 | Prompt template fixo; perfil manual suficiente para launch |
| 7 semanas apertadas | MVP incompleto | Google Sheets e IA auto-perfil → pós-MVP; foco fluxo core |

---

## 🔮 Backlog pós-MVP (após 17/07/2026)

| Item | Motivo do adiamento |
|------|---------------------|
| Import Google Sheets | XLSX cobre MVP |
| Múltiplos usuários por academia (`tenant_members` + roles) | 1 user/academia suficiente no launch |
| IA auto-perfil (website/Instagram) | Perfil manual funciona; nice-to-have |
| BI avançado | Spec exclui no MVP |
| Supabase Realtime no chat | Polling suficiente |
| Testes automatizados extensivos | Smoke tests manuais no go-live |

---

## 📐 Princípios (PROJECT_CONTEXT.md)

> Aplicar em **todas** as fases:

- Foco total no MVP — sem features fora do fluxo core
- Evitar overengineering — serviços simples, sem abstrações prematuras
- Commits pequenos e incrementais
- `academy_id` em toda entidade tenant-scoped
- Operacional antes de analytics
- Simplicidade antes de sofisticação

---

## 🗂️ Como importar no Notion

1. **Criar database "Roadmap MVP"** com propriedades:
   - `Fase` (Select): F0, F1, F2, F3, F4, F5
   - `Módulo` (Multi-select): Auth, Multi-tenant, Academia, Dashboard, Leads, CRM, WhatsApp, Campanhas, Chat IA, Alunos, Relatórios
   - `Prioridade` (Select): Crítica, Alta, Média
   - `Data início` / `Data fim` (Date)
   - `Status` (Select): Não iniciada, Em progresso, Concluída
   - `Entregável` (Text)

2. **Copiar seções** deste documento como páginas filhas por fase (F0–F5).

3. **Converter checkboxes** `- [ ]` em to-do blocks do Notion (colar mantém formato).

4. **Timeline view:** usar coluna de datas das fases para visão Gantt.

5. **Milestones:** criar database separada "Marcos" linkada às fases.

---

*Gerado com base em `PROJECT_CONTEXT.md`, `DATABASE_SCHEMA.md` e análise do estado atual do repositório.*
*Última atualização: 27/05/2026*

# ADR 002: WhatsApp multi-provedor, campanhas e IA

## Status
Aceito - 2026-05-29

## Contexto
O MVP precisa enviar campanhas WhatsApp, receber respostas e responder com agentes IA (vendedor, recepcionista, professor), mantendo isolamento multi-tenant e possibilidade de trocar Evolution por Meta Cloud API.

## Decisao
1. **Abstracao de provedor** em ackend/app/services/whatsapp/ com factory WHATSAPP_PROVIDER (default evolution).
2. **Evolution** permanece implementacao atual (instancia por academia, webhooks CONNECTION/QRCODE/MESSAGES).
3. **Meta** fica stub (MetaProvider) ate credenciais oficiais.
4. **Campanhas**: campos opening_message, ollow_up_interval_hours, max_attempts e fila campaign_sends processada por APScheduler (throttle CAMPAIGN_SEND_RATE_PER_MINUTE).
5. **IA**: perfis i_agent_profiles por academia; roteamento por estagio do lead/aluno; OpenAI via OPENAI_API_KEY.
6. **Conversas**: tabelas conversations + messages; modo i ou human (takeover).

## Consequencias
- Migrations 20260529120000-005 devem ser aplicadas no Supabase.
- Leads precisam whatsapp_opt_in=true para disparo de campanha.
- Backend expoe APIs /conversations, /ai-agents, /students e activate/dispatch em campanhas.

## Alternativas consideradas
- n8n como orquestrador unico: rejeitado para MVP (mais um servico operacional).
- Um unico agente IA: rejeitado (papéis distintos na academia).

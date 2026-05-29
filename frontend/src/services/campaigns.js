import { apiFetch } from './api'

export const CAMPAIGN_AI_TEMPLATES = [
  { id: 'follow-up', label: 'Follow-up amigavel', prompt: 'Voce e consultor comercial da academia. Faca follow-up cordial com leads que ainda nao fecharam.' },
  { id: 'visitas', label: 'Convite para visita', prompt: 'Convide o lead para conhecer a academia pessoalmente e proponha aula experimental.' },
  { id: 'reativar', label: 'Reativar ex-alunos', prompt: 'Abordagem para ex-alunos ou leads inativos com empatia e oferta de retorno.' },
  { id: 'venda', label: 'Venda consultiva', prompt: 'Conduza conversa consultiva: entenda objetivo, indique plano e conduza para fechamento.' },
]

export const CAMPAIGN_OPENING_TEMPLATES = [
  { id: 'ola', label: 'Saudacao', text: 'Ola! Tudo bem? Aqui e da academia. Posso te ajudar com planos e horarios?' },
  { id: 'visita', label: 'Visita experimental', text: 'Ola! Vi seu interesse na academia. Quer agendar uma visita experimental gratuita?' },
  { id: 'promo', label: 'Condicao especial', text: 'Ola! Temos uma condicao especial esta semana. Posso te contar os detalhes?' },
]

function mapCampaign(row) {
  return {
    id: row.id,
    academyId: row.academy_id,
    name: row.name,
    description: row.description,
    tag: row.tag,
    aiPrompt: row.ai_prompt,
    active: Boolean(row.active),
    mode: row.mode || 'ativo',
    openingMessage: row.opening_message,
    followUpIntervalHours: row.follow_up_interval_hours ?? 24,
    maxAttempts: row.max_attempts ?? 3,
    createdAt: row.created_at,
    leadCount: row.lead_count ?? 0,
  }
}

export async function fetchCampaigns() {
  const data = await apiFetch('/api/v1/campaigns')
  return (data ?? []).map(mapCampaign)
}

export async function fetchCampaignLeadTags() {
  const data = await apiFetch('/api/v1/campaigns/meta/lead-tags')
  return data.tags ?? []
}

export async function createCampaign(payload) {
  const data = await apiFetch('/api/v1/campaigns', {
    method: 'POST',
    body: JSON.stringify({
      name: payload.name,
      tag: payload.tag,
      description: payload.description || null,
      ai_prompt: payload.aiPrompt || null,
      active: Boolean(payload.active),
      mode: payload.mode || 'ativo',
      opening_message: payload.openingMessage || null,
      follow_up_interval_hours: payload.followUpIntervalHours ?? 24,
      max_attempts: payload.maxAttempts ?? 3,
    }),
  })
  return mapCampaign(data)
}

export async function updateCampaign(campaignId, payload) {
  const data = await apiFetch('/api/v1/campaigns/' + campaignId, {
    method: 'PATCH',
    body: JSON.stringify({
      name: payload.name,
      tag: payload.tag,
      description: payload.description ?? null,
      ai_prompt: payload.aiPrompt ?? null,
      mode: payload.mode,
      opening_message: payload.openingMessage ?? null,
      follow_up_interval_hours: payload.followUpIntervalHours,
      max_attempts: payload.maxAttempts,
    }),
  })
  return mapCampaign(data)
}

export async function setCampaignActive(campaignId, active) {
  const data = await apiFetch('/api/v1/campaigns/' + campaignId + '/status', {
    method: 'PATCH',
    body: JSON.stringify({ active }),
  })
  return mapCampaign(data)
}

export async function activateCampaign(campaignId) {
  return apiFetch('/api/v1/campaigns/' + campaignId + '/activate', { method: 'POST' })
}

export async function fetchDispatchStatus(campaignId) {
  return apiFetch('/api/v1/campaigns/' + campaignId + '/dispatch-status')
}

export function formatCampaignDate(value) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

import { supabase } from './supabase'

export const DEFAULT_LEAD_STATUS = 'Ativo'
export const DEFAULT_LEAD_STAGE = 'Novo Lead'

export const LEAD_STAGES = [
  'Novo Lead',
  'Contato Iniciado',
  'Conversando',
  'Interesse',
  'Agendado',
  'Negociação',
  'Fechado',
  'Perdido',
]

export const LEAD_STATUS_OPTIONS = ['Ativo', 'Inativo']

export async function fetchLeads() {
  const { data, error } = await supabase
    .from('leads')
    .select('id, name, email, phone, status, stage, source, tag, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data ?? []
}

function normalizeLeadPayload(academyId, lead) {
  const name = lead.name?.trim()

  if (!name) {
    throw new Error('O nome do lead é obrigatório.')
  }

  const payload = {
    academy_id: academyId,
    name,
    email: lead.email?.trim() || null,
    phone: lead.phone?.trim() || null,
    status: lead.status?.trim() || DEFAULT_LEAD_STATUS,
    stage: lead.stage?.trim() || DEFAULT_LEAD_STAGE,
    source: lead.source?.trim() || 'manual',
    tag: lead.tag?.trim() || null,
  }

  if (lead.created_at) {
    payload.created_at = lead.created_at
  }

  return payload
}

/** Postgres/Supabase often returns UTC timestamps without a Z suffix. */
export function parseDbTimestamp(value) {
  if (!value) {
    return null
  }

  if (value instanceof Date) {
    return value
  }

  const text = String(value).trim()

  if (!text) {
    return null
  }

  if (/^\d{4}-\d{2}-\d{2}T/.test(text) && !/[Zz]|[+-]\d{2}:\d{2}$|[+-]\d{4}$/.test(text)) {
    return new Date(`${text}Z`)
  }

  return new Date(text)
}

/** ISO string with local offset for DB timestamptz columns. */
export function localTimestampForDb(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  const offsetMinutes = -date.getTimezoneOffset()
  const sign = offsetMinutes >= 0 ? '+' : '-'
  const abs = Math.abs(offsetMinutes)
  const hours = pad(Math.floor(abs / 60))
  const minutes = pad(abs % 60)

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds())}${sign}${hours}:${minutes}`
}

export function matchesLeadSearch(lead, query) {
  const trimmed = query.trim().toLowerCase()

  if (!trimmed) {
    return true
  }

  const name = (lead.name ?? '').toLowerCase()
  const email = (lead.email ?? '').toLowerCase()
  const phone = (lead.phone ?? '').toLowerCase()
  const phoneDigits = trimmed.replace(/\D/g, '')
  const leadPhoneDigits = (lead.phone ?? '').replace(/\D/g, '')

  return (
    name.includes(trimmed) ||
    email.includes(trimmed) ||
    phone.includes(trimmed) ||
    (phoneDigits.length > 0 && leadPhoneDigits.includes(phoneDigits))
  )
}

export function isValidLeadStage(stage) {
  return LEAD_STAGES.includes(stage)
}

export function resolveLeadStage(stage) {
  return isValidLeadStage(stage) ? stage : DEFAULT_LEAD_STAGE
}

export function groupLeadsByStage(leads) {
  const grouped = Object.fromEntries(LEAD_STAGES.map((stage) => [stage, []]))

  for (const lead of leads) {
    grouped[resolveLeadStage(lead.stage)].push(lead)
  }

  return grouped
}

export function matchesCrmFilters(lead, { search = '', tag = '', source = '', status = '' }) {
  if (status && lead.status !== status) {
    return false
  }

  if (tag.trim()) {
    const leadTag = (lead.tag ?? '').toLowerCase()
    if (!leadTag.includes(tag.trim().toLowerCase())) {
      return false
    }
  }

  if (source.trim()) {
    const leadSource = (lead.source ?? '').toLowerCase()
    if (!leadSource.includes(source.trim().toLowerCase())) {
      return false
    }
  }

  return matchesLeadSearch(lead, search)
}

export async function createLead(academyId, lead) {
  const payload = normalizeLeadPayload(academyId, lead)

  const { data, error } = await supabase
    .from('leads')
    .insert(payload)
    .select('id, name, email, phone, status, stage, source, tag, created_at')
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function updateLead(leadId, { status, stage, source, tag }) {
  const { data, error } = await supabase
    .from('leads')
    .update({
      status: status?.trim() || DEFAULT_LEAD_STATUS,
      stage: stage?.trim() || DEFAULT_LEAD_STAGE,
      source: source?.trim() || null,
      tag: tag?.trim() || null,
    })
    .eq('id', leadId)
    .select('id, name, email, phone, status, stage, source, tag, created_at')
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function updateLeadStage(leadId, stage) {
  const normalized = stage?.trim()

  if (!isValidLeadStage(normalized)) {
    throw new Error(`Etapa inválida: ${stage}`)
  }

  const { data, error } = await supabase
    .from('leads')
    .update({ stage: normalized })
    .eq('id', leadId)
    .select('id, name, email, phone, status, stage, source, tag, created_at')
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function importLeads(academyId, rows, { source, tag }) {
  const trimmedSource = source?.trim()

  if (!trimmedSource) {
    throw new Error('Informe a origem (source) da importação.')
  }

  if (!rows.length) {
    throw new Error('Nenhum lead para importar.')
  }

  const importedAt = localTimestampForDb()

  const payloads = rows.map((row) => normalizeLeadPayload(academyId, {
    ...row,
    status: DEFAULT_LEAD_STATUS,
    stage: DEFAULT_LEAD_STAGE,
    source: trimmedSource,
    tag: tag?.trim() || null,
    created_at: importedAt,
  }))

  const chunkSize = 100
  let imported = 0

  for (let index = 0; index < payloads.length; index += chunkSize) {
    const chunk = payloads.slice(index, index + chunkSize)
    const { error } = await supabase.from('leads').insert(chunk)

    if (error) {
      throw new Error(`Erro na importação (lote ${Math.floor(index / chunkSize) + 1}): ${error.message}`)
    }

    imported += chunk.length
  }

  return imported
}

export function formatLeadDate(value) {
  if (!value) {
    return '—'
  }

  const date = parseDbTimestamp(value)

  if (!date || Number.isNaN(date.getTime())) {
    return '—'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

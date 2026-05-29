import { fetchDashboardSummaryApi } from './api'
import { supabase } from './supabase'

function startOfTodayIso() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today.toISOString()
}

function formatLeadDate(isoDate) {
  if (!isoDate) {
    return '—'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoDate))
}

function mapApiSummary(data) {
  return {
    leadsToday: data.leads_today ?? 0,
    conversions: data.conversions ?? 0,
    activeCampaigns: data.active_campaigns ?? 0,
    totalLeads: data.total_leads ?? 0,
    recentLeads: (data.recent_leads ?? []).map((lead) => ({
      id: lead.id,
      name: lead.name,
      stage: lead.stage,
      tag: lead.tag,
      created_at: lead.created_at,
      createdAtLabel: lead.created_at_label ?? formatLeadDate(lead.created_at),
    })),
    aiActive: Boolean(data.ai_active),
    whatsappConnected: Boolean(data.whatsapp_connected),
    whatsappStatus: data.whatsapp_status ?? 'desconectado',
    whatsappPhone: data.whatsapp_phone ?? null,
  }
}

async function fetchDashboardSummaryFromSupabase(academyId) {
  const todayStart = startOfTodayIso()

  const [
    leadsTodayResult,
    conversionsResult,
    activeCampaignsResult,
    totalLeadsResult,
    recentLeadsResult,
  ] = await Promise.all([
    supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .gte('created_at', todayStart),
    supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('stage', 'Fechado'),
    supabase
      .from('campaigns')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('active', true),
    supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId),
    supabase
      .from('leads')
      .select('id, name, stage, tag, created_at')
      .eq('academy_id', academyId)
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  const errors = [
    leadsTodayResult.error,
    conversionsResult.error,
    activeCampaignsResult.error,
    totalLeadsResult.error,
    recentLeadsResult.error,
  ].filter(Boolean)

  if (errors.length > 0) {
    throw errors[0]
  }

  const recentLeads = (recentLeadsResult.data ?? []).map((lead) => ({
    ...lead,
    createdAtLabel: formatLeadDate(lead.created_at),
  }))

  return {
    leadsToday: leadsTodayResult.count ?? 0,
    conversions: conversionsResult.count ?? 0,
    activeCampaigns: activeCampaignsResult.count ?? 0,
    totalLeads: totalLeadsResult.count ?? 0,
    recentLeads,
    aiActive: false,
    whatsappConnected: false,
    whatsappStatus: 'desconectado',
    whatsappPhone: null,
  }
}

/**
 * Métricas do dashboard — prioriza FastAPI; fallback Supabase se API indisponível.
 */
export async function fetchDashboardSummary(academyId) {
  if (!academyId) {
    throw new Error('Academia não vinculada ao perfil.')
  }

  try {
    const data = await fetchDashboardSummaryApi()
    return mapApiSummary(data)
  } catch (apiError) {
    console.warn('[Dashboard] API indisponível, fallback Supabase:', apiError.message)
    return fetchDashboardSummaryFromSupabase(academyId)
  }
}

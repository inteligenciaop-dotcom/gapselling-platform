import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import PageHeader from '../../components/layout/PageHeader'
import { useAcademySetup } from '../../contexts/AcademySetupContext'
import { useAuth } from '../../contexts/AuthContext'
import { fetchDashboardSummary } from '../../services/dashboard'

function StatCard({ label, value, iconBg, iconColor, icon, badgeBg, badgeIcon, suffix }) {
  return (
    <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 rounded-2xl ${iconBg} ${iconColor} flex items-center justify-center shrink-0`}>
          {icon}
        </div>

        <div>
          <p className="text-sm text-zinc-500">{label}</p>
          <p className="text-4xl font-bold text-zinc-900 mt-1">
            {value}
            {suffix && (
              <span className="text-lg font-semibold text-zinc-500 ml-1">{suffix}</span>
            )}
          </p>
        </div>
      </div>

      <div className={`w-10 h-10 rounded-xl ${badgeBg} flex items-center justify-center shrink-0`}>
        {badgeIcon}
      </div>
    </div>
  )
}

function StageBadge({ stage }) {
  return (
    <span className="inline-flex items-center rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
      {stage}
    </span>
  )
}

export default function Dashboard() {
  const { profile } = useAuth()
  const { isComplete, completedCount, totalCount } = useAcademySetup()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    if (!isComplete || !profile?.academy_id) {
      setLoading(false)
      return
    }

    let active = true

    async function loadSummary() {
      setLoading(true)
      setError('')

      try {
        const data = await fetchDashboardSummary(profile.academy_id)

        if (active) {
          setSummary(data)
        }
      } catch (err) {
        if (active) {
          setError(err.message ?? 'Erro ao carregar dashboard.')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadSummary()

    return () => {
      active = false
    }
  }, [isComplete, profile?.academy_id])

  return (
    <div>
      <PageHeader />

      {!isComplete && (
        <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">
                Configuração pendente
              </p>
              <h2 className="text-lg font-bold text-amber-900 mt-1">
                Complete o perfil da academia para liberar todas as funções
              </h2>
              <p className="text-sm text-amber-800 mt-2">
                Progresso: {completedCount} de {totalCount} itens obrigatórios.
                CRM, leads, campanhas e IA dependem desses dados.
              </p>
            </div>

            <Link
              to="/onboarding/setup"
              className="inline-flex items-center justify-center h-11 px-5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition shrink-0"
            >
              Ver guia de configuração
            </Link>
          </div>
        </div>
      )}

      {isComplete && loading && (
        <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-8 text-zinc-500">
          Carregando métricas...
        </div>
      )}

      {isComplete && error && (
        <div className="bg-white rounded-3xl border border-red-100 shadow-sm p-8 text-red-500">
          {error}
        </div>
      )}

      {isComplete && summary && !loading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
            <StatCard
              label="Leads hoje"
              value={summary.leadsToday}
              iconBg="bg-violet-100"
              iconColor="text-violet-600"
              badgeBg="bg-violet-50 text-violet-500"
              icon={(
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
              badgeIcon={(
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              )}
            />

            <StatCard
              label="Conversões"
              value={summary.conversions}
              iconBg="bg-blue-100"
              iconColor="text-blue-600"
              badgeBg="bg-blue-50 text-blue-500"
              icon={(
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              badgeIcon={(
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              )}
            />

            <StatCard
              label="Campanhas ativas"
              value={summary.activeCampaigns}
              iconBg="bg-orange-100"
              iconColor="text-orange-600"
              badgeBg="bg-orange-50 text-orange-500"
              icon={(
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              )}
              badgeIcon={(
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              )}
            />

            <StatCard
              label="IA comercial"
              value={summary.aiActive ? 'ON' : 'OFF'}
              iconBg="bg-emerald-100"
              iconColor="text-emerald-600"
              badgeBg="bg-emerald-50 text-emerald-500"
              icon={(
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              )}
              badgeIcon={(
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
                <div>
                  <h2 className="text-lg font-bold text-zinc-900">Leads recentes</h2>
                  <p className="text-sm text-zinc-500 mt-1">
                    Últimos cadastros da sua academia
                  </p>
                </div>
                <Link
                  to="/leads"
                  className="text-sm font-semibold text-violet-600 hover:text-violet-700"
                >
                  Ver todos
                </Link>
              </div>

              {summary.recentLeads.length === 0 ? (
                <div className="p-8 text-center text-zinc-500">
                  Nenhum lead cadastrado ainda. Importe ou cadastre leads na Central de Leads.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-zinc-50 text-zinc-500">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold">Nome</th>
                        <th className="px-6 py-3 text-left font-semibold">Etapa</th>
                        <th className="px-6 py-3 text-left font-semibold">Tag</th>
                        <th className="px-6 py-3 text-left font-semibold">Cadastro</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {summary.recentLeads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-zinc-50/80">
                          <td className="px-6 py-4 font-medium text-zinc-900">{lead.name}</td>
                          <td className="px-6 py-4">
                            <StageBadge stage={lead.stage} />
                          </td>
                          <td className="px-6 py-4 text-zinc-600">{lead.tag || '—'}</td>
                          <td className="px-6 py-4 text-zinc-500">{lead.createdAtLabel}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-zinc-900">Resumo operacional</h2>
              <p className="text-sm text-zinc-500 mt-1 mb-6">
                Visão rápida da sua base comercial
              </p>

              <dl className="space-y-4">
                <div className="flex items-center justify-between rounded-2xl bg-zinc-50 px-4 py-3">
                  <dt className="text-sm text-zinc-500">Total de leads</dt>
                  <dd className="text-lg font-bold text-zinc-900">{summary.totalLeads}</dd>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-zinc-50 px-4 py-3">
                  <dt className="text-sm text-zinc-500">Taxa de conversão</dt>
                  <dd className="text-lg font-bold text-zinc-900">
                    {summary.totalLeads > 0
                      ? `${Math.round((summary.conversions / summary.totalLeads) * 100)}%`
                      : '0%'}
                  </dd>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-zinc-50 px-4 py-3">
                  <dt className="text-sm text-zinc-500">WhatsApp</dt>
                  <dd className="text-sm font-semibold text-zinc-900">
                    {summary.whatsappConnected
                      ? (summary.whatsappPhone || 'Conectado')
                      : summary.whatsappStatus === 'aguardando QR'
                        ? 'Aguardando QR'
                        : 'Desconectado'}
                  </dd>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-zinc-50 px-4 py-3">
                  <dt className="text-sm text-zinc-500">Interações recentes</dt>
                  <dd className="text-sm font-medium text-zinc-400">Disponível na F4 (Chat IA)</dd>
                </div>
              </dl>
            </div>
          </div>
        </>
      )}

      {!isComplete && (
        <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm min-h-[320px] flex flex-col items-center justify-center p-12 text-center">
          <div className="w-20 h-20 rounded-2xl bg-violet-100 text-violet-500 flex items-center justify-center mb-6">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-zinc-900 mb-2">
            Dashboard disponível após a configuração
          </h2>

          <p className="text-zinc-500 max-w-lg">
            Assim que você preencher o perfil comercial da academia, este painel exibirá métricas reais
            de leads, conversões e campanhas.
          </p>
        </div>
      )}
    </div>
  )
}

import { Link, useNavigate } from 'react-router-dom'

import PageHeader from '../../components/layout/PageHeader'
import { useAcademySetup } from '../../contexts/AcademySetupContext'

const setupSteps = [
  {
    title: 'Dados da academia',
    description: 'WhatsApp, endereço e identidade visual — base para integrações e comunicação.',
  },
  {
    title: 'Perfil comercial',
    description: 'Modalidades, planos, valores e tom de voz — contexto que a IA usa em cada conversa.',
  },
  {
    title: 'Operação liberada',
    description: 'Com o perfil completo, você pode usar CRM, leads, campanhas e automações com IA.',
  },
]

function ChecklistItem({ label, hint, done }) {
  return (
    <li className="flex items-start gap-3 rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3">
      <span
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          done
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-zinc-200 text-zinc-500'
        }`}
      >
        {done ? '✓' : '•'}
      </span>

      <div className="min-w-0">
        <p className={`text-sm font-semibold ${done ? 'text-emerald-800' : 'text-zinc-800'}`}>
          {label}
        </p>
        <p className="text-xs text-zinc-500 mt-1">{hint}</p>
      </div>
    </li>
  )
}

export default function AcademySetupGuide() {
  const navigate = useNavigate()
  const {
    loading,
    checks,
    completedCount,
    totalCount,
    progressPercent,
    isComplete,
  } = useAcademySetup()

  if (loading) {
    return (
      <div>
        <PageHeader />
        <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-8">
          Carregando guia de configuração...
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader />

      <div className="bg-gradient-to-br from-violet-600 to-purple-600 rounded-3xl text-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wider text-violet-100">
          Primeiros passos
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold mt-2">
          Configure sua academia antes de começar
        </h2>
        <p className="text-violet-100 mt-3 max-w-2xl leading-relaxed">
          Os dados comerciais da academia alimentam a IA, as campanhas e o atendimento via WhatsApp.
          Sem essa configuração, as demais funções não funcionam corretamente.
        </p>

        <div className="mt-6">
          <div className="flex items-center justify-between text-sm text-violet-100 mb-2">
            <span>Progresso da configuração</span>
            <span>{completedCount} de {totalCount} itens</span>
          </div>
          <div className="h-3 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full rounded-full bg-white transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-8">
          <h3 className="text-xl font-bold text-zinc-900 mb-2">
            Como funciona
          </h3>
          <p className="text-sm text-zinc-500 mb-6">
            Siga este fluxo na ordem abaixo. Leva poucos minutos e evita retrabalho depois.
          </p>

          <ol className="space-y-4">
            {setupSteps.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700 text-sm font-bold">
                  {index + 1}
                </span>
                <div>
                  <p className="font-semibold text-zinc-900">{step.title}</p>
                  <p className="text-sm text-zinc-500 mt-1">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-8">
          <h3 className="text-xl font-bold text-zinc-900 mb-2">
            Checklist obrigatório
          </h3>
          <p className="text-sm text-zinc-500 mb-6">
            Preencha todos os itens em Configurações da Academia para liberar o restante da plataforma.
          </p>

          <ul className="space-y-3">
            {checks.map((item) => (
              <ChecklistItem
                key={item.key}
                label={item.label}
                hint={item.hint}
                done={item.done}
              />
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-zinc-900">
            {isComplete ? 'Configuração concluída!' : 'Pronto para configurar?'}
          </h3>
          <p className="text-sm text-zinc-500 mt-1">
            {isComplete
              ? 'Sua academia está pronta. Acesse o dashboard e comece a operar.'
              : 'Abra Configurações da Academia e preencha os campos obrigatórios.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          {!isComplete && (
            <Link
              to="/academy/settings"
              className="inline-flex items-center justify-center h-12 px-6 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white font-semibold hover:opacity-90 transition"
            >
              Ir para configurações
            </Link>
          )}

          {isComplete && (
            <button
              type="button"
              onClick={() => navigate('/dashboard', { replace: true })}
              className="inline-flex items-center justify-center h-12 px-6 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white font-semibold hover:opacity-90 transition"
            >
              Acessar dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

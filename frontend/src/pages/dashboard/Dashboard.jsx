import PageHeader from '../../components/layout/PageHeader'

function StatCard({ label, value, iconBg, iconColor, icon, badgeBg, badgeIcon }) {
  return (
    <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-6 flex items-center justify-between">

      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 rounded-2xl ${iconBg} ${iconColor} flex items-center justify-center shrink-0`}>
          {icon}
        </div>

        <div>
          <p className="text-sm text-zinc-500">{label}</p>
          <p className="text-4xl font-bold text-zinc-900 mt-1">{value}</p>
        </div>
      </div>

      <div className={`w-10 h-10 rounded-xl ${badgeBg} flex items-center justify-center shrink-0`}>
        {badgeIcon}
      </div>

    </div>
  )
}

export default function Dashboard() {
  return (
    <div>

      <PageHeader />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">

        <StatCard
          label="Leads Hoje"
          value="24"
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
          value="8"
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          badgeBg="bg-blue-50 text-blue-500"
          icon={(
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          )}
          badgeIcon={(
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          )}
        />

        <StatCard
          label="IA Ativa"
          value="ON"
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

      <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm min-h-[420px] flex flex-col items-center justify-center p-12 text-center">

        <div className="w-20 h-20 rounded-2xl bg-violet-100 text-violet-500 flex items-center justify-center mb-6">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-zinc-900 mb-2">
          Visão geral do seu negócio
        </h2>

        <p className="text-zinc-500 max-w-lg">
          Acompanhe seus resultados, conversões e o desempenho da IA em tempo real.
        </p>

      </div>

    </div>
  )
}

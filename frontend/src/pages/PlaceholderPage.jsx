import PageHeader from '../components/layout/PageHeader'

export default function PlaceholderPage({ title, description }) {
  return (
    <div>
      <PageHeader />

      <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-100 text-violet-600 mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-zinc-900 mb-2">
          {title}
        </h2>

        <p className="text-zinc-500 max-w-md mx-auto">
          {description ?? 'Este módulo será implementado em breve no MVP.'}
        </p>
      </div>
    </div>
  )
}

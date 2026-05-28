import AcademyAvatar from '../layout/AcademyAvatar'

export default function LeadReportPreview({ report, academy }) {
  return (
    <div className="border border-zinc-200 rounded-2xl overflow-hidden">
      <div className="bg-zinc-50 border-b border-zinc-200 p-6">
        <div className="flex items-start gap-4">
          {academy?.logo_url ? (
            <img
              src={academy.logo_url}
              alt={academy.name ?? 'Logo'}
              className="w-14 h-14 rounded-xl object-cover border border-zinc-200"
            />
          ) : (
            <AcademyAvatar size="md" />
          )}
          <div className="flex-1">
            <h3 className="text-lg font-bold text-zinc-900">{report.meta.title}</h3>
            <p className="text-sm text-zinc-600">{academy?.name ?? report.meta.academyName}</p>
            <p className="text-xs text-zinc-500 mt-1">Gerado em: {report.meta.generatedAt}</p>
            <p className="text-xs font-semibold text-violet-700 mt-2">{report.meta.totalLabel}</p>
          </div>
        </div>
        <div className="mt-4 text-sm text-zinc-600">
          <p className="font-semibold text-zinc-700 mb-1">Filtros aplicados:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {report.meta.filters.map((filter) => (
              <li key={filter}>{filter}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white text-zinc-600 border-b border-zinc-100">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Nome</th>
              <th className="text-left px-4 py-3 font-semibold">E-mail</th>
              <th className="text-left px-4 py-3 font-semibold">Telefone</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="text-left px-4 py-3 font-semibold">Stage</th>
              <th className="text-left px-4 py-3 font-semibold">Origem</th>
              <th className="text-left px-4 py-3 font-semibold">Tag</th>
              <th className="text-left px-4 py-3 font-semibold">Cadastro</th>
            </tr>
          </thead>
          <tbody>
            {report.rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">
                  Nenhum lead encontrado com os filtros selecionados.
                </td>
              </tr>
            ) : (
              report.rows.map((row, index) => (
                <tr key={`${row.name}-${row.created_at}-${index}`} className="border-t border-zinc-100">
                  <td className="px-4 py-3 font-medium text-zinc-900">{row.name}</td>
                  <td className="px-4 py-3 text-zinc-600">{row.email || '—'}</td>
                  <td className="px-4 py-3 text-zinc-600">{row.phone || '—'}</td>
                  <td className="px-4 py-3 text-zinc-600">{row.status || '—'}</td>
                  <td className="px-4 py-3 text-zinc-600">{row.stage || '—'}</td>
                  <td className="px-4 py-3 text-zinc-600">{row.source || '—'}</td>
                  <td className="px-4 py-3 text-zinc-600">{row.tag || '—'}</td>
                  <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">{row.created_at || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

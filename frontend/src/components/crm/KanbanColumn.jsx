import KanbanCard from './KanbanCard'

const STAGE_STYLES = {
  'Novo Lead': { header: 'bg-violet-100 text-violet-800', ring: 'ring-violet-300' },
  'Contato Iniciado': { header: 'bg-blue-100 text-blue-800', ring: 'ring-blue-300' },
  Conversando: { header: 'bg-cyan-100 text-cyan-800', ring: 'ring-cyan-300' },
  Interesse: { header: 'bg-amber-100 text-amber-800', ring: 'ring-amber-300' },
  Agendado: { header: 'bg-orange-100 text-orange-800', ring: 'ring-orange-300' },
  Negociação: { header: 'bg-purple-100 text-purple-800', ring: 'ring-purple-300' },
  Fechado: { header: 'bg-emerald-100 text-emerald-800', ring: 'ring-emerald-300' },
  Perdido: { header: 'bg-zinc-200 text-zinc-700', ring: 'ring-zinc-400' },
}

export default function KanbanColumn({
  stage,
  leads,
  dragOverStage,
  draggingLeadId,
  onDragOver,
  onDragLeave,
  onDrop,
  onCardDragStart,
  onCardDragEnd,
  onOpenLead,
  onStageChange,
}) {
  const styles = STAGE_STYLES[stage] ?? STAGE_STYLES['Novo Lead']
  const isDragTarget = dragOverStage === stage

  return (
    <section
      className={`flex-shrink-0 w-72 flex flex-col rounded-2xl border border-zinc-200 bg-zinc-50/80 max-h-[calc(100vh-16rem)] ${
        isDragTarget ? `ring-2 ${styles.ring}` : ''
      }`}
      onDragOver={(event) => onDragOver(event, stage)}
      onDragLeave={onDragLeave}
      onDrop={(event) => onDrop(event, stage)}
    >
      <header className={`px-4 py-3 rounded-t-2xl ${styles.header}`}>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold leading-tight">{stage}</h3>
          <span className="inline-flex min-w-6 h-6 px-2 items-center justify-center rounded-full bg-white/70 text-xs font-bold">
            {leads.length}
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[120px]">
        {leads.length === 0 ? (
          <p className="text-xs text-zinc-400 text-center py-6 px-2">
            Arraste leads para cá
          </p>
        ) : (
          leads.map((lead) => (
            <KanbanCard
              key={lead.id}
              lead={lead}
              isDragging={draggingLeadId === lead.id}
              onDragStart={onCardDragStart}
              onDragEnd={onCardDragEnd}
              onOpen={onOpenLead}
              onStageChange={onStageChange}
            />
          ))
        )}
      </div>
    </section>
  )
}

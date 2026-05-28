import { LEAD_STAGES } from '../../lib/leads'

export default function KanbanCard({
  lead,
  isDragging,
  onDragStart,
  onDragEnd,
  onOpen,
  onStageChange,
}) {
  const contact = lead.phone || lead.email || 'Sem contato'

  return (
    <article
      draggable
      onDragStart={(event) => onDragStart(event, lead.id)}
      onDragEnd={onDragEnd}
      className={`rounded-xl border bg-white p-3 shadow-sm cursor-grab active:cursor-grabbing transition ${
        isDragging
          ? 'opacity-40 border-violet-300'
          : 'border-zinc-200 hover:border-violet-300 hover:shadow-md'
      }`}
    >
      <button
        type="button"
        onClick={() => onOpen(lead)}
        className="w-full text-left"
      >
        <p className="font-semibold text-zinc-900 text-sm leading-snug">{lead.name}</p>
        <p className="text-xs text-zinc-500 mt-1 truncate">{contact}</p>

        {(lead.tag || lead.source) && (
          <div className="flex flex-wrap gap-1 mt-2">
            {lead.tag && (
              <span className="inline-flex px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 text-[10px] font-semibold">
                {lead.tag}
              </span>
            )}
            {lead.source && (
              <span className="inline-flex px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 text-[10px] font-medium truncate max-w-full">
                {lead.source}
              </span>
            )}
          </div>
        )}
      </button>

      <label className="block mt-3">
        <span className="sr-only">Mover para etapa</span>
        <select
          value={lead.stage}
          onChange={(event) => onStageChange(lead.id, event.target.value)}
          onClick={(event) => event.stopPropagation()}
          className="w-full h-8 px-2 rounded-lg border border-zinc-200 text-xs text-zinc-600 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          {LEAD_STAGES.map((stage) => (
            <option key={stage} value={stage}>{stage}</option>
          ))}
        </select>
      </label>
    </article>
  )
}

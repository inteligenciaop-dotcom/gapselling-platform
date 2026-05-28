import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import KanbanColumn from '../components/crm/KanbanColumn'
import PageHeader from '../components/layout/PageHeader'
import { useAuth } from '../contexts/AuthContext'
import {
  DEFAULT_LEAD_STAGE,
  DEFAULT_LEAD_STATUS,
  fetchLeads,
  formatLeadDate,
  groupLeadsByStage,
  LEAD_STAGES,
  LEAD_STATUS_OPTIONS,
  matchesCrmFilters,
  updateLead,
  updateLeadStage,
} from '../lib/leads'

const inputClass =
  'w-full h-11 px-4 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-violet-500'

const readOnlyClass =
  'w-full h-11 px-4 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-600'

const emptyFilters = {
  search: '',
  tag: '',
  source: '',
  status: '',
}

const emptyEditForm = {
  status: DEFAULT_LEAD_STATUS,
  stage: DEFAULT_LEAD_STAGE,
  source: '',
  tag: '',
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-zinc-100 shadow-xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-zinc-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function CrmKanban() {
  const { profile } = useAuth()

  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  const [filters, setFilters] = useState(emptyFilters)
  const [draggingLeadId, setDraggingLeadId] = useState(null)
  const [dragOverStage, setDragOverStage] = useState(null)
  const [movingStage, setMovingStage] = useState(false)

  const [selectedLead, setSelectedLead] = useState(null)
  const [editForm, setEditForm] = useState(emptyEditForm)
  const [savingEdit, setSavingEdit] = useState(false)

  const filteredLeads = useMemo(
    () => leads.filter((lead) => matchesCrmFilters(lead, filters)),
    [leads, filters],
  )

  const leadsByStage = useMemo(
    () => groupLeadsByStage(filteredLeads),
    [filteredLeads],
  )

  async function loadLeads() {
    setLoading(true)
    setMessage('')

    try {
      const data = await fetchLeads()
      setLeads(data)
    } catch (err) {
      setMessage(err.message ?? 'Erro ao carregar leads.')
      setIsError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (profile?.academy_id) {
      loadLeads()
    }
  }, [profile?.academy_id])

  function handleFilterChange(event) {
    setFilters({
      ...filters,
      [event.target.name]: event.target.value,
    })
  }

  function handleClearFilters() {
    setFilters(emptyFilters)
  }

  function patchLeadInState(updatedLead) {
    setLeads((current) => current.map((lead) => (
      lead.id === updatedLead.id ? updatedLead : lead
    )))
  }

  async function moveLeadToStage(leadId, stage) {
    const lead = leads.find((item) => item.id === leadId)

    if (!lead || lead.stage === stage) {
      return
    }

    const previousStage = lead.stage

    setMovingStage(true)
    setMessage('')
    patchLeadInState({ ...lead, stage })

    try {
      const updated = await updateLeadStage(leadId, stage)
      patchLeadInState(updated)
      setMessage(`Lead movido para "${stage}".`)
      setIsError(false)

      if (selectedLead?.id === leadId) {
        setSelectedLead(updated)
        setEditForm({
          status: updated.status ?? DEFAULT_LEAD_STATUS,
          stage: updated.stage ?? DEFAULT_LEAD_STAGE,
          source: updated.source ?? '',
          tag: updated.tag ?? '',
        })
      }
    } catch (err) {
      patchLeadInState({ ...lead, stage: previousStage })
      setMessage(err.message ?? 'Erro ao mover lead.')
      setIsError(true)
    } finally {
      setMovingStage(false)
    }
  }

  function handleCardDragStart(event, leadId) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', leadId)
    setDraggingLeadId(leadId)
  }

  function handleCardDragEnd() {
    setDraggingLeadId(null)
    setDragOverStage(null)
  }

  function handleColumnDragOver(event, stage) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setDragOverStage(stage)
  }

  function handleColumnDragLeave(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setDragOverStage(null)
    }
  }

  function handleColumnDrop(event, stage) {
    event.preventDefault()
    const leadId = event.dataTransfer.getData('text/plain')
    setDragOverStage(null)
    setDraggingLeadId(null)

    if (leadId) {
      moveLeadToStage(leadId, stage)
    }
  }

  function openLeadModal(lead) {
    setSelectedLead(lead)
    setEditForm({
      status: lead.status ?? DEFAULT_LEAD_STATUS,
      stage: lead.stage ?? DEFAULT_LEAD_STAGE,
      source: lead.source ?? '',
      tag: lead.tag ?? '',
    })
  }

  function closeLeadModal() {
    setSelectedLead(null)
    setEditForm(emptyEditForm)
  }

  function handleEditFormChange(event) {
    setEditForm({
      ...editForm,
      [event.target.name]: event.target.value,
    })
  }

  async function handleUpdateLead(event) {
    event.preventDefault()

    if (!selectedLead) {
      return
    }

    setSavingEdit(true)
    setMessage('')

    try {
      const updated = await updateLead(selectedLead.id, editForm)
      patchLeadInState(updated)
      setSelectedLead(updated)
      setMessage('Lead atualizado.')
      setIsError(false)
    } catch (err) {
      setMessage(err.message ?? 'Erro ao salvar lead.')
      setIsError(true)
    } finally {
      setSavingEdit(false)
    }
  }

  const hasActiveFilters = Boolean(
    filters.search.trim() ||
    filters.tag.trim() ||
    filters.source.trim() ||
    filters.status,
  )

  return (
    <div>
      <PageHeader />

      <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">CRM</h2>
            <p className="text-zinc-500 text-sm mt-1">
              Acompanhe a evolução comercial dos leads. Arraste entre colunas ou use o seletor de etapa.
            </p>
          </div>

          <Link
            to="/leads"
            className="h-11 px-5 rounded-xl border border-zinc-300 text-zinc-700 font-semibold hover:bg-zinc-50 transition inline-flex items-center justify-center shrink-0"
          >
            Central de Leads
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-2">Buscar</label>
            <input
              type="search"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Nome, e-mail ou telefone"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-2">Tag</label>
            <input
              type="text"
              name="tag"
              value={filters.tag}
              onChange={handleFilterChange}
              placeholder="Filtrar por tag"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-2">Origem</label>
            <input
              type="text"
              name="source"
              value={filters.source}
              onChange={handleFilterChange}
              placeholder="Filtrar por origem"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-2">Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className={inputClass}
            >
              <option value="">Todos</option>
              {LEAD_STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <p className="text-sm text-zinc-500">
            {filteredLeads.length} lead(s) no funil
            {hasActiveFilters ? ` · ${leads.length} no total` : ''}
          </p>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-sm text-violet-600 font-semibold hover:underline sm:ml-auto"
            >
              Limpar filtros
            </button>
          )}
        </div>

        {message && (
          <p className={`mt-4 text-sm ${isError ? 'text-red-500' : 'text-green-600'}`}>
            {message}
          </p>
        )}
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-12 text-center text-zinc-500">
          Carregando funil...
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-12 text-center">
          <p className="text-zinc-500 mb-4">Nenhum lead cadastrado ainda.</p>
          <Link to="/leads" className="text-violet-600 font-semibold hover:underline">
            Ir para Central de Leads
          </Link>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-12 text-center">
          <p className="text-zinc-500 mb-4">Nenhum lead encontrado com os filtros aplicados.</p>
          <button
            type="button"
            onClick={handleClearFilters}
            className="text-violet-600 font-semibold hover:underline"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {LEAD_STAGES.map((stage) => (
              <KanbanColumn
                key={stage}
                stage={stage}
                leads={leadsByStage[stage]}
                dragOverStage={dragOverStage}
                draggingLeadId={draggingLeadId}
                onDragOver={handleColumnDragOver}
                onDragLeave={handleColumnDragLeave}
                onDrop={handleColumnDrop}
                onCardDragStart={handleCardDragStart}
                onCardDragEnd={handleCardDragEnd}
                onOpenLead={openLeadModal}
                onStageChange={moveLeadToStage}
              />
            ))}
          </div>
        </div>
      )}

      {movingStage && (
        <p className="sr-only" aria-live="polite">Atualizando etapa do lead...</p>
      )}

      {selectedLead && (
        <Modal title="Detalhes do lead" onClose={closeLeadModal}>
          <form onSubmit={handleUpdateLead} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">Nome</label>
              <input type="text" value={selectedLead.name} readOnly className={readOnlyClass} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-2">E-mail</label>
                <input type="text" value={selectedLead.email || '—'} readOnly className={readOnlyClass} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-2">Telefone</label>
                <input type="text" value={selectedLead.phone || '—'} readOnly className={readOnlyClass} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">Cadastro</label>
              <input type="text" value={formatLeadDate(selectedLead.created_at)} readOnly className={readOnlyClass} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-2">Status</label>
                <select
                  name="status"
                  value={editForm.status}
                  onChange={handleEditFormChange}
                  className={inputClass}
                >
                  {LEAD_STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-2">Stage</label>
                <select
                  name="stage"
                  value={editForm.stage}
                  onChange={handleEditFormChange}
                  className={inputClass}
                >
                  {LEAD_STAGES.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-2">Origem (source)</label>
                <input
                  type="text"
                  name="source"
                  value={editForm.source}
                  onChange={handleEditFormChange}
                  placeholder="Ex: Instagram, indicação, site"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-2">Tag</label>
                <input
                  type="text"
                  name="tag"
                  value={editForm.tag}
                  onChange={handleEditFormChange}
                  placeholder="Opcional"
                  className={inputClass}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingEdit}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white font-semibold disabled:opacity-60"
            >
              {savingEdit ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}

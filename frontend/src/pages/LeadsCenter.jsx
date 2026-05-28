import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import PageHeader from '../components/layout/PageHeader'
import { useAuth } from '../contexts/AuthContext'
import { downloadLeadImportTemplate, parseLeadSpreadsheet } from '../lib/leadImport'
import {
  createLead,
  DEFAULT_LEAD_STAGE,
  DEFAULT_LEAD_STATUS,
  fetchLeads,
  formatLeadDate,
  importLeads,
  LEAD_STAGES,
  LEAD_STATUS_OPTIONS,
  matchesLeadSearch,
  updateLead,
} from '../lib/leads'

const inputClass =
  'w-full h-11 px-4 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-violet-500'

const readOnlyClass =
  'w-full h-11 px-4 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-600'

const emptyLeadForm = {
  name: '',
  email: '',
  phone: '',
  status: DEFAULT_LEAD_STATUS,
  stage: DEFAULT_LEAD_STAGE,
  source: '',
  tag: '',
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

export default function LeadsCenter() {

  const { profile } = useAuth()
  const fileInputRef = useRef(null)

  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const [creating, setCreating] = useState(false)
  const [importing, setImporting] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)

  const [selectedLead, setSelectedLead] = useState(null)
  const [editForm, setEditForm] = useState(emptyEditForm)

  const [leadForm, setLeadForm] = useState(emptyLeadForm)
  const [importForm, setImportForm] = useState({ source: '', tag: '' })
  const [importFile, setImportFile] = useState(null)
  const [importPreview, setImportPreview] = useState([])
  const [importWarnings, setImportWarnings] = useState([])
  const [searchQuery, setSearchQuery] = useState('')

  const filteredLeads = leads.filter((lead) => matchesLeadSearch(lead, searchQuery))

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

  function handleLeadFormChange(e) {
    setLeadForm({
      ...leadForm,
      [e.target.name]: e.target.value,
    })
  }

  function handleImportFormChange(e) {
    setImportForm({
      ...importForm,
      [e.target.name]: e.target.value,
    })
  }

  function openEditLead(lead) {
    setSelectedLead(lead)
    setEditForm({
      status: lead.status ?? DEFAULT_LEAD_STATUS,
      stage: lead.stage ?? DEFAULT_LEAD_STAGE,
      source: lead.source ?? '',
      tag: lead.tag ?? '',
    })
    setShowEditModal(true)
  }

  function handleEditFormChange(e) {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value,
    })
  }

  async function handleUpdateLead(e) {
    e.preventDefault()

    if (!selectedLead?.id) {
      return
    }

    setSavingEdit(true)

    try {
      await updateLead(selectedLead.id, editForm)
      setShowEditModal(false)
      setSelectedLead(null)
      setEditForm(emptyEditForm)
      setMessage('Lead atualizado com sucesso!')
      setIsError(false)
      await loadLeads()
    } catch (err) {
      setMessage(err.message ?? 'Erro ao atualizar lead.')
      setIsError(true)
    } finally {
      setSavingEdit(false)
    }
  }

  async function handleCreateLead(e) {
    e.preventDefault()

    if (!profile?.academy_id) {
      return
    }

    setCreating(true)

    try {
      await createLead(profile.academy_id, leadForm)
      setShowCreateModal(false)
      setLeadForm(emptyLeadForm)
      setMessage('Lead cadastrado com sucesso!')
      setIsError(false)
      await loadLeads()
    } catch (err) {
      setMessage(err.message ?? 'Erro ao cadastrar lead.')
      setIsError(true)
    } finally {
      setCreating(false)
    }
  }

  async function handleImportFileChange(e) {
    const file = e.target.files?.[0]
    setImportFile(file ?? null)
    setImportPreview([])
    setImportWarnings([])

    if (!file) {
      return
    }

    try {
      const { rows, errors } = await parseLeadSpreadsheet(file)
      setImportPreview(rows)
      setImportWarnings(errors)
    } catch (err) {
      setImportWarnings([err.message ?? 'Erro ao ler planilha.'])
    }
  }

  async function handleImportLeads(e) {
    e.preventDefault()

    if (!profile?.academy_id || !importFile) {
      return
    }

    setImporting(true)
    setMessage('')

    try {
      const { rows, errors } = await parseLeadSpreadsheet(importFile)

      if (errors.length) {
        setImportWarnings(errors)
      }

      const imported = await importLeads(profile.academy_id, rows, importForm)

      setShowImportModal(false)
      setImportFile(null)
      setImportPreview([])
      setImportWarnings([])
      setImportForm({ source: '', tag: '' })
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      setMessage(`${imported} lead(s) importado(s) com sucesso!`)
      setIsError(false)
      await loadLeads()
    } catch (err) {
      setMessage(err.message ?? 'Erro ao importar leads.')
      setIsError(true)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div>
      <PageHeader />

      <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">Central de Leads</h2>
            <p className="text-zinc-500 text-sm mt-1">
              Cadastre leads manualmente ou importe em massa via planilha. Clique em um lead para editar.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setLeadForm(emptyLeadForm)
                setShowCreateModal(true)
              }}
              className="h-11 px-5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white font-semibold"
            >
              Novo lead
            </button>
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="h-11 px-5 rounded-xl border border-violet-500 text-violet-600 font-semibold hover:bg-violet-50 transition"
            >
              Importar planilha
            </button>
            <Link
              to="/leads/report"
              className="h-11 px-5 rounded-xl border border-zinc-300 text-zinc-700 font-semibold hover:bg-zinc-50 transition inline-flex items-center justify-center"
            >
              Gerar relatório
            </Link>
          </div>
        </div>

        {message && (
          <p className={`mt-4 text-sm ${isError ? 'text-red-500' : 'text-green-600'}`}>
            {message}
          </p>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden mb-6">
        {!loading && leads.length > 0 && (
          <div className="p-4 border-b border-zinc-100">
            <label className="block text-sm font-semibold text-zinc-700 mb-2">
              Buscar lead
            </label>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nome, e-mail ou telefone"
              className={inputClass}
            />
            {searchQuery.trim() && (
              <p className="mt-2 text-sm text-zinc-500">
                {filteredLeads.length} de {leads.length} lead(s) encontrado(s)
              </p>
            )}
          </div>
        )}

        {loading ? (
          <div className="p-8 text-zinc-500">Carregando leads...</div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-zinc-500 mb-4">Nenhum lead cadastrado ainda.</p>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="text-violet-600 font-semibold hover:underline"
            >
              Cadastrar primeiro lead
            </button>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-zinc-500 mb-4">Nenhum lead encontrado para &quot;{searchQuery.trim()}&quot;.</p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-violet-600 font-semibold hover:underline"
            >
              Limpar busca
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-zinc-600">
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
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => openEditLead(lead)}
                    className="border-t border-zinc-100 hover:bg-violet-50/40 cursor-pointer transition"
                  >
                    <td className="px-4 py-3 font-medium text-zinc-900">{lead.name}</td>
                    <td className="px-4 py-3 text-zinc-600">{lead.email || '—'}</td>
                    <td className="px-4 py-3 text-zinc-600">{lead.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-semibold">
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{lead.stage}</td>
                    <td className="px-4 py-3 text-zinc-600">{lead.source || '—'}</td>
                    <td className="px-4 py-3 text-zinc-600">{lead.tag || '—'}</td>
                    <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">
                      {formatLeadDate(lead.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showEditModal && selectedLead && (
        <Modal
          title="Editar lead"
          onClose={() => {
            setShowEditModal(false)
            setSelectedLead(null)
            setEditForm(emptyEditForm)
          }}
        >
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

      {showCreateModal && (
        <Modal title="Novo lead" onClose={() => setShowCreateModal(false)}>
          <form onSubmit={handleCreateLead} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">Nome *</label>
              <input
                type="text"
                name="name"
                value={leadForm.name}
                onChange={handleLeadFormChange}
                required
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-2">E-mail</label>
                <input
                  type="email"
                  name="email"
                  value={leadForm.email}
                  onChange={handleLeadFormChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-2">Telefone</label>
                <input
                  type="text"
                  name="phone"
                  value={leadForm.phone}
                  onChange={handleLeadFormChange}
                  placeholder="(11) 99999-9999"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-2">Status</label>
                <select
                  name="status"
                  value={leadForm.status}
                  onChange={handleLeadFormChange}
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
                  value={leadForm.stage}
                  onChange={handleLeadFormChange}
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
                  value={leadForm.source}
                  onChange={handleLeadFormChange}
                  placeholder="Ex: Instagram, indicação, site"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-2">Tag</label>
                <input
                  type="text"
                  name="tag"
                  value={leadForm.tag}
                  onChange={handleLeadFormChange}
                  placeholder="Opcional"
                  className={inputClass}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white font-semibold disabled:opacity-60"
            >
              {creating ? 'Salvando...' : 'Cadastrar lead'}
            </button>
          </form>
        </Modal>
      )}

      {showImportModal && (
        <Modal title="Importar planilha" onClose={() => setShowImportModal(false)}>
          <form onSubmit={handleImportLeads} className="space-y-4">
            <div className="rounded-xl bg-violet-50 border border-violet-100 p-4 text-sm text-violet-900">
              <p className="font-semibold mb-2">Formato da planilha</p>
              <p>Colunas obrigatórias: <strong>name</strong> (ou nome)</p>
              <p>Colunas opcionais: <strong>email</strong>, <strong>phone</strong> (ou telefone)</p>
              <p className="mt-2">
                Status: <strong>Ativo</strong> · Stage: <strong>Novo Lead</strong> (automático)
              </p>
              <button
                type="button"
                onClick={downloadLeadImportTemplate}
                className="mt-3 text-violet-700 font-semibold hover:underline"
              >
                Baixar modelo CSV
              </button>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">Origem (source) *</label>
              <input
                type="text"
                name="source"
                value={importForm.source}
                onChange={handleImportFormChange}
                required
                placeholder="Ex: Planilha evento mar/2026"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">Tag</label>
              <input
                type="text"
                name="tag"
                value={importForm.tag}
                onChange={handleImportFormChange}
                placeholder="Opcional — mesma tag para todos os leads importados"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">Arquivo *</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleImportFileChange}
                required
                className="block w-full text-sm text-zinc-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-violet-50 file:text-violet-700 file:font-semibold"
              />
            </div>

            {importPreview.length > 0 && (
              <p className="text-sm text-green-600">
                {importPreview.length} lead(s) prontos para importar.
              </p>
            )}

            {importWarnings.length > 0 && (
              <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-sm text-amber-800 max-h-32 overflow-y-auto">
                {importWarnings.map((warning) => (
                  <p key={warning}>{warning}</p>
                ))}
              </div>
            )}

            <button
              type="submit"
              disabled={importing || !importFile || importPreview.length === 0}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white font-semibold disabled:opacity-60"
            >
              {importing ? 'Importando...' : 'Importar leads'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'

import PageHeader from '../../components/layout/PageHeader'
import Modal from '../../components/ui/Modal'
import { useAuth } from '../../contexts/AuthContext'
import {
  activateCampaign,
  CAMPAIGN_AI_TEMPLATES,
  CAMPAIGN_OPENING_TEMPLATES,
  createCampaign,
  fetchCampaignLeadTags,
  fetchCampaigns,
  fetchDispatchStatus,
  formatCampaignDate,
  setCampaignActive,
  updateCampaign,
} from '../../services/campaigns'

const inputClass =
  'w-full h-11 px-4 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-violet-500'

const textareaClass =
  'w-full min-h-[120px] px-4 py-3 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-violet-500'

const emptyForm = {
  name: '',
  tag: '',
  description: '',
  aiPrompt: '',
  templateId: '',
}

function StatusBadge({ active }) {
  return active ? (
    <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
      Ativa
    </span>
  ) : (
    <span className="inline-flex items-center rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600">
      Pausada
    </span>
  )
}

export default function Campaigns() {
  const { profile } = useAuth()

  const [campaigns, setCampaigns] = useState([])
  const [leadTags, setLeadTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [togglingId, setTogglingId] = useState(null)

  const [form, setForm] = useState(emptyForm)
  const [selectedCampaign, setSelectedCampaign] = useState(null)
  const [wizardCampaign, setWizardCampaign] = useState(null)
  const [wizardStep, setWizardStep] = useState(1)
  const [dispatchStatus, setDispatchStatus] = useState(null)
  const [activating, setActivating] = useState(false)



  async function openActivateWizard(campaign) {
    setWizardCampaign(campaign)
    setWizardStep(1)
    setDispatchStatus(null)
    try {
      const status = await fetchDispatchStatus(campaign.id)
      setDispatchStatus(status)
    } catch {
      setDispatchStatus(null)
    }
  }

  async function handleActivateDispatch() {
    if (!wizardCampaign) return
    setActivating(true)
    try {
      await updateCampaign(wizardCampaign.id, {
        name: wizardCampaign.name,
        tag: wizardCampaign.tag,
        openingMessage: wizardCampaign.openingMessage,
        followUpIntervalHours: wizardCampaign.followUpIntervalHours,
        maxAttempts: wizardCampaign.maxAttempts,
        aiPrompt: wizardCampaign.aiPrompt,
      })
      await setCampaignActive(wizardCampaign.id, true)
      await activateCampaign(wizardCampaign.id)
      setDispatchStatus(await fetchDispatchStatus(wizardCampaign.id))
      setMessage('Campanha ativada e fila de envio criada.')
      setIsError(false)
      await loadData()
    } catch (err) {
      setMessage(err.message ?? 'Erro ao ativar campanha.')
      setIsError(true)
    } finally {
      setActivating(false)
    }
  }

  async function loadData() {
    setLoading(true)
    setMessage('')

    try {
      const [campaignRows, tags] = await Promise.all([
        fetchCampaigns(),
        fetchCampaignLeadTags(),
      ])
      setCampaigns(campaignRows)
      setLeadTags(tags)
      setIsError(false)
    } catch (err) {
      setMessage(err.message ?? 'Erro ao carregar campanhas.')
      setIsError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (profile?.academy_id) {
      loadData()
    }
  }, [profile?.academy_id])

  function handleFormChange(event) {
    const { name, value } = event.target

    if (name === 'templateId') {
      const template = CAMPAIGN_AI_TEMPLATES.find((item) => item.id === value)
      setForm({
        ...form,
        templateId: value,
        aiPrompt: template?.prompt ?? form.aiPrompt,
      })
      return
    }

    setForm({
      ...form,
      [name]: value,
    })
  }

  function openCreateModal() {
    setForm(emptyForm)
    setShowCreateModal(true)
  }

  function openEditModal(campaign) {
    setSelectedCampaign(campaign)
    setForm({
      name: campaign.name ?? '',
      tag: campaign.tag ?? '',
      description: campaign.description ?? '',
      aiPrompt: campaign.aiPrompt ?? '',
      templateId: '',
    })
    setShowEditModal(true)
  }

  async function handleCreate(event) {
    event.preventDefault()
    setCreating(true)
    setMessage('')

    try {
      await createCampaign(form)
      setShowCreateModal(false)
      setForm(emptyForm)
      setMessage('Campanha criada com sucesso!')
      setIsError(false)
      await loadData()
    } catch (err) {
      setMessage(err.message ?? 'Erro ao criar campanha.')
      setIsError(true)
    } finally {
      setCreating(false)
    }
  }

  async function handleUpdate(event) {
    event.preventDefault()

    if (!selectedCampaign?.id) {
      return
    }

    setSavingEdit(true)
    setMessage('')

    try {
      await updateCampaign(selectedCampaign.id, form)
      setShowEditModal(false)
      setSelectedCampaign(null)
      setForm(emptyForm)
      setMessage('Campanha atualizada com sucesso!')
      setIsError(false)
      await loadData()
    } catch (err) {
      setMessage(err.message ?? 'Erro ao atualizar campanha.')
      setIsError(true)
    } finally {
      setSavingEdit(false)
    }
  }

  async function handleToggleActive(campaign) {
    setTogglingId(campaign.id)
    setMessage('')

    try {
      await setCampaignActive(campaign.id, !campaign.active)
      setMessage(campaign.active ? 'Campanha pausada.' : 'Campanha ativada.')
      setIsError(false)
      await loadData()
    } catch (err) {
      setMessage(err.message ?? 'Erro ao alterar status da campanha.')
      setIsError(true)
    } finally {
      setTogglingId(null)
    }
  }

  function renderCampaignForm({ onSubmit, submitLabel, submitting }) {
    return (
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-zinc-700 mb-2">
            Nome da campanha *
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleFormChange}
            required
            className={inputClass}
            placeholder="Ex: Reativação ex-alunos"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-zinc-700 mb-2">
            Tag alvo *
          </label>
          {leadTags.length > 0 ? (
            <select
              name="tag"
              value={form.tag}
              onChange={handleFormChange}
              required
              className={inputClass}
            >
              <option value="">Selecione uma tag</option>
              {leadTags.map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              name="tag"
              value={form.tag}
              onChange={handleFormChange}
              required
              className={inputClass}
              placeholder="Ex: Ex-alunos"
            />
          )}
          <p className="text-xs text-zinc-400 mt-2">
            A campanha atinge leads com esta tag na Central de Leads.
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-zinc-700 mb-2">
            Descrição
          </label>
          <input
            type="text"
            name="description"
            value={form.description}
            onChange={handleFormChange}
            className={inputClass}
            placeholder="Objetivo interno da campanha"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-zinc-700 mb-2">
            Script IA (template)
          </label>
          <select
            name="templateId"
            value={form.templateId}
            onChange={handleFormChange}
            className={inputClass}
          >
            <option value="">Selecione um template ou escreva abaixo</option>
            {CAMPAIGN_AI_TEMPLATES.map((template) => (
              <option key={template.id} value={template.id}>{template.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-zinc-700 mb-2">
            Prompt da IA
          </label>
          <textarea
            name="aiPrompt"
            value={form.aiPrompt}
            onChange={handleFormChange}
            className={textareaClass}
            placeholder="Instruções para a IA vendedora nesta campanha..."
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full h-11 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 transition disabled:opacity-60"
        >
          {submitting ? 'Salvando...' : submitLabel}
        </button>
      </form>
    )
  }

  return (
    <div>
      <PageHeader />

      <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">Campanhas</h2>
            <p className="text-zinc-500 text-sm mt-1">
              Crie campanhas comerciais por tag, defina o prompt da IA e ative quando o WhatsApp estiver conectado.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center h-11 px-5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition"
          >
            Nova campanha
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-6 rounded-2xl px-4 py-3 text-sm ${isError ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
          {message}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-8 text-zinc-500">
          Carregando campanhas...
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-12 text-center">
          <h3 className="text-lg font-bold text-zinc-900 mb-2">Nenhuma campanha ainda</h3>
          <p className="text-zinc-500 max-w-md mx-auto mb-6">
            Cadastre leads com tags na Central de Leads e crie sua primeira campanha de automação comercial.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center h-11 px-5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition"
          >
            Criar campanha
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-50 text-zinc-500">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Campanha</th>
                  <th className="px-6 py-3 text-left font-semibold">Tag</th>
                  <th className="px-6 py-3 text-left font-semibold">Leads</th>
                  <th className="px-6 py-3 text-left font-semibold">Status</th>
                  <th className="px-6 py-3 text-left font-semibold">Criada em</th>
                  <th className="px-6 py-3 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-zinc-50/80">
                    <td className="px-6 py-4">
                      <p className="font-medium text-zinc-900">{campaign.name}</p>
                      {campaign.description && (
                        <p className="text-zinc-500 text-xs mt-1">{campaign.description}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-zinc-600">{campaign.tag || '—'}</td>
                    <td className="px-6 py-4 text-zinc-600">{campaign.leadCount}</td>
                    <td className="px-6 py-4">
                      <StatusBadge active={campaign.active} />
                    </td>
                    <td className="px-6 py-4 text-zinc-500">
                      {formatCampaignDate(campaign.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(campaign)}
                          className="h-9 px-3 rounded-lg border border-zinc-200 text-zinc-700 text-xs font-semibold hover:bg-zinc-50"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(campaign)}
                          disabled={togglingId === campaign.id}
                          className={`h-9 px-3 rounded-lg text-xs font-semibold transition disabled:opacity-60 ${
                            campaign.active
                              ? 'border border-amber-200 text-amber-700 hover:bg-amber-50'
                              : 'border border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {togglingId === campaign.id
                            ? '...'
                            : campaign.active
                              ? 'Pausar'
                              : 'Ativar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCreateModal && (
        <Modal title="Nova campanha" onClose={() => setShowCreateModal(false)}>
          {renderCampaignForm({
            onSubmit: handleCreate,
            submitLabel: 'Criar campanha',
            submitting: creating,
          })}
        </Modal>
      )}



      {wizardCampaign && (
        <Modal title="Ativar campanha (3 passos)" onClose={() => setWizardCampaign(null)}>
          <div className="space-y-4">
            <p className="text-sm text-zinc-600">Passo {wizardStep} de 3 — {wizardCampaign.name}</p>
            {wizardStep === 1 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Mensagem de abertura</label>
                <textarea className={textareaClass} value={wizardCampaign.openingMessage || ''} onChange={(e) => setWizardCampaign({ ...wizardCampaign, openingMessage: e.target.value })} />
                <div className="flex flex-wrap gap-2">
                  {CAMPAIGN_OPENING_TEMPLATES.map((t) => (
                    <button key={t.id} type="button" className="px-3 py-1 rounded-lg border text-xs" onClick={() => setWizardCampaign({ ...wizardCampaign, openingMessage: t.text })}>{t.label}</button>
                  ))}
                </div>
              </div>
            )}
            {wizardStep === 2 && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm">Follow-up (horas)</label>
                  <input type="number" className={inputClass} value={wizardCampaign.followUpIntervalHours ?? 24} onChange={(e) => setWizardCampaign({ ...wizardCampaign, followUpIntervalHours: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="text-sm">Max tentativas</label>
                  <input type="number" className={inputClass} value={wizardCampaign.maxAttempts ?? 3} onChange={(e) => setWizardCampaign({ ...wizardCampaign, maxAttempts: Number(e.target.value) })} />
                </div>
              </div>
            )}
            {wizardStep === 3 && (
              <div className="text-sm space-y-1">
                <p>Tag alvo: <strong>{wizardCampaign.tag}</strong></p>
                <p>Leads na tag: {wizardCampaign.leadCount}</p>
                <p className="text-zinc-500">Somente leads com opt-in WhatsApp entram na fila.</p>
                {dispatchStatus && (
                  <div className="mt-3 p-3 rounded-xl bg-zinc-50">
                    <p>Pending: {dispatchStatus.pending} · Sent: {dispatchStatus.sent} · Failed: {dispatchStatus.failed} · Replied: {dispatchStatus.replied}</p>
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-between pt-2">
              <button type="button" disabled={wizardStep === 1} onClick={() => setWizardStep((s) => Math.max(1, s - 1))} className="px-4 h-11 rounded-xl border">Voltar</button>
              {wizardStep < 3 ? (
                <button type="button" onClick={() => setWizardStep((s) => s + 1)} className="px-4 h-11 rounded-xl bg-violet-600 text-white">Proximo</button>
              ) : (
                <button type="button" disabled={activating} onClick={handleActivateDispatch} className="px-4 h-11 rounded-xl bg-violet-600 text-white">{activating ? 'Ativando...' : 'Ativar disparo'}</button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {showEditModal && (
        <Modal title="Editar campanha" onClose={() => { setShowEditModal(false); setSelectedCampaign(null) }}>
          {renderCampaignForm({
            onSubmit: handleUpdate,
            submitLabel: 'Salvar alterações',
            submitting: savingEdit,
          })}
        </Modal>
      )}
    </div>
  )
}

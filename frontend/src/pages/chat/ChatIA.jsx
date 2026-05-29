import { useCallback, useEffect, useRef, useState } from 'react'

import PageHeader from '../../components/layout/PageHeader'
import {
  fetchConversationMessages,
  fetchConversations,
  releaseConversation,
  sendConversationMessage,
  takeoverConversation,
} from '../../services/conversations'

function formatConversationLabel(conversation) {
  if (conversation.contact_name?.trim()) {
    return conversation.contact_name.trim()
  }
  const phone = conversation.phone || ''
  if (phone.startsWith('lid:')) {
    return `WhatsApp (${phone.slice(4, 12)}...)`
  }
  if (/^55\d{10,11}$/.test(phone)) {
    const ddd = phone.slice(2, 4)
    const rest = phone.slice(4)
    if (rest.length === 9) {
      return `+55 (${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`
    }
    return `+55 (${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`
  }
  return phone || 'Contato WhatsApp'
}

export default function ChatIA() {
  const [conversations, setConversations] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const sendLockRef = useRef(false)
  const messagesCacheRef = useRef({})
  const selected = conversations.find((c) => c.id === selectedId)

  const loadMessages = useCallback(async (id, { silent = false } = {}) => {
    if (!id) return
    const cached = messagesCacheRef.current[id]
    if (cached) {
      setMessages(cached)
    } else if (!silent) {
      setMessages([])
    }
    try {
      const rows = await fetchConversationMessages(id)
      messagesCacheRef.current[id] = rows
      setMessages(rows)
      setIsError(false)
    } catch (err) {
      if (!cached) {
        setMessage(err.message ?? 'Erro ao carregar mensagens.')
        setIsError(true)
      }
    }
  }, [])

  const loadConversations = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const rows = await fetchConversations()
      setConversations(rows)
      setSelectedId((current) => current ?? (rows.length ? rows[0].id : null))
      setIsError(false)
    } catch (err) {
      setMessage(err.message ?? 'Erro ao carregar conversas.')
      setIsError(true)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  useEffect(() => {
    const intervalId = setInterval(() => loadConversations(true), 4000)
    return () => clearInterval(intervalId)
  }, [loadConversations])

  useEffect(() => {
    if (!selectedId) return undefined
    loadMessages(selectedId)
    const intervalId = setInterval(() => loadMessages(selectedId, { silent: true }), 3000)
    return () => clearInterval(intervalId)
  }, [selectedId, loadMessages])

  function handleSelectConversation(id) {
    const cached = messagesCacheRef.current[id]
    if (cached) {
      setMessages(cached)
    }
    setSelectedId(id)
  }

  async function handleSend(e) {
    e.preventDefault()
    if (!selectedId || !draft.trim() || sendLockRef.current) return

    const text = draft.trim()
    const optimisticId = `pending-${Date.now()}`
    sendLockRef.current = true
    setMessage('')
    setDraft('')
    setMessages((current) => [
      ...current,
      {
        id: optimisticId,
        conversation_id: selectedId,
        direction: 'outbound',
        sender_type: 'agent',
        body: text,
        created_at: new Date().toISOString(),
      },
    ])

    try {
      const saved = await sendConversationMessage(selectedId, text)
      setMessages((current) => {
        const next = current.map((m) => (m.id === optimisticId ? saved : m))
        messagesCacheRef.current[selectedId] = next
        return next
      })
      setIsError(false)
      void loadConversations(true)
    } catch (err) {
      setMessages((current) => current.filter((m) => m.id !== optimisticId))
      setDraft(text)
      setMessage(err.message ?? 'Erro ao enviar mensagem.')
      setIsError(true)
    } finally {
      sendLockRef.current = false
    }
  }

  return (
    <div>
      <PageHeader />

      {message && (
        <div className={`mb-4 rounded-2xl px-4 py-3 text-sm ${isError ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[520px]">
        <div className="bg-white rounded-3xl border border-zinc-100 p-4 overflow-auto">
          <h2 className="font-semibold mb-3">Conversas</h2>
          {loading ? (
            <p className="text-sm text-zinc-500">Carregando...</p>
          ) : conversations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-500">
              Nenhuma conversa ainda. De outro celular, envie WhatsApp para o numero conectado em Integracoes — a conversa aparece aqui com o numero de quem enviou.
            </div>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSelectConversation(c.id)}
                className={`w-full text-left p-3 rounded-xl mb-2 border ${
                  selectedId === c.id ? 'border-violet-500 bg-violet-50' : 'border-zinc-200'
                }`}
              >
                <p className="font-medium text-sm">{formatConversationLabel(c)}</p>
                <p className="text-xs text-zinc-500">{c.agent_type} / {c.mode}</p>
              </button>
            ))
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-3xl border border-zinc-100 p-4 flex flex-col">
          {selected ? (
            <>
              <div className="flex items-center justify-between mb-4 gap-3">
                <div>
                  <p className="font-semibold">{formatConversationLabel(selected)}</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {selected.phone?.startsWith('lid:')
                      ? 'Contato via WhatsApp (numero oculto pelo app). Respostas usam o ID interno do contato.'
                      : 'Contato remoto — nao e o numero conectado na Integracao.'}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => takeoverConversation(selectedId).then(() => loadConversations(true))}
                    className="px-3 py-2 text-sm rounded-xl border"
                  >
                    Assumir
                  </button>
                  <button
                    type="button"
                    onClick={() => releaseConversation(selectedId).then(() => loadConversations(true))}
                    className="px-3 py-2 text-sm rounded-xl border"
                  >
                    Devolver IA
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto space-y-2 mb-4">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                      m.direction === 'outbound' ? 'ml-auto bg-violet-600 text-white' : 'bg-zinc-100'
                    }`}
                  >
                    {m.body}
                  </div>
                ))}
              </div>

              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  className="flex-1 h-11 px-4 rounded-xl border"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Digite sua resposta..."
                />
                <button
                  type="submit"
                  className="px-4 rounded-xl bg-violet-600 text-white"
                >
                  Enviar
                </button>
              </form>
            </>
          ) : (
            <p className="text-zinc-500">Selecione uma conversa.</p>
          )}
        </div>
      </div>
    </div>
  )
}

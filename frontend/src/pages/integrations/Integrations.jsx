import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import PageHeader from '../../components/layout/PageHeader'
import {
  connectWhatsApp,
  disconnectWhatsApp,
  fetchWhatsAppStatus,
  refreshWhatsAppQr,
  resolveQrImageSrc,
  whatsappStatusLabel,
} from '../../services/whatsapp'

function StatusPill({ connected, status }) {
  const styles = connected
    ? 'bg-emerald-50 text-emerald-700'
    : status === 'aguardando QR'
      ? 'bg-amber-50 text-amber-700'
      : 'bg-zinc-100 text-zinc-600'

  return (
    <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${styles}`}>
      {whatsappStatusLabel(status)}
    </span>
  )
}

export default function Integrations() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  async function loadStatus() {
    try {
      const data = await fetchWhatsAppStatus()
      setStatus(data)
      return data
    } catch (err) {
      setMessage(err.message ?? 'Erro ao carregar status do WhatsApp.')
      setIsError(true)
      return null
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStatus()
  }, [])

  useEffect(() => {
    if (!status || status.connected || status.status !== 'aguardando QR') {
      return undefined
    }

    const intervalId = setInterval(async () => {
      const latest = await fetchWhatsAppStatus()
      setStatus(latest)

      if (latest.connected) {
        setMessage('WhatsApp conectado com sucesso!')
        setIsError(false)
      }
    }, 4000)

    return () => clearInterval(intervalId)
  }, [status?.connected, status?.status])

  async function handleConnect() {
    setActing(true)
    setMessage('')

    try {
      const data = await connectWhatsApp()
      setStatus(data)
      setMessage('Escaneie o QR Code no WhatsApp do celular da academia.')
      setIsError(false)
    } catch (err) {
      setMessage(err.message ?? 'Erro ao iniciar conexão.')
      setIsError(true)
    } finally {
      setActing(false)
    }
  }

  async function handleRefreshQr() {
    setActing(true)
    setMessage('')

    try {
      const data = await refreshWhatsAppQr()
      setStatus(data)
      setMessage('QR Code atualizado.')
      setIsError(false)
    } catch (err) {
      setMessage(err.message ?? 'Erro ao atualizar QR Code.')
      setIsError(true)
    } finally {
      setActing(false)
    }
  }

  async function handleDisconnect() {
    setActing(true)
    setMessage('')

    try {
      const data = await disconnectWhatsApp()
      setStatus(data)
      setMessage('WhatsApp desconectado.')
      setIsError(false)
    } catch (err) {
      setMessage(err.message ?? 'Erro ao desconectar.')
      setIsError(true)
    } finally {
      setActing(false)
    }
  }

  const qrSrc = resolveQrImageSrc(status?.qrCode)

  return (
    <div>
      <PageHeader />

      <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-6 mb-6">
        <h2 className="text-xl font-bold text-zinc-900">Integrações</h2>
        <p className="text-zinc-500 text-sm mt-1">
          Conecte o WhatsApp da academia para campanhas automatizadas e atendimento com IA.
        </p>
      </div>

      {message && (
        <div className={`mb-6 rounded-2xl px-4 py-3 text-sm ${isError ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-zinc-900">WhatsApp da academia</h3>
              <p className="text-sm text-zinc-500 mt-1">
                Provedor: Evolution API — uma instância isolada por tenant.
              </p>
            </div>
            {status && <StatusPill connected={status.connected} status={status.status} />}
          </div>

          {loading ? (
            <p className="text-zinc-500">Carregando status...</p>
          ) : (
            <dl className="space-y-3 mb-6">
              <div className="flex items-center justify-between rounded-2xl bg-zinc-50 px-4 py-3">
                <dt className="text-sm text-zinc-500">Servidor configurado</dt>
                <dd className="text-sm font-semibold text-zinc-900">
                  {status?.configured ? 'Sim' : 'Não — configure EVOLUTION_API_* no backend'}
                </dd>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-zinc-50 px-4 py-3">
                <dt className="text-sm text-zinc-500">Número conectado</dt>
                <dd className="text-sm font-semibold text-zinc-900">{status?.phone || '—'}</dd>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-zinc-50 px-4 py-3">
                <dt className="text-sm text-zinc-500">Instância</dt>
                <dd className="text-sm font-mono text-zinc-700">{status?.instanceName || '—'}</dd>
              </div>
            </dl>
          )}

          <div className="flex flex-wrap gap-3">
            {!status?.connected && (
              <button
                type="button"
                onClick={handleConnect}
                disabled={acting || !status?.configured}
                className="h-11 px-5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-60"
              >
                {acting ? 'Conectando...' : 'Conectar WhatsApp'}
              </button>
            )}

            {status?.status === 'aguardando QR' && (
              <button
                type="button"
                onClick={handleRefreshQr}
                disabled={acting}
                className="h-11 px-5 rounded-xl border border-zinc-200 text-zinc-700 text-sm font-semibold hover:bg-zinc-50 transition disabled:opacity-60"
              >
                Atualizar QR
              </button>
            )}

            {(status?.connected || status?.instanceId) && (
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={acting}
                className="h-11 px-5 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition disabled:opacity-60"
              >
                Desconectar
              </button>
            )}
          </div>

          {!status?.configured && !loading && (
            <p className="text-xs text-amber-700 bg-amber-50 rounded-xl px-4 py-3 mt-4">
              Configure <code className="font-mono">EVOLUTION_API_URL</code>,{' '}
              <code className="font-mono">EVOLUTION_API_KEY</code> e{' '}
              <code className="font-mono">API_PUBLIC_URL</code> no backend antes de conectar.
            </p>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-6">
          <h3 className="text-lg font-bold text-zinc-900 mb-2">QR Code</h3>
          <p className="text-sm text-zinc-500 mb-6">
            No celular: WhatsApp → Dispositivos conectados → Conectar dispositivo.
          </p>

          {qrSrc ? (
            <div className="flex flex-col items-center">
              <img
                src={qrSrc}
                alt="QR Code WhatsApp"
                className="w-64 h-64 rounded-2xl border border-zinc-200"
              />
              <p className="text-xs text-zinc-400 mt-4 text-center">
                Aguardando leitura do QR. Esta tela atualiza automaticamente.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-10 text-center text-zinc-500">
              {status?.connected
                ? 'WhatsApp já está conectado.'
                : status?.pairingCode
                  ? (
                    <div>
                      <p className="mb-2">QR indisponível — use o código de pareamento no WhatsApp:</p>
                      <p className="text-2xl font-mono font-bold tracking-widest text-zinc-900">{status.pairingCode}</p>
                    </div>
                  )
                  : 'Clique em "Conectar WhatsApp" para gerar o QR Code.'}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-zinc-100 bg-zinc-50 p-6">
        <h3 className="text-sm font-semibold text-zinc-800 mb-2">Próximo passo (F3)</h3>
        <p className="text-sm text-zinc-600">
          Com o WhatsApp conectado, ative campanhas em{' '}
          <Link to="/campanhas" className="text-violet-600 font-semibold hover:text-violet-700">
            Campanhas
          </Link>
          . O disparo automático via n8n será configurado na sequência.
        </p>
      </div>
    </div>
  )
}

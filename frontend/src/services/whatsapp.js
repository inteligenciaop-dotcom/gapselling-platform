import { apiFetch } from './api'

function mapWhatsAppStatus(data) {
  return {
    configured: Boolean(data.configured),
    connected: Boolean(data.connected),
    status: data.status ?? 'desconectado',
    phone: data.phone ?? null,
    instanceName: data.instance_name ?? null,
    instanceId: data.instance_id ?? null,
    qrCode: data.qr_code ?? null,
    pairingCode: data.pairing_code ?? null,
    provider: data.provider ?? 'evolution',
  }
}

export async function fetchWhatsAppStatus() {
  const data = await apiFetch('/api/v1/whatsapp/status')
  return mapWhatsAppStatus(data)
}

export async function connectWhatsApp() {
  const data = await apiFetch('/api/v1/whatsapp/connect', { method: 'POST' })
  return mapWhatsAppStatus(data)
}

export async function refreshWhatsAppQr() {
  const data = await apiFetch('/api/v1/whatsapp/qr/refresh', { method: 'POST' })
  return mapWhatsAppStatus(data)
}

export async function disconnectWhatsApp() {
  const data = await apiFetch('/api/v1/whatsapp/disconnect', { method: 'POST' })
  return mapWhatsAppStatus(data)
}

export function resolveQrImageSrc(qrCode) {
  if (!qrCode) {
    return null
  }

  if (qrCode.startsWith('data:image')) {
    return qrCode
  }

  return `data:image/png;base64,${qrCode}`
}

export function whatsappStatusLabel(status) {
  switch (status) {
    case 'conectado':
      return 'Conectado'
    case 'aguardando QR':
      return 'Aguardando leitura do QR'
    default:
      return 'Desconectado'
  }
}

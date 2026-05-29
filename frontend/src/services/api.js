import { supabase } from './supabase'

const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/$/, '')

async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession()
  if (error) {
    throw error
  }
  return data.session?.access_token ?? null
}

/**
 * Cliente HTTP para a API FastAPI (GapSelling backend).
 * Envia o JWT do Supabase Auth no header Authorization.
 */
export async function apiFetch(path, options = {}) {
  const token = await getAccessToken()
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  const contentType = response.headers.get('content-type') ?? ''
  const body = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    const detail = typeof body === 'object' && body?.detail
      ? (typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail))
      : `Erro HTTP ${response.status}`
    throw new Error(detail)
  }

  return body
}

/** GET /api/v1/me — usuário, profile e academia (contexto tenant) */
export async function fetchMe() {
  return apiFetch('/api/v1/me')
}

/** GET /api/v1/dashboard/summary — métricas operacionais da academia */
export async function fetchDashboardSummaryApi() {
  return apiFetch('/api/v1/dashboard/summary')
}

/** Verifica se a API está no ar */
export async function fetchHealth() {
  return apiFetch('/health')
}

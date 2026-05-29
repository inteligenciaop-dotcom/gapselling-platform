import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { fetchMe } from '../services/api'
import { supabase } from '../services/supabase'

const AuthContext = createContext(null)

const ACADEMY_SELECT = 'id, name, slug, logo_url, phone, address, website, instagram_url'

/** Cria profile na primeira sessão (bootstrap — permanece via Supabase até migrar register) */
async function ensureProfileRow(user) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (data) {
    return data
  }

  const loginName =
    user.user_metadata?.login_name
    ?? user.user_metadata?.name
    ?? user.email?.split('@')[0]
    ?? 'Usuário'

  const { data: created, error: insertError } = await supabase
    .from('profiles')
    .insert({
      user_id: user.id,
      login_name: loginName,
      email: user.email,
    })
    .select('*')
    .single()

  if (insertError) {
    throw insertError
  }

  return created
}

async function loadAcademyFromSupabase(academyId) {
  if (!academyId) {
    return null
  }

  const { data, error } = await supabase
    .from('academies')
    .select(ACADEMY_SELECT)
    .eq('id', academyId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

/**
 * Carrega contexto tenant: prioriza GET /api/v1/me (FastAPI);
 * se a API estiver indisponível, usa Supabase direto (fallback F0).
 */
async function loadTenantContext(session) {
  const user = session.user

  try {
    const me = await fetchMe()

    let profile = me.profile
    if (!profile) {
      profile = await ensureProfileRow(user)
    }

    let academy = me.academy
    if (profile?.academy_id && !academy) {
      academy = await loadAcademyFromSupabase(profile.academy_id)
    }

    return {
      session,
      profile,
      academy,
      tenantReady: Boolean(me.tenant_ready ?? profile?.academy_id),
      authSource: 'api',
    }
  } catch (apiError) {
    console.warn('[Auth] API /me indisponível, fallback Supabase:', apiError.message)

    const profile = await ensureProfileRow(user)
    const academy = await loadAcademyFromSupabase(profile.academy_id)

    return {
      session,
      profile,
      academy,
      tenantReady: Boolean(profile?.academy_id),
      authSource: 'supabase',
    }
  }
}

export function AuthProvider({ children }) {

  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [academy, setAcademy] = useState(null)
  const [tenantReady, setTenantReady] = useState(false)
  const [authSource, setAuthSource] = useState(null)

  const refreshAuth = useCallback(async () => {

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      throw sessionError
    }

    const currentSession = sessionData.session

    if (!currentSession?.user) {
      setSession(null)
      setProfile(null)
      setAcademy(null)
      setTenantReady(false)
      setAuthSource(null)
      return { session: null, profile: null, academy: null, tenantReady: false }
    }

    const ctx = await loadTenantContext(currentSession)

    setSession(ctx.session)
    setProfile(ctx.profile)
    setAcademy(ctx.academy)
    setTenantReady(ctx.tenantReady)
    setAuthSource(ctx.authSource)

    return {
      session: ctx.session,
      profile: ctx.profile,
      academy: ctx.academy,
      tenantReady: ctx.tenantReady,
    }
  }, [])

  useEffect(() => {

    let active = true

    async function init() {
      try {
        await refreshAuth()
      } catch (err) {
        console.error('Erro ao carregar auth:', err)
        if (active) {
          setSession(null)
          setProfile(null)
          setAcademy(null)
          setTenantReady(false)
          setAuthSource(null)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      setTimeout(async () => {
        if (!active) {
          return
        }

        try {
          await refreshAuth()
        } catch (err) {
          console.error('Erro ao atualizar auth:', err)
        } finally {
          if (active) {
            setLoading(false)
          }
        }
      }, 0)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }

  }, [refreshAuth])

  const value = useMemo(() => ({
    loading,
    session,
    profile,
    academy,
    refreshAuth,
    hasAcademy: tenantReady,
    tenantReady,
    authSource,
  }), [loading, session, profile, academy, refreshAuth, tenantReady, authSource])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }

  return context
}

export async function waitForAcademyLink(refreshAuth, attempts = 5, delayMs = 400) {

  for (let i = 0; i < attempts; i += 1) {
    const { profile: latestProfile, tenantReady } = await refreshAuth()

    if (tenantReady || latestProfile?.academy_id) {
      return latestProfile
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs))
  }

  return null
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase'

const AuthContext = createContext(null)

async function loadProfileRow(user) {
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

async function loadAcademy(academyId) {
  if (!academyId) {
    return null
  }

  const { data, error } = await supabase
    .from('academies')
    .select('id, name, slug, logo_url, phone, address, website')
    .eq('id', academyId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export function AuthProvider({ children }) {

  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [academy, setAcademy] = useState(null)

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
      return { session: null, profile: null, academy: null }
    }

    const userProfile = await loadProfileRow(currentSession.user)
    const userAcademy = await loadAcademy(userProfile.academy_id)

    setSession(currentSession)
    setProfile(userProfile)
    setAcademy(userAcademy)

    return {
      session: currentSession,
      profile: userProfile,
      academy: userAcademy,
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
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    init()

    // IMPORTANTE: não chamar Supabase dentro do callback de forma síncrona —
    // isso causa deadlock com signUp/signIn e trava em "Criando..."
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
    hasAcademy: Boolean(profile?.academy_id),
  }), [loading, session, profile, academy, refreshAuth])

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
    const { profile: latestProfile } = await refreshAuth()

    if (latestProfile?.academy_id) {
      return latestProfile
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs))
  }

  return null
}

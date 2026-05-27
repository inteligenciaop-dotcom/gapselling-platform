import { supabase } from './supabase'

export async function fetchProfile(userId) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    return { profile: null, academy: null, error }
  }

  if (!profile.academy_id) {
    return { profile, academy: null, error: null }
  }

  const { data: academy, error: academyError } = await supabase
    .from('academies')
    .select('id, name, slug')
    .eq('id', profile.academy_id)
    .single()

  if (academyError) {
    return { profile, academy: null, error: academyError }
  }

  return { profile, academy, error: null }
}

export function getPostAuthPath(profile) {
  if (!profile?.academy_id) {
    return '/onboarding/academy'
  }

  return '/dashboard'
}

export function mapAuthError(message) {
  const normalized = message?.toLowerCase() ?? ''

  if (normalized.includes('already registered') || normalized.includes('already been registered')) {
    return 'Este e-mail já está cadastrado. Faça login ou use "Recuperar senha".'
  }

  if (normalized.includes('invalid login credentials')) {
    return 'E-mail ou senha incorretos.'
  }

  if (normalized.includes('email not confirmed')) {
    return 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.'
  }

  return message
}

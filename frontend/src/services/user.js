import { supabase } from './supabase'
import { mapAuthError } from './auth'

export async function fetchUserAccount(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, user_id, login_name, email, phone, created_at, academy_id')
    .eq('user_id', userId)
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function updateUserAccount(userId, { login_name, phone }) {
  const trimmedName = login_name?.trim()

  if (!trimmedName) {
    throw new Error('O nome é obrigatório.')
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      login_name: trimmedName,
      phone: phone?.trim() || null,
    })
    .eq('user_id', userId)

  if (profileError) {
    throw profileError
  }

  const { error: authError } = await supabase.auth.updateUser({
    data: { login_name: trimmedName },
  })

  if (authError) {
    throw authError
  }
}

export async function updateUserPassword({ password, passwordConfirm }) {
  if (!password || password.length < 6) {
    throw new Error('A senha deve ter no mínimo 6 caracteres.')
  }

  if (password !== passwordConfirm) {
    throw new Error('As senhas não coincidem.')
  }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    throw new Error(mapAuthError(error.message))
  }
}

export function formatAccountDate(value) {
  if (!value) {
    return '—'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
  }).format(new Date(value))
}

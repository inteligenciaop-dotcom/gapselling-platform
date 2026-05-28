import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import PageHeader from '../components/layout/PageHeader'
import { useAuth } from '../contexts/AuthContext'
import {
  fetchUserAccount,
  formatAccountDate,
  updateUserAccount,
  updateUserPassword,
} from '../lib/user'

const inputClass =
  'w-full h-12 px-4 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-violet-500'

const readOnlyClass =
  'w-full h-12 px-4 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-600'

function getInitials(name) {
  if (!name?.trim()) {
    return '?'
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export default function UserSettings() {

  const navigate = useNavigate()
  const { session, profile, academy, refreshAuth } = useAuth()

  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [profileError, setProfileError] = useState(false)
  const [passwordError, setPasswordError] = useState(false)

  const [accountData, setAccountData] = useState({
    login_name: '',
    email: '',
    phone: '',
    created_at: null,
  })

  const [passwordData, setPasswordData] = useState({
    password: '',
    passwordConfirm: '',
  })

  useEffect(() => {
    if (!session?.user?.id) {
      return
    }

    let active = true

    async function loadAccount() {
      setLoading(true)

      try {
        const data = await fetchUserAccount(session.user.id)

        if (!active) {
          return
        }

        setAccountData({
          login_name: data.login_name ?? '',
          email: data.email ?? session.user.email ?? '',
          phone: data.phone ?? '',
          created_at: data.created_at ?? null,
        })
      } catch (err) {
        if (active) {
          setProfileMessage(err.message ?? 'Erro ao carregar dados do usuário.')
          setProfileError(true)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadAccount()

    return () => {
      active = false
    }
  }, [session?.user?.id, session?.user?.email])

  function handleAccountChange(e) {
    setAccountData({
      ...accountData,
      [e.target.name]: e.target.value,
    })
  }

  function handlePasswordChange(e) {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    })
  }

  async function handleSaveProfile(e) {
    e.preventDefault()

    if (!session?.user?.id) {
      return
    }

    setSavingProfile(true)
    setProfileMessage('')
    setProfileError(false)

    try {
      await updateUserAccount(session.user.id, {
        login_name: accountData.login_name,
        phone: accountData.phone,
      })

      await refreshAuth()
      setProfileMessage('Dados salvos com sucesso!')
      setProfileError(false)
    } catch (err) {
      setProfileMessage(err.message ?? 'Erro ao salvar dados.')
      setProfileError(true)
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleSavePassword(e) {
    e.preventDefault()

    setSavingPassword(true)
    setPasswordMessage('')
    setPasswordError(false)

    try {
      await updateUserPassword(passwordData)

      setPasswordData({ password: '', passwordConfirm: '' })
      setPasswordMessage('Senha atualizada com sucesso!')
      setPasswordError(false)
    } catch (err) {
      setPasswordMessage(err.message ?? 'Erro ao atualizar senha.')
      setPasswordError(true)
    } finally {
      setSavingPassword(false)
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader />
        <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-8 max-w-3xl">
          Carregando...
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader />

      <div className="space-y-6 max-w-3xl">

        {/* Resumo */}
        <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-8">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center text-xl font-bold">
              {getInitials(accountData.login_name || profile?.login_name)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900">
                {accountData.login_name || profile?.login_name}
              </h2>
              <p className="text-zinc-500 text-sm">{accountData.email}</p>
              <p className="text-zinc-400 text-sm mt-1">
                Academia: {academy?.name ?? '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Dados pessoais */}
        <form
          onSubmit={handleSaveProfile}
          className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-8"
        >
          <h2 className="text-xl font-bold text-zinc-900 mb-2">
            Dados pessoais
          </h2>
          <p className="text-zinc-500 mb-6 text-sm">
            Informações básicas do seu cadastro na plataforma.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">
                Nome *
              </label>
              <input
                type="text"
                name="login_name"
                value={accountData.login_name}
                onChange={handleAccountChange}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">
                E-mail
              </label>
              <input
                type="email"
                value={accountData.email}
                readOnly
                className={readOnlyClass}
              />
              <p className="text-xs text-zinc-400 mt-2">
                O e-mail de login não pode ser alterado aqui. Use recuperação de senha se perdeu o acesso.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">
                Telefone pessoal
              </label>
              <input
                type="text"
                name="phone"
                placeholder="(11) 99999-9999"
                value={accountData.phone}
                onChange={handleAccountChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">
                Membro desde
              </label>
              <input
                type="text"
                value={formatAccountDate(accountData.created_at)}
                readOnly
                className={readOnlyClass}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 mt-6">
            <button
              type="submit"
              disabled={savingProfile}
              className="w-full sm:w-auto h-12 px-8 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white font-semibold disabled:opacity-60"
            >
              {savingProfile ? 'Salvando...' : 'Salvar dados'}
            </button>

            {profileMessage && (
              <p className={`text-sm ${profileError ? 'text-red-500' : 'text-green-600'}`}>
                {profileMessage}
              </p>
            )}
          </div>
        </form>

        {/* Segurança */}
        <form
          onSubmit={handleSavePassword}
          className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-8"
        >
          <h2 className="text-xl font-bold text-zinc-900 mb-2">
            Segurança
          </h2>
          <p className="text-zinc-500 mb-6 text-sm">
            Altere sua senha de acesso à plataforma.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">
                Nova senha
              </label>
              <input
                type="password"
                name="password"
                value={passwordData.password}
                onChange={handlePasswordChange}
                minLength={6}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">
                Confirmar nova senha
              </label>
              <input
                type="password"
                name="passwordConfirm"
                value={passwordData.passwordConfirm}
                onChange={handlePasswordChange}
                minLength={6}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 mt-6">
            <button
              type="submit"
              disabled={savingPassword || !passwordData.password}
              className="w-full sm:w-auto h-12 px-8 rounded-xl border border-violet-500 text-violet-600 font-semibold hover:bg-violet-50 transition disabled:opacity-60"
            >
              {savingPassword ? 'Atualizando...' : 'Atualizar senha'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="text-sm text-violet-600 hover:underline"
            >
              Esqueci minha senha
            </button>

            {passwordMessage && (
              <p className={`text-sm ${passwordError ? 'text-red-500' : 'text-green-600'}`}>
                {passwordMessage}
              </p>
            )}
          </div>
        </form>

        <p className="text-xs text-zinc-400 text-center pb-4">
          No MVP, cada academia possui um usuário principal. Gestão de múltiplos usuários em breve.
        </p>

      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { mapAuthError } from '../../services/auth'
import { supabase } from '../../services/supabase'
import logo from '../../assets/logo.png'

const RESEND_COOLDOWN_SECONDS = 5

function getAppUrl() {
  if (import.meta.env.VITE_APP_URL) {
    return import.meta.env.VITE_APP_URL.replace(/\/$/, '')
  }

  if (import.meta.env.DEV) {
    return 'http://localhost:5173'
  }

  return window.location.origin
}

export default function ForgotPassword() {

  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) {
      return undefined
    }

    const timer = setInterval(() => {
      setCooldown((current) => Math.max(0, current - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [cooldown])

  async function handleRecover(e) {
    e.preventDefault()

    if (cooldown > 0) {
      return
    }

    setLoading(true)
    setMessage('')
    setIsError(false)

    const redirectUrl = `${getAppUrl()}/update-password`

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    })

    setCooldown(RESEND_COOLDOWN_SECONDS)

    if (error) {
      setMessage(mapAuthError(error.message))
      setIsError(true)
      setLoading(false)
      return
    }

    setMessage('E-mail de recuperação enviado! Verifique sua caixa de entrada.')
    setIsError(false)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">

      <form
        onSubmit={handleRecover}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-zinc-200 p-8"
      >

        <div className="flex flex-col items-center mb-8">

          <img
            src={logo}
            alt="Gap Selling Logo"
            className="w-28 h-28 object-contain"
          />

          <h1 className="text-4xl font-bold text-zinc-900 mt-6">
            Recuperar Senha
          </h1>

          <p className="text-zinc-500 mt-2 text-center">
            Digite seu e-mail para recuperar acesso
          </p>

        </div>

        <div className="space-y-5">

          <input
            type="email"
            placeholder="Seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full h-14 px-4 rounded-xl border border-zinc-300"
          />

          <button
            type="submit"
            disabled={loading || cooldown > 0}
            className="w-full h-14 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white font-semibold text-lg disabled:opacity-60"
          >
            {loading
              ? 'Enviando...'
              : cooldown > 0
                ? `Aguarde ${cooldown}s para reenviar`
                : 'Enviar recuperação'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full h-14 rounded-xl border border-violet-500 text-violet-600 font-semibold"
          >
            Voltar para login
          </button>

          {message && (
            <p className={`text-center text-sm ${isError ? 'text-red-500' : 'text-zinc-600'}`}>
              {message}
            </p>
          )}

        </div>

      </form>

    </div>
  )
}
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { supabase } from '../lib/supabase'
import logo from '../assets/logo.png'

export default function ForgotPassword() {

  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRecover(e) {
    e.preventDefault()

    setLoading(true)
    setMessage('')

    const redirectUrl = import.meta.env.DEV
  ? 'http://localhost:5173/update-password'
  : 'https://gapselling-platform.vercel.app/update-password'

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    setMessage('E-mail de recuperação enviado!')

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
            disabled={loading}
            className="w-full h-14 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white font-semibold text-lg"
          >
            {loading ? 'Enviando...' : 'Enviar recuperação'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full h-14 rounded-xl border border-violet-500 text-violet-600 font-semibold"
          >
            Voltar para login
          </button>

          {message && (
            <p className="text-center text-sm text-zinc-600">
              {message}
            </p>
          )}

        </div>

      </form>

    </div>
  )
}
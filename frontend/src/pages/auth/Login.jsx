import logo from '../../assets/logo.png'

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { supabase } from '../../services/supabase'
import { getPostAuthPath, mapAuthError } from '../../services/auth'
import { useAuth } from '../../contexts/AuthContext'

export default function Login() {

  const navigate = useNavigate()
  const { refreshAuth } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleLogin(e) {
    e.preventDefault()

    setLoading(true)
    setMessage('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(mapAuthError(error.message))
      setLoading(false)
      return
    }

    try {
      const { profile } = await refreshAuth()

      if (!profile) {
        setMessage('Perfil não encontrado. Entre em contato com o suporte.')
        setLoading(false)
        return
      }

      navigate(getPostAuthPath(profile))
    } catch {
      setMessage('Erro ao carregar perfil. Tente novamente.')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">

      <form
        onSubmit={handleLogin}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-zinc-200 p-8"
      >

        {/* Logo + Título */}
        <div className="flex flex-col items-center mb-8">

          <img
            src={logo}
            alt="Gap Selling Logo"
            className="w-28 h-28 object-contain"
          />

          <h1 className="text-5xl font-bold text-zinc-900 mt-6">
            Gap Selling
          </h1>

          <p className="text-zinc-500 mt-2 text-center">
            AI Sales Agent for Gyms
          </p>

        </div>

        {/* Formulário */}
        <div className="space-y-5">

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-2">
              E-mail
            </label>

            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-14 px-4 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Senha */}
          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-2">
              Senha
            </label>

            <input
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-14 px-4 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Botão Entrar */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white font-semibold text-lg hover:opacity-90 transition"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          {/* Criar conta */}
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="w-full h-14 rounded-xl border border-violet-500 text-violet-600 font-semibold hover:bg-violet-50 transition"
          >
            Criar conta
          </button>

          {/* Recuperar senha */}
          <button
            type="button"
            onClick={() => navigate('/forgot-password')}
            className="w-full h-14 rounded-xl border border-violet-500 text-violet-600 font-semibold hover:bg-violet-50 transition"
          >
            Recuperar senha
          </button>

          {/* Mensagem */}
          {message && (
            <p className="text-center text-sm text-red-500">
              {message}
            </p>
          )}

        </div>

      </form>

    </div>
  )
}
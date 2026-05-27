import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { mapAuthError } from '../lib/auth'
import { useAuth } from '../contexts/AuthContext'
import logo from '../assets/logo.png'

const inputClass =
  'w-full h-14 px-4 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-violet-500'

export default function Register() {

  const navigate = useNavigate()
  const { refreshAuth } = useAuth()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [emailAlreadyExists, setEmailAlreadyExists] = useState(false)

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  async function handleRegister(e) {
    e.preventDefault()

    setLoading(true)
    setMessage('')
    setIsError(false)
    setEmailAlreadyExists(false)

    if (formData.password !== formData.confirmPassword) {
      setMessage('As senhas não coincidem.')
      setIsError(true)
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setMessage('A senha deve ter no mínimo 6 caracteres.')
      setIsError(true)
      setLoading(false)
      return
    }

    try {

      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            login_name: formData.name,
            name: formData.name,
          },
        },
      })

      if (error) {
        const friendlyMessage = mapAuthError(error.message)
        setMessage(friendlyMessage)
        setIsError(true)
        setEmailAlreadyExists(friendlyMessage.includes('já está cadastrado'))
        return
      }

      if (data.session) {
        await refreshAuth()
        navigate('/onboarding/academy', { replace: true })
        return
      }

      setMessage('Conta criada! Verifique seu e-mail para confirmar o cadastro.')
      setIsError(false)

      setTimeout(() => {
        navigate('/')
      }, 3000)

    } catch (err) {
      console.error('Erro no cadastro:', err)
      setMessage('Erro inesperado ao criar conta. Tente novamente.')
      setIsError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">

      <form
        onSubmit={handleRegister}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-zinc-200 p-8"
      >

        <div className="flex flex-col items-center mb-8">

          <img
            src={logo}
            alt="Gap Selling Logo"
            className="w-28 h-28 object-contain"
          />

          <h1 className="text-4xl font-bold text-zinc-900 mt-6">
            Criar Conta
          </h1>

          <p className="text-zinc-500 mt-2 text-center">
            Cadastre-se para gerenciar sua academia
          </p>

        </div>

        <div className="space-y-4">

          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-2">
              Nome
            </label>
            <input
              type="text"
              name="name"
              placeholder="Seu nome"
              value={formData.name}
              onChange={handleChange}
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
              name="email"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-2">
              Senha
            </label>
            <input
              type="password"
              name="password"
              placeholder="Mínimo 6 caracteres"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-2">
              Confirmar senha
            </label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Repita a senha"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength={6}
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white font-semibold text-lg hover:opacity-90 transition disabled:opacity-60"
          >
            {loading ? 'Criando...' : 'Criar conta'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full h-14 rounded-xl border border-violet-500 text-violet-600 font-semibold hover:bg-violet-50 transition"
          >
            Voltar para login
          </button>

          {message && (
            <p className={`text-center text-sm ${isError ? 'text-red-500' : 'text-zinc-600'}`}>
              {message}
            </p>
          )}

          {emailAlreadyExists && (
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full h-12 rounded-xl bg-violet-100 text-violet-700 font-semibold hover:bg-violet-200 transition"
            >
              Ir para login
            </button>
          )}

        </div>

      </form>

    </div>
  )
}

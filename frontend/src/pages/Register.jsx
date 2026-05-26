import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import logo from '../assets/logo.png'

export default function Register() {

  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    login_name: '',
    email: '',
    password: '',
    gym_name: '',
    address: '',
    phone: '',
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

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

    try {

      // 1. Criar usuário auth
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (error) {
        setMessage(error.message)
        setLoading(false)
        return
      }

      // 2. Salvar profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: data.user.id,
          login_name: formData.login_name,
          email: formData.email,
          gym_name: formData.gym_name,
          address: formData.address,
          phone: formData.phone,
        })

      if (profileError) {
        setMessage(profileError.message)
        setLoading(false)
        return
      }

      setMessage('Conta criada com sucesso!')

      setTimeout(() => {
        navigate('/')
      }, 2000)

    } catch (err) {
      setMessage('Erro inesperado.')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">

      <form
        onSubmit={handleRegister}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-zinc-200 p-8"
      >

        {/* Logo */}
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
            Comece agora no Gap Selling
          </p>

        </div>

        <div className="space-y-4">

          <input
            type="text"
            name="login_name"
            placeholder="Nome de usuário"
            value={formData.login_name}
            onChange={handleChange}
            required
            className="w-full h-14 px-4 rounded-xl border border-zinc-300"
          />

          <input
            type="email"
            name="email"
            placeholder="E-mail"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full h-14 px-4 rounded-xl border border-zinc-300"
          />

          <input
            type="password"
            name="password"
            placeholder="Senha"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full h-14 px-4 rounded-xl border border-zinc-300"
          />

          <input
            type="text"
            name="gym_name"
            placeholder="Academia (Razão Social)"
            value={formData.gym_name}
            onChange={handleChange}
            required
            className="w-full h-14 px-4 rounded-xl border border-zinc-300"
          />

          <input
            type="text"
            name="address"
            placeholder="Endereço"
            value={formData.address}
            onChange={handleChange}
            className="w-full h-14 px-4 rounded-xl border border-zinc-300"
          />

          <input
            type="text"
            name="phone"
            placeholder="Telefone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full h-14 px-4 rounded-xl border border-zinc-300"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white font-semibold text-lg"
          >
            {loading ? 'Criando...' : 'Criar conta'}
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
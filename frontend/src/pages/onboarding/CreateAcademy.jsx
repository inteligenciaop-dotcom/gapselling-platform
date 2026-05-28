import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { useAuth, waitForAcademyLink } from '../../contexts/AuthContext'
import { slugify } from '../../utils/slug'
import logo from '../../assets/logo.png'

const inputClass =
  'w-full h-14 px-4 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-violet-500'

export default function CreateAcademy() {

  const navigate = useNavigate()
  const { loading, session, hasAcademy, refreshAuth } = useAuth()

  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    website: '',
  })

  useEffect(() => {
    if (!loading && !session) {
      navigate('/', { replace: true })
      return
    }

    if (!loading && hasAcademy) {
      navigate('/dashboard', { replace: true })
    }
  }, [loading, session, hasAcademy, navigate])

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!session?.user) {
      navigate('/')
      return
    }

    setSubmitting(true)
    setMessage('')

    const baseSlug = slugify(formData.name)
    const slug = `${baseSlug}-${Date.now().toString(36)}`

    const { data: academyId, error } = await supabase.rpc('create_academy_for_user', {
      p_address: formData.address.trim() || null,
      p_name: formData.name.trim(),
      p_phone: formData.phone.trim() || null,
      p_slug: slug,
      p_website: formData.website.trim() || null,
    })

    if (error) {
      setMessage(error.message)
      setSubmitting(false)
      return
    }

    if (!academyId) {
      setMessage('A academia não foi criada. Tente novamente.')
      setSubmitting(false)
      return
    }

    const linkedProfile = await waitForAcademyLink(refreshAuth)

    if (!linkedProfile?.academy_id) {
      setMessage(
        'Academia criada, mas o vínculo ao perfil não foi confirmado. '
        + 'Atualize a página ou faça login novamente.'
      )
      setSubmitting(false)
      return
    }

    navigate('/dashboard', { replace: true })
  }

  if (loading || hasAcademy) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Carregando...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-zinc-200 p-8"
      >

        <div className="flex flex-col items-center mb-8">

          <img
            src={logo}
            alt="Gap Selling Logo"
            className="w-28 h-28 object-contain"
          />

          <h1 className="text-4xl font-bold text-zinc-900 mt-6">
            Sua Academia
          </h1>

          <p className="text-zinc-500 mt-2 text-center">
            Apenas o nome é obrigatório. Os demais campos podem ser preenchidos depois.
          </p>

        </div>

        <div className="space-y-4">

          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-2">
              Nome da academia *
            </label>
            <input
              type="text"
              name="name"
              placeholder="Ex: Academia FitPro"
              value={formData.name}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-2">
              WhatsApp da academia <span className="font-normal text-zinc-400">(opcional)</span>
            </label>
            <input
              type="text"
              name="phone"
              placeholder="(11) 99999-9999"
              value={formData.phone}
              onChange={handleChange}
              className={inputClass}
            />
            <p className="text-xs text-zinc-400 mt-2">
              Será usado na integração WhatsApp + IA. Pode preencher depois em Configurações.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-2">
              Endereço <span className="font-normal text-zinc-400">(opcional)</span>
            </label>
            <input
              type="text"
              name="address"
              placeholder="Rua, número, bairro"
              value={formData.address}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-2">
              Website <span className="font-normal text-zinc-400">(opcional)</span>
            </label>
            <input
              type="text"
              name="website"
              placeholder="suaacademia.com.br"
              value={formData.website}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-14 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white font-semibold text-lg hover:opacity-90 transition"
          >
            {submitting ? 'Criando...' : 'Criar academia'}
          </button>

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

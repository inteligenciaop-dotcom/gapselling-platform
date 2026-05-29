import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import PageHeader from '../../components/layout/PageHeader'
import AcademyAvatar from '../../components/layout/AcademyAvatar'
import { useAcademySetup } from '../../contexts/AcademySetupContext'
import { useAuth } from '../../contexts/AuthContext'
import {
  fetchAcademySettings,
  updateAcademySettings,
  uploadAcademyLogo,
} from '../../services/academy'

const inputClass =
  'w-full h-12 px-4 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-violet-500'

const textareaClass =
  'w-full min-h-[100px] px-4 py-3 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y'

const emptyProfile = {
  modalities: '',
  plans: '',
  pricing: '',
  differentials: '',
  communication_tone: '',
  description: '',
}

export default function AcademySettings() {

  const navigate = useNavigate()
  const { academy, refreshAuth } = useAuth()
  const { isComplete, refreshSetupStatus } = useAcademySetup()
  const fileInputRef = useRef(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  const [academyData, setAcademyData] = useState({
    name: '',
    phone: '',
    address: '',
    website: '',
    instagram_url: '',
  })

  const [profileData, setProfileData] = useState(emptyProfile)
  const [logoPreview, setLogoPreview] = useState(null)

  useEffect(() => {
    if (!academy?.id) {
      return
    }

    let active = true

    async function loadSettings() {
      setLoading(true)
      setMessage('')

      try {
        const { academy: loadedAcademy, profile } = await fetchAcademySettings(academy.id)

        if (!active) {
          return
        }

        setAcademyData({
          name: loadedAcademy.name ?? '',
          phone: loadedAcademy.phone ?? '',
          address: loadedAcademy.address ?? '',
          website: loadedAcademy.website ?? '',
          instagram_url: loadedAcademy.instagram_url ?? '',
        })
        setProfileData(profile)
        setLogoPreview(loadedAcademy.logo_url ?? null)
      } catch (err) {
        if (active) {
          setMessage(err.message ?? 'Erro ao carregar configurações.')
          setIsError(true)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadSettings()

    return () => {
      active = false
    }
  }, [academy?.id])

  function handleAcademyChange(e) {
    setAcademyData({
      ...academyData,
      [e.target.name]: e.target.value,
    })
  }

  function handleProfileChange(e) {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    })
  }

  async function handleSave(e) {
    e.preventDefault()

    if (!academy?.id) {
      return
    }

    setSaving(true)
    setMessage('')
    setIsError(false)

    try {
      await updateAcademySettings(academy.id, {
        academy: academyData,
        profile: profileData,
      })

      await refreshAuth()
      const setupStatus = await refreshSetupStatus()

      if (setupStatus?.isComplete) {
        setMessage('Configuração concluída! Você já pode usar todas as funções da plataforma.')
      } else {
        setMessage('Configurações salvas. Complete os itens obrigatórios para liberar CRM, leads e campanhas.')
      }
      setIsError(false)
    } catch (err) {
      setMessage(err.message ?? 'Erro ao salvar configurações.')
      setIsError(true)
    } finally {
      setSaving(false)
    }
  }

  async function handleLogoChange(e) {
    const file = e.target.files?.[0]

    if (!file || !academy?.id) {
      return
    }

    setUploadingLogo(true)
    setMessage('')
    setIsError(false)

    try {
      const logoUrl = await uploadAcademyLogo(academy.id, file)
      setLogoPreview(logoUrl)
      await refreshAuth()
      setMessage('Logo atualizada com sucesso!')
      setIsError(false)
    } catch (err) {
      setMessage(err.message ?? 'Erro ao enviar logo.')
      setIsError(true)
    } finally {
      setUploadingLogo(false)
      e.target.value = ''
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader />
        <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-8 max-w-3xl">
          Carregando configurações...
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader />

      {!isComplete && (
        <div className="mb-6 rounded-3xl border border-violet-200 bg-violet-50 p-5">
          <p className="text-sm font-semibold text-violet-800">
            Configuração obrigatória para liberar a plataforma
          </p>
          <p className="text-sm text-violet-700 mt-1">
            Preencha WhatsApp, modalidades, planos, valores e tom de comunicação.
            Esses dados alimentam a IA e as automações comerciais.
          </p>
          <Link
            to="/onboarding/setup"
            className="inline-flex mt-3 text-sm font-semibold text-violet-700 hover:text-violet-900"
          >
            Ver guia de configuração →
          </Link>
        </div>
      )}

      <form
        onSubmit={handleSave}
        className="space-y-6 max-w-3xl"
      >

        {/* Logo */}
        <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-8">
          <h2 className="text-xl font-bold text-zinc-900 mb-2">
            Identidade visual
          </h2>
          <p className="text-zinc-500 mb-6 text-sm">
            A logo aparece no dashboard e na sidebar da plataforma.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Logo da academia"
                className="w-24 h-24 rounded-2xl object-cover border border-zinc-200"
              />
            ) : (
              <AcademyAvatar size="lg" />
            )}

            <div className="flex-1 w-full">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleLogoChange}
                className="hidden"
              />
              <button
                type="button"
                disabled={uploadingLogo}
                onClick={() => fileInputRef.current?.click()}
                className="h-12 px-6 rounded-xl border border-violet-500 text-violet-600 font-semibold hover:bg-violet-50 transition disabled:opacity-60"
              >
                {uploadingLogo ? 'Enviando...' : 'Enviar logo'}
              </button>
              <p className="text-xs text-zinc-400 mt-2">
                PNG, JPG, WEBP ou GIF — máximo 2 MB
              </p>
            </div>
          </div>
        </div>

        {/* Dados da academia */}
        <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-8">
          <h2 className="text-xl font-bold text-zinc-900 mb-2">
            Dados da academia
          </h2>
          <p className="text-zinc-500 mb-6 text-sm">
            Informações básicas exibidas na plataforma e usadas nas integrações.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">
                Nome da academia *
              </label>
              <input
                type="text"
                name="name"
                value={academyData.name}
                onChange={handleAcademyChange}
                required
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-2">
                  WhatsApp da academia
                </label>
                <input
                  type="text"
                  name="phone"
                  placeholder="(11) 99999-9999"
                  value={academyData.phone}
                  onChange={handleAcademyChange}
                  className={inputClass}
                />
                <p className="text-xs text-zinc-400 mt-2">
                  Número usado na integração WhatsApp + IA para conversas com leads.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-2">
                  Website
                </label>
                <input
                  type="text"
                  name="website"
                  placeholder="suaacademia.com.br"
                  value={academyData.website}
                  onChange={handleAcademyChange}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">
                Instagram
              </label>
              <input
                type="text"
                name="instagram_url"
                placeholder="@suaacademia ou instagram.com/suaacademia"
                value={academyData.instagram_url}
                onChange={handleAcademyChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">
                Endereço
              </label>
              <input
                type="text"
                name="address"
                placeholder="Rua, número, bairro, cidade"
                value={academyData.address}
                onChange={handleAcademyChange}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Perfil comercial (IA) */}
        <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-8">
          <h2 className="text-xl font-bold text-zinc-900 mb-2">
            Perfil comercial
          </h2>
          <p className="text-zinc-500 mb-6 text-sm">
            A IA usará estas informações para personalizar conversas com leads no WhatsApp.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">
                Modalidades
              </label>
              <textarea
                name="modalities"
                placeholder="Ex: Musculação, CrossFit, Yoga, Pilates..."
                value={profileData.modalities}
                onChange={handleProfileChange}
                className={textareaClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">
                Planos
              </label>
              <textarea
                name="plans"
                placeholder="Ex: Plano mensal, trimestral, anual, day use..."
                value={profileData.plans}
                onChange={handleProfileChange}
                className={textareaClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">
                Valores
              </label>
              <textarea
                name="pricing"
                placeholder="Ex: Mensal R$ 99, Trimestral R$ 249..."
                value={profileData.pricing}
                onChange={handleProfileChange}
                className={textareaClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">
                Diferenciais
              </label>
              <textarea
                name="differentials"
                placeholder="Ex: Professores certificados, estacionamento, horário 24h..."
                value={profileData.differentials}
                onChange={handleProfileChange}
                className={textareaClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">
                Tom de comunicação
              </label>
              <textarea
                name="communication_tone"
                placeholder="Ex: Amigável e motivacional, direto ao ponto, formal..."
                value={profileData.communication_tone}
                onChange={handleProfileChange}
                className={textareaClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">
                Descrição geral
              </label>
              <textarea
                name="description"
                placeholder="Resumo da academia, público-alvo, proposta de valor..."
                value={profileData.description}
                onChange={handleProfileChange}
                className={textareaClass}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto h-12 px-8 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white font-semibold disabled:opacity-60"
          >
            {saving ? 'Salvando...' : 'Salvar configurações'}
          </button>

          {isComplete && (
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto h-12 px-8 rounded-xl border border-violet-500 text-violet-600 font-semibold hover:bg-violet-50 transition"
            >
              Ir para o dashboard
            </button>
          )}

          {message && (
            <p className={`text-sm ${isError ? 'text-red-500' : 'text-green-600'}`}>
              {message}
            </p>
          )}
        </div>

      </form>
    </div>
  )
}

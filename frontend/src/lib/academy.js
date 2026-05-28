import { supabase } from './supabase'

/** Coluna em `academies` que armazena o WhatsApp da academia (IA + automação). */
export const ACADEMY_WHATSAPP_PHONE_COLUMN = 'phone'

const LOGO_BUCKET = 'academy-logos'
const MAX_LOGO_BYTES = 2 * 1024 * 1024
const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

const EMPTY_PROFILE = {
  modalities: '',
  plans: '',
  pricing: '',
  differentials: '',
  communication_tone: '',
  description: '',
}

function normalizeProfile(profile) {
  if (!profile) {
    return { ...EMPTY_PROFILE }
  }

  return {
    modalities: profile.modalities ?? '',
    plans: profile.plans ?? '',
    pricing: profile.pricing ?? '',
    differentials: profile.differentials ?? '',
    communication_tone: profile.communication_tone ?? '',
    description: profile.description ?? '',
  }
}

/** Normaliza número para uso em integrações WhatsApp (somente dígitos, com DDI). */
export function normalizeWhatsAppPhone(phone) {
  if (!phone?.trim()) {
    return null
  }

  const digits = phone.replace(/\D/g, '')

  if (digits.length < 10) {
    return null
  }

  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`
  }

  return digits
}

/** Retorna o WhatsApp configurado da academia (para IA, campanhas e n8n). */
export function getAcademyWhatsAppPhone(academy) {
  return normalizeWhatsAppPhone(academy?.phone)
}

/** Consulta o WhatsApp da academia no banco — uso em automações futuras. */
export async function fetchAcademyWhatsAppPhone(academyId) {
  const { data, error } = await supabase
    .from('academies')
    .select('phone')
    .eq('id', academyId)
    .single()

  if (error) {
    throw error
  }

  return getAcademyWhatsAppPhone(data)
}

export async function fetchAcademySettings(academyId) {
  const [academyResult, profileResult] = await Promise.all([
    supabase
      .from('academies')
      .select('id, name, slug, logo_url, website, instagram_url, phone, address')
      .eq('id', academyId)
      .single(),
    supabase
      .from('academy_profiles')
      .select('modalities, plans, pricing, differentials, communication_tone, description')
      .eq('academy_id', academyId)
      .maybeSingle(),
  ])

  if (academyResult.error) {
    throw academyResult.error
  }

  if (profileResult.error) {
    throw profileResult.error
  }

  return {
    academy: academyResult.data,
    profile: normalizeProfile(profileResult.data),
  }
}

export async function updateAcademySettings(academyId, { academy, profile }) {
  const { error: academyError } = await supabase
    .from('academies')
    .update({
      name: academy.name.trim(),
      phone: academy.phone?.trim() || null,
      address: academy.address?.trim() || null,
      website: academy.website?.trim() || null,
      instagram_url: academy.instagram_url?.trim() || null,
    })
    .eq('id', academyId)

  if (academyError) {
    throw academyError
  }

  const { error: profileError } = await supabase
    .from('academy_profiles')
    .upsert(
      {
        academy_id: academyId,
        modalities: profile.modalities?.trim() || null,
        plans: profile.plans?.trim() || null,
        pricing: profile.pricing?.trim() || null,
        differentials: profile.differentials?.trim() || null,
        communication_tone: profile.communication_tone?.trim() || null,
        description: profile.description?.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'academy_id' },
    )

  if (profileError) {
    throw profileError
  }
}

function getLogoExtension(file) {
  const fromName = file.name.split('.').pop()?.toLowerCase()

  if (fromName && ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(fromName)) {
    return fromName === 'jpg' ? 'jpeg' : fromName
  }

  const fromType = file.type.split('/')[1]
  return fromType === 'jpg' ? 'jpeg' : fromType
}

export async function uploadAcademyLogo(academyId, file) {
  if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
    throw new Error('Formato inválido. Use PNG, JPG, WEBP ou GIF.')
  }

  if (file.size > MAX_LOGO_BYTES) {
    throw new Error('A imagem deve ter no máximo 2 MB.')
  }

  const extension = getLogoExtension(file)
  const path = `${academyId}/logo.${extension}`

  const { error: uploadError } = await supabase.storage
    .from(LOGO_BUCKET)
    .upload(path, file, {
      upsert: true,
      cacheControl: '3600',
      contentType: file.type,
    })

  if (uploadError) {
    throw uploadError
  }

  const { data: { publicUrl } } = supabase.storage
    .from(LOGO_BUCKET)
    .getPublicUrl(path)

  const logoUrl = `${publicUrl}?t=${Date.now()}`

  const { error: updateError } = await supabase
    .from('academies')
    .update({ logo_url: logoUrl })
    .eq('id', academyId)

  if (updateError) {
    throw updateError
  }

  return logoUrl
}

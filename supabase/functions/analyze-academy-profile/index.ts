import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PROFILE_KEYS = [
  'modalities',
  'plans',
  'pricing',
  'differentials',
  'communication_tone',
  'description',
] as const

const ACADEMY_HINT_KEYS = ['phone', 'address'] as const

type ProfileFields = Record<(typeof PROFILE_KEYS)[number], string>
type AcademyHints = Record<(typeof ACADEMY_HINT_KEYS)[number], string>

type AnalyzeResponse = {
  profile: ProfileFields
  academy: AcademyHints
  sources_read: string[]
  used_ai: boolean
  warning?: string
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function emptyProfile(): ProfileFields {
  return {
    modalities: '',
    plans: '',
    pricing: '',
    differentials: '',
    communication_tone: '',
    description: '',
  }
}

function emptyAcademyHints(): AcademyHints {
  return { phone: '', address: '' }
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
}

function normalizeWebsite(input: string) {
  const trimmed = input.trim()
  if (!trimmed) {
    return null
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  return `https://${trimmed}`
}

function normalizeInstagram(input: string) {
  const trimmed = input.trim()
  if (!trimmed) {
    return null
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/+$/, '') + '/'
  }

  const handle = trimmed
    .replace(/^@/, '')
    .replace(/^instagram\.com\//i, '')
    .replace(/^www\.instagram\.com\//i, '')
    .split(/[/?#]/)[0]

  if (!handle) {
    return null
  }

  return `https://www.instagram.com/${handle}/`
}

function extractMetaContent(html: string, attr: 'name' | 'property', key: string) {
  const pattern = new RegExp(
    `<meta[^>]+${attr}=["']${key}["'][^>]+content=["']([^"']+)["']`,
    'i',
  )
  const reversePattern = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${key}["']`,
    'i',
  )

  const match = html.match(pattern) ?? html.match(reversePattern)
  return match ? decodeHtmlEntities(match[1].trim()) : ''
}

function extractTitle(html: string) {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return match ? decodeHtmlEntities(match[1].trim()) : ''
}

function extractJsonLdBlocks(html: string) {
  const blocks: Record<string, unknown>[] = []
  const regex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let match = regex.exec(html)

  while (match) {
    try {
      const parsed = JSON.parse(match[1])
      if (Array.isArray(parsed)) {
        blocks.push(...parsed)
      } else {
        blocks.push(parsed)
      }
    } catch {
      // ignore invalid JSON-LD
    }
    match = regex.exec(html)
  }

  return blocks
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function pickString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function flattenJsonLdValue(value: unknown): string[] {
  if (typeof value === 'string') {
    return [value.trim()]
  }

  if (Array.isArray(value)) {
    return value.flatMap(flattenJsonLdValue)
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (typeof record.name === 'string') {
      return [record.name.trim()]
    }
  }

  return []
}

function extractFromJsonLd(blocks: Record<string, unknown>[]) {
  const hints = emptyAcademyHints()
  const textParts: string[] = []

  for (const block of blocks) {
    const typeValue = block['@type']
    const types = Array.isArray(typeValue) ? typeValue : [typeValue]
    const typeText = types.map((item) => String(item).toLowerCase()).join(' ')

    if (pickString(block.description)) {
      textParts.push(pickString(block.description))
    }

    if (pickString(block.name)) {
      textParts.push(pickString(block.name))
    }

    if (!hints.phone && pickString(block.telephone)) {
      hints.phone = pickString(block.telephone)
    }

    const address = block.address
    if (!hints.address && typeof address === 'string') {
      hints.address = address.trim()
    } else if (!hints.address && address && typeof address === 'object') {
      const addr = address as Record<string, unknown>
      const parts = [
        pickString(addr.streetAddress),
        pickString(addr.addressLocality),
        pickString(addr.addressRegion),
      ].filter(Boolean)
      if (parts.length) {
        hints.address = parts.join(', ')
      }
    }

    if (typeText.includes('localbusiness') || typeText.includes('sports') || typeText.includes('gym')) {
      if (Array.isArray(block.amenityFeature)) {
        textParts.push(...block.amenityFeature.flatMap(flattenJsonLdValue))
      }
      if (Array.isArray(block.makesOffer)) {
        textParts.push(JSON.stringify(block.makesOffer))
      }
    }
  }

  return { hints, textParts: textParts.filter(Boolean) }
}

function extractPageContent(html: string) {
  const metaParts = [
    extractTitle(html),
    extractMetaContent(html, 'name', 'description'),
    extractMetaContent(html, 'property', 'og:title'),
    extractMetaContent(html, 'property', 'og:description'),
    extractMetaContent(html, 'name', 'twitter:description'),
  ].filter(Boolean)

  const jsonLd = extractFromJsonLd(extractJsonLdBlocks(html))
  const bodyText = stripHtml(html).slice(0, 12000)

  const combined = [...metaParts, ...jsonLd.textParts, bodyText]
    .filter(Boolean)
    .join('\n')
    .slice(0, 18000)

  return {
    text: combined,
    hints: jsonLd.hints,
  }
}

async function fetchPageContent(url: string) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'GapSellingBot/1.0 (+https://gapselling-platform.vercel.app)',
        Accept: 'text/html,application/xhtml+xml',
      },
    })

    if (!response.ok) {
      return null
    }

    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      return null
    }

    const html = await response.text()
    return extractPageContent(html.slice(0, 500000))
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

function findModalitiesInText(text: string) {
  const keywords = [
    'musculação', 'musculacao', 'crossfit', 'yoga', 'pilates', 'funcional',
    'spinning', 'bike', 'boxe', 'muay thai', 'jiu-jitsu', 'jiu jitsu',
    'natação', 'natacao', 'dança', 'danca', 'zumba', 'hiit', 'treino',
    'personal', 'martial', 'artes marciais', 'calistenia', 'alongamento',
  ]

  const lower = text.toLowerCase()
  const found = keywords.filter((word) => lower.includes(word))
  return [...new Set(found.map((item) => item.charAt(0).toUpperCase() + item.slice(1)))].join(', ')
}

function findPricingInText(text: string) {
  const matches = text.match(/R\$\s?\d{1,3}(?:[.\s]\d{3})*(?:,\d{2})?/gi) ?? []
  const unique = [...new Set(matches.map((item) => item.replace(/\s+/g, ' ').trim()))]
  return unique.slice(0, 8).join(' | ')
}

function fallbackAnalyze(text: string, hints: AcademyHints): { profile: ProfileFields; academy: AcademyHints } {
  const profile = emptyProfile()
  const academy = { ...hints }

  profile.description = text.slice(0, 800)
  profile.modalities = findModalitiesInText(text)
  profile.pricing = findPricingInText(text)

  const lower = text.toLowerCase()
  if (lower.includes('professor') || lower.includes('equipe') || lower.includes('estrutura')) {
    profile.differentials = 'Informações sobre equipe e estrutura encontradas no site — revise e complete.'
  }

  profile.communication_tone = 'Amigável e motivacional'

  return { profile, academy }
}

async function analyzeWithOpenAI(text: string, academyName: string): Promise<{ profile: ProfileFields; academy: AcademyHints } | null> {
  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) {
    return null
  }

  const model = Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini'

  const systemPrompt = `Você extrai informações comerciais de academias a partir de textos de sites e Instagram.
Responda APENAS JSON válido, sem markdown.
Use português do Brasil.
Se não encontrar uma informação, use string vazia "".
Não invente preços, planos ou modalidades que não estejam no texto.`

  const userPrompt = `Academia: ${academyName || 'Academia'}

Texto coletado:
${text}

Retorne JSON com exatamente estas chaves:
{
  "modalities": "modalidades encontradas, separadas por vírgula",
  "plans": "planos encontrados",
  "pricing": "valores/preços encontrados",
  "differentials": "diferenciais da academia",
  "communication_tone": "tom de comunicação sugerido com base no conteúdo",
  "description": "descrição geral da academia",
  "phone": "telefone se encontrado",
  "address": "endereço se encontrado"
}`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  })

  if (!response.ok) {
    return null
  }

  const payload = await response.json()
  const content = payload?.choices?.[0]?.message?.content
  if (!content || typeof content !== 'string') {
    return null
  }

  try {
    const parsed = JSON.parse(content)
    const profile = emptyProfile()
    const academy = emptyAcademyHints()

    for (const key of PROFILE_KEYS) {
      profile[key] = pickString(parsed[key])
    }
    for (const key of ACADEMY_HINT_KEYS) {
      academy[key] = pickString(parsed[key])
    }

    return { profile, academy }
  } catch {
    return null
  }
}

function sanitizeOutput(profile: ProfileFields, academy: AcademyHints) {
  const cleanProfile = emptyProfile()
  const cleanAcademy = emptyAcademyHints()

  for (const key of PROFILE_KEYS) {
    cleanProfile[key] = profile[key]?.trim() ?? ''
  }
  for (const key of ACADEMY_HINT_KEYS) {
    cleanAcademy[key] = academy[key]?.trim() ?? ''
  }

  return { profile: cleanProfile, academy: cleanAcademy }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Método não permitido' }, 405)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse({ error: 'Não autenticado' }, 401)
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return jsonResponse({ error: 'Não autenticado' }, 401)
  }

  let body: { website?: string; instagram_url?: string; academy_name?: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'JSON inválido' }, 400)
  }

  const websiteUrl = body.website ? normalizeWebsite(body.website) : null
  const instagramUrl = body.instagram_url ? normalizeInstagram(body.instagram_url) : null

  if (!websiteUrl && !instagramUrl) {
    return jsonResponse({
      error: 'Informe o website ou o Instagram para leitura automática.',
    }, 400)
  }

  const sourcesRead: string[] = []
  const textParts: string[] = []
  const mergedHints = emptyAcademyHints()

  if (websiteUrl) {
    const websiteContent = await fetchPageContent(websiteUrl)
    if (websiteContent?.text) {
      sourcesRead.push('website')
      textParts.push(`=== WEBSITE (${websiteUrl}) ===\n${websiteContent.text}`)
      if (!mergedHints.phone && websiteContent.hints.phone) mergedHints.phone = websiteContent.hints.phone
      if (!mergedHints.address && websiteContent.hints.address) mergedHints.address = websiteContent.hints.address
    }
  }

  if (instagramUrl) {
    const instagramContent = await fetchPageContent(instagramUrl)
    if (instagramContent?.text) {
      sourcesRead.push('instagram')
      textParts.push(`=== INSTAGRAM (${instagramUrl}) ===\n${instagramContent.text}`)
    }
  }

  if (!textParts.length) {
    return jsonResponse({
      error: 'Não foi possível ler o website ou Instagram. Alguns sites bloqueiam leitura automática — preencha manualmente.',
    }, 422)
  }

  const combinedText = textParts.join('\n\n').slice(0, 20000)
  const academyName = body.academy_name?.trim() ?? ''

  let result = fallbackAnalyze(combinedText, mergedHints)
  let usedAi = false

  const aiResult = await analyzeWithOpenAI(combinedText, academyName)
  if (aiResult) {
    result = aiResult
    usedAi = true

    if (!result.academy.phone && mergedHints.phone) result.academy.phone = mergedHints.phone
    if (!result.academy.address && mergedHints.address) result.academy.address = mergedHints.address
  }

  const sanitized = sanitizeOutput(result.profile, result.academy)

  const response: AnalyzeResponse = {
    profile: sanitized.profile,
    academy: sanitized.academy,
    sources_read: sourcesRead,
    used_ai: usedAi,
  }

  if (instagramUrl && !sourcesRead.includes('instagram')) {
    response.warning = 'Instagram pode bloquear leitura automática. Use o website para melhor resultado.'
  } else if (instagramUrl && sourcesRead.includes('instagram') && !usedAi) {
    response.warning = 'Instagram forneceu dados limitados. Revise e complete manualmente.'
  }

  return jsonResponse(response)
})

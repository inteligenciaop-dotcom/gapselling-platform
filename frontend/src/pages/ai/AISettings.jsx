import { useEffect, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import { fetchAIAgentProfiles, updateAIAgentProfile } from '../../services/aiAgents'

export default function AISettings() {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    try {
      setProfiles(await fetchAIAgentProfiles())
    } catch (err) {
      setMessage(err.message ?? 'Erro ao carregar perfis.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function save(profile) {
    await updateAIAgentProfile(profile.id, {
      display_name: profile.display_name,
      system_prompt: profile.system_prompt,
      enabled: profile.enabled,
    })
    setMessage('Perfil salvo.')
    await load()
  }

  return (
    <div>
      <PageHeader />
      {message && <p className="text-sm text-emerald-700 mb-4">{message}</p>}
      {loading ? <p>Carregando...</p> : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {profiles.map((profile) => (
            <div key={profile.id} className="bg-white rounded-3xl border border-zinc-100 p-5 space-y-3">
              <input className="w-full h-11 px-4 rounded-xl border" value={profile.display_name} onChange={(e) => setProfiles((rows) => rows.map((r) => r.id === profile.id ? { ...r, display_name: e.target.value } : r))} />
              <textarea className="w-full min-h-[140px] px-4 py-3 rounded-xl border" value={profile.system_prompt} onChange={(e) => setProfiles((rows) => rows.map((r) => r.id === profile.id ? { ...r, system_prompt: e.target.value } : r))} />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(profile.enabled)} onChange={(e) => setProfiles((rows) => rows.map((r) => r.id === profile.id ? { ...r, enabled: e.target.checked } : r))} />Ativo</label>
              <button type="button" onClick={() => save(profile)} className="w-full h-11 rounded-xl bg-violet-600 text-white">Salvar</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

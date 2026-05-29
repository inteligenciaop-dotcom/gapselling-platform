import { apiFetch } from './api'

export async function fetchAIAgentProfiles() {
  return apiFetch('/api/v1/ai-agents')
}

export async function seedAIAgentProfiles() {
  return apiFetch('/api/v1/ai-agents/seed', { method: 'POST' })
}

export async function updateAIAgentProfile(profileId, payload) {
  return apiFetch('/api/v1/ai-agents/' + profileId, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

import { apiFetch } from './api'

export async function fetchConversations() {
  return apiFetch('/api/v1/conversations')
}

export async function fetchConversation(conversationId) {
  return apiFetch('/api/v1/conversations/' + conversationId)
}

export async function fetchConversationMessages(conversationId) {
  return apiFetch('/api/v1/conversations/' + conversationId + '/messages')
}

export async function takeoverConversation(conversationId) {
  return apiFetch('/api/v1/conversations/' + conversationId + '/takeover', { method: 'POST' })
}

export async function releaseConversation(conversationId) {
  return apiFetch('/api/v1/conversations/' + conversationId + '/release', { method: 'POST' })
}

export async function sendConversationMessage(conversationId, body) {
  return apiFetch('/api/v1/conversations/' + conversationId + '/messages', {
    method: 'POST',
    body: JSON.stringify({ body }),
  })
}

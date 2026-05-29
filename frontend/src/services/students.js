import { apiFetch } from './api'

export async function fetchStudents() {
  return apiFetch('/api/v1/students')
}

export async function createStudent(payload) {
  return apiFetch('/api/v1/students', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function createStudentFromLead(leadId) {
  return apiFetch('/api/v1/students/from-lead/' + leadId, { method: 'POST' })
}

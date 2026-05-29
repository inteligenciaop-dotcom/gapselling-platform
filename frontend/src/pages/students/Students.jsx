import { useEffect, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Modal from '../../components/ui/Modal'
import { createStudent, fetchStudents } from '../../services/students'

export default function Students() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', plan: '' })

  async function load() {
    setLoading(true)
    try { setStudents(await fetchStudents()) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e) {
    e.preventDefault()
    await createStudent(form)
    setShowModal(false)
    setForm({ name: '', phone: '', plan: '' })
    await load()
  }

  return (
    <div>
      <PageHeader />
      <button type="button" onClick={() => setShowModal(true)} className="mb-4 px-4 h-11 rounded-xl bg-violet-600 text-white">Novo aluno</button>
      <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden">
        <table className="w-full text-sm"><thead className="bg-zinc-50"><tr><th className="p-3 text-left">Nome</th><th className="p-3 text-left">Telefone</th><th className="p-3 text-left">Plano</th></tr></thead>
          <tbody>{loading ? <tr><td className="p-3" colSpan={3}>Carregando...</td></tr> : students.map((s) => (
            <tr key={s.id} className="border-t"><td className="p-3">{s.name}</td><td className="p-3">{s.phone || '-'}</td><td className="p-3">{s.plan || '-'}</td></tr>
          ))}</tbody>
        </table>
      </div>
      {showModal && (
        <Modal title="Novo aluno" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreate} className="space-y-3">
            <input className="w-full h-11 px-4 rounded-xl border" placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <input className="w-full h-11 px-4 rounded-xl border" placeholder="Telefone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <input className="w-full h-11 px-4 rounded-xl border" placeholder="Plano" value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })} />
            <button type="submit" className="w-full h-11 rounded-xl bg-violet-600 text-white">Salvar</button>
          </form>
        </Modal>
      )}
    </div>
  )
}

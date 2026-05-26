import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { supabase } from '../lib/supabase'

export default function Dashboard() {

  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)

  useEffect(() => {

    async function loadProfile() {

      // sessão atual
      const { data: sessionData } = await supabase.auth.getSession()

      const user = sessionData.session?.user

      if (!user) {
        navigate('/')
        return
      }

      // buscar profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.log(error)
        return
      }

      setProfile(data)
    }

    loadProfile()

  }, [])

  async function handleLogout() {

    await supabase.auth.signOut()

    navigate('/')
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Carregando dashboard...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-100 flex">

      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-zinc-200 p-6">

        <h1 className="text-3xl font-bold text-violet-600">
          Gap Selling
        </h1>

        <div className="mt-10 space-y-4">

          <button className="w-full text-left p-4 rounded-xl bg-violet-100 text-violet-700 font-semibold">
            Dashboard
          </button>

          <button className="w-full text-left p-4 rounded-xl hover:bg-zinc-100">
            Leads
          </button>

          <button className="w-full text-left p-4 rounded-xl hover:bg-zinc-100">
            WhatsApp IA
          </button>

          <button className="w-full text-left p-4 rounded-xl hover:bg-zinc-100">
            Campanhas
          </button>

        </div>

      </aside>

      {/* Conteúdo */}
      <main className="flex-1 p-10">

        {/* Topo */}
        <div className="flex items-center justify-between mb-10">

          <div>
            <h1 className="text-4xl font-bold text-zinc-900">
              Bem-vindo 👋
            </h1>

            <p className="text-zinc-600 mt-2">
              {profile.login_name}
            </p>

            <p className="text-zinc-500">
              {profile.gym_name}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="h-12 px-6 rounded-xl bg-red-500 text-white font-semibold"
          >
            Logout
          </button>

        </div>

        {/* Cards */}
        <div className="grid grid-cols-3 gap-6">

          <div className="bg-white rounded-3xl p-8 shadow-sm">

            <h2 className="text-zinc-500 text-sm">
              Leads Hoje
            </h2>

            <p className="text-5xl font-bold mt-4">
              24
            </p>

          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm">

            <h2 className="text-zinc-500 text-sm">
              Conversões
            </h2>

            <p className="text-5xl font-bold mt-4">
              8
            </p>

          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm">

            <h2 className="text-zinc-500 text-sm">
              IA Ativa
            </h2>

            <p className="text-5xl font-bold mt-4">
              ON
            </p>

          </div>

        </div>

      </main>

    </div>
  )
}
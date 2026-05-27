import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'

import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import Sidebar from './Sidebar'

export default function AppLayout() {

  const navigate = useNavigate()
  const { refreshAuth } = useAuth()
  const [ready, setReady] = useState(false)

  useEffect(() => {

    let active = true

    async function init() {
      const { profile: latestProfile } = await refreshAuth()

      if (!active) {
        return
      }

      if (!latestProfile?.academy_id) {
        navigate('/onboarding/academy', { replace: true })
        return
      }

      setReady(true)
    }

    init()

    return () => {
      active = false
    }

  }, [refreshAuth, navigate])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        Carregando...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex">

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">

        <header className="flex justify-end px-8 pt-6">
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </header>

        <main className="flex-1 px-8 pb-8 overflow-y-auto">
          <Outlet />
        </main>

      </div>

    </div>
  )
}

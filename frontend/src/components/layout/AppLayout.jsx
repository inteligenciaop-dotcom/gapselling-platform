import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import Sidebar from './Sidebar'

export default function AppLayout() {

  const navigate = useNavigate()
  const location = useLocation()
  const { refreshAuth } = useAuth()
  const [ready, setReady] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : ''

    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
        Carregando...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex">

      <Sidebar
        isMobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">

        <header className="sticky top-0 z-40 bg-zinc-50/95 backdrop-blur border-b border-zinc-200/80 lg:border-b-0 flex items-center justify-between gap-3 px-4 pt-4 pb-4 lg:px-8 lg:pt-6 lg:justify-end">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Abrir menu"
            className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-xl border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <p className="lg:hidden text-base font-bold text-violet-700 truncate flex-1">
            Gap Selling
          </p>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 h-11 px-4 sm:px-5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors shadow-sm shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </header>

        <main className="flex-1 px-4 pb-6 lg:px-8 lg:pb-8 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>

      </div>

    </div>
  )
}

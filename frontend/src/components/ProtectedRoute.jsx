import { Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

import { supabase } from '../lib/supabase'

export default function ProtectedRoute({ children }) {

  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)

  useEffect(() => {

    async function checkSession() {

      const { data } = await supabase.auth.getSession()

      setSession(data.session)

      setLoading(false)
    }

    checkSession()

  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Carregando...
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/" />
  }

  return children
}
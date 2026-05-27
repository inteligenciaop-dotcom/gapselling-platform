import { Navigate } from 'react-router-dom'

import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children }) {

  const { loading, session } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Carregando...
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/" replace />
  }

  return children
}

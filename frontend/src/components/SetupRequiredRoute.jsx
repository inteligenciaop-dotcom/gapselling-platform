import { Navigate, useLocation } from 'react-router-dom'

import { useAcademySetup } from '../contexts/AcademySetupContext'

export default function SetupRequiredRoute({ children }) {
  const location = useLocation()
  const { loading, isComplete } = useAcademySetup()

  if (loading) {
    return (
      <div className="min-h-[320px] flex items-center justify-center text-zinc-500">
        Carregando...
      </div>
    )
  }

  if (!isComplete) {
    return (
      <Navigate
        to="/onboarding/setup"
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  return children
}

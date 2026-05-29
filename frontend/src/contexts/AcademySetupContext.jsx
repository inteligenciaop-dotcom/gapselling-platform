import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { fetchAcademySetupStatus } from '../services/academy'
import { useAuth } from './AuthContext'

const AcademySetupContext = createContext(null)

export function AcademySetupProvider({ children }) {
  const { academy } = useAuth()
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState(null)

  const refreshSetupStatus = useCallback(async () => {
    if (!academy?.id) {
      setStatus(null)
      setLoading(false)
      return null
    }

    setLoading(true)

    try {
      const nextStatus = await fetchAcademySetupStatus(academy.id)
      setStatus(nextStatus)
      return nextStatus
    } catch (err) {
      console.error('Erro ao carregar status de configuração:', err)
      setStatus(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [academy?.id])

  useEffect(() => {
    refreshSetupStatus()
  }, [refreshSetupStatus])

  const value = useMemo(() => ({
    loading,
    checks: status?.checks ?? [],
    completedCount: status?.completedCount ?? 0,
    totalCount: status?.totalCount ?? 0,
    progressPercent: status?.progressPercent ?? 0,
    isComplete: Boolean(status?.isComplete),
    refreshSetupStatus,
  }), [loading, status, refreshSetupStatus])

  return (
    <AcademySetupContext.Provider value={value}>
      {children}
    </AcademySetupContext.Provider>
  )
}

export function useAcademySetup() {
  const context = useContext(AcademySetupContext)

  if (!context) {
    throw new Error('useAcademySetup deve ser usado dentro de AcademySetupProvider')
  }

  return context
}

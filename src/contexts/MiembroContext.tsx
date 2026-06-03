import { createContext, useContext } from 'react'
import type { CurrentMiembro } from '@/hooks/useCurrentMiembro'

interface MiembroContextValue {
  miembro: CurrentMiembro
}

const MiembroContext = createContext<MiembroContextValue | null>(null)

export const MiembroProvider = MiembroContext.Provider

export function useMiembroContext(): MiembroContextValue {
  const ctx = useContext(MiembroContext)
  if (!ctx) throw new Error('useMiembroContext debe usarse dentro de MiembroProvider')
  return ctx
}

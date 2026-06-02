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

/** true si el miembro puede gestionar el fondo (admin/tesorero, NO comité) */
export function useIsAdminOrTesorero(): boolean {
  const { miembro } = useMiembroContext()
  return miembro.rol === 'admin' || miembro.rol === 'tesorero'
}

/** true si el miembro puede aprobar o rechazar solicitudes de préstamo */
export function useCanAprobarPrestamo(): boolean {
  const { miembro } = useMiembroContext()
  return miembro.rol === 'admin' || miembro.rol === 'tesorero' || miembro.rol === 'comite'
}

/** true si el miembro puede ver reportes */
export function useCanVerReportes(): boolean {
  const { miembro } = useMiembroContext()
  return miembro.rol === 'admin' || miembro.rol === 'tesorero' || miembro.rol === 'comite'
}

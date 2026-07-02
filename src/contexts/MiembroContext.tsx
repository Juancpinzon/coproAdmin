import { createContext, useContext } from 'react'
import type { CurrentMiembro } from '@/hooks/useCurrentMiembro'

interface MiembroContextValue {
  // Puede ser null durante el onboarding (aún no hay miembro persistido). En las
  // rutas autenticadas con tenant, App.tsx garantiza que exista antes de montar
  // los consumidores; por eso useMiembro() valida y lo devuelve ya no-nulo.
  miembro: CurrentMiembro | null
}

const MiembroContext = createContext<MiembroContextValue | null>(null)

export const MiembroProvider = MiembroContext.Provider

export function useMiembroContext(): MiembroContextValue {
  const ctx = useContext(MiembroContext)
  if (!ctx) throw new Error('useMiembroContext debe usarse dentro de MiembroProvider')
  return ctx
}

/**
 * Devuelve el miembro autenticado garantizando que no es null. Los consumidores
 * que solo se montan tras el gate de App.tsx (donde el miembro ya existe) deben
 * usar este hook: mueve la garantía del tipo a un único punto en vez de repetir
 * comprobaciones. Lanza si se usa en un contexto sin miembro (invariante roto).
 */
export function useMiembro(): CurrentMiembro {
  const { miembro } = useMiembroContext()
  if (!miembro) throw new Error('useMiembro requiere un miembro autenticado')
  return miembro
}

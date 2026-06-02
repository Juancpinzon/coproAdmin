import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface FiadorOption {
  id: string
  nombre_completo: string
}

/**
 * Retorna los miembros elegibles como fiadores:
 *   - estado = 'activo'
 *   - no tienen préstamo en estado activo / vencido / aprobado
 *   - distinto del solicitante
 */
export function useFiadoresDisponibles(solicitanteId: string) {
  return useQuery<FiadorOption[]>({
    queryKey: ['fiadores-disponibles', solicitanteId],
    enabled:  !!solicitanteId,
    queryFn:  async () => {
      // Todos los miembros activos excepto el solicitante
      const { data: miembros, error: em } = await supabase
        .from('miembros')
        .select('id, nombre_completo')
        .eq('estado', 'activo')
        .neq('id', solicitanteId)

      if (em) throw em

      // Miembros que ya tienen deuda activa (no pueden ser fiadores)
      const { data: conDeuda, error: ep } = await supabase
        .from('prestamos')
        .select('solicitante_id')
        .in('estado', ['activo', 'vencido', 'aprobado'])

      if (ep) throw ep

      const conDeudaIds = new Set((conDeuda ?? []).map((p) => p.solicitante_id))

      return (miembros ?? []).filter((m) => !conDeudaIds.has(m.id))
    },
  })
}

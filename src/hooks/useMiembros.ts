import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Miembro, Prestamo } from '@/types/database'

// Forma que esperan las páginas (compatible con el shape del mock original)
export interface MiembroUI {
  id: string
  nombre: string
  email: string
  telefono: string
  estado: 'al_dia' | 'pendiente' | 'en_mora'
  fechaIngreso: string
  aporteTotal: number
  cuotasPendientes: number
}

function calcularEstadoPago(
  prestamos: Pick<Prestamo, 'estado' | 'cuotas_pagadas' | 'plazo_meses' | 'fecha_aprobacion'>[]
): { estado: MiembroUI['estado']; cuotasPendientes: number } {
  const activos = prestamos.filter(
    (p) => p.estado === 'activo' || p.estado === 'aprobado' || p.estado === 'vencido'
  )

  if (activos.length === 0) {
    return { estado: 'al_dia', cuotasPendientes: 0 }
  }

  // en_mora: tiene algún préstamo marcado como vencido
  const tieneVencido = activos.some((p) => p.estado === 'vencido')
  if (tieneVencido) {
    const totalPendientes = activos.reduce(
      (sum, p) => sum + Math.max(0, p.plazo_meses - p.cuotas_pagadas),
      0
    )
    return { estado: 'en_mora', cuotasPendientes: totalPendientes }
  }

  // pendiente: tiene préstamo activo y va atrasado en pagos
  // "atrasado" = cuotas_pagadas < meses transcurridos desde la aprobación
  for (const p of activos) {
    if (!p.fecha_aprobacion) continue
    const mesesTranscurridos = Math.floor(
      (Date.now() - new Date(p.fecha_aprobacion).getTime()) / (1000 * 60 * 60 * 24 * 30)
    )
    const esperadas = Math.min(mesesTranscurridos, p.plazo_meses)
    if (p.cuotas_pagadas < esperadas) {
      const atrasadas = esperadas - p.cuotas_pagadas
      return { estado: 'pendiente', cuotasPendientes: atrasadas }
    }
  }

  return { estado: 'al_dia', cuotasPendientes: 0 }
}

export function useMiembros() {
  return useQuery<MiembroUI[]>({
    queryKey: ['miembros'],
    queryFn: async () => {
      // Traemos miembros junto con sus préstamos activos/vencidos
      const { data, error } = await supabase
        .from('miembros')
        .select(`
          id,
          nombre_completo,
          email,
          telefono,
          estado,
          aporte_inicial,
          created_at,
          prestamos_activos:prestamos!solicitante_id(
            estado,
            cuotas_pagadas,
            plazo_meses,
            fecha_aprobacion
          )
        `)
        .eq('estado', 'activo')
        .order('nombre_completo')

      if (error) throw error

      return (data as (Miembro & { prestamos_activos: Pick<Prestamo, 'estado' | 'cuotas_pagadas' | 'plazo_meses' | 'fecha_aprobacion'>[] })[]).map(
        (m) => {
          const { estado, cuotasPendientes } = calcularEstadoPago(m.prestamos_activos ?? [])
          return {
            id: m.id,
            nombre: m.nombre_completo,
            email: m.email ?? '',
            telefono: m.telefono ?? '',
            estado,
            fechaIngreso: m.created_at,
            aporteTotal: m.aporte_inicial,
            cuotasPendientes,
          }
        }
      )
    },
  })
}

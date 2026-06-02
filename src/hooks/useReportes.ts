import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { subMonths, startOfMonth, endOfMonth, addMonths, format } from 'date-fns'
import { es } from 'date-fns/locale'

export interface InteresesPorMes {
  mes: string
  intereses: number
}

export interface EstadisticasReporte {
  totalInteresesAcumulados: number
  rentabilidadPct: number
  prestamosActivos: number
  prestamosPagados: number
}

export interface ComportamientoMiembro {
  id: string
  nombre: string
  cuotasPagadasATiempo: number
  cuotasVencidas: number
  totalCuotas: number
  score: number
}

export interface ProyeccionMes {
  mes: string
  interesesProyectados: number
}

export interface DatosReportes {
  interesesPorMes: InteresesPorMes[]
  estadisticas: EstadisticasReporte
  comportamientoMiembros: ComportamientoMiembro[]
  proyeccion: ProyeccionMes[]
}

function calcularScore(pagadasATiempo: number, vencidas: number, total: number): number {
  if (total === 0) return 3
  const pctATiempo = pagadasATiempo / total
  const pctVencidas = vencidas / total
  if (pctATiempo >= 0.95 && pctVencidas === 0) return 5
  if (pctATiempo >= 0.80 && pctVencidas <= 0.05) return 4
  if (pctATiempo >= 0.60 && pctVencidas <= 0.20) return 3
  if (pctATiempo >= 0.40) return 2
  return 1
}

export function useReportes() {
  return useQuery<DatosReportes>({
    queryKey: ['reportes'],
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const ahora = new Date()

      // ─── 1. Intereses pagados por mes (últimos 6 meses) ──────────
      const hace6Meses = startOfMonth(subMonths(ahora, 5))

      const { data: cuotasPagadas, error: e1 } = await supabase
        .from('cuotas_amortizacion')
        .select('interes, fecha_pago')
        .eq('estado', 'pagado')
        .gte('fecha_pago', hace6Meses.toISOString())

      if (e1) throw e1

      // Construir mapa mes → suma intereses
      const mapaIntereses = new Map<string, number>()
      for (let i = 5; i >= 0; i--) {
        const mes = subMonths(ahora, i)
        const key = format(mes, 'yyyy-MM')
        mapaIntereses.set(key, 0)
      }

      for (const cuota of cuotasPagadas ?? []) {
        if (!cuota.fecha_pago) continue
        const key = format(new Date(cuota.fecha_pago), 'yyyy-MM')
        if (mapaIntereses.has(key)) {
          mapaIntereses.set(key, (mapaIntereses.get(key) ?? 0) + (cuota.interes ?? 0))
        }
      }

      const interesesPorMes: InteresesPorMes[] = Array.from(mapaIntereses.entries()).map(
        ([key, intereses]) => ({
          mes: format(new Date(key + '-01'), 'MMM yy', { locale: es }),
          intereses,
        })
      )

      // ─── 2. Total intereses acumulados (histórico) ───────────────
      const { data: todasCuotas, error: e2 } = await supabase
        .from('cuotas_amortizacion')
        .select('interes')
        .eq('estado', 'pagado')

      if (e2) throw e2

      const totalInteresesAcumulados = (todasCuotas ?? []).reduce(
        (acc, c) => acc + (c.interes ?? 0),
        0
      )

      // ─── 3. Capital del fondo (para rentabilidad) ────────────────
      const { data: tenantData, error: e3 } = await supabase
        .from('tenants')
        .select('capital_inicial')
        .limit(1)
        .single()

      if (e3) throw e3
      const capitalBase = tenantData?.capital_inicial ?? 1
      const rentabilidadPct =
        capitalBase > 0 ? (totalInteresesAcumulados / capitalBase) * 100 : 0

      // ─── 4. Conteo de préstamos por estado ──────────────────────
      const { data: prestamosData, error: e4 } = await supabase
        .from('prestamos')
        .select('estado')

      if (e4) throw e4

      const prestamosActivos = (prestamosData ?? []).filter(
        (p) => p.estado === 'activo' || p.estado === 'aprobado'
      ).length
      const prestamosPagados = (prestamosData ?? []).filter(
        (p) => p.estado === 'pagado'
      ).length

      // ─── 5. Comportamiento de pago por miembro ──────────────────
      const { data: miembrosData, error: e5 } = await supabase
        .from('miembros')
        .select('id, nombre_completo')
        .eq('estado', 'activo')

      if (e5) throw e5

      const { data: cuotasDetalle, error: e6 } = await supabase
        .from('cuotas_amortizacion')
        .select(`
          estado,
          fecha_pago,
          fecha_vencimiento,
          prestamo:prestamos!prestamo_id(solicitante_id)
        `)

      if (e6) throw e6

      type CuotaDetalle = {
        estado: string
        fecha_pago: string | null
        fecha_vencimiento: string
        prestamo: { solicitante_id: string } | null
      }

      const comportamientoMiembros: ComportamientoMiembro[] = (miembrosData ?? []).map((m) => {
        const cuotasMiembro = (cuotasDetalle as CuotaDetalle[]).filter(
          (c) => c.prestamo?.solicitante_id === m.id
        )
        const total = cuotasMiembro.length
        const pagadasATiempo = cuotasMiembro.filter(
          (c) =>
            c.estado === 'pagado' &&
            c.fecha_pago !== null &&
            new Date(c.fecha_pago) <= new Date(c.fecha_vencimiento)
        ).length
        const vencidas = cuotasMiembro.filter((c) => c.estado === 'vencido').length

        return {
          id: m.id,
          nombre: m.nombre_completo,
          cuotasPagadasATiempo: pagadasATiempo,
          cuotasVencidas: vencidas,
          totalCuotas: total,
          score: calcularScore(pagadasATiempo, vencidas, total),
        }
      })

      // Ordenar: mejor score primero, luego por nombre
      comportamientoMiembros.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        return a.nombre.localeCompare(b.nombre)
      })

      // ─── 6. Proyección intereses próximos 3 meses ───────────────
      const mapaProyeccion = new Map<string, number>()
      for (let i = 0; i < 3; i++) {
        const mes = addMonths(ahora, i + 1)
        const key = format(mes, 'yyyy-MM')
        mapaProyeccion.set(key, 0)
      }

      const { data: cuotasPendientes, error: e7 } = await supabase
        .from('cuotas_amortizacion')
        .select('interes, fecha_vencimiento')
        .eq('estado', 'pendiente')
        .gte('fecha_vencimiento', startOfMonth(addMonths(ahora, 1)).toISOString())
        .lte('fecha_vencimiento', endOfMonth(addMonths(ahora, 3)).toISOString())

      if (e7) throw e7

      for (const cuota of cuotasPendientes ?? []) {
        const key = format(new Date(cuota.fecha_vencimiento), 'yyyy-MM')
        if (mapaProyeccion.has(key)) {
          mapaProyeccion.set(key, (mapaProyeccion.get(key) ?? 0) + (cuota.interes ?? 0))
        }
      }

      const proyeccion: ProyeccionMes[] = Array.from(mapaProyeccion.entries()).map(
        ([key, interesesProyectados]) => ({
          mes: format(new Date(key + '-01'), 'MMM yy', { locale: es }),
          interesesProyectados,
        })
      )

      return {
        interesesPorMes,
        estadisticas: {
          totalInteresesAcumulados,
          rentabilidadPct,
          prestamosActivos,
          prestamosPagados,
        },
        comportamientoMiembros,
        proyeccion,
      }
    },
  })
}

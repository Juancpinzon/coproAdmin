import { useState } from 'react'
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import { useConsentimientosAdmin, type Consentimiento } from '@/hooks/useConsentimientos'
import { useMiembrosPH } from '@/hooks/useMiembrosPH'
import { useUnidades } from '@/hooks/useUnidades'
import { cn } from '@/lib/utils'

type Filtro = 'todos' | 'aceptados' | 'pendientes'

const ETIQUETA_CANAL: Record<string, string> = {
  web:        'Web',
  portal:     'Portal',
  presencial: 'Presencial',
}

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function buildLatestConsent(lista: Consentimiento[]): Map<string, Consentimiento> {
  const map = new Map<string, Consentimiento>()
  for (const c of lista) {
    const existing = map.get(c.miembro_id)
    if (!existing || new Date(c.fecha) > new Date(existing.fecha)) {
      map.set(c.miembro_id, c)
    }
  }
  return map
}

export default function TablaConsentimientos() {
  const [filtro, setFiltro] = useState<Filtro>('todos')

  const { data: miembros = [],        isLoading: loadingM } = useMiembrosPH()
  const { data: consentimientos = [], isLoading: loadingC } = useConsentimientosAdmin()
  const { data: unidades = [],        isLoading: loadingU } = useUnidades()

  const isLoading = loadingM || loadingC || loadingU

  const unidadPorMiembro = new Map<string, string>()
  for (const u of unidades) {
    if (u.miembro_id && !unidadPorMiembro.has(u.miembro_id)) {
      unidadPorMiembro.set(u.miembro_id, u.numero)
    }
  }

  const latestConsent = buildLatestConsent(consentimientos)

  const rows = miembros.map(m => {
    const consent = latestConsent.get(m.id) ?? null
    return { miembro: m, unidad: unidadPorMiembro.get(m.id) ?? '—', consent, aceptado: consent?.acepto === true }
  })

  const filtered = rows.filter(r => {
    if (filtro === 'aceptados')  return r.aceptado
    if (filtro === 'pendientes') return !r.aceptado
    return true
  })

  const totalAceptados = rows.filter(r => r.aceptado).length

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {(['todos', 'aceptados', 'pendientes'] as Filtro[]).map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={cn(
              'text-xs px-3 py-1 rounded-full border transition-colors',
              filtro === f
                ? 'bg-primary text-primary-foreground border-primary'
                : 'text-muted-foreground hover:text-foreground border-border',
            )}
          >
            {f === 'todos' ? 'Todos' : f === 'aceptados' ? 'Aceptados' : 'Pendientes'}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 py-6 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando consentimientos…
        </div>
      )}

      {!isLoading && (
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {['Nombre', 'Unidad', 'Canal', 'Versión', 'Fecha', 'Estado'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 font-medium text-muted-foreground whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.miembro.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-2.5 font-medium whitespace-nowrap">{r.miembro.nombre_completo}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{r.unidad}</td>
                  <td className="px-4 py-2.5">
                    {r.consent ? (ETIQUETA_CANAL[r.consent.canal] ?? r.consent.canal) : '—'}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs">
                    {r.consent?.version_politica ?? '—'}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs whitespace-nowrap">
                    {r.consent ? formatFecha(r.consent.fecha) : '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    {r.aceptado ? (
                      <span className="flex items-center gap-1 text-green-700 text-xs font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        Aceptado
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-yellow-600 text-xs font-medium">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        Pendiente
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                    No hay miembros en este filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && (
        <p className="text-xs text-muted-foreground">
          {totalAceptados} de {rows.length} miembro{rows.length !== 1 ? 's' : ''}{' '}
          ha{rows.length !== 1 ? 'n' : ''} aceptado la política de tratamiento de datos.
        </p>
      )}
    </div>
  )
}

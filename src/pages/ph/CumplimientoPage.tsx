import { ShieldCheck, FileText, Scale, Loader2 } from 'lucide-react'
import { useObligaciones } from '@/hooks/useObligaciones'
import { useMiembro } from '@/contexts/MiembroContext'
import ObligacionCard from './cumplimiento/ObligacionCard'
import TablaConsentimientos from './cumplimiento/TablaConsentimientos'
import TablaARCO from './cumplimiento/TablaARCO'

// ─── Resumen de semáforo ──────────────────────────────────────────────────────

function ResumenSemaforo({ total, al_dia, proximo, vencido }: {
  total: number; al_dia: number; proximo: number; vencido: number
}) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {vencido > 0 && (
        <span className="flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 border border-red-200 px-2 py-0.5 rounded-full">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          {vencido} vencida{vencido !== 1 ? 's' : ''}
        </span>
      )}
      {proximo > 0 && (
        <span className="flex items-center gap-1 text-xs font-medium text-yellow-700 bg-yellow-100 border border-yellow-200 px-2 py-0.5 rounded-full">
          <span className="h-2 w-2 rounded-full bg-yellow-400" />
          {proximo} próxima{proximo !== 1 ? 's' : ''}
        </span>
      )}
      {al_dia > 0 && (
        <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded-full">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          {al_dia} al día
        </span>
      )}
      <span className="text-xs text-muted-foreground">{total} obligación{total !== 1 ? 'es' : ''} rastreada{total !== 1 ? 's' : ''}</span>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function CumplimientoPage() {
  const miembro = useMiembro()
  const { data: obligaciones = [], isLoading } = useObligaciones()

  const readonly = miembro.rol !== 'admin_ph'

  const al_dia  = obligaciones.filter(o => o.estado === 'al_dia').length
  const proximo = obligaciones.filter(o => o.estado === 'proximo').length
  const vencido = obligaciones.filter(o => o.estado === 'vencido').length

  // Orden de presentación: vencidas → próximas → al día (dentro de cada grupo, por diasRestantes asc)
  const sorted = [...obligaciones].sort((a, b) => {
    const order = { vencido: 0, proximo: 1, al_dia: 2 } as const
    const diff  = order[a.estado] - order[b.estado]
    if (diff !== 0) return diff
    if (a.diasRestantes !== null && b.diasRestantes !== null) return a.diasRestantes - b.diasRestantes
    return 0
  })

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Cumplimiento Legal</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Seguimiento de obligaciones legales del conjunto bajo la Ley 675 de 2001 y la Ley 1581 de 2012.
        </p>
        {readonly && (
          <p className="mt-1 text-xs text-muted-foreground italic">
            Solo el administrador puede editar fechas y subir documentos.
          </p>
        )}
      </div>

      {/* Capítulo 1 — Protección de Datos (Ley 1581) */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 pb-2 border-b">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <div>
            <h2 className="text-base font-semibold">Capítulo 1 — Protección de Datos Personales</h2>
            <p className="text-xs text-muted-foreground">Ley 1581 de 2012 · Decreto 1377 de 2013 · Ente de control: SIC</p>
          </div>
        </div>

        {readonly ? (
          <p className="text-sm text-muted-foreground">
            Solo el administrador puede ver el panel de consentimientos y solicitudes ARCO.
          </p>
        ) : (
          <div className="space-y-8">
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold">Consentimientos de tratamiento</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Estado de aceptación por miembro. Los registros son inmutables una vez guardados.
                </p>
              </div>
              <TablaConsentimientos />
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold">Solicitudes ARCO recibidas</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Plazo legal de respuesta: 10 días hábiles (Ley 1581).
                  Las filas marcadas en rojo tienen 3 días hábiles o menos.
                </p>
              </div>
              <TablaARCO />
            </div>
          </div>
        )}
      </section>

      {/* Capítulo 2 — Obligaciones Ley 675 */}
      <section className="space-y-4">
        <div className="flex items-start justify-between gap-3 pb-2 border-b">
          <div className="flex items-center gap-3">
            <Scale className="h-5 w-5 text-muted-foreground shrink-0" />
            <div>
              <h2 className="text-base font-semibold">Capítulo 2 — Obligaciones Ley 675 de 2001</h2>
              <p className="text-xs text-muted-foreground">Ente de control: Alcaldía / Secretaría · Riesgo: demandas civiles, remoción del admin</p>
            </div>
          </div>
          {!isLoading && obligaciones.length > 0 && (
            <ResumenSemaforo total={obligaciones.length} al_dia={al_dia} proximo={proximo} vencido={vencido} />
          )}
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 py-8 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando obligaciones…
          </div>
        )}

        {!isLoading && obligaciones.length === 0 && (
          <p className="text-sm text-muted-foreground py-4">
            No se encontraron obligaciones registradas. Completa el proceso de onboarding para generarlas automáticamente.
          </p>
        )}

        {!isLoading && sorted.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {sorted.map(o => (
              <ObligacionCard key={o.id} obligacion={o} readonly={readonly} />
            ))}
          </div>
        )}

        {!isLoading && sorted.length > 0 && (
          <p className="text-xs text-muted-foreground italic">
            El estado se calcula en tiempo real comparando la fecha de vencimiento con la fecha actual.
            Actualiza las fechas para mantener el semáforo preciso.
          </p>
        )}
      </section>
    </div>
  )
}

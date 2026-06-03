import { useState } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import {
  useSolicitudesARCOAdmin,
  useActualizarSolicitudARCO,
  ETIQUETAS_ARCO,
  ETIQUETAS_ESTADO_ARCO,
  type SolicitudARCOEnriquecida,
  type EstadoARCO,
} from '@/hooks/useConsentimientos'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { cn, calcularDiasHabilesRestantes } from '@/lib/utils'

function diasHabilesRestantes(fechaLimite: string): number {
  return calcularDiasHabilesRestantes(new Date(fechaLimite))
}

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function DiasLabel({ dias, resuelta }: { dias: number; resuelta: boolean }) {
  if (resuelta) return <span className="text-muted-foreground text-xs">Resuelta</span>
  if (dias < 0) return (
    <span className="text-red-600 font-medium text-xs">
      Venció hace {Math.abs(dias)} h.
      <AlertCircle className="inline h-3.5 w-3.5 ml-1" />
    </span>
  )
  if (dias === 0) return (
    <span className="text-red-600 font-medium text-xs">
      Vence hoy
      <AlertCircle className="inline h-3.5 w-3.5 ml-1" />
    </span>
  )
  if (dias <= 3) return (
    <span className="text-orange-600 font-medium text-xs">
      {dias} día{dias !== 1 ? 's' : ''}
      <AlertCircle className="inline h-3.5 w-3.5 ml-1" />
    </span>
  )
  return <span className="text-xs">{dias} días</span>
}

const ESTADO_BADGE: Record<EstadoARCO, string> = {
  recibida:   'bg-blue-100 text-blue-700 border-blue-200',
  en_tramite: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  resuelta:   'bg-green-100 text-green-700 border-green-200',
}

interface EditState {
  solicitud: SolicitudARCOEnriquecida
  estado: EstadoARCO
  respuesta: string
}

export default function TablaARCO() {
  const { data: solicitudes = [], isLoading } = useSolicitudesARCOAdmin()
  const actualizar = useActualizarSolicitudARCO()
  const [edit, setEdit] = useState<EditState | null>(null)

  function abrirDialog(s: SolicitudARCOEnriquecida) {
    setEdit({ solicitud: s, estado: s.estado, respuesta: s.respuesta ?? '' })
  }

  async function guardar() {
    if (!edit) return
    await actualizar.mutateAsync({
      id: edit.solicitud.id,
      estado: edit.estado,
      respuesta: edit.respuesta.trim() || undefined,
    })
    setEdit(null)
  }

  return (
    <div className="space-y-3">
      {isLoading && (
        <div className="flex items-center gap-2 py-6 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando solicitudes ARCO…
        </div>
      )}

      {!isLoading && solicitudes.length === 0 && (
        <p className="text-sm text-muted-foreground py-4">No hay solicitudes ARCO registradas.</p>
      )}

      {!isLoading && solicitudes.length > 0 && (
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {['Miembro', 'Tipo', 'Fecha', 'Días hábiles', 'Estado', ''].map((h, i) => (
                  <th key={i} className="text-left px-4 py-2.5 font-medium text-muted-foreground whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {solicitudes.map(s => {
                const dias = diasHabilesRestantes(s.fecha_limite)
                const urgente = s.estado !== 'resuelta' && dias <= 3
                const nombre = s.miembros?.nombre_completo ?? 'Miembro desconocido'

                return (
                  <tr key={s.id} className={cn('border-b last:border-0 transition-colors', urgente ? 'bg-red-50/50' : 'hover:bg-muted/20')}>
                    <td className="px-4 py-2.5 font-medium whitespace-nowrap">{nombre}</td>
                    <td className="px-4 py-2.5 text-xs">{ETIQUETAS_ARCO[s.tipo]}</td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs whitespace-nowrap">{formatFecha(s.created_at)}</td>
                    <td className="px-4 py-2.5">
                      <DiasLabel dias={dias} resuelta={s.estado === 'resuelta'} />
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', ESTADO_BADGE[s.estado])}>
                        {ETIQUETAS_ESTADO_ARCO[s.estado]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <button onClick={() => abrirDialog(s)} className="text-xs text-primary hover:underline">
                        {s.estado === 'resuelta' ? 'Ver' : 'Atender'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!edit} onOpenChange={open => { if (!open) setEdit(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Solicitud ARCO — {edit ? ETIQUETAS_ARCO[edit.solicitud.tipo] : ''}
            </DialogTitle>
          </DialogHeader>
          {edit && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground border-l-2 pl-3">{edit.solicitud.descripcion}</p>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Estado</label>
                <Select
                  value={edit.estado}
                  onValueChange={v => setEdit(e => e && { ...e, estado: v as EstadoARCO })}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recibida">Recibida</SelectItem>
                    <SelectItem value="en_tramite">En trámite</SelectItem>
                    <SelectItem value="resuelta">Resuelta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Respuesta al miembro</label>
                <Textarea
                  value={edit.respuesta}
                  onChange={e => setEdit(ev => ev && { ...ev, respuesta: e.target.value })}
                  rows={3}
                  placeholder="Escribir respuesta…"
                  className="text-sm resize-none"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEdit(null)}>Cancelar</Button>
            <Button size="sm" onClick={guardar} disabled={actualizar.isPending}>
              {actualizar.isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

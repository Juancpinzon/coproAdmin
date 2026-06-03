import { useRef, useState, useEffect } from 'react'
import { Loader2, Upload, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/hooks/useTenant'
import {
  useUpdateObligacion,
  ETIQUETAS_OBLIGACION,
  type Obligacion,
  type TipoObligacion,
} from '@/hooks/useObligaciones'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

// ─── Metadatos estáticos por tipo ────────────────────────────────────────────

interface Meta { descripcion: string; frecuencia: string; alerta: string }

const META: Record<TipoObligacion, Meta> = {
  asamblea_ordinaria:  { descripcion: 'Debe realizarse máximo 3 meses después del cierre del ejercicio anual.', frecuencia: 'Anual', alerta: '60 días antes' },
  rendicion_cuentas:   { descripcion: 'Presentación del informe financiero en la asamblea ordinaria.', frecuencia: 'En asamblea', alerta: 'Con convocatoria' },
  presupuesto:         { descripcion: 'Debe estar aprobado por la asamblea antes de ejecutarse.', frecuencia: 'Anual', alerta: 'Al iniciar el año' },
  seguros:             { descripcion: 'Cobertura de áreas comunes y zonas de uso compartido.', frecuencia: 'Anual', alerta: '30 días antes de vencer' },
  estados_financieros: { descripcion: 'Disponibles a solicitud de cualquier propietario en todo momento.', frecuencia: 'Permanente', alerta: 'Siempre activo' },
  reglamento:          { descripcion: 'El reglamento de PH debe estar cargado y accesible.', frecuencia: 'Permanente', alerta: 'Al onboarding' },
}

const ESTADO_STYLES = {
  al_dia:  { dot: 'bg-green-500',  badge: 'bg-green-100 text-green-700 border-green-200' },
  proximo: { dot: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  vencido: { dot: 'bg-red-500',    badge: 'bg-red-100 text-red-700 border-red-200' },
} as const

function diasBadgeText(o: Obligacion): string {
  if (o.diasRestantes === null) return 'Permanente'
  if (o.diasRestantes < 0)     return `Venció hace ${Math.abs(o.diasRestantes)} días`
  if (o.diasRestantes === 0)   return 'Vence hoy'
  return `Vence en ${o.diasRestantes} día${o.diasRestantes === 1 ? '' : 's'}`
}

// ─── Componente ───────────────────────────────────────────────────────────────

interface Props {
  obligacion: Obligacion
  readonly: boolean
}

export default function ObligacionCard({ obligacion, readonly }: Props) {
  const { data: tenant } = useTenant()
  const update = useUpdateObligacion()
  const { toast } = useToast()

  const [localFecha, setLocalFecha] = useState(obligacion.fecha_vencimiento?.slice(0, 10) ?? '')
  const [localNotas, setLocalNotas] = useState(obligacion.notas ?? '')
  const [uploading, setUploading]   = useState(false)
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileRef    = useRef<HTMLInputElement>(null)

  // Sync local state si el servidor devuelve datos frescos
  useEffect(() => { setLocalFecha(obligacion.fecha_vencimiento?.slice(0, 10) ?? '') }, [obligacion.fecha_vencimiento])
  useEffect(() => { setLocalNotas(obligacion.notas ?? '') }, [obligacion.notas])
  useEffect(() => () => { if (notesTimer.current) clearTimeout(notesTimer.current) }, [])

  function handleFechaChange(val: string) {
    setLocalFecha(val)
    update.mutate({ id: obligacion.id, fecha_vencimiento: val || null })
  }

  function handleNotasChange(val: string) {
    setLocalNotas(val)
    if (notesTimer.current) clearTimeout(notesTimer.current)
    notesTimer.current = setTimeout(() => {
      update.mutate({ id: obligacion.id, notas: val || null })
    }, 800)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !tenant?.id) return
    setUploading(true)
    try {
      const ext   = file.name.split('.').pop() ?? 'pdf'
      const path  = `${tenant.id}/${obligacion.tipo}/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('documentos-legales')
        .upload(path, file, { upsert: true })
      if (uploadErr) throw uploadErr
      const { data: { publicUrl } } = supabase.storage
        .from('documentos-legales')
        .getPublicUrl(path)
      await update.mutateAsync({ id: obligacion.id, documento_url: publicUrl })
      toast({ title: 'Documento subido exitosamente' })
    } catch (err: unknown) {
      toast({ title: 'Error subiendo documento', description: err.message, variant: 'destructive' })
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const meta   = META[obligacion.tipo]
  const styles = ESTADO_STYLES[obligacion.estado]

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className={cn('h-2.5 w-2.5 rounded-full shrink-0 mt-0.5', styles.dot)} />
            <CardTitle className="text-sm font-semibold leading-snug">
              {ETIQUETAS_OBLIGACION[obligacion.tipo]}
            </CardTitle>
          </div>
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border shrink-0', styles.badge)}>
            {diasBadgeText(obligacion)}
          </span>
        </div>
        <div className="pl-4 pt-0.5 space-y-0.5">
          <p className="text-xs text-muted-foreground">{meta.descripcion}</p>
          <p className="text-xs text-muted-foreground">📅 {meta.frecuencia} · 🔔 {meta.alerta}</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-1">
        {/* Fecha de vencimiento */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Fecha de vencimiento</label>
          <input
            type="date"
            value={localFecha}
            onChange={e => handleFechaChange(e.target.value)}
            disabled={readonly}
            className={cn(
              'w-full rounded-md border bg-background px-3 min-h-[48px] text-sm',
              'focus:outline-none focus:ring-2 focus:ring-primary/50',
              readonly && 'opacity-60 cursor-not-allowed',
            )}
          />
        </div>

        {/* Documento */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Documento</label>
          <div className="flex items-center gap-2 flex-wrap">
            {obligacion.documento_url ? (
              <a href={obligacion.documento_url} target="_blank" rel="noreferrer"
                className="flex items-center gap-1 text-sm text-primary hover:underline min-h-[48px] px-2">
                <ExternalLink className="h-4 w-4" />
                Ver documento
              </a>
            ) : (
              <span className="text-xs text-muted-foreground">Sin documento</span>
            )}
            {!readonly && (
              <>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground border rounded px-3 min-h-[48px] transition-colors disabled:opacity-50"
                >
                  {uploading
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <Upload className="h-3 w-3" />}
                  {obligacion.documento_url ? 'Reemplazar' : 'Subir'}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </>
            )}
          </div>
        </div>

        {/* Notas */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Notas</label>
          <Textarea
            value={localNotas}
            onChange={e => handleNotasChange(e.target.value)}
            disabled={readonly}
            rows={2}
            placeholder="Agregar notas o recordatorios..."
            className="text-sm resize-none min-h-[48px]"
          />
        </div>
      </CardContent>
    </Card>
  )
}

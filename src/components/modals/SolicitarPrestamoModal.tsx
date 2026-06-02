import { useState, useMemo } from 'react'
import { addMonths, setDate, format } from 'date-fns'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { useSolicitarPrestamo } from '@/hooks/useSolicitarPrestamo'
import { useAprobarPrestamo } from '@/hooks/useAprobarPrestamo'
import { useTenant } from '@/hooks/useTenant'
import { useFiadoresDisponibles } from '@/hooks/useFiadoresDisponibles'
import { useMiembroContext, useIsAdminOrTesorero } from '@/contexts/MiembroContext'
import { calcularCuotaMensual, calcularTotalIntereses } from '@/lib/amortizacion'
import { formatCOP } from '@/lib/mockData'

const PLAZOS = [6, 12, 18, 24]

interface Props {
  open:    boolean
  onClose: () => void
}

/** Computes the next month's cut-off date given tenant.dia_corte */
function fechaPrimerVencimiento(diaCorte: number): string {
  const next = setDate(addMonths(new Date(), 1), diaCorte)
  return format(next, 'yyyy-MM-dd')
}

const SolicitarPrestamoModal = ({ open, onClose }: Props) => {
  const [monto,    setMonto]    = useState('')
  const [plazo,    setPlazo]    = useState('12')
  const [fiadorId, setFiadorId] = useState<string>('none')
  const [motivo,   setMotivo]   = useState('')
  const [confirm,  setConfirm]  = useState(false)

  const { toast }             = useToast()
  const { miembro }           = useMiembroContext()
  const isAdmin               = useIsAdminOrTesorero()
  const { data: tenant }      = useTenant()
  const { data: fiadores, isLoading: fiadoresLoading } = useFiadoresDisponibles(miembro.id)

  const solicitar  = useSolicitarPrestamo()
  const aprobar    = useAprobarPrestamo()

  const isPending  = solicitar.isPending || aprobar.isPending

  const montoNum    = parseInt(monto.replace(/\D/g, '') || '0', 10)
  const plazoNum    = parseInt(plazo, 10)
  const tasa        = tenant?.tasa_interes_mensual ?? 0.02
  const maxPrestamo = tenant?.max_prestamo_por_miembro ?? 10_000_000

  const cuotaMensual = useMemo(
    () => (montoNum > 0 && plazoNum > 0 ? calcularCuotaMensual(montoNum, tasa, plazoNum) : 0),
    [montoNum, plazoNum, tasa]
  )
  const totalIntereses = useMemo(
    () => (montoNum > 0 ? calcularTotalIntereses(montoNum, tasa, plazoNum) : 0),
    [montoNum, tasa, plazoNum]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (montoNum <= 0) {
      toast({ title: 'Ingresa un monto válido', variant: 'destructive' })
      return
    }
    if (montoNum > maxPrestamo) {
      toast({
        title:       'Monto supera el límite',
        description: `El máximo por miembro es ${formatCOP(maxPrestamo)}`,
        variant:     'destructive',
      })
      return
    }
    setConfirm(true)
  }

  const handleConfirm = async () => {
    try {
      const prestamoId = await solicitar.mutateAsync({
        monto:        montoNum,
        plazo_meses:  plazoNum,
        tasa_mensual: tasa,
        fiador_id:    fiadorId !== 'none' ? fiadorId : undefined,
      })

      if (isAdmin) {
        // Admin approves immediately
        const diaCorte = tenant?.dia_corte ?? 1
        await aprobar.mutateAsync({
          prestamoId,
          fechaPrimerVencimiento: fechaPrimerVencimiento(diaCorte),
        })
        toast({
          title:       'Préstamo creado y activado',
          description: 'El préstamo fue creado y la tabla de cuotas generada.',
        })
      } else {
        toast({
          title:       'Solicitud enviada',
          description: 'El administrador recibirá tu solicitud para revisarla.',
        })
      }

      handleClose()
    } catch (err) {
      toast({
        title:       'Error',
        description: err instanceof Error ? err.message : 'Intenta de nuevo',
        variant:     'destructive',
      })
      setConfirm(false)
    }
  }

  const handleClose = () => {
    if (isPending) return
    setMonto('')
    setPlazo('12')
    setFiadorId('none')
    setMotivo('')
    setConfirm(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Solicitar préstamo</DialogTitle>
        </DialogHeader>

        {!confirm ? (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {/* Monto */}
            <div className="space-y-2">
              <Label htmlFor="monto">
                Monto solicitado
                <span className="text-muted-foreground font-normal ml-1">
                  (máx. {formatCOP(maxPrestamo)})
                </span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <Input
                  id="monto"
                  inputMode="numeric"
                  placeholder="0"
                  value={montoNum > 0 ? new Intl.NumberFormat('es-CO').format(montoNum) : ''}
                  onChange={(e) => setMonto(e.target.value.replace(/\D/g, ''))}
                  className="h-12 pl-7"
                />
              </div>
            </div>

            {/* Plazo */}
            <div className="space-y-2">
              <Label>Plazo</Label>
              <Select value={plazo} onValueChange={setPlazo}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLAZOS.map((p) => (
                    <SelectItem key={p} value={String(p)}>
                      {p} meses
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fiador */}
            <div className="space-y-2">
              <Label>
                Fiador
                <span className="text-muted-foreground font-normal ml-1">(opcional)</span>
              </Label>
              {fiadoresLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <Select value={fiadorId} onValueChange={setFiadorId}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Seleccionar fiador…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin fiador</SelectItem>
                    {(fiadores ?? []).map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.nombre_completo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Motivo */}
            <div className="space-y-2">
              <Label htmlFor="motivo">
                Motivo
                <span className="text-muted-foreground font-normal ml-1">(opcional)</span>
              </Label>
              <Textarea
                id="motivo"
                placeholder="Describe brevemente el destino del préstamo…"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>

            {/* Preview en tiempo real */}
            {montoNum > 0 && (
              <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
                <p className="font-medium text-foreground mb-2">Resumen del préstamo</p>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cuota mensual</span>
                  <span className="font-mono font-semibold text-primary">{formatCOP(cuotaMensual)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tasa mensual</span>
                  <span className="font-mono">{(tasa * 100).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total intereses</span>
                  <span className="font-mono text-warning">{formatCOP(totalIntereses)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 font-semibold">
                  <span>Total a pagar</span>
                  <span className="font-mono">{formatCOP(montoNum + totalIntereses)}</span>
                </div>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button type="submit" disabled={montoNum <= 0}>Revisar</Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-border p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monto</span>
                <strong className="font-mono">{formatCOP(montoNum)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plazo</span>
                <strong>{plazoNum} meses</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cuota mensual</span>
                <strong className="font-mono text-primary">{formatCOP(cuotaMensual)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total intereses</span>
                <strong className="font-mono text-warning">{formatCOP(totalIntereses)}</strong>
              </div>
              {fiadorId !== 'none' && fiadores && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fiador</span>
                  <strong>{fiadores.find((f) => f.id === fiadorId)?.nombre_completo ?? '—'}</strong>
                </div>
              )}
            </div>

            {isAdmin ? (
              <p className="text-sm text-muted-foreground">
                Como administrador, el préstamo se creará directamente en estado <strong>activo</strong> y se generará la tabla de cuotas automáticamente.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Tu solicitud quedará pendiente hasta que el administrador la apruebe o rechace.
              </p>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirm(false)} disabled={isPending}>
                Editar
              </Button>
              <Button onClick={handleConfirm} disabled={isPending}>
                {isPending
                  ? (isAdmin ? 'Creando…' : 'Enviando…')
                  : (isAdmin ? 'Crear préstamo' : 'Enviar solicitud')}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default SolicitarPrestamoModal

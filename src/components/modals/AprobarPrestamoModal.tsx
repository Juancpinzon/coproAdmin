import { useState } from 'react'
import { addMonths, format, setDate } from 'date-fns'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useAprobarPrestamo } from '@/hooks/useAprobarPrestamo'
import { useTenant } from '@/hooks/useTenant'
import { formatCOP } from '@/lib/mockData'
import type { PrestamoUI } from '@/hooks/usePrestamos'

interface Props {
  prestamo: PrestamoUI | null
  open:     boolean
  onClose:  () => void
}

const AprobarPrestamoModal = ({ prestamo, open, onClose }: Props) => {
  const { data: tenant }   = useTenant()
  const { mutateAsync, isPending } = useAprobarPrestamo()
  const { toast }          = useToast()

  // Default: día de corte del fondo, próximo mes
  const diaCorteFondo = tenant?.dia_corte ?? 15
  const defaultFecha  = format(
    setDate(addMonths(new Date(), 1), diaCorteFondo),
    'yyyy-MM-dd'
  )
  const [fechaVencimiento, setFechaVencimiento] = useState(defaultFecha)

  if (!prestamo) return null

  const handleConfirm = async () => {
    try {
      await mutateAsync({
        prestamoId:             prestamo.id,
        fechaPrimerVencimiento: fechaVencimiento,
      })
      toast({
        title:       'Préstamo aprobado',
        description: `Se generó la tabla de cuotas para ${prestamo.miembroNombre}`,
      })
      onClose()
    } catch (err) {
      toast({
        title:       'Error al aprobar',
        description: err instanceof Error ? err.message : 'Intenta de nuevo',
        variant:     'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => { if (!isPending) onClose() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Aprobar préstamo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Resumen */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Solicitante</span>
              <strong>{prestamo.miembroNombre}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monto</span>
              <strong className="font-mono">{formatCOP(prestamo.montoOriginal)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plazo</span>
              <strong>{prestamo.cuotasMensuales} meses</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cuota mensual</span>
              <strong className="font-mono text-primary">
                {formatCOP(Math.round((prestamo.montoOriginal * prestamo.tasaInteres / 100) /
                  (1 - Math.pow(1 + prestamo.tasaInteres / 100, -prestamo.cuotasMensuales))))}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tasa mensual</span>
              <strong>{prestamo.tasaInteres}%</strong>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fecha">Primera fecha de vencimiento</Label>
            <Input
              id="fecha"
              type="date"
              value={fechaVencimiento}
              onChange={(e) => setFechaVencimiento(e.target.value)}
              className="h-12"
              min={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Al aprobar se generará la tabla de cuotas y se registrará el desembolso de{' '}
            <strong className="font-mono">{formatCOP(prestamo.montoOriginal)}</strong> en el fondo.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isPending}>
            {isPending ? 'Aprobando…' : 'Sí, aprobar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AprobarPrestamoModal

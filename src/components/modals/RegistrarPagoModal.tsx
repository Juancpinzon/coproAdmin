import { useState } from 'react'
import { format } from 'date-fns'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useRegistrarPagoCuota } from '@/hooks/useCuotasAmortizacion'
import { formatCOP } from '@/lib/mockData'
import type { CuotaAmortizacion } from '@/types/database'

interface Props {
  cuota:      CuotaAmortizacion | null
  prestamoId: string
  open:       boolean
  onClose:    () => void
}

const RegistrarPagoModal = ({ cuota, prestamoId, open, onClose }: Props) => {
  const [fechaPago, setFechaPago] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [notas, setNotas]         = useState('')
  const { toast }                 = useToast()
  const { mutateAsync, isPending } = useRegistrarPagoCuota()

  if (!cuota) return null

  const handleConfirm = async () => {
    try {
      await mutateAsync({ cuotaId: cuota.id, prestamoId, fechaPago, notas: notas || undefined })
      toast({
        title:       'Pago registrado',
        description: `Cuota ${cuota.numero_cuota} — ${formatCOP(cuota.cuota_total)}`,
      })
      setNotas('')
      onClose()
    } catch (err) {
      toast({
        title:       'Error al registrar pago',
        description: err instanceof Error ? err.message : 'Intenta de nuevo',
        variant:     'destructive',
      })
    }
  }

  const handleClose = () => {
    if (isPending) return
    setNotas('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Registrar pago — Cuota {cuota.numero_cuota}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Desglose de la cuota */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Capital</span>
              <span className="font-mono">{formatCOP(cuota.capital)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Interés</span>
              <span className="font-mono">{formatCOP(cuota.interes)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 font-semibold">
              <span>Total cuota</span>
              <span className="font-mono text-primary">{formatCOP(cuota.cuota_total)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fecha">Fecha de pago</Label>
            <Input
              id="fecha"
              type="date"
              value={fechaPago}
              onChange={(e) => setFechaPago(e.target.value)}
              className="h-12"
              max={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas (opcional)</Label>
            <Input
              id="notas"
              placeholder="ej: Pago en efectivo"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="h-12"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isPending}>
            {isPending ? 'Registrando…' : `Confirmar — ${formatCOP(cuota.cuota_total)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default RegistrarPagoModal

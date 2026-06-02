import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useRechazarPrestamo } from '@/hooks/useRechazarPrestamo'
import { formatCOP } from '@/lib/mockData'
import type { PrestamoUI } from '@/hooks/usePrestamos'

interface Props {
  prestamo: PrestamoUI | null
  open:     boolean
  onClose:  () => void
}

const RechazarPrestamoModal = ({ prestamo, open, onClose }: Props) => {
  const [motivo, setMotivo]        = useState('')
  const { toast }                  = useToast()
  const { mutateAsync, isPending } = useRechazarPrestamo()

  if (!prestamo) return null

  const handleConfirm = async () => {
    if (!motivo.trim()) {
      toast({ title: 'El motivo es requerido', variant: 'destructive' })
      return
    }
    try {
      await mutateAsync({ prestamoId: prestamo.id, motivo: motivo.trim() })
      toast({
        title:       'Préstamo rechazado',
        description: `Solicitud de ${prestamo.miembroNombre} cancelada`,
      })
      setMotivo('')
      onClose()
    } catch (err) {
      toast({
        title:       'Error al rechazar',
        description: err instanceof Error ? err.message : 'Intenta de nuevo',
        variant:     'destructive',
      })
    }
  }

  const handleClose = () => {
    if (isPending) return
    setMotivo('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Rechazar solicitud</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Rechazarás la solicitud de <strong>{prestamo.miembroNombre}</strong> por{' '}
            <strong className="font-mono">{formatCOP(prestamo.montoOriginal)}</strong>.
            Esta acción no se puede deshacer.
          </p>

          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo del rechazo *</Label>
            <Textarea
              id="motivo"
              placeholder="ej: El saldo disponible del fondo no es suficiente…"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending || !motivo.trim()}
          >
            {isPending ? 'Rechazando…' : 'Rechazar préstamo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default RechazarPrestamoModal

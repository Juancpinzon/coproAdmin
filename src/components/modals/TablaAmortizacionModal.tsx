import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCuotasAmortizacion } from '@/hooks/useCuotasAmortizacion'
import { useIsAdminOrTesorero } from '@/contexts/MiembroContext'
import { formatCOP } from '@/lib/mockData'
import type { CuotaAmortizacion } from '@/types/database'
import RegistrarPagoModal from './RegistrarPagoModal'

const estadoBadge = {
  pendiente: { label: 'Pendiente', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  pagado:    { label: 'Pagado',    className: 'bg-success/10 text-success border-success/20' },
  vencido:   { label: 'Vencido',   className: 'bg-destructive/10 text-destructive border-destructive/20' },
}

interface Props {
  prestamoId:    string | null
  miembroNombre: string
  open:          boolean
  onClose:       () => void
  soloLectura?:  boolean  // true para rol=miembro (sin botón de pago)
}

const TablaAmortizacionModal = ({
  prestamoId,
  miembroNombre,
  open,
  onClose,
  soloLectura = false,
}: Props) => {
  const isAdmin = useIsAdminOrTesorero()
  const { data: cuotas, isLoading } = useCuotasAmortizacion(open ? prestamoId : null)
  const [pagarCuota, setPagarCuota] = useState<CuotaAmortizacion | null>(null)

  const puedeRegistrarPago = isAdmin && !soloLectura

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Tabla de amortización — {miembroNombre}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-auto">
            {isLoading && (
              <div className="space-y-2 py-2">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            )}

            {!isLoading && (!cuotas || cuotas.length === 0) && (
              <p className="text-center text-muted-foreground py-8 text-sm">
                Sin cuotas generadas. Aprueba el préstamo para generar la tabla.
              </p>
            )}

            {cuotas && cuotas.length > 0 && (() => {
              // Saldo pendiente acumulado: capital total − suma de capital hasta cada fila
              const capitalTotal = cuotas.reduce((s, c) => s + c.capital, 0)
              let capitalAcumulado = 0
              const saldos = cuotas.map((c) => {
                capitalAcumulado += c.capital
                return capitalTotal - capitalAcumulado
              })

              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground text-xs">
                        <th className="text-left py-2 px-2 w-10">#</th>
                        <th className="text-left py-2 px-2">Fecha vto.</th>
                        <th className="text-right py-2 px-2">Capital</th>
                        <th className="text-right py-2 px-2">Interés</th>
                        <th className="text-right py-2 px-2">Total</th>
                        <th className="text-right py-2 px-2">Saldo</th>
                        <th className="text-center py-2 px-2">Estado</th>
                        {puedeRegistrarPago && <th className="py-2 px-2" />}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {cuotas.map((c, i) => {
                        const badge = estadoBadge[c.estado]
                        const esPagable = c.estado !== 'pagado' && puedeRegistrarPago
                        const saldo = saldos[i] ?? 0
                        return (
                          <tr
                            key={c.id}
                            className={c.estado === 'pagado' ? 'opacity-50' : ''}
                          >
                            <td className="py-2.5 px-2 text-muted-foreground">{c.numero_cuota}</td>
                            <td className="py-2.5 px-2 whitespace-nowrap">
                              {new Date(c.fecha_vencimiento + 'T12:00:00').toLocaleDateString('es-CO', {
                                day: '2-digit', month: 'short', year: 'numeric',
                              })}
                            </td>
                            <td className="py-2.5 px-2 text-right font-mono">{formatCOP(c.capital)}</td>
                            <td className="py-2.5 px-2 text-right font-mono">{formatCOP(c.interes)}</td>
                            <td className="py-2.5 px-2 text-right font-mono font-semibold">
                              {formatCOP(c.cuota_total)}
                            </td>
                            <td className="py-2.5 px-2 text-right font-mono text-muted-foreground">
                              {formatCOP(saldo)}
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <Badge variant="outline" className={`text-xs ${badge.className}`}>
                                {badge.label}
                              </Badge>
                            </td>
                            {puedeRegistrarPago && (
                              <td className="py-2.5 px-2">
                                {esPagable && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs"
                                    onClick={() => setPagarCuota(c)}
                                  >
                                    Pagar
                                  </Button>
                                )}
                              </td>
                            )}
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-border font-semibold text-sm">
                        <td colSpan={2} className="py-2.5 px-2 text-muted-foreground">Total</td>
                        <td className="py-2.5 px-2 text-right font-mono">
                          {formatCOP(capitalTotal)}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-warning">
                          {formatCOP(cuotas.reduce((s, c) => s + c.interes, 0))}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-primary">
                          {formatCOP(cuotas.reduce((s, c) => s + c.cuota_total, 0))}
                        </td>
                        <td colSpan={puedeRegistrarPago ? 3 : 2} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {prestamoId && (
        <RegistrarPagoModal
          cuota={pagarCuota}
          prestamoId={prestamoId}
          open={!!pagarCuota}
          onClose={() => setPagarCuota(null)}
        />
      )}
    </>
  )
}

export default TablaAmortizacionModal

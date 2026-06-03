import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { useCuotasAdmin, useGenerarCuotas, useRegistrarPagoCuota, type CuotaAdmin } from "@/hooks/useCuotasAdmin"
import { useUnidades } from "@/hooks/useUnidades"
import { useTenant } from "@/hooks/useTenant"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { format, addMonths } from "date-fns"
import { es } from "date-fns/locale"

const generateMonthOptions = () => {
  const options = []
  const today = new Date()
  for (let i = -6; i <= 12; i++) {
    const date = addMonths(today, i)
    let label = format(date, "MMMM 'de' yyyy", { locale: es })
    label = label.charAt(0).toUpperCase() + label.slice(1)
    options.push({
      value: format(date, "yyyy-MM"),
      label
    })
  }
  return options
}

const monthOptions = generateMonthOptions()

export default function CobrosPage() {
  const [periodo, setPeriodo] = useState(() => new Date().toISOString().slice(0, 7))
  const { data: cuotas = [], isLoading } = useCuotasAdmin(periodo)
  const { data: unidades = [] } = useUnidades()
  const { data: tenant } = useTenant()
  
  const generarCuotas = useGenerarCuotas()
  const registrarPago = useRegistrarPagoCuota()
  const { toast } = useToast()

  const [openGenerateDialog, setOpenGenerateDialog] = useState(false)
  const [openPagoDialog, setOpenPagoDialog] = useState(false)
  const [selectedCuota, setSelectedCuota] = useState<string | null>(null)
  const [modo, setModo] = useState<"fija" | "coeficiente">("fija")
  
  const [fechaPago, setFechaPago] = useState(() => new Date().toISOString().slice(0, 10))
  const [comprobanteUrl, setComprobanteUrl] = useState("")

  const formatCOP = (monto: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(monto)

  const cuotaBase = tenant?.cuota_mensual || 0
  
  // Resumen
  const totalCuotas = cuotas.length
  const cuotasPagadas = cuotas.filter(c => c.estado === 'pagado').length
  const cuotasPendientes = cuotas.filter(c => c.estado === 'pendiente' || c.estado === 'vencido').length
  
  const montoRecaudado = cuotas.filter(c => c.estado === 'pagado').reduce((acc, c) => acc + c.monto, 0)
  const montoEsperado = cuotas.reduce((acc, c) => acc + c.monto, 0)

  // Previsualización de generación
  const activeUnidades = unidades
  const previewCount = activeUnidades.length
  const previewTotal = modo === "fija"
    ? previewCount * cuotaBase
    : activeUnidades.reduce((acc, u) => acc + Math.round(cuotaBase * ((u.coeficiente || 0) / 100)), 0)

  const yaExistenCuotas = totalCuotas > 0

  function exportarCSV(cuotas: CuotaAdmin[], periodo: string) {
    const headers = ['Unidad', 'Tipo', 'Monto', 'Estado', 'Fecha Pago']
    const rows = cuotas.map(c => [
      c.unidades?.numero ?? '',
      c.unidades?.tipo ?? '',
      c.monto,
      c.estado,
      c.fecha_pago ?? ''
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cobros-${periodo}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportarExcel(cuotas: CuotaAdmin[], periodo: string) {
    const data = cuotas.map(c => ({
      Unidad: c.unidades?.numero ?? '',
      Tipo: c.unidades?.tipo ?? '',
      Monto: c.monto,
      Estado: c.estado,
      'Fecha Pago': c.fecha_pago ?? ''
    }))
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Cobros")
    XLSX.writeFile(workbook, `cobros-${periodo}.xlsx`)
  }

  function exportarPDF(cuotas: CuotaAdmin[], periodo: string) {
    const doc = new jsPDF()
    doc.text(`Reporte de Cobros - ${periodo}`, 14, 15)
    
    const tableData = cuotas.map(c => [
      c.unidades?.numero ?? '',
      c.unidades?.tipo ?? '',
      new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(c.monto),
      c.estado,
      c.fecha_pago ?? '-'
    ])
    
    ;(doc as unknown).autoTable({
      startY: 20,
      head: [['Unidad', 'Tipo', 'Monto', 'Estado', 'Fecha Pago']],
      body: tableData,
    })
    
    doc.save(`cobros-${periodo}.pdf`)
  }

  const handleConfirmarGenerar = async () => {
    if (!tenant) return
    try {
      await generarCuotas.mutateAsync({
        tenant_id: tenant.id,
        periodo,
        cuota_base: cuotaBase,
        unidades: activeUnidades.map(u => ({ id: u.id, coeficiente: u.coeficiente || 0 })),
        modo
      })
      toast({ title: "Cuotas generadas exitosamente" })
      setOpenGenerateDialog(false)
    } catch (e: unknown) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    }
  }

  const handlePago = async () => {
    if (!selectedCuota) return
    try {
      await registrarPago.mutateAsync({
        cuota_id: selectedCuota,
        fecha_pago: fechaPago,
        comprobante_url: comprobanteUrl || undefined
      })
      toast({ title: "Pago registrado" })
      setOpenPagoDialog(false)
    } catch (e: unknown) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Cobros</h1>
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={cuotas.length === 0}>
                Exportar <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => exportarExcel(cuotas, periodo)}>
                Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportarPDF(cuotas, periodo)}>
                PDF (.pdf)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportarCSV(cuotas, periodo)}>
                CSV (.csv)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            className="min-h-[48px]"
            onClick={() => setOpenGenerateDialog(true)} 
            disabled={yaExistenCuotas || !tenant || previewCount === 0}
          >
            {yaExistenCuotas ? "Ya existen cuotas para este periodo" : "Generar cuotas"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-muted-foreground">Total Cuotas</div>
            <div className="text-2xl font-bold">{totalCuotas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-muted-foreground">Pagadas / Pendientes</div>
            <div className="text-2xl font-bold">{cuotasPagadas} / {cuotasPendientes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-muted-foreground">Recaudado</div>
            <div className="text-2xl font-bold text-green-600">{formatCOP(montoRecaudado)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-muted-foreground">Esperado</div>
            <div className="text-2xl font-bold">{formatCOP(montoEsperado)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border">
            {/* Desktop Table */}
            <table className="hidden md:table w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/50">
                <tr>
                  <th className="px-6 py-3">Unidad</th>
                  <th className="px-6 py-3">Monto (COP)</th>
                  <th className="px-6 py-3">Estado</th>
                  <th className="px-6 py-3">Fecha pago</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cuotas.map((cuota) => (
                  <tr key={cuota.id} className="border-b">
                    <td className="px-6 py-4">{cuota.unidades?.numero} ({cuota.unidades?.tipo})</td>
                    <td className="px-6 py-4 font-medium">{formatCOP(cuota.monto)}</td>
                    <td className="px-6 py-4">
                      <Badge variant={cuota.estado === 'pagado' ? 'default' : cuota.estado === 'vencido' ? 'destructive' : 'secondary'}
                             className={cuota.estado === 'pendiente' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : cuota.estado === 'pagado' ? 'bg-green-600 hover:bg-green-700' : ''}>
                        {cuota.estado}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">{cuota.fecha_pago || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      {cuota.estado !== 'pagado' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="min-h-[48px] px-4"
                          onClick={() => {
                            setSelectedCuota(cuota.id)
                            setFechaPago(new Date().toISOString().slice(0, 10))
                            setComprobanteUrl("")
                            setOpenPagoDialog(true)
                          }}
                        >
                          Registrar pago
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {cuotas.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      No hay cuotas generadas para este periodo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y">
              {cuotas.map((cuota) => (
                <div key={cuota.id} className="p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">
                      {cuota.unidades?.numero} <span className="text-sm font-normal text-muted-foreground">({cuota.unidades?.tipo})</span>
                    </span>
                    <Badge variant={cuota.estado === 'pagado' ? 'default' : cuota.estado === 'vencido' ? 'destructive' : 'secondary'}
                           className={cuota.estado === 'pendiente' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : cuota.estado === 'pagado' ? 'bg-green-600 hover:bg-green-700' : ''}>
                      {cuota.estado}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Monto</span>
                    <span className="font-medium">{formatCOP(cuota.monto)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Fecha pago</span>
                    <span>{cuota.fecha_pago || '-'}</span>
                  </div>
                  {cuota.estado !== 'pagado' && (
                    <Button 
                      variant="outline" 
                      className="w-full mt-2 min-h-[48px]"
                      onClick={() => {
                        setSelectedCuota(cuota.id)
                        setFechaPago(new Date().toISOString().slice(0, 10))
                        setComprobanteUrl("")
                        setOpenPagoDialog(true)
                      }}
                    >
                      Registrar pago
                    </Button>
                  )}
                </div>
              ))}
              {cuotas.length === 0 && !isLoading && (
                <div className="p-8 text-center text-muted-foreground">
                  No hay cuotas generadas para este periodo.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={openGenerateDialog} onOpenChange={setOpenGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generar Cuotas Mensuales</DialogTitle>
            <DialogDescription>
              Se generarán {previewCount} cuotas. Selecciona el modo de cobro.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Modo de cobro</Label>
              <Select value={modo} onValueChange={(val: string) => setModo(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fija">Cuota Fija ({formatCOP(cuotaBase)} c/u)</SelectItem>
                  <SelectItem value="coeficiente">Por Coeficiente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm font-medium mt-4 p-4 bg-muted/50 rounded-md">
              Total proyectado a recaudar: {formatCOP(previewTotal)}
            </div>
          </div>
          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" className="min-h-[48px]" onClick={() => setOpenGenerateDialog(false)}>Cancelar</Button>
            <Button className="min-h-[48px]" onClick={handleConfirmarGenerar} disabled={generarCuotas.isPending}>
              Confirmar y generar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openPagoDialog} onOpenChange={setOpenPagoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Fecha de pago</Label>
              <Input 
                type="date" 
                value={fechaPago} 
                onChange={(e) => setFechaPago(e.target.value)}
                className="min-h-[48px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Comprobante URL (opcional)</Label>
              <Input 
                type="text" 
                placeholder="https://..."
                value={comprobanteUrl} 
                onChange={(e) => setComprobanteUrl(e.target.value)}
                className="min-h-[48px]"
              />
            </div>
            <Button onClick={handlePago} disabled={registrarPago.isPending} className="w-full min-h-[48px]">
              Registrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

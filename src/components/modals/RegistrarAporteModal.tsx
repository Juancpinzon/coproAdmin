import { useState, useRef } from 'react'
import { format, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useRegistrarAporte } from '@/hooks/useRegistrarAporte'
import { useTenant } from '@/hooks/useTenant'
import { formatCOP } from '@/lib/mockData'
import { ImagePlus, X } from 'lucide-react'

const MAX_FILE_BYTES = 5 * 1024 * 1024  // 5 MB

// Genera los últimos 12 meses como opciones
function getMeses(): Array<{ value: string; label: string }> {
  const hoy = new Date()
  return Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(hoy, i)
    return {
      value: format(d, 'yyyy-MM'),
      label: format(d, 'MMMM yyyy', { locale: es }),
    }
  })
}

interface Props {
  open:      boolean
  onClose:   () => void
  miembroId: string
  nombre:    string
}

const RegistrarAporteModal = ({ open, onClose, miembroId, nombre }: Props) => {
  const meses = getMeses()
  const [mes, setMes]         = useState(meses[0]?.value ?? '')
  const [monto, setMonto]     = useState('')
  const [file, setFile]       = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [confirm, setConfirm] = useState(false)
  const fileRef               = useRef<HTMLInputElement>(null)
  const { toast }             = useToast()
  const { mutateAsync, isPending } = useRegistrarAporte()
  const { data: tenant }      = useTenant()

  // Pre-llenar monto con cuota del fondo cuando carga el tenant
  const cuotaDefault = tenant?.cuota_mensual ?? 0
  const montoNum = parseInt(monto.replace(/\D/g, '') || String(cuotaDefault), 10)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    if (!f) return
    if (f.size > MAX_FILE_BYTES) {
      toast({ title: 'Archivo muy grande', description: 'Máximo 5 MB', variant: 'destructive' })
      return
    }
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const removeFile = () => {
    setFile(null)
    setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (montoNum <= 0) {
      toast({ title: 'Monto inválido', variant: 'destructive' })
      return
    }
    setConfirm(true)
  }

  const handleConfirm = async () => {
    const mesLabel = meses.find((m) => m.value === mes)?.label ?? mes
    try {
      await mutateAsync({
        miembroId,
        descripcion: `Aporte ${mesLabel} — ${nombre}`,
        monto: montoNum,
        file,
      })
      toast({ title: 'Aporte registrado', description: `${formatCOP(montoNum)} para ${nombre}` })
      handleClose()
    } catch (err) {
      toast({
        title:       'Error al registrar',
        description: err instanceof Error ? err.message : 'Intenta de nuevo',
        variant:     'destructive',
      })
      setConfirm(false)
    }
  }

  const handleClose = () => {
    if (isPending) return
    setMes(meses[0]?.value ?? '')
    setMonto('')
    removeFile()
    setConfirm(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar aporte — {nombre}</DialogTitle>
        </DialogHeader>

        {!confirm ? (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Mes</Label>
              <Select value={mes} onValueChange={setMes}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {meses.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="monto">
                Monto COP
                {cuotaDefault > 0 && (
                  <span className="text-muted-foreground font-normal ml-1">
                    (cuota del fondo: {formatCOP(cuotaDefault)})
                  </span>
                )}
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <Input
                  id="monto"
                  inputMode="numeric"
                  placeholder={String(cuotaDefault)}
                  value={monto || (cuotaDefault > 0 ? new Intl.NumberFormat('es-CO').format(cuotaDefault) : '')}
                  onChange={(e) => setMonto(e.target.value.replace(/\D/g, ''))}
                  className="h-12 pl-7"
                />
              </div>
            </div>

            {/* Upload comprobante */}
            <div className="space-y-2">
              <Label>Comprobante (opcional)</Label>
              {!preview ? (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full h-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <ImagePlus className="h-6 w-6" />
                  <span className="text-sm">Toca para subir imagen</span>
                </button>
              ) : (
                <div className="relative">
                  <img
                    src={preview}
                    alt="Comprobante"
                    className="w-full h-40 object-cover rounded-lg border border-border"
                  />
                  <button
                    type="button"
                    onClick={removeFile}
                    className="absolute top-2 right-2 bg-background/80 rounded-full p-1 hover:bg-background"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFile}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button type="submit">Revisar</Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-border p-4 space-y-2 text-sm">
              <p><span className="text-muted-foreground">Miembro:</span> <strong>{nombre}</strong></p>
              <p><span className="text-muted-foreground">Mes:</span> {meses.find((m) => m.value === mes)?.label}</p>
              <p>
                <span className="text-muted-foreground">Monto:</span>{' '}
                <strong className="font-mono text-success">{formatCOP(montoNum)}</strong>
              </p>
              {file && <p><span className="text-muted-foreground">Comprobante:</span> {file.name}</p>}
            </div>
            <p className="text-sm text-muted-foreground">
              Esta acción registrará el aporte en el historial del fondo.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirm(false)} disabled={isPending}>
                Editar
              </Button>
              <Button onClick={handleConfirm} disabled={isPending}>
                {isPending ? 'Registrando…' : 'Confirmar aporte'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default RegistrarAporteModal

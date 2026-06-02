import { useState } from 'react'
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
import { useInvitarMiembro } from '@/hooks/useInvitarMiembro'
import { formatCOP } from '@/lib/mockData'

type RolMiembro = 'miembro' | 'comite' | 'tesorero' | 'admin'

const ROL_LABELS: Record<RolMiembro, string> = {
  miembro:  'Miembro',
  comite:   'Comité',
  tesorero: 'Tesorero',
  admin:    'Administrador',
}

interface Props {
  open:    boolean
  onClose: () => void
}

interface Form {
  nombre_completo: string
  email:           string
  telefono:        string
  rol:             RolMiembro
  aporte_inicial:  string
}

const EMPTY: Form = { nombre_completo: '', email: '', telefono: '', rol: 'miembro', aporte_inicial: '' }

const InvitarMiembroModal = ({ open, onClose }: Props) => {
  const [form, setForm]       = useState<Form>(EMPTY)
  const [confirm, setConfirm] = useState(false)
  const { toast }             = useToast()
  const { mutateAsync, isPending } = useInvitarMiembro()

  const set = (field: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const aporte = parseInt(form.aporte_inicial.replace(/\D/g, '') || '0', 10)

  const handleConfirm = async () => {
    try {
      await mutateAsync({
        nombre_completo: form.nombre_completo,
        email:           form.email,
        telefono:        form.telefono,
        rol:             form.rol,
        aporte_inicial:  aporte,
      })
      toast({
        title:       'Miembro registrado',
        description: `${form.nombre_completo} puede ingresar creando su cuenta con ${form.email}`,
      })
      setForm(EMPTY)
      setConfirm(false)
      onClose()
    } catch (err) {
      toast({
        title:       'Error al invitar',
        description: err instanceof Error ? err.message : 'Intenta de nuevo',
        variant:     'destructive',
      })
      setConfirm(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre_completo.trim() || !form.email.trim()) return
    setConfirm(true)
  }

  const handleClose = () => {
    if (isPending) return
    setForm(EMPTY)
    setConfirm(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invitar miembro</DialogTitle>
        </DialogHeader>

        {!confirm ? (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre completo *</Label>
              <Input
                id="nombre"
                placeholder="ej: Ana Rodríguez"
                value={form.nombre_completo}
                onChange={set('nombre_completo')}
                className="h-12"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico *</Label>
              <Input
                id="email"
                type="email"
                placeholder="ana@correo.com"
                value={form.email}
                onChange={set('email')}
                className="h-12"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                type="tel"
                placeholder="310 123 4567"
                value={form.telefono}
                onChange={set('telefono')}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rol">Rol en el fondo</Label>
              <Select
                value={form.rol}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, rol: v as RolMiembro }))
                }
              >
                <SelectTrigger id="rol" className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(ROL_LABELS) as [RolMiembro, string][]).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aporte">Aporte inicial COP</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <Input
                  id="aporte"
                  inputMode="numeric"
                  placeholder="0"
                  value={aporte > 0 ? new Intl.NumberFormat('es-CO').format(aporte) : ''}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      aporte_inicial: e.target.value.replace(/\D/g, ''),
                    }))
                  }
                  className="h-12 pl-7"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit">Revisar invitación</Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-border p-4 space-y-2 text-sm">
              <p><span className="text-muted-foreground">Nombre:</span> <strong>{form.nombre_completo}</strong></p>
              <p><span className="text-muted-foreground">Email:</span> <strong>{form.email}</strong></p>
              {form.telefono && (
                <p><span className="text-muted-foreground">Teléfono:</span> {form.telefono}</p>
              )}
              <p>
                <span className="text-muted-foreground">Rol:</span>{' '}
                <strong>{ROL_LABELS[form.rol]}</strong>
              </p>
              <p>
                <span className="text-muted-foreground">Aporte inicial:</span>{' '}
                <strong className="font-mono">{formatCOP(aporte)}</strong>
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Se creará el miembro. Para acceder al fondo, <strong>{form.email}</strong> debe crear su cuenta en la pantalla de inicio con ese mismo correo.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirm(false)} disabled={isPending}>
                Editar
              </Button>
              <Button onClick={handleConfirm} disabled={isPending}>
                {isPending ? 'Invitando…' : 'Sí, invitar'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default InvitarMiembroModal

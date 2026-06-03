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

type RolPH = 'propietario' | 'residente' | 'admin_ph'

const ROL_LABELS: Record<RolPH, string> = {
  propietario: 'Propietario',
  residente:   'Residente',
  admin_ph:    'Administrador',
}

interface Props {
  open:    boolean
  onClose: () => void
}

interface Form {
  nombre_completo: string
  email:           string
  telefono:        string
  rol:             RolPH
}

const EMPTY: Form = { nombre_completo: '', email: '', telefono: '', rol: 'propietario' }

const InvitarMiembroModal = ({ open, onClose }: Props) => {
  const [form, setForm]       = useState<Form>(EMPTY)
  const [confirm, setConfirm] = useState(false)
  const { toast }             = useToast()
  const { mutateAsync, isPending } = useInvitarMiembro()

  const set = (field: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleConfirm = async () => {
    try {
      await mutateAsync({
        nombre_completo: form.nombre_completo,
        email:           form.email,
        telefono:        form.telefono,
        rol:             form.rol,
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
          <DialogTitle>Invitar propietario o residente</DialogTitle>
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
              <Label htmlFor="rol">Rol en el conjunto</Label>
              <Select
                value={form.rol}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, rol: v as RolPH }))
                }
              >
                <SelectTrigger id="rol" className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(ROL_LABELS) as [RolPH, string][]).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            </div>
            <p className="text-sm text-muted-foreground">
              Se creará el miembro. Para acceder al conjunto,{' '}
              <strong>{form.email}</strong> debe crear su cuenta en la pantalla de inicio con ese mismo correo.
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

import { useState } from "react"
import { useZonasComunes, useCreateZonaComun, useUpdateZonaComun, useToggleZonaComun, ZonaComun } from "@/hooks/useZonasComunes"
import { useTenant } from "@/hooks/useTenant"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Users, Clock, AlertCircle } from "lucide-react"

export default function ZonasPage() {
  const { data: tenant } = useTenant()
  const { data: zonas = [], isLoading } = useZonasComunes()
  const createZona = useCreateZonaComun()
  const updateZona = useUpdateZonaComun()
  const toggleZona = useToggleZonaComun()
  const { toast } = useToast()

  const [openDialog, setOpenDialog] = useState(false)
  const [editingZona, setEditingZona] = useState<ZonaComun | null>(null)
  
  const [formData, setFormData] = useState({
    nombre: "",
    capacidad_max: 10,
    horario_apertura: "06:00",
    horario_cierre: "22:00",
    duracion_reserva_min: 60,
    bloquear_en_mora: true
  })

  const handleOpenNew = () => {
    setEditingZona(null)
    setFormData({
      nombre: "",
      capacidad_max: 10,
      horario_apertura: "06:00",
      horario_cierre: "22:00",
      duracion_reserva_min: 60,
      bloquear_en_mora: true
    })
    setOpenDialog(true)
  }

  const handleOpenEdit = (zona: ZonaComun) => {
    setEditingZona(zona)
    setFormData({
      nombre: zona.nombre,
      capacidad_max: zona.capacidad_max,
      horario_apertura: zona.horario_apertura,
      horario_cierre: zona.horario_cierre,
      duracion_reserva_min: zona.duracion_reserva_min,
      bloquear_en_mora: zona.bloquear_en_mora
    })
    setOpenDialog(true)
  }

  const handleSave = async () => {
    if (!tenant) return
    try {
      if (editingZona) {
        await updateZona.mutateAsync({ id: editingZona.id, ...formData })
        toast({ title: "Zona actualizada exitosamente" })
      } else {
        await createZona.mutateAsync({ 
          tenant_id: tenant.id, 
          ...formData, 
          activa: true 
        })
        toast({ title: "Zona creada exitosamente" })
      }
      setOpenDialog(false)
    } catch (e: unknown) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    }
  }

  const handleToggle = async (id: string, activa: boolean) => {
    try {
      await toggleZona.mutateAsync({ id, activa })
    } catch (e: unknown) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Zonas Comunes</h1>
        <Button onClick={handleOpenNew}>Nueva zona</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {zonas.map((zona) => (
          <Card key={zona.id} className={!zona.activa ? "opacity-60" : ""}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl">{zona.nombre}</CardTitle>
              <Switch 
                checked={zona.activa} 
                onCheckedChange={(c) => handleToggle(zona.id, c)} 
              />
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mt-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="w-4 h-4 mr-2" />
                  Capacidad: {zona.capacidad_max} personas
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 mr-2" />
                  {zona.horario_apertura} - {zona.horario_cierre} ({zona.duracion_reserva_min} min/reserva)
                </div>
                {zona.bloquear_en_mora && (
                  <div className="flex items-center text-sm text-amber-600 mt-2">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Bloqueada para morosos
                  </div>
                )}
                <Button 
                  variant="outline" 
                  className="w-full mt-4" 
                  onClick={() => handleOpenEdit(zona)}
                >
                  Editar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {zonas.length === 0 && !isLoading && (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            No hay zonas comunes configuradas.
          </div>
        )}
      </div>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingZona ? "Editar" : "Nueva"} Zona Común</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input 
                value={formData.nombre} 
                onChange={(e) => setFormData({...formData, nombre: e.target.value})} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Apertura</Label>
                <Input 
                  type="time" 
                  value={formData.horario_apertura} 
                  onChange={(e) => setFormData({...formData, horario_apertura: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label>Cierre</Label>
                <Input 
                  type="time" 
                  value={formData.horario_cierre} 
                  onChange={(e) => setFormData({...formData, horario_cierre: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label>Capacidad máxima</Label>
                <Input 
                  type="number" 
                  value={formData.capacidad_max} 
                  onChange={(e) => setFormData({...formData, capacidad_max: Number(e.target.value)})} 
                />
              </div>
              <div className="space-y-2">
                <Label>Minutos por reserva</Label>
                <Input 
                  type="number" 
                  step="30"
                  value={formData.duracion_reserva_min} 
                  onChange={(e) => setFormData({...formData, duracion_reserva_min: Number(e.target.value)})} 
                />
              </div>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Switch 
                id="bloquear" 
                checked={formData.bloquear_en_mora} 
                onCheckedChange={(c) => setFormData({...formData, bloquear_en_mora: c})} 
              />
              <Label htmlFor="bloquear">Bloquear reservas en mora</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createZona.isPending || updateZona.isPending}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

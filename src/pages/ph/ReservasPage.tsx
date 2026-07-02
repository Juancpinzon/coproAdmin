import { useState } from "react";
import { format, addDays, startOfWeek, isSameDay, setHours, setMinutes } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/utils";
import { useTenant } from "@/hooks/useTenant";
import { useMiembro } from "@/contexts/MiembroContext";
import { useZonasComunes } from "@/hooks/useZonasComunes";
import { useUnidades } from "@/hooks/useUnidades";
import { useReservas, useCreateReserva, useCancelarReserva } from "@/hooks/useReservas";
import { Card, CardContent } from "@/components/ui/card";

const franjas = Array.from({ length: 18 }, (_, i) => i + 6); // 06:00 to 23:00

export default function ReservasPage() {
  const { data: tenant } = useTenant();
  const miembro = useMiembro();
  const { toast } = useToast();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const formattedDate = format(selectedDate, "yyyy-MM-dd");
  
  const { data: zonas = [] } = useZonasComunes();
  const { data: unidades = [] } = useUnidades();
  const { data: reservas = [], isLoading } = useReservas(); // Fetch all for the week, but we can filter in memory or fetch by date
  
  const createReserva = useCreateReserva();
  const cancelarReserva = useCancelarReserva();

  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newReserva, setNewReserva] = useState({
    zona_id: "",
    unidad_id: "",
    fecha: format(new Date(), "yyyy-MM-dd"),
    hora_inicio: "10:00",
    hora_fin: "11:00",
  });
  
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [reservaToCancel, setReservaToCancel] = useState<string | null>(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState("");

  const startDate = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

  const handleCreate = async () => {
    if (!newReserva.zona_id || !newReserva.unidad_id) {
      toast({ title: "Error", description: "Selecciona zona y unidad", variant: "destructive" });
      return;
    }
    
    if (newReserva.hora_inicio >= newReserva.hora_fin) {
      toast({ title: "Error", description: "La hora de inicio debe ser antes que la de fin", variant: "destructive" });
      return;
    }

    try {
      await createReserva.mutateAsync({
        tenant_id: tenant!.id,
        miembro_id: miembro.id,
        ...newReserva,
      });
      toast({ title: "Éxito", description: "Reserva creada correctamente" });
      setIsNewOpen(false);
      setNewReserva({ ...newReserva, zona_id: "", unidad_id: "" });
    } catch (error: unknown) {
      toast({ title: "Error", description: getErrorMessage(error) || "Error al crear la reserva", variant: "destructive" });
    }
  };

  const handleCancel = async () => {
    if (!reservaToCancel) return;
    try {
      await cancelarReserva.mutateAsync({ id: reservaToCancel, motivo: motivoCancelacion });
      toast({ title: "Éxito", description: "Reserva cancelada correctamente" });
      setIsCancelOpen(false);
      setReservaToCancel(null);
      setMotivoCancelacion("");
    } catch (error: unknown) {
      toast({ title: "Error", description: getErrorMessage(error), variant: "destructive" });
    }
  };

  const reservasDelDia = reservas.filter(
    (r) => r.fecha === format(selectedDate, "yyyy-MM-dd") && r.estado === "confirmada"
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reservas</h1>
          <p className="text-muted-foreground">Gestión de zonas comunes</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, -1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="font-medium px-4 w-40 text-center">
            {format(selectedDate, "dd MMM yyyy", { locale: es })}
          </div>
          <Button variant="outline" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nueva reserva
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear reserva</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Zona Común</Label>
                  <Select value={newReserva.zona_id} onValueChange={(v) => setNewReserva({ ...newReserva, zona_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecciona una zona" /></SelectTrigger>
                    <SelectContent>
                      {zonas.filter(z => z.activa).map(z => (
                        <SelectItem key={z.id} value={z.id}>{z.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Unidad</Label>
                  <Select value={newReserva.unidad_id} onValueChange={(v) => setNewReserva({ ...newReserva, unidad_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecciona la unidad" /></SelectTrigger>
                    <SelectContent>
                      {unidades.map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.numero}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <Input type="date" value={newReserva.fecha} onChange={(e) => setNewReserva({ ...newReserva, fecha: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Hora Inicio</Label>
                    <Input type="time" value={newReserva.hora_inicio} onChange={(e) => setNewReserva({ ...newReserva, hora_inicio: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Hora Fin</Label>
                    <Input type="time" value={newReserva.hora_fin} onChange={(e) => setNewReserva({ ...newReserva, hora_fin: e.target.value })} />
                  </div>
                </div>
                <Button className="w-full" onClick={handleCreate} disabled={createReserva.isPending}>
                  {createReserva.isPending ? "Creando..." : "Confirmar reserva"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 overflow-x-auto">
          <Card>
            <div className="min-w-[700px] p-4">
              <div className="grid grid-cols-8 gap-2 border-b pb-2 mb-2">
                <div className="font-medium text-muted-foreground text-center">Hora</div>
                {weekDays.map((day) => (
                  <div 
                    key={day.toISOString()} 
                    className={`text-center font-medium ${isSameDay(day, selectedDate) ? 'text-primary' : ''}`}
                    onClick={() => setSelectedDate(day)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div>{format(day, "EEEEEE", { locale: es }).toUpperCase()}</div>
                    <div className="text-lg">{format(day, "d")}</div>
                  </div>
                ))}
              </div>
              
              <div className="space-y-2">
                {franjas.map((hora) => (
                  <div key={hora} className="grid grid-cols-8 gap-2 group">
                    <div className="text-sm text-muted-foreground text-center py-2 border-r pr-2">
                      {hora.toString().padStart(2, "0")}:00
                    </div>
                    {weekDays.map((day) => {
                      const dayStr = format(day, "yyyy-MM-dd");
                      const hourStr = `${hora.toString().padStart(2, "0")}:00`;
                      const isSelected = isSameDay(day, selectedDate);
                      
                      // Find reserva that overlaps with this hour block
                      const reserva = reservas.find(r => {
                        return r.fecha === dayStr && 
                               r.estado === "confirmada" &&
                               r.hora_inicio <= hourStr && 
                               r.hora_fin > hourStr;
                      });

                      return (
                        <div key={day.toISOString()} className={`min-h-12 border rounded-md p-1 ${isSelected ? 'bg-primary/5 border-primary/20' : 'border-dashed'}`}>
                          {reserva && reserva.hora_inicio === hourStr && (
                            <div className="bg-primary/10 text-primary border border-primary/20 text-xs p-1 rounded overflow-hidden">
                              <div className="font-medium truncate">{reserva.zonas_comunes?.nombre}</div>
                              <div>{reserva.unidades?.numero}</div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium text-lg mb-4 flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2 text-primary" />
                Reservas del {format(selectedDate, "d MMM", { locale: es })}
              </h3>
              
              {isLoading ? (
                <p className="text-muted-foreground text-sm">Cargando...</p>
              ) : reservasDelDia.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">No hay reservas para este día.</p>
              ) : (
                <div className="space-y-3">
                  {reservasDelDia.map(r => (
                    <div key={r.id} className="flex justify-between items-start border p-3 rounded-lg bg-card">
                      <div>
                        <div className="font-medium">{r.zonas_comunes?.nombre}</div>
                        <div className="text-sm text-muted-foreground">Unidad: {r.unidades?.numero}</div>
                        <div className="text-sm">
                          {r.hora_inicio.slice(0, 5)} - {r.hora_fin.slice(0, 5)}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => {
                        setReservaToCancel(r.id);
                        setIsCancelOpen(true);
                      }}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar reserva</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Motivo de cancelación</Label>
              <Input 
                value={motivoCancelacion} 
                onChange={(e) => setMotivoCancelacion(e.target.value)} 
                placeholder="Ej. Solicitud del residente"
              />
            </div>
            <Button variant="destructive" className="w-full" onClick={handleCancel} disabled={cancelarReserva.isPending || !motivoCancelacion}>
              {cancelarReserva.isPending ? "Cancelando..." : "Confirmar cancelación"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

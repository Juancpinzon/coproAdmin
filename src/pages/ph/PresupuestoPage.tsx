import { useState } from "react";
import { 
  usePresupuesto, 
  useCreatePresupuestoItem, 
  useUpdatePresupuestoItem, 
  useDeletePresupuestoItem,
  PresupuestoItem
} from "@/hooks/usePresupuesto";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit } from "lucide-react";
import { formatCOP } from "@/lib/utils";

const catColors: Record<string, string> = {
  administracion: "bg-blue-100 text-blue-800 border-blue-200",
  mantenimiento: "bg-orange-100 text-orange-800 border-orange-200",
  seguridad: "bg-red-100 text-red-800 border-red-200",
  servicios_publicos: "bg-cyan-100 text-cyan-800 border-cyan-200",
  reserva: "bg-purple-100 text-purple-800 border-purple-200",
};

export default function PresupuestoPage() {
  const currentYear = new Date().getFullYear();
  const [anio, setAnio] = useState<number>(currentYear);
  const { data: items = [], isLoading } = usePresupuesto(anio);
  const createItem = useCreatePresupuestoItem();
  const updateItem = useUpdatePresupuestoItem();
  const deleteItem = useDeletePresupuestoItem();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [concepto, setConcepto] = useState("");
  const [categoria, setCategoria] = useState<PresupuestoItem["categoria"]>("administracion");
  const [monto, setMonto] = useState<number | "">("");

  const totalPresupuesto = items.reduce((acc, curr) => acc + curr.monto_presupuestado, 0);

  const desglose = items.reduce((acc, curr) => {
    acc[curr.categoria] = (acc[curr.categoria] || 0) + curr.monto_presupuestado;
    return acc;
  }, {} as Record<string, number>);

  const handleOpenDialog = (item?: PresupuestoItem) => {
    if (item) {
      setEditingId(item.id);
      setConcepto(item.concepto);
      setCategoria(item.categoria);
      setMonto(item.monto_presupuestado);
    } else {
      setEditingId(null);
      setConcepto("");
      setCategoria("administracion");
      setMonto("");
    }
    setOpen(true);
  };

  const handleSave = async () => {
    if (!concepto || !monto) return;
    try {
      if (editingId) {
        await updateItem.mutateAsync({ id: editingId, concepto, categoria, monto_presupuestado: Number(monto) });
        toast({ title: "Item actualizado" });
      } else {
        await createItem.mutateAsync({ anio, concepto, categoria, monto_presupuestado: Number(monto) });
        toast({ title: "Item creado" });
      }
      setOpen(false);
    } catch (e: unknown) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este ítem?")) return;
    try {
      await deleteItem.mutateAsync(id);
      toast({ title: "Item eliminado" });
    } catch (e: unknown) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Presupuesto Anual</h1>
        <Select value={anio.toString()} onValueChange={(v) => setAnio(Number(v))}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[currentYear - 1, currentYear, currentYear + 1].map(y => (
              <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Total Presupuestado {anio}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCOP(totalPresupuesto)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Desglose por Categoría</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(desglose).map(([cat, val]) => (
              <div key={cat} className="flex justify-between items-center text-sm">
                <span className="capitalize text-muted-foreground">{cat.replace("_", " ")}</span>
                <span className="font-medium">{formatCOP(val)}</span>
              </div>
            ))}
            {Object.keys(desglose).length === 0 && <span className="text-sm text-muted-foreground">Sin ítems</span>}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Ítems del Presupuesto</h2>
        <Button onClick={() => handleOpenDialog()}>Agregar ítem</Button>
      </div>

      <div className="border rounded-md">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="p-3 font-medium">Concepto</th>
              <th className="p-3 font-medium">Categoría</th>
              <th className="p-3 font-medium text-right">Monto</th>
              <th className="p-3 font-medium w-24 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-muted/50">
                <td className="p-3">{item.concepto}</td>
                <td className="p-3">
                  <Badge variant="outline" className={catColors[item.categoria] || ""}>
                    {item.categoria.replace("_", " ")}
                  </Badge>
                </td>
                <td className="p-3 text-right font-medium">{formatCOP(item.monto_presupuestado)}</td>
                <td className="p-3 text-center">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(item)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {items.length === 0 && !isLoading && (
              <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No hay ítems para este año</td></tr>
            )}
          </tbody>
          <tfoot className="bg-muted/50">
            <tr>
              <td colSpan={2} className="p-4 text-right font-semibold">Total General</td>
              <td className="p-4 text-right font-bold text-lg text-primary">{formatCOP(totalPresupuesto)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Ítem" : "Agregar Ítem"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Concepto</Label>
              <Input value={concepto} onChange={e => setConcepto(e.target.value)} placeholder="Ej. Pago de vigilancia" />
            </div>
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={categoria} onValueChange={(v: string) => setCategoria(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="administracion">Administración</SelectItem>
                  <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                  <SelectItem value="seguridad">Seguridad</SelectItem>
                  <SelectItem value="servicios_publicos">Servicios Públicos</SelectItem>
                  <SelectItem value="reserva">Reserva</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Monto (COP)</Label>
              <Input type="number" value={monto} onChange={e => setMonto(Number(e.target.value) || "")} />
            </div>
            <Button onClick={handleSave} className="w-full" disabled={createItem.isPending || updateItem.isPending}>
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState } from "react";
import { Building2, Plus, Search, User, Edit2 } from "lucide-react";
import {
  useUnidades,
  useCreateUnidad,
  useUpdateUnidad,
} from "@/hooks/useUnidades";
import { useMiembros } from "@/hooks/useMiembros";
import { useTenant } from "@/hooks/useTenant";
import { useCuotasAdmin, type CuotaAdmin } from "@/hooks/useCuotasAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Unidad } from "@/hooks/useUnidades";

const TIPO_LABELS: Record<Unidad["tipo"], string> = {
  apartamento: "Apartamento",
  local_comercial: "Local comercial",
  parqueadero: "Parqueadero",
  deposito: "Depósito",
};

const TIPO_COLORS: Record<Unidad["tipo"], string> = {
  apartamento: "bg-blue-100 text-blue-800",
  local_comercial: "bg-purple-100 text-purple-800",
  parqueadero: "bg-gray-100 text-gray-800",
  deposito: "bg-yellow-100 text-yellow-800",
};

interface FormState {
  numero: string;
  tipo: Unidad["tipo"];
  coeficiente: string;
  piso: string;
  torre: string;
  miembro_id: string;
}

const EMPTY_FORM: FormState = {
  numero: "",
  tipo: "apartamento",
  coeficiente: "",
  piso: "",
  torre: "",
  miembro_id: "",
};

export default function UnidadesPage() {
  const { data: unidades = [], isLoading } = useUnidades();
  const { data: miembros = [] } = useMiembros();
  const { data: tenant } = useTenant();
  const { data: todasCuotas = [] } = useCuotasAdmin();
  const createUnidad = useCreateUnidad();
  const updateUnidad = useUpdateUnidad();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  function getEstadoMora(unidadId: string) {
    const cuotasUnidad = todasCuotas.filter((c) => c.unidad_id === unidadId);
    if (cuotasUnidad.some((c) => c.estado === 'vencido')) return 'mora';
    if (cuotasUnidad.some((c) => c.estado === 'pendiente')) return 'pendiente';
    return 'al_dia';
  }

  const filtered = unidades.filter(
    (u) =>
      u.numero.toLowerCase().includes(search.toLowerCase()) ||
      u.miembros?.nombre_completo?.toLowerCase().includes(search.toLowerCase()),
  );

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(u: Unidad) {
    setEditingId(u.id);
    setForm({
      numero: u.numero,
      tipo: u.tipo,
      coeficiente: String(u.coeficiente),
      piso: u.piso != null ? String(u.piso) : "",
      torre: u.torre ?? "",
      miembro_id: u.miembro_id ?? "",
    });
    setDialogOpen(true);
  }

  async function handleSubmit() {
    if (!form.numero || !form.coeficiente) {
      toast({ title: "Faltan campos obligatorios", variant: "destructive" });
      return;
    }
    if (!tenant?.id) return;

    const payload = {
      tenant_id: tenant.id,
      numero: form.numero,
      tipo: form.tipo,
      coeficiente: parseFloat(form.coeficiente),
      piso: form.piso ? parseInt(form.piso) : null,
      torre: form.torre || null,
      miembro_id: form.miembro_id || null,
    };

    try {
      if (editingId) {
        await updateUnidad.mutateAsync({ id: editingId, ...payload });
        toast({ title: "Unidad actualizada" });
      } else {
        await createUnidad.mutateAsync(payload);
        toast({ title: "Unidad creada" });
      }
      setDialogOpen(false);
    } catch {
      toast({ title: "Error al guardar", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Unidades</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {unidades.length} unidad{unidades.length !== 1 ? "es" : ""}{" "}
            registrada{unidades.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva unidad
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por número o propietario…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Lista */}
      {isLoading ? (
        <p className="text-muted-foreground text-sm">Cargando…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>No hay unidades registradas</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((u) => (
            <div
              key={u.id}
              className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-lg">Unidad {u.numero}</p>
                  {u.torre && (
                    <p className="text-xs text-muted-foreground">
                      Torre {u.torre}
                      {u.piso ? ` · Piso ${u.piso}` : ""}
                    </p>
                  )}
                </div>
                <Badge className={TIPO_COLORS[u.tipo]}>
                  {TIPO_LABELS[u.tipo]}
                </Badge>
              </div>

              {getEstadoMora(u.id) === 'mora' && <Badge variant="destructive" className="mb-3 w-fit">En mora</Badge>}
              {getEstadoMora(u.id) === 'pendiente' && <Badge variant="secondary" className="mb-3 w-fit bg-yellow-500 hover:bg-yellow-600 text-white">Pendiente</Badge>}
              {getEstadoMora(u.id) === 'al_dia' && <Badge variant="default" className="mb-3 w-fit bg-green-600 hover:bg-green-700">Al día</Badge>}

              <div className="space-y-1 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5" />
                  <span>
                    {u.miembros?.nombre_completo ?? "Sin propietario"}
                  </span>
                </div>
                <p className="text-xs">Coeficiente: {u.coeficiente}%</p>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => openEdit(u)}
              >
                <Edit2 className="h-3.5 w-3.5 mr-2" />
                Editar
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar unidad" : "Nueva unidad"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Número *</Label>
                <Input
                  placeholder="101"
                  value={form.numero}
                  onChange={(e) => setForm({ ...form, numero: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo *</Label>
                <Select
                  value={form.tipo}
                  onValueChange={(v) =>
                    setForm({ ...form, tipo: v as Unidad["tipo"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPO_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Coeficiente % *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="5.25"
                  value={form.coeficiente}
                  onChange={(e) =>
                    setForm({ ...form, coeficiente: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Torre</Label>
                <Input
                  placeholder="A"
                  value={form.torre}
                  onChange={(e) => setForm({ ...form, torre: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Piso</Label>
                <Input
                  type="number"
                  placeholder="1"
                  value={form.piso}
                  onChange={(e) => setForm({ ...form, piso: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Propietario</Label>
              <Select
                value={form.miembro_id || "none"}
                onValueChange={(v) =>
                  setForm({ ...form, miembro_id: v === "none" ? "" : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {miembros.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createUnidad.isPending || updateUnidad.isPending}
            >
              {editingId ? "Guardar cambios" : "Crear unidad"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useTenant } from "./useTenant";

export interface PresupuestoItem {
  id: string;
  tenant_id: string;
  anio: number;
  concepto: string;
  categoria: "administracion" | "mantenimiento" | "seguridad" | "servicios_publicos" | "reserva";
  monto_presupuestado: number;
  created_at: string;
}

export function usePresupuesto(anio: number) {
  const { data: tenant } = useTenant();
  return useQuery<PresupuestoItem[]>({
    queryKey: ["presupuesto", tenant?.id, anio],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from("presupuesto_ph")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("anio", anio)
        .order("created_at", { ascending: true });
        
      if (error) throw error;
      return data as PresupuestoItem[];
    },
    enabled: !!tenant?.id,
  });
}

export function useCreatePresupuestoItem() {
  const qc = useQueryClient();
  const { data: tenant } = useTenant();
  return useMutation({
    mutationFn: async (
      item: Omit<PresupuestoItem, "id" | "created_at" | "tenant_id">
    ) => {
      if (!tenant?.id) throw new Error("No tenant");
      const { error } = await supabase.from("presupuesto_ph").insert({
        ...item,
        tenant_id: tenant.id,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["presupuesto"] }),
  });
}

export function useUpdatePresupuestoItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Omit<PresupuestoItem, "created_at" | "tenant_id">> & { id: string }) => {
      const { error } = await supabase.from("presupuesto_ph").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["presupuesto"] }),
  });
}

export function useDeletePresupuestoItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("presupuesto_ph").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["presupuesto"] }),
  });
}

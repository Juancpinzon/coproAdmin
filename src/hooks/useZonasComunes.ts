import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface ZonaComun {
  id: string;
  tenant_id: string;
  nombre: string;
  capacidad_max: number;
  horario_apertura: string;
  horario_cierre: string;
  duracion_reserva_min: number;
  activa: boolean;
  bloquear_en_mora: boolean;
  created_at: string;
}

export function useZonasComunes() {
  return useQuery<ZonaComun[]>({
    queryKey: ["zonas_comunes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("zonas_comunes")
        .select("*")
        .order("nombre");
      if (error) throw error;
      return data as ZonaComun[];
    },
  });
}

export function useCreateZonaComun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      zona: Omit<ZonaComun, "id" | "created_at">
    ) => {
      const { error } = await supabase.from("zonas_comunes").insert(zona);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["zonas_comunes"] }),
  });
}

export function useUpdateZonaComun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<ZonaComun> & { id: string }) => {
      const { error } = await supabase
        .from("zonas_comunes")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["zonas_comunes"] }),
  });
}

export function useToggleZonaComun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, activa }: { id: string; activa: boolean }) => {
      const { error } = await supabase
        .from("zonas_comunes")
        .update({ activa })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["zonas_comunes"] }),
  });
}

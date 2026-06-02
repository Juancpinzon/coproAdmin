import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface Unidad {
  id: string;
  tenant_id: string;
  miembro_id: string | null;
  numero: string;
  tipo: "apartamento" | "local_comercial" | "parqueadero" | "deposito";
  coeficiente: number;
  piso: number | null;
  torre: string | null;
  created_at: string;
  miembros?: {
    nombre_completo: string;
    email: string | null;
    telefono: string | null;
  };
}

export function useUnidades() {
  return useQuery<Unidad[]>({
    queryKey: ["unidades"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("unidades")
        .select("*, miembros(nombre_completo, email, telefono)")
        .order("numero");
      if (error) throw error;
      return data as Unidad[];
    },
  });
}

export function useCreateUnidad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      unidad: Omit<Unidad, "id" | "created_at" | "miembros">,
    ) => {
      const { error } = await supabase.from("unidades").insert(unidad);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["unidades"] }),
  });
}

export function useUpdateUnidad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Unidad> & { id: string }) => {
      const { error } = await supabase
        .from("unidades")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["unidades"] }),
  });
}

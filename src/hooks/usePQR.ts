import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface PQR {
  id: string;
  tenant_id: string;
  unidad_id: string;
  miembro_id: string;
  tipo: "peticion" | "queja" | "reclamo";
  asunto: string;
  descripcion: string;
  estado: "abierto" | "en_gestion" | "cerrado";
  respuesta: string | null;
  fecha_cierre: string | null;
  created_at: string;
  unidades?: { numero: string };
  miembros?: { nombre_completo: string };
}

export function usePQR(unidad_id?: string) {
  return useQuery<PQR[]>({
    queryKey: ["pqr", unidad_id],
    queryFn: async () => {
      let query = supabase
        .from("pqr")
        .select("*, unidades(numero), miembros(nombre_completo)")
        .order("created_at", { ascending: false });
        
      if (unidad_id) {
        query = query.eq("unidad_id", unidad_id);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as PQR[];
    },
  });
}

export function useUpdatePQR() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      estado,
      respuesta,
    }: {
      id: string;
      estado: PQR["estado"];
      respuesta?: string;
    }) => {
      const updates: Partial<PQR> = { estado, respuesta };
      if (estado === "cerrado") updates.fecha_cierre = new Date().toISOString();
      const { error } = await supabase.from("pqr").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pqr"] }),
  });
}

export function useCreatePQR() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      pqr: Omit<PQR, "id" | "created_at" | "estado" | "respuesta" | "fecha_cierre" | "unidades" | "miembros">
    ) => {
      const { error } = await supabase.from("pqr").insert({
        ...pqr,
        estado: "abierto",
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pqr"] }),
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface Reserva {
  id: string;
  tenant_id: string;
  zona_id: string;
  unidad_id: string;
  miembro_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: "confirmada" | "cancelada";
  cancelacion_motivo: string | null;
  created_at: string;
  zonas_comunes?: { nombre: string };
  unidades?: { numero: string };
  miembros?: { nombre_completo: string };
}

export function useReservas(fecha?: string) {
  return useQuery<Reserva[]>({
    queryKey: ["reservas", fecha],
    queryFn: async () => {
      let query = supabase
        .from("reservas")
        .select("*, zonas_comunes(nombre), unidades(numero), miembros(nombre_completo)")
        .order("hora_inicio", { ascending: true });
      
      if (fecha) {
        query = query.eq("fecha", fecha);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Reserva[];
    },
  });
}

export function useReservasByUnidad(unidad_id: string) {
  return useQuery<Reserva[]>({
    queryKey: ["reservas_unidad", unidad_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservas")
        .select("*, zonas_comunes(nombre)")
        .eq("unidad_id", unidad_id)
        .order("fecha", { ascending: false });
      if (error) throw error;
      return data as Reserva[];
    },
    enabled: !!unidad_id,
  });
}

export function useCreateReserva() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (reserva: Omit<Reserva, "id" | "created_at" | "estado" | "cancelacion_motivo" | "zonas_comunes" | "unidades" | "miembros">) => {
      // Validar conflictos de horario antes de insertar
      const { data: conflictos, error: fetchError } = await supabase
        .from("reservas")
        .select("id")
        .eq("zona_id", reserva.zona_id)
        .eq("fecha", reserva.fecha)
        .eq("estado", "confirmada")
        .or(`and(hora_inicio.lt.${reserva.hora_fin},hora_fin.gt.${reserva.hora_inicio})`);
        
      if (fetchError) throw fetchError;
      
      if (conflictos && conflictos.length > 0) {
        throw new Error("El horario seleccionado no está disponible en esta zona común.");
      }

      const newReserva = {
        ...reserva,
        estado: "confirmada" as const,
      };

      const { error } = await supabase.from("reservas").insert(newReserva);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reservas"] }),
  });
}

export function useCancelarReserva() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo: string }) => {
      const { error } = await supabase
        .from("reservas")
        .update({ estado: "cancelada", cancelacion_motivo: motivo })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reservas"] }),
  });
}

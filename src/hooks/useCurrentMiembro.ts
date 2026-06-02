import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export interface CurrentMiembro {
  id: string;
  tenant_id: string;
  nombre_completo: string;
  rol:
    | "admin"
    | "tesorero"
    | "comite"
    | "miembro"
    | "admin_ph"
    | "propietario"
    | "residente";
  estado: "activo" | "inactivo" | "suspendido";
  email: string | null;
}

// Llama a la función SECURITY DEFINER que bypassa RLS.
// Retorna null si el usuario autenticado aún no tiene miembro (→ onboarding).
export function useCurrentMiembro(user: User | null) {
  return useQuery<CurrentMiembro | null>({
    queryKey: ["current-miembro", user?.id],
    enabled: !!user,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_my_miembro");
      if (error) throw error;
      // data es un array; LIMIT 1 devuelve 0 o 1 filas
      const row = (data as CurrentMiembro[] | null)?.[0];
      return row ?? null;
    },
  });
}

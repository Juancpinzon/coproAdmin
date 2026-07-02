import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { calcularMontoCuota } from "@/lib/utils";

export interface CuotaAdmin {
  id: string;
  tenant_id: string;
  unidad_id: string;
  periodo: string;
  monto: number;
  estado: "pendiente" | "pagado" | "vencido";
  fecha_pago: string | null;
  pago_id: string | null;
  comprobante_url: string | null;
  created_at: string;
  unidades?: { numero: string; tipo: string };
}

export function useCuotasAdmin(periodo?: string) {
  return useQuery<CuotaAdmin[]>({
    queryKey: ["cuotas_admin", periodo],
    queryFn: async () => {
      let query = supabase
        .from("cuotas_administracion")
        .select("*, unidades(numero, tipo)")
        .order("created_at", { ascending: false });
      if (periodo) query = query.eq("periodo", `${periodo}-01`);
      const { data, error } = await query;
      if (error) throw error;
      return data as CuotaAdmin[];
    },
  });
}

export function useGenerarCuotas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tenant_id,
      periodo,
      cuota_base,
      unidades,
      modo,
    }: {
      tenant_id: string;
      periodo: string;
      cuota_base: number;
      unidades: { id: string; coeficiente: number }[];
      modo: 'fija' | 'coeficiente';
    }) => {
      const cuotas = unidades.map((u) => ({
        tenant_id,
        unidad_id: u.id,
        periodo: `${periodo}-01`,
        monto: calcularMontoCuota(cuota_base, u.coeficiente, modo),
        estado: "pendiente" as const,
      }));
      const { error } = await supabase
        .from("cuotas_administracion")
        .insert(cuotas);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cuotas_admin"] }),
  });
}

export function useRegistrarPagoCuota() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ cuota_id, fecha_pago, comprobante_url }: {
      cuota_id: string
      fecha_pago: string
      comprobante_url?: string
    }) => {
      // Las 4 escrituras (insert pago → update cuota → insert movimiento,
      // con bloqueo de la cuota) viven en una única transacción atómica
      // del lado de Postgres. Ver migración 010_rpc_registrar_pago_cuota.sql.
      const { data, error } = await supabase.rpc('registrar_pago_cuota', {
        p_cuota_id: cuota_id,
        p_fecha_pago: fecha_pago,
        p_comprobante_url: comprobante_url ?? null,
      })
      if (error) throw error
      return data as string // id del pago creado
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cuotas_admin'] }),
  })
}

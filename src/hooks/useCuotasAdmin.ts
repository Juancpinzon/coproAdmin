import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

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
        monto: modo === 'fija'
          ? cuota_base
          : Math.round(cuota_base * (u.coeficiente / 100)),
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
      // 1. Leer la cuota para obtener monto y tenant_id
      const { data: cuota, error: ce } = await supabase
        .from('cuotas_administracion')
        .select('monto, tenant_id, unidad_id')
        .eq('id', cuota_id)
        .single()
      if (ce) throw ce

      // 2. Insertar en pagos
      const { data: pago, error: pe } = await supabase
        .from('pagos')
        .insert({
          tenant_id: cuota.tenant_id,
          monto: cuota.monto,
          fecha_pago,
          cuota_admin_id: cuota_id,
          unidad_id: cuota.unidad_id,
          concepto: 'Cuota administración',
          estado: 'pagado',
        })
        .select('id')
        .single()
      if (pe) throw pe

      // 3. UPDATE cuota
      const { error: ue } = await supabase
        .from('cuotas_administracion')
        .update({ estado: 'pagado', fecha_pago, pago_id: pago.id, comprobante_url: comprobante_url ?? null })
        .eq('id', cuota_id)
      if (ue) throw ue

      // 4. Insertar movimiento en caja
      const { error: me } = await supabase
        .from('movimientos_fondo')
        .insert({
          tenant_id: cuota.tenant_id,
          tipo: 'ingreso',
          monto: cuota.monto,
          descripcion: 'Pago cuota de administración',
          categoria: 'administracion',
          referencia_id: pago.id,
        })
      if (me) throw me
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cuotas_admin'] }),
  })
}

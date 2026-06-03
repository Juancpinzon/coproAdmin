import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useTenant } from "./useTenant";

// ─── Tipos ────────────────────────────────────────────────────

export type TipoObligacion =
  | "asamblea_ordinaria"
  | "rendicion_cuentas"
  | "presupuesto"
  | "seguros"
  | "estados_financieros"
  | "reglamento";

/**
 * Estado calculado en runtime — NUNCA guardado en BD.
 * Regla según CLAUDE.md:
 *   "vencido"  → fecha_vencimiento < hoy
 *   "proximo"  → fecha_vencimiento <= hoy + 30 días
 *   "al_dia"   → cualquier otro caso (o sin fecha de vencimiento)
 */
export type EstadoObligacion = "al_dia" | "proximo" | "vencido";

/** Fila raw de la BD — sin estado (se calcula) */
export interface ObligacionRaw {
  id: string;
  tenant_id: string;
  tipo: TipoObligacion;
  fecha_vencimiento: string | null; // ISO timestamp o null (ej: reglamento permanente)
  documento_url: string | null;
  notas: string | null;
  updated_at: string;
}

/** Entidad enriquecida que exponen los hooks a la UI */
export interface Obligacion extends ObligacionRaw {
  /** Estado calculado en runtime. Ver calcularEstado(). */
  estado: EstadoObligacion;
  /** Días hasta el vencimiento (negativo = ya venció). Null si sin fecha. */
  diasRestantes: number | null;
}

// ─── Helpers de cálculo ───────────────────────────────────────

const UMBRAL_PROXIMO_DIAS = 30;

/**
 * Calcula el estado de una obligación en runtime.
 * La lógica vive aquí y en ningún lugar de la BD.
 */
export function calcularEstado(fechaVencimiento: string | null): EstadoObligacion {
  if (!fechaVencimiento) return "al_dia"; // sin fecha = permanente = al día

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const vence = new Date(fechaVencimiento);
  vence.setHours(0, 0, 0, 0);

  if (vence < hoy) return "vencido";

  const diffMs = vence.getTime() - hoy.getTime();
  const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDias <= UMBRAL_PROXIMO_DIAS) return "proximo";

  return "al_dia";
}

/**
 * Días hasta el vencimiento (entero positivo = falta, negativo = venció).
 * Null si la obligación no tiene fecha fija.
 */
export function calcularDiasRestantes(fechaVencimiento: string | null): number | null {
  if (!fechaVencimiento) return null;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const vence = new Date(fechaVencimiento);
  vence.setHours(0, 0, 0, 0);

  const diffMs = vence.getTime() - hoy.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/** Enriquece una fila raw con el estado y diasRestantes calculados. */
function enriquecer(raw: ObligacionRaw): Obligacion {
  return {
    ...raw,
    estado: calcularEstado(raw.fecha_vencimiento),
    diasRestantes: calcularDiasRestantes(raw.fecha_vencimiento),
  };
}

// ─── Etiquetas legibles ───────────────────────────────────────

export const ETIQUETAS_OBLIGACION: Record<TipoObligacion, string> = {
  asamblea_ordinaria:  "Asamblea ordinaria",
  rendicion_cuentas:   "Rendición de cuentas",
  presupuesto:         "Presupuesto anual",
  seguros:             "Seguros obligatorios",
  estados_financieros: "Estados financieros",
  reglamento:          "Reglamento PH",
};

// ─── Hook principal: listar obligaciones ─────────────────────

/**
 * Retorna las obligaciones legales del tenant activo con el estado
 * calculado en runtime. El estado NUNCA se lee de la BD.
 *
 * Filtros opcionales:
 * - `soloVencidas`  → solo las de estado "vencido"
 * - `soloProximas`  → solo las de estado "proximo"
 */
export function useObligaciones(opts?: {
  soloVencidas?: boolean;
  soloProximas?: boolean;
}) {
  const { data: tenant } = useTenant();

  return useQuery<Obligacion[]>({
    queryKey: ["obligaciones_legales", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];

      const { data, error } = await supabase
        .from("obligaciones_legales")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("fecha_vencimiento", { ascending: true, nullsFirst: false });

      if (error) throw error;

      const enriquecidas = (data as ObligacionRaw[]).map(enriquecer);

      if (opts?.soloVencidas) return enriquecidas.filter((o) => o.estado === "vencido");
      if (opts?.soloProximas) return enriquecidas.filter((o) => o.estado === "proximo");

      return enriquecidas;
    },
    enabled: !!tenant?.id,
  });
}

/**
 * Resumen del semáforo de cumplimiento para el dashboard.
 * Retorna conteos por estado sin exponer el estado en BD.
 */
export function useResumenCumplimiento() {
  const { data: tenant } = useTenant();

  return useQuery<{
    total: number;
    al_dia: number;
    proximo: number;
    vencido: number;
    estadoGlobal: EstadoObligacion;
  }>({
    queryKey: ["resumen_cumplimiento", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) {
        return { total: 0, al_dia: 0, proximo: 0, vencido: 0, estadoGlobal: "al_dia" };
      }

      const { data, error } = await supabase
        .from("obligaciones_legales")
        .select("fecha_vencimiento")
        .eq("tenant_id", tenant.id);

      if (error) throw error;

      const estados = (data as Pick<ObligacionRaw, "fecha_vencimiento">[]).map(
        (r) => calcularEstado(r.fecha_vencimiento)
      );

      const al_dia  = estados.filter((e) => e === "al_dia").length;
      const proximo = estados.filter((e) => e === "proximo").length;
      const vencido = estados.filter((e) => e === "vencido").length;

      // El semáforo global es el peor estado encontrado
      const estadoGlobal: EstadoObligacion =
        vencido > 0 ? "vencido" : proximo > 0 ? "proximo" : "al_dia";

      return { total: estados.length, al_dia, proximo, vencido, estadoGlobal };
    },
    enabled: !!tenant?.id,
  });
}

// ─── Mutaciones ───────────────────────────────────────────────

export interface ObligacionUpdate {
  id: string;
  fecha_vencimiento?: string | null;
  documento_url?: string | null;
  notas?: string | null;
}

/** Actualiza fecha, documento o notas de una obligación. */
export function useUpdateObligacion() {
  const qc = useQueryClient();
  const { data: tenant } = useTenant();

  return useMutation({
    mutationFn: async ({ id, ...updates }: ObligacionUpdate) => {
      const { error } = await supabase
        .from("obligaciones_legales")
        .update(updates)
        .eq("id", id)
        .eq("tenant_id", tenant?.id ?? "");
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["obligaciones_legales"] });
      qc.invalidateQueries({ queryKey: ["resumen_cumplimiento"] });
    },
  });
}

/**
 * Llama a la función SQL seed_obligaciones_iniciales para crear
 * las 4 obligaciones base al terminar el onboarding.
 * Idempotente: ON CONFLICT DO NOTHING en la función SQL.
 */
export function useSeedObligaciones() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (tenantId: string) => {
      const { error } = await supabase.rpc("seed_obligaciones_iniciales", {
        p_tenant_id: tenantId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["obligaciones_legales"] });
      qc.invalidateQueries({ queryKey: ["resumen_cumplimiento"] });
    },
  });
}

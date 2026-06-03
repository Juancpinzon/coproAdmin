import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useTenant } from "./useTenant";
import { useCurrentMiembro } from "./useCurrentMiembro";
import { useAuth } from "./useAuth";
import { calcularDiasHabilesRestantes } from "@/lib/utils";

// ─── Tipos ────────────────────────────────────────────────────

export type CanalConsentimiento = "web" | "portal" | "presencial";

/** Fila de consentimientos_tratamiento tal como llega de la BD. */
export interface Consentimiento {
  id: string;
  tenant_id: string;
  miembro_id: string;
  version_politica: string; // ej: "v1.0"
  acepto: boolean;
  fecha: string;            // ISO timestamp — inmutable
  ip_registro: string | null;
  canal: CanalConsentimiento;
  miembros?: { nombre_completo: string }; // join opcional para la vista admin
}

export type TipoARCO = "acceso" | "rectificacion" | "cancelacion" | "oposicion";
export type EstadoARCO = "recibida" | "en_tramite" | "resuelta";

/** Fila de solicitudes_arco tal como llega de la BD. */
export interface SolicitudARCO {
  id: string;
  tenant_id: string;
  miembro_id: string;
  tipo: TipoARCO;
  descripcion: string;
  estado: EstadoARCO;
  respuesta: string | null;
  fecha_limite: string;       // ISO timestamp — 14 días desde created_at (~10 hábiles)
  fecha_resolucion: string | null;
  created_at: string;
  miembros?: { nombre_completo: string }; // join opcional para la vista admin
}

/** SolicitudARCO enriquecida con días restantes calculados en runtime. */
export interface SolicitudARCOEnriquecida extends SolicitudARCO {
  /** Días calendario hasta fecha_limite. Negativo = plazo vencido. */
  diasRestantes: number;
  /** true si el plazo legal ya venció y el estado aún no es "resuelta" */
  plazoVencido: boolean;
  /** Días hábiles hasta fecha_limite. Negativo = plazo vencido. */
  diasHabilesRestantes: number;
}

// ─── Helpers ──────────────────────────────────────────────────

function calcularDiasRestantesARCO(fechaLimite: string): number {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const limite = new Date(fechaLimite);
  limite.setHours(0, 0, 0, 0);
  const diffMs = limite.getTime() - hoy.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function enriquecerARCO(raw: SolicitudARCO): SolicitudARCOEnriquecida {
  const diasRestantes = calcularDiasRestantesARCO(raw.fecha_limite);
  const diasHabilesRestantes = calcularDiasHabilesRestantes(new Date(raw.fecha_limite));
  return {
    ...raw,
    diasRestantes,
    diasHabilesRestantes,
    plazoVencido: diasHabilesRestantes < 0 && raw.estado !== "resuelta",
  };
}

// ─── Etiquetas legibles ───────────────────────────────────────

export const ETIQUETAS_ARCO: Record<TipoARCO, string> = {
  acceso:         "Acceso a mis datos",
  rectificacion:  "Rectificación de datos",
  cancelacion:    "Cancelación / eliminación",
  oposicion:      "Oposición al tratamiento",
};

export const ETIQUETAS_ESTADO_ARCO: Record<EstadoARCO, string> = {
  recibida:    "Recibida",
  en_tramite:  "En trámite",
  resuelta:    "Resuelta",
};

// ─── Hook: consentimientos del miembro actual ─────────────────

/**
 * Consentimientos del usuario autenticado en su tenant.
 * El residente ve solo los suyos (RLS garantiza esto).
 * El admin_ph puede ver todos los del tenant pasando adminMode=true.
 */
export function useConsentimientosPropios() {
  const { user } = useAuth();
  const { data: tenant } = useTenant();
  const { data: miembro } = useCurrentMiembro(user ?? null);

  return useQuery<Consentimiento[]>({
    queryKey: ["consentimientos", tenant?.id, miembro?.id],
    queryFn: async () => {
      if (!tenant?.id || !miembro?.id) return [];

      const { data, error } = await supabase
        .from("consentimientos_tratamiento")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("miembro_id", miembro.id)
        .order("fecha", { ascending: false });

      if (error) throw error;
      return data as Consentimiento[];
    },
    enabled: !!tenant?.id && !!miembro?.id,
  });
}

/**
 * Vista admin: todos los consentimientos del tenant con join a miembros.
 * Solo retorna datos si el usuario tiene rol admin_ph (RLS bloquea el resto).
 */
export function useConsentimientosAdmin() {
  const { data: tenant } = useTenant();

  return useQuery<Consentimiento[]>({
    queryKey: ["consentimientos_admin", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];

      const { data, error } = await supabase
        .from("consentimientos_tratamiento")
        .select("*, miembros(nombre_completo)")
        .eq("tenant_id", tenant.id)
        .order("fecha", { ascending: false });

      if (error) throw error;
      return data as Consentimiento[];
    },
    enabled: !!tenant?.id,
  });
}

/**
 * ¿El miembro activo tiene la versión actual de la política aceptada?
 * Util para mostrar el banner de consentimiento en el portal.
 */
export function useConsentimientoVigente(versionActual: string) {
  const { data: consentimientos, isLoading, error } = useConsentimientosPropios();

  const tieneConsentimiento =
    consentimientos?.some(
      (c) => c.version_politica === versionActual && c.acepto === true
    ) ?? false;

  return { tieneConsentimiento, isLoading, error };
}

// ─── Mutación: registrar consentimiento ──────────────────────

export interface RegistrarConsentimientoInput {
  version_politica: string;
  acepto: boolean;
  canal?: CanalConsentimiento;
  ip_registro?: string;
}

/**
 * Registra el consentimiento del usuario autenticado.
 * Inmutable: inserta una nueva fila. No actualiza registros anteriores.
 * La BD tiene UNIQUE (miembro_id, version_politica, acepto) —
 * si el usuario acepta la misma versión dos veces, el segundo insert
 * retorna un error de unicidad que se maneja silenciosamente.
 */
export function useRegistrarConsentimiento() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: tenant } = useTenant();
  const { data: miembro } = useCurrentMiembro(user ?? null);

  return useMutation({
    mutationFn: async (input: RegistrarConsentimientoInput) => {
      if (!tenant?.id || !miembro?.id) {
        throw new Error("No hay sesión activa");
      }

      const { error } = await supabase
        .from("consentimientos_tratamiento")
        .insert({
          tenant_id:        tenant.id,
          miembro_id:       miembro.id,
          version_politica: input.version_politica,
          acepto:           input.acepto,
          canal:            input.canal ?? "portal",
          ip_registro:      input.ip_registro ?? null,
          // fecha se establece por DEFAULT NOW() en la BD — no se envía desde el cliente
        });

      // UNIQUE constraint: si ya existe este consentimiento, lo ignoramos
      if (error && error.code !== "23505") throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["consentimientos"] });
    },
  });
}

// ─── Hook: solicitudes ARCO del miembro actual ───────────────

/**
 * Solicitudes ARCO del usuario autenticado.
 * Cada solicitud viene enriquecida con diasRestantes y plazoVencido.
 */
export function useSolicitudesARCOPropias() {
  const { user } = useAuth();
  const { data: tenant } = useTenant();
  const { data: miembro } = useCurrentMiembro(user ?? null);

  const query = useQuery<SolicitudARCOEnriquecida[]>({
    queryKey: ["arco", tenant?.id, miembro?.id],
    queryFn: async () => {
      if (!tenant?.id || !miembro?.id) return [];

      const { data, error } = await supabase
        .from("solicitudes_arco")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("miembro_id", miembro.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as SolicitudARCO[]).map(enriquecerARCO);
    },
    enabled: !!tenant?.id && !!miembro?.id,
  });

  const solicitudesArco = query.data ?? [];
  const solicitudesVencidas = solicitudesArco.filter(s => s.diasHabilesRestantes < 0 && s.estado !== "resuelta");
  const solicitudesUrgentes = solicitudesArco.filter(s => s.diasHabilesRestantes >= 0 && s.diasHabilesRestantes <= 3 && s.estado !== "resuelta");

  return {
    ...query,
    solicitudesArco,
    solicitudesVencidas,
    solicitudesUrgentes,
  };
}

/**
 * Vista admin: todas las solicitudes ARCO del tenant con join a miembros.
 * Solo el admin_ph puede ver todas (RLS).
 * Incluye alertas de plazo vencido para gestión prioritaria.
 */
export function useSolicitudesARCOAdmin() {
  const { data: tenant } = useTenant();

  const query = useQuery<SolicitudARCOEnriquecida[]>({
    queryKey: ["arco_admin", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];

      const { data, error } = await supabase
        .from("solicitudes_arco")
        .select("*, miembros(nombre_completo)")
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as SolicitudARCO[]).map(enriquecerARCO);
    },
    enabled: !!tenant?.id,
  });

  const solicitudesArco = query.data ?? [];
  const solicitudesVencidas = solicitudesArco.filter(s => s.diasHabilesRestantes < 0 && s.estado !== "resuelta");
  const solicitudesUrgentes = solicitudesArco.filter(s => s.diasHabilesRestantes >= 0 && s.diasHabilesRestantes <= 3 && s.estado !== "resuelta");

  return {
    ...query,
    solicitudesArco,
    solicitudesVencidas,
    solicitudesUrgentes,
  };
}

// ─── Mutación: crear solicitud ARCO ──────────────────────────

export interface CrearSolicitudARCOInput {
  tipo: TipoARCO;
  descripcion: string;
}

/**
 * El residente/propietario crea su propia solicitud ARCO.
 * La fecha_limite se calcula automáticamente en la BD (NOW() + 14 días).
 */
export function useCrearSolicitudARCO() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: tenant } = useTenant();
  const { data: miembro } = useCurrentMiembro(user ?? null);

  return useMutation({
    mutationFn: async (input: CrearSolicitudARCOInput) => {
      if (!tenant?.id || !miembro?.id) {
        throw new Error("No hay sesión activa");
      }
      if (!input.descripcion.trim()) {
        throw new Error("La descripción de la solicitud es requerida");
      }

      const { error } = await supabase
        .from("solicitudes_arco")
        .insert({
          tenant_id:  tenant.id,
          miembro_id: miembro.id,
          tipo:        input.tipo,
          descripcion: input.descripcion.trim(),
          estado:      "recibida",
          // fecha_limite: calculada por DEFAULT en la BD
        });

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["arco"] });
      qc.invalidateQueries({ queryKey: ["arco_admin"] });
    },
  });
}

// ─── Mutación: actualizar solicitud ARCO (admin_ph) ──────────

export interface ActualizarSolicitudARCOInput {
  id: string;
  estado: EstadoARCO;
  respuesta?: string;
}

/**
 * El admin_ph cambia el estado de una solicitud y agrega la respuesta.
 * Al resolverla, se registra fecha_resolucion automáticamente.
 */
export function useActualizarSolicitudARCO() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, estado, respuesta }: ActualizarSolicitudARCOInput) => {
      const updates: Partial<SolicitudARCO> = { estado, respuesta: respuesta ?? null };

      if (estado === "resuelta") {
        updates.fecha_resolucion = new Date().toISOString();
      }

      const { error } = await supabase
        .from("solicitudes_arco")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["arco"] });
      qc.invalidateQueries({ queryKey: ["arco_admin"] });
    },
  });
}

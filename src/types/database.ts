// Generado con Supabase CLI — CoproAdmin
export type TenantType =
  | "fondo_familiar"
  | "propiedad_horizontal"
  | "fondo_empleados";
// --- Tenant ---
export interface Tenant {
  id: string;
  nombre: string;
  slug: string;
  capital_inicial: number;
  tasa_interes_mensual: number;
  max_prestamo_por_miembro: number;
  cuota_mensual: number;
  dia_corte: number;
  multa_mora: number;
  activo: boolean;
  created_at: string;
  tenant_type: TenantType;
  nit?: string | null;
  direccion?: string | null;
  num_unidades?: number | null;
  trial_ends_at?: string | null;
  suscripcion_activa: boolean;
  plan: 'trial' | 'basico' | 'pro';
}

export type TenantInsert = Omit<Tenant, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};

export type TenantUpdate = Partial<Omit<Tenant, "id" | "created_at">>;

export interface Miembro {
  id: string;
  tenant_id: string;
  user_id: string | null;
  nombre_completo: string;
  cedula: string | null;
  email: string | null;
  telefono: string | null;
  rol: "admin_ph" | "propietario" | "residente" | "admin" | "tesorero" | "comite" | "miembro";
  estado: "activo" | "inactivo" | "suspendido";
  created_at: string;
}

export interface Prestamo {
  id: string;
  tenant_id: string;
  solicitante_id: string;
  fiador_id: string | null;
  monto: number;
  plazo_meses: number;
  tasa_mensual: number; // decimal: 0.015 = 1.5%
  cuota_mensual: number;
  cuotas_pagadas: number;
  estado:
    | "solicitado"
    | "aprobado"
    | "activo"
    | "pagado"
    | "cancelado"
    | "vencido";
  fecha_solicitud: string;
  fecha_aprobacion: string | null;
  aprobado_por: string | null;
  fecha_primer_vencimiento: string | null;
  saldo_pendiente: number;
  motivo_cancelacion: string | null;
  created_at: string;
  updated_at: string;
}

export interface CuotaAmortizacion {
  id: string;
  prestamo_id: string;
  tenant_id: string;
  numero_cuota: number;
  fecha_vencimiento: string;
  capital: number;
  interes: number;
  cuota_total: number;
  estado: "pendiente" | "pagado" | "vencido";
  fecha_pago: string | null;
  pago_id: string | null;
}

export interface Pago {
  id: string;
  tenant_id: string;
  prestamo_id?: string;
  miembro_id: string;
  registrado_por?: string;
  monto: number;
  fecha_pago: string;
  cuotas_cubiertas?: number[];
  notas?: string | null;
  concepto?: string;
  estado?: "pendiente" | "pagado" | "vencido";
  unidad_id?: string;
  cuota_admin_id?: string;
  referencia_wompi?: string;
  created_at: string;
}

export interface MovimientoFondo {
  id: string;
  tenant_id: string;
  tipo:
    | "aporte"
    | "prestamo_desembolso"
    | "prestamo_pago"
    | "multa"
    | "rendimiento"
    | "retiro"
    | "ingreso"
    | "egreso";
  monto: number;
  referencia_id: string | null;
  descripcion: string;
  categoria?: string;
  registrado_por: string | null;
  miembro_id: string | null;
  comprobante_url: string | null;
  created_at: string;
}

// ─── Tipos Propiedad Horizontal (PH) ──────────────────────────

export interface Unidad {
  id: string;
  tenant_id: string;
  miembro_id: string | null;
  numero: string;
  tipo: "apartamento" | "local_comercial" | "parqueadero" | "deposito";
  coeficiente: number;
  piso?: number | null;
  torre?: string | null;
  created_at: string;
}

export interface CuotaAdministracion {
  id: string;
  tenant_id: string;
  unidad_id: string;
  periodo: string; // date: "YYYY-MM-DD"
  monto: number;
  estado: "pendiente" | "pagado" | "vencido";
  fecha_pago?: string | null;
  pago_id?: string | null;
  comprobante_url?: string | null;
  created_at: string;
}

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

export interface Reserva {
  id: string;
  tenant_id: string;
  zona_id: string;
  unidad_id: string;
  miembro_id: string;
  fecha: string; // date
  hora_inicio: string;
  hora_fin: string;
  estado: "confirmada" | "cancelada";
  cancelacion_motivo?: string | null;
  created_at: string;
}

export interface PQR {
  id: string;
  tenant_id: string;
  unidad_id: string;
  miembro_id: string;
  tipo: "peticion" | "queja" | "reclamo";
  asunto: string;
  descripcion: string;
  estado: "abierto" | "en_gestion" | "cerrado";
  respuesta?: string | null;
  fecha_cierre?: string | null;
  created_at: string;
}

export interface PresupuestoPH {
  id: string;
  tenant_id: string;
  anio: number;
  concepto: string;
  categoria:
    | "administracion"
    | "mantenimiento"
    | "seguridad"
    | "servicios_publicos"
    | "reserva";
  monto_presupuestado: number;
  created_at: string;
}

export interface Asamblea {
  id: string;
  tenant_id: string;
  tipo: "ordinaria" | "extraordinaria";
  fecha: string; // timestamp
  lugar: string;
  orden_del_dia: string[];
  quorum_requerido: number;
  quorum_alcanzado?: number | null;
  acta_url?: string | null;
  estado: "convocada" | "realizada" | "cancelada";
  created_at: string;
}

// ─── Tipos enriquecidos para la UI ─────────────────────────────

export interface PrestamoConMiembro extends Prestamo {
  solicitante: Pick<Miembro, "nombre_completo">;
}

export interface MovimientoConMiembro extends MovimientoFondo {
  miembro: Pick<Miembro, "nombre_completo"> | null;
}

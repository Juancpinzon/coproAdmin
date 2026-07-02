-- ============================================================
-- 016 — Índices faltantes (auditoría full-stack, Módulo Performance)
-- ============================================================
-- La BD viva ya tenía varios idx_* creados a mano (cuotas, unidades, pqr),
-- pero faltaban índices en columnas de filtro caliente. El más crítico:
-- miembros.user_id — usado por get_user_tenant_id() y get_user_rol(), que
-- corren en CADA evaluación RLS de CADA query de la app. Sin él, cada
-- consulta hace seq scan sobre miembros.
--
-- Todos IF NOT EXISTS: idempotente y seguro de re-ejecutar.
-- ============================================================

-- ─── miembros: ruta caliente de RLS (helpers SECURITY DEFINER) ───
CREATE INDEX IF NOT EXISTS idx_miembros_user   ON public.miembros (user_id);
CREATE INDEX IF NOT EXISTS idx_miembros_tenant ON public.miembros (tenant_id);

-- ─── pagos: dashboard/cobros y joins ─────────────────────────────
CREATE INDEX IF NOT EXISTS idx_pagos_tenant ON public.pagos (tenant_id);
CREATE INDEX IF NOT EXISTS idx_pagos_unidad ON public.pagos (unidad_id);
CREATE INDEX IF NOT EXISTS idx_pagos_cuota  ON public.pagos (cuota_admin_id);

-- ─── movimientos_fondo: recaudo por tenant y por fecha ───────────
CREATE INDEX IF NOT EXISTS idx_movimientos_tenant ON public.movimientos_fondo (tenant_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha  ON public.movimientos_fondo (fecha);

-- ─── presupuesto_ph: filtro por tenant + año ─────────────────────
CREATE INDEX IF NOT EXISTS idx_presupuesto_tenant ON public.presupuesto_ph (tenant_id);

-- ─── zonas_comunes: listado por tenant ───────────────────────────
CREATE INDEX IF NOT EXISTS idx_zonas_tenant ON public.zonas_comunes (tenant_id);

-- ─── reservas: filtro por tenant + verificación de conflicto ─────
CREATE INDEX IF NOT EXISTS idx_reservas_tenant     ON public.reservas (tenant_id);
CREATE INDEX IF NOT EXISTS idx_reservas_zona_fecha ON public.reservas (zona_id, fecha);

-- ─── VERIFICACIÓN ─────────────────────────────────────────────
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('miembros','pagos','movimientos_fondo','presupuesto_ph','zonas_comunes','reservas')
ORDER BY tablename, indexname;

-- ============================================================
-- 012 — Reconciliar schema de pagos/movimientos con el uso PH
-- ============================================================
-- Las migraciones 001–009 dejaron 'pagos' y 'movimientos_fondo' con el
-- schema del fondo familiar. El flujo PH (registrar_pago_cuota — 010) y
-- los tipos generados (src/types/database.ts) asumen columnas y un CHECK
-- que en la BD viva solo existían por ALTERs manuales NO reproducibles:
-- una reconstrucción limpia desde migraciones rompía el RPC en runtime
-- ('ingreso' violaba el CHECK; faltaban columnas en 'pagos').
--
-- Esta migración los hace explícitos e idempotentes. Es segura de correr
-- sobre la BD viva (IF NOT EXISTS / IF EXISTS / DROP NOT NULL son no-op
-- si ya se aplicaron a mano) y deja el esquema reproducible en cualquier
-- entorno (staging, dev nuevo, CI).
-- ============================================================

-- ─── 1. Columnas PH en 'pagos' ───────────────────────────────
-- El schema del fondo (001) no tenía estas columnas. El RLS de 008 ya
-- referenciaba pagos.unidad_id asumiéndola creada: aquí queda explícita.
ALTER TABLE public.pagos
  ADD COLUMN IF NOT EXISTS concepto         TEXT,
  ADD COLUMN IF NOT EXISTS estado           TEXT,
  ADD COLUMN IF NOT EXISTS unidad_id        UUID REFERENCES public.unidades(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cuota_admin_id   UUID REFERENCES public.cuotas_administracion(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referencia_wompi TEXT;

-- ─── 2. Relajar NOT NULL heredados del fondo ─────────────────
-- Un pago PH no nace de un préstamo (prestamo_id), el registro es
-- server-side vía RPC (registrado_por), y una unidad puede no tener
-- propietario asignado todavía (miembro_id). DROP NOT NULL es no-op si
-- la columna ya es nullable.
ALTER TABLE public.pagos ALTER COLUMN prestamo_id    DROP NOT NULL;
ALTER TABLE public.pagos ALTER COLUMN registrado_por DROP NOT NULL;
ALTER TABLE public.pagos ALTER COLUMN miembro_id     DROP NOT NULL;

-- ─── 3. 'ingreso'/'egreso' en el CHECK de movimientos_fondo.tipo ─
-- El CHECK inline de 001 (nombre autogenerado movimientos_fondo_tipo_check)
-- no incluía 'ingreso'/'egreso', pero el RPC PH inserta tipo='ingreso'.
-- Se recrea el CHECK con la lista completa (fondo + PH).
ALTER TABLE public.movimientos_fondo
  DROP CONSTRAINT IF EXISTS movimientos_fondo_tipo_check;

ALTER TABLE public.movimientos_fondo
  ADD CONSTRAINT movimientos_fondo_tipo_check
    CHECK (tipo IN (
      'aporte', 'prestamo_desembolso', 'prestamo_pago',
      'multa', 'rendimiento', 'retiro',
      'ingreso', 'egreso'
    ));

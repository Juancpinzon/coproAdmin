-- ============================================================
-- FondoApp — Features demo: invite, aportes, amortización,
--            solicitud/aprobación préstamos, comprobantes
-- Ejecutar completo en Supabase SQL Editor
-- NOTA: Crear el bucket 'comprobantes' en Supabase Dashboard
--       (Storage → New Bucket → nombre: comprobantes, privado)
--       ANTES de ejecutar este archivo.
-- ============================================================

-- ─── 1. COLUMNA comprobante_url en movimientos_fondo ─────────
ALTER TABLE public.movimientos_fondo
  ADD COLUMN IF NOT EXISTS comprobante_url TEXT;

-- ─── 2. RLS STORAGE BUCKET comprobantes ──────────────────────
-- Solo miembros del mismo tenant pueden subir/ver comprobantes.
-- Ruta esperada: {tenant_id}/{miembro_id}/{uuid}.ext

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'comprobantes_insert'
  ) THEN
    CREATE POLICY "comprobantes_insert" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'comprobantes'
        AND (storage.foldername(name))[1] = public.get_user_tenant_id()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'comprobantes_select'
  ) THEN
    CREATE POLICY "comprobantes_select" ON storage.objects
      FOR SELECT TO authenticated
      USING (
        bucket_id = 'comprobantes'
        AND (storage.foldername(name))[1] = public.get_user_tenant_id()::text
      );
  END IF;
END $$;

-- ─── 3. FUNCIÓN: generar_cuotas_amortizacion ─────────────────
-- Genera la tabla de amortización francesa (cuota fija) para un
-- préstamo aprobado. Llamada internamente desde aprobar_prestamo.
-- SECURITY DEFINER para bypassar la política cuotas_insert que
-- requiere admin/tesorero (la validación de rol la hace el caller).

CREATE OR REPLACE FUNCTION public.generar_cuotas_amortizacion(
  p_prestamo_id UUID
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_prestamo    public.prestamos%ROWTYPE;
  v_saldo       BIGINT;
  v_cuota_fija  BIGINT;
  v_interes     BIGINT;
  v_capital     BIGINT;
  v_cuota_total BIGINT;
  v_fecha       DATE;
  i             INTEGER;
BEGIN
  SELECT * INTO v_prestamo FROM public.prestamos WHERE id = p_prestamo_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Préstamo % no encontrado', p_prestamo_id;
  END IF;

  v_cuota_fija := v_prestamo.cuota_mensual;
  v_saldo      := v_prestamo.monto;
  v_fecha      := v_prestamo.fecha_primer_vencimiento;

  FOR i IN 1..v_prestamo.plazo_meses LOOP
    v_interes := ROUND(v_saldo * v_prestamo.tasa_mensual);

    IF i = v_prestamo.plazo_meses THEN
      -- Última cuota: el capital es el saldo restante (absorbe redondeo)
      v_capital     := v_saldo;
      v_cuota_total := v_saldo + v_interes;
    ELSE
      v_capital     := v_cuota_fija - v_interes;
      v_cuota_total := v_cuota_fija;
    END IF;

    INSERT INTO public.cuotas_amortizacion (
      prestamo_id, tenant_id, numero_cuota,
      fecha_vencimiento, capital, interes, cuota_total, estado
    ) VALUES (
      p_prestamo_id, v_prestamo.tenant_id, i,
      v_fecha, v_capital, v_interes, v_cuota_total, 'pendiente'
    )
    ON CONFLICT (prestamo_id, numero_cuota) DO NOTHING;

    v_saldo := v_saldo - v_capital;
    v_fecha := (v_fecha + INTERVAL '1 month')::DATE;
  END LOOP;
END;
$$;

ALTER FUNCTION public.generar_cuotas_amortizacion(UUID) OWNER TO postgres;

-- ─── 4. FUNCIÓN: aprobar_prestamo ────────────────────────────
-- Atomiza: update préstamo + generar cuotas + registrar movimiento.
-- Protege contra condición de carrera (dos admins aprobando a la vez).

CREATE OR REPLACE FUNCTION public.aprobar_prestamo(
  p_prestamo_id              UUID,
  p_aprobador_id             UUID,
  p_fecha_primer_vencimiento DATE
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_prestamo public.prestamos%ROWTYPE;
BEGIN
  IF public.get_user_rol() NOT IN ('admin', 'tesorero') THEN
    RAISE EXCEPTION 'Solo admin o tesorero puede aprobar préstamos';
  END IF;

  -- Bloqueo de fila para evitar doble aprobación
  SELECT * INTO v_prestamo
  FROM public.prestamos WHERE id = p_prestamo_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Préstamo no encontrado';
  END IF;
  IF v_prestamo.estado != 'solicitado' THEN
    RAISE EXCEPTION 'El préstamo no está en estado solicitado (actual: %)', v_prestamo.estado;
  END IF;

  -- 1. Actualizar préstamo
  UPDATE public.prestamos SET
    estado                   = 'activo',
    fecha_aprobacion         = NOW(),
    aprobado_por             = p_aprobador_id,
    fecha_primer_vencimiento = p_fecha_primer_vencimiento,
    saldo_pendiente          = monto
  WHERE id = p_prestamo_id;

  -- 2. Generar cuotas de amortización
  PERFORM public.generar_cuotas_amortizacion(p_prestamo_id);

  -- 3. Registrar movimiento del fondo (negativo = dinero sale)
  INSERT INTO public.movimientos_fondo (
    tenant_id, tipo, monto, referencia_id, descripcion,
    registrado_por, miembro_id
  ) VALUES (
    v_prestamo.tenant_id,
    'prestamo_desembolso',
    -v_prestamo.monto,
    p_prestamo_id,
    'Desembolso préstamo aprobado',
    p_aprobador_id,
    v_prestamo.solicitante_id
  );
END;
$$;

ALTER FUNCTION public.aprobar_prestamo(UUID, UUID, DATE) OWNER TO postgres;

-- ─── 5. FUNCIÓN: rechazar_prestamo ───────────────────────────

CREATE OR REPLACE FUNCTION public.rechazar_prestamo(
  p_prestamo_id UUID,
  p_motivo      TEXT
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  IF public.get_user_rol() NOT IN ('admin', 'tesorero') THEN
    RAISE EXCEPTION 'Solo admin o tesorero puede rechazar préstamos';
  END IF;

  IF TRIM(p_motivo) = '' THEN
    RAISE EXCEPTION 'El motivo de rechazo es requerido';
  END IF;

  UPDATE public.prestamos SET
    estado             = 'cancelado',
    motivo_cancelacion = p_motivo
  WHERE id = p_prestamo_id
    AND estado = 'solicitado';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Préstamo no encontrado o ya procesado';
  END IF;
END;
$$;

ALTER FUNCTION public.rechazar_prestamo(UUID, TEXT) OWNER TO postgres;

-- ─── 6. FUNCIÓN: registrar_pago_cuota ────────────────────────
-- Registra el pago de una cuota específica de forma atómica:
-- crea el pago, marca la cuota, actualiza saldo del préstamo
-- y registra el movimiento del fondo.

CREATE OR REPLACE FUNCTION public.registrar_pago_cuota(
  p_cuota_id       UUID,
  p_registrador_id UUID,
  p_fecha_pago     DATE,
  p_notas          TEXT DEFAULT NULL
)
RETURNS UUID  -- retorna el id del nuevo pago
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_cuota       public.cuotas_amortizacion%ROWTYPE;
  v_prestamo    public.prestamos%ROWTYPE;
  v_pago_id     UUID;
  v_nuevo_saldo BIGINT;
  v_pagadas     INTEGER;
  v_nuevo_estado TEXT;
BEGIN
  IF public.get_user_rol() NOT IN ('admin', 'tesorero') THEN
    RAISE EXCEPTION 'Solo admin o tesorero puede registrar pagos';
  END IF;

  SELECT * INTO v_cuota
  FROM public.cuotas_amortizacion WHERE id = p_cuota_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cuota no encontrada';
  END IF;
  IF v_cuota.estado = 'pagado' THEN
    RAISE EXCEPTION 'Esta cuota ya fue pagada';
  END IF;

  SELECT * INTO v_prestamo
  FROM public.prestamos WHERE id = v_cuota.prestamo_id;

  -- 1. Crear registro de pago
  INSERT INTO public.pagos (
    tenant_id, prestamo_id, miembro_id, registrado_por,
    monto, fecha_pago, cuotas_cubiertas, notas
  ) VALUES (
    v_cuota.tenant_id,
    v_cuota.prestamo_id,
    v_prestamo.solicitante_id,
    p_registrador_id,
    v_cuota.cuota_total,
    p_fecha_pago,
    ARRAY[v_cuota.numero_cuota],
    p_notas
  ) RETURNING id INTO v_pago_id;

  -- 2. Marcar cuota como pagada
  UPDATE public.cuotas_amortizacion SET
    estado     = 'pagado',
    fecha_pago = NOW(),
    pago_id    = v_pago_id
  WHERE id = p_cuota_id;

  -- 3. Actualizar saldo del préstamo
  v_nuevo_saldo  := v_prestamo.saldo_pendiente - v_cuota.capital;
  v_pagadas      := v_prestamo.cuotas_pagadas + 1;
  v_nuevo_estado := CASE
    WHEN v_pagadas >= v_prestamo.plazo_meses THEN 'pagado'
    ELSE 'activo'
  END;

  UPDATE public.prestamos SET
    saldo_pendiente = v_nuevo_saldo,
    cuotas_pagadas  = v_pagadas,
    estado          = v_nuevo_estado
  WHERE id = v_cuota.prestamo_id;

  -- 4. Registrar movimiento del fondo
  INSERT INTO public.movimientos_fondo (
    tenant_id, tipo, monto, referencia_id, descripcion,
    registrado_por, miembro_id
  ) VALUES (
    v_cuota.tenant_id,
    'prestamo_pago',
    v_cuota.cuota_total,
    v_pago_id,
    'Pago cuota ' || v_cuota.numero_cuota || '/' || v_prestamo.plazo_meses,
    p_registrador_id,
    v_prestamo.solicitante_id
  );

  RETURN v_pago_id;
END;
$$;

ALTER FUNCTION public.registrar_pago_cuota(UUID, UUID, DATE, TEXT) OWNER TO postgres;

-- ─── VERIFICACIÓN ─────────────────────────────────────────────
SELECT routine_name, security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'generar_cuotas_amortizacion',
    'aprobar_prestamo',
    'rechazar_prestamo',
    'registrar_pago_cuota'
  );

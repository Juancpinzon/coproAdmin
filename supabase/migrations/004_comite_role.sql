-- ============================================================
-- FondoApp — Rol Comité
-- Agrega 'comite' como rol válido y le permite aprobar/rechazar
-- solicitudes de préstamo.
-- ============================================================

-- ─── 1. Ampliar CHECK constraint en miembros.rol ─────────────
ALTER TABLE public.miembros
  DROP CONSTRAINT IF EXISTS miembros_rol_check;

ALTER TABLE public.miembros
  ADD CONSTRAINT miembros_rol_check
  CHECK (rol IN ('admin', 'tesorero', 'comite', 'miembro'));

-- ─── 2. Actualizar aprobar_prestamo para aceptar comité ──────
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
  IF public.get_user_rol() NOT IN ('admin', 'tesorero', 'comite') THEN
    RAISE EXCEPTION 'Solo admin, tesorero o comité puede aprobar préstamos';
  END IF;

  SELECT * INTO v_prestamo
  FROM public.prestamos WHERE id = p_prestamo_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Préstamo no encontrado';
  END IF;
  IF v_prestamo.estado != 'solicitado' THEN
    RAISE EXCEPTION 'El préstamo no está en estado solicitado (actual: %)', v_prestamo.estado;
  END IF;

  UPDATE public.prestamos SET
    estado                   = 'activo',
    fecha_aprobacion         = NOW(),
    aprobado_por             = p_aprobador_id,
    fecha_primer_vencimiento = p_fecha_primer_vencimiento,
    saldo_pendiente          = monto
  WHERE id = p_prestamo_id;

  PERFORM public.generar_cuotas_amortizacion(p_prestamo_id);

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

-- ─── 3. Actualizar rechazar_prestamo para aceptar comité ─────
CREATE OR REPLACE FUNCTION public.rechazar_prestamo(
  p_prestamo_id UUID,
  p_motivo      TEXT
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  IF public.get_user_rol() NOT IN ('admin', 'tesorero', 'comite') THEN
    RAISE EXCEPTION 'Solo admin, tesorero o comité puede rechazar préstamos';
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

-- ─── VERIFICACIÓN ─────────────────────────────────────────────
-- Confirmar que el constraint fue actualizado:
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'miembros_rol_check';

-- ============================================================
-- 010 — RPC transaccional: registrar_pago_cuota
-- ============================================================
-- Reemplaza la orquestación desde el cliente (4 llamadas sueltas:
-- leer cuota → insert pago → update cuota → insert movimiento)
-- por UNA transacción atómica con bloqueo de fila.
--
-- Por qué:
--  - El JS client de Supabase NO garantiza transacción multi-sentencia.
--    Si fallaba el paso 3 o 4, quedaba un pago sin cuota actualizada
--    o una cuota "pagada" sin ingreso en caja → caja descuadrada.
--  - Sin SELECT ... FOR UPDATE, dos registros concurrentes de la misma
--    cuota podían duplicar el movimiento de ingreso (doble clic / carrera).
--
-- SECURITY DEFINER: escribe en pagos + cuotas + movimientos de forma
-- atómica sin depender de políticas RLS por tabla (que para PH usan
-- rol 'admin_ph' de forma inconsistente). La autorización se valida
-- explícitamente dentro de la función. Mismo patrón que aprobar_prestamo.
-- ============================================================

CREATE OR REPLACE FUNCTION public.registrar_pago_cuota(
  p_cuota_id        UUID,
  p_fecha_pago      DATE,
  p_comprobante_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp AS $$
DECLARE
  v_tenant         UUID;
  v_rol            TEXT;
  v_estado_miembro TEXT;
  v_monto          BIGINT;
  v_unidad         UUID;
  v_estado         TEXT;
  v_cuota_tnt      UUID;
  v_miembro        UUID;
  v_pago_id        UUID;
BEGIN
  -- 1. Autorización: el llamante debe ser un miembro ACTIVO con rol
  --    admin_ph. Leemos rol, tenant y estado de la MISMA fila de miembros
  --    para que las tres validaciones sean consistentes entre sí.
  SELECT tenant_id, rol, estado
    INTO v_tenant, v_rol, v_estado_miembro
  FROM public.miembros
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_tenant IS NULL OR v_rol <> 'admin_ph' THEN
    RAISE EXCEPTION 'No autorizado: se requiere rol admin_ph';
  END IF;

  IF v_estado_miembro <> 'activo' THEN
    RAISE EXCEPTION 'No autorizado: el miembro no está activo (estado: %)', v_estado_miembro;
  END IF;

  -- 2. Bloquear la cuota hasta el commit (serializa registros concurrentes).
  SELECT monto, tenant_id, unidad_id, estado
    INTO v_monto, v_cuota_tnt, v_unidad, v_estado
  FROM public.cuotas_administracion
  WHERE id = p_cuota_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cuota % no encontrada', p_cuota_id;
  END IF;

  -- 3. Aislamiento multi-tenant: la cuota debe ser del tenant del llamante.
  IF v_cuota_tnt <> v_tenant THEN
    RAISE EXCEPTION 'No autorizado: la cuota pertenece a otro conjunto';
  END IF;

  -- 4. Idempotencia: una cuota ya pagada no se vuelve a pagar.
  --    Bajo concurrencia, la 2da llamada queda aquí tras el FOR UPDATE.
  IF v_estado = 'pagado' THEN
    RAISE EXCEPTION 'La cuota % ya está pagada', p_cuota_id;
  END IF;

  -- 5. Propietario de la unidad (atribución del pago). Puede ser NULL si la
  --    unidad aún no tiene propietario asignado; pagos.miembro_id es nullable.
  SELECT miembro_id INTO v_miembro
  FROM public.unidades
  WHERE id = v_unidad;

  -- 6. Insertar el pago.
  INSERT INTO public.pagos (
    tenant_id, miembro_id, monto, fecha_pago, cuota_admin_id, unidad_id, concepto, estado
  ) VALUES (
    v_tenant, v_miembro, v_monto, p_fecha_pago, p_cuota_id, v_unidad,
    'Cuota administración', 'pagado'
  )
  RETURNING id INTO v_pago_id;

  -- 7. Marcar la cuota como pagada.
  UPDATE public.cuotas_administracion
     SET estado = 'pagado',
         fecha_pago = p_fecha_pago,
         pago_id = v_pago_id,
         comprobante_url = p_comprobante_url
   WHERE id = p_cuota_id;

  -- 8. Registrar el ingreso en caja. `fecha` = fecha del pago para que los
  --    reportes que agrupan por fecha (p.ej. recaudo mensual) incluyan el
  --    movimiento (antes quedaba NULL y se saltaba de esos agregados).
  INSERT INTO public.movimientos_fondo (
    tenant_id, tipo, monto, descripcion, categoria, referencia_id, fecha
  ) VALUES (
    v_tenant, 'ingreso', v_monto,
    'Pago cuota de administración', 'administracion', v_pago_id, p_fecha_pago
  );

  -- Todo o nada: un solo commit al retornar.
  RETURN v_pago_id;
END;
$$;

ALTER FUNCTION public.registrar_pago_cuota(UUID, DATE, TEXT) OWNER TO postgres;

-- Permitir invocarla solo a usuarios autenticados (la autorización fina
-- la hace la propia función por rol admin_ph).
REVOKE ALL ON FUNCTION public.registrar_pago_cuota(UUID, DATE, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registrar_pago_cuota(UUID, DATE, TEXT) TO authenticated;

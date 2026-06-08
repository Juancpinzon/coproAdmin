-- ============================================================
-- CoproAdmin — RLS para tablas core de Propiedad Horizontal
-- Fase 8 / Auditoría de seguridad pre-lanzamiento
--
-- Estas tablas fueron creadas directamente en el SQL Editor
-- sin migración. Este archivo las documenta y protege.
--
-- Patrón RLS: usa get_user_tenant_id() y get_user_rol()
-- definidos en 001_initial_schema.sql.
-- ============================================================

-- ─── 1. UNIDADES ─────────────────────────────────────────────
ALTER TABLE public.unidades ENABLE ROW LEVEL SECURITY;

-- admin_ph ve todas las unidades de su tenant
DROP POLICY IF EXISTS "unidades_admin_select" ON public.unidades;
CREATE POLICY "unidades_admin_select" ON public.unidades
  FOR SELECT USING (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_rol() = 'admin_ph'
  );

-- propietario/residente ve solo su propia unidad
DROP POLICY IF EXISTS "unidades_residente_select" ON public.unidades;
CREATE POLICY "unidades_residente_select" ON public.unidades
  FOR SELECT USING (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_rol() IN ('propietario', 'residente')
    AND miembro_id = (SELECT id FROM public.miembros WHERE user_id = auth.uid() LIMIT 1)
  );

-- Solo admin_ph puede crear/modificar unidades
DROP POLICY IF EXISTS "unidades_insert" ON public.unidades;
CREATE POLICY "unidades_insert" ON public.unidades
  FOR INSERT WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_rol() = 'admin_ph'
  );

DROP POLICY IF EXISTS "unidades_update" ON public.unidades;
CREATE POLICY "unidades_update" ON public.unidades
  FOR UPDATE USING (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_rol() = 'admin_ph'
  );

DROP POLICY IF EXISTS "unidades_delete" ON public.unidades;
CREATE POLICY "unidades_delete" ON public.unidades
  FOR DELETE USING (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_rol() = 'admin_ph'
  );

-- ─── 2. ZONAS COMUNES ────────────────────────────────────────
ALTER TABLE public.zonas_comunes ENABLE ROW LEVEL SECURITY;

-- Todos los miembros del tenant pueden ver zonas activas
DROP POLICY IF EXISTS "zonas_select" ON public.zonas_comunes;
CREATE POLICY "zonas_select" ON public.zonas_comunes
  FOR SELECT USING (tenant_id = public.get_user_tenant_id());

-- Solo admin_ph puede crear/modificar zonas
DROP POLICY IF EXISTS "zonas_insert" ON public.zonas_comunes;
CREATE POLICY "zonas_insert" ON public.zonas_comunes
  FOR INSERT WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_rol() = 'admin_ph'
  );

DROP POLICY IF EXISTS "zonas_update" ON public.zonas_comunes;
CREATE POLICY "zonas_update" ON public.zonas_comunes
  FOR UPDATE USING (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_rol() = 'admin_ph'
  );

DROP POLICY IF EXISTS "zonas_delete" ON public.zonas_comunes;
CREATE POLICY "zonas_delete" ON public.zonas_comunes
  FOR DELETE USING (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_rol() = 'admin_ph'
  );

-- ─── 3. RESERVAS ─────────────────────────────────────────────
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;

-- admin_ph ve todas las reservas del tenant
DROP POLICY IF EXISTS "reservas_admin_select" ON public.reservas;
CREATE POLICY "reservas_admin_select" ON public.reservas
  FOR SELECT USING (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_rol() = 'admin_ph'
  );

-- propietario/residente ve solo sus propias reservas
DROP POLICY IF EXISTS "reservas_residente_select" ON public.reservas;
CREATE POLICY "reservas_residente_select" ON public.reservas
  FOR SELECT USING (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_rol() IN ('propietario', 'residente')
    AND miembro_id = (SELECT id FROM public.miembros WHERE user_id = auth.uid() LIMIT 1)
  );

-- Cualquier miembro autenticado del tenant puede crear reservas en su nombre
DROP POLICY IF EXISTS "reservas_insert" ON public.reservas;
CREATE POLICY "reservas_insert" ON public.reservas
  FOR INSERT WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND miembro_id = (SELECT id FROM public.miembros WHERE user_id = auth.uid() LIMIT 1)
  );

-- Solo admin_ph puede cancelar cualquier reserva;
-- propietario/residente solo las suyas
DROP POLICY IF EXISTS "reservas_update" ON public.reservas;
CREATE POLICY "reservas_update" ON public.reservas
  FOR UPDATE USING (
    tenant_id = public.get_user_tenant_id()
    AND (
      public.get_user_rol() = 'admin_ph'
      OR miembro_id = (SELECT id FROM public.miembros WHERE user_id = auth.uid() LIMIT 1)
    )
  );

-- ─── 4. PQR ──────────────────────────────────────────────────
ALTER TABLE public.pqr ENABLE ROW LEVEL SECURITY;

-- admin_ph ve todas las PQR del tenant
DROP POLICY IF EXISTS "pqr_admin_select" ON public.pqr;
CREATE POLICY "pqr_admin_select" ON public.pqr
  FOR SELECT USING (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_rol() = 'admin_ph'
  );

-- propietario/residente ve solo sus propias PQR
DROP POLICY IF EXISTS "pqr_residente_select" ON public.pqr;
CREATE POLICY "pqr_residente_select" ON public.pqr
  FOR SELECT USING (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_rol() IN ('propietario', 'residente')
    AND miembro_id = (SELECT id FROM public.miembros WHERE user_id = auth.uid() LIMIT 1)
  );

-- Cualquier miembro puede crear PQR en su nombre
DROP POLICY IF EXISTS "pqr_insert" ON public.pqr;
CREATE POLICY "pqr_insert" ON public.pqr
  FOR INSERT WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND miembro_id = (SELECT id FROM public.miembros WHERE user_id = auth.uid() LIMIT 1)
  );

-- Solo admin_ph puede gestionar (cambiar estado, agregar respuesta)
DROP POLICY IF EXISTS "pqr_update" ON public.pqr;
CREATE POLICY "pqr_update" ON public.pqr
  FOR UPDATE USING (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_rol() = 'admin_ph'
  );

-- ─── 5. PRESUPUESTO PH ───────────────────────────────────────
ALTER TABLE public.presupuesto_ph ENABLE ROW LEVEL SECURITY;

-- Todos los miembros del tenant pueden ver el presupuesto (transparencia)
DROP POLICY IF EXISTS "presupuesto_select" ON public.presupuesto_ph;
CREATE POLICY "presupuesto_select" ON public.presupuesto_ph
  FOR SELECT USING (tenant_id = public.get_user_tenant_id());

-- Solo admin_ph puede crear/modificar/eliminar ítems de presupuesto
DROP POLICY IF EXISTS "presupuesto_insert" ON public.presupuesto_ph;
CREATE POLICY "presupuesto_insert" ON public.presupuesto_ph
  FOR INSERT WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_rol() = 'admin_ph'
  );

DROP POLICY IF EXISTS "presupuesto_update" ON public.presupuesto_ph;
CREATE POLICY "presupuesto_update" ON public.presupuesto_ph
  FOR UPDATE USING (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_rol() = 'admin_ph'
  );

DROP POLICY IF EXISTS "presupuesto_delete" ON public.presupuesto_ph;
CREATE POLICY "presupuesto_delete" ON public.presupuesto_ph
  FOR DELETE USING (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_rol() = 'admin_ph'
  );

-- ─── 6. CUOTAS DE ADMINISTRACIÓN ─────────────────────────────
ALTER TABLE public.cuotas_administracion ENABLE ROW LEVEL SECURITY;

-- admin_ph ve todas las cuotas de su tenant
DROP POLICY IF EXISTS "cuotas_admin_select" ON public.cuotas_administracion;
CREATE POLICY "cuotas_admin_select" ON public.cuotas_administracion
  FOR SELECT USING (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_rol() = 'admin_ph'
  );

-- propietario/residente ve solo las cuotas de su propia unidad
DROP POLICY IF EXISTS "cuotas_residente_select" ON public.cuotas_administracion;
CREATE POLICY "cuotas_residente_select" ON public.cuotas_administracion
  FOR SELECT USING (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_rol() IN ('propietario', 'residente')
    AND unidad_id IN (
      SELECT id FROM public.unidades
      WHERE miembro_id = (SELECT id FROM public.miembros WHERE user_id = auth.uid() LIMIT 1)
    )
  );

-- Solo admin_ph puede generar/insertar cuotas
DROP POLICY IF EXISTS "cuotas_admin_insert" ON public.cuotas_administracion;
CREATE POLICY "cuotas_admin_insert" ON public.cuotas_administracion
  FOR INSERT WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_rol() = 'admin_ph'
  );

-- Solo admin_ph puede marcar cuotas como pagadas
DROP POLICY IF EXISTS "cuotas_admin_update" ON public.cuotas_administracion;
CREATE POLICY "cuotas_admin_update" ON public.cuotas_administracion
  FOR UPDATE USING (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_rol() = 'admin_ph'
  );

-- ─── 7. PAGOS PH ─────────────────────────────────────────────
-- La tabla 'pagos' del schema PH tiene campos distintos a la del fondo.
-- Si coexisten, el RLS filtra igual por tenant_id.
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pagos_ph_admin_select" ON public.pagos;
CREATE POLICY "pagos_ph_admin_select" ON public.pagos
  FOR SELECT USING (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_rol() = 'admin_ph'
  );

DROP POLICY IF EXISTS "pagos_ph_residente_select" ON public.pagos;
CREATE POLICY "pagos_ph_residente_select" ON public.pagos
  FOR SELECT USING (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_rol() IN ('propietario', 'residente')
    AND unidad_id IN (
      SELECT id FROM public.unidades
      WHERE miembro_id = (SELECT id FROM public.miembros WHERE user_id = auth.uid() LIMIT 1)
    )
  );

DROP POLICY IF EXISTS "pagos_ph_insert" ON public.pagos;
CREATE POLICY "pagos_ph_insert" ON public.pagos
  FOR INSERT WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_rol() = 'admin_ph'
  );

-- ─── 8. MOVIMIENTOS FONDO — agregar categoría PH ─────────────
-- La política de 001 cubre movimientos_fondo.
-- Solo agregamos la columna categoria si no existe.
ALTER TABLE public.movimientos_fondo
  ADD COLUMN IF NOT EXISTS fecha DATE,
  ADD COLUMN IF NOT EXISTS categoria TEXT
    CHECK (categoria IN (
      'administracion', 'mantenimiento', 'seguridad',
      'servicios_publicos', 'reserva'
    ));

-- ─── 9. STORAGE: bucket documentos-legales ───────────────────
-- IMPORTANTE: El bucket debe estar configurado como PRIVADO en el Dashboard.
-- Estas políticas controlan quién puede leer/escribir dentro del bucket.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'documentos_legales_insert'
  ) THEN
    CREATE POLICY "documentos_legales_insert" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'documentos-legales'
        AND (storage.foldername(name))[1] = public.get_user_tenant_id()::text
        AND public.get_user_rol() = 'admin_ph'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'documentos_legales_select'
  ) THEN
    CREATE POLICY "documentos_legales_select" ON storage.objects
      FOR SELECT TO authenticated
      USING (
        bucket_id = 'documentos-legales'
        AND (storage.foldername(name))[1] = public.get_user_tenant_id()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'documentos_legales_update'
  ) THEN
    CREATE POLICY "documentos_legales_update" ON storage.objects
      FOR UPDATE TO authenticated
      USING (
        bucket_id = 'documentos-legales'
        AND (storage.foldername(name))[1] = public.get_user_tenant_id()::text
        AND public.get_user_rol() = 'admin_ph'
      );
  END IF;
END $$;

-- ─── VERIFICACIÓN ─────────────────────────────────────────────
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'unidades', 'zonas_comunes', 'reservas',
    'pqr', 'presupuesto_ph', 'cuotas_administracion', 'pagos'
  )
ORDER BY tablename;

-- ============================================================
-- 015 — Cerrar fuga intra-tenant en `pagos` (auditoría seguridad)
-- ============================================================
-- Hallazgo (Vector 2/3): la política `pagos_select` creada en 001
-- filtra SOLO por tenant_id (sin rol):
--
--   CREATE POLICY "pagos_select" ON pagos
--     FOR SELECT USING (tenant_id = public.get_user_tenant_id());
--
-- En 008 se agregaron políticas SELECT por rol para PH
-- (`pagos_ph_admin_select`, `pagos_ph_residente_select`), pero NUNCA
-- se eliminó la de 001. Las políticas SELECT son PERMISIVAS: se
-- combinan con OR, así que la vieja política amplia gana y un
-- `residente` puede leer TODOS los pagos de su conjunto — anulando el
-- acote a su propia unidad y violando el Principio #4 ("el residente ve
-- solo lo suyo"). No cruza tenants (tenant_id sigue), pero expone datos
-- financieros de otras unidades del mismo conjunto.
--
-- Fix: eliminar la política heredada. Quedan solo las de 008:
--   - pagos_ph_admin_select     → admin_ph ve todos los pagos del tenant
--   - pagos_ph_residente_select → propietario/residente ve solo su unidad
-- (Los roles 'admin'/'tesorero' de la era fondos ya no existen en PH.)
-- ============================================================

DROP POLICY IF EXISTS "pagos_select" ON public.pagos;

-- ─── VERIFICACIÓN ─────────────────────────────────────────────
-- Deben quedar exactamente las políticas SELECT por rol de 008.
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'pagos'
ORDER BY policyname;

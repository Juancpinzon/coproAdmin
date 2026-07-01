-- ============================================================
-- 013 — Fix recursión RLS en miembros + bootstrap de onboarding
-- ============================================================
-- La policy miembros_select en la BD viva quedó (por edición manual) con
-- una SUBCONSULTA INLINE sobre miembros:
--   tenant_id = (SELECT m2.tenant_id FROM miembros m2 WHERE m2.user_id = auth.uid() LIMIT 1)
-- Eso provoca "infinite recursion detected in policy for relation miembros":
-- evaluar la policy de miembros obliga a re-evaluar la policy de miembros.
--
-- La solución (la que 002 ya usaba antes de la edición manual) es la helper
-- SECURITY DEFINER get_user_tenant_id(): su cuerpo NO se expande en el plan
-- de la policy y corre con bypass de RLS → corta el ciclo. Que tenants_select
-- funcione con la misma helper confirma que el bypass está operando.
--
-- Además miembros_insert real era solo (user_id = auth.uid()), así que el
-- admin no podía crear los PROPIETARIOS del conjunto (user_id NULL) durante
-- el onboarding. Se agrega una rama admin_ph acotada a SU tenant.
--
-- ⚠️ DEUDA DE SEGURIDAD (no cerrada aquí): la rama (user_id = auth.uid())
-- permite que un usuario se inserte a sí mismo en CUALQUIER tenant con
-- cualquier rol. El cierre correcto es mover la creación de tenant+admin del
-- onboarding a un RPC SECURITY DEFINER y eliminar el auto-insert. Ver nota.
-- ============================================================

-- 1. Recursión: usar la helper SECURITY DEFINER, no una subconsulta inline.
DROP POLICY IF EXISTS "miembros_select" ON public.miembros;
CREATE POLICY "miembros_select" ON public.miembros
  FOR SELECT USING (
    user_id = auth.uid()                        -- siempre se ve a sí mismo (onboarding)
    OR tenant_id = public.get_user_tenant_id()  -- y a los demás de su tenant
  );

-- 2. Bootstrap + gestión: el usuario crea su propia fila (admin en onboarding)
--    o un admin_ph agrega miembros (propietarios/residentes) de SU tenant.
DROP POLICY IF EXISTS "miembros_insert" ON public.miembros;
CREATE POLICY "miembros_insert" ON public.miembros
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    OR (
      tenant_id = public.get_user_tenant_id()
      AND public.get_user_rol() = 'admin_ph'
    )
  );

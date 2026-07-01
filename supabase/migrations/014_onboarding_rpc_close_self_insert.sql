-- ============================================================
-- 014 — Onboarding vía RPC SECURITY DEFINER + cerrar hueco self-insert
-- ============================================================
-- Cierra la deuda de 013: la rama (user_id = auth.uid()) en miembros_insert
-- permitía que CUALQUIER usuario autenticado se insertara en CUALQUIER tenant
-- con CUALQUIER rol (escalada de privilegios / ruptura de aislamiento —
-- Principio #1). Tanto RegistroPage como OnboardingPHPage creaban tenant+admin
-- con inserts directos del cliente, apoyados en esa rama.
--
-- La creación de tenant + admin pasa a este RPC SECURITY DEFINER, que fija
-- rol='admin_ph' y user_id=auth.uid() del lado del servidor. Es IDEMPOTENTE:
-- si el usuario ya tiene tenant (creado al registrarse), lo ACTUALIZA en vez
-- de duplicarlo (elimina el doble-tenant registro→onboarding).
-- ============================================================

CREATE OR REPLACE FUNCTION public.configurar_conjunto_ph(
  p_nombre        TEXT,
  p_nit           TEXT    DEFAULT NULL,
  p_direccion     TEXT    DEFAULT NULL,
  p_num_unidades  INTEGER DEFAULT 0,
  p_cuota_mensual BIGINT  DEFAULT 0
)
RETURNS UUID  -- tenant_id (creado o existente)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp AS $$
DECLARE
  v_uid    UUID := auth.uid();
  v_tenant UUID;
  v_email  TEXT;
  v_nombre TEXT;
  v_slug   TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  IF length(trim(coalesce(p_nombre, ''))) < 3 THEN
    RAISE EXCEPTION 'El nombre del conjunto debe tener al menos 3 caracteres';
  END IF;

  -- ¿El usuario ya tiene un miembro (y por ende un tenant)?
  SELECT tenant_id INTO v_tenant
  FROM public.miembros
  WHERE user_id = v_uid
  LIMIT 1;

  IF v_tenant IS NULL THEN
    -- No existe: crear tenant + admin_ph.
    v_slug := lower(regexp_replace(p_nombre, '[^a-zA-Z0-9\s]', '', 'g'));
    v_slug := regexp_replace(trim(v_slug), '\s+', '-', 'g')
              || '-' || substr(gen_random_uuid()::text, 1, 6);

    INSERT INTO public.tenants (
      nombre, slug, tenant_type, nit, direccion, num_unidades, cuota_mensual,
      plan, suscripcion_activa, trial_ends_at
    ) VALUES (
      p_nombre, v_slug, 'propiedad_horizontal', p_nit, p_direccion,
      coalesce(p_num_unidades, 0), coalesce(p_cuota_mensual, 0),
      'trial', true, now() + interval '30 days'
    )
    RETURNING id INTO v_tenant;

    SELECT u.email,
           coalesce(u.raw_user_meta_data->>'nombre_completo',
                    u.raw_user_meta_data->>'full_name',
                    split_part(u.email, '@', 1), 'Admin')
      INTO v_email, v_nombre
    FROM auth.users u
    WHERE u.id = v_uid;

    INSERT INTO public.miembros (
      tenant_id, user_id, nombre_completo, email, rol, estado
    ) VALUES (
      v_tenant, v_uid, v_nombre, v_email, 'admin_ph', 'activo'
    );
  ELSE
    -- Ya existe (p.ej. creado al registrarse): actualizar datos del conjunto.
    -- coalesce conserva el valor previo si el parámetro llega NULL.
    UPDATE public.tenants
       SET nombre        = p_nombre,
           nit           = coalesce(p_nit, nit),
           direccion     = coalesce(p_direccion, direccion),
           num_unidades  = coalesce(p_num_unidades, num_unidades),
           cuota_mensual = coalesce(p_cuota_mensual, cuota_mensual)
     WHERE id = v_tenant;
  END IF;

  RETURN v_tenant;
END;
$$;

ALTER FUNCTION public.configurar_conjunto_ph(TEXT, TEXT, TEXT, INTEGER, BIGINT) OWNER TO postgres;
REVOKE ALL  ON FUNCTION public.configurar_conjunto_ph(TEXT, TEXT, TEXT, INTEGER, BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.configurar_conjunto_ph(TEXT, TEXT, TEXT, INTEGER, BIGINT) TO authenticated;

-- ─── Cerrar el hueco: quitar la rama de auto-inserción ───────
-- La creación del admin ahora ocurre SOLO dentro del RPC (bypass RLS).
-- El cliente ya no se auto-inserta; un admin_ph solo puede agregar miembros
-- (propietarios/residentes) de SU propio tenant.
DROP POLICY IF EXISTS "miembros_insert" ON public.miembros;
CREATE POLICY "miembros_insert" ON public.miembros
  FOR INSERT WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_rol() = 'admin_ph'
  );

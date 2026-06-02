-- ============================================================
-- FondoApp — Fix trigger + flujo de onboarding
-- Ejecutar en Supabase SQL Editor (requiere rol postgres)
-- ============================================================

-- ─── 1. CORREGIR TRIGGER vincular_usuario_a_miembro ──────────
-- Problemas del trigger original:
--   a) Sin SET search_path → la tabla miembros no se resuelve
--      cuando el trigger corre desde el contexto del schema auth
--   b) Sin EXCEPTION → cualquier error aborta el INSERT en auth.users
--      causando "Database error saving new user"
--   c) La política miembros_update requiere get_user_rol() IN ('admin','tesorero')
--      pero al momento del trigger auth.uid() aún no tiene miembro → NULL → bloqueado
--   Solución: SECURITY DEFINER + SET search_path + EXCEPTION + OWNER TO postgres

CREATE OR REPLACE FUNCTION public.vincular_usuario_a_miembro()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  -- Vincula el user_id de auth al miembro pre-cargado con ese email.
  -- Si no existe ningún miembro con ese email, no hace nada (0 filas actualizadas).
  -- LOWER para comparación case-insensitive.
  UPDATE public.miembros
  SET user_id = NEW.id
  WHERE LOWER(email) = LOWER(NEW.email)
    AND user_id IS NULL;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- No bloquear la creación del usuario en auth.users si el vínculo falla.
  RAISE WARNING 'vincular_usuario_a_miembro: % - %', SQLERRM, NEW.email;
  RETURN NEW;
END;
$$;

-- postgres tiene BYPASSRLS en Supabase → el UPDATE en miembros
-- pasa sin importar las políticas RLS activas.
ALTER FUNCTION public.vincular_usuario_a_miembro() OWNER TO postgres;

-- Recrear el trigger limpiamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.vincular_usuario_a_miembro();

-- ─── 2. CORREGIR POLÍTICA miembros_select ────────────────────
-- Problema: un usuario recién autenticado sin miembro tiene
-- get_user_tenant_id() = NULL → la política nunca le devuelve su propia fila.
-- Necesitamos que pueda ver SU propia fila para detectar que no tiene tenant.

DROP POLICY IF EXISTS "miembros_select" ON public.miembros;
CREATE POLICY "miembros_select" ON public.miembros
  FOR SELECT USING (
    tenant_id = public.get_user_tenant_id()   -- miembros del mismo fondo
    OR user_id = auth.uid()                    -- siempre puede verse a sí mismo
  );

-- ─── 3. FUNCIÓN: get_my_miembro ──────────────────────────────
-- Retorna la fila del miembro del usuario autenticado.
-- SECURITY DEFINER para garantizar que bypassa RLS incluso si
-- el usuario aún no tiene tenant asignado.
-- Retorna 0 filas si el usuario no tiene miembro → señal de onboarding.

CREATE OR REPLACE FUNCTION public.get_my_miembro()
RETURNS TABLE (
  id              UUID,
  tenant_id       UUID,
  nombre_completo TEXT,
  rol             TEXT,
  estado          TEXT,
  email           TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT id, tenant_id, nombre_completo, rol, estado, email
  FROM public.miembros
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

ALTER FUNCTION public.get_my_miembro() OWNER TO postgres;

-- ─── 4. FUNCIÓN: crear_fondo_inicial ─────────────────────────
-- Crea un tenant nuevo + el admin (miembro) en una sola transacción.
-- SECURITY DEFINER permite insertar en tenants y miembros sin
-- necesitar políticas RLS especiales para onboarding.

CREATE OR REPLACE FUNCTION public.crear_fondo_inicial(
  p_nombre_fondo   TEXT,
  p_nombre_admin   TEXT,
  p_tasa_mensual   NUMERIC,   -- ej: 0.02 = 2%
  p_cuota_mensual  BIGINT,    -- COP, cuota de aporte periódico
  p_capital_inicial BIGINT DEFAULT 0
)
RETURNS UUID   -- retorna el tenant_id creado
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth AS $$
DECLARE
  v_tenant_id UUID;
  v_slug      TEXT;
  v_email     TEXT;
BEGIN
  -- Validaciones básicas
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;
  IF LENGTH(TRIM(p_nombre_fondo)) < 3 THEN
    RAISE EXCEPTION 'El nombre del fondo debe tener al menos 3 caracteres';
  END IF;
  IF p_tasa_mensual <= 0 OR p_tasa_mensual > 0.20 THEN
    RAISE EXCEPTION 'La tasa mensual debe estar entre 0%% y 20%%';
  END IF;
  IF p_cuota_mensual <= 0 THEN
    RAISE EXCEPTION 'La cuota mensual debe ser mayor a cero';
  END IF;

  -- Verificar que el usuario no tenga ya un fondo
  IF EXISTS (SELECT 1 FROM public.miembros WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'El usuario ya pertenece a un fondo';
  END IF;

  -- Generar slug único a partir del nombre
  v_slug := lower(regexp_replace(p_nombre_fondo, '[^a-zA-Z0-9\s]', '', 'g'));
  v_slug := regexp_replace(trim(v_slug), '\s+', '-', 'g');
  v_slug := v_slug || '-' || substr(gen_random_uuid()::text, 1, 6);

  -- Obtener email del usuario autenticado
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();

  -- Crear el tenant
  INSERT INTO public.tenants (
    nombre, slug, capital_inicial,
    tasa_interes_mensual, cuota_mensual,
    max_prestamo_por_miembro, dia_corte, multa_mora
  ) VALUES (
    TRIM(p_nombre_fondo), v_slug, p_capital_inicial,
    p_tasa_mensual, p_cuota_mensual,
    10000000, 15, 50000
  )
  RETURNING id INTO v_tenant_id;

  -- Crear el miembro admin
  INSERT INTO public.miembros (
    tenant_id, user_id, nombre_completo, email,
    rol, estado, aporte_inicial
  ) VALUES (
    v_tenant_id, auth.uid(), TRIM(p_nombre_admin), v_email,
    'admin', 'activo', 0
  );

  RETURN v_tenant_id;
END;
$$;

ALTER FUNCTION public.crear_fondo_inicial(TEXT, TEXT, NUMERIC, BIGINT, BIGINT) OWNER TO postgres;

-- ─── VERIFICACIÓN ─────────────────────────────────────────────
-- Después de ejecutar, verifica que:
-- 1. El trigger existe en auth.users
SELECT trigger_name, event_object_schema, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 2. Las funciones existen
SELECT routine_name, security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'vincular_usuario_a_miembro',
    'get_my_miembro',
    'crear_fondo_inicial'
  );

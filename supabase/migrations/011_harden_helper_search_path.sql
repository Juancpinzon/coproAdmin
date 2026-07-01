-- ============================================================
-- 011 — Endurecer search_path de las helpers de RLS
-- ============================================================
-- get_user_tenant_id() y get_user_rol() (definidas en 001) son
-- SECURITY DEFINER pero NO fijaban search_path. Una función
-- SECURITY DEFINER sin search_path fijo es vulnerable a
-- "search_path hijacking": un esquema en el path del llamante
-- puede hacer sombra a 'miembros'/'auth' y ejecutarse con los
-- privilegios del owner (postgres).
--
-- Fijar search_path = public, pg_temp es la mitigación estándar
-- recomendada por el linter de Supabase. No cambia el cuerpo ni
-- la firma de las funciones; solo añade el guardarraíl.
--
-- Firmas verificadas en 001_initial_schema.sql:150-160
-- (ambas sin argumentos, LANGUAGE sql STABLE SECURITY DEFINER).
-- ============================================================

ALTER FUNCTION public.get_user_tenant_id() SET search_path = public, pg_temp;
ALTER FUNCTION public.get_user_rol()       SET search_path = public, pg_temp;

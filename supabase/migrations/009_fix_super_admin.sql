-- ============================================================
-- CoproAdmin — Robustecer is_super_admin()
-- Auditoría de seguridad pre-lanzamiento
--
-- Problema: is_super_admin() verificaba por email (auth.jwt()->>'email').
-- Si el owner cambia su email, pierde acceso sin actualizar la tabla.
-- Solución: agregar user_id a super_admins y verificar por auth.uid().
-- ============================================================

-- Agregar columna user_id (nullable para no romper filas existentes)
ALTER TABLE public.super_admins
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Crear índice único para búsquedas por user_id
CREATE UNIQUE INDEX IF NOT EXISTS super_admins_user_id_idx
  ON public.super_admins (user_id)
  WHERE user_id IS NOT NULL;

-- Vincular fila existente al user_id del owner por email
-- (se ejecuta una sola vez; si ya está vinculado, no hace nada)
UPDATE public.super_admins sa
SET user_id = u.id
FROM auth.users u
WHERE sa.email = u.email
  AND sa.user_id IS NULL;

-- Reemplazar la función para verificar por auth.uid() (primary)
-- con fallback a email para compatibilidad durante la transición.
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.super_admins
    WHERE user_id = auth.uid()
       OR email = auth.jwt()->>'email'  -- fallback hasta que todas las filas tengan user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Actualizar política de super_admins para usar user_id también
DROP POLICY IF EXISTS "super_admins_select" ON public.super_admins;
CREATE POLICY "super_admins_select" ON public.super_admins
  FOR SELECT USING (
    user_id = auth.uid()
    OR auth.jwt()->>'email' = email
  );

-- ─── VERIFICACIÓN ─────────────────────────────────────────────
SELECT id, email, user_id IS NOT NULL AS vinculado
FROM public.super_admins;

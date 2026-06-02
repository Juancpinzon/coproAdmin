-- Crear tabla de super administradores
CREATE TABLE IF NOT EXISTS public.super_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

-- Política para que el super admin pueda ver su propio registro
CREATE POLICY "super_admins_select" ON public.super_admins
    FOR SELECT USING (auth.jwt()->>'email' = email);

-- Insertar el correo del dueño
INSERT INTO public.super_admins (email) 
VALUES ('juancpinzonz@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- Función de conveniencia para verificar si es super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.super_admins 
    WHERE email = auth.jwt()->>'email'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dar permisos al super admin para leer y actualizar TODOS los tenants (conjuntos)
CREATE POLICY "tenants_superadmin_select" ON public.tenants
    FOR SELECT USING (public.is_super_admin());

CREATE POLICY "tenants_superadmin_update" ON public.tenants
    FOR UPDATE USING (public.is_super_admin());

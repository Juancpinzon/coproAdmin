-- Add PH roles to miembros table constraint

ALTER TABLE miembros 
DROP CONSTRAINT IF EXISTS miembros_rol_check;

ALTER TABLE miembros
ADD COLUMN IF NOT EXISTS rol text NOT NULL DEFAULT 'miembro';

ALTER TABLE miembros
ADD CONSTRAINT miembros_rol_check CHECK (rol IN (
  'admin_fondo', 'miembro',
  'admin_ph', 'propietario', 'residente'
));

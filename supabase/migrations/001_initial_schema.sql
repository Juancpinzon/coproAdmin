-- ============================================================
-- FondoApp — Schema inicial
-- Aplicar en Supabase SQL Editor
-- ============================================================

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── TENANTS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenants (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre                   TEXT NOT NULL,
  slug                     TEXT UNIQUE NOT NULL,
  capital_inicial          BIGINT NOT NULL DEFAULT 0,
  tasa_interes_mensual     NUMERIC(6,4) NOT NULL DEFAULT 0.0200, -- ej: 0.0150 = 1.5%
  max_prestamo_por_miembro BIGINT NOT NULL DEFAULT 10000000,
  cuota_mensual            BIGINT NOT NULL DEFAULT 200000,
  dia_corte                INTEGER NOT NULL DEFAULT 15 CHECK (dia_corte BETWEEN 1 AND 28),
  multa_mora               BIGINT NOT NULL DEFAULT 50000,
  activo                   BOOLEAN NOT NULL DEFAULT true,
  created_at               TIMESTAMPTZ DEFAULT NOW()
);

-- ─── MIEMBROS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS miembros (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nombre_completo TEXT NOT NULL,
  cedula          TEXT,
  email           TEXT,
  telefono        TEXT,
  rol             TEXT NOT NULL DEFAULT 'miembro'
                    CHECK (rol IN ('admin', 'tesorero', 'miembro')),
  estado          TEXT NOT NULL DEFAULT 'activo'
                    CHECK (estado IN ('activo', 'inactivo', 'suspendido')),
  aporte_inicial  BIGINT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PRÉSTAMOS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prestamos (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id                UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  solicitante_id           UUID NOT NULL REFERENCES miembros(id),
  fiador_id                UUID REFERENCES miembros(id),
  monto                    BIGINT NOT NULL,
  plazo_meses              INTEGER NOT NULL,
  tasa_mensual             NUMERIC(6,4) NOT NULL,
  cuota_mensual            BIGINT NOT NULL,
  cuotas_pagadas           INTEGER NOT NULL DEFAULT 0,
  estado                   TEXT NOT NULL DEFAULT 'solicitado'
                             CHECK (estado IN ('solicitado','aprobado','activo','pagado','cancelado','vencido')),
  fecha_solicitud          TIMESTAMPTZ DEFAULT NOW(),
  fecha_aprobacion         TIMESTAMPTZ,
  aprobado_por             UUID REFERENCES miembros(id),
  fecha_primer_vencimiento DATE,
  saldo_pendiente          BIGINT NOT NULL DEFAULT 0,
  motivo_cancelacion       TEXT,
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CUOTAS DE AMORTIZACIÓN ───────────────────────────────────
CREATE TABLE IF NOT EXISTS cuotas_amortizacion (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prestamo_id      UUID NOT NULL REFERENCES prestamos(id) ON DELETE CASCADE,
  tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  numero_cuota     INTEGER NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  capital          BIGINT NOT NULL,
  interes          BIGINT NOT NULL,
  cuota_total      BIGINT NOT NULL,
  estado           TEXT NOT NULL DEFAULT 'pendiente'
                     CHECK (estado IN ('pendiente','pagado','vencido')),
  fecha_pago       TIMESTAMPTZ,
  pago_id          UUID,
  UNIQUE (prestamo_id, numero_cuota)
);

-- ─── PAGOS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pagos (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  prestamo_id      UUID NOT NULL REFERENCES prestamos(id),
  miembro_id       UUID NOT NULL REFERENCES miembros(id),
  registrado_por   UUID NOT NULL REFERENCES miembros(id),
  monto            BIGINT NOT NULL,
  fecha_pago       DATE NOT NULL,
  cuotas_cubiertas INTEGER[] DEFAULT '{}',
  notas            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── MOVIMIENTOS DEL FONDO ────────────────────────────────────
-- tipo: usa los valores del UI original + variantes del CLAUDE.md
CREATE TABLE IF NOT EXISTS movimientos_fondo (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tipo            TEXT NOT NULL
                    CHECK (tipo IN (
                      'aporte',
                      'prestamo_desembolso',   -- préstamo entregado al miembro
                      'prestamo_pago',          -- pago de cuota recibido
                      'multa',
                      'rendimiento',
                      'retiro'
                    )),
  monto           BIGINT NOT NULL, -- positivo = entra, negativo = sale
  referencia_id   UUID,            -- FK opcional a prestamo o pago
  descripcion     TEXT NOT NULL,
  registrado_por  UUID REFERENCES miembros(id),
  miembro_id      UUID REFERENCES miembros(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TRIGGER: updated_at en prestamos ────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER prestamos_updated_at
  BEFORE UPDATE ON prestamos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── TRIGGER: vincular auth.users con miembro por email ───────
-- Cuando alguien hace login por primera vez (magic link),
-- este trigger enlaza su auth.users.id con el miembro que tenga
-- el mismo email, permitiendo que RLS funcione automáticamente.
CREATE OR REPLACE FUNCTION public.vincular_usuario_a_miembro()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE miembros
  SET user_id = NEW.id
  WHERE email = NEW.email
    AND user_id IS NULL;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.vincular_usuario_a_miembro();

-- ─── FUNCIONES HELPER para RLS ────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT tenant_id FROM miembros WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_rol()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT rol FROM miembros WHERE user_id = auth.uid() LIMIT 1;
$$;

-- ─── HABILITAR RLS ────────────────────────────────────────────
ALTER TABLE tenants             ENABLE ROW LEVEL SECURITY;
ALTER TABLE miembros            ENABLE ROW LEVEL SECURITY;
ALTER TABLE prestamos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuotas_amortizacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos               ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_fondo   ENABLE ROW LEVEL SECURITY;

-- ─── POLÍTICAS RLS: TENANTS ───────────────────────────────────
CREATE POLICY "tenants_select" ON tenants
  FOR SELECT USING (id = public.get_user_tenant_id());

CREATE POLICY "tenants_update" ON tenants
  FOR UPDATE USING (
    id = public.get_user_tenant_id()
    AND public.get_user_rol() IN ('admin', 'tesorero')
  );

-- ─── POLÍTICAS RLS: MIEMBROS ──────────────────────────────────
-- Cualquier miembro ve a los demás de su tenant
CREATE POLICY "miembros_select" ON miembros
  FOR SELECT USING (tenant_id = public.get_user_tenant_id());

-- Solo admin/tesorero puede crear miembros
CREATE POLICY "miembros_insert" ON miembros
  FOR INSERT WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_rol() IN ('admin', 'tesorero')
  );

-- Solo admin/tesorero puede modificar miembros
CREATE POLICY "miembros_update" ON miembros
  FOR UPDATE USING (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_rol() IN ('admin', 'tesorero')
  );

-- ─── POLÍTICAS RLS: PRÉSTAMOS ─────────────────────────────────
-- Todos los miembros pueden VER préstamos de su tenant (transparencia)
CREATE POLICY "prestamos_select" ON prestamos
  FOR SELECT USING (tenant_id = public.get_user_tenant_id());

-- Cualquier miembro puede solicitar
CREATE POLICY "prestamos_insert" ON prestamos
  FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant_id());

-- Solo admin/tesorero puede aprobar/actualizar
CREATE POLICY "prestamos_update" ON prestamos
  FOR UPDATE USING (
    public.get_user_rol() IN ('admin', 'tesorero')
    AND tenant_id = public.get_user_tenant_id()
  );

-- ─── POLÍTICAS RLS: CUOTAS ────────────────────────────────────
CREATE POLICY "cuotas_select" ON cuotas_amortizacion
  FOR SELECT USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "cuotas_insert" ON cuotas_amortizacion
  FOR INSERT WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_rol() IN ('admin', 'tesorero')
  );

CREATE POLICY "cuotas_update" ON cuotas_amortizacion
  FOR UPDATE USING (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_rol() IN ('admin', 'tesorero')
  );

-- ─── POLÍTICAS RLS: PAGOS ─────────────────────────────────────
CREATE POLICY "pagos_select" ON pagos
  FOR SELECT USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "pagos_insert" ON pagos
  FOR INSERT WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_rol() IN ('admin', 'tesorero')
  );

-- ─── POLÍTICAS RLS: MOVIMIENTOS ───────────────────────────────
CREATE POLICY "movimientos_select" ON movimientos_fondo
  FOR SELECT USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "movimientos_insert" ON movimientos_fondo
  FOR INSERT WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_rol() IN ('admin', 'tesorero')
  );

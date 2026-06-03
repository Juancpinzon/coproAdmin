-- ============================================================
-- CoproAdmin — Módulo de Cumplimiento Legal (Fase 6)
-- Capítulo 1: Protección de Datos (Ley 1581/2012 + Decreto 1377/2013)
-- Capítulo 2: Obligaciones Ley 675 de 2001
--
-- Patrón RLS: usa get_user_tenant_id() y get_user_rol()
-- definidos en 001_initial_schema.sql.
-- El "estado" de las obligaciones NO se guarda en BD —
-- se calcula en runtime en el hook useObligaciones.ts.
-- ============================================================

-- ─── TABLA 1: consentimientos_tratamiento ────────────────────
-- Registro inmutable del consentimiento de cada miembro para el
-- tratamiento de sus datos personales (Ley 1581/2012).
-- Una vez insertado, NO se actualiza — si el usuario renueva su
-- consentimiento se inserta una nueva fila con la nueva versión.

CREATE TABLE IF NOT EXISTS public.consentimientos_tratamiento (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id        UUID        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  miembro_id       UUID        NOT NULL REFERENCES public.miembros(id) ON DELETE CASCADE,
  version_politica TEXT        NOT NULL,               -- ej: "v1.0", "v1.1"
  acepto           BOOLEAN     NOT NULL,
  fecha            TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- inmutable: fecha real del consentimiento
  ip_registro      TEXT        NULL,                   -- IP del request (opcional)
  canal            TEXT        NOT NULL DEFAULT 'web'
                     CHECK (canal IN ('web', 'portal', 'presencial')),
  -- Unicidad por miembro + versión: no permitir duplicar el mismo consentimiento
  CONSTRAINT consentimientos_unico UNIQUE (miembro_id, version_politica, acepto)
);

-- ─── TABLA 2: solicitudes_arco ───────────────────────────────
-- Gestión de derechos ARCO: Acceso, Rectificación, Cancelación, Oposición.
-- Plazo legal de respuesta: 10 días hábiles desde recibida (Ley 1581/2012, Art. 22).
-- fecha_limite se calcula con ~14 días calendario (~10 hábiles) al insertar.

CREATE TABLE IF NOT EXISTS public.solicitudes_arco (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id        UUID        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  miembro_id       UUID        NOT NULL REFERENCES public.miembros(id) ON DELETE CASCADE,
  tipo             TEXT        NOT NULL
                     CHECK (tipo IN ('acceso', 'rectificacion', 'cancelacion', 'oposicion')),
  descripcion      TEXT        NOT NULL,
  estado           TEXT        NOT NULL DEFAULT 'recibida'
                     CHECK (estado IN ('recibida', 'en_tramite', 'resuelta')),
  respuesta        TEXT        NULL,
  -- fecha_limite: 14 días calendario ≈ 10 hábiles (Ley 1581, Art. 22)
  -- Calculado al insertar; el hook alerta si quedan ≤ 2 días hábiles
  fecha_limite     TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
  fecha_resolucion TIMESTAMPTZ NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── TABLA 3: obligaciones_legales ───────────────────────────
-- Rastreo de las obligaciones periódicas del administrador bajo
-- la Ley 675 de 2001. El campo "estado" NO se guarda aquí —
-- se calcula en runtime en useObligaciones.ts comparando
-- fecha_vencimiento con la fecha actual.

CREATE TABLE IF NOT EXISTS public.obligaciones_legales (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         UUID        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  tipo              TEXT        NOT NULL
                      CHECK (tipo IN (
                        'asamblea_ordinaria',
                        'rendicion_cuentas',
                        'presupuesto',
                        'seguros',
                        'estados_financieros',
                        'reglamento'
                      )),
  fecha_vencimiento TIMESTAMPTZ NULL,      -- NULL = sin vencimiento fijo (ej: reglamento permanente)
  documento_url     TEXT        NULL,      -- URL del acta, póliza, presupuesto aprobado, etc.
  notas             TEXT        NULL,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Un tenant tiene máximo una fila por tipo de obligación
  CONSTRAINT obligaciones_unico_tipo UNIQUE (tenant_id, tipo)
);

-- ─── TRIGGER: updated_at en obligaciones_legales ─────────────
-- Reutiliza la función set_updated_at() creada en 001.
CREATE TRIGGER obligaciones_legales_updated_at
  BEFORE UPDATE ON public.obligaciones_legales
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── HABILITAR RLS ────────────────────────────────────────────
ALTER TABLE public.consentimientos_tratamiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitudes_arco            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obligaciones_legales        ENABLE ROW LEVEL SECURITY;

-- ─── RLS: consentimientos_tratamiento ────────────────────────

-- admin_ph ve todos los consentimientos de su tenant (panel de estado)
-- residente/propietario ve solo sus propios consentimientos
CREATE POLICY "consentimientos_select" ON public.consentimientos_tratamiento
  FOR SELECT USING (
    tenant_id = public.get_user_tenant_id()
    AND (
      public.get_user_rol() = 'admin_ph'
      OR miembro_id = (
        SELECT id FROM public.miembros
        WHERE user_id = auth.uid()
        LIMIT 1
      )
    )
  );

-- Cualquier miembro autenticado del tenant puede registrar su propio consentimiento
CREATE POLICY "consentimientos_insert" ON public.consentimientos_tratamiento
  FOR INSERT WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND miembro_id = (
      SELECT id FROM public.miembros
      WHERE user_id = auth.uid()
      LIMIT 1
    )
  );

-- Los consentimientos son inmutables: NO se permiten UPDATE ni DELETE
-- (La Ley 1581 exige conservar el registro del consentimiento original)

-- ─── RLS: solicitudes_arco ───────────────────────────────────

-- admin_ph ve todas las solicitudes ARCO del tenant para gestionarlas
-- residente/propietario ve solo las suyas
CREATE POLICY "arco_select" ON public.solicitudes_arco
  FOR SELECT USING (
    tenant_id = public.get_user_tenant_id()
    AND (
      public.get_user_rol() = 'admin_ph'
      OR miembro_id = (
        SELECT id FROM public.miembros
        WHERE user_id = auth.uid()
        LIMIT 1
      )
    )
  );

-- Cualquier miembro puede crear su propia solicitud ARCO
CREATE POLICY "arco_insert" ON public.solicitudes_arco
  FOR INSERT WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND miembro_id = (
      SELECT id FROM public.miembros
      WHERE user_id = auth.uid()
      LIMIT 1
    )
  );

-- Solo admin_ph puede actualizar el estado y añadir respuesta
CREATE POLICY "arco_update" ON public.solicitudes_arco
  FOR UPDATE USING (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_rol() = 'admin_ph'
  );

-- ─── RLS: obligaciones_legales ───────────────────────────────

-- Todos los miembros del tenant pueden ver las obligaciones
-- (transparencia: el residente puede ver si el admin cumple)
CREATE POLICY "obligaciones_select" ON public.obligaciones_legales
  FOR SELECT USING (tenant_id = public.get_user_tenant_id());

-- Solo admin_ph puede insertar y actualizar obligaciones
CREATE POLICY "obligaciones_insert" ON public.obligaciones_legales
  FOR INSERT WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_rol() = 'admin_ph'
  );

CREATE POLICY "obligaciones_update" ON public.obligaciones_legales
  FOR UPDATE USING (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_rol() = 'admin_ph'
  );

-- ─── FUNCIÓN: seed_obligaciones_iniciales ────────────────────
-- Inserta las 4 obligaciones base al completar el onboarding.
-- Se llama desde el frontend tras crear el tenant.
-- SECURITY DEFINER: el usuario recién creado aún puede no tener
-- la política admin_ph activa en ese instante.
-- ON CONFLICT DO NOTHING: idempotente (seguro llamar más de una vez).

CREATE OR REPLACE FUNCTION public.seed_obligaciones_iniciales(
  p_tenant_id UUID
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  -- Verificar que el tenant exista y que el caller sea su admin_ph
  IF NOT EXISTS (
    SELECT 1 FROM public.miembros
    WHERE user_id = auth.uid()
      AND tenant_id = p_tenant_id
      AND rol = 'admin_ph'
  ) THEN
    RAISE EXCEPTION 'Solo el admin_ph del tenant puede inicializar las obligaciones';
  END IF;

  INSERT INTO public.obligaciones_legales (tenant_id, tipo, fecha_vencimiento, notas)
  VALUES
    -- Asamblea ordinaria: máximo 3 meses después del cierre del ejercicio (31 marzo del año siguiente)
    (p_tenant_id, 'asamblea_ordinaria',
     date_trunc('year', NOW()) + INTERVAL '1 year' + INTERVAL '3 months' - INTERVAL '1 day',
     'Ley 675 Art. 38 — máximo 3 meses tras cierre del ejercicio contable'),

    -- Presupuesto: debe aprobarse antes del inicio del ejercicio
    (p_tenant_id, 'presupuesto',
     date_trunc('year', NOW() + INTERVAL '1 year') - INTERVAL '1 day',
     'Ley 675 Art. 51 — aprobado en asamblea antes de ejecutar'),

    -- Seguros obligatorios: anualmente (referencia 31 dic del año en curso)
    (p_tenant_id, 'seguros',
     date_trunc('year', NOW()) + INTERVAL '1 year' - INTERVAL '1 day',
     'Ley 675 Art. 15 — seguro de daños para bienes comunes'),

    -- Reglamento: permanente — sin fecha de vencimiento fija
    (p_tenant_id, 'reglamento',
     NULL,
     'Ley 675 Art. 5 — reglamento de propiedad horizontal vigente')

  ON CONFLICT (tenant_id, tipo) DO NOTHING;
END;
$$;

ALTER FUNCTION public.seed_obligaciones_iniciales(UUID) OWNER TO postgres;

-- ─── VERIFICACIÓN ─────────────────────────────────────────────
-- Confirmar que las tablas y función fueron creadas:
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'consentimientos_tratamiento',
    'solicitudes_arco',
    'obligaciones_legales'
  );

SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'seed_obligaciones_iniciales';

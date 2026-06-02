-- ============================================================
-- FondoApp — Seed de desarrollo
-- Ejecutar DESPUÉS de 001_initial_schema.sql
-- Requiere permisos de service_role (ejecutar en SQL Editor de Supabase)
-- ============================================================

-- IDs fijos para referencias cruzadas
-- TENANT
-- 00000000-0000-0000-0000-000000000001

-- MIEMBROS (por orden del mock original)
-- Carlos García  (admin)     → 11111111-1111-1111-1111-111111111101
-- María López    (tesorero)  → 11111111-1111-1111-1111-111111111102
-- Pedro Martínez (miembro)   → 11111111-1111-1111-1111-111111111103
-- Ana Rodríguez  (miembro)   → 11111111-1111-1111-1111-111111111104
-- Luis Hernández (miembro)   → 11111111-1111-1111-1111-111111111105
-- Sandra Gómez   (miembro)   → 11111111-1111-1111-1111-111111111106
-- Jorge Díaz     (miembro)   → 11111111-1111-1111-1111-111111111107
-- Patricia Castro(miembro)   → 11111111-1111-1111-1111-111111111108

-- PRÉSTAMOS
-- P1 Pedro  → 22222222-2222-2222-2222-222222222201
-- P2 Ana    → 22222222-2222-2222-2222-222222222202
-- P3 Sandra → 22222222-2222-2222-2222-222222222203
-- P4 Carlos → 22222222-2222-2222-2222-222222222204

-- ─── TENANT ──────────────────────────────────────────────────
INSERT INTO tenants (
  id, nombre, slug,
  capital_inicial, tasa_interes_mensual,
  max_prestamo_por_miembro, cuota_mensual, dia_corte, multa_mora
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Fondo Familiar García',
  'fondo-garcia',
  50000000,   -- capital registrado inicialmente
  0.0150,     -- 1.5% mensual
  10000000,   -- máximo por miembro
  200000,     -- cuota mensual de aporte
  15,         -- día de corte
  50000       -- multa por mora
) ON CONFLICT (id) DO NOTHING;

-- ─── MIEMBROS ────────────────────────────────────────────────
-- user_id = NULL → se vinculará automáticamente cuando cada persona
-- haga login con magic link usando el email registrado aquí.
INSERT INTO miembros (
  id, tenant_id, user_id,
  nombre_completo, email, telefono,
  rol, estado, aporte_inicial
) VALUES
  ('11111111-1111-1111-1111-111111111101', '00000000-0000-0000-0000-000000000001', NULL,
   'Carlos García',   'carlos@email.com',   '300 123 4567', 'admin',    'activo', 4800000),
  ('11111111-1111-1111-1111-111111111102', '00000000-0000-0000-0000-000000000001', NULL,
   'María López',     'maria@email.com',    '310 234 5678', 'tesorero', 'activo', 4600000),
  ('11111111-1111-1111-1111-111111111103', '00000000-0000-0000-0000-000000000001', NULL,
   'Pedro Martínez',  'pedro@email.com',    '320 345 6789', 'miembro',  'activo', 3800000),
  ('11111111-1111-1111-1111-111111111104', '00000000-0000-0000-0000-000000000001', NULL,
   'Ana Rodríguez',   'ana@email.com',      '315 456 7890', 'miembro',  'activo', 3200000),
  ('11111111-1111-1111-1111-111111111105', '00000000-0000-0000-0000-000000000001', NULL,
   'Luis Hernández',  'luis@email.com',     '301 567 8901', 'miembro',  'activo', 4800000),
  ('11111111-1111-1111-1111-111111111106', '00000000-0000-0000-0000-000000000001', NULL,
   'Sandra Gómez',    'sandra@email.com',   '318 678 9012', 'miembro',  'activo', 3600000),
  ('11111111-1111-1111-1111-111111111107', '00000000-0000-0000-0000-000000000001', NULL,
   'Jorge Díaz',      'jorge@email.com',    '305 789 0123', 'miembro',  'activo', 3000000),
  ('11111111-1111-1111-1111-111111111108', '00000000-0000-0000-0000-000000000001', NULL,
   'Patricia Castro', 'patricia@email.com', '312 890 1234', 'miembro',  'activo', 4800000)
ON CONFLICT (id) DO NOTHING;

-- ─── PRÉSTAMOS ───────────────────────────────────────────────
-- Fechas actualizadas a 2025-2026 para coherencia con hoy (abril 2026).
-- cuotas_pagadas / plazo_meses determina el progreso visible en el UI.
INSERT INTO prestamos (
  id, tenant_id, solicitante_id,
  monto, plazo_meses, tasa_mensual, cuota_mensual, cuotas_pagadas,
  estado, fecha_solicitud, fecha_aprobacion, fecha_primer_vencimiento,
  saldo_pendiente
) VALUES
  -- P1: Pedro — activo, mes 5 de 12, 1 mes atrasado (pendiente)
  ('22222222-2222-2222-2222-222222222201',
   '00000000-0000-0000-0000-000000000001',
   '11111111-1111-1111-1111-111111111103',
   2000000, 12, 0.0150, 183929, 5,
   'activo', '2025-10-01', '2025-10-05', '2025-11-05',
   1200000),

  -- P2: Ana — vencido (en mora), mes 2 de 18
  ('22222222-2222-2222-2222-222222222202',
   '00000000-0000-0000-0000-000000000001',
   '11111111-1111-1111-1111-111111111104',
   3000000, 18, 0.0150, 194156, 2,
   'vencido', '2025-09-01', '2025-09-05', '2025-10-05',
   2800000),

  -- P3: Sandra — activo, mes 6 de 10, al día
  ('22222222-2222-2222-2222-222222222203',
   '00000000-0000-0000-0000-000000000001',
   '11111111-1111-1111-1111-111111111106',
   1500000, 10, 0.0150, 162656, 6,
   'activo', '2025-10-01', '2025-10-05', '2025-11-05',
   750000),

  -- P4: Carlos — pagado completamente
  ('22222222-2222-2222-2222-222222222204',
   '00000000-0000-0000-0000-000000000001',
   '11111111-1111-1111-1111-111111111101',
   5000000, 24, 0.0150, 249941, 24,
   'pagado', '2023-03-01', '2023-03-05', '2023-04-05',
   0)
ON CONFLICT (id) DO NOTHING;

-- ─── MOVIMIENTOS DEL FONDO ────────────────────────────────────
INSERT INTO movimientos_fondo (
  id, tenant_id, tipo, monto, descripcion,
  registrado_por, miembro_id, created_at
) VALUES
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000001',
   'aporte', 200000, 'Cuota mensual marzo 2026',
   '11111111-1111-1111-1111-111111111102', '11111111-1111-1111-1111-111111111101',
   '2026-03-15 10:00:00+00'),

  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000001',
   'aporte', 200000, 'Cuota mensual marzo 2026',
   '11111111-1111-1111-1111-111111111102', '11111111-1111-1111-1111-111111111102',
   '2026-03-15 10:05:00+00'),

  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000001',
   'prestamo_pago', 183929, 'Pago cuota 5 — préstamo Pedro Martínez',
   '11111111-1111-1111-1111-111111111102', '11111111-1111-1111-1111-111111111103',
   '2026-03-10 14:00:00+00'),

  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000001',
   'multa', 50000, 'Multa por mora — Ana Rodríguez',
   '11111111-1111-1111-1111-111111111102', '11111111-1111-1111-1111-111111111104',
   '2026-03-01 09:00:00+00'),

  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000001',
   'aporte', 200000, 'Cuota mensual marzo 2026',
   '11111111-1111-1111-1111-111111111102', '11111111-1111-1111-1111-111111111105',
   '2026-03-15 11:00:00+00'),

  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000001',
   'prestamo_pago', 162656, 'Pago cuota 6 — préstamo Sandra Gómez',
   '11111111-1111-1111-1111-111111111102', '11111111-1111-1111-1111-111111111106',
   '2026-03-12 15:30:00+00'),

  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000001',
   'aporte', 200000, 'Cuota mensual febrero 2026 (tardía)',
   '11111111-1111-1111-1111-111111111102', '11111111-1111-1111-1111-111111111107',
   '2026-02-20 16:00:00+00'),

  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000001',
   'aporte', 200000, 'Cuota mensual marzo 2026',
   '11111111-1111-1111-1111-111111111102', '11111111-1111-1111-1111-111111111108',
   '2026-03-14 12:00:00+00'),

  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000001',
   'rendimiento', 45000, 'Rendimiento mensual marzo 2026',
   '11111111-1111-1111-1111-111111111101', '11111111-1111-1111-1111-111111111101',
   '2026-03-01 08:00:00+00'),

  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000001',
   'prestamo_desembolso', -2000000, 'Desembolso préstamo Pedro Martínez',
   '11111111-1111-1111-1111-111111111101', '11111111-1111-1111-1111-111111111103',
   '2025-10-05 10:00:00+00');

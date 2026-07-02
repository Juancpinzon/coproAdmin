-- ============================================================
-- 017 — Anti doble-booking en reservas (auditoría full-stack)
-- ============================================================
-- Bug (TOCTOU): useCreateReserva valida conflicto con un SELECT y luego
-- hace INSERT en dos pasos. Dos residentes reservando el mismo horario a
-- la vez pasan ambos la validación → reservas dobles. RLS no lo evita.
--
-- Fix: constraint EXCLUDE que hace IMPOSIBLE a nivel de BD dos reservas
-- CONFIRMADAS que se solapen en la misma zona. Rango [inicio, fin) → las
-- reservas contiguas (una termina 16:00, otra empieza 16:00) NO chocan.
-- Solo aplica a estado='confirmada' (las canceladas no bloquean).
--
-- ⚠️ ANTES de aplicar: correr la query de detección de solapes de abajo.
--    Si devuelve filas, resolverlas (cancelar duplicados) o el ALTER falla.
-- ============================================================

-- btree_gist permite combinar igualdad (zona_id uuid) con && (rango) en gist
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE public.reservas
  ADD CONSTRAINT reservas_sin_solape
  EXCLUDE USING gist (
    zona_id WITH =,
    tsrange((fecha + hora_inicio), (fecha + hora_fin)) WITH &&
  )
  WHERE (estado = 'confirmada');

-- ─── DETECCIÓN previa (correr ANTES del ALTER; debe dar 0 filas) ──
-- SELECT a.id AS reserva_a, b.id AS reserva_b, a.zona_id, a.fecha,
--        a.hora_inicio, a.hora_fin, b.hora_inicio, b.hora_fin
-- FROM public.reservas a
-- JOIN public.reservas b
--   ON a.zona_id = b.zona_id AND a.fecha = b.fecha
--  AND a.estado = 'confirmada' AND b.estado = 'confirmada'
--  AND a.id < b.id
--  AND a.hora_inicio < b.hora_fin AND a.hora_fin > b.hora_inicio;

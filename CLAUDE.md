# CLAUDE.md — CoproAdmin

## SaaS para gestión de copropiedades en Colombia

> **LEE ESTO COMPLETO ANTES DE ESCRIBIR CÓDIGO.** Este archivo es la fuente de verdad del proyecto. Este repo es exclusivo de la vertical **Propiedad Horizontal**. No hay fondos familiares, no hay préstamos, no hay amortización de cuotas de fondo. Si algo no está documentado aquí, preguntar antes de inventar.

---

## 🧠 Contexto del Negocio

**Problema:** Los administradores de copropiedades en Colombia gestionan cobros, morosos, PQR y cumplimiento legal en Excel + WhatsApp + llamadas. No tienen software asequible, adaptado a la Ley 675 de 2001, ni con portal para el residente.

**Solución:** CoproAdmin es una plataforma SaaS multi-tenant para conjuntos residenciales colombianos. Centraliza cobros, reservas de zonas comunes, PQR, presupuesto anual y obligaciones legales del administrador en una sola herramienta.

**Cliente que paga:** El administrador profesional del conjunto o la junta directiva.

**Usuario secundario:** Propietario o residente — accede al portal para ver su estado de cuenta, reservar zonas y crear PQR.

**Mercado objetivo:** Colombia. La Ley 675 de 2001 es el marco legal que diferencia este producto de apps genéricas. No expandir a otros países hasta tener clientes colombianos estables.

**Supabase project:** `fondos` (AWS us-east-2) — project ID: `lavdttjhrnozboosgeub`

**Deploy:** `copro-admin.vercel.app` — repo: `github.com/Juancpinzon/coproAdmin`

---

## 🎯 Principios de Diseño Irrompibles

**1. Un tenant nunca ve datos de otro.**
Toda query a Supabase pasa por RLS con `tenant_id`. Nunca hacer queries sin filtro de tenant. Nunca usar `service_role` key en el frontend.

**2. El estado financiero es inmutable una vez confirmado.**
Los pagos confirmados no se editan, se revierten con un movimiento opuesto. Nunca hacer UPDATE sobre registros de `pagos` con estado `pagado`.

**3. La mora se calcula en runtime, nunca se guarda.**
El estado moroso de una unidad es siempre calculado comparando cuotas vencidas sin pago vs. fecha actual. Nunca guardar `is_moroso: boolean` como campo en BD.

**4. El residente ve su propio estado, no el de otros.**
El rol `residente` tiene acceso RLS solo a sus propias unidades, cuotas y reservas. Nunca exponer el listado general a este rol.

**5. Todo cobro masivo requiere previsualización antes de ejecutar.**
El flujo de generación de cuotas siempre muestra un resumen ("Se generarán X cuotas por $Y") y espera confirmación explícita del admin antes de insertar registros.

---

## 🛠️ Stack Tecnológico

| Capa            | Tecnología                   | Razón                                      |
| --------------- | ---------------------------- | ------------------------------------------ |
| Frontend        | React 18 + TypeScript strict | Stack del proyecto                         |
| Estilos         | Tailwind CSS                 | Stack del proyecto                         |
| UI Components   | shadcn/ui                    | Consistencia visual, accesibilidad         |
| Estado/fetching | @tanstack/react-query v5     | Caché, loading/error states, invalidación  |
| Formularios     | Validación manual/inline (⚠️) | RHF + Zod están en package.json pero SIN uso real — ver Deuda Técnica |
| Animaciones     | Framer Motion                | Landing page y transiciones                |
| Backend         | Supabase (BaaS)              | Auth, DB, RLS, Storage, Edge Functions     |
| Base de datos   | PostgreSQL vía Supabase      | Relacional, triggers, RLS nativo           |
| Pagos           | Wompi                        | PSE, Nequi, Daviplata, tarjetas — Colombia |
| Deploy          | Vercel                       | CI/CD automático desde GitHub              |
| Build           | Vite 5 + SWC                 | Stack del proyecto                         |

> ⚠️ **Zustand NO está instalado.** El estado global se maneja con React Query + contextos React. No instalar Zustand.

---

## 💼 Modelo Comercial

| Plan          | Unidades   | Precio mensual | Precio anual   |
| ------------- | ---------- | -------------- | -------------- |
| PH Básico     | Hasta 50   | $89.000 COP    | $890.000 COP   |
| PH Pro        | 51 a 200   | $149.000 COP   | $1.490.000 COP |
| PH Enterprise | Más de 200 | Consultar      | Consultar      |

**Enterprise incluye:** todo Pro + integración contable + facturación electrónica DIAN + implementación asistida + SLA dedicado.

**WhatsApp de contacto/demo:** actualizar `WA_DEMO_HREF` en `src/pages/LandingPage.tsx` con el número real (actualmente usa placeholder `573000000000`).

---

## 📁 Estructura del Proyecto

```
coproAdmin/
├── src/
│   ├── components/
│   │   ├── ui/                        # shadcn/ui base components (40+ archivos)
│   │   ├── shared/
│   │   │   └── TrialBanner.tsx        # Banner de trial activo
│   │   ├── modals/
│   │   │   └── InvitarMiembroModal.tsx
│   │   ├── ph/
│   │   │   ├── SidebarAyuda.tsx
│   │   │   └── ContenidoAyuda.tsx
│   │   ├── AppLayout.tsx              # Layout con sidebar para páginas autenticadas
│   │   ├── ComprobanteViewer.tsx
│   │   └── NavLink.tsx
│   ├── hooks/
│   │   ├── useAuth.ts                 # Sesión Supabase + signOut
│   │   ├── useTenant.ts               # Tenant activo del usuario autenticado
│   │   ├── useCurrentMiembro.ts       # Miembro del usuario autenticado
│   │   ├── useMiembrosPH.ts           # Lista miembros activos del conjunto (id, nombre, rol)
│   │   ├── useUnidades.ts             # CRUD unidades del conjunto
│   │   ├── useCuotasAdmin.ts          # Cuotas, generación masiva, registro de pago
│   │   ├── useZonasComunes.ts         # CRUD zonas comunes
│   │   ├── useReservas.ts             # Reservas con detección de conflictos
│   │   ├── usePQR.ts                  # Peticiones, quejas, reclamos
│   │   ├── usePresupuesto.ts          # Presupuesto anual por categoría
│   │   ├── useInvitarMiembro.ts       # Invitar miembro por email
│   │   ├── useWizardPH.ts             # Stub vacío — lógica del wizard está en OnboardingPHPage
│   │   ├── useSuperAdmin.ts           # Funciones exclusivas del superadmin
│   │   └── use-toast.ts              # shadcn/ui toast utility
│   ├── pages/
│   │   ├── LandingPage.tsx            # Landing pública de CoproAdmin
│   │   ├── LoginPage.tsx
│   │   ├── RegistroPage.tsx
│   │   ├── NotFound.tsx
│   │   ├── SuscripcionVencidaPage.tsx # Pantalla cuando el trial/plan venció
│   │   ├── PoliticaPrivacidadPage.tsx # Shell — contenido pendiente (Fase 6)
│   │   ├── TerminosDeUsoPage.tsx      # Shell — contenido pendiente (Fase 6)
│   │   ├── PoliticaCookiesPage.tsx    # Shell — contenido pendiente (Fase 6)
│   │   ├── ph/
│   │   │   ├── DashboardPHPage.tsx    # Vista principal del admin
│   │   │   ├── UnidadesPage.tsx
│   │   │   ├── CobrosPage.tsx
│   │   │   ├── ZonasPage.tsx
│   │   │   ├── ReservasPage.tsx
│   │   │   ├── PQRPage.tsx
│   │   │   ├── PresupuestoPage.tsx
│   │   │   ├── AyudaPage.tsx
│   │   │   ├── PortalResidentePage.tsx
│   │   │   ├── OnboardingPHPage.tsx
│   │   │   └── onboarding/
│   │   │       ├── StepConjunto.tsx
│   │   │       ├── StepUnidades.tsx
│   │   │       ├── StepCuota.tsx
│   │   │       ├── StepZonas.tsx
│   │   │       ├── types.ts
│   │   │       └── ui.tsx
│   │   └── superadmin/
│   │       └── SuperAdminDashboard.tsx
│   ├── contexts/
│   │   └── MiembroContext.tsx
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── utils.ts                   # formatCOP, formatDate, calcularMora
│   │   └── constants.ts
│   ├── types/
│   │   └── database.ts                # Generado con Supabase CLI
│   └── App.tsx                        # Router principal (NO es router.tsx)
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_fix_trigger_onboarding.sql
│   │   ├── 003_features.sql
│   │   ├── 004_comite_role.sql
│   │   ├── 005_add_ph_roles.sql
│   │   ├── 006_super_admin.sql
│   │   ├── 007_cumplimiento_legal.sql
│   │   ├── 008_ph_tables_rls.sql
│   │   ├── 009_fix_super_admin.sql
│   │   ├── 010_rpc_registrar_pago_cuota.sql        # Pago de cuota atómico (transacción + FOR UPDATE)
│   │   ├── 011_harden_helper_search_path.sql       # search_path fijo en helpers RLS
│   │   ├── 012_reconcile_pagos_movimientos_ph.sql  # Columnas PH en pagos + tipo 'ingreso'/'egreso'
│   │   ├── 013_fix_miembros_rls_recursion.sql      # Fix recursión infinita en miembros_select
│   │   └── 014_onboarding_rpc_close_self_insert.sql # RPC configurar_conjunto_ph + cierre self-insert
│   └── functions/                     # Vacío — Edge Functions pendientes (Fase 3)
├── CLAUDE.md                          # Este archivo
└── .env.local
```

---

## ⚠️ Deuda Técnica Pendiente

La limpieza de fondos familiares está completa. Quedan dos residuos menores:

| Archivo                                | Problema                                                                                                            | Acción                                                                 |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `supabase/migrations/003_features.sql` | Contiene stored procedures de amortización y aprobación de préstamos (fondos)                                       | No borrar — afectaría el historial de BD. Ignorar al leer migraciones. |
| `src/hooks/useInvitarMiembro.ts`       | Puede contener lógica de `aporte_inicial` (fondos). `InvitarMiembroModal` ya fue limpiado para no enviar ese campo. | Revisar y limpiar el hook en la próxima sesión de refactor.            |

Nuevos ítems pendientes:

- Fase 8: `any` explícito en TypeScript — SOLUCIONADO (0 keyword `any`). ⚠️ PERO `tsconfig`
  tiene `strict:false` / `noImplicitAny:false` / `strictNullChecks:false` → pasan implicit-any y
  null-unsafety en silencio. Activar `strict` (incremental) es PENDIENTE (auditoría full-stack).
- Auditoría full-stack (jul 2026) — pendientes abiertos, ordenados por impacto para vender:
  - Reservas: sin constraint anti-doble-booking (TOCTOU en useCreateReserva). Fix: `EXCLUDE`
    en Postgres o RPC con `FOR UPDATE`. (cuotas ya es idempotente por UNIQUE(unidad_id,periodo).)
  - `xlsx@0.18.5` (prototype pollution) en runtime del importador de unidades → migrar al build
    oficial del CDN de SheetJS. Correr `npm audit` de las vulns de runtime.
  - Wompi webhook: validar `amount_in_cents == cuota.monto`, firma constant-time, confirmar
    esquema real de firma contra el spec — antes de activar pagos online.
  - `vercel.json`: headers seguros añadidos (HSTS, nosniff, X-Frame-Options DENY, Referrer,
    Permissions). FALTA CSP — probar en un preview de Vercel antes de prod (no se testea en local).
  - Observabilidad: sin Sentry/logging (1 solo console en src/). Instalar Sentry.
  - Tests: solo el placeholder `src/test/example.test.ts` (cobertura ~0). Sembrar tests de la
    lógica financiera (coeficientes, mora, registrar_pago_cuota) antes de vender.
  - Front: `error.message` crudo al usuario en 6 sitios (enumeración de cuentas en signup);
    política de contraseña inconsistente (Login 6 vs Registro 8); bundle 2.1 MB sin code-split.
  - Repo: archivos que no deberían versionarse (`check_db.ts`, `check_tenants.ts`,
    `eslint_report.json`, `graphify-out/`, `design_temp/`, `*.cjs`); triple lockfile (bun + npm).
  - Verificado OK (no eran problema): buckets Storage privados (public=false); `/superadmin`
    ya protegido (SuperAdminDashboard chequea is_super_admin + RLS); índices — falso positivo
    "cero índices": la BD tenía idx_* a mano; los gaps reales se cerraron en migración 016.
- Fase 3: generar-cuotas pendiente de mover a Edge Function (idempotencia)
- Fase 3: pago de cuota — RESUELTO y VERIFICADO EN VIVO (jul 2026). Es atómico vía RPC
  `registrar_pago_cuota` (migración 010): SECURITY DEFINER con autorización explícita (rol
  admin_ph + estado activo + aislamiento por tenant), `SELECT ... FOR UPDATE` sobre la cuota,
  guard de idempotencia y un solo commit. El hook `useRegistrarPagoCuota` invoca el RPC (ya no
  orquesta 4 escrituras). Prueba end-to-end en la app (localhost): generar cuota (con
  previsualización) → registrar pago → `POST /rpc/registrar_pago_cuota → 200`; la cuota pasa a
  `pagado` y se crea el `movimientos_fondo` tipo `ingreso` apuntando al pago (`referencia_id`).
  Confirmado que la transacción escribe las 3 filas juntas.
- ⚠️ BUG MENOR migración 010: el `INSERT INTO movimientos_fondo` deja `fecha = null` (no
  propaga `p_fecha_pago`). La cuota y el pago sí quedan con fecha. Impacto: reportes que
  agrupan ingresos por `fecha` (p.ej. "Recaudo últimos 6 meses") se saltan el movimiento.
  Fix de una línea: pasar `p_fecha_pago` al INSERT del movimiento. PENDIENTE.
- Fase 2: onboarding — RESUELTO el path de creación. Tenant + admin se crean vía RPC
  `configurar_conjunto_ph` (migración 014, SECURITY DEFINER, idempotente: crea o actualiza).
  RegistroPage usa el mismo RPC. Al terminar se invalidan queries y se navega al panel.
  Pendiente: propietarios/unidades/zonas aún se insertan secuencialmente (no atómico con el RPC).
- Seguridad RLS — deriva de schema reconciliada y helpers endurecidas:
  - 011: `get_user_tenant_id()`/`get_user_rol()` con `search_path` fijo (anti hijack).
  - 012: la BD viva tenía columnas PH en `pagos` y `tipo` 'ingreso'/'egreso' en
    `movimientos_fondo` solo por ALTERs manuales; 012 los hace reproducibles.
  - 013: `miembros_select` tenía una subconsulta inline sobre `miembros` → recursión infinita;
    vuelve a usar la helper SECURITY DEFINER. `miembros_insert` endurecida (solo admin_ph del
    tenant); el cliente ya no se auto-inserta (hueco de aislamiento cerrado).
- Migraciones aplicadas a mano en el SQL Editor (no vía `db push`). El ledger del CLI
  (`supabase_migrations.schema_migrations`) NO existía en el remoto; se creó y sembró con las
  14 versiones (001–014) marcadas como aplicadas (jul 2026). Un futuro `db push` ya las ve
  aplicadas y NO re-corre nada. Pendiente para adoptar el CLI de verdad: `supabase init`
  (crea `config.toml`) + `supabase login` + `supabase link --project-ref lavdttjhrnozboosgeub`.
  Regla: seguir aplicando cambios por el SQL Editor y AÑADIR la fila en `schema_migrations`
  (version = prefijo del archivo, p.ej. '015') al crear cada nueva migración, para no
  desalinear el historial otra vez.
- Fase 6: seed_obligaciones_iniciales no lanza excepción si falla — admin puede reintentar desde /cumplimiento
- Fase 6: Storage bucket 'documentos-legales' — documento reemplazado genera path nuevo con timestamp, anterior queda huérfano. Limpiar en Fase 8.
- Fase 6: Unidad en TablaConsentimientos muestra primera unidad si miembro tiene múltiples — aceptable MVP, revisar post-lanzamiento
- Fase 7: VITE_APP_NAME tenía valor FondoApp en .env.local — corregido
- Fase 8: residuos de identidad fuera de src/ — corregidos: `package.json` name era `fondoapp-ph` (→ `coproadmin`), `.env.example` tenía `VITE_APP_NAME=FondoApp` (→ `CoproAdmin`), `LoginPage.tsx` ícono mostraba `F` (→ `C`)
- Auditoría seguridad pre-lanzamiento — 4 correcciones aplicadas:
  - `.gitignore`: agregadas entradas `.env` y `.env.*`
  - `ObligacionCard.tsx`: bucket `documentos-legales` ahora guarda path (no URL pública); usa `createSignedUrl` (15 min) para visualización
  - `008_ph_tables_rls.sql`: RLS habilitado + políticas para unidades, zonas_comunes, reservas, pqr, presupuesto_ph, cuotas_administracion, pagos, storage documentos-legales
  - `009_fix_super_admin.sql`: is_super_admin() ahora verifica por auth.uid() además del email
- ⚠️ PENDIENTE (requiere Supabase Dashboard): cambiar bucket `documentos-legales` de público a privado — ver instrucciones al final del CLAUDE.md

---

## 🗺️ Rutas de la Aplicación (App.tsx)

```
Sin autenticar:
  /                     → LandingPage
  /login                → LoginPage
  /registro             → RegistroPage
  /politica-privacidad  → PoliticaPrivacidadPage
  /terminos-de-uso      → TerminosDeUsoPage
  /politica-cookies     → PoliticaCookiesPage
  *                     → LandingPage

Sin tenant/onboarding:
  (cualquier ruta)      → OnboardingPHPage

Autenticado + tenant:
  /                     → DashboardPHPage
  /unidades             → UnidadesPage
  /cobros               → CobrosPage
  /zonas                → ZonasPage
  /reservas             → ReservasPage
  /pqr                  → PQRPage
  /presupuesto          → PresupuestoPage
  /portal               → PortalResidentePage
  /ayuda                → AyudaPage
  /superadmin           → SuperAdminDashboard
  /politica-privacidad  → PoliticaPrivacidadPage
  /terminos-de-uso      → TerminosDeUsoPage
  /politica-cookies     → PoliticaCookiesPage
  *                     → NotFound

Suscripción vencida:
  (cualquier ruta)      → SuscripcionVencidaPage
```

---

## 🗄️ Schema de Base de Datos

### Tablas principales

```typescript
interface Tenant {
  id: string;
  nombre: string; // "Conjunto Los Pinos"
  nit?: string; // NIT de la copropiedad
  direccion?: string;
  num_unidades?: number;
  cuota_base_mensual: number; // COP — base para cobro proporcional
  plan: "trial" | "basico" | "pro" | "enterprise";
  suscripcion_activa: boolean;
  trial_ends_at?: string;
  created_at: string;
}

interface Miembro {
  id: string;
  tenant_id: string; // FK → tenants
  user_id?: string; // FK → auth.users (null si sin cuenta)
  nombre: string;
  email?: string;
  telefono?: string;
  rol: "admin_ph" | "propietario" | "residente";
  estado: "activo" | "inactivo";
  created_at: string;
}

interface Unidad {
  id: string;
  tenant_id: string; // FK → tenants
  miembro_id: string; // FK → miembros (propietario actual)
  numero: string; // "101", "201B", "P1-2"
  tipo: "apartamento" | "local_comercial" | "parqueadero" | "deposito";
  coeficiente: number; // % proporcional — suma total del tenant = 100
  piso?: number;
  torre?: string;
  // mora: NUNCA guardar aquí — calcular en runtime
  created_at: string;
}

interface CuotaAdministracion {
  id: string;
  tenant_id: string; // FK → tenants
  unidad_id: string; // FK → unidades
  periodo: string; // "2025-06-01" — primer día del mes
  monto: number; // cuota_base * coeficiente
  estado: "pendiente" | "pagado" | "vencido";
  fecha_pago?: string;
  pago_id?: string; // FK → pagos
  comprobante_url?: string;
  created_at: string;
  // UNIQUE (unidad_id, periodo) — idempotencia del cobro masivo
}

interface Pago {
  id: string;
  tenant_id: string; // FK → tenants
  miembro_id: string; // FK → miembros
  unidad_id: string; // FK → unidades
  cuota_admin_id?: string; // FK → cuotas_administracion
  monto: number;
  fecha: string;
  concepto: string;
  estado: "pendiente" | "pagado" | "vencido";
  referencia_wompi?: string;
  comprobante_url?: string;
  created_at: string;
  // INMUTABLE una vez en estado 'pagado' — revertir con movimiento opuesto
}

interface MovimientoFondo {
  id: string;
  tenant_id: string;
  tipo: "ingreso" | "egreso";
  monto: number;
  descripcion: string;
  fecha: string;
  categoria?:
    | "administracion"
    | "mantenimiento"
    | "seguridad"
    | "servicios_publicos"
    | "reserva";
  created_at: string;
}

interface ZonaComun {
  id: string;
  tenant_id: string;
  nombre: string;
  capacidad_max: number;
  horario_apertura: string; // "06:00"
  horario_cierre: string; // "22:00"
  duracion_reserva_min: number; // 60, 90, 120
  activa: boolean;
  bloquear_en_mora: boolean;
  created_at: string;
}

interface Reserva {
  id: string;
  tenant_id: string;
  zona_id: string; // FK → zonas_comunes
  unidad_id: string; // FK → unidades
  miembro_id: string; // FK → miembros
  fecha: string;
  hora_inicio: string; // "14:00"
  hora_fin: string; // "16:00"
  estado: "confirmada" | "cancelada";
  cancelacion_motivo?: string;
  created_at: string;
}

interface PQR {
  id: string;
  tenant_id: string;
  unidad_id: string;
  miembro_id: string;
  tipo: "peticion" | "queja" | "reclamo";
  asunto: string;
  descripcion: string;
  estado: "abierto" | "en_gestion" | "cerrado";
  respuesta?: string;
  fecha_cierre?: string;
  created_at: string;
}

interface PresupuestoPH {
  id: string;
  tenant_id: string;
  anio: number;
  concepto: string;
  categoria:
    | "administracion"
    | "mantenimiento"
    | "seguridad"
    | "servicios_publicos"
    | "reserva";
  monto_presupuestado: number;
  // monto_ejecutado: calculado sumando movimientos de esa categoría y año
  created_at: string;
}

interface Asamblea {
  id: string;
  tenant_id: string;
  tipo: "ordinaria" | "extraordinaria";
  fecha: string;
  lugar: string;
  orden_del_dia: string[];
  quorum_requerido: number; // porcentaje: 50.01
  quorum_alcanzado?: number;
  acta_url?: string;
  estado: "convocada" | "realizada" | "cancelada";
  created_at: string;
}
```

### Tablas — Módulo de Cumplimiento Legal (Fase 6 — no construido aún)

```typescript
interface ConsentimientoTratamiento {
  id: string;
  tenant_id: string;
  miembro_id: string;
  version_politica: string; // "v1.0", "v1.1"
  acepto: boolean;
  fecha: string; // timestamp — inmutable
  ip_registro?: string;
  canal: "web" | "portal" | "presencial";
}

interface SolicitudARCO {
  id: string;
  tenant_id: string;
  miembro_id: string;
  tipo: "acceso" | "rectificacion" | "cancelacion" | "oposicion";
  descripcion: string;
  estado: "recibida" | "en_tramite" | "resuelta";
  respuesta?: string;
  fecha_limite: string; // 10 días hábiles desde recibida (Ley 1581)
  fecha_resolucion?: string;
  created_at: string;
}

interface ObligacionLegal {
  id: string;
  tenant_id: string;
  tipo:
    | "asamblea_ordinaria"
    | "rendicion_cuentas"
    | "presupuesto"
    | "seguros"
    | "estados_financieros"
    | "reglamento";
  fecha_vencimiento?: string;
  estado: "al_dia" | "proximo" | "vencido"; // calculado en runtime
  documento_url?: string;
  notas?: string;
  updated_at: string;
}
```

### RLS — Políticas críticas

```sql
-- Roles: 'admin_ph' | 'propietario' | 'residente'
-- admin_ph ve todas las unidades de su tenant:
CREATE POLICY "admin_ph_unidades" ON unidades FOR SELECT
USING (
  tenant_id = (SELECT tenant_id FROM miembros WHERE user_id = auth.uid() LIMIT 1)
  AND (SELECT rol FROM miembros WHERE user_id = auth.uid() LIMIT 1) = 'admin_ph'
);

-- propietario/residente ve solo sus propias unidades:
CREATE POLICY "residente_sus_unidades" ON unidades FOR SELECT
USING (
  miembro_id = (SELECT id FROM miembros WHERE user_id = auth.uid() LIMIT 1)
  AND (SELECT rol FROM miembros WHERE user_id = auth.uid() LIMIT 1) IN ('propietario', 'residente')
);
-- Replicar patrón en: cuotas_administracion, reservas, pqr, pagos
```

> ⚠️ **Recursión RLS en `miembros`.** Las políticas SOBRE `miembros` NO deben consultar
> `miembros` con una subconsulta inline (`SELECT ... FROM miembros ...`) — eso provoca
> "infinite recursion detected in policy for relation miembros". Usar SIEMPRE las helpers
> `SECURITY DEFINER` `get_user_tenant_id()`/`get_user_rol()` (bypass RLS, no se expanden en
> el plan de la policy). Esto lo corrigió la migración 013 tras una edición manual que había
> reintroducido la subconsulta. Las subconsultas inline SÍ son válidas en políticas sobre
> OTRAS tablas (unidades, pagos, etc.), como en el ejemplo de arriba.
>
> **Creación de tenant/miembro (onboarding y registro):** va por el RPC `SECURITY DEFINER`
> `configurar_conjunto_ph` (fija `rol='admin_ph'` y `user_id` server-side). `miembros_insert`
> NO permite auto-inserción del cliente — solo un `admin_ph` agrega miembros de su tenant.

---

## 🔄 Flujos de Negocio Críticos

### Flujo 1: Onboarding de nuevo conjunto

```
1. Admin se registra (RegistroPage): signUp + RPC configurar_conjunto_ph → crea tenant + admin_ph
2. App detecta tenant con num_unidades=0 → OnboardingPHPage
3. Wizard paso 1: nombre del conjunto, dirección, NIT (con dígito verificador DIAN)
4. Wizard paso 2: cuota base mensual (formateo COP en vivo, proyección anual)
5. Wizard paso 3: cargar unidades (tabla editable + CSV, coeficientes suman 100%)
6. Wizard paso 4: configurar zonas comunes (presets disponibles)
7. Resumen final → confirmar → RPC configurar_conjunto_ph (idempotente: actualiza tenant)
   → INSERT propietarios/unidades/zonas → seed obligaciones → invalida caché → navega a /
8. Borrador en localStorage key 'ph_onboarding_draft' (guarda datos + paso actual)
9. Creación de tenant+admin: atómica dentro del RPC (SECURITY DEFINER). El resto
   (propietarios/unidades/zonas) son inserts secuenciales del cliente bajo RLS admin_ph.
   Pendiente: hacerlos parte de la misma transacción (rollback completo).
```

### Flujo 2: Generación de cobro masivo mensual

```
1. Admin selecciona período (mes/año) en pantalla Cobros
2. Sistema consulta unidades activas del tenant
3. Calcula monto por unidad: cuota_base * coeficiente
4. Muestra previsualización OBLIGATORIA:
   "Se generarán 48 cuotas por un total de $12.480.000 para junio 2025"
5. Admin confirma explícitamente
6. Edge Function 'generar-cuotas' inserta en cuotas_administracion estado='pendiente'
7. UNIQUE (unidad_id, periodo) → si ya existen, retorna error claro sin duplicar
```

### Flujo 3: Registro de pago de cuota

```
1. Admin busca unidad o propietario
2. Selecciona cuota(s) pendiente(s)
3. Registra: fecha, monto, medio de pago, sube comprobante (Storage)
4. RPC registrar_pago_cuota (migración 010) hace TODO en una transacción atómica:
   FOR UPDATE sobre la cuota → INSERT pago → UPDATE cuota a 'pagado' → INSERT movimiento
   'ingreso'. Autorización (admin_ph + tenant) e idempotencia validadas dentro del RPC.
5. Mora se recalcula en runtime — no se guarda en BD
```

### Flujo 4: Reserva de zona común

```
1. Residente selecciona zona en portal
2. Sistema verifica mora: cuotas vencidas + bloquear_en_mora=true → error
3. Residente selecciona fecha y horario disponible
4. Sistema verifica colisión en reservas confirmadas de esa zona+fecha+hora
5. INSERT en reservas estado='confirmada'
```

### Flujo 5: Gestión de PQR

```
1. Residente crea PQR: tipo + asunto + descripción → estado 'abierto'
2. Admin cambia a 'en_gestion', agrega respuesta parcial
3. Admin cierra: respuesta final, estado='cerrado', fecha_cierre=NOW()
4. Residente ve historial completo en su portal
```

---

## 🏛️ Módulo de Cumplimiento Legal (Fase 6 — no construido)

Funcionalidad diferenciadora del producto. Dos capítulos separados en la navegación del admin.

### Capítulo 1 — Protección de Datos Personales

_(Ley 1581/2012 + Decreto 1377/2013 — ente de control: SIC)_

- Registro de consentimientos con timestamp y versión de política por miembro
- Flujo ARCO dentro de la app (Acceso, Rectificación, Cancelación, Oposición)
- Plazo legal de respuesta: 10 días hábiles (Ley 1581) — la app alerta vencimientos
- Aviso de privacidad diferenciado por rol (propietario vs. residente)
- Alerta al exportar datos sensibles (lista de morosos, emails, teléfonos)
- Panel admin: estado de consentimientos por unidad

### Capítulo 2 — Obligaciones Ley 675 de 2001

_(Ente de control: Alcaldía/Secretaría — riesgo: demandas civiles, remoción del admin)_

| Obligación                      | Frecuencia                                 | Alerta previa           |
| ------------------------------- | ------------------------------------------ | ----------------------- |
| Asamblea ordinaria              | Anual (máx. 3 meses tras cierre ejercicio) | 60 días antes           |
| Rendición de cuentas            | En asamblea                                | Con convocatoria        |
| Presupuesto anual aprobado      | Antes de ejecutar                          | Al iniciar año          |
| Seguros obligatorios            | Anual                                      | 30 días antes de vencer |
| Estados financieros disponibles | A solicitud                                | Siempre activo          |
| Reglamento PH cargado           | Permanente                                 | Al onboarding           |

**Semáforo de cumplimiento en dashboard:**

- 🟢 Al día
- 🟡 Próximo a vencer (≤30 días)
- 🔴 Vencido o incumplido

---

## 🎨 Sistema de Diseño

```css
:root {
  --color-primary: #1e40af;
  --color-primary-light: #3b82f6;
  --color-primary-dark: #1e3a8a;

  --color-success: #16a34a;
  --color-success-bg: #dcfce7;
  --color-danger: #dc2626;
  --color-danger-bg: #fee2e2;
  --color-warning: #d97706;
  --color-warning-bg: #fef3c7;

  --color-bg: #f8fafc;
  --color-surface: #ffffff;
  --color-border: #e2e8f0;
  --color-text: #0f172a;
  --color-text-muted: #64748b;

  --font-body: "Inter", sans-serif;
  --font-mono: "JetBrains Mono", monospace; /* montos COP */

  --touch-min: 48px; /* portal residente — mobile-first */
  --font-min-mobile: 16px;
}
```

```typescript
// Formateo de moneda — siempre esta función, nunca manual
export const formatCOP = (amount: number): string =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount);
// → "$1.250.000"
```

**Tono del copy:**

- Sin términos de IA o startup: no usar "definitivo", "potenciado por IA", "inteligente"
- Directo, como un administrador hablando con otro administrador
- Frases cortas, concretas, sin adjetivos vacíos

---

## 📦 Seed Data al completar onboarding

```typescript
const zonasDefault = [
  {
    nombre: "Gimnasio",
    capacidad_max: 10,
    horario_apertura: "05:00",
    horario_cierre: "22:00",
    duracion_reserva_min: 60,
    bloquear_en_mora: true,
  },
  {
    nombre: "Piscina",
    capacidad_max: 20,
    horario_apertura: "07:00",
    horario_cierre: "20:00",
    duracion_reserva_min: 60,
    bloquear_en_mora: true,
  },
  {
    nombre: "Salón Social",
    capacidad_max: 50,
    horario_apertura: "08:00",
    horario_cierre: "23:00",
    duracion_reserva_min: 120,
    bloquear_en_mora: false,
  },
];

const categoriasPresupuesto = [
  "Administración",
  "Mantenimiento",
  "Seguridad",
  "Servicios públicos zonas comunes",
  "Fondo de reserva",
];

const obligacionesIniciales = [
  "asamblea_ordinaria",
  "presupuesto",
  "seguros",
  "reglamento",
];
```

---

## 🖥️ Pantallas y Navegación

### Panel Admin

```
───────────────────────────────────────────────────────
  CoproAdmin  [Conjunto Los Pinos]        [Admin ▾]
──────────────┬────────────────────────────────────────
 Dashboard    │  KPIs: Recaudo mes / Morosos /
 Unidades     │  Reservas hoy / PQR abiertos
 Cobros       │
 Zonas        │  [Semáforo cumplimiento legal]
 PQR          │
 Presupuesto  │  [Gráfica recaudo últimos 6 meses]
 Asamblea     │
 Cumplim.     │  [Últimos pagos registrados]
 Config       │
──────────────┴────────────────────────────────────────
```

### Portal Residente (mobile-first)

```
───────────────────────
  CoproAdmin  Apto 401
───────────────────────
  Estado de cuenta
  ✅ Al día
  Junio 2025: $280.000
  [Ver historial]
───────────────────────
  Reservar zona
  [Gimnasio ▾]
  [Fecha]   [Hora]
  [Confirmar]
───────────────────────
  Mis PQR
  #003 En gestión
  [Nueva PQR]
───────────────────────
```

---

## 🗓️ Orden de Construcción

### Fase 1 — Landing + Identidad ✅ COMPLETA

- [x] Reemplazar "FondoApp" → "CoproAdmin" en todos los archivos
- [x] Fix doble scrollbar (`overflow-x-hidden` en div raíz de LandingPage)
- [x] Quitar testimonios falsos → placeholder honesto + CTA a demo por WhatsApp
- [x] Pricing: Básico (≤50) / Pro (51–200) / Enterprise (+200 → Consultar)
- [x] Footer legal apuntando a rutas reales: /politica-privacidad, /terminos-de-uso, /politica-cookies
- [x] Crear shells de las 3 páginas legales (en `src/pages/`, contenido en Fase 6)
- [x] Copy hero, statsbar, features y how-it-works revisado y coherente con CoproAdmin
- [x] Sección "¿Para quién es CoproAdmin?" entre Features y HowItWorks
- [x] **Criterio de éxito:** landing sin rastro de FondoApp, sin testimonios falsos, links legales funcionales, número de WhatsApp real
      _Nota: Cerrada. Grep de verificación: 0 residuos de FondoApp._

### Fase 2 — Wizard de Onboarding ⏳ 97%

- [x] Wizard 5 pasos completo (StepConjunto, StepCuota, StepUnidades, StepZonas, StepResumen)
- [x] Validación NIT con cálculo de dígito verificador DIAN en StepConjunto
- [x] Importar unidades desde Excel/CSV con parser inteligente
- [x] Distribución automática de coeficientes
- [x] Seed automático de zonas y miembros al finalizar
- [x] Borrador en localStorage con recuperación automática (incluye el paso actual `step`)
- [x] No se reinicia al cambiar de pestaña (fix remonte: onAuthStateChange preserva ref de user,
      value del provider memoizado, gate de carga solo en carga inicial)
- [x] Tenant + admin creados vía RPC `configurar_conjunto_ph` (SECURITY DEFINER, idempotente),
      no con inserts directos del cliente. `tipo` de unidad normalizado a minúscula.
- [x] Al terminar: invalida caché de `tenant`/`current-miembro` y navega al panel
      (antes la SuccessScreen era un limbo que se perdía al cambiar de pestaña)
- [ ] Rollback transaccional completo — propietarios/unidades/zonas aún se insertan
      secuencialmente tras el RPC (el RPC solo hace atómico tenant+admin)
- [x] **Criterio de éxito:** desde cero hasta dashboard, verificado de punta a punta

### Fase 3 — Módulo de Cobros ⏳ 90%

- [x] Listado de cuotas con estado de mora calculado en runtime
- [x] Generación masiva con previsualización obligatoria (muestra total y conteo antes de confirmar)
- [x] Dos modos: cuota fija o proporcional por coeficiente
- [x] Registro manual de pago con fecha y URL de comprobante
- [x] Pago registrado atómicamente vía RPC `registrar_pago_cuota` (migración 010): una sola
      transacción con `FOR UPDATE` — crea pago + actualiza cuota + agrega movimiento; idempotente.
      Verificado end-to-end en la app (jul 2026): RPC → 200, cuota `pagado`, movimiento `ingreso`.
      Bug menor abierto: el movimiento queda con `fecha = null` (ver Deuda Técnica)
- [x] Exportación a Excel, PDF y CSV
- [ ] Edge Function `generar-cuotas` — pendiente de mover a Edge Function (idempotencia)
- [x] **Criterio de éxito:** generar cuotas, registrar pago, ver movimiento en fondo del conjunto

### Fase 4 — Zonas Comunes y Reservas ✅ COMPLETA

- [x] CRUD completo de zonas comunes (crear, editar, activar/desactivar)
- [x] Toggle "bloquear en mora" por zona
- [x] Calendario semanal de reservas (18h por día, 6am–11pm)
- [x] Detección de conflictos antes de confirmar reserva
- [x] Cancelación con motivo obligatorio
- [x] Bloqueo automático a unidades en mora (verificado antes de crear reserva)
- [x] Portal del residente: estado de cuenta + reservas + PQR
- [x] **Criterio de éxito:** moroso no puede reservar, residente al día sí puede

### Fase 5 — PQR y Presupuesto ✅ COMPLETA

- [x] PQR: crear (residente) con tipo, asunto, descripción
- [x] PQR: gestionar (admin) — cambiar estado a 'en_gestion' con respuesta parcial
- [x] PQR: cerrar con respuesta final + fecha_cierre automática
- [x] PQR: filtros por tipo y estado, contadores en header
- [x] Presupuesto: CRUD por categoría (admin, mant., seguridad, servicios, reserva)
- [x] Presupuesto: selector por año (anterior, actual, siguiente)
- [x] Presupuesto: resumen total y desglose por categoría
- [x] **Criterio de éxito:** PQR de residente visible en panel admin con estado

### Fase 6 — Módulo de Cumplimiento Legal ✅ COMPLETA

- [x] Schema BD: tablas consentimientos_tratamiento, solicitudes_arco, obligaciones_legales + RLS + función seed_obligaciones_iniciales
- [x] useObligaciones.ts — estado calculado en runtime, nunca en BD
- [x] useConsentimientos.ts — registro y solicitudes ARCO
      Expone: solicitudesArco, solicitudesVencidas, solicitudesUrgentes
      calcularDiasHabilesRestantes en utils.ts (excluye sábados/domingos)
- [x] Seed wired al onboarding (OnboardingPHPage.tsx → handleFinish)
- [x] Banner consentimiento en PortalResidentePage (versión v1.0)
- [x] Sección ARCO en PortalResidentePage — 4 tipos, modal, toast "10 días hábiles"
- [x] CumplimientoPage.tsx — /cumplimiento activa, sidebar actualizado
      Subcarpeta: src/pages/ph/cumplimiento/
      ObligacionCard.tsx (165 líneas)
      TablaConsentimientos.tsx (151 líneas)
      TablaARCO.tsx (187 líneas)
      Capítulo 1: panel consentimientos + gestión ARCO para admin_ph
      Capítulo 2: 6 obligaciones Ley 675 — fechas editables, subida documentos a Storage, notas debounce 800ms, estado calculado en runtime
- [x] Semáforo ComplianceSemaforo en DashboardPHPage — ordenado por urgencia, insertado después de KPIs
- [x] Contenido legal real:
      PoliticaPrivacidadPage — Ley 1581/2012 + ARCO + v1.0
      TerminosDeUsoPage — CoproAdmin como herramienta, no administrador
      PoliticaCookiesPage — cookies reales Supabase Auth, sin terceros
- [x] Criterio de éxito: ✅ admin ve semáforo con 4+ obligaciones rastreadas

### Fase 7 — Wompi (pagos online) ⏳ 60%

- [x] src/types/wompi.ts — WompiTransaction, WompiWebhookPayload,
      WompiCheckoutConfig
- [x] src/hooks/useWompi.ts — initCheckout, isConfigured,
      WOMPI_SCRIPT_URL
- [x] src/lib/constants.ts — WOMPI_CURRENCY, WOMPI_MIN_AMOUNT_CENTS
- [x] PortalResidentePage.tsx — ModalPagoWompi con estado
      deshabilitado hasta configurar credenciales
- [x] supabase/functions/webhook-wompi/index.ts — verificación
      HMAC-SHA256, UPDATE cuota, INSERT movimiento_fondo,
      idempotencia con guard eq('estado','pendiente')
- [x] .env.local — VITE_WOMPI_PUBLIC_KEY comentado (pendiente sandbox)
      Corregido residuo: VITE_APP_NAME=CoproAdmin
- [ ] Conectar widget real con credenciales sandbox
- [ ] Deploy Edge Function webhook-wompi a Supabase
- [ ] Prueba end-to-end: residente paga → cuota cambia a pagado
- [ ] **Criterio de éxito:** residente paga online, estado cambia
      sin intervención del admin

### Fase 8 — Pulido y Deploy ⏳ 60%

- [x] Responsive portal residente mobile-first
      Touch targets 48px, font 16px, modales full-screen móvil,
      botones full-width en móvil, DIALOG_MOBILE en 4 DialogContent
- [x] Responsive panel admin mobile-first
      DashboardPHPage, CobrosPage, CumplimientoPage mobile-ready
      AppLayout: sidebar drawer en móvil, fijo en desktop
- [x] Deuda técnica limpiada:
      Modales de préstamos/amortización ya no existen en repo
      useFiadoresDisponibles ya no existe en repo
- [x] Auditoría consola limpia:
      useSuperAdmin.ts, OnboardingPHPage.tsx, NotFound.tsx
- [x] Grep residuos src/: 0 coincidencias FondoApp/fondoapp/
      aporte_inicial/fondo familiar
- [x] Residuos de identidad fuera de src/ corregidos:
      package.json name → coproadmin
      .env.example VITE_APP_NAME → CoproAdmin
      LoginPage.tsx ícono → C (era F)
- [x] any en TypeScript — pasada dedicada completada (0 anys)
- [ ] Dominio custom + variables de entorno en producción
- [ ] Número WhatsApp real en WA_DEMO_HREF (3158966130)
      LandingPage.tsx + SuscripcionVencidaPage.tsx
- [ ] Prueba Chrome mobile sin errores de consola
- [ ] **Criterio de éxito:** funciona en Chrome mobile sin errores

---

## 🚨 Reglas de Código

### SIEMPRE:

- TypeScript: cero `any` explícito. ⚠️ NOTA: hoy `tsconfig` tiene `strict: false` (ver Deuda Técnica). Escribir el tipado como si strict estuviera activo — la meta es activarlo.
- Todo acceso a Supabase desde hooks (`/src/hooks/`), nunca directo en componentes.
- Formatear moneda con `formatCOP()` de `lib/utils.ts`.
- Filtrar por `tenant_id` en toda query. Sin excepción.
- `loading` + `error` state en todos los hooks de data fetching.
- Migraciones SQL en `/supabase/migrations/` con nombre versionado: `00N_nombre.sql`
- Previsualización antes de cualquier acción masiva.
- Componentes de máximo 200 líneas — dividir si se supera.

### NUNCA:

- Usar `service_role` key en el frontend.
- Hacer UPDATE a un pago con estado `pagado`.
- Guardar mora como campo en BD.
- Hacer queries sin filtro de `tenant_id`.
- Instalar librerías UI distintas a shadcn/ui.
- Usar el nombre "FondoApp" en ningún texto visible al usuario.
- Poner testimonios ficticios en producción.
- Calcular mora o totales financieros en el frontend.
- Referenciar préstamos, cuotas de amortización ni fondos familiares — ese es otro repo.
- Instalar Zustand — el estado se maneja con React Query y contextos React.

---

## 💻 Comandos de Desarrollo

```bash
npm install
npm run dev                    # localhost:8080 (puerto fijado en vite.config)
npm run build
npm run lint

# Regenerar tipos tras cada cambio de schema:
npx supabase gen types typescript --project-id lavdttjhrnozboosgeub > src/types/database.ts
```

> ⚠️ **NO correr `supabase db push` con el flujo actual.** Las migraciones se aplican a mano
> en el SQL Editor y los archivos 001–014 pueden no reproducir fielmente la BD viva (varios se
> editaron después de aplicarse). Un `db push` podría generar un diff destructivo. El ledger
> `supabase_migrations.schema_migrations` ya está sembrado (001–014 como aplicadas), así que
> hoy el push sería no-op, pero no es el flujo soportado hasta hacer la adopción de abajo.

### Flujo actual de migraciones (manual, soportado)

1. Escribir `0NN_nombre.sql` en `supabase/migrations/`.
2. Pegar y ejecutar el SQL en el **SQL Editor** de Supabase.
3. Registrar la versión en el ledger para no desalinear el historial:
   ```sql
   insert into supabase_migrations.schema_migrations (version, name)
   values ('0NN','nombre') on conflict (version) do nothing;
   ```
4. Regenerar tipos (comando de arriba) y commitear archivo + tipos.

### Adopción del CLI (hacer antes de escalar/vender — baseline seguro)

Migrar a "migraciones como código" (reproducibilidad, staging, review en PR). Ya está listo
`supabase/config.toml`. El paso clave es NO empujar los archivos a mano, sino capturar el
estado REAL de prod como línea base con `db pull`:

```bash
supabase login                                     # navegador, una vez
supabase link --project-ref lavdttjhrnozboosgeub   # pide password de la BD
supabase db pull                                   # genera una migración = schema real de prod
# revisar el archivo generado; de aquí en adelante: nuevo archivo + `supabase db push`
```

Tras esto, lo ideal es probar cambios en un proyecto de **staging** y recién ahí `db push` a prod.

**Variables de entorno (.env.local):**

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_WOMPI_PUBLIC_KEY=
RESEND_API_KEY=
```

---

🔄 Instrucción de Auto-actualización

🔄 Cómo mantener este archivo actualizado
Cuando el usuario diga cualquiera de estas frases:

"Lee el git diff de los últimos commits y actualiza el archivo CLAUDE.md siguiendo las instrucciones de la sección 🔄 que está al final del archivo"
"actualiza el CLAUDE.md con los cambios recientes"
"sincroniza el CLAUDE.md con el git diff"
"registra los cambios de esta sesión en el CLAUDE.md"

Evitar frases cortas como "actualiza el md" — pueden ser interceptadas por el sistema de memoria automático de Claude Code.

Ejecutar este flujo en orden:

1. Leer el estado actual
   bashcat CLAUDE.md
   git log --oneline -10
   git diff HEAD~1 --stat
2. Leer el diff completo si hay cambios relevantes
   bashgit diff HEAD~1
3. Mapear cambios a secciones
   Identificar qué secciones del CLAUDE.md se ven afectadas:

Archivos nuevos en src/ → posible cambio en Estructura del Proyecto
Archivos en supabase/migrations/ → actualizar Schema de Base de Datos
Cambios en src/hooks/ o src/lib/ → posible cambio en Flujos o Reglas de Código
Cambios en package.json → actualizar Stack Tecnológico
Fases completadas → marcar [x] en Orden de Construcción

4. Actualizar solo las secciones afectadas

Marcar fases completadas con [x] o ✅
Agregar tablas/campos nuevos al schema
Registrar patrones nuevos en Reglas de Código
NO reescribir secciones no afectadas
NO cambiar los Principios Irrompibles sin confirmación

5. Confirmar al usuario
   CLAUDE.md actualizado. Cambios aplicados:

- [sección]: [qué cambió]
- [sección]: [qué cambió]
  ⚠️ [inconsistencia si la hay]

Nota para el agente: Si el diff es muy grande o cubre múltiples fases,
pedir confirmación antes de hacer cambios estructurales al CLAUDE.md.

NUNCA crear archivos de documentación separados.
Todos los cambios van integrados en este CLAUDE.md, no en archivos externos.

---

## 🔮 Roadmap Futuro (no construir ahora)

| Feature                         | Por qué esperar                                  |
| ------------------------------- | ------------------------------------------------ |
| Facturación electrónica DIAN    | Requiere RUT del conjunto + proveedor habilitado |
| Notificaciones WhatsApp/push    | Tras primeros 5 clientes pagando                 |
| App móvil nativa                | Primero validar retención en web                 |
| Asamblea virtual con votaciones | Complejidad legal alta                           |
| Expansión a otros países        | Solo tras 10+ tenants colombianos estables       |
| Importar historial desde Excel  | Nice-to-have post-MVP                            |

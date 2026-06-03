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
| Formularios     | React Hook Form + Zod        | Validación robusta, tipos seguros          |
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
│   │   └── 006_super_admin.sql
│   └── functions/                     # Vacío — Edge Functions pendientes (Fase 3)
├── CLAUDE.md                          # Este archivo
└── .env.local
```

---

## ⚠️ Deuda Técnica Pendiente

La limpieza de fondos familiares está completa. Quedan dos residuos menores:

| Archivo | Problema | Acción |
|---|---|---|
| `supabase/migrations/003_features.sql` | Contiene stored procedures de amortización y aprobación de préstamos (fondos) | No borrar — afectaría el historial de BD. Ignorar al leer migraciones. |
| `src/hooks/useInvitarMiembro.ts` | Puede contener lógica de `aporte_inicial` (fondos). `InvitarMiembroModal` ya fue limpiado para no enviar ese campo. | Revisar y limpiar el hook en la próxima sesión de refactor. |

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

---

## 🔄 Flujos de Negocio Críticos

### Flujo 1: Onboarding de nuevo conjunto

```
1. Admin se registra: nombre, email, contraseña
2. Sistema crea tenant
3. Wizard paso 1: nombre del conjunto, dirección, NIT (con dígito verificador DIAN)
4. Wizard paso 2: cuota base mensual (formateo COP en vivo, proyección anual)
5. Wizard paso 3: cargar unidades (tabla editable + CSV, coeficientes suman 100%)
6. Wizard paso 4: configurar zonas comunes (presets disponibles)
7. Resumen final → confirmar → seed automático → redirect a /dashboard
8. Borrador en localStorage key 'ph_onboarding_draft'
9. INSERT en orden: tenant → miembros → unidades → zonas_comunes
   Rollback completo si falla cualquier INSERT
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
4. INSERT en pagos con referencia a cuota_admin_id
5. UPDATE cuotas_administracion SET estado='pagado', fecha_pago, pago_id
6. INSERT en movimientos_fondo tipo='ingreso'
7. Mora se recalcula en runtime — no se guarda en BD
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

### Fase 1 — Landing + Identidad

- [x] Reemplazar "FondoApp" → "CoproAdmin" en todos los archivos
- [x] Fix doble scrollbar (`overflow-x-hidden` en div raíz de LandingPage)
- [x] Quitar testimonios falsos → placeholder honesto + CTA a demo por WhatsApp
- [x] Pricing: Básico (≤50) / Pro (51–200) / Enterprise (+200 → Consultar)
- [x] Footer legal apuntando a rutas reales: /politica-privacidad, /terminos-de-uso, /politica-cookies
- [x] Crear shells de las 3 páginas legales (en `src/pages/`, contenido en Fase 6)
- [ ] Copy hero, statsbar, features y how-it-works revisado y coherente con CoproAdmin
- [ ] Sección "¿Para quién es CoproAdmin?" entre Features y HowItWorks
- [ ] **Criterio de éxito:** landing sin rastro de FondoApp, sin testimonios falsos, links legales funcionales, número de WhatsApp real

### Fase 2 — Wizard de Onboarding ✅ COMPLETA

- [x] Wizard 5 pasos completo (StepConjunto, StepCuota, StepUnidades, StepZonas, StepResumen)
- [x] Validación NIT con cálculo de dígito verificador DIAN en StepConjunto
- [x] Importar unidades desde Excel/CSV con parser inteligente
- [x] Distribución automática de coeficientes
- [x] Seed automático de zonas y miembros al finalizar
- [x] Borrador en localStorage con recuperación automática
- [x] Pantalla de éxito post-creación
- [~] Rollback transaccional completo — no verificado; la lógica de inserción es secuencial, no usa una transacción atómica explícita
- [x] **Criterio de éxito:** desde cero hasta dashboard en menos de 20 minutos

### Fase 3 — Módulo de Cobros ✅ COMPLETA

- [x] Listado de cuotas con estado de mora calculado en runtime
- [x] Generación masiva con previsualización obligatoria (muestra total y conteo antes de confirmar)
- [x] Dos modos: cuota fija o proporcional por coeficiente
- [x] Registro manual de pago con fecha y URL de comprobante
- [x] Pago registrado atómicamente: crea pago + actualiza cuota + agrega movimiento de fondo
- [x] Exportación a Excel, PDF y CSV
- [~] Edge Function `generar-cuotas` — la lógica está en `useCuotasAdmin` (frontend), no en Edge Function. Funciona pero sin la garantía idempotente del servidor
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

### Fase 6 — Módulo de Cumplimiento Legal _(en curso)_

- [x] Schema: `consentimientos_tratamiento`, `solicitudes_arco`, `obligaciones_legales` — migración 007 aplicada en producción
- [x] Hook `useObligaciones.ts` — fetch + estado calculado en runtime (al_dia/proximo/vencido), `useResumenCumplimiento` para dashboard
- [x] Hook `useConsentimientos.ts` — consentimientos inmutables, flujo ARCO completo (crear, listar, actualizar estado)
- [x] Seed automático de 4 obligaciones iniciales al completar onboarding (`seed_obligaciones_iniciales` via RPC)
- [x] Página `CumplimientoPage.tsx` — Capítulo 1 (cards consentimientos) + Capítulo 2 (checklist Ley 675 con semáforo)
- [x] Semáforo de cumplimiento en `DashboardPHPage.tsx` (ComplianceSemaforo con useObligaciones)
- [x] ShieldCheck "Cumplimiento" añadido al sidebar de admin_ph en AppLayout.tsx
- [x] Banner de consentimiento en portal residente (usar `useConsentimientoVigente`)
- [x] Sección ARCO en `PortalResidentePage.tsx` (residente crea solicitud, ve historial)
- [x] Contenido legal real en /politica-privacidad, /terminos-de-uso, /politica-cookies (v1.0 — Ley 1581/2012, Ley 675/2001)
- [ ] **Criterio de éxito:** admin ve semáforo con al menos 4 obligaciones rastreadas

### Fase 7 — Wompi _(no iniciado)_

- [ ] Link de pago por cuota desde portal residente
- [ ] Webhook Wompi → actualiza cuota a `pagado` automáticamente
- [ ] Edge Function `webhook-wompi`
- [ ] **Criterio de éxito:** residente paga online, estado cambia sin intervención del admin

### Fase 8 — Pulido y Deploy _(no iniciado)_

- [ ] Responsive completo — portal residente mobile-first
- [ ] Limpiar `useInvitarMiembro.ts` (posible lógica fondos residual)
- [ ] Dominio custom + variables de entorno en producción
- [ ] Número de WhatsApp real en `WA_DEMO_HREF` (LandingPage + SuscripcionVencidaPage)
- [ ] **Criterio de éxito:** funciona en Chrome mobile sin errores de consola

---

## 🚨 Reglas de Código

### SIEMPRE:

- TypeScript strict. Cero `any`.
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
npm run dev                    # localhost:5173
npm run build
npm run lint

# Tras cada migración:
npx supabase gen types typescript --project-id lavdttjhrnozboosgeub > src/types/database.ts
npx supabase db push
```

**Variables de entorno (.env.local):**

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_WOMPI_PUBLIC_KEY=
RESEND_API_KEY=
```

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

# CLAUDE.md — Plataforma Multi-Vertical de Gestión Financiera

## FondoApp · Propiedad Horizontal · Fondos de Empleados

> **LEE ESTO PRIMERO.** Este archivo es la fuente de verdad del proyecto. Antes de escribir cualquier línea de código, leer completo. Ante cualquier duda de arquitectura, volver aquí. No inventar patrones que no estén documentados.

---

## 🧠 Contexto del Negocio

**Problema:** Miles de fondos familiares, copropiedades y fondos de empleados en Colombia gestionan cobros, saldos y morosos en Excel + WhatsApp. No tienen software moderno, asequible ni adaptado a regulación colombiana.

**Solución:** Una plataforma SaaS multi-tenant que soporta tres verticales desde un solo codebase:

| tenant_type            | Mercado                                              | Quién paga                 |
| ---------------------- | ---------------------------------------------------- | -------------------------- |
| `fondo_familiar`       | Fondos de ahorro familiares informales               | Tesorero del fondo         |
| `propiedad_horizontal` | Conjuntos residenciales y comerciales (Ley 675/2001) | Administrador del conjunto |
| `fondo_empleados`      | Fondos de empleados supervisados por Supersolidaria  | Junta directiva del fondo  |

**Vertical activa para construcción:** `propiedad_horizontal` (PH). FondoApp (`fondo_familiar`) tiene schema base funcional. Se extiende, no se reescribe.

**Stack del proyecto Supabase:** `fondos` (AWS us-east-2) — ya restaurado.
**Supabase project ID:** `lavdttjhrnozboosgeub`

---

## 🎯 Principios de Diseño Irrompibles

**1. Un tenant nunca ve datos de otro.**
Toda query a Supabase pasa por RLS con `tenant_id`. Nunca hacer queries sin filtro de tenant. Nunca usar `service_role` key en el frontend.

**2. El estado financiero es inmutable una vez confirmado.**
Los pagos confirmados no se editan, se revierten con un movimiento opuesto. Nunca hacer UPDATE sobre registros de `pagos` o `movimientos` con estado `pagado`.

**3. La mora se calcula, no se guarda.**
El estado `moroso` de una unidad o miembro es siempre calculado en runtime comparando fecha de vencimiento vs. fecha actual. Nunca guardar `is_moroso: boolean` como campo estático.

**4. El residente ve su propio estado, no el de otros.**
El rol `residente` tiene acceso RLS solo a sus propias unidades, cuotas y reservas. Nunca exponer el listado general a este rol.

**5. Toda acción de cobro masivo requiere previsualización antes de ejecutar.**
El flujo de generación de cuotas mensuales siempre muestra un resumen ("Se generarán X cuotas por $Y") y espera confirmación explícita del admin antes de insertar registros.

---

## 🛠️ Stack Tecnológico

| Capa          | Tecnología                  | Razón                                                 |
| ------------- | --------------------------- | ----------------------------------------------------- |
| Frontend      | React + TypeScript (strict) | Stack establecido del proyecto                        |
| Estilos       | Tailwind CSS                | Stack establecido                                     |
| UI Components | shadcn/ui                   | Consistencia visual, accesibilidad                    |
| Backend       | Supabase (BaaS)             | Auth, DB, RLS, Storage, Edge Functions                |
| Base de datos | PostgreSQL (via Supabase)   | Relacional, triggers, RLS nativo                      |
| Pagos         | Wompi                       | Cobertura colombiana: PSE, Nequi, Daviplata, tarjetas |
| Facturación   | API DIAN (futura fase)      | Factura electrónica para cuotas de administración     |
| Deploy        | Vercel                      | CI/CD automático desde GitHub                         |
| Dev tool      | Lovable + Claude Code       | Lovable para UI, Claude Code para lógica compleja     |

---

## 📁 Estructura del Proyecto

```
fondoapp/
├── src/
│   ├── components/
│   │   ├── ui/                    # shadcn/ui base components
│   │   ├── shared/                # Componentes compartidos entre verticales
│   │   │   ├── TenantGuard.tsx    # Verifica tenant_type antes de renderizar
│   │   │   ├── MoraBadge.tsx      # Badge de estado mora (calculado)
│   │   │   └── MoneyDisplay.tsx   # Formateo COP consistente
│   │   ├── fondo/                 # Componentes exclusivos fondo_familiar
│   │   ├── ph/                    # Componentes exclusivos propiedad_horizontal
│   │   └── fondos-empleados/      # Componentes exclusivos fondo_empleados
│   ├── hooks/
│   │   ├── useTenant.ts           # Tenant actual + tenant_type
│   │   ├── useMiembros.ts         # CRUD miembros (compartido)
│   │   ├── usePagos.ts            # CRUD pagos (compartido)
│   │   ├── useMovimientos.ts      # CRUD movimientos (compartido)
│   │   ├── useUnidades.ts         # PH: unidades del conjunto
│   │   ├── useCuotasAdmin.ts      # PH: cuotas de administración
│   │   ├── useZonasComunes.ts     # PH: zonas comunes
│   │   ├── useReservas.ts         # PH: reservas de zonas
│   │   └── usePQR.ts              # PH: peticiones, quejas, reclamos
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── Login.tsx
│   │   │   └── Register.tsx       # Registro de nuevo tenant
│   │   ├── dashboard/
│   │   │   ├── DashboardFondo.tsx
│   │   │   └── DashboardPH.tsx    # Dashboard admin PH
│   │   ├── ph/
│   │   │   ├── Unidades.tsx       # Listado de unidades
│   │   │   ├── Cobros.tsx         # Gestión cuotas administración
│   │   │   ├── ZonasComunes.tsx   # Configuración zonas
│   │   │   ├── Reservas.tsx       # Calendario de reservas
│   │   │   ├── PQR.tsx            # Gestión PQR
│   │   │   ├── Presupuesto.tsx    # Presupuesto anual
│   │   │   └── Asamblea.tsx       # Gestión de asambleas
│   │   └── portal/
│   │       └── PortalResidente.tsx # Vista pública del residente
│   ├── lib/
│   │   ├── supabase.ts            # Cliente Supabase + tipos generados
│   │   ├── utils.ts               # formatCOP, formatDate, calcularMora
│   │   └── constants.ts           # Enums, configuración global
│   ├── types/
│   │   └── database.ts            # Tipos TypeScript del schema completo
│   └── router.tsx                 # Rutas con guards por tenant_type y rol
├── supabase/
│   ├── migrations/                # Migraciones SQL versionadas
│   └── functions/                 # Edge Functions
│       ├── generar-cuotas/        # Cobro masivo mensual PH
│       └── webhook-wompi/         # Webhook de pagos Wompi
├── public/
├── .env.local                     # VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
└── CLAUDE.md                      # Este archivo
```

---

## 💾 Schema de Base de Datos

### Tablas existentes (mantener, extender con cuidado)

```typescript
// ✅ EXISTENTE — agregar campo tenant_type
interface Tenant {
  id: string; // uuid PK
  nombre: string;
  tenant_type:
    | "fondo_familiar" // AGREGAR este campo
    | "propiedad_horizontal"
    | "fondo_empleados";
  created_at: string;
  // PH-specific (null para otros tipos)
  nit?: string; // NIT de la copropiedad
  matricula_inmobiliaria?: string;
  num_unidades?: number; // total de unidades del conjunto
  direccion?: string;
}

// ✅ EXISTENTE — compatible con PH sin cambios
interface Miembro {
  id: string; // uuid PK
  tenant_id: string; // FK → tenants
  nombre: string;
  email?: string;
  telefono?: string;
  estado: "activo" | "inactivo"; // mora se calcula, no se guarda aquí
  // PH: el miembro es el propietario de una o más unidades
  created_at: string;
}

// ✅ EXISTENTE — compatible con PH sin cambios
interface MovimientoFondo {
  id: string; // uuid PK
  tenant_id: string; // FK → tenants
  tipo: "ingreso" | "egreso";
  monto: number;
  descripcion: string;
  fecha: string; // date
  categoria?: string; // para PH: 'administracion' | 'mantenimiento' | etc.
  created_at: string;
}

// ✅ EXISTENTE — compatible con PH sin cambios
interface Pago {
  id: string; // uuid PK
  tenant_id: string; // FK → tenants
  miembro_id: string; // FK → miembros (propietario)
  monto: number;
  fecha: string; // date
  concepto: string;
  estado: "pendiente" | "pagado" | "vencido";
  // Agregar para PH:
  unidad_id?: string; // FK → unidades
  cuota_admin_id?: string; // FK → cuotas_administracion
  referencia_wompi?: string; // ID transacción Wompi
  created_at: string;
}

// ✅ EXISTENTE — solo para fondo_familiar y fondo_empleados
interface Prestamo {
  id: string;
  tenant_id: string;
  miembro_id: string;
  monto: number;
  tasa_interes: number;
  estado: "activo" | "cancelado" | "vencido";
  fecha_inicio: string;
  fecha_fin: string;
  created_at: string;
}

// ✅ EXISTENTE — solo para fondo_familiar y fondo_empleados
interface CuotaAmortizacion {
  id: string;
  prestamo_id: string;
  numero_cuota: number;
  monto: number;
  fecha_vencimiento: string;
  estado: "pendiente" | "pagado" | "vencido";
  fecha_pago?: string;
  created_at: string;
}
```

### Tablas nuevas — Vertical Propiedad Horizontal

```typescript
// 🆕 NUEVO — unidades del conjunto
interface Unidad {
  id: string; // uuid PK
  tenant_id: string; // FK → tenants
  miembro_id: string; // FK → miembros (propietario actual)
  numero: string; // "101", "201B", "P1-2"
  tipo: "apartamento" | "local_comercial" | "parqueadero" | "deposito";
  coeficiente: number; // % para cobro proporcional (suma total = 100)
  piso?: number;
  torre?: string;
  // mora calculada en runtime: cuotas vencidas sin pago
  created_at: string;
}

// 🆕 NUEVO — cuotas de administración por unidad
interface CuotaAdministracion {
  id: string; // uuid PK
  tenant_id: string; // FK → tenants
  unidad_id: string; // FK → unidades
  periodo: string; // date: primer día del mes "2025-06-01"
  monto: number; // calculado al generar: cuota_base * coeficiente
  estado: "pendiente" | "pagado" | "vencido";
  fecha_pago?: string;
  pago_id?: string; // FK → pagos (cuando se registra el pago)
  comprobante_url?: string;
  created_at: string;
}

// 🆕 NUEVO — zonas comunes configurables
interface ZonaComun {
  id: string; // uuid PK
  tenant_id: string; // FK → tenants
  nombre: string; // "Gimnasio", "Piscina", "Salón Social"
  capacidad_max: number;
  horario_apertura: string; // "06:00"
  horario_cierre: string; // "22:00"
  duracion_reserva_min: number; // minutos por reserva (ej: 60, 90, 120)
  activa: boolean;
  bloquear_en_mora: boolean; // si true, morosos no pueden reservar
  created_at: string;
}

// 🆕 NUEVO — reservas de zonas comunes
interface Reserva {
  id: string; // uuid PK
  tenant_id: string; // FK → tenants
  zona_id: string; // FK → zonas_comunes
  unidad_id: string; // FK → unidades
  miembro_id: string; // FK → miembros
  fecha: string; // date
  hora_inicio: string; // "14:00"
  hora_fin: string; // "16:00"
  estado: "confirmada" | "cancelada";
  cancelacion_motivo?: string;
  created_at: string;
}

// 🆕 NUEVO — PQR
interface PQR {
  id: string; // uuid PK
  tenant_id: string; // FK → tenants
  unidad_id: string; // FK → unidades
  miembro_id: string; // FK → miembros
  tipo: "peticion" | "queja" | "reclamo";
  asunto: string;
  descripcion: string;
  estado: "abierto" | "en_gestion" | "cerrado";
  respuesta?: string;
  fecha_cierre?: string;
  created_at: string;
}

// 🆕 NUEVO — presupuesto anual PH
interface PresupuestoPH {
  id: string; // uuid PK
  tenant_id: string; // FK → tenants
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

// 🆕 NUEVO — asambleas
interface Asamblea {
  id: string; // uuid PK
  tenant_id: string; // FK → tenants
  tipo: "ordinaria" | "extraordinaria";
  fecha: string; // timestamp
  lugar: string;
  orden_del_dia: string[];
  quorum_requerido: number; // porcentaje: 50.01
  quorum_alcanzado?: number;
  acta_url?: string;
  estado: "convocada" | "realizada" | "cancelada";
  created_at: string;
}
```

### Roles y RLS

Los roles varían por `tenant_type`. **Nunca mezclar roles de verticales distintas.**

**Vertical `propiedad_horizontal`:**
| Rol | Quién es | Qué puede hacer |
|---|---|---|
| `admin_ph` | Administrador del conjunto | Todo: cobros, unidades, PQR, zonas, presupuesto, asambleas |
| `propietario` | Dueño de una unidad | Portal: ver estado de cuenta, reservar, crear PQR |
| `residente` | Arrendatario (no dueño) | Portal: reservar, crear PQR — sin acceso a estado de cuenta financiero |

**Vertical `fondo_familiar`:**
| Rol | Quién es |
|---|---|
| `admin_fondo` | Tesorero / administrador del fondo |
| `miembro` | Asociado del fondo |

> ⚠️ No crear rol `tesorero` separado en PH — en copropiedades colombianas el administrador maneja la tesorería. No es un rol diferenciado en software.

```sql
-- Roles activos por vertical:
-- PH:    'admin_ph' | 'propietario' | 'residente'
-- Fondo: 'admin_fondo' | 'miembro'

-- Ejemplo de política RLS para unidades (PH):
-- CREATE POLICY "admin_ph ve todas las unidades de su tenant"
-- ON unidades FOR SELECT
-- USING (tenant_id = (SELECT tenant_id FROM miembros WHERE user_id = auth.uid() LIMIT 1)
--        AND (SELECT rol FROM miembros WHERE user_id = auth.uid() LIMIT 1) = 'admin_ph');

-- CREATE POLICY "propietario y residente ven solo sus unidades"
-- ON unidades FOR SELECT
-- USING (miembro_id = (SELECT id FROM miembros WHERE user_id = auth.uid() LIMIT 1)
--        AND (SELECT rol FROM miembros WHERE user_id = auth.uid() LIMIT 1) IN ('propietario', 'residente'));
```

---

## 🔄 Flujos de Negocio Críticos

### Flujo 1: Generación de cobro masivo mensual (PH)

```
1. Admin selecciona período (mes/año) en pantalla de Cobros
2. Sistema consulta todas las unidades activas del tenant
3. Sistema calcula monto por unidad: cuota_base_mes × coeficiente_unidad
4. Sistema muestra previsualización:
   "Se generarán 48 cuotas por un total de $12.480.000 COP para junio 2025"
5. Admin confirma
6. Edge Function inserta registros en cuotas_administracion con estado 'pendiente'
7. Idempotencia: si ya existen cuotas para ese período+tenant, retorna error claro
8. Sistema envía notificación por email/WhatsApp a propietarios (fase futura)
```

### Flujo 2: Registro de pago de cuota (PH)

```
1. Admin busca unidad o propietario
2. Selecciona cuota(s) pendiente(s) a pagar
3. Registra: fecha pago, monto, medio de pago, sube comprobante (Storage)
4. Sistema inserta en tabla pagos con referencia a cuota_admin_id
5. UPDATE cuotas_administracion SET estado='pagado', fecha_pago=..., pago_id=...
6. INSERT en movimientos_fondo tipo='ingreso' con misma fecha y monto
7. Recalcular estado de mora de la unidad en runtime
```

### Flujo 3: Reserva de zona común (residente)

```
1. Residente entra al portal con su cuenta
2. Selecciona zona común
3. Sistema verifica: ¿tiene cuotas vencidas? → si sí y zona tiene bloquear_en_mora=true → error
4. Residente selecciona fecha y franja horaria disponible
5. Sistema verifica que no exista reserva_confirmada en esa zona+fecha+hora
6. Sistema inserta reserva con estado='confirmada'
7. Residente recibe confirmación en pantalla
```

### Flujo 4: Apertura y cierre de PQR

```
1. Residente crea PQR desde portal: tipo + asunto + descripción
2. Estado inicial: 'abierto'
3. Admin ve PQR en su panel, cambia estado a 'en_gestion', agrega respuesta parcial
4. Admin cierra PQR: agrega respuesta final, estado → 'cerrado', fecha_cierre = NOW()
5. Residente puede ver el histórico de sus PQR con respuestas
```

### Flujo 5: Onboarding de nuevo conjunto PH

```
1. Admin se registra: nombre, email, clave
2. Crea tenant con tenant_type='propiedad_horizontal'
3. Wizard paso 1: datos del conjunto (nombre, dirección, NIT)
4. Wizard paso 2: configurar cuota base mensual
5. Wizard paso 3: cargar unidades (formulario individual o importar CSV)
6. Wizard paso 4: asociar propietario a cada unidad (invitar por email o crear manual)
7. Wizard paso 5: configurar zonas comunes
8. Dashboard queda activo — primer cobro masivo puede ejecutarse
```

---

## 🎨 Sistema de Diseño

```css
/* Variables globales — /src/index.css */
:root {
  /* Primario: azul corporativo, confianza, finanzas */
  --color-primary: #1e40af;
  --color-primary-light: #3b82f6;
  --color-primary-dark: #1e3a8a;

  /* Acento: verde, estado saludable */
  --color-success: #16a34a;
  --color-success-bg: #dcfce7;

  /* Mora: rojo claro, alerta sin alarmar */
  --color-danger: #dc2626;
  --color-danger-bg: #fee2e2;

  /* Advertencia */
  --color-warning: #d97706;
  --color-warning-bg: #fef3c7;

  /* Neutros */
  --color-bg: #f8fafc;
  --color-surface: #ffffff;
  --color-border: #e2e8f0;
  --color-text: #0f172a;
  --color-text-muted: #64748b;

  /* Tipografía */
  --font-display: "Inter", sans-serif;
  --font-body: "Inter", sans-serif;
  --font-mono: "JetBrains Mono", monospace; /* para montos en COP */

  /* Espaciado base */
  --radius: 8px;
}
```

**Reglas de formato de moneda:**

```typescript
// Siempre usar esta función, nunca formatear COP manualmente
export const formatCOP = (amount: number): string =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount);
// → "$1.250.000"
```

**Reglas de touch (portal residente es mobile-first):**

- Botones mínimo: `h-12` (48px) en el portal del residente
- Texto mínimo: `text-base` (16px) en el portal del residente
- El panel admin puede usar `text-sm` y elementos más densos

---

## 📦 Seed Data

Para que el sistema sea útil desde el día 1 en un nuevo tenant PH:

```typescript
// Zonas comunes default (se pueden editar o eliminar)
const zonasDefault = [
  {
    nombre: "Gimnasio",
    capacidad_max: 10,
    horario_apertura: "05:00",
    horario_cierre: "22:00",
    duracion_reserva_min: 60,
  },
  {
    nombre: "Piscina",
    capacidad_max: 20,
    horario_apertura: "07:00",
    horario_cierre: "20:00",
    duracion_reserva_min: 60,
  },
  {
    nombre: "Salón Social",
    capacidad_max: 50,
    horario_apertura: "08:00",
    horario_cierre: "23:00",
    duracion_reserva_min: 120,
  },
];

// Categorías de presupuesto default
const categoriasPresupuesto = [
  "Administración",
  "Mantenimiento",
  "Seguridad",
  "Servicios públicos zonas comunes",
  "Fondo de reserva",
];
```

Insertar automáticamente en `onboarding_complete` event del wizard.

---

## 🖥️ Pantallas y Navegación

### Panel Admin PH

```
┌─────────────────────────────────────────────────┐
│  Logo  [Nombre Conjunto]           [Admin ▾]    │
├──────────┬──────────────────────────────────────┤
│ Dashboard│  KPIs: Recaudo mes / Morosos /        │
│ Unidades │  Reservas hoy / PQR abiertos          │
│ Cobros   │                                       │
│ Zonas    │  [Gráfica recaudo últimos 6 meses]    │
│ PQR      │                                       │
│ Presup.  │  [Tabla últimos pagos registrados]    │
│ Asamblea │                                       │
│ Config   │                                       │
└──────────┴──────────────────────────────────────┘
```

### Portal Residente (mobile-first)

```
┌─────────────────────┐
│  [Logo]  Apto 401   │
├─────────────────────┤
│  Estado de cuenta   │
│  ✅ Al día          │
│  Junio 2025: $280k  │
│  [Ver historial]    │
├─────────────────────┤
│  Reservar zona      │
│  [Gimnasio ▾]       │
│  [Fecha] [Hora]     │
│  [Confirmar]        │
├─────────────────────┤
│  Mis PQR            │
│  #003 En gestión    │
│  [Nueva PQR]        │
└─────────────────────┘
```

---

## 🚀 Orden de Construcción para Claude Code

### Fase 0 — Setup (1 día)

- [x] ~~Agregar campo `tenant_type` a tabla `tenants` existente~~ ✅ Ya existe (`default 'fondo_familiar'`)
- [x] ~~Agregar campos opcionales a `pagos` (`unidad_id`, `cuota_admin_id`, `referencia_wompi`)~~ ✅ Ya existen
- [x] ~~Agregar campo `categoria` a `movimientos_fondo`~~ ✅ Ya existe
- [ ] Actualizar plan Supabase `fondos` a Pro (evitar pausa)
- [ ] Generar tipos TypeScript desde Supabase CLI: `npx supabase gen types typescript --project-id lavdttjhrnozboosgeub > src/types/database.ts`
- [ ] **Criterio de éxito:** tipos generados sin errores, schema existente intacto

### Fase 1 — Schema PH + RLS (2 días)

- [ ] Crear migración SQL con tablas: `unidades`, `cuotas_administracion`, `zonas_comunes`, `reservas`, `pqr`, `presupuesto_ph`, `asambleas`
- [ ] Escribir políticas RLS para roles PH: `admin_ph`, `propietario`, `residente`
- [ ] Seed data de zonas comunes default
- [ ] **Criterio de éxito:** un admin puede ver sus unidades, un residente solo las suyas. Test en SQL Editor.

### Fase 2 — Wizard de Onboarding PH (2 días)

- [ ] Pantalla de registro → crea tenant con `tenant_type: 'propiedad_horizontal'`
- [ ] Wizard 5 pasos: datos conjunto → cuota base → cargar unidades → asociar propietarios → zonas comunes
- [ ] Al completar wizard: seed de zonas por defecto, redirigir a dashboard
- [ ] **Criterio de éxito:** desde cero hasta dashboard funcional en menos de 10 minutos

### Fase 3 — Módulo de Cobros (3 días)

- [ ] Pantalla Unidades: listado con estado mora calculado, filtros por torre/tipo
- [ ] Pantalla Cobros: generación masiva con previsualización + confirmación
- [ ] Registro manual de pago (con subida de comprobante a Supabase Storage)
- [ ] Vista de estado de cuenta por unidad
- [ ] Edge Function `generar-cuotas` (idempotente)
- [ ] **Criterio de éxito:** generar cuotas de un conjunto de prueba, registrar un pago, ver el movimiento en el fondo

### Fase 4 — Zonas Comunes y Reservas (2 días)

- [ ] CRUD de zonas comunes en panel admin
- [ ] Calendario de reservas (semana actual) con disponibilidad en tiempo real
- [ ] Validación de mora al intentar reservar
- [ ] Portal básico del residente: ver cuotas + hacer reservas
- [ ] **Criterio de éxito:** residente moroso no puede reservar, residente al día sí puede

### Fase 5 — PQR y Presupuesto (2 días)

- [ ] Módulo PQR completo: crear, gestionar, cerrar con respuesta
- [ ] Módulo Presupuesto: cargar presupuesto anual, ver ejecución vs. presupuestado
- [ ] **Criterio de éxito:** PQR creada por residente aparece en panel admin con estado visible

### Fase 6 — Integraciones (3 días)

- [ ] Wompi: link de pago por cuota (pago online desde portal residente)
- [ ] Webhook Wompi → actualizar cuota a `pagado` automáticamente
- [ ] **Criterio de éxito:** residente paga online, estado cambia sin intervención del admin

### Fase 7 — Pulido y Deploy

- [ ] Responsive final, dark mode opcional
- [ ] Deploy en Vercel con dominio custom
- [ ] Variables de entorno en producción
- [ ] **Criterio de éxito:** funciona en Chrome mobile sin errores de consola

---

## 🚨 Reglas de Código

### SIEMPRE:

- Usar TypeScript strict. Cero `any`. Si no sabes el tipo, definirlo.
- Todo acceso a Supabase desde hooks (`/src/hooks/`), nunca directo en componentes.
- Formatear moneda con `formatCOP()` de `lib/utils.ts`.
- Filtrar por `tenant_id` en toda query. Sin excepción.
- Usar `loading` + `error` state en todos los hooks de data fetching.
- Escribir migraciones SQL en `/supabase/migrations/` con nombre versionado: `20250601_add_unidades_ph.sql`

### NUNCA:

- Usar `supabase.auth.admin` ni `service_role` key en el frontend.
- Hacer UPDATE a un pago con estado `pagado`.
- Guardar estado de mora como campo en BD (siempre calcular).
- Hacer queries sin filtro de `tenant_id`.
- Instalar librerías de UI alternativas a shadcn/ui (Chakra, MUI, etc.).
- Crear componentes de más de 200 líneas sin dividir.
- Saltarse el wizard de onboarding para crear un tenant "de atajo".

---

## 📋 Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Arrancar en desarrollo
npm run dev

# Generar tipos de Supabase (correr tras cada migración)
npx supabase gen types typescript --project-id <project-id> > src/types/database.ts

# Aplicar migración local
npx supabase db push

# Build producción
npm run build
```

---

## 🔮 Roadmap Futuro (no construir ahora)

| Feature                              | Vertical | Por qué esperar                                  |
| ------------------------------------ | -------- | ------------------------------------------------ |
| Facturación electrónica DIAN         | PH       | Requiere RUT del conjunto + proveedor habilitado |
| App móvil nativa (React Native)      | Todas    | Primero validar retención en web                 |
| Notificaciones push / WhatsApp       | PH       | Integrar tras tener primeros 5 clientes pagando  |
| Vertical `fondo_empleados`           | Nueva    | Arrancar tras PH estable con 3+ tenants          |
| Asamblea virtual (votaciones online) | PH       | Complejidad legal, fase tardía                   |
| Importar CSV de unidades             | PH       | Nice-to-have, el wizard manual alcanza para MVP  |
| Multi-idioma                         | Todas    | No relevante en mercado colombiano por ahora     |

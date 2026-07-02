# CoproAdmin

SaaS multi-tenant para la gestión de copropiedades (propiedad horizontal) en Colombia. Centraliza cobros de administración, morosidad, reservas de zonas comunes, PQR, presupuesto anual y cumplimiento de la Ley 675 de 2001, con un portal para residentes.

- **Cliente que paga:** administrador profesional del conjunto o junta directiva.
- **Usuario secundario:** propietario/residente (portal: estado de cuenta, reservas, PQR).
- **Mercado:** Colombia (diferenciador: cumplimiento Ley 675 de 2001 y Ley 1581 de protección de datos).

## Stack

| Capa | Tecnología |
| --- | --- |
| Frontend | React 18 + TypeScript + Vite |
| Estilos | Tailwind CSS + shadcn/ui |
| Estado/fetching | @tanstack/react-query v5 |
| Backend | Supabase (Postgres, Auth, RLS, Storage, Edge Functions) |
| Pagos | Wompi (PSE, Nequi, tarjetas) |
| Deploy | Vercel |

## Requisitos

- Node 18+ y npm
- Un proyecto Supabase (URL + anon key)

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # completar con los valores reales
npm run dev                  # http://localhost:8080
```

### Variables de entorno (`.env.local`)

```
VITE_SUPABASE_URL=            # URL del proyecto Supabase
VITE_SUPABASE_ANON_KEY=       # anon/public key (nunca la service_role)
VITE_WOMPI_PUBLIC_KEY=        # llave pública de Wompi (pagos online)
```

> La `service_role` key y los secretos de Wompi/Resend viven **solo** como secrets de las Edge Functions en Supabase, nunca en el frontend.

## Scripts

```bash
npm run dev      # servidor de desarrollo (puerto 8080)
npm run build    # build de producción
npm run lint     # ESLint
npm run test     # Vitest
```

## Base de datos y migraciones

Las migraciones viven en [`supabase/migrations/`](supabase/migrations/) (formato `0NN_nombre.sql`).

> ⚠️ **Flujo actual:** las migraciones se aplican **manualmente en el SQL Editor** de Supabase y se registran en `supabase_migrations.schema_migrations`. **No** correr `supabase db push` sin antes revisar la sección "Adopción del CLI" en [`CLAUDE.md`](CLAUDE.md). El proyecto ya está configurado (`supabase/config.toml`) para migrar a `db pull`/`db push` cuando se decida.

Regenerar tipos tras un cambio de schema:

```bash
npx supabase gen types typescript --project-id <PROJECT_ID> > src/types/database.ts
```

## Documentación

La fuente de verdad del proyecto (arquitectura, schema, flujos de negocio, reglas y estado por fases) está en [`CLAUDE.md`](CLAUDE.md).

## Deploy

CI/CD automático desde GitHub a Vercel. `vercel.json` define el build (Vite) y las cabeceras de seguridad. Los secrets de Edge Functions se configuran con `supabase secrets set`.

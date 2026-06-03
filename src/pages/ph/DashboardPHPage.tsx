import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useUnidades } from '@/hooks/useUnidades'
import { useCuotasAdmin, type CuotaAdmin } from '@/hooks/useCuotasAdmin'
import { usePQR } from '@/hooks/usePQR'
import { useTenant } from '@/hooks/useTenant'
import { useReservas } from '@/hooks/useReservas'
import { useObligaciones, ETIQUETAS_OBLIGACION, type Obligacion } from '@/hooks/useObligaciones'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Home, ClipboardList, ShieldCheck } from 'lucide-react'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n)

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const _today = new Date()
const currentPeriod = _today.toISOString().slice(0, 7)
const todayStr = _today.toISOString().slice(0, 10)

function greet() {
  const h = _today.getHours()
  return h < 12 ? 'Buenos días' : h < 18 ? 'Buenas tardes' : 'Buenas noches'
}

function getLast6Periods(): string[] {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(_today.getFullYear(), _today.getMonth() - (5 - i), 1)
    return d.toISOString().slice(0, 7)
  })
}

// --- KPICard ---
interface KPIProps {
  title: string; value: string | number; sub?: string
  progress?: number; accent?: string; delay: number
}
function KPICard({ title, value, sub, progress, accent = '', delay }: KPIProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${accent}`}>{value}</div>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          {progress !== undefined && (
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progress, 100)}%` }}
                transition={{ delay: delay + 0.3, duration: 0.8 }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// --- RecaudoChart ---
function RecaudoChart({ cuotasAll }: { cuotasAll: CuotaAdmin[] }) {
  const data = getLast6Periods().map(p => {
    const mes = MESES[parseInt(p.slice(5, 7)) - 1] + ' \'' + p.slice(2, 4)
    const del = cuotasAll.filter(c => c.periodo === p)
    return {
      mes,
      Esperado: del.reduce((s, c) => s + c.monto, 0),
      Recaudado: del.filter(c => c.estado === 'pagado').reduce((s, c) => s + c.monto, 0),
    }
  })
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Recaudo últimos 6 meses</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
            <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${((v as number) / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: unknown) => fmt(v as number)} />
            <Bar dataKey="Esperado" fill="#93c5fd" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Recaudado" fill="#2563eb" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// --- UltimosPagos ---
function UltimosPagos({ cuotasAll }: { cuotasAll: CuotaAdmin[] }) {
  const pagos = [...cuotasAll]
    .filter(c => c.estado === 'pagado' && c.fecha_pago)
    .sort((a, b) => (b.fecha_pago ?? '').localeCompare(a.fecha_pago ?? ''))
    .slice(0, 5)
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Últimos pagos</CardTitle>
      </CardHeader>
      <CardContent>
        {pagos.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay pagos registrados aún</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs border-b">
                <th className="text-left pb-1 font-medium">Unidad</th>
                <th className="text-right pb-1 font-medium">Monto</th>
                <th className="text-right pb-1 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {pagos.map(p => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="py-1.5">{p.unidades?.numero ?? '—'}</td>
                  <td className="py-1.5 text-right">{fmt(p.monto)}</td>
                  <td className="py-1.5 text-right text-muted-foreground">{p.fecha_pago?.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  )
}

// --- ComplianceSemaforo ---
const ESTADO_ORDER = { vencido: 0, proximo: 1, al_dia: 2 } as const

function dotColor(estado: Obligacion['estado']) {
  if (estado === 'vencido') return 'bg-red-500'
  if (estado === 'proximo') return 'bg-yellow-400'
  return 'bg-green-500'
}
function textColor(estado: Obligacion['estado']) {
  if (estado === 'vencido') return 'text-red-700'
  if (estado === 'proximo') return 'text-yellow-700'
  return 'text-green-700'
}
function rowBg(estado: Obligacion['estado']) {
  if (estado === 'vencido') return 'bg-red-50 border-red-200'
  if (estado === 'proximo') return 'bg-yellow-50 border-yellow-200'
  return 'bg-green-50 border-green-200'
}
function diasLabel(o: Obligacion) {
  if (o.diasRestantes === null) return null
  if (o.diasRestantes < 0) return `Venció hace ${Math.abs(o.diasRestantes)} días`
  if (o.diasRestantes === 0) return 'Vence hoy'
  return `Vence en ${o.diasRestantes} días`
}

function ComplianceSemaforo() {
  const { data: obligaciones = [], isLoading } = useObligaciones()

  if (isLoading || obligaciones.length === 0) return null

  const sorted = [...obligaciones].sort((a, b) => {
    const diff = ESTADO_ORDER[a.estado] - ESTADO_ORDER[b.estado]
    if (diff !== 0) return diff
    if (a.diasRestantes !== null && b.diasRestantes !== null) return a.diasRestantes - b.diasRestantes
    return 0
  })

  const urgentes = sorted.filter(o => o.estado !== 'al_dia').slice(0, 3)

  if (urgentes.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
        className="flex items-center justify-between px-4 py-3 rounded-lg border bg-green-50 border-green-200"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-green-600 shrink-0" />
          <span className="text-sm font-medium text-green-700">
            Cumplimiento legal al día — {obligaciones.length} obligaciones verificadas
          </span>
        </div>
        <Link to="/cumplimiento" className="text-xs text-green-600 hover:underline font-medium shrink-0 inline-flex items-center min-h-[48px] px-2">
          Ver detalle →
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Semáforo de cumplimiento legal
            </CardTitle>
            <Link to="/cumplimiento" className="text-xs text-primary hover:underline font-medium inline-flex items-center min-h-[48px] px-2">
              Ver todas →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {urgentes.map(o => (
              <div key={o.id} className={`flex items-center justify-between px-3 py-2 rounded-md border ${rowBg(o.estado)}`}>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full shrink-0 ${dotColor(o.estado)}`} />
                  <span className="text-sm font-medium">{ETIQUETAS_OBLIGACION[o.tipo]}</span>
                </div>
                {diasLabel(o) && (
                  <span className={`text-xs font-medium ${textColor(o.estado)}`}>{diasLabel(o)}</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// --- AccesosRapidos ---
const accesos = [
  { to: '/cobros', icon: TrendingUp, label: 'Generar cuotas del mes' },
  { to: '/unidades', icon: Home, label: 'Nueva unidad' },
  { to: '/pqr', icon: ClipboardList, label: 'Ver PQR abiertos' },
]
function AccesosRapidos() {
  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
      {accesos.map(({ to, icon: Icon, label }, i) => (
        <motion.div key={to} whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
          <Link to={to}>
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardContent className="flex flex-col items-center justify-center gap-2 py-6">
                <Icon className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium text-center">{label}</span>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}

// --- Dashboard principal ---
export default function DashboardPHPage() {
  const { data: unidades = [] } = useUnidades()
  const { data: cuotasAll = [] } = useCuotasAdmin()
  const { data: pqrs = [] } = usePQR()
  const { data: tenant } = useTenant()
  const { data: reservasHoy = [] } = useReservas(todayStr)

  const cuotasMes = cuotasAll.filter(c => c.periodo === currentPeriod)
  const totalEsperado = cuotasMes.reduce((s, c) => s + c.monto, 0)
  const totalPagado = cuotasMes.filter(c => c.estado === 'pagado').reduce((s, c) => s + c.monto, 0)
  const progress = totalEsperado > 0 ? (totalPagado / totalEsperado) * 100 : 0
  const enMora = new Set(cuotasMes.filter(c => c.estado === 'vencido').map(c => c.unidad_id)).size
  const unidadesEnMora = new Set(cuotasAll.filter(c => c.estado === 'vencido').map(c => c.unidad_id)).size
  const pqrAbiertos = pqrs.filter(p => p.estado === 'abierto' || p.estado === 'en_gestion').length
  const reservasCount = reservasHoy.filter(r => r.estado === 'confirmada').length

  const _fecha = _today.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toLowerCase()
  const fechaFormateada = _fecha.charAt(0).toUpperCase() + _fecha.slice(1)
  const _periodo = _today.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }).toLowerCase()
  const periodoLabel = _periodo.charAt(0).toUpperCase() + _periodo.slice(1)

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <p className="text-sm text-muted-foreground">{fechaFormateada}</p>
          <h1 className="text-2xl font-bold tracking-tight">{greet()}, {tenant?.nombre ?? 'Conjunto'}</h1>
        </div>
        <Badge variant="secondary" className="w-fit">{periodoLabel}</Badge>
      </motion.div>

      {unidadesEnMora > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded-md shadow-sm"
        >
          <div className="flex items-center justify-between">
            <p className="font-medium">
              ⚠️ Hay {unidadesEnMora} unidades con cuotas vencidas.
            </p>
            <Link to="/unidades" className="text-sm font-semibold hover:underline inline-flex items-center min-h-[48px] px-2">
              Ver unidades en mora →
            </Link>
          </div>
        </motion.div>
      )}

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Recaudo del mes" value={fmt(totalPagado)}
          sub={`de ${fmt(totalEsperado)} · ${Math.round(progress)}%`}
          progress={progress} delay={0.1}
        />
        <KPICard
          title="Unidades en mora" value={enMora}
          sub={`de ${unidades.length} unidades`}
          accent={enMora > 0 ? 'text-red-500' : ''} delay={0.2}
        />
        <KPICard
          title="PQR abiertos" value={pqrAbiertos}
          accent={pqrAbiertos > 0 ? 'text-yellow-500' : 'text-green-500'} delay={0.3}
        />
        <KPICard title="Reservas hoy" value={reservasCount} delay={0.4} />
      </div>

      <ComplianceSemaforo />

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3"><RecaudoChart cuotasAll={cuotasAll} /></div>
        <div className="lg:col-span-2"><UltimosPagos cuotasAll={cuotasAll} /></div>
      </div>

      <AccesosRapidos />
    </div>
  )
}

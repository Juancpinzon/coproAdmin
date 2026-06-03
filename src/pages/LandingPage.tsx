import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useInView,
  useMotionValue,
  animate,
} from 'framer-motion'
import { useRef, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  Receipt,
  Calendar,
  MessageSquare,
  BarChart3,
  PiggyBank,
  ShieldCheck,
  CheckCircle2,
  ArrowDown,
  Star,
  Briefcase,
  Users,
  Home,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// ─── Config ───────────────────────────────────────────────────────────────────

// TODO: reemplazar con número real antes de deploy
const WA_DEMO_HREF =
  'https://wa.me/573000000000?text=Hola%2C%20quiero%20conocer%20CoproAdmin%20para%20mi%20conjunto'

// ─── NavBar ───────────────────────────────────────────────────────────────────

const NavBar = () => (
  <motion.nav
    className="fixed top-0 w-full z-50 backdrop-blur-md bg-white/80 border-b border-slate-100"
    initial={{ y: -100, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ duration: 0.6, ease: 'easeOut' }}
  >
    <div className="container mx-auto px-4 h-16 flex items-center justify-between">
      <motion.div
        className="flex items-center gap-2 cursor-pointer"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
          <span className="text-white font-bold text-lg">C</span>
        </div>
        <span className="text-xl font-bold text-blue-600">CoproAdmin</span>
      </motion.div>
      <div className="flex items-center gap-4">
        <Link
          to="/login"
          className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors relative group"
        >
          Iniciar sesión
          <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full" />
        </Link>
        <Link to="/registro">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">Comenzar gratis</Button>
          </motion.div>
        </Link>
      </div>
    </div>
  </motion.nav>
)

// ─── HeroSection ──────────────────────────────────────────────────────────────

const heroWords1 = ['Administra', 'tu', 'conjunto']
const heroWords2 = ['sin', 'Excel', 'ni', 'WhatsApp']

const staggerContainer = (delay = 0) => ({
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: delay } },
})

const wordFadeUp = {
  hidden: { y: 40, opacity: 0, filter: 'blur(8px)' },
  visible: {
    y: 0,
    opacity: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

const HeroSection = () => {
  const containerRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '25%'])

  const particles = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        yPos: Math.random() * 100,
        size: Math.random() * 4 + 2,
        duration: Math.random() * 3 + 3,
        delay: Math.random() * 2,
      })),
    []
  )

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 overflow-hidden pt-16"
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-blue-400/20 pointer-events-none"
          style={{ left: `${p.x}%`, top: `${p.yPos}%`, width: p.size, height: p.size }}
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}

      <motion.div className="relative z-10 container mx-auto px-4 text-center" style={{ y }}>
        <motion.div
          className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-2 mb-8 text-blue-200 text-sm font-medium"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
        >
          Diseñado para conjuntos colombianos · Ley 675
        </motion.div>

        <motion.h1
          className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-2"
          variants={staggerContainer(0.3)}
          initial="hidden"
          animate="visible"
        >
          {heroWords1.map((w) => (
            <motion.span key={w} variants={wordFadeUp} className="inline-block mr-3 md:mr-4">
              {w}
            </motion.span>
          ))}
        </motion.h1>

        <motion.h1
          className="text-4xl md:text-6xl font-extrabold tracking-tight mb-8"
          variants={staggerContainer(0.7)}
          initial="hidden"
          animate="visible"
        >
          {heroWords2.map((w, i) => (
            <motion.span
              key={w}
              variants={wordFadeUp}
              className={`inline-block mr-3 md:mr-4 ${i === 0 ? 'text-white' : 'text-blue-400'}`}
            >
              {w}
            </motion.span>
          ))}
        </motion.h1>

        <motion.p
          className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          Cobros automáticos, portal para residentes, PQR digital y cumplimiento de la Ley 675
          de 2001. Todo en una plataforma, sin Excel ni WhatsApp.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.6 }}
        >
          <Link to="/registro">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                className="h-14 px-8 text-lg bg-blue-500 hover:bg-blue-400 text-white shadow-lg shadow-blue-500/30"
              >
                Comenzar gratis
              </Button>
            </motion.div>
          </Link>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-8 text-lg border-white/30 text-white hover:bg-white/10 hover:text-white bg-transparent"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Ver características
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          className="mt-20 flex flex-col items-center text-slate-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.9 }}
        >
          <span className="text-xs mb-2 uppercase tracking-widest">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ArrowDown className="w-5 h-5" />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  )
}

// ─── StatsBar ─────────────────────────────────────────────────────────────────

const statItems = ['Ley 675 de 2001 cubierta', 'Cobros y mora en tiempo real', 'Portal web para residentes']

const StatsBar = () => (
  <section className="bg-blue-600 py-10 px-4">
    <div className="container mx-auto max-w-4xl">
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-blue-500">
        {statItems.map((item) => (
          <div key={item} className="flex-1 text-center py-3 md:py-0">
            <span className="text-white font-semibold text-lg">{item}</span>
          </div>
        ))}
      </div>
    </div>
  </section>
)

// ─── FeaturesSection ──────────────────────────────────────────────────────────

interface Feature {
  Icon: LucideIcon
  color: string
  title: string
  desc: string
}

const features: Feature[] = [
  {
    Icon: Receipt,
    color: 'bg-blue-100 text-blue-600',
    title: 'Cobros automáticos',
    desc: 'Genera cuotas de administración masivamente y mantén el estado de cuenta actualizado al instante.',
  },
  {
    Icon: Calendar,
    color: 'bg-purple-100 text-purple-600',
    title: 'Reservas de zonas',
    desc: 'Permite a los residentes reservar zonas comunes online. Bloqueo automático para morosos.',
  },
  {
    Icon: MessageSquare,
    color: 'bg-green-100 text-green-600',
    title: 'PQR digital',
    desc: 'Gestiona peticiones, quejas y reclamos de manera organizada con seguimiento e historial.',
  },
  {
    Icon: PiggyBank,
    color: 'bg-pink-100 text-pink-600',
    title: 'Control de pagos',
    desc: 'Registra y visualiza los pagos de administración de cada unidad con total transparencia.',
  },
  {
    Icon: BarChart3,
    color: 'bg-amber-100 text-amber-600',
    title: 'Presupuesto anual',
    desc: 'Planifica los gastos del año por categoría y controla la ejecución presupuestal mes a mes.',
  },
  {
    Icon: ShieldCheck,
    color: 'bg-teal-100 text-teal-600',
    title: 'Ley 675 integrada',
    desc: 'Controla asambleas, reglamento, seguros y rendición de cuentas desde un solo panel.',
  },
]

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

const FeaturesSection = () => {
  const titleRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const titleInView = useInView(titleRef, { once: true, margin: '-100px' })
  const gridInView = useInView(gridRef, { once: true, margin: '-100px' })

  return (
    <section id="features" className="py-24 bg-white px-4">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          ref={titleRef}
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={titleInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Todo lo que necesitas en un solo lugar
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Soluciones para conjuntos residenciales colombianos.
          </p>
        </motion.div>

        <motion.div
          ref={gridRef}
          className="grid md:grid-cols-3 gap-6"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
          initial="hidden"
          animate={gridInView ? 'visible' : 'hidden'}
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={cardVariants}
              whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
              className="bg-white border border-slate-100 rounded-2xl p-6 cursor-default relative overflow-hidden group shadow-sm"
            >
              <div className="absolute left-0 top-0 w-1 h-full bg-blue-600 scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top rounded-l-2xl" />
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                <f.Icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">{f.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ─── ForWhomSection ───────────────────────────────────────────────────────────

const profiles = [
  {
    Icon: Briefcase,
    color: 'bg-blue-100 text-blue-600',
    title: 'Administrador profesional',
    lines: [
      'Gestiona varios conjuntos desde una sola plataforma.',
      'Estado de mora, cobros y PQR sin perder el hilo.',
    ],
  },
  {
    Icon: Users,
    color: 'bg-purple-100 text-purple-600',
    title: 'Junta directiva',
    lines: [
      'Visibilidad completa sobre recaudos, presupuesto y cumplimiento legal.',
      'Sin esperar reportes en Excel que llegan tarde.',
    ],
  },
  {
    Icon: Home,
    color: 'bg-green-100 text-green-600',
    title: 'Conjunto sin administrador externo',
    lines: [
      'Administra tu conjunto tú mismo en menos de 20 minutos.',
      'Wizard de configuración guiado, sin conocimientos contables.',
    ],
  },
]

const ForWhomSection = () => {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="py-24 bg-slate-50 px-4">
      <div className="container mx-auto max-w-5xl">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            ¿Para quién es CoproAdmin?
          </h2>
          <p className="text-slate-500 text-lg">Para quien administra. Para quien supervisa. Para quien vive ahí.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {profiles.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${p.color}`}>
                <p.Icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-3">{p.title}</h3>
              <ul className="space-y-2">
                {p.lines.map((line) => (
                  <li key={line} className="flex items-start gap-2 text-sm text-slate-500">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    {line}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── HowItWorksSection ────────────────────────────────────────────────────────

const steps = [
  { n: 1, title: 'Crea tu cuenta', desc: 'Regístrate en minutos, sin tarjeta de crédito.' },
  { n: 2, title: 'Configura tu conjunto', desc: 'Agrega unidades, residentes y zonas comunes.' },
  { n: 3, title: 'Invita a residentes', desc: 'Ellos reciben acceso al portal desde el primer día.' },
]

const HowItWorksSection = () => {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="py-24 bg-slate-50 px-4">
      <div className="container mx-auto max-w-5xl">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Empieza en 3 pasos simples
          </h2>
          <p className="text-slate-500 text-lg">Sin complejidad, sin curva de aprendizaje.</p>
        </motion.div>

        <div className="relative flex flex-col md:flex-row items-center justify-between gap-10 md:gap-0">
          <div
            className="hidden md:block absolute h-0.5 bg-slate-200 overflow-hidden"
            style={{ top: '2rem', left: 'calc(16.67% + 2rem)', right: 'calc(16.67% + 2rem)' }}
          >
            <motion.div
              className="h-full bg-blue-500 origin-left"
              initial={{ scaleX: 0 }}
              animate={isInView ? { scaleX: 1 } : {}}
              transition={{ duration: 1.2, delay: 0.5, ease: 'easeInOut' }}
            />
          </div>

          {steps.map((step, i) => (
            <motion.div
              key={step.n}
              className="flex-1 flex flex-col items-center text-center z-10"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.2 + 0.2 }}
            >
              <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-extrabold mb-4 shadow-lg shadow-blue-200 ring-4 ring-slate-50">
                {step.n}
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">{step.title}</h3>
              <p className="text-slate-500 text-sm max-w-[160px]">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── PricingSection ───────────────────────────────────────────────────────────

interface Plan {
  name: string
  desc: string
  monthly: number | null
  annual: number | null
  features: string[]
  highlight: boolean
  ctaLabel: string
  ctaHref?: string
}

const plans: Plan[] = [
  {
    name: 'PH Básico',
    desc: 'Para copropiedades pequeñas',
    monthly: 89000,
    annual: 890000,
    features: [
      'Hasta 50 unidades',
      'Cobros automáticos',
      'PQR digital',
      'Portal del residente',
      'Reservas de zonas comunes',
      'Soporte por email',
    ],
    highlight: false,
    ctaLabel: 'Comenzar',
  },
  {
    name: 'PH Pro',
    desc: '51 a 200 unidades',
    monthly: 149000,
    annual: 1490000,
    features: [
      'Todo lo del plan Básico',
      'Presupuesto anual',
      'Múltiples administradores',
      'Reportes avanzados',
      'Soporte prioritario',
    ],
    highlight: true,
    ctaLabel: 'Comenzar',
  },
  {
    name: 'PH Enterprise',
    desc: 'Más de 200 unidades o conjuntos mixtos',
    monthly: null,
    annual: null,
    features: [
      'Todo lo del plan Pro',
      'Integración contable',
      'Facturación electrónica DIAN',
      'SLA dedicado',
      'Implementación asistida',
    ],
    highlight: false,
    ctaLabel: 'Hablar con ventas',
    ctaHref: WA_DEMO_HREF,
  },
]

const formatCOP = (n: number) =>
  n.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

const PricingSection = () => {
  const [annual, setAnnual] = useState(false)
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} id="pricing" className="py-24 bg-white px-4">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Planes simples y transparentes
          </h2>
          <p className="text-slate-500 text-lg mb-8">Elige el plan que mejor se adapte a tu copropiedad.</p>
          <div className="inline-flex items-center bg-slate-100 rounded-full p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                !annual ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                annual ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Anual
              <span className="text-xs font-bold text-green-500">−2 meses</span>
            </button>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-center">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              whileHover={{ y: -4 }}
              className={`rounded-2xl p-8 flex flex-col ${
                plan.highlight
                  ? 'bg-gradient-to-br from-blue-600 to-blue-700 shadow-2xl shadow-blue-300/50 md:scale-105'
                  : 'bg-white border border-slate-200 shadow-sm'
              }`}
            >
              {plan.highlight && (
                <div className="flex items-center gap-1 text-blue-200 text-xs font-bold uppercase tracking-wider mb-3">
                  <Star className="w-3 h-3 fill-current" />
                  Más popular
                </div>
              )}
              <h3 className={`text-xl font-bold mb-1 ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
                {plan.name}
              </h3>
              <p className={`text-sm mb-6 ${plan.highlight ? 'text-blue-200' : 'text-slate-500'}`}>
                {plan.desc}
              </p>

              <div className="h-16 flex items-baseline gap-1 mb-6 overflow-hidden">
                {plan.monthly == null ? (
                  <span className={`text-4xl font-extrabold ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
                    Consultar
                  </span>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={annual ? 'annual' : 'monthly'}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="flex items-baseline gap-1"
                    >
                      <span className={`text-4xl font-extrabold ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
                        ${formatCOP(annual ? (plan.annual ?? 0) : plan.monthly)}
                      </span>
                      <span className={`text-sm ${plan.highlight ? 'text-blue-200' : 'text-slate-400'}`}>
                        /{annual ? 'año' : 'mes'}
                      </span>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle2
                      className={`w-4 h-4 flex-shrink-0 ${plan.highlight ? 'text-blue-200' : 'text-green-500'}`}
                    />
                    <span className={plan.highlight ? 'text-blue-100' : 'text-slate-600'}>{f}</span>
                  </li>
                ))}
              </ul>

              {plan.ctaHref ? (
                <a href={plan.ctaHref} target="_blank" rel="noopener noreferrer">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      className={`w-full ${
                        plan.highlight
                          ? 'bg-white text-blue-600 hover:bg-blue-50'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {plan.ctaLabel}
                    </Button>
                  </motion.div>
                </a>
              ) : (
                <Link to="/registro">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      className={`w-full ${
                        plan.highlight
                          ? 'bg-white text-blue-600 hover:bg-blue-50'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {plan.ctaLabel}
                    </Button>
                  </motion.div>
                </Link>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── TestimonialsSection ──────────────────────────────────────────────────────

const TestimonialsSection = () => {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="py-24 bg-slate-50 px-4">
      <div className="container mx-auto max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Lo que dicen nuestros primeros conjuntos
          </h2>
          <p className="text-slate-500 text-lg mb-10">
            Estamos en etapa de lanzamiento.{' '}
            ¿Quieres ser el primero en probar CoproAdmin en tu conjunto?
          </p>
          <a href={WA_DEMO_HREF} target="_blank" rel="noopener noreferrer">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button size="lg" className="h-14 px-8 text-lg bg-blue-600 hover:bg-blue-700 text-white">
                Agendar demo gratuita
              </Button>
            </motion.div>
          </a>
        </motion.div>
      </div>
    </section>
  )
}

// ─── FooterSection ────────────────────────────────────────────────────────────

const FooterSection = () => {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <motion.footer
      ref={ref as React.RefObject<HTMLElement>}
      className="bg-slate-900 text-slate-400 py-16 px-4"
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
    >
      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold">C</span>
              </div>
              <span className="text-xl font-bold text-white">CoproAdmin</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              La plataforma de administración para copropiedades colombianas.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Producto</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="hover:text-white transition-colors">Características</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Precios</a></li>
              <li><Link to="/registro" className="hover:text-white transition-colors">Registro</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Soporte</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Documentación</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contacto</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Estado del sistema</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/terminos-de-uso" className="hover:text-white transition-colors">Términos de uso</Link></li>
              <li><Link to="/politica-privacidad" className="hover:text-white transition-colors">Privacidad</Link></li>
              <li><Link to="/politica-cookies" className="hover:text-white transition-colors">Cookies</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 text-center text-sm">
          © 2026 CoproAdmin. Todos los derechos reservados. Hecho con ❤️ en Colombia.
        </div>
      </div>
    </motion.footer>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const LandingPage = () => (
  <div className="min-h-screen font-sans overflow-x-hidden">
    <NavBar />
    <HeroSection />
    <StatsBar />
    <FeaturesSection />
    <ForWhomSection />
    <HowItWorksSection />
    <PricingSection />
    <TestimonialsSection />
    <FooterSection />
  </div>
)

export default LandingPage

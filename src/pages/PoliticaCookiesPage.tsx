import { Link } from 'react-router-dom'
import { Cookie } from 'lucide-react'

function LegalLayout({
  title,
  icon,
  version,
  fechaActualizacion,
  children,
}: {
  title: string
  icon: React.ReactNode
  version: string
  fechaActualizacion: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Link
          to="/"
          className="text-blue-600 hover:underline text-sm mb-8 inline-block"
        >
          ← Volver al inicio
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 md:p-12">
          <div className="flex items-center gap-3 mb-2">
            {icon}
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{title}</h1>
          </div>
          <p className="text-xs text-slate-400 mb-10">
            {version} · Última actualización: {fechaActualizacion}
          </p>

          <div className="prose prose-slate max-w-none text-sm leading-relaxed space-y-8">
            {children}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          © 2026 CoproAdmin · Hecho con ❤️ en Colombia
        </p>
      </div>
    </div>
  )
}

function Seccion({ numero, titulo, children }: { numero: string; titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-bold text-slate-800 mb-3 flex items-baseline gap-2">
        <span className="text-blue-600 font-mono text-sm">{numero}.</span>
        {titulo}
      </h2>
      <div className="space-y-3 text-slate-600">{children}</div>
    </section>
  )
}

// ─── Tabla de cookies ──────────────────────────────────────────

interface CookieRow {
  nombre: string
  tipo: string
  duracion: string
  proposito: string
}

const COOKIES: CookieRow[] = [
  {
    nombre: 'sb-[proyecto]-auth-token',
    tipo: 'Técnica / Sesión',
    duracion: 'Sesión del navegador',
    proposito:
      'Mantiene tu sesión activa en CoproAdmin. Es generada por Supabase Auth. Sin esta cookie no puedes autenticarte.',
  },
  {
    nombre: 'sb-[proyecto]-auth-token.0',
    tipo: 'Técnica / Sesión',
    duracion: 'Sesión del navegador',
    proposito:
      'Fragmento auxiliar del token de sesión. Usada cuando el token supera el tamaño de una sola cookie.',
  },
  {
    nombre: 'coproadmin_ui_theme',
    tipo: 'Preferencia',
    duracion: '1 año',
    proposito:
      'Guarda tu preferencia de tema (claro/oscuro). Almacenada en localStorage, no enviada al servidor.',
  },
  {
    nombre: 'coproadmin_sidebar_state',
    tipo: 'Preferencia',
    duracion: '1 año',
    proposito:
      'Recuerda si el menú lateral está expandido o colapsado. Almacenada en localStorage.',
  },
]

export default function PoliticaCookiesPage() {
  return (
    <LegalLayout
      title="Política de Cookies"
      icon={<Cookie className="w-7 h-7 text-blue-600" />}
      version="v1.0"
      fechaActualizacion="2 de junio de 2026"
    >
      <p className="text-slate-500 border-l-4 border-blue-200 pl-4 italic">
        CoproAdmin utiliza únicamente cookies <strong>técnicas y de preferencia</strong>.
        No usamos cookies de publicidad, seguimiento de comportamiento ni servicios
        de analítica de terceros. Esta política explica exactamente qué almacenamos
        y por qué.
      </p>

      <Seccion numero="1" titulo="¿Qué es una cookie?">
        <p>
          Una cookie es un pequeño archivo de texto que el navegador guarda en tu
          dispositivo cuando visitas un sitio web. Permite que el sitio recuerde
          información entre páginas y sesiones.
        </p>
        <p>
          CoproAdmin también usa <strong>localStorage</strong> del navegador para
          almacenar preferencias de interfaz. Aunque no son cookies en sentido
          estricto, las incluimos aquí por transparencia.
        </p>
      </Seccion>

      <Seccion numero="2" titulo="Cookies que utilizamos">
        <p>
          La siguiente tabla lista todas las cookies y datos de almacenamiento
          local que CoproAdmin puede crear:
        </p>

        <div className="overflow-x-auto rounded-lg border border-slate-200 mt-2">
          <table className="w-full text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-3 py-2 font-semibold text-slate-700 border-b border-slate-200">
                  Nombre
                </th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700 border-b border-slate-200">
                  Tipo
                </th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700 border-b border-slate-200">
                  Duración
                </th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700 border-b border-slate-200">
                  Propósito
                </th>
              </tr>
            </thead>
            <tbody>
              {COOKIES.map((c, i) => (
                <tr
                  key={c.nombre}
                  className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
                >
                  <td className="px-3 py-2 font-mono text-slate-800 whitespace-nowrap align-top">
                    {c.nombre}
                  </td>
                  <td className="px-3 py-2 text-slate-600 whitespace-nowrap align-top">
                    {c.tipo}
                  </td>
                  <td className="px-3 py-2 text-slate-600 whitespace-nowrap align-top">
                    {c.duracion}
                  </td>
                  <td className="px-3 py-2 text-slate-600 align-top">
                    {c.proposito}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-slate-400 text-xs mt-2">
          El prefijo <code className="bg-slate-100 px-1 rounded">[proyecto]</code>{' '}
          corresponde al identificador interno del proyecto de Supabase y varía
          por entorno.
        </p>
      </Seccion>

      <Seccion numero="3" titulo="Cookies de terceros y publicidad">
        <p>
          <strong>CoproAdmin no instala cookies de terceros</strong> (Google Analytics,
          Facebook Pixel, Hotjar u otras herramientas de analítica o publicidad).
          Tampoco usamos CDNs externos que generen cookies propias.
        </p>
        <p>
          La única conexión a servicios externos es con{' '}
          <strong>Supabase</strong> (base de datos y autenticación), que procesa
          datos en infraestructura de Amazon Web Services bajo su propia política
          de privacidad. Supabase no instala cookies de seguimiento en tu dispositivo.
        </p>
      </Seccion>

      <Seccion numero="4" titulo="Base legal para el uso de cookies">
        <p>
          Las cookies técnicas de sesión son <strong>estrictamente necesarias</strong>
          para el funcionamiento de la plataforma — sin ellas no puedes iniciar
          sesión. No requieren tu consentimiento previo según las directrices de
          la Superintendencia de Industria y Comercio (SIC).
        </p>
        <p>
          Las cookies de preferencia se almacenan en localStorage y solo persisten
          localmente en tu dispositivo. No se envían a nuestros servidores y se
          borran al limpiar los datos del navegador.
        </p>
      </Seccion>

      <Seccion numero="5" titulo="Cómo desactivar o eliminar las cookies">
        <p>
          Puedes gestionar o eliminar las cookies desde la configuración de tu
          navegador. A continuación, los pasos para los navegadores más comunes:
        </p>
        <ul className="list-disc list-inside space-y-1.5">
          <li>
            <strong>Google Chrome:</strong> Menú (⋮) → Configuración → Privacidad y
            seguridad → Cookies y otros datos del sitio.
          </li>
          <li>
            <strong>Mozilla Firefox:</strong> Menú (☰) → Configuración → Privacidad y
            seguridad → Cookies y datos del sitio.
          </li>
          <li>
            <strong>Safari (macOS/iOS):</strong> Preferencias → Privacidad → Gestionar
            datos del sitio web.
          </li>
          <li>
            <strong>Microsoft Edge:</strong> Menú (…) → Configuración → Cookies y
            permisos del sitio.
          </li>
        </ul>
        <p>
          <strong>Atención:</strong> si eliminas las cookies de sesión de Supabase,
          tu sesión en CoproAdmin se cerrará y deberás iniciar sesión de nuevo.
          Las preferencias de interfaz volverán a los valores por defecto.
        </p>
      </Seccion>

      <Seccion numero="6" titulo="Cambios a esta política">
        <p>
          Si en el futuro incorporamos nuevas cookies, actualizaremos esta política
          y, si las cookies requieren consentimiento, te lo solicitaremos antes de
          instalarlas. Siempre encontrarás la versión vigente en{' '}
          <Link to="/politica-cookies" className="text-blue-600 hover:underline">
            /politica-cookies
          </Link>
          .
        </p>
        <p>
          Para preguntas sobre el uso de cookies escríbenos a{' '}
          <a href="mailto:admin@coproadmin.co" className="text-blue-600 hover:underline">
            admin@coproadmin.co
          </a>
          .
        </p>
      </Seccion>
    </LegalLayout>
  )
}

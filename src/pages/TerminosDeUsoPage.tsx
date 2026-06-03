import { Link } from 'react-router-dom'
import { FileText } from 'lucide-react'

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

export default function TerminosDeUsoPage() {
  return (
    <LegalLayout
      title="Términos de Uso"
      icon={<FileText className="w-7 h-7 text-blue-600" />}
      version="v1.0"
      fechaActualizacion="2 de junio de 2026"
    >
      <p className="text-slate-500 border-l-4 border-blue-200 pl-4 italic">
        Estos Términos de Uso regulan el acceso y la utilización de{' '}
        <strong>CoproAdmin</strong>, plataforma de gestión de propiedad horizontal en
        Colombia. Al crear una cuenta o usar el servicio, aceptas los presentes
        términos. Léelos con atención antes de continuar.
      </p>

      <Seccion numero="1" titulo="Descripción del servicio">
        <p>
          CoproAdmin es un software como servicio (<strong>SaaS</strong>) diseñado
          para la administración de conjuntos residenciales y edificios bajo el régimen
          de propiedad horizontal en Colombia, regulado por la{' '}
          <strong>Ley 675 de 2001</strong>.
        </p>
        <p>
          La plataforma permite gestionar cuotas de administración, reservas de zonas
          comunes, peticiones, quejas y reclamos (PQR), presupuesto anual, asambleas
          y el cumplimiento de las obligaciones legales del administrador.
        </p>
        <p>
          CoproAdmin <strong>no actúa como administrador</strong> del conjunto; es
          exclusivamente una herramienta de software. La responsabilidad de la gestión
          recae en el administrador legalmente designado por la copropiedad.
        </p>
      </Seccion>

      <Seccion numero="2" titulo="Registro y cuentas">
        <p>
          Para usar CoproAdmin debes ser mayor de 18 años y proporcionar información
          verídica al crear tu cuenta. Eres responsable de mantener la confidencialidad
          de tus credenciales y de todas las acciones realizadas desde tu cuenta.
        </p>
        <p>
          Si detectas uso no autorizado de tu cuenta, debes notificarnos de inmediato
          a{' '}
          <a href="mailto:admin@coproadmin.co" className="text-blue-600 hover:underline">
            admin@coproadmin.co
          </a>
          . No somos responsables por pérdidas derivadas del uso no autorizado por
          terceros antes de la notificación.
        </p>
      </Seccion>

      <Seccion numero="3" titulo="Roles y responsabilidades">
        <p>
          <strong>Administrador del conjunto (admin_ph):</strong> es el único perfil
          autorizado para configurar el conjunto, registrar unidades, aprobar pagos y
          gestionar solicitudes ARCO. El administrador garantiza que los datos
          ingresados son verídicos y que cuenta con la autorización de los propietarios
          para tratarlos, conforme a la Ley 1581 de 2012.
        </p>
        <p>
          <strong>Propietario / Residente:</strong> puede consultar su estado de cuenta,
          realizar reservas, enviar PQR y ejercer sus derechos ARCO. No puede modificar
          datos de otras unidades ni de otros miembros.
        </p>
        <p>
          Cada rol tiene acceso restringido mediante Control de Acceso Basado en Roles
          (RBAC) y políticas de seguridad a nivel de fila (RLS) en la base de datos.
          No está permitido intentar acceder a datos de otros tenants o usuarios.
        </p>
      </Seccion>

      <Seccion numero="4" titulo="Uso aceptable">
        <p>
          Queda prohibido usar CoproAdmin para actividades que:
        </p>
        <ul className="list-disc list-inside space-y-1.5">
          <li>Violen leyes colombianas o normas internacionales aplicables.</li>
          <li>
            Impliquen ingeniería inversa, scraping automatizado o intentos de acceso
            no autorizado a la plataforma o a datos de otras copropiedades.
          </li>
          <li>
            Introduzcan malware, código malicioso o interrumpan la disponibilidad
            del servicio.
          </li>
          <li>
            Suplantan la identidad de otro propietario, residente o administrador.
          </li>
        </ul>
        <p>
          El incumplimiento puede resultar en la suspensión inmediata de la cuenta,
          sin perjuicio de las acciones legales que correspondan.
        </p>
      </Seccion>

      <Seccion numero="5" titulo="Planes, suscripción y pagos">
        <p>
          CoproAdmin ofrece un <strong>período de prueba gratuito</strong> (trial) y
          planes de pago mensual o anual. Los precios vigentes se publican en el sitio
          web. Los cargos se realizan por adelantado y no son reembolsables, salvo
          en los casos previstos por la normativa colombiana de protección al
          consumidor (Ley 1480 de 2011).
        </p>
        <p>
          El no pago oportuno puede resultar en la suspensión del acceso al conjunto
          en el siguiente ciclo de facturación, con previo aviso por correo electrónico.
        </p>
      </Seccion>

      <Seccion numero="6" titulo="Disponibilidad del servicio">
        <p>
          Nos esforzamos por mantener el servicio disponible 24/7. Sin embargo, no
          garantizamos disponibilidad ininterrumpida. Podemos realizar mantenimientos
          programados, notificando con al menos 24 horas de anticipación por correo.
        </p>
        <p>
          No somos responsables por interrupciones causadas por fuerza mayor, fallas
          de proveedores de infraestructura (AWS, Supabase) o problemas de conectividad
          fuera de nuestro control.
        </p>
      </Seccion>

      <Seccion numero="7" titulo="Propiedad intelectual">
        <p>
          El software, el diseño, el código y la documentación de CoproAdmin son
          propiedad exclusiva de sus desarrolladores y están protegidos por las leyes
          de propiedad intelectual de Colombia y los tratados internacionales suscritos
          por el país.
        </p>
        <p>
          Los datos que ingresas a la plataforma (información del conjunto, propietarios,
          pagos) son de tu propiedad. Puedes exportarlos en cualquier momento desde el
          panel de administración.
        </p>
      </Seccion>

      <Seccion numero="8" titulo="Limitación de responsabilidad">
        <p>
          CoproAdmin no será responsable por daños indirectos, lucro cesante, pérdida
          de datos o daños derivados del uso incorrecto de la plataforma por parte
          del administrador del conjunto o de los residentes.
        </p>
        <p>
          La responsabilidad máxima de CoproAdmin ante cualquier reclamación no
          excederá el valor pagado por el plan de suscripción en los últimos tres (3)
          meses anteriores al evento que dio origen a la reclamación.
        </p>
        <p>
          Las decisiones de gestión del conjunto (aprobación de presupuestos,
          cobro de cuotas, elección de administrador) son responsabilidad exclusiva
          de la asamblea de copropietarios y del administrador, no de la plataforma.
        </p>
      </Seccion>

      <Seccion numero="9" titulo="Ley aplicable y jurisdicción">
        <p>
          Estos Términos se rigen por las leyes de la{' '}
          <strong>República de Colombia</strong>. Para cualquier controversia, las
          partes se someten a la jurisdicción de los jueces y tribunales competentes
          de la ciudad de Bogotá D.C., renunciando a cualquier otro fuero que pudiera
          corresponderles.
        </p>
        <p>
          Intentaremos resolver cualquier disputa amigablemente en un plazo de 30 días
          calendario antes de acudir a instancias judiciales.
        </p>
      </Seccion>

      <Seccion numero="10" titulo="Modificaciones a los términos">
        <p>
          Podemos actualizar estos Términos notificándote por correo electrónico con
          al menos <strong>15 días de anticipación</strong> antes de que los cambios
          entren en vigor. Si continúas usando el servicio después de esa fecha,
          entendemos que aceptas los nuevos términos.
        </p>
        <p>
          Para consultas sobre estos Términos escríbenos a{' '}
          <a href="mailto:admin@coproadmin.co" className="text-blue-600 hover:underline">
            admin@coproadmin.co
          </a>
          .
        </p>
      </Seccion>
    </LegalLayout>
  )
}

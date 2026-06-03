import { Link } from 'react-router-dom'
import { Shield } from 'lucide-react'

// ─── Layout compartido de páginas legales ──────────────────────

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

// ─── Página ────────────────────────────────────────────────────

export default function PoliticaPrivacidadPage() {
  return (
    <LegalLayout
      title="Política de Privacidad"
      icon={<Shield className="w-7 h-7 text-blue-600" />}
      version="v1.0"
      fechaActualizacion="2 de junio de 2026"
    >
      <p className="text-slate-500 border-l-4 border-blue-200 pl-4 italic">
        CoproAdmin opera bajo la <strong>Ley 1581 de 2012</strong> y el{' '}
        <strong>Decreto 1377 de 2013</strong> de la República de Colombia, que regulan
        la protección de datos personales. Esta política explica qué datos recopilamos,
        para qué los usamos y cómo puedes ejercer tus derechos.
      </p>

      <Seccion numero="1" titulo="Responsable del tratamiento">
        <p>
          <strong>CoproAdmin</strong> (en adelante, «nosotros» o «la plataforma») es
          responsable del tratamiento de los datos personales que ingresas al usar
          nuestros servicios.
        </p>
        <p>
          Correo de contacto:{' '}
          <a href="mailto:admin@coproadmin.co" className="text-blue-600 hover:underline">
            admin@coproadmin.co
          </a>
          . Atendemos consultas de lunes a viernes, 8 a.m. – 5 p.m. (hora Colombia).
        </p>
        <p>
          El administrador del conjunto donde eres propietario o residente también
          actúa como responsable del tratamiento de los datos relacionados con la
          gestión de la copropiedad, conforme a la Ley 675 de 2001.
        </p>
      </Seccion>

      <Seccion numero="2" titulo="Datos personales que recopilamos">
        <ul className="list-disc list-inside space-y-1.5">
          <li>
            <strong>Datos de cuenta:</strong> nombre completo, correo electrónico,
            número de teléfono.
          </li>
          <li>
            <strong>Datos de la unidad:</strong> número de apartamento/local,
            torre, piso, coeficiente de copropiedad.
          </li>
          <li>
            <strong>Datos financieros:</strong> estado de cuenta, cuotas de
            administración, historial de pagos. No almacenamos datos de tarjetas
            de crédito ni cuentas bancarias directamente.
          </li>
          <li>
            <strong>Datos de uso:</strong> reservas de zonas comunes, PQR enviadas,
            solicitudes ARCO, fecha y hora de acceso.
          </li>
          <li>
            <strong>Datos técnicos:</strong> dirección IP al momento de registrar
            un consentimiento, tipo de dispositivo y navegador.
          </li>
        </ul>
        <p>
          No recopilamos datos sensibles (salud, biometría, opiniones políticas,
          afiliación sindical) en ninguna circunstancia.
        </p>
      </Seccion>

      <Seccion numero="3" titulo="Finalidad del tratamiento">
        <ul className="list-disc list-inside space-y-1.5">
          <li>Gestionar tu cuenta y tu relación con la copropiedad.</li>
          <li>
            Procesar cuotas de administración, registrar pagos y generar
            comprobantes.
          </li>
          <li>
            Permitir la reserva de zonas comunes y la gestión de PQR.
          </li>
          <li>
            Dar cumplimiento a las obligaciones legales del administrador bajo
            la Ley 675 de 2001.
          </li>
          <li>
            Enviarte notificaciones sobre tu estado de cuenta o cambios en la
            copropiedad (nunca con fines publicitarios de terceros).
          </li>
        </ul>
      </Seccion>

      <Seccion numero="4" titulo="Bases legales para el tratamiento">
        <p>
          Tratamos tus datos con base en: (a) tu <strong>consentimiento expreso</strong>{' '}
          registrado en el portal cuando aceptas esta política; (b) la ejecución del{' '}
          <strong>contrato</strong> de administración de copropiedad; y (c) el
          cumplimiento de <strong>obligaciones legales</strong> impuestas por la
          Ley 675 de 2001 y normas tributarias vigentes.
        </p>
      </Seccion>

      <Seccion numero="5" titulo="Tiempo de conservación">
        <p>
          Conservamos tus datos mientras seas propietario o residente activo de la
          copropiedad y durante los <strong>5 años</strong> siguientes al cierre de
          tu vinculación, plazo exigido por la normativa contable y tributaria colombiana.
        </p>
        <p>
          Los registros de consentimiento son conservados indefinidamente como
          evidencia de cumplimiento de la Ley 1581 de 2012.
        </p>
      </Seccion>

      <Seccion numero="6" titulo="Transferencias a terceros">
        <p>
          No vendemos ni cedemos tus datos personales a terceros con fines
          comerciales. Podemos compartirlos únicamente con:
        </p>
        <ul className="list-disc list-inside space-y-1.5">
          <li>
            <strong>Supabase Inc.</strong> — proveedor de base de datos en la nube
            (servidores en AWS us-east-2). Actuará como encargado del tratamiento
            bajo acuerdo de confidencialidad.
          </li>
          <li>
            <strong>Wompi / Bancolombia S.A.</strong> — pasarela de pagos, cuando
            uses la función de pago en línea de cuotas. Solo recibe los datos
            necesarios para procesar la transacción.
          </li>
          <li>
            <strong>Autoridades competentes</strong> — cuando sea requerido por ley
            o por orden judicial.
          </li>
        </ul>
      </Seccion>

      <Seccion numero="7" titulo="Tus derechos (ARCO)">
        <p>
          Conforme al artículo 8 de la Ley 1581 de 2012, tienes derecho a:
        </p>
        <ul className="list-disc list-inside space-y-1.5">
          <li>
            <strong>Acceso:</strong> conocer qué datos tuyos tenemos y cómo los
            usamos.
          </li>
          <li>
            <strong>Rectificación:</strong> corregir datos incompletos, inexactos
            o desactualizados.
          </li>
          <li>
            <strong>Cancelación:</strong> solicitar la supresión de tus datos cuando
            no sean necesarios para la finalidad para la que fueron recopilados.
          </li>
          <li>
            <strong>Oposición:</strong> oponerte al tratamiento de tus datos para
            fines específicos.
          </li>
        </ul>
        <p>
          Puedes ejercer estos derechos directamente desde el{' '}
          <strong>Portal del Residente → «Mis derechos sobre mis datos»</strong>.
          También puedes escribirnos a{' '}
          <a href="mailto:admin@coproadmin.co" className="text-blue-600 hover:underline">
            admin@coproadmin.co
          </a>
          . Tenemos <strong>10 días hábiles</strong> para responder (Ley 1581,
          Art. 22).
        </p>
      </Seccion>

      <Seccion numero="8" titulo="Seguridad de la información">
        <p>
          Implementamos medidas técnicas y organizativas para proteger tus datos:
          cifrado en tránsito (TLS 1.3), cifrado en reposo en la base de datos,
          control de acceso por roles (RLS en PostgreSQL), y autenticación segura.
        </p>
        <p>
          Ante un incidente de seguridad que afecte tus datos, te notificaremos
          dentro de las 72 horas siguientes a su detección, conforme a las buenas
          prácticas recomendadas por la Superintendencia de Industria y Comercio (SIC).
        </p>
      </Seccion>

      <Seccion numero="9" titulo="Cambios a esta política">
        <p>
          Cuando actualicemos esta política, publicaremos la nueva versión en esta
          misma URL y te solicitaremos un nuevo consentimiento en el portal si los
          cambios son materiales. La versión vigente siempre estará identificada con
          número de versión y fecha de actualización.
        </p>
      </Seccion>

      <Seccion numero="10" titulo="Autoridad de control">
        <p>
          Si consideras que hemos vulnerado tus derechos de protección de datos,
          puedes presentar una queja ante la{' '}
          <strong>
            Superintendencia de Industria y Comercio (SIC) — Delegatura para la
            Protección de Datos Personales
          </strong>
          :{' '}
          <a
            href="https://www.sic.gov.co"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            www.sic.gov.co
          </a>
          .
        </p>
      </Seccion>
    </LegalLayout>
  )
}

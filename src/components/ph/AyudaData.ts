export interface PasoAyuda {
  titulo: string;
  detalle: string;
}

export interface TemaAyuda {
  id: string;
  section: string;
  title: string;
  desc: string;
  steps: PasoAyuda[];
}

export interface PreguntaFrecuente {
  id: string;
  q: string;
  a: string;
}

export const temasAyuda: TemaAyuda[] = [
  {
    id: 'admin-dashboard',
    section: 'Para Admin',
    title: 'Dashboard',
    desc: 'El panel principal muestra el estado actual del conjunto.',
    steps: [
      { titulo: 'Unidades Registradas', detalle: 'Muestra el número total de unidades en el conjunto. Preocúpate si este número no coincide con el censo físico real.' },
      { titulo: 'Total Unidades en Mora', detalle: 'Indica cuántas unidades tienen al menos un mes atrasado. <b>Una mora superior al 20%</b> afecta gravemente la liquidez de la copropiedad.' },
      { titulo: 'Recaudo del Mes', detalle: 'Porcentaje de la cartera mensual cobrada. Idealmente debe superar el 85% a fin de mes para cubrir obligaciones básicas.' },
      { titulo: 'Ingresos vs Gastos', detalle: 'Balance mensual en tiempo real. Un balance negativo prolongado requiere medidas de austeridad o convocar a asamblea para cuotas extraordinarias.' }
    ]
  },
  {
    id: 'admin-unidades',
    section: 'Para Admin',
    title: 'Unidades',
    desc: 'Gestiona todas las unidades del conjunto.',
    steps: [
      { titulo: 'Agregar una nueva unidad', detalle: 'Haz clic en <b>"+ Nueva unidad"</b> arriba a la derecha. Ingresa el número de unidad, tipo (apartamento, local, parqueadero o depósito), torre, piso y coeficiente %. El coeficiente determina cuánto paga esa unidad del total mensual.' },
      { titulo: 'Editar una unidad existente', detalle: 'En la tarjeta de cada unidad haz clic en <b>"Editar"</b>. Puedes cambiar cualquier campo incluyendo reasignar el propietario.' },
      { titulo: 'Interpretar el badge de mora', detalle: '<b>Al día (verde):</b> sin cuotas pendientes. <b>Pendiente (amarillo):</b> cuota generada sin pagar. <b>En mora (rojo):</b> cuota vencida — requiere seguimiento de cobro.' }
    ]
  },
  {
    id: 'admin-cobros',
    section: 'Para Admin',
    title: 'Cobros',
    desc: 'Genera cuotas mensuales y registra pagos.',
    steps: [
      { titulo: 'Generar cuotas mensuales', detalle: 'Usa el botón <b>"Generar cobro del periodo"</b>. Esto abrirá una previsualización mostrando el cálculo de la cuota según el presupuesto o valor fijo asignado antes de aplicar los cobros de forma definitiva en el sistema.' },
      { titulo: 'Registrar un pago manual', detalle: 'En la tabla, selecciona una cuota pendiente y haz clic en <b>"Registrar Pago"</b>. Debes indicar la fecha de pago y el medio utilizado (transferencia, efectivo, etc.).' },
      { titulo: 'Exportar cartera a CSV', detalle: 'El botón <b>"Exportar CSV"</b> descarga un archivo compatible con Excel con todos los cobros mostrados en pantalla, ideal para enviar al contador.' },
      { titulo: 'Manejo de cuotas existentes', detalle: 'Si el periodo ya tiene cuotas generadas, el sistema prevendrá la duplicación. Debes editar las cuotas individualmente o anularlas si hubo un error masivo.' }
    ]
  },
  {
    id: 'admin-zonas',
    section: 'Para Admin',
    title: 'Zonas Comunes',
    desc: 'Configura y administra las zonas comunes del conjunto.',
    steps: [
      { titulo: 'Crear o editar zona', detalle: 'Haz clic en <b>"Nueva Zona"</b> o <b>"Editar"</b> en una existente. Puedes establecer el nombre, aforo máximo y horario de disponibilidad (ej: 08:00 a 22:00).' },
      { titulo: 'Activar o desactivar temporalmente', detalle: 'Usa el toggle en la tarjeta para deshabilitar una zona. Útil durante mantenimientos o reparaciones, lo cual impedirá cualquier nueva reserva.' },
      { titulo: 'Bloqueo para morosos', detalle: 'Al activar <b>"Bloquear para morosos"</b>, el sistema validará automáticamente el estado de cuenta del residente. Si está en rojo, se le impedirá agendar la reserva automáticamente.' }
    ]
  },
  {
    id: 'admin-reservas',
    section: 'Para Admin',
    title: 'Reservas',
    desc: 'Calendario de ocupación de zonas comunes.',
    steps: [
      { titulo: 'Crear reserva administrativa', detalle: 'Selecciona una celda vacía en el calendario. Estas reservas son útiles para eventos del conjunto o asambleas y sobreescriben las reglas normales.' },
      { titulo: 'Cancelar reserva existente', detalle: 'Haz clic en un bloque de reserva de un residente y selecciona <b>"Cancelar"</b>. El residente será notificado (si el envío de correos está activo).' },
      { titulo: 'Navegar por el calendario', detalle: 'Usa las flechas superiores para avanzar o retroceder semanas, y el selector de zonas para filtrar la vista y evitar sobrecargas de información.' }
    ]
  },
  {
    id: 'admin-pqr',
    section: 'Para Admin',
    title: 'PQR',
    desc: 'Gestiona las peticiones, quejas y reclamos de residentes.',
    steps: [
      { titulo: 'Filtrar la bandeja de entrada', detalle: 'Utiliza los filtros de la parte superior para ver solo PQR "Pendientes" o filtrarlas por "Quejas" de convivencia que requieren acción rápida.' },
      { titulo: 'Abrir detalle', detalle: 'Al hacer clic en una PQR verás el mensaje completo del residente y el historial de respuestas asociado al caso.' },
      { titulo: 'Responder y dejar evidencia', detalle: 'Escribe tu respuesta en la caja de texto. Esta respuesta será visible para el residente en su portal. Usa un tono conciliador.' },
      { titulo: 'Cerrar el caso (Ley 675)', detalle: 'Según la Ley 675 de 2001, las PQR tienen tiempos de respuesta estipulados (15 días hábiles). Al cerrar la PQR, queda un registro inmutable en el historial.' }
    ]
  },
  {
    id: 'admin-presupuesto',
    section: 'Para Admin',
    title: 'Presupuesto',
    desc: 'Planifica los gastos anuales del conjunto.',
    steps: [
      { titulo: 'Agregar ítem presupuestal', detalle: 'Haz clic en <b>"+ Nuevo Ítem"</b>. Debes asignarle un nombre descriptivo (ej: Mantenimiento Ascensores) y el valor proyectado anual.' },
      { titulo: 'Selección de categoría', detalle: 'Clasifica el gasto adecuadamente. Ejemplos: <b>Administrativos</b> (Honorarios contador), <b>Mantenimiento</b> (Jardinería, Piscinas), <b>Servicios</b> (Agua zonas comunes).' },
      { titulo: 'Ver desglose total', detalle: 'La gráfica y las tarjetas superiores muestran el total presupuestado dividido por categorías, ayudando a entender a dónde va el recaudo mensual.' }
    ]
  },
  {
    id: 'res-portal',
    section: 'Para Residente',
    title: 'Mi Portal',
    desc: 'Tu espacio personal como residente.',
    steps: [
      { titulo: 'Ver estado de cuenta', detalle: 'En la pantalla principal verás tu saldo actual. Si tienes saldo a favor, se aplicará al siguiente mes.' },
      { titulo: 'Código de colores', detalle: 'El badge <b>verde</b> significa que estás al día. El <b>amarillo</b> indica que tienes una cuota por pagar este mes. El <b>rojo</b> indica que estás en mora y podrías tener restricciones.' },
      { titulo: 'Contacto con administración', detalle: 'Si notas una discrepancia en tus pagos o multas, debes usar el módulo de PQR para solicitar una revisión formal del estado de cuenta.' }
    ]
  },
  {
    id: 'res-reservas',
    section: 'Para Residente',
    title: 'Reservas',
    desc: 'Reserva zonas comunes desde tu portal.',
    steps: [
      { titulo: 'Cómo hacer una reserva', detalle: 'Ve a la pestaña Reservas, selecciona la zona (ej: Salón Social), busca un espacio en blanco en el calendario, haz clic y confirma el horario.' },
      { titulo: 'Restricción por mora', detalle: 'Si estás en mora, es posible que el sistema no te permita hacer clic en el calendario si la asamblea o el administrador configuró bloqueo por deudas.' },
      { titulo: 'Cancelar tu reserva', detalle: 'Si no vas a usar el espacio, haz clic en tu reserva y anúlala. Hazlo con antelación para permitir que otros vecinos puedan usar el espacio.' }
    ]
  },
  {
    id: 'res-pqr',
    section: 'Para Residente',
    title: 'PQR',
    desc: 'Envía y haz seguimiento de tus PQR.',
    steps: [
      { titulo: 'Cómo crear un ticket', detalle: 'Presiona <b>"Nueva PQR"</b>. Sé claro y conciso en el asunto y proporciona detalles suficientes para que la administración pueda ayudarte.' },
      { titulo: 'Diferencia de tipos', detalle: 'Usa <b>Petición</b> para solicitar certificados o permisos. Usa <b>Queja</b> para reportar problemas de convivencia o ruido. Usa <b>Reclamo</b> cuando un servicio del conjunto falló.' },
      { titulo: 'Seguimiento del estado', detalle: 'Tu PQR pasará de "Pendiente" a "En Progreso" y finalmente a "Cerrada". Recibirás las respuestas del administrador directamente en esta pantalla.' }
    ]
  }
];

export const preguntasFrecuentes: PreguntaFrecuente[] = [
  { id: 'faq-1', q: '¿Cómo recupero mi contraseña?', a: 'Comunícate con el administrador de tu conjunto para que restablezca tu acceso desde el panel de miembros. Recibirás un nuevo enlace al correo registrado para configurar tu nueva contraseña.' },
  { id: 'faq-2', q: '¿Por qué no puedo reservar una zona común?', a: 'Es posible que la zona esté desactivada temporalmente por mantenimiento. Alternativamente, si tienes pagos en mora, tu conjunto puede tener habilitada la restricción automática de reservas para morosos.' },
  { id: 'faq-3', q: '¿Cómo reporto un pago realizado?', a: 'Actualmente debes reportarlo directamente a la administración entregando tu comprobante o transferencia. Ellos se encargarán de registrarlo manualmente en tu estado de cuenta en el sistema.' },
  { id: 'faq-4', q: '¿Qué significan los estados de una PQR?', a: '"Pendiente" significa que el administrador aún no la ha revisado. "En Progreso" indica que se está trabajando o investigando el caso. "Cerrada" significa que se dio una solución final al requerimiento.' },
  { id: 'faq-5', q: '¿Cómo actualizo mis datos de contacto?', a: 'Por seguridad, la modificación de datos personales se hace a través de la administración. Ve a "Mi Portal" para consultar tus datos actuales y comunícate con el administrador si requieres actualizar tu teléfono o correo.' },
  { id: 'faq-6', q: '¿Se pueden exportar los cobros a Excel?', a: 'Sí, los administradores tienen acceso a una función dedicada para esto. Pueden usar el botón "Exportar CSV" en la vista de Cobros, lo cual generará un archivo que abre directamente en Excel.' }
];

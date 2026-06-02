export interface Miembro {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  estado: "al_dia" | "pendiente" | "en_mora";
  fechaIngreso: string;
  aporteTotal: number;
  cuotasPendientes: number;
}

export interface Prestamo {
  id: string;
  miembroId: string;
  miembroNombre: string;
  montoOriginal: number;
  saldoPendiente: number;
  tasaInteres: number;
  cuotasMensuales: number;
  cuotasPagadas: number;
  fechaDesembolso: string;
  estado: "activo" | "pagado" | "en_mora";
}

export interface Transaccion {
  id: string;
  miembroId: string;
  miembroNombre: string;
  tipo: "aporte" | "prestamo_desembolso" | "prestamo_pago" | "multa" | "rendimiento";
  monto: number;
  fecha: string;
  descripcion: string;
}

export interface ConfiguracionFondo {
  nombre: string;
  cuotaMensual: number;
  diaCorte: number;
  tasaInteres: number;
  multaMora: number;
}

export const configuracion: ConfiguracionFondo = {
  nombre: "Fondo Familiar García",
  cuotaMensual: 200000,
  diaCorte: 15,
  tasaInteres: 1.5,
  multaMora: 50000,
};

export const miembros: Miembro[] = [
  { id: "1", nombre: "Carlos García", email: "carlos@email.com", telefono: "300 123 4567", estado: "al_dia", fechaIngreso: "2023-01-15", aporteTotal: 4800000, cuotasPendientes: 0 },
  { id: "2", nombre: "María López", email: "maria@email.com", telefono: "310 234 5678", estado: "al_dia", fechaIngreso: "2023-01-15", aporteTotal: 4600000, cuotasPendientes: 0 },
  { id: "3", nombre: "Pedro Martínez", email: "pedro@email.com", telefono: "320 345 6789", estado: "pendiente", fechaIngreso: "2023-03-01", aporteTotal: 3800000, cuotasPendientes: 1 },
  { id: "4", nombre: "Ana Rodríguez", email: "ana@email.com", telefono: "315 456 7890", estado: "en_mora", fechaIngreso: "2023-02-01", aporteTotal: 3200000, cuotasPendientes: 3 },
  { id: "5", nombre: "Luis Hernández", email: "luis@email.com", telefono: "301 567 8901", estado: "al_dia", fechaIngreso: "2023-01-15", aporteTotal: 4800000, cuotasPendientes: 0 },
  { id: "6", nombre: "Sandra Gómez", email: "sandra@email.com", telefono: "318 678 9012", estado: "al_dia", fechaIngreso: "2023-04-01", aporteTotal: 3600000, cuotasPendientes: 0 },
  { id: "7", nombre: "Jorge Díaz", email: "jorge@email.com", telefono: "305 789 0123", estado: "pendiente", fechaIngreso: "2023-05-01", aporteTotal: 3000000, cuotasPendientes: 2 },
  { id: "8", nombre: "Patricia Castro", email: "patricia@email.com", telefono: "312 890 1234", estado: "al_dia", fechaIngreso: "2023-01-15", aporteTotal: 4800000, cuotasPendientes: 0 },
];

export const prestamos: Prestamo[] = [
  { id: "P1", miembroId: "3", miembroNombre: "Pedro Martínez", montoOriginal: 2000000, saldoPendiente: 1200000, tasaInteres: 1.5, cuotasMensuales: 12, cuotasPagadas: 5, fechaDesembolso: "2024-06-15", estado: "activo" },
  { id: "P2", miembroId: "4", miembroNombre: "Ana Rodríguez", montoOriginal: 3000000, saldoPendiente: 2800000, tasaInteres: 1.5, cuotasMensuales: 18, cuotasPagadas: 2, fechaDesembolso: "2024-09-01", estado: "en_mora" },
  { id: "P3", miembroId: "6", miembroNombre: "Sandra Gómez", montoOriginal: 1500000, saldoPendiente: 750000, tasaInteres: 1.5, cuotasMensuales: 10, cuotasPagadas: 5, fechaDesembolso: "2024-05-01", estado: "activo" },
  { id: "P4", miembroId: "1", miembroNombre: "Carlos García", montoOriginal: 5000000, saldoPendiente: 0, tasaInteres: 1.5, cuotasMensuales: 24, cuotasPagadas: 24, fechaDesembolso: "2023-03-01", estado: "pagado" },
];

export const transacciones: Transaccion[] = [
  { id: "T1", miembroId: "1", miembroNombre: "Carlos García", tipo: "aporte", monto: 200000, fecha: "2024-12-15", descripcion: "Cuota mensual diciembre" },
  { id: "T2", miembroId: "2", miembroNombre: "María López", tipo: "aporte", monto: 200000, fecha: "2024-12-15", descripcion: "Cuota mensual diciembre" },
  { id: "T3", miembroId: "3", miembroNombre: "Pedro Martínez", tipo: "prestamo_pago", monto: 180000, fecha: "2024-12-10", descripcion: "Cuota préstamo #P1" },
  { id: "T4", miembroId: "4", miembroNombre: "Ana Rodríguez", tipo: "multa", monto: 50000, fecha: "2024-12-01", descripcion: "Multa por mora - 3 cuotas" },
  { id: "T5", miembroId: "5", miembroNombre: "Luis Hernández", tipo: "aporte", monto: 200000, fecha: "2024-12-15", descripcion: "Cuota mensual diciembre" },
  { id: "T6", miembroId: "6", miembroNombre: "Sandra Gómez", tipo: "prestamo_pago", monto: 160000, fecha: "2024-12-12", descripcion: "Cuota préstamo #P3" },
  { id: "T7", miembroId: "7", miembroNombre: "Jorge Díaz", tipo: "aporte", monto: 200000, fecha: "2024-11-20", descripcion: "Cuota mensual noviembre (tardía)" },
  { id: "T8", miembroId: "8", miembroNombre: "Patricia Castro", tipo: "aporte", monto: 200000, fecha: "2024-12-14", descripcion: "Cuota mensual diciembre" },
  { id: "T9", miembroId: "1", miembroNombre: "Carlos García", tipo: "rendimiento", monto: 45000, fecha: "2024-12-01", descripcion: "Rendimiento mensual" },
  { id: "T10", miembroId: "3", miembroNombre: "Pedro Martínez", tipo: "prestamo_desembolso", monto: 2000000, fecha: "2024-06-15", descripcion: "Desembolso préstamo #P1" },
];

export const formatCOP = (amount: number): string => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const capitalTotal = miembros.reduce((sum, m) => sum + m.aporteTotal, 0);
export const miembrosAlDia = miembros.filter((m) => m.estado === "al_dia").length;
export const miembrosEnMora = miembros.filter((m) => m.estado === "en_mora").length;
export const miembrosPendientes = miembros.filter((m) => m.estado === "pendiente").length;
export const prestamosActivos = prestamos.filter((p) => p.estado === "activo" || p.estado === "en_mora");
export const totalPrestado = prestamosActivos.reduce((sum, p) => sum + p.saldoPendiente, 0);

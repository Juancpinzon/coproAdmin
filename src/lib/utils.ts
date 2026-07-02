import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extrae un mensaje legible de un valor capturado en un catch (tipo unknown).
 * Con TypeScript strict, la variable de catch es 'unknown': este helper la
 * normaliza sin castear a any ni silenciar el compilador.
 */
export function getErrorMessage(e: unknown): string {
  return e instanceof Error ? e.message : "Ocurrió un error inesperado";
}

export const formatCOP = (amount: number): string =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0, // COP no maneja centavos: redondear al peso
  }).format(amount);

/**
 * Monto de una cuota de administración para una unidad, en pesos (COP no maneja
 * centavos en el producto, por eso se redondea al entero).
 * - 'fija': todas las unidades pagan la cuota base.
 * - 'coeficiente': proporcional al coeficiente de copropiedad (porcentaje, 0–100).
 * Fuente de verdad del cálculo usado por la generación masiva de cuotas.
 */
export function calcularMontoCuota(
  cuotaBase: number,
  coeficiente: number,
  modo: "fija" | "coeficiente",
): number {
  if (modo === "fija") return Math.round(cuotaBase);
  return Math.round(cuotaBase * (coeficiente / 100));
}

/**
 * Calcula los días hábiles (lunes a viernes) restantes desde 'desde' hasta 'fechaLimite'.
 * Excluye fines de semana. Si fechaLimite es menor que desde, devuelve negativo (solicitud vencida).
 */
export function calcularDiasHabilesRestantes(fechaLimite: Date, desde: Date = new Date()): number {
  const start = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate());
  const end = new Date(fechaLimite.getFullYear(), fechaLimite.getMonth(), fechaLimite.getDate());

  let diffDays = 0;
  const current = new Date(start);
  
  if (end < start) {
    while (current > end) {
      current.setDate(current.getDate() - 1);
      const day = current.getDay();
      if (day !== 0 && day !== 6) {
        diffDays--;
      }
    }
  } else {
    while (current < end) {
      current.setDate(current.getDate() + 1);
      const day = current.getDay();
      if (day !== 0 && day !== 6) {
        diffDays++;
      }
    }
  }
  
  return diffDays;
}

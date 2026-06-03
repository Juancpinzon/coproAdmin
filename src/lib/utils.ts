import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCOP = (amount: number): string =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount);

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

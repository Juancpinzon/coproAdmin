import { WOMPI_CURRENCY } from '../lib/constants';
import { WompiCheckoutConfig } from '../types/wompi';

/**
 * URL del script del widget de Wompi
 */
export const WOMPI_SCRIPT_URL = 'https://checkout.wompi.co/widget.js';

/**
 * Hook para gestionar la integración con Wompi
 */
export const useWompi = () => {
  const publicKey = import.meta.env.VITE_WOMPI_PUBLIC_KEY || '';

  /**
   * Indica si la integración de Wompi está configurada (llave pública existente)
   */
  const isConfigured = Boolean(publicKey);

  /**
   * Construye la configuración necesaria para el widget de Wompi
   * @param cuotaId Identificador de la cuota a pagar (se usará como referencia)
   * @param monto Monto total de la cuota en pesos
   * @returns Configuración para el checkout de Wompi
   */
  const initCheckout = (cuotaId: string, monto: number): WompiCheckoutConfig => {
    return {
      publicKey,
      currency: WOMPI_CURRENCY,
      amountInCents: monto * 100,
      reference: cuotaId,
      redirectUrl: `${window.location.origin}/portal`,
    };
  };

  return {
    isConfigured,
    initCheckout,
  };
};

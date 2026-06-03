/**
 * Tipos completos para la integración con Wompi
 */

/**
 * Transacción de Wompi
 */
export interface WompiTransaction {
  /** Identificador único de la transacción en Wompi */
  id: string;
  /** Estado actual de la transacción */
  status: string;
  /** Monto de la transacción en centavos */
  amount_in_cents: number;
  /** Moneda de la transacción, usualmente 'COP' */
  currency: string;
  /** Referencia de pago (corresponde a cuota_admin_id) */
  reference: string;
  /** Tipo de método de pago utilizado */
  payment_method_type: 'CARD' | 'PSE' | 'NEQUI' | 'DAVIPLATA';
  /** Fecha y hora de creación de la transacción */
  created_at: string;
  /** Fecha y hora de finalización de la transacción */
  finalized_at: string | null;
}

/**
 * Payload recibido en el webhook de Wompi
 */
export interface WompiWebhookPayload {
  /** Tipo de evento del webhook */
  event: 'transaction.updated';
  /** Datos del evento, contiene la transacción */
  data: {
    transaction: WompiTransaction;
  };
  /** Firma para validar la autenticidad del webhook */
  signature: {
    checksum: string;
  };
}

/**
 * Configuración requerida para iniciar el widget de checkout de Wompi
 */
export interface WompiCheckoutConfig {
  /** Llave pública de comercio de Wompi */
  publicKey: string;
  /** Moneda de la transacción */
  currency: string;
  /** Monto a cobrar en centavos */
  amountInCents: number;
  /** Referencia única del pago (cuotaId) */
  reference: string;
  /** Email del cliente para enviar el recibo */
  customerEmail?: string;
  /** URL de redirección tras completar el pago */
  redirectUrl: string;
}

/**
 * Payments module — public entry point. Resolves the active provider once
 * (mercadopago when MERCADOPAGO_ACCESS_TOKEN is set, mock otherwise) so
 * every caller (checkout route, webhook route) shares one instance without
 * re-checking env on every call — same pattern as lib/data's adapter switch.
 */
import { config } from '@/lib/config';
import { mockPaymentProvider } from './mock';
import { mercadoPagoProvider } from './mercadopago';

export * from './types';

export function isPaymentReal(): boolean {
  return !!config.payments.mercadopagoAccessToken;
}

export const paymentProvider = isPaymentReal() ? mercadoPagoProvider : mockPaymentProvider;

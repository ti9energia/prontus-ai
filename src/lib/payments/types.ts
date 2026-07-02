/**
 * Payment provider port (fase 5.1) — the checkout/webhook code only talks to
 * this interface. `mock.ts` is always available (sandbox, zero credentials);
 * `mercadopago.ts` activates when MERCADOPAGO_ACCESS_TOKEN is set. Adding a
 * second real provider (Stripe, pagar.me, Asaas) means implementing this same
 * interface — nothing else in the app changes.
 */

export type PaymentMethod = 'pix' | 'boleto' | 'card';
export type PaymentStatus = 'pending' | 'approved' | 'rejected';

export interface CheckoutInput {
  /** Our internal Order.id — becomes the provider's external_reference for correlation. */
  orderId: string;
  amountCents: number;
  currency: string;
  description: string;
  payer: { name: string; email: string; taxId?: string };
  method: PaymentMethod;
  /** method:'card' only — a provider-side card token (never raw PAN server-side). */
  cardToken?: string;
  installments?: number;
}

export interface CheckoutResult {
  providerRef: string;
  status: PaymentStatus;
  /** method:'pix' — data: URL PNG, ready for <img src>. */
  pixQrCode?: string;
  /** method:'pix' — the copia-e-cola string. */
  pixCopyPaste?: string;
  /** method:'boleto' — linha digitável (the human-typeable line). */
  boletoLine?: string;
  /** method:'boleto' — link to view/print the boleto. */
  boletoUrl?: string;
  /** Method-specific expiry (PIX/boleto are time-boxed). */
  expiresAt?: string;
}

export interface WebhookEvent {
  eventId: string;
  providerRef: string;
  status: PaymentStatus;
}

export interface PaymentProvider {
  readonly name: 'mercadopago' | 'mock';
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
  getStatus(providerRef: string): Promise<PaymentStatus>;
  /** Validates the webhook came from the real provider. Mock: always true (no external caller to spoof). */
  verifyWebhookSignature(rawBody: string, headers: Headers): boolean;
  /** Extracts a normalized event from the provider's webhook payload, or null if unrecognized. */
  parseWebhookEvent(payload: unknown): WebhookEvent | null;
}

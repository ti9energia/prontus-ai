/**
 * Mercado Pago adapter — activates when MERCADOPAGO_ACCESS_TOKEN is set
 * (a sandbox "TEST-…" token works exactly like a live one against their API).
 *
 * Implements the Payments API (https://api.mercadopago.com/v1/payments) for
 * all three BR methods in one endpoint: pix, bolbradesco (boleto), and card
 * (via a client-tokenized `token`, never a raw PAN server-side — PCI scope
 * stays with Mercado Pago's own tokenization JS, loaded by the checkout UI
 * only when this provider is active).
 *
 * Webhook signature verification follows Mercado Pago's documented HMAC
 * scheme (x-signature: "ts=…,v1=…" over a manifest string). Implemented in
 * good faith against their published spec — like the ICP-Brasil seam, this
 * hasn't been exercised against a live delivery in this environment (no
 * credentials configured here); verify with Mercado Pago's webhook simulator
 * before relying on it in production (see INTEGRACOES.md).
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { config } from '@/lib/config';
import type { CheckoutInput, CheckoutResult, PaymentProvider, PaymentStatus, WebhookEvent } from './types';

function mapStatus(mpStatus: string): PaymentStatus {
  if (mpStatus === 'approved') return 'approved';
  if (['rejected', 'cancelled'].includes(mpStatus)) return 'rejected';
  return 'pending'; // pending | in_process | authorized | in_mediation | refunded | charged_back
}

async function mpFetch(path: string, init: RequestInit): Promise<Record<string, unknown>> {
  const res = await fetch(`${config.payments.mercadopagoApiUrl}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${config.payments.mercadopagoAccessToken}`,
      'content-type': 'application/json',
      ...init.headers,
    },
  });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(`Mercado Pago API error ${res.status}: ${JSON.stringify(body).slice(0, 500)}`);
  }
  return body;
}

function payerPayload(payer: CheckoutInput['payer']) {
  const [firstName, ...rest] = payer.name.trim().split(/\s+/);
  return {
    email: payer.email,
    first_name: firstName || payer.name,
    last_name: rest.join(' ') || firstName || '-',
    ...(payer.taxId ? { identification: { type: payer.taxId.replace(/\D/g, '').length > 11 ? 'CNPJ' : 'CPF', number: payer.taxId.replace(/\D/g, '') } } : {}),
  };
}

export const mercadoPagoProvider: PaymentProvider = {
  name: 'mercadopago',

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    const amount = Math.round(input.amountCents) / 100;
    const base = {
      transaction_amount: amount,
      description: input.description,
      external_reference: input.orderId,
      payer: payerPayload(input.payer),
    };

    if (input.method === 'pix') {
      const res = await mpFetch('/v1/payments', {
        method: 'POST',
        body: JSON.stringify({ ...base, payment_method_id: 'pix' }),
      });
      const poi = (res.point_of_interaction as Record<string, unknown> | undefined)?.transaction_data as
        | Record<string, unknown>
        | undefined;
      return {
        providerRef: String(res.id),
        status: mapStatus(String(res.status)),
        pixQrCode: poi?.qr_code_base64 ? `data:image/png;base64,${poi.qr_code_base64}` : undefined,
        pixCopyPaste: (poi?.qr_code as string) ?? undefined,
        expiresAt: (res.date_of_expiration as string) ?? undefined,
      };
    }

    if (input.method === 'boleto') {
      const res = await mpFetch('/v1/payments', {
        method: 'POST',
        body: JSON.stringify({ ...base, payment_method_id: 'bolbradesco' }),
      });
      const details = res.transaction_details as Record<string, unknown> | undefined;
      const barcode = res.barcode as Record<string, unknown> | undefined;
      return {
        providerRef: String(res.id),
        status: mapStatus(String(res.status)),
        boletoLine: (barcode?.content as string) ?? undefined,
        boletoUrl: (details?.external_resource_url as string) ?? undefined,
        expiresAt: (res.date_of_expiration as string) ?? undefined,
      };
    }

    // card — `cardToken` must come from Mercado Pago's client-side tokenization
    // (Checkout Bricks / MP.js public key); we only ever forward the token.
    const res = await mpFetch('/v1/payments', {
      method: 'POST',
      body: JSON.stringify({
        ...base,
        token: input.cardToken,
        installments: input.installments ?? 1,
        payment_method_id: undefined, // MP infers it from the token
      }),
    });
    return { providerRef: String(res.id), status: mapStatus(String(res.status)) };
  },

  async getStatus(providerRef: string): Promise<PaymentStatus> {
    const res = await mpFetch(`/v1/payments/${providerRef}`, { method: 'GET' });
    return mapStatus(String(res.status));
  },

  verifyWebhookSignature(rawBody: string, headers: Headers): boolean {
    const secret = config.payments.mercadopagoWebhookSecret;
    if (!secret) return true; // no secret configured — accept (dev convenience, documented in .env.example)
    const signature = headers.get('x-signature');
    const requestId = headers.get('x-request-id');
    if (!signature || !requestId) return false;

    const parts = Object.fromEntries(
      signature.split(',').map((p) => {
        const [k, v] = p.split('=');
        return [k?.trim(), v?.trim()];
      }),
    );
    const ts = parts.ts;
    const v1 = parts.v1;
    if (!ts || !v1) return false;

    let dataId = '';
    try {
      const parsed = JSON.parse(rawBody) as { data?: { id?: string } };
      dataId = parsed.data?.id ?? '';
    } catch {
      return false;
    }

    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const expected = createHmac('sha256', secret).update(manifest).digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(v1);
    return a.length === b.length && timingSafeEqual(a, b);
  },

  parseWebhookEvent(payload: unknown): WebhookEvent | null {
    if (!payload || typeof payload !== 'object') return null;
    const p = payload as Record<string, unknown>;
    const data = p.data as Record<string, unknown> | undefined;
    const paymentId = data?.id;
    if (p.type !== 'payment' || !paymentId) return null;
    // Mercado Pago notifications carry only the payment id — the actual status
    // must be fetched. eventId dedup uses the notification's own id (or the
    // payment id as a fallback when the provider omits one, still correlatable).
    const eventId = typeof p.id === 'string' || typeof p.id === 'number' ? String(p.id) : `mp_${paymentId}`;
    return { eventId, providerRef: String(paymentId), status: 'pending' };
  },
};

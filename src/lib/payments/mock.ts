/**
 * Sandbox payment provider — always available, zero credentials, deterministic.
 * Produces a real, scannable-format PIX QR (EMV Merchant Presented QR with a
 * correct CRC16) so the checkout UI has something genuine to render, even
 * though the underlying "bank" is simulated.
 */
import QRCode from 'qrcode';
import type { CheckoutInput, CheckoutResult, PaymentProvider, PaymentStatus, WebhookEvent } from './types';

// providerRef -> createdAt, so getStatus() can simulate settlement after a few seconds
// without any external state (survives within the process lifetime, like the rest of the store).
const pending = new Map<string, number>();
const SETTLE_MS = 8_000;

function crc16ccitt(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function emvField(id: string, value: string): string {
  return `${id}${String(value.length).padStart(2, '0')}${value}`;
}

/** Builds a spec-shaped (sandbox) EMV Pix "copia e cola" string, CRC16 included. */
function buildPixCopyPaste(orderId: string, amountCents: number): string {
  const merchantAccount = emvField('00', 'br.gov.bcb.pix') + emvField('01', `sandbox-${orderId}@auronishealth.com`);
  const amount = (amountCents / 100).toFixed(2);
  const body =
    emvField('00', '01') +
    emvField('26', merchantAccount) +
    emvField('52', '0000') +
    emvField('53', '986') +
    emvField('54', amount) +
    emvField('58', 'BR') +
    emvField('59', 'AURONIS HEALTH') +
    emvField('60', 'SAO PAULO') +
    emvField('62', emvField('05', orderId.slice(0, 25)));
  const withCrcPlaceholder = `${body}6304`;
  return `${withCrcPlaceholder}${crc16ccitt(withCrcPlaceholder)}`;
}

function fakeBoletoLine(orderId: string): string {
  // Not a valid bank line (no real bank/agência) — a stable, boleto-shaped
  // string derived from the order id, clearly a sandbox artifact.
  let h = 0;
  for (let i = 0; i < orderId.length; i++) h = (h * 31 + orderId.charCodeAt(i)) >>> 0;
  const digits = String(h).padStart(10, '0').slice(0, 10);
  return `34191.79${digits.slice(0, 3)} ${digits.slice(3, 8)}.${digits.slice(8, 10)}0000 00000.000000 1 ${Date.now()
    .toString()
    .slice(-14)}`;
}

export const mockPaymentProvider: PaymentProvider = {
  name: 'mock',

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    const providerRef = `mock_pay_${input.orderId}`;
    pending.set(providerRef, Date.now());

    if (input.method === 'pix') {
      const copyPaste = buildPixCopyPaste(input.orderId, input.amountCents);
      const qr = await QRCode.toDataURL(copyPaste, { margin: 1, width: 260 });
      return {
        providerRef,
        status: 'pending',
        pixQrCode: qr,
        pixCopyPaste: copyPaste,
        expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
      };
    }

    if (input.method === 'boleto') {
      return {
        providerRef,
        status: 'pending',
        boletoLine: fakeBoletoLine(input.orderId),
        boletoUrl: `/api/checkout/boleto/${input.orderId}`,
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60_000).toISOString(),
      };
    }

    // card — sandbox convention: the checkout UI sends the test card's last
    // digit as `cardToken` (never a real PAN). Even digit → approved,
    // odd → rejected. This mirrors the "test card" convention real gateways
    // (incl. Mercado Pago's own sandbox) use for scripted QA.
    const lastDigit = Number(input.cardToken?.trim().slice(-1) ?? '0');
    const approved = Number.isFinite(lastDigit) && lastDigit % 2 === 0;
    pending.delete(providerRef);
    return { providerRef, status: approved ? 'approved' : 'rejected' };
  },

  async getStatus(providerRef: string): Promise<PaymentStatus> {
    const startedAt = pending.get(providerRef);
    if (startedAt === undefined) return 'approved'; // already settled (card, or polled after settlement)
    if (Date.now() - startedAt >= SETTLE_MS) {
      pending.delete(providerRef);
      return 'approved';
    }
    return 'pending';
  },

  verifyWebhookSignature(): boolean {
    return true; // no external caller to spoof in sandbox mode
  },

  parseWebhookEvent(payload: unknown): WebhookEvent | null {
    if (!payload || typeof payload !== 'object') return null;
    const p = payload as Record<string, unknown>;
    if (typeof p.eventId !== 'string' || typeof p.providerRef !== 'string' || typeof p.status !== 'string') return null;
    if (!['pending', 'approved', 'rejected'].includes(p.status)) return null;
    return { eventId: p.eventId, providerRef: p.providerRef, status: p.status as PaymentStatus };
  },
};

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockPaymentProvider } from '../mock';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('mock payment provider — PIX', () => {
  it('returns a real data:image/png QR and a CRC16-valid EMV copy-paste string', async () => {
    const result = await mockPaymentProvider.createCheckout({
      orderId: 'ord_0001',
      amountCents: 19900,
      currency: 'BRL',
      description: 'Plano Pro',
      payer: { name: 'Ana Silva', email: 'ana@x.com' },
      method: 'pix',
    });

    expect(result.status).toBe('pending');
    expect(result.pixQrCode).toMatch(/^data:image\/png;base64,/);
    expect(result.pixCopyPaste).toBeTruthy();
    expect(result.expiresAt).toBeTruthy();

    // Re-derive the CRC16-CCITT over everything except the trailing 4 hex
    // digits and confirm it matches what was appended — proves the "copia e
    // cola" string is a structurally valid EMV Pix payload, not just a random string.
    const raw = result.pixCopyPaste!;
    const body = raw.slice(0, -4);
    const claimedCrc = raw.slice(-4);
    let crc = 0xffff;
    for (let i = 0; i < body.length; i++) {
      crc ^= body.charCodeAt(i) << 8;
      for (let b = 0; b < 8; b++) crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
    expect(claimedCrc).toBe(crc.toString(16).toUpperCase().padStart(4, '0'));
    // amount is embedded in the payload (field 54)
    expect(raw).toContain('199.00');
  });

  it('getStatus is "pending" immediately and flips to "approved" once settle time elapses', async () => {
    const { providerRef } = await mockPaymentProvider.createCheckout({
      orderId: 'ord_0002',
      amountCents: 9900,
      currency: 'BRL',
      description: 'Plano Starter',
      payer: { name: 'Ana', email: 'a@x.com' },
      method: 'pix',
    });

    expect(await mockPaymentProvider.getStatus(providerRef)).toBe('pending');
    vi.advanceTimersByTime(4_000);
    expect(await mockPaymentProvider.getStatus(providerRef)).toBe('pending'); // not yet
    vi.advanceTimersByTime(4_500);
    expect(await mockPaymentProvider.getStatus(providerRef)).toBe('approved');
    // once settled, stays settled (removed from the pending map)
    expect(await mockPaymentProvider.getStatus(providerRef)).toBe('approved');
  });
});

describe('mock payment provider — boleto', () => {
  it('returns a linha digitável and a boleto view url, pending until settled', async () => {
    const result = await mockPaymentProvider.createCheckout({
      orderId: 'ord_0003',
      amountCents: 34900,
      currency: 'BRL',
      description: 'Plano Scale',
      payer: { name: 'Ana', email: 'a@x.com' },
      method: 'boleto',
    });
    expect(result.status).toBe('pending');
    expect(result.boletoLine).toMatch(/^\d{5}\.\d{5}/);
    expect(result.boletoUrl).toContain('ord_0003');
  });
});

describe('mock payment provider — card (sandbox test-card convention)', () => {
  it('approves synchronously when the token ends in an even digit', async () => {
    const result = await mockPaymentProvider.createCheckout({
      orderId: 'ord_0004',
      amountCents: 9900,
      currency: 'BRL',
      description: 'Plano Starter',
      payer: { name: 'Ana', email: 'a@x.com' },
      method: 'card',
      cardToken: 'mock_card_4242',
    });
    expect(result.status).toBe('approved');
  });

  it('rejects synchronously when the token ends in an odd digit', async () => {
    const result = await mockPaymentProvider.createCheckout({
      orderId: 'ord_0005',
      amountCents: 9900,
      currency: 'BRL',
      description: 'Plano Starter',
      payer: { name: 'Ana', email: 'a@x.com' },
      method: 'card',
      cardToken: 'mock_card_4241',
    });
    expect(result.status).toBe('rejected');
  });
});

describe('mock payment provider — webhook plumbing', () => {
  it('verifyWebhookSignature always accepts (no external caller to spoof in sandbox)', () => {
    expect(mockPaymentProvider.verifyWebhookSignature('{}', new Headers())).toBe(true);
  });

  it('parseWebhookEvent accepts a well-shaped test event', () => {
    const event = mockPaymentProvider.parseWebhookEvent({
      eventId: 'evt_1',
      providerRef: 'mock_pay_ord_0001',
      status: 'approved',
    });
    expect(event).toEqual({ eventId: 'evt_1', providerRef: 'mock_pay_ord_0001', status: 'approved' });
  });

  it('parseWebhookEvent rejects malformed payloads', () => {
    expect(mockPaymentProvider.parseWebhookEvent(null)).toBeNull();
    expect(mockPaymentProvider.parseWebhookEvent({})).toBeNull();
    expect(mockPaymentProvider.parseWebhookEvent({ eventId: 'e', providerRef: 'r', status: 'not-a-status' })).toBeNull();
  });
});

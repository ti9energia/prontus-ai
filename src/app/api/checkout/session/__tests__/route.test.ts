import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { POST } from '@/app/api/checkout/session/route';
import { createSession, SESSION_COOKIE } from '@/lib/auth';
import { listOrdersForOrg, registerTenant, resetStore } from '@/lib/data';

const SECRET = 'test-secret-for-checkout-route-abcdef';
let prevSecret: string | undefined;
beforeAll(() => {
  prevSecret = process.env.AUTH_SECRET;
  process.env.AUTH_SECRET = SECRET;
});
afterAll(() => {
  if (prevSecret === undefined) delete process.env.AUTH_SECRET;
  else process.env.AUTH_SECRET = prevSecret;
});
beforeEach(() => resetStore());

function call(body: unknown, token?: string) {
  return POST(
    new Request('http://localhost/api/checkout/session', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { cookie: `${SESSION_COOKIE}=${token}` } : {}),
      },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }) as unknown as Parameters<typeof POST>[0],
  );
}

async function signUpAndSession() {
  const { tenant, user } = registerTenant({
    orgName: 'Clínica Checkout',
    name: 'Dra. Bia',
    email: 'bia@checkout.com',
    passwordHash: 'h',
  });
  const token = await createSession({ email: user.email, role: 'doctor', name: user.name });
  return { tenant, user, token };
}

const payer = { name: 'Dra. Bia', email: 'bia@checkout.com' };

describe('POST /api/checkout/session', () => {
  it('rejects unauthenticated requests', async () => {
    const res = await call({ planId: 'plan_pro', cycle: 'monthly', method: 'pix', payer });
    expect(res.status).toBe(401);
  });

  it('creates a PIX order with a QR code and copia-e-cola for the signed-in tenant', async () => {
    const { tenant, token } = await signUpAndSession();
    const res = await call({ planId: 'plan_pro', cycle: 'monthly', method: 'pix', payer }, token);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe('pending');
    expect(json.pixQrCode).toMatch(/^data:image\/png;base64,/);
    expect(json.pixCopyPaste).toBeTruthy();
    expect(json.amountCents).toBe(19900);

    const orders = listOrdersForOrg(tenant.id);
    expect(orders).toHaveLength(1);
    expect(orders[0].method).toBe('pix');
  });

  it('creates a boleto order with a linha digitável and view url', async () => {
    const { token } = await signUpAndSession();
    const res = await call({ planId: 'plan_starter', cycle: 'monthly', method: 'boleto', payer }, token);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.boletoLine).toBeTruthy();
    expect(json.boletoUrl).toBeTruthy();
  });

  it('resolves a card payment synchronously (approved or rejected, no polling needed)', async () => {
    const { token } = await signUpAndSession();
    const res = await call(
      { planId: 'plan_starter', cycle: 'monthly', method: 'card', payer, cardToken: 'tok_4242' },
      token,
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe('paid'); // last digit 2 = even = approved, in mock convention
  });

  it('a rejected mock card leaves the order failed', async () => {
    const { token } = await signUpAndSession();
    const res = await call(
      { planId: 'plan_starter', cycle: 'monthly', method: 'card', payer, cardToken: 'tok_4241' },
      token,
    );
    const json = await res.json();
    expect(json.status).toBe('failed');
  });

  it('rejects card checkout without a cardToken', async () => {
    const { token } = await signUpAndSession();
    const res = await call({ planId: 'plan_starter', cycle: 'monthly', method: 'card', payer }, token);
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe('CARD_TOKEN_REQUIRED');
  });

  it('404s on an unknown plan id', async () => {
    const { token } = await signUpAndSession();
    const res = await call({ planId: 'plan_does_not_exist', cycle: 'monthly', method: 'pix', payer }, token);
    expect(res.status).toBe(404);
  });

  it('charges the yearly amount using the same 2-months-free formula as the landing page', async () => {
    const { token } = await signUpAndSession();
    const res = await call({ planId: 'plan_starter', cycle: 'yearly', method: 'pix', payer }, token);
    const json = await res.json();
    // Starter = 99/mo -> yearlyMonthlyPrice(99) = round(99*10/12) = 83 -> *12 * 100 cents
    expect(json.amountCents).toBe(83 * 12 * 100);
  });

  it('rejects invalid input with 400 + fieldErrors', async () => {
    const { token } = await signUpAndSession();
    const res = await call({ planId: '', cycle: 'monthly', method: 'pix', payer: { name: 'A', email: 'not-an-email' } }, token);
    expect(res.status).toBe(400);
  });
});

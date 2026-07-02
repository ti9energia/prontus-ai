import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { GET } from '@/app/api/checkout/session/[orderId]/route';
import { createSession, SESSION_COOKIE } from '@/lib/auth';
import { createOrder, getPlan, markOrderStatus, registerTenant, resetStore } from '@/lib/data';
import { paymentProvider } from '@/lib/payments';

const SECRET = 'test-secret-for-checkout-poll-route-abcdef';
let prevSecret: string | undefined;
beforeAll(() => {
  prevSecret = process.env.AUTH_SECRET;
  process.env.AUTH_SECRET = SECRET;
});
afterAll(() => {
  if (prevSecret === undefined) delete process.env.AUTH_SECRET;
  else process.env.AUTH_SECRET = prevSecret;
});
beforeEach(() => {
  resetStore();
  vi.useRealTimers();
});

function poll(orderId: string, token?: string) {
  return GET(
    new Request(`http://localhost/api/checkout/session/${orderId}`, {
      headers: token ? { cookie: `${SESSION_COOKIE}=${token}` } : {},
    }) as unknown as Parameters<typeof GET>[0],
    { params: { orderId } },
  );
}

/** Mirrors POST /api/checkout/session's real sequence: create the order, THEN
 *  open the checkout with the provider — that call is what registers the
 *  mock's internal settlement timer for this providerRef. Skipping it would
 *  make getStatus() treat the order as already-settled from the very first poll. */
async function setup() {
  const { tenant, user } = registerTenant({ orgName: 'Clínica Poll', name: 'Dr. Tiago', email: 'tiago@poll.com', passwordHash: 'h' });
  const token = await createSession({ email: user.email, role: 'doctor', name: user.name });
  const plan = getPlan('plan_pro')!;
  const order = createOrder({
    orgId: tenant.id,
    planId: plan.id,
    amountCents: plan.price * 100,
    cycle: 'monthly',
    method: 'pix',
    provider: 'mock',
  });
  const checkout = await paymentProvider.createCheckout({
    orderId: order.id,
    amountCents: plan.price * 100,
    currency: 'BRL',
    description: 'test',
    payer: { name: user.name, email: user.email },
    method: 'pix',
  });
  markOrderStatus(order.id, 'pending', checkout.providerRef);
  return { tenant, user, token, order };
}

describe('GET /api/checkout/session/:orderId', () => {
  it('rejects unauthenticated requests', async () => {
    const res = await poll('ord_0001');
    expect(res.status).toBe(401);
  });

  it("404s when the order belongs to a different org (no cross-tenant leak)", async () => {
    const { order } = await setup();
    const { user: otherUser } = registerTenant({ orgName: 'Outra', name: 'X', email: 'x@outra.com', passwordHash: 'h' });
    const otherToken = await createSession({ email: otherUser.email, role: 'doctor', name: otherUser.name });
    const res = await poll(order.id, otherToken);
    expect(res.status).toBe(404);
  });

  it('returns pending immediately after creation', async () => {
    const { order, token } = await setup();
    const res = await poll(order.id, token);
    expect(res.status).toBe(200);
    expect((await res.json()).status).toBe('pending');
  });

  it('transitions to paid once the sandbox settlement window elapses, polled live', async () => {
    vi.useFakeTimers();
    const { order, token } = await setup();

    expect((await (await poll(order.id, token)).json()).status).toBe('pending');
    vi.advanceTimersByTime(8_500);
    const after = await (await poll(order.id, token)).json();
    expect(after.status).toBe('paid');
    vi.useRealTimers();
  });
});

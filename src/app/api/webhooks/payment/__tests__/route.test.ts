import { describe, it, expect, beforeEach } from 'vitest';
import { POST } from '@/app/api/webhooks/payment/route';
import { createOrder, getOrder, listAudit, listTenants, markOrderStatus, registerTenant, resetStore } from '@/lib/data';

beforeEach(() => resetStore());

function webhookReq(payload: unknown) {
  return POST(
    new Request('http://localhost/api/webhooks/payment', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    }) as unknown as Parameters<typeof POST>[0],
  );
}

/** Mirrors what POST /api/checkout/session does: create the order, then let
 *  the provider assign its own reference — the webhook correlates by THAT,
 *  never by our internal Order.id (see getOrderByProviderRef). */
async function setupPendingOrder() {
  const { tenant } = registerTenant({ orgName: 'Clínica Alfa', name: 'Dr. Rui', email: 'rui@alfa.com', passwordHash: 'h' });
  const order = createOrder({
    orgId: tenant.id,
    planId: 'plan_pro',
    amountCents: 19900,
    cycle: 'monthly',
    method: 'pix',
    provider: 'mock',
  });
  const providerRef = `mock_pay_${order.id}`;
  markOrderStatus(order.id, 'pending', providerRef);
  return { tenant, order, providerRef };
}

describe('POST /api/webhooks/payment — idempotency (mock provider)', () => {
  it('applies a payment.approved event exactly once, even when delivered twice', async () => {
    const { tenant, order, providerRef } = await setupPendingOrder();
    const event = { eventId: 'evt_abc123', providerRef, status: 'approved' };

    const first = await webhookReq(event);
    expect(first.status).toBe(200);
    expect((await first.json()).deduped).toBeUndefined();

    const afterFirst = getOrder(order.id)!;
    expect(afterFirst.status).toBe('paid');
    expect(afterFirst.paidAt).toBeTruthy();
    const tenantAfterFirst = listTenants().find((t) => t.id === tenant.id)!;
    expect(tenantAfterFirst.status).toBe('active');
    expect(tenantAfterFirst.mrr).toBeGreaterThan(0);

    const auditCountAfterFirst = listAudit().filter((a) => a.action === 'order.paid').length;
    expect(auditCountAfterFirst).toBe(1);

    // The exact same delivery, again — providers retry, this must be a no-op.
    const second = await webhookReq(event);
    expect(second.status).toBe(200);
    const secondJson = await second.json();
    expect(secondJson.deduped).toBe(true);

    // Nothing changed the second time: same status, same paidAt, no new audit row.
    const afterSecond = getOrder(order.id)!;
    expect(afterSecond.status).toBe('paid');
    expect(afterSecond.paidAt).toBe(afterFirst.paidAt);
    expect(listAudit().filter((a) => a.action === 'order.paid').length).toBe(1);
  });

  it('two DIFFERENT event ids for the same order both apply (not the same guard) but a repeat of either is deduped', async () => {
    const { order, providerRef } = await setupPendingOrder();

    await webhookReq({ eventId: 'evt_1', providerRef, status: 'pending' });
    expect(getOrder(order.id)!.status).toBe('pending');

    await webhookReq({ eventId: 'evt_2', providerRef, status: 'approved' });
    expect(getOrder(order.id)!.status).toBe('paid');

    // Replaying evt_1 (already processed) must not revert the order back to pending.
    await webhookReq({ eventId: 'evt_1', providerRef, status: 'pending' });
    expect(getOrder(order.id)!.status).toBe('paid');
  });

  it('acknowledges (200) an event for an order it cannot find, without throwing', async () => {
    const res = await webhookReq({ eventId: 'evt_orphan', providerRef: 'mock_pay_ord_does_not_exist', status: 'approved' });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.unmatched).toBe(true);
  });

  it('acknowledges (200) a well-formed but unrecognized payload rather than erroring', async () => {
    const res = await webhookReq({ something: 'else' });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ignored).toBe(true);
  });

  it('rejects malformed JSON with 400, not a crash', async () => {
    const res = await POST(
      new Request('http://localhost/api/webhooks/payment', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{ not valid json',
      }) as unknown as Parameters<typeof POST>[0],
    );
    expect(res.status).toBe(400);
  });

  it('a rejected payment marks the order failed and never touches the tenant', async () => {
    const { tenant, order, providerRef } = await setupPendingOrder();
    await webhookReq({ eventId: 'evt_reject', providerRef, status: 'rejected' });

    expect(getOrder(order.id)!.status).toBe('failed');
    const t = listTenants().find((x) => x.id === tenant.id)!;
    expect(t.status).toBe('trial');
    expect(t.mrr).toBe(0);
  });
});

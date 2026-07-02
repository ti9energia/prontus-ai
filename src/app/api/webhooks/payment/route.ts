import { NextRequest, NextResponse } from 'next/server';
import {
  getOrderByProviderRef,
  getPlan,
  getTenant,
  isWebhookEventProcessed,
  listOrgUsers,
  markOrderStatus,
  markWebhookEventProcessed,
} from '@/lib/data';
import { paymentProvider, type PaymentStatus } from '@/lib/payments';
import { sendPaymentFailedEmail, sendPaymentReceivedEmail } from '@/lib/email';
import type { OrderStatus } from '@/lib/types';

/**
 * POST /api/webhooks/payment — payment provider confirmation webhook.
 * Idempotent by event id (a provider WILL retry deliveries): a repeat event
 * is acknowledged 200 immediately without reprocessing.
 *
 * Mercado Pago's notification only carries the payment id, not its status,
 * so real providers get a follow-up getStatus() call for the authoritative
 * state — the mock provider's test event already carries the final status.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function toOrderStatus(s: PaymentStatus): OrderStatus {
  if (s === 'approved') return 'paid';
  if (s === 'rejected') return 'failed';
  return 'pending';
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  if (!paymentProvider.verifyWebhookSignature(rawBody, req.headers)) {
    // Reject with 401, not 200 — never acknowledge a webhook we can't trust.
    return NextResponse.json({ error: { code: 'INVALID_SIGNATURE' } }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: { code: 'INVALID_JSON' } }, { status: 400 });
  }

  const event = paymentProvider.parseWebhookEvent(payload);
  if (!event) {
    // Unrecognized event shape (e.g. a provider event type we don't act on)
    // — acknowledge so the provider stops retrying, but do nothing.
    return NextResponse.json({ ok: true, ignored: true });
  }

  if (isWebhookEventProcessed(event.eventId)) {
    return NextResponse.json({ ok: true, deduped: true });
  }

  // Look the order up by the provider's own reference (what the event
  // carries) — set on the Order when the checkout session was created,
  // never by our internal Order.id (see getOrderByProviderRef's doc comment).
  const order = getOrderByProviderRef(event.providerRef);
  if (!order) {
    // Nothing to correlate — still acknowledge (the provider retrying won't help).
    markWebhookEventProcessed(event.eventId);
    return NextResponse.json({ ok: true, unmatched: true });
  }

  // Real providers: the notification is just a pointer — fetch the authoritative status.
  const status: PaymentStatus =
    paymentProvider.name === 'mock' ? event.status : await paymentProvider.getStatus(event.providerRef);

  const updated = markOrderStatus(order.id, toOrderStatus(status), event.providerRef);
  markWebhookEventProcessed(event.eventId);

  if (updated && (updated.status === 'paid' || updated.status === 'failed')) {
    const admin = listOrgUsers(updated.orgId)[0];
    const plan = getPlan(updated.planId);
    const tenant = getTenant(updated.orgId);
    if (admin && plan && tenant) {
      const send =
        updated.status === 'paid'
          ? sendPaymentReceivedEmail({
              to: admin.email,
              name: admin.name,
              orgName: tenant.name,
              planName: plan.name,
              amountCents: updated.amountCents,
              currency: 'BRL',
            })
          : sendPaymentFailedEmail({ to: admin.email, name: admin.name, orgName: tenant.name, planName: plan.name });
      send.catch((e: unknown) => console.error('[auronis:webhook] email failed:', e instanceof Error ? e.message : e));
    }
  }

  return NextResponse.json({ ok: true });
}

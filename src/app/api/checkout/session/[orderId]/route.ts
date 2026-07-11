import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, readCookie, verifySession } from '@/lib/auth';
import { getOrder, getPlan, getTenant, getUserByEmail, markOrderStatus } from '@/lib/data';
import { paymentProvider, type PaymentStatus } from '@/lib/payments';
import { sendPaymentReceivedEmail } from '@/lib/email';
import type { OrderStatus } from '@/lib/types';

/**
 * GET /api/checkout/session/:orderId — the checkout screen polls this while
 * waiting for PIX/boleto confirmation. Actively re-checks the provider when
 * still pending (not just a passive read), so the sandbox mock's simulated
 * settlement becomes visible without a real webhook delivery — the same
 * code path also works against the real Mercado Pago status endpoint.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function toOrderStatus(s: PaymentStatus): OrderStatus {
  if (s === 'approved') return 'paid';
  if (s === 'rejected') return 'failed';
  return 'pending';
}

export async function GET(req: NextRequest, props: { params: Promise<{ orderId: string }> }) {
  const params = await props.params;
  const session = await verifySession(readCookie(req.headers.get('cookie'), SESSION_COOKIE));
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
  }
  const user = getUserByEmail(session.sub);
  const order = getOrder(params.orderId);
  if (!order || !user || order.orgId !== user.orgId) {
    return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 });
  }

  let current = order;
  if (order.status === 'pending' && order.providerRef) {
    try {
      const status = await paymentProvider.getStatus(order.providerRef);
      const nextStatus = toOrderStatus(status);
      if (nextStatus !== order.status) {
        const updated = markOrderStatus(order.id, nextStatus, order.providerRef);
        if (updated) current = updated;
        if (nextStatus === 'paid') {
          const plan = getPlan(order.planId);
          const tenant = getTenant(order.orgId);
          if (plan && tenant) {
            void sendPaymentReceivedEmail({
              to: user.email,
              name: user.name,
              orgName: tenant.name,
              planName: plan.name,
              amountCents: order.amountCents,
              currency: 'BRL',
            }).catch(() => {});
          }
        }
      }
    } catch (e) {
      // Poll failures are transient — surface the order's last known status
      // rather than erroring the whole checkout screen.
      console.error('[auronis:checkout] status poll failed:', e instanceof Error ? e.message : e);
    }
  }

  return NextResponse.json({
    orderId: current.id,
    status: current.status,
    method: current.method,
    amountCents: current.amountCents,
    pixQrCode: current.paymentDetail?.pixQrCode,
    pixCopyPaste: current.paymentDetail?.pixCopyPaste,
    boletoLine: current.paymentDetail?.boletoLine,
    boletoUrl: current.paymentDetail?.boletoUrl,
  });
}

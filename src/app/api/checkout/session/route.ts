import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SESSION_COOKIE, readCookie, verifySession } from '@/lib/auth';
import { createOrder, getPlan, getTenant, getUserByEmail, markOrderStatus } from '@/lib/data';
import { isPaymentReal, paymentProvider, type PaymentStatus } from '@/lib/payments';
import { sendPaymentReceivedEmail } from '@/lib/email';
import type { OrderStatus } from '@/lib/types';
import { yearlyMonthlyPrice } from '@/lib/utils';

/**
 * POST /api/checkout/session — creates an Order for the signed-in tenant and
 * opens a checkout with the active payment provider (Mercado Pago when
 * MERCADOPAGO_ACCESS_TOKEN is set, sandbox mock otherwise). Returns whatever
 * the method needs to render: PIX QR + copia-e-cola, boleto line + url, or
 * the card's immediate approve/reject.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  planId: z.string().min(1),
  cycle: z.enum(['monthly', 'yearly']),
  method: z.enum(['pix', 'boleto', 'card']),
  payer: z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email(),
    taxId: z.string().trim().max(20).optional(),
  }),
  cardToken: z.string().max(200).optional(),
  installments: z.number().int().min(1).max(12).optional(),
});

/** Provider vocabulary (approved/rejected) -> our domain vocabulary (paid/failed). */
function toOrderStatus(s: PaymentStatus): OrderStatus {
  if (s === 'approved') return 'paid';
  if (s === 'rejected') return 'failed';
  return 'pending';
}

export async function POST(req: NextRequest) {
  const session = await verifySession(readCookie(req.headers.get('cookie'), SESSION_COOKIE));
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', messageKey: 'auth.errors.invalid' } }, { status: 401 });
  }
  const user = getUserByEmail(session.sub);
  if (!user) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', messageKey: 'auth.errors.invalid' } }, { status: 401 });
  }

  let raw: unknown = {};
  try {
    raw = await req.json();
  } catch {
    raw = {};
  }
  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'INVALID_INPUT', messageKey: 'checkout.errors.invalid' }, fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  const { planId, cycle, method, payer, cardToken, installments } = parsed.data;

  const plan = getPlan(planId);
  if (!plan) {
    return NextResponse.json({ error: { code: 'PLAN_NOT_FOUND', messageKey: 'checkout.errors.planNotFound' } }, { status: 404 });
  }
  if (method === 'card' && !cardToken) {
    return NextResponse.json({ error: { code: 'CARD_TOKEN_REQUIRED', messageKey: 'checkout.errors.cardToken' } }, { status: 400 });
  }

  const amountCents = cycle === 'yearly' ? yearlyMonthlyPrice(plan.price) * 12 * 100 : plan.price * 100;

  const order = createOrder({
    orgId: user.orgId,
    planId: plan.id,
    amountCents,
    cycle,
    method,
    provider: isPaymentReal() ? 'mercadopago' : 'mock',
  });

  try {
    const checkout = await paymentProvider.createCheckout({
      orderId: order.id,
      amountCents,
      currency: 'BRL',
      description: `Auronis Health — plano ${plan.name} (${cycle === 'yearly' ? 'anual' : 'mensal'})`,
      payer,
      method,
      cardToken,
      installments,
    });

    const updated = markOrderStatus(order.id, toOrderStatus(checkout.status), checkout.providerRef, {
      pixQrCode: checkout.pixQrCode,
      pixCopyPaste: checkout.pixCopyPaste,
      boletoLine: checkout.boletoLine,
      boletoUrl: checkout.boletoUrl,
    });

    // Card approves synchronously (no webhook/poll will ever fire for it) —
    // send the confirmation right here so it isn't silently skipped.
    if (updated?.status === 'paid') {
      const tenant = getTenant(user.orgId);
      if (tenant) {
        sendPaymentReceivedEmail({
          to: user.email,
          name: user.name,
          orgName: tenant.name,
          planName: plan.name,
          amountCents,
          currency: 'BRL',
        }).catch((e: unknown) => console.error('[auronis:checkout] email failed:', e instanceof Error ? e.message : e));
      }
    }

    return NextResponse.json({
      orderId: order.id,
      status: updated?.status ?? 'pending',
      method,
      amountCents,
      provider: order.provider,
      pixQrCode: checkout.pixQrCode,
      pixCopyPaste: checkout.pixCopyPaste,
      boletoLine: checkout.boletoLine,
      boletoUrl: checkout.boletoUrl,
      expiresAt: checkout.expiresAt,
    });
  } catch (e) {
    // The provider call failed (network, invalid credentials, rejected request)
    // — the Order stays 'pending' so a retry from the same checkout can reuse
    // it; never leak the raw provider error to the client.
    console.error('[auronis:checkout] createCheckout failed:', e instanceof Error ? e.message : e);
    return NextResponse.json(
      { error: { code: 'PROVIDER_ERROR', messageKey: 'checkout.errors.provider' } },
      { status: 502 },
    );
  }
}

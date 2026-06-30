import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  isWhatsappReal,
  sendMessage,
  parseWebhookPayload,
  verifyWebhookSignature,
  verifyWebhookChallenge,
} from '@/lib/connectors/whatsapp';
import { bus } from '@/lib/events/bus';
import { SESSION_COOKIE, readCookie, verifySession } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/whatsapp
 * - Capability probe:   ?probe=1                      → { real: boolean }
 * - Meta webhook verify: ?hub.mode=subscribe&...       → challenge string (plain text)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  if (searchParams.get('probe')) {
    return NextResponse.json({ real: isWhatsappReal() });
  }

  const mode = searchParams.get('hub.mode') ?? '';
  const token = searchParams.get('hub.verify_token') ?? '';
  const challenge = searchParams.get('hub.challenge') ?? '';

  const accepted = verifyWebhookChallenge(mode, token, challenge);
  if (accepted) {
    return new Response(accepted, { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }

  return new Response('Forbidden', { status: 403 });
}

const SendSchema = z.object({
  action: z.literal('send'),
  to: z.string().min(5),
  body: z.string().min(1),
});

/**
 * POST /api/whatsapp
 * - action=send (auth required): outbound message via Cloud API or stub
 * - No action: Meta webhook payload (inbound messages → bus events)
 */
export async function POST(req: NextRequest) {
  let rawBody: Buffer;
  try {
    rawBody = Buffer.from(await req.arrayBuffer());
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody.toString('utf8'));
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Check if this is a send action (doctor-initiated) vs webhook (Meta-initiated)
  const sendParsed = SendSchema.safeParse(body);

  if (sendParsed.success) {
    // Requires auth — this is an outbound send from the app
    const session = await verifySession(readCookie(req.headers.get('cookie'), SESSION_COOKIE));
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
      const result = await sendMessage({ to: sendParsed.data.to, body: sendParsed.data.body });
      return NextResponse.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'WhatsApp error';
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  // Otherwise treat as a Meta webhook — verify signature, process messages
  const signature = req.headers.get('x-hub-signature-256');
  if (!verifyWebhookSignature(rawBody, signature)) {
    return new Response('Forbidden', { status: 403 });
  }

  const messages = parseWebhookPayload(body);
  for (const m of messages) {
    bus.emit('whatsapp.inbound', m);
  }

  return new Response('OK', { status: 200 });
}

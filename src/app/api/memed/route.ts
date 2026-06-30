import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  isMemedReal,
  createPrescription,
  signPrescription,
  sendPrescription,
  type MemedMedication,
  type MemedPrescription,
} from '@/lib/connectors/memed';
import { SESSION_COOKIE, readCookie, verifySession } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/memed — capability probe (no auth required). */
export function GET() {
  return NextResponse.json({ real: isMemedReal() });
}

const MedSchema = z.object({
  name: z.string().min(1),
  dose: z.string().optional(),
  frequency: z.string().min(1),
  duration: z.string().min(1),
  instructions: z.string().optional(),
}) satisfies z.ZodType<MemedMedication>;

const BodySchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('create'),
    patientId: z.string().min(1),
    medications: z.array(MedSchema).min(1),
  }),
  z.object({
    action: z.literal('sign'),
    prescription: z.custom<MemedPrescription>(),
  }),
  z.object({
    action: z.literal('send'),
    prescription: z.custom<MemedPrescription>(),
    channel: z.enum(['sms', 'email', 'whatsapp']),
    contact: z.string().min(1),
  }),
]);

/** POST /api/memed — create / sign / send a prescription. */
export async function POST(req: NextRequest) {
  const session = await verifySession(readCookie(req.headers.get('cookie'), SESSION_COOKIE));
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  try {
    if (parsed.data.action === 'create') {
      const prescription = await createPrescription(parsed.data.patientId, parsed.data.medications);
      return NextResponse.json({ prescription });
    }

    if (parsed.data.action === 'sign') {
      const prescription = await signPrescription(parsed.data.prescription as MemedPrescription);
      return NextResponse.json({ prescription });
    }

    // send
    const prescription = await sendPrescription(
      parsed.data.prescription as MemedPrescription,
      parsed.data.channel,
      parsed.data.contact,
    );
    return NextResponse.json({ prescription });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Memed error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

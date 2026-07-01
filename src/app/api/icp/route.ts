import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isIcpReal, signDocument } from '@/lib/connectors/server';
import { SESSION_COOKIE, readCookie, verifySession } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/icp — capability probe (no auth required). */
export function GET() {
  return NextResponse.json({ real: isIcpReal() });
}

const BodySchema = z.object({
  docId: z.string().min(1),
  content: z.string().optional(),
});

/** POST /api/icp — sign a document, returns { hash, signedAt, source }. */
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
    const result = await signDocument(parsed.data.docId, parsed.data.content);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'ICP error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { pushAudit } from '@/lib/data/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Copilot feedback (👍/👎). Feeds the training/eval loop the AI Core captures to
 * improve over time (spec 0A §2.7). Recorded on the immutable audit trail so the
 * signal is queryable later; no auth required — it carries no sensitive data.
 */
const BodySchema = z.object({
  intent: z.enum(['up', 'down']),
  locale: z.string().max(12).optional(),
  screen: z.string().max(48).optional(),
  message: z.string().max(4000).optional(),
});

export async function POST(req: NextRequest) {
  let raw: unknown = {};
  try {
    raw = await req.json();
  } catch {
    raw = {};
  }
  const parsed = BodySchema.safeParse(raw ?? {});
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: { code: 'INVALID_INPUT', messageKey: 'errors.invalid_input' } },
      { status: 400 },
    );
  }
  const { intent, screen } = parsed.data;
  const safeScreen = (screen ?? '-').replace(/[^\w:-]/g, '').slice(0, 48) || '-';
  pushAudit('Mari (IA)', `copilot.feedback.${intent}`, `screen:${safeScreen}`, 'ok', 'ai');

  return NextResponse.json({ data: { ok: true }, error: null });
}

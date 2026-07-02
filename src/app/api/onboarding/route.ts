import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SESSION_COOKIE, readCookie, verifySession } from '@/lib/auth';
import { completeOnboardingStep, getOnboardingProgress, getUserByEmail } from '@/lib/data';

/**
 * Onboarding progress — one record per org, resumable across sessions/devices
 * (server-persisted, not localStorage). GET reads the current state; POST
 * marks a step done and returns the next one to render.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function currentOrgId(req: NextRequest): Promise<{ orgId: string; actorName: string } | null> {
  const session = await verifySession(readCookie(req.headers.get('cookie'), SESSION_COOKIE));
  if (!session) return null;
  const user = getUserByEmail(session.sub);
  if (!user) return null;
  return { orgId: user.orgId, actorName: user.name };
}

export async function GET(req: NextRequest) {
  const ctx = await currentOrgId(req);
  if (!ctx) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
  return NextResponse.json(getOnboardingProgress(ctx.orgId));
}

const Body = z.object({
  step: z.enum(['profile', 'specialty', 'team', 'tour']),
  data: z
    .object({
      specialtyKey: z.string().max(60).optional(),
      clinicSize: z.string().max(40).optional(),
      invitedEmails: z.array(z.string().email()).max(20).optional(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  const ctx = await currentOrgId(req);
  if (!ctx) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  let raw: unknown = {};
  try {
    raw = await req.json();
  } catch {
    raw = {};
  }
  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: 'INVALID_INPUT' } }, { status: 400 });
  }

  const progress = completeOnboardingStep(ctx.orgId, parsed.data.step, ctx.actorName, parsed.data.data);
  return NextResponse.json(progress);
}

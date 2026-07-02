import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hashPassword } from '@/lib/auth/server';
import { createSession, SESSION_COOKIE, SESSION_TTL_SECONDS } from '@/lib/auth';
import { config } from '@/lib/config';
import { getUserByEmail, registerTenant } from '@/lib/data';
import { sendWelcomeEmail } from '@/lib/email';

/**
 * Self-service signup. Creates a real Tenant (trial) + org_admin User with a
 * real scrypt password hash — not a demo shortcut. See registerTenant() in
 * lib/data/store.ts and .entrega/DECISOES.md (2026-07-02) for the deliberate
 * scope boundary: the new org is real and can log in for real; the clinical
 * workspace content it lands on is the same shared demo dataset every
 * identity in this app sees today (pre-existing, not new to signup).
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  orgName: z.string().trim().min(2, 'min').max(120, 'max'),
  name: z.string().trim().min(2, 'min').max(120, 'max'),
  email: z.string().trim().email('email').max(200, 'max'),
  password: z.string().min(10, 'min').max(200, 'max'),
  specialtyKey: z.string().max(60).optional(),
});

// Public account creation is an attractive abuse target — throttle harder than login.
const attempts = new Map<string, { count: number; first: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function clientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  return (xff ? xff.split(',')[0].trim() : '') || req.headers.get('x-real-ip') || 'unknown';
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || now - rec.first > WINDOW_MS) {
    attempts.set(ip, { count: 1, first: now });
    return false;
  }
  rec.count += 1;
  return rec.count > MAX_ATTEMPTS;
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: { code: 'RATE_LIMITED', messageKey: 'auth.errors.rateLimited' } },
      { status: 429 },
    );
  }

  let raw: unknown = {};
  try {
    raw = await req.json();
  } catch {
    raw = {};
  }
  const parsed = Body.safeParse(raw ?? {});
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: { code: 'INVALID_INPUT', messageKey: 'auth.errors.invalid' },
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { orgName, name, email, password, specialtyKey } = parsed.data;

  if (getUserByEmail(email)) {
    // Unlike login, telling the user "this email is taken" is normal signup
    // UX (they need to know to sign in instead) — not a meaningful enumeration risk.
    return NextResponse.json(
      { error: { code: 'EMAIL_TAKEN', messageKey: 'auth.errors.emailTaken' } },
      { status: 409 },
    );
  }

  const passwordHash = hashPassword(password);
  const { tenant, user } = registerTenant({ orgName, name, email, passwordHash, specialtyKey });

  // Fire-and-forget: a slow/failed welcome email must never block signup
  // (same posture as the Postgres write-through's pgFire).
  sendWelcomeEmail({ to: user.email, name: user.name, orgName: tenant.name }).catch((e: unknown) =>
    console.error('[auronis:signup] welcome email failed:', e instanceof Error ? e.message : e),
  );

  const token = await createSession({ email: user.email, role: 'doctor', name: user.name });
  const res = NextResponse.json({ ok: true, role: 'doctor', orgId: tenant.id });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: config.runtime.isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
  return res;
}

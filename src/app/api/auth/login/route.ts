import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticate, demoIdentity } from '@/lib/auth/credentials';
import { createSession, SESSION_COOKIE, SESSION_TTL_SECONDS } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  email: z.string().email().max(200).optional(),
  password: z.string().min(1).max(200).optional(),
  demo: z.boolean().optional(),
});

// Best-effort per-IP throttle (resets on cold start; adds real friction to
// brute force in steady state). A managed store (KV) is the production upgrade.
const attempts = new Map<string, { count: number; first: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
      { error: { code: 'INVALID_INPUT', messageKey: 'auth.errors.invalid' } },
      { status: 400 },
    );
  }

  const { email, password, demo } = parsed.data;
  // Public demo is on by default; set DEMO_MODE=false (or 0) to disable the shortcut in prod.
  const demoDisabled = process.env.DEMO_MODE === 'false' || process.env.DEMO_MODE === '0';
  const identity = demo
    ? demoDisabled
      ? null
      : demoIdentity()
    : email && password
      ? authenticate(email, password)
      : null;

  if (!identity) {
    await sleep(300 + Math.floor(Math.random() * 250)); // slow brute force; mask timing
    return NextResponse.json(
      { error: { code: 'INVALID_CREDENTIALS', messageKey: 'auth.errors.invalid' } },
      { status: 401 },
    );
  }

  const token = await createSession({ email: identity.email, role: identity.role, name: identity.name });
  const res = NextResponse.json({ ok: true, role: identity.role });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
  return res;
}

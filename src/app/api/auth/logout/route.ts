import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth';
import { config } from '@/lib/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: config.runtime.isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}

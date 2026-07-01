import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, readCookie, verifySession } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const token = readCookie(req.headers.get('cookie'), SESSION_COOKIE);
  const session = await verifySession(token);
  if (!session) return NextResponse.json({ authed: false });
  return NextResponse.json({ authed: true, role: session.role, email: session.sub, name: session.name });
}

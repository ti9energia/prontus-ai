import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Health check for container platforms (Fly/Render/ECS) and uptime monitors. */
export function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'prontus-ai',
    time: new Date().toISOString(),
  });
}

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const startedAt = Date.now();

/**
 * Health check for container platforms (Fly/Render/ECS) and uptime monitors.
 * Liveness is always 200; the `checks` block doubles as a lightweight readiness
 * signal (which optional dependencies are wired) without failing the probe — the
 * app runs fully in mock mode, so nothing here is a hard dependency.
 */
export function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'aureon-health',
    time: new Date().toISOString(),
    uptimeSec: Math.round((Date.now() - startedAt) / 1000),
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'dev',
    checks: {
      auth: !!process.env.AUTH_SECRET, // owner login enabled
      model: !!(process.env.ANTHROPIC_API_KEY || process.env.MARI_API_URL), // live Mari brain
    },
  });
}

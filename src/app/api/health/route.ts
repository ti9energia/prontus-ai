import { NextResponse } from 'next/server';
import { config } from '@/lib/config';

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
    service: 'auronis-health',
    time: new Date().toISOString(),
    uptimeSec: Math.round((Date.now() - startedAt) / 1000),
    version: config.runtime.commitSha?.slice(0, 7) ?? 'dev',
    checks: {
      auth: !!config.auth.secret, // owner login enabled
      model: !!(config.ai.anthropicApiKey || config.ai.mariApiUrl), // live Mari brain
    },
  });
}

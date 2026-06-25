/**
 * Server instrumentation (Next.js). Runs once at server boot. We use it to install
 * last-resort handlers that log otherwise-invisible crashes as structured JSON, so
 * production failures leave a trace even before an external APM is wired. This is the
 * seam where a real collector (Sentry/OpenTelemetry) should be initialised later.
 */
export async function register() {
  // Only the Node.js runtime has process-level hooks; the edge runtime skips this.
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const g = globalThis as unknown as { __aureonInstrumented__?: boolean };
  if (g.__aureonInstrumented__) return; // avoid duplicate listeners across HMR reloads
  g.__aureonInstrumented__ = true;

  const emit = (record: Record<string, unknown>) =>
    process.stderr.write(JSON.stringify({ at: new Date().toISOString(), ...record }) + '\n');

  process.on('unhandledRejection', (reason) => {
    emit({
      level: 'error',
      event: 'unhandledRejection',
      message: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
    });
  });
  process.on('uncaughtException', (err) => {
    emit({ level: 'error', event: 'uncaughtException', message: err.message, stack: err.stack });
  });

  emit({
    level: 'info',
    event: 'server.boot',
    env: process.env.NODE_ENV,
    hasAuthSecret: !!process.env.AUTH_SECRET,
    hasModel: !!(process.env.ANTHROPIC_API_KEY || process.env.MARI_API_URL),
  });
}

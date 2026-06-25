import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { POST } from '@/app/api/ai/action/route';
import { createSession, SESSION_COOKIE } from '@/lib/auth/session';
import { listEncounters, createGuideFromEncounter } from '@/lib/data/store';

// Mint real signed sessions for the authed paths.
const SECRET = 'test-secret-for-action-route-abcdef';
let prevSecret: string | undefined;
beforeAll(() => {
  prevSecret = process.env.AUTH_SECRET;
  process.env.AUTH_SECRET = SECRET;
});
afterAll(() => {
  if (prevSecret === undefined) delete process.env.AUTH_SECRET;
  else process.env.AUTH_SECRET = prevSecret;
});

function call(body: unknown, token?: string) {
  return POST(
    new Request('http://localhost/api/ai/action', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { cookie: `${SESSION_COOKIE}=${token}` } : {}),
      },
      body: JSON.stringify(body),
    }) as unknown as Parameters<typeof POST>[0],
  );
}
const doctor = () => createSession({ email: 'd@x.com', role: 'doctor', name: 'Doc' });

describe('POST /api/ai/action — Mari tools', () => {
  it('rejects unauthenticated callers', async () => {
    const res = await call({ tool: 'schedule.today' });
    expect(res.status).toBe(401);
  });

  it('rejects an unknown tool', async () => {
    const res = await call({ tool: 'nope.nope' }, await doctor());
    expect(res.status).toBe(400);
  });

  it('runs a read tool for an authenticated doctor', async () => {
    const res = await call({ tool: 'schedule.today', input: {} }, await doctor());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.ok).toBe(true);
    expect(typeof body.data.data.total).toBe('number');
  });

  it('runs the pre-denial check on a generated guide', async () => {
    const enc = listEncounters()[0];
    const g = createGuideFromEncounter(enc.id);
    const res = await call({ tool: 'glosa.check', input: { guideId: g.id } }, await doctor());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(typeof body.data.data.score).toBe('number');
    expect(Array.isArray(body.data.data.issues)).toBe(true);
  });

  it('requires confirmation before a state-changing tool runs', async () => {
    const enc = listEncounters()[0];
    const g = createGuideFromEncounter(enc.id);
    const res = await call({ tool: 'tiss.submit', input: { guideId: g.id } }, await doctor());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe('confirm_required');
  });
});

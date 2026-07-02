import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/onboarding/route';
import { createSession, SESSION_COOKIE } from '@/lib/auth';
import { registerTenant, resetStore } from '@/lib/data';

const SECRET = 'test-secret-for-onboarding-route-abcdef';
let prevSecret: string | undefined;
beforeAll(() => {
  prevSecret = process.env.AUTH_SECRET;
  process.env.AUTH_SECRET = SECRET;
});
afterAll(() => {
  if (prevSecret === undefined) delete process.env.AUTH_SECRET;
  else process.env.AUTH_SECRET = prevSecret;
});
beforeEach(() => resetStore());

function getReq(token?: string) {
  return GET(
    new Request('http://localhost/api/onboarding', {
      headers: token ? { cookie: `${SESSION_COOKIE}=${token}` } : {},
    }) as unknown as Parameters<typeof GET>[0],
  );
}
function postReq(body: unknown, token?: string) {
  return POST(
    new Request('http://localhost/api/onboarding', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(token ? { cookie: `${SESSION_COOKIE}=${token}` } : {}) },
      body: JSON.stringify(body),
    }) as unknown as Parameters<typeof POST>[0],
  );
}

// registerTenant() doesn't itself enforce email uniqueness (that check lives
// in the signup ROUTE) — give every call a distinct email so two calls in the
// same test never collide into the same getUserByEmail() lookup.
let seq = 0;
async function signedUp() {
  const email = `caio${++seq}@onboard.com`;
  const { tenant, user } = registerTenant({ orgName: 'Clínica Onboard', name: 'Dr. Caio', email, passwordHash: 'h' });
  const token = await createSession({ email: user.email, role: 'doctor', name: user.name });
  return { tenant, token };
}

describe('GET/POST /api/onboarding', () => {
  it('GET rejects unauthenticated callers', async () => {
    expect((await getReq()).status).toBe(401);
  });

  it('GET starts fresh on the profile step for a newly signed-up org', async () => {
    const { token } = await signedUp();
    const json = await (await getReq(token)).json();
    expect(json.currentStep).toBe('profile');
    expect(json.completedSteps).toEqual([]);
  });

  it('POST advances the step, persists data, and is scoped to the caller org', async () => {
    const { token } = await signedUp();
    const r1 = await (await postReq({ step: 'profile', data: { clinicSize: '2-5' } }, token)).json();
    expect(r1.currentStep).toBe('specialty');
    expect(r1.data.clinicSize).toBe('2-5');

    const r2 = await (await postReq({ step: 'specialty', data: { specialtyKey: 'clinica' } }, token)).json();
    expect(r2.currentStep).toBe('team');

    // GET reflects the same server-persisted state (resumable)
    const fetched = await (await getReq(token)).json();
    expect(fetched.completedSteps).toEqual(['profile', 'specialty']);
  });

  it('reaching the last step returns currentStep: null', async () => {
    const { token } = await signedUp();
    await postReq({ step: 'profile' }, token);
    await postReq({ step: 'specialty' }, token);
    await postReq({ step: 'team' }, token);
    const final = await (await postReq({ step: 'tour' }, token)).json();
    expect(final.currentStep).toBeNull();
  });

  it('rejects an unknown step name', async () => {
    const { token } = await signedUp();
    const res = await postReq({ step: 'not-a-real-step' }, token);
    expect(res.status).toBe(400);
  });

  it('keeps two different orgs on independent progress', async () => {
    const a = await signedUp();
    const b = await signedUp();
    await postReq({ step: 'profile' }, a.token);

    const progressA = await (await getReq(a.token)).json();
    const progressB = await (await getReq(b.token)).json();
    expect(progressA.completedSteps).toEqual(['profile']);
    expect(progressB.completedSteps).toEqual([]);
  });
});

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { POST } from '@/app/api/auth/signup/route';
import { authenticate } from '@/lib/auth/server';
import { resetStore, getUserByEmail, listTenants } from '@/lib/data';

// Owner login isn't involved here, but AUTH_SECRET also gates whether a
// session created by signup is trusted in verifySession() paths elsewhere.
const SECRET = 'test-secret-for-signup-route-abcdef';
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

// The route's per-IP throttle is a module-level Map that outlives each `it()`
// — give every test its own fake IP so they can't rate-limit one another
// (the dedicated throttle test below deliberately reuses one IP).
let ipSeq = 0;
function call(body: unknown, ip = `10.0.0.${++ipSeq}`) {
  return POST(
    new Request('http://localhost/api/auth/signup', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }) as unknown as Parameters<typeof POST>[0],
  );
}

const validBody = {
  orgName: 'Clínica Boa Vista',
  name: 'Dra. Camila Rocha',
  email: 'camila@boavista.com.br',
  password: 'senha-bem-forte-123',
};

describe('POST /api/auth/signup', () => {
  it('creates a real tenant + user, sets a session cookie, and returns 200', async () => {
    const res = await call(validBody);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.role).toBe('doctor');
    expect(json.orgId).toMatch(/^ten_/);
    expect(res.headers.get('set-cookie')).toContain('auronis_session=');

    const user = getUserByEmail(validBody.email);
    expect(user?.name).toBe('Dra. Camila Rocha');
    expect(user?.orgId).toBe(json.orgId);
    expect(listTenants().some((t) => t.id === json.orgId)).toBe(true);
  });

  it('the newly created account can immediately log in for real (proves the auth extension end-to-end)', async () => {
    await call(validBody);
    const identity = authenticate(validBody.email, validBody.password);
    expect(identity).not.toBeNull();
    expect(identity?.name).toBe('Dra. Camila Rocha');
    expect(identity?.role).toBe('doctor');
  });

  it('rejects the wrong password for a freshly signed-up account', async () => {
    await call(validBody);
    expect(authenticate(validBody.email, 'wrong-password-entirely')).toBeNull();
  });

  it('rejects a duplicate email with 409 EMAIL_TAKEN', async () => {
    await call(validBody);
    const res = await call({ ...validBody, orgName: 'Outra clínica' });
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error.code).toBe('EMAIL_TAKEN');
    // no second tenant was created for the duplicate attempt
    expect(listTenants().filter((t) => t.name === 'Outra clínica')).toHaveLength(0);
  });

  it('rejects a short password with 400 INVALID_INPUT + fieldErrors', async () => {
    const res = await call({ ...validBody, email: 'other@x.com', password: 'short' });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe('INVALID_INPUT');
    expect(json.fieldErrors.password).toBeTruthy();
  });

  it('rejects an invalid email with 400', async () => {
    const res = await call({ ...validBody, email: 'not-an-email' });
    expect(res.status).toBe(400);
  });

  it('treats a malformed JSON body as invalid input, not a crash', async () => {
    const res = await call('{ not valid json');
    expect(res.status).toBe(400);
  });

  it('rate-limits repeated attempts from the same IP', async () => {
    const ip = '203.0.113.9';
    for (let i = 0; i < 5; i++) {
      await call({ ...validBody, email: `person${i}@x.com` }, ip);
    }
    const res = await call({ ...validBody, email: 'oneMore@x.com' }, ip);
    expect(res.status).toBe(429);
  });
});

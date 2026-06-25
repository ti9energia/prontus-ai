import { describe, it, expect, afterEach } from 'vitest';
import { createSession, verifySession } from '@/lib/auth/session';

const original = process.env.AUTH_SECRET;
afterEach(() => {
  if (original === undefined) delete process.env.AUTH_SECRET;
  else process.env.AUTH_SECRET = original;
});

describe('session tokens (HMAC) — security', () => {
  it('round-trips a doctor session', async () => {
    const token = await createSession({ email: 'd@x.com', role: 'doctor', name: 'Doc' });
    const payload = await verifySession(token);
    expect(payload?.role).toBe('doctor');
    expect(payload?.sub).toBe('d@x.com');
  });

  it('rejects a tampered signature', async () => {
    const token = await createSession({ email: 'd@x.com', role: 'doctor', name: 'Doc' });
    const [body, sig] = token.split('.');
    const tampered = `${body}.${sig.slice(1)}${sig[0] === 'A' ? 'B' : 'A'}`;
    expect(await verifySession(tampered)).toBeNull();
  });

  it('rejects garbage and empty tokens', async () => {
    expect(await verifySession('')).toBeNull();
    expect(await verifySession('not-a-token')).toBeNull();
    expect(await verifySession(undefined)).toBeNull();
  });

  it('rejects an expired session', async () => {
    const token = await createSession({ email: 'd@x.com', role: 'doctor', name: 'Doc', ttl: -10 });
    expect(await verifySession(token)).toBeNull();
  });

  it('rejects owner sessions when no strong secret is configured (fail-closed)', async () => {
    delete process.env.AUTH_SECRET;
    const token = await createSession({ email: 'o@x.com', role: 'owner', name: 'Owner' });
    expect(await verifySession(token)).toBeNull();
  });

  it('honors owner sessions only with a strong secret', async () => {
    process.env.AUTH_SECRET = 'a-real-strong-secret-value-123456';
    const token = await createSession({ email: 'o@x.com', role: 'owner', name: 'Owner' });
    const payload = await verifySession(token);
    expect(payload?.role).toBe('owner');
  });
});
